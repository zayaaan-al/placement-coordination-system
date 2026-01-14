const express = require('express');
const JobPosting = require('../models/JobPosting');
const StudentProfile = require('../models/StudentProfile');
const JobApplication = require('../models/JobApplication');
const StudentEvaluation = require('../models/StudentEvaluation');
const matchingService = require('../services/matchingService');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const ensurePlacementApproved = async (userId) => {
  const studentProfile = await StudentProfile.findOne({ userId });
  if (!studentProfile) {
    const err = new Error('Student profile not found');
    err.status = 400;
    throw err;
  }

  if (studentProfile.placementStatus !== 'approved') {
    const err = new Error('You are not eligible for placement opportunities yet');
    err.status = 403;
    throw err;
  }

  return studentProfile;
};

const getEffectiveAggregateScore = async (studentProfile) => {
  const evaluations = await StudentEvaluation.find({
    $or: [
      { studentUserId: studentProfile.userId },
      { studentProfileId: studentProfile._id },
    ],
  })
    .sort({ periodStart: -1, createdAt: -1 })
    .select('score maxScore periodStart recordedDate createdAt updatedAt');

  if (!evaluations.length) {
    return typeof studentProfile.aggregateScore === 'number' ? studentProfile.aggregateScore : 0;
  }

  const monthKeyToPercentages = new Map();
  evaluations.forEach((evaluation) => {
    const baseDate = evaluation.periodStart || evaluation.recordedDate || evaluation.createdAt;
    if (!baseDate) return;

    const d = new Date(baseDate);
    if (Number.isNaN(d.getTime())) return;

    const year = d.getUTCFullYear();
    const monthIndex = d.getUTCMonth();
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    const percentage = evaluation.maxScore ? (evaluation.score / evaluation.maxScore) * 100 : null;
    if (percentage == null) return;

    if (!monthKeyToPercentages.has(monthKey)) {
      monthKeyToPercentages.set(monthKey, []);
    }
    monthKeyToPercentages.get(monthKey).push(percentage);
  });

  const monthAverages = Array.from(monthKeyToPercentages.values())
    .map((values) => {
      if (!values.length) return null;
      const total = values.reduce((sum, v) => sum + v, 0);
      return total / values.length;
    })
    .filter((v) => typeof v === 'number');

  if (!monthAverages.length) {
    return typeof studentProfile.aggregateScore === 'number' ? studentProfile.aggregateScore : 0;
  }

  const total = monthAverages.reduce((sum, v) => sum + v, 0);
  const overallAveragePercentage = total / monthAverages.length;

  return overallAveragePercentage;
};

router.get('/', authenticate, authorize(['student']), async (req, res, next) => {
  try {
    await ensurePlacementApproved(req.user._id);

    const { page = 1, limit = 20, search, jobType, location, company } = req.query;

    const query = {
      status: 'open',
      isActive: true,
    };

    if (jobType) query.jobType = jobType;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (company) query['company.name'] = { $regex: company, $options: 'i' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await JobPosting.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobPosting.countDocuments(query);

    const jobIds = jobs.map((j) => j._id);
    const applications = await JobApplication.find({
      jobId: { $in: jobIds },
      studentId: req.user._id,
    }).select('jobId status appliedAt');

    const appByJobId = applications.reduce((acc, a) => {
      acc[String(a.jobId)] = a;
      return acc;
    }, {});

    const jobsWithApplyState = jobs.map((job) => {
      const app = appByJobId[String(job._id)];
      return {
        ...job.toObject(),
        hasApplied: !!app,
        applicationStatus: app?.status || null,
        appliedAt: app?.appliedAt || null,
      };
    });

    res.json({
      success: true,
      data: {
        jobs: jobsWithApplyState,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    if (error && error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.get('/:id', authenticate, authorize(['student']), async (req, res, next) => {
  try {
    const studentProfile = await ensurePlacementApproved(req.user._id);

    const job = await JobPosting.findById(req.params.id);
    if (!job || job.isActive === false) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const application = await JobApplication.findOne({
      jobId: job._id,
      studentId: req.user._id,
    }).select('status appliedAt');

    const effectiveAggregateScore = await getEffectiveAggregateScore(studentProfile);

    res.json({
      success: true,
      data: {
        ...job.toObject(),
        hasApplied: !!application,
        applicationStatus: application?.status || null,
        appliedAt: application?.appliedAt || null,
        effectiveAggregateScore,
      },
    });
  } catch (error) {
    if (error && error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.post('/:id/apply', authenticate, authorize(['student']), async (req, res, next) => {
  try {
    const studentProfile = await ensurePlacementApproved(req.user._id);

    const job = await JobPosting.findById(req.params.id);
    if (!job || job.isActive === false) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        code: 'JOB_NOT_OPEN',
        error: 'Job is not open for applications',
        data: {
          jobStatus: job.status,
        }
      });
    }

    const effectiveAggregateScore = await getEffectiveAggregateScore(studentProfile);
    if (effectiveAggregateScore < job.minAggregateScore) {
      return res.status(400).json({
        success: false,
        code: 'MIN_AGGREGATE_NOT_MET',
        error: 'You do not meet the minimum aggregate score requirement'
        ,
        data: {
          effectiveAggregateScore,
          minAggregateScore: job.minAggregateScore,
        }
      });
    }

    let matchResult = { totalScore: 0 };
    try {
      matchResult = matchingService.calculateMatchScore(
        studentProfile.toObject(),
        job,
        matchingService.DEFAULT_WEIGHTS
      );
    } catch (e) {
      // Match score must never block applying
      matchResult = { totalScore: 0 };
    }

    try {
      await JobApplication.create({
        jobId: job._id,
        studentId: req.user._id,
        studentProfileId: studentProfile._id,
        status: 'applied',
        appliedAt: new Date(),
      });
    } catch (e) {
      if (e && e.code === 11000) {
        return res.status(400).json({
          success: false,
          code: 'ALREADY_APPLIED',
          error: 'You have already applied for this job'
        });
      }
      throw e;
    }

    try {
      await job.addApplicant(req.user._id, matchResult.totalScore);
    } catch (e) {
      if (!String(e?.message || '').toLowerCase().includes('already applied')) {
        throw e;
      }
    }

    res.json({
      success: true,
      message: 'Successfully applied for this job',
      data: {
        jobId: job._id,
        matchScore: matchResult.totalScore,
      },
    });
  } catch (error) {
    if (error && error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
  }
});

module.exports = router;
