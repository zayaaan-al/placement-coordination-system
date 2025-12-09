const express = require('express');
const Joi = require('joi');
const JobPosting = require('../models/JobPosting');
const StudentProfile = require('../models/StudentProfile');
const Notification = require('../models/Notification');
const matchingService = require('../services/matchingService');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createJobSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  company: Joi.object({
    name: Joi.string().trim().required(),
    website: Joi.string().uri().optional(),
    logo: Joi.string().uri().optional()
  }).required(),
  requiredSkills: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().required(),
      minLevel: Joi.number().min(0).max(100).required()
    })
  ).min(1).required(),
  minAggregateScore: Joi.number().min(0).max(100).required(),
  positions: Joi.number().min(1).required(),
  location: Joi.string().trim().required(),
  salary: Joi.object({
    min: Joi.number().min(0).optional(),
    max: Joi.number().min(0).optional(),
    currency: Joi.string().default('INR')
  }).optional(),
  jobType: Joi.string().valid('full-time', 'part-time', 'internship', 'contract').default('full-time'),
  experience: Joi.object({
    min: Joi.number().min(0).default(0),
    max: Joi.number().min(0).optional()
  }).optional(),
  deadline: Joi.date().min('now').required(),
  eligibleBatches: Joi.array().items(Joi.string().trim()).optional(),
  eligiblePrograms: Joi.array().items(Joi.string().trim()).optional()
});

const updateJobSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().trim(),
  company: Joi.object({
    name: Joi.string().trim(),
    website: Joi.string().uri(),
    logo: Joi.string().uri()
  }),
  requiredSkills: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().required(),
      minLevel: Joi.number().min(0).max(100).required()
    })
  ),
  minAggregateScore: Joi.number().min(0).max(100),
  positions: Joi.number().min(1),
  location: Joi.string().trim(),
  salary: Joi.object({
    min: Joi.number().min(0),
    max: Joi.number().min(0),
    currency: Joi.string()
  }),
  jobType: Joi.string().valid('full-time', 'part-time', 'internship', 'contract'),
  experience: Joi.object({
    min: Joi.number().min(0),
    max: Joi.number().min(0)
  }),
  deadline: Joi.date().min('now'),
  eligibleBatches: Joi.array().items(Joi.string().trim()),
  eligiblePrograms: Joi.array().items(Joi.string().trim())
});

const shortlistStudentsSchema = Joi.object({
  studentIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
  remarks: Joi.string().trim().optional()
});

/**
 * @route   POST /api/v1/jobs
 * @desc    Create new job posting
 * @access  Private (Coordinators only)
 */
router.post('/', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Create job posting
    const job = new JobPosting({
      coordinatorId: req.user._id,
      ...value
    });

    await job.save();

    // Find eligible students and send notifications
    const eligibleStudents = await matchingService.findCandidatesForJob(job._id, { limit: 100 });
    
    // Send notifications to top candidates
    const topCandidates = eligibleStudents.slice(0, 20); // Notify top 20 candidates
    
    for (const candidate of topCandidates) {
      await Notification.createNotification({
        userId: candidate.student.userId._id,
        title: 'New Job Opportunity',
        message: `A new job "${job.title}" at ${job.company.name} matches your profile (${Math.round(candidate.matchScore)}% match)`,
        type: 'job_match',
        priority: candidate.matchScore > 80 ? 'high' : 'medium',
        relatedEntity: {
          type: 'job',
          id: job._id
        },
        actionButton: {
          text: 'View Job',
          url: `/jobs/${job._id}`
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: job
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/jobs
 * @desc    Get all job postings with filtering
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'open',
      jobType,
      location,
      company,
      minSalary,
      maxSalary,
      skills,
      search
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (jobType) query.jobType = jobType;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (company) query['company.name'] = { $regex: company, $options: 'i' };
    if (minSalary) query['salary.min'] = { $gte: parseInt(minSalary) };
    if (maxSalary) query['salary.max'] = { $lte: parseInt(maxSalary) };
    if (skills) {
      const skillsArray = skills.split(',');
      query['requiredSkills.name'] = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } }
      ];
    }

    // For students, only show jobs they're eligible for
    if (req.user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
      if (studentProfile) {
        // Filter by aggregate score
        query.minAggregateScore = { $lte: studentProfile.aggregateScore };
        
        // Filter by batch and program if specified in job
        if (studentProfile.batch) {
          query.$or = [
            { eligibleBatches: { $in: [studentProfile.batch] } },
            { eligibleBatches: { $size: 0 } },
            { eligibleBatches: { $exists: false } }
          ];
        }
      }
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await JobPosting.find(query)
      .populate('coordinatorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobPosting.countDocuments(query);

    // For students, calculate match scores
    let jobsWithScores = jobs;
    if (req.user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: req.user._id }).lean();
      if (studentProfile) {
        jobsWithScores = jobs.map(job => {
          const jobObj = job.toObject();
          const matchResult = matchingService.calculateMatchScore(studentProfile, jobObj, matchingService.DEFAULT_WEIGHTS);
          jobObj.matchScore = matchResult.totalScore;
          
          // Check if student has already applied
          jobObj.hasApplied = job.applicants.some(
            app => app.studentId.toString() === req.user._id.toString()
          );
          
          return jobObj;
        });
      }
    }

    res.json({
      success: true,
      data: {
        jobs: jobsWithScores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/jobs/:id
 * @desc    Get job posting by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const job = await JobPosting.findById(req.params.id)
      .populate('coordinatorId', 'name email')
      .populate('applicants.studentId', 'name email');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    let jobData = job.toObject();

    // For students, calculate match score and check application status
    if (req.user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: req.user._id }).lean();
      if (studentProfile) {
        const matchResult = matchingService.calculateMatchScore(
          studentProfile, 
          job, 
          matchingService.DEFAULT_WEIGHTS, 
          true // Include explanation
        );
        jobData.matchScore = matchResult.totalScore;
        jobData.matchExplanation = matchResult.explanation;
      }
      
      // Check if student has applied
      jobData.hasApplied = job.applicants.some(
        app => app.studentId._id.toString() === req.user._id.toString()
      );
      
      // Hide applicant details for students
      delete jobData.applicants;
    }

    // Increment view count
    await JobPosting.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      success: true,
      data: jobData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/jobs/:id
 * @desc    Update job posting
 * @access  Private (Coordinators only)
 */
router.put('/:id', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = updateJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const job = await JobPosting.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check ownership
    if (job.coordinatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own job postings'
      });
    }

    // Update job
    Object.assign(job, value);
    await job.save();

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/jobs/:id/matches
 * @desc    Get ranked list of candidate students for job
 * @access  Private (Coordinators only)
 */
router.get('/:id/matches', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    const {
      limit = 50,
      includeExplanation = false,
      skillWeight = 0.6,
      testWeight = 0.25,
      trainerWeight = 0.15
    } = req.query;

    const weights = {
      skills: parseFloat(skillWeight),
      tests: parseFloat(testWeight),
      trainer: parseFloat(trainerWeight)
    };

    const candidates = await matchingService.findCandidatesForJob(req.params.id, {
      weights,
      limit: parseInt(limit),
      includeExplanation: includeExplanation === 'true'
    });

    res.json({
      success: true,
      data: {
        candidates,
        weights,
        total: candidates.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/jobs/:id/shortlist
 * @desc    Shortlist selected students for job
 * @access  Private (Coordinators only)
 */
router.post('/:id/shortlist', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = shortlistStudentsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const job = await JobPosting.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check ownership
    if (job.coordinatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only manage your own job postings'
      });
    }

    // Update applicant statuses
    const shortlistedCount = 0;
    for (const studentId of value.studentIds) {
      const application = job.applicants.find(
        app => app.studentId.toString() === studentId
      );
      
      if (application) {
        application.status = 'shortlisted';
        shortlistedCount++;
      } else {
        // Add as new applicant with shortlisted status
        job.applicants.push({
          studentId,
          status: 'shortlisted',
          appliedDate: new Date()
        });
      }

      // Send notification to student
      await Notification.createNotification({
        userId: studentId,
        title: 'Shortlisted for Job',
        message: `Congratulations! You have been shortlisted for "${job.title}" at ${job.company.name}`,
        type: 'job_match',
        priority: 'high',
        relatedEntity: {
          type: 'job',
          id: job._id
        }
      });
    }

    await job.save();

    res.json({
      success: true,
      message: `${value.studentIds.length} students shortlisted successfully`,
      data: {
        jobId: job._id,
        shortlistedStudents: value.studentIds
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/jobs/:id/close
 * @desc    Close job posting
 * @access  Private (Coordinators only)
 */
router.put('/:id/close', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check ownership
    if (job.coordinatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only manage your own job postings'
      });
    }

    job.status = 'closed';
    await job.save();

    res.json({
      success: true,
      message: 'Job closed successfully',
      data: job
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/jobs/:id/apply
 * @desc    Apply for a job (students only)
 * @access  Private (Students only)
 */
router.post('/:id/apply', authenticate, authorize(['student']), async (req, res, next) => {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: 'Job is not open for applications'
      });
    }

    // Check if already applied
    const hasApplied = job.applicants.some(
      app => app.studentId.toString() === req.user._id.toString()
    );

    if (hasApplied) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied for this job'
      });
    }

    // Check eligibility
    const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return res.status(400).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    if (!studentProfile.placementEligible) {
      return res.status(400).json({
        success: false,
        error: 'You are not eligible for placement'
      });
    }

    if (studentProfile.aggregateScore < job.minAggregateScore) {
      return res.status(400).json({
        success: false,
        error: 'You do not meet the minimum aggregate score requirement'
      });
    }

    // Calculate match score
    const matchResult = matchingService.calculateMatchScore(
      studentProfile.toObject(),
      job,
      matchingService.DEFAULT_WEIGHTS
    );

    // Add application
    await job.addApplicant(req.user._id, matchResult.totalScore);

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        jobId: job._id,
        matchScore: matchResult.totalScore
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/jobs/:jobId/explain/:studentId
 * @desc    Get detailed explanation of match score
 * @access  Private (Coordinators only)
 */
router.get('/:jobId/explain/:studentId', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    const explanation = await matchingService.explainMatchScore(
      req.params.studentId,
      req.params.jobId
    );

    res.json({
      success: true,
      data: explanation
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
