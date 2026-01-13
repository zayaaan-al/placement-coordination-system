const express = require('express');
const Joi = require('joi');
const StudentProfile = require('../models/StudentProfile');
const TrainerEvaluation = require('../models/TrainerEvaluation');
const StudentEvaluation = require('../models/StudentEvaluation');
const User = require('../models/User');
const PlacementRequest = require('../models/PlacementRequest');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { evaluationTypeOptions } = require('../utils/evaluationUtils');

const router = express.Router();

// Validation schemas
const addTestSchema = Joi.object({
  title: Joi.string().trim().required(),
  date: Joi.date().required(),
  score: Joi.number().min(0).required(),
  maxScore: Joi.number().min(1).default(100),
  subjectBreakdown: Joi.array().items(
    Joi.object({
      subject: Joi.string().trim().required(),
      marks: Joi.number().min(0).required()
    })
  ).optional()
});

/**
 * @route   PUT /api/v1/students/:id/remove
 * @desc    Soft remove (deactivate) a student account and remove from placement workflows
 * @access  Private (Coordinators/Admin only)
 */
router.put('/:id/remove', authenticate, authorize(['coordinator', 'admin']), async (req, res, next) => {
  try {
    const schema = Joi.object({
      remarks: Joi.string().trim().allow('', null).max(1000).optional(),
    });

    const { error, value } = schema.validate(req.body || {});
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const studentProfile = await StudentProfile.findById(req.params.id).populate('userId', 'name email isActive');
    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const user = await User.findById(studentProfile.userId?._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isActive === false) {
      return res.json({
        success: true,
        message: 'Student already inactive',
        data: { studentProfileId: studentProfile._id, userId: user._id },
      });
    }

    user.isActive = false;
    await user.save();

    studentProfile.placementStatus = 'removed';
    studentProfile.placementEligible = false;
    studentProfile.placementAdminRemarks = value.remarks || '';
    studentProfile.placementReviewedAt = new Date();
    await studentProfile.save();

    await PlacementRequest.deleteMany({
      studentProfileId: studentProfile._id,
      status: 'pending',
    });

    res.json({
      success: true,
      message: 'Student removed successfully',
      data: { studentProfileId: studentProfile._id, userId: user._id },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/students/:id/place
 * @desc    Mark a student as placed and store placement details
 * @access  Private (Coordinators/Admin only)
 */
router.put('/:id/place', authenticate, authorize(['coordinator', 'admin']), async (req, res, next) => {
  try {
    const schema = Joi.object({
      company: Joi.string().trim().allow('', null).max(200).optional(),
      role: Joi.string().trim().allow('', null).max(200).optional(),
      package: Joi.number().min(0).allow(null).optional(),
      date: Joi.date().allow(null).optional(),
    });

    const { error, value } = schema.validate(req.body || {});
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const student = await StudentProfile.findById(req.params.id).populate('userId', 'name email isActive');
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    if (student?.userId?.isActive === false) {
      return res.status(400).json({ success: false, error: 'Student is inactive' });
    }

    if (student.placementStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved students can be placed',
      });
    }

    student.placementStatus = 'placed';
    student.placementEligible = true;
    student.placementDetails = {
      ...(student.placementDetails || {}),
      company: value.company || '',
      position: value.role || '',
      salary: value.package ?? null,
      placedDate: value.date ?? new Date(),
    };

    await student.save();

    res.json({
      success: true,
      message: 'Student marked as placed',
      data: student,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/students/:id/remove-from-placement
 * @desc    Remove a student from placement (mark as removed)
 * @access  Private (Coordinators/Admin only)
 */
router.put('/:id/remove-from-placement', authenticate, authorize(['coordinator', 'admin']), async (req, res, next) => {
  try {
    const schema = Joi.object({
      remarks: Joi.string().trim().allow('', null).max(1000).optional(),
    });

    const { error, value } = schema.validate(req.body || {});
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const student = await StudentProfile.findById(req.params.id).populate('userId', 'name email isActive');
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    if (student?.userId?.isActive === false) {
      return res.status(400).json({ success: false, error: 'Student is inactive' });
    }

    if (student.placementStatus === 'placed') {
      return res.status(400).json({
        success: false,
        error: 'Placed students cannot be removed from placement',
      });
    }

    student.placementStatus = 'removed';
    student.placementEligible = false;
    student.placementAdminRemarks = value.remarks || '';
    student.placementReviewedAt = new Date();
    await student.save();

    res.json({
      success: true,
      message: 'Student removed from placement',
      data: student,
    });
  } catch (error) {
    next(error);
  }
});

const addEvaluationSchema = Joi.object({
  skillsEvaluated: Joi.array().items(
    Joi.object({
      skillName: Joi.string().trim().required(),
      score: Joi.number().min(0).max(100).required(),
      remark: Joi.string().trim().optional()
    })
  ).required(),
  overallRating: Joi.number().min(1).max(5).required(),
  generalFeedback: Joi.string().trim().max(1000).optional(),
  technicalSkills: Joi.number().min(1).max(5).optional(),
  communicationSkills: Joi.number().min(1).max(5).optional(),
  problemSolving: Joi.number().min(1).max(5).optional(),
  teamwork: Joi.number().min(1).max(5).optional(),
  punctuality: Joi.number().min(1).max(5).optional()
});

const addRemarkSchema = Joi.object({
  remark: Joi.string().trim().required(),
  rating: Joi.number().min(1).max(5).required()
});

const approveStudentSchema = Joi.object({
  approved: Joi.boolean().required(),
  remarks: Joi.string().trim().optional()
});

/**
 * @route   GET /api/v1/students/me/performance
 * @desc    Get evaluations for the logged-in student (grouped by year/month)
 * @access  Private (Students only)
 */
router.get('/me/performance', authenticate, authorize(['student']), async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ userId: req.user._id })
      .populate('trainerId', 'name email');

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    const evaluations = await StudentEvaluation.find({ studentUserId: req.user._id })
      .sort({ periodStart: -1, createdAt: -1 })
      .select('-__v');

    const groupedByType = evaluationTypeOptions.reduce((acc, type) => {
      acc[type] = evaluations.filter(evaluation => evaluation.type === type);
      return acc;
    }, {});

    const latestByType = evaluationTypeOptions.reduce((acc, type) => {
      if (groupedByType[type]?.length) {
        acc[type] = groupedByType[type][0];
      }
      return acc;
    }, {});

    const weeklyEvaluations = evaluations.filter(evaluation => evaluation.frequency === 'weekly');
    const monthlyEvaluations = evaluations.filter(evaluation => evaluation.frequency === 'monthly');

    // Group evaluations by year -> month for easier client consumption
    const groupedByYearMonth = {};

    evaluations.forEach((evaluation) => {
      const periodStart = evaluation.periodStart || evaluation.recordedDate || evaluation.createdAt;
      if (!periodStart) return;

      const date = new Date(periodStart);
      const year = date.getUTCFullYear();
      const monthIndex = date.getUTCMonth(); // 0-based
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      if (!groupedByYearMonth[year]) {
        groupedByYearMonth[year] = {
          year,
          months: {}
        };
      }

      if (!groupedByYearMonth[year].months[monthKey]) {
        groupedByYearMonth[year].months[monthKey] = {
          monthKey,
          monthIndex,
          label: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
          weeklyEntries: [],
          springMeet: null,
          sprintMeet: null,
          stats: {
            averagePercentage: null,
            perTypeAverages: {},
            lastUpdated: null
          }
        };
      }

      const monthBucket = groupedByYearMonth[year].months[monthKey];

      const isSpringMeet = evaluation.type === 'spring_meet';
      const percentage = evaluation.maxScore
        ? (evaluation.score / evaluation.maxScore) * 100
        : null;

      const baseEntry = {
        _id: evaluation._id,
        type: evaluation.type,
        frequency: evaluation.frequency,
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        periodLabel: evaluation.periodLabel,
        periodStart: evaluation.periodStart,
        periodEnd: evaluation.periodEnd,
        recordedDate: evaluation.recordedDate,
        percentage,
        notes: evaluation.notes,
        updatedAt: evaluation.updatedAt
      };

      if (isSpringMeet) {
        monthBucket.springMeet = baseEntry;
        monthBucket.sprintMeet = baseEntry;
      } else if (evaluation.frequency === 'weekly') {
        monthBucket.weeklyEntries.push(baseEntry);
      }

      // Track stats
      const currentLastUpdated = monthBucket.stats.lastUpdated
        ? new Date(monthBucket.stats.lastUpdated)
        : null;
      if (!currentLastUpdated || new Date(evaluation.updatedAt) > currentLastUpdated) {
        monthBucket.stats.lastUpdated = evaluation.updatedAt;
      }

      if (percentage !== null) {
        if (!monthBucket.stats._rawValues) {
          monthBucket.stats._rawValues = [];
        }
        monthBucket.stats._rawValues.push({ type: evaluation.type, percentage });
      }
    });

    // Finalize stats (average and per-type averages)
    Object.values(groupedByYearMonth).forEach((yearBucket) => {
      Object.values(yearBucket.months).forEach((monthBucket) => {
        const rawValues = monthBucket.stats._rawValues || [];
        if (rawValues.length) {
          const total = rawValues.reduce((sum, item) => sum + item.percentage, 0);
          monthBucket.stats.averagePercentage = total / rawValues.length;

          const byType = rawValues.reduce((acc, item) => {
            if (!acc[item.type]) {
              acc[item.type] = { total: 0, count: 0 };
            }
            acc[item.type].total += item.percentage;
            acc[item.type].count += 1;
            return acc;
          }, {});

          monthBucket.stats.perTypeAverages = Object.keys(byType).reduce((acc, type) => {
            const { total, count } = byType[type];
            acc[type] = total / count;
            return acc;
          }, {});
        }

        delete monthBucket.stats._rawValues;
      });
    });

    let overallPerformance = null;

    const monthBucketsWithAverage = [];
    Object.values(groupedByYearMonth).forEach((yearBucket) => {
      Object.values(yearBucket.months).forEach((monthBucket) => {
        if (monthBucket && monthBucket.stats && monthBucket.stats.averagePercentage != null) {
          monthBucketsWithAverage.push(monthBucket);
        }
      });
    });

    if (monthBucketsWithAverage.length) {
      const totalAverage = monthBucketsWithAverage.reduce(
        (sum, monthBucket) => sum + monthBucket.stats.averagePercentage,
        0
      );
      const averagePercentage = totalAverage / monthBucketsWithAverage.length;

      const perTypeAggregate = {};
      monthBucketsWithAverage.forEach((monthBucket) => {
        const perType = monthBucket.stats.perTypeAverages || {};
        Object.keys(perType).forEach((type) => {
          if (!perTypeAggregate[type]) {
            perTypeAggregate[type] = { total: 0, count: 0 };
          }
          perTypeAggregate[type].total += perType[type];
          perTypeAggregate[type].count += 1;
        });
      });

      const perTypeAverages = Object.keys(perTypeAggregate).reduce((acc, type) => {
        const { total, count } = perTypeAggregate[type];
        acc[type] = count ? total / count : null;
        return acc;
      }, {});

      const sortedByAverage = [...monthBucketsWithAverage].sort(
        (a, b) => (b.stats.averagePercentage || 0) - (a.stats.averagePercentage || 0)
      );
      const bestMonthBucket = sortedByAverage[0];
      const weakestMonthBucket = sortedByAverage[sortedByAverage.length - 1];

      const overallAvg = averagePercentage;
      let grade = null;
      if (overallAvg != null) {
        if (overallAvg >= 80) {
          grade = 'Excellent';
        } else if (overallAvg >= 60) {
          grade = 'Good';
        } else {
          grade = 'Needs Improvement';
        }
      }

      overallPerformance = {
        averagePercentage,
        perTypeAverages,
        bestMonth: bestMonthBucket
          ? {
              monthKey: bestMonthBucket.monthKey,
              label: bestMonthBucket.label,
              averagePercentage: bestMonthBucket.stats.averagePercentage,
            }
          : null,
        weakestMonth: weakestMonthBucket
          ? {
              monthKey: weakestMonthBucket.monthKey,
              label: weakestMonthBucket.label,
              averagePercentage: weakestMonthBucket.stats.averagePercentage,
            }
          : null,
        monthsCount: monthBucketsWithAverage.length,
        grade,
      };
    }

    res.json({
      success: true,
      data: {
        studentProfile,
        evaluations,
        groupedByType,
        latestByType,
        weeklyEvaluations,
        monthlyEvaluations,
        groupedByYearMonth,
        overallPerformance
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/students/me/performance/latest
 * @desc    Get latest hero performance metrics for the logged-in student
 * @access  Private (Students only)
 */
router.get('/me/performance/latest', authenticate, authorize(['student']), async (req, res, next) => {
  try {
    const evaluations = await StudentEvaluation.find({ studentUserId: req.user._id })
      .sort({ periodStart: -1, createdAt: -1 })
      .select('-__v');

    if (!evaluations.length) {
      return res.json({
        success: true,
        data: null
      });
    }

    // Use the most recent evaluation's month as the current period
    const latestEval = evaluations[0];
    const baseDate = latestEval.periodStart || latestEval.recordedDate || latestEval.createdAt;
    const base = new Date(baseDate);
    const targetYear = base.getUTCFullYear();
    const targetMonth = base.getUTCMonth();

    const inLatestMonth = evaluations.filter((evaluation) => {
      const d = new Date(evaluation.periodStart || evaluation.recordedDate || evaluation.createdAt);
      return d.getUTCFullYear() === targetYear && d.getUTCMonth() === targetMonth;
    });

    let totalPercentage = 0;
    let count = 0;
    const perType = {};
    let springMeet = null;
    let lastUpdated = null;

    inLatestMonth.forEach((evaluation) => {
      const percentage = evaluation.maxScore
        ? (evaluation.score / evaluation.maxScore) * 100
        : null;

      if (percentage !== null) {
        totalPercentage += percentage;
        count += 1;

        if (!perType[evaluation.type]) {
          perType[evaluation.type] = { total: 0, count: 0 };
        }
        perType[evaluation.type].total += percentage;
        perType[evaluation.type].count += 1;
      }

      if (!lastUpdated || new Date(evaluation.updatedAt) > lastUpdated) {
        lastUpdated = new Date(evaluation.updatedAt);
      }

      if (evaluation.type === 'spring_meet') {
        springMeet = {
          score: evaluation.score,
          maxScore: evaluation.maxScore,
          percentage,
          periodLabel: evaluation.periodLabel,
          recordedDate: evaluation.recordedDate
        };
      }
    });

    const averagePercentage = count ? totalPercentage / count : null;
    const perTypeAverages = Object.keys(perType).reduce((acc, type) => {
      const { total, count: c } = perType[type];
      acc[type] = c ? total / c : null;
      return acc;
    }, {});

    const hasSpringMeet = !!springMeet;
    const status = hasSpringMeet ? 'COMPLETED' : 'IN_PROGRESS';

    res.json({
      success: true,
      data: {
        period: {
          year: targetYear,
          monthIndex: targetMonth,
          label: base.toLocaleString('default', { month: 'long', year: 'numeric' })
        },
        averagePercentage,
        perTypeAverages,
        springMeet,
        status,
        lastUpdated
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/students/me/performance/alerts
 * @desc    Lightweight polling endpoint to detect recent evaluation updates
 * @access  Private (Students only)
 */
router.get('/me/performance/alerts', authenticate, authorize(['student']), async (req, res, next) => {
  try {
    const { since } = req.query;

    const baseFilter = { studentUserId: req.user._id };
    let hasUpdates = false;

    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        hasUpdates = !!(await StudentEvaluation.exists({
          ...baseFilter,
          updatedAt: { $gt: sinceDate }
        }));
      }
    }

    const latest = await StudentEvaluation.findOne(baseFilter)
      .sort({ updatedAt: -1 })
      .select('updatedAt');

    res.json({
      success: true,
      data: {
        hasUpdates,
        lastUpdated: latest ? latest.updatedAt : null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/students
 * @desc    Get all students with filtering and pagination
 * @access  Private (Trainers and Coordinators)
 */
router.get('/', authenticate, authorize(['trainer', 'coordinator', 'admin']), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      skills,
      batch,
      program,
      placementStatus,
      placementEligible,
      minAggregateScore,
      search,
      loggedInOnly,
      activeOnly,
      includeInactive
    } = req.query;

    // Build query
    const query = {};
    
    if (skills) {
      const skillsArray = skills.split(',');
      query['skills.name'] = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }
    
    if (batch) query.batch = batch;
    if (program) query.program = program;
    if (placementStatus) {
      const statuses = String(placementStatus)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length > 1) query.placementStatus = { $in: statuses };
      else if (statuses.length === 1) query.placementStatus = statuses[0];
    }
    if (placementEligible !== undefined) query.placementEligible = placementEligible === 'true';
    if (minAggregateScore) query.aggregateScore = { $gte: parseInt(minAggregateScore) };

    const shouldFilterLoggedIn = String(loggedInOnly) === 'true';
    const shouldFilterActive = includeInactive === 'true'
      ? false
      : activeOnly !== undefined
        ? String(activeOnly) === 'true'
        : req.user.role !== 'admin';

    // Add search filter if provided
    if (search) {
      const users = await User.find({
        $or: [
          { 'name.first': { $regex: search, $options: 'i' } },
          { 'name.last': { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ],
        role: 'student',
        ...(shouldFilterActive ? { isActive: true } : {}),
        ...(shouldFilterLoggedIn ? { lastLogin: { $ne: null } } : {}),
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      query.userId = { $in: userIds };
    }

    if (!search && (shouldFilterActive || shouldFilterLoggedIn)) {
      const users = await User.find({
        role: 'student',
        ...(shouldFilterActive ? { isActive: true } : {}),
        ...(shouldFilterLoggedIn ? { lastLogin: { $ne: null } } : {}),
      }).select('_id');

      const userIds = users.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    // Execute query with pagination (after all filters have been applied to `query`)
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const studentsQuery = StudentProfile.find(query)
      .populate('userId', 'name email profile isActive lastLogin')
      .populate('trainerRemarks.trainerId', 'name')
      .sort({ aggregateScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const students = await studentsQuery;
    const total = await StudentProfile.countDocuments(query);

    const studentProfileIds = students.map((s) => s._id).filter(Boolean);
    let overallScoreByProfileId = {};

    if (studentProfileIds.length > 0) {
      const rows = await StudentEvaluation.aggregate([
        {
          $match: {
            studentProfileId: { $in: studentProfileIds },
          },
        },
        {
          $group: {
            _id: '$studentProfileId',
            overallScore: {
              $avg: {
                $cond: [
                  { $gt: ['$maxScore', 0] },
                  { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] },
                  null,
                ],
              },
            },
          },
        },
      ]);

      overallScoreByProfileId = rows.reduce((acc, row) => {
        if (row?._id) {
          acc[String(row._id)] = typeof row.overallScore === 'number' ? row.overallScore : null;
        }
        return acc;
      }, {});
    }

    const studentsWithOverallScore = students.map((s) => {
      const computedOverallScore = overallScoreByProfileId[String(s._id)];
      const fallbackAggregate = typeof s.aggregateScore === 'number' ? s.aggregateScore : null;
      const overallScore = typeof computedOverallScore === 'number' ? computedOverallScore : fallbackAggregate;
      return {
        ...s.toObject(),
        overallScore,
      };
    });

    res.json({
      success: true,
      data: {
        students: studentsWithOverallScore,
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
 * @route   GET /api/v1/students/:id
 * @desc    Get student profile by ID
 * @access  Private (Trainers and Coordinators)
 */
router.get('/:id', authenticate, authorize(['trainer', 'coordinator']), async (req, res, next) => {
  try {
    const student = await StudentProfile.findById(req.params.id)
      .populate('userId', 'name email profile')
      .populate('trainerRemarks.trainerId', 'name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Get detailed evaluations
    const evaluations = await TrainerEvaluation.find({ studentId: student.userId })
      .populate('trainerId', 'name email')
      .sort({ evaluationDate: -1 });

    res.json({
      success: true,
      data: {
        student,
        evaluations
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/students/:id/tests
 * @desc    Add test result for student
 * @access  Private (Trainers only)
 */
router.post('/:id/tests', authenticate, authorize(['trainer']), async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = addTestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Find student
    const student = await StudentProfile.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Add test result
    const testData = {
      ...value,
      addedBy: req.user._id
    };

    await student.addTest(testData);

    // Create notification for student
    await Notification.createNotification({
      userId: student.userId,
      title: 'New Test Result Added',
      message: `Your test result for "${value.title}" has been added. Score: ${value.score}/${value.maxScore}`,
      type: 'test_result',
      relatedEntity: {
        type: 'test',
        id: student._id
      }
    });

    res.json({
      success: true,
      message: 'Test result added successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/students/:id/evaluations
 * @desc    Add evaluation for student
 * @access  Private (Trainers only)
 */
router.post('/:id/evaluations', authenticate, authorize(['trainer']), async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = addEvaluationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Find student
    const student = await StudentProfile.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Create trainer evaluation
    const evaluation = new TrainerEvaluation({
      trainerId: req.user._id,
      studentId: student.userId,
      ...value
    });

    await evaluation.save();

    // Add trainer remark to student profile
    const remarkData = {
      trainerId: req.user._id,
      remark: value.generalFeedback || `Overall rating: ${value.overallRating}/5`,
      rating: value.overallRating
    };

    await student.addTrainerRemark(remarkData);

    // Create notification for student
    await Notification.createNotification({
      userId: student.userId,
      title: 'New Evaluation Received',
      message: `You have received a new evaluation from ${req.user.name.first} ${req.user.name.last}`,
      type: 'evaluation',
      relatedEntity: {
        type: 'evaluation',
        id: evaluation._id
      }
    });

    res.json({
      success: true,
      message: 'Evaluation added successfully',
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/students/:id/remarks
 * @desc    Add trainer remark for student
 * @access  Private (Trainers only)
 */
router.post('/:id/remarks', authenticate, authorize(['trainer']), async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = addRemarkSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Find student
    const student = await StudentProfile.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Add trainer remark
    const remarkData = {
      trainerId: req.user._id,
      ...value
    };

    await student.addTrainerRemark(remarkData);

    // Create notification for student
    await Notification.createNotification({
      userId: student.userId,
      title: 'New Trainer Remark',
      message: `${req.user.name.first} ${req.user.name.last} has added a new remark`,
      type: 'evaluation',
      relatedEntity: {
        type: 'user',
        id: student.userId
      }
    });

    res.json({
      success: true,
      message: 'Remark added successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/students/:id/approve
 * @desc    Approve/disapprove student for placement
 * @access  Private (Coordinators only)
 */
router.put('/:id/approve', authenticate, authorize(['coordinator', 'admin']), async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = approveStudentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Find student
    const student = await StudentProfile.findById(req.params.id).populate('userId', 'name email');
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Update placement status
    const newStatus = value.approved ? 'approved' : 'not_approved';
    student.placementStatus = newStatus;
    
    // Recalculate eligibility
    student.calculateAggregateScore();
    
    await student.save();

    // Create notification for student
    const notificationMessage = value.approved 
      ? 'Congratulations! You have been approved for placement.'
      : 'Your placement approval status has been updated.';

    await Notification.createNotification({
      userId: student.userId,
      title: 'Placement Approval Update',
      message: value.remarks ? `${notificationMessage} Remarks: ${value.remarks}` : notificationMessage,
      type: 'approval',
      priority: value.approved ? 'high' : 'medium',
      relatedEntity: {
        type: 'user',
        id: student.userId
      }
    });

    res.json({
      success: true,
      message: `Student ${value.approved ? 'approved' : 'disapproved'} for placement`,
      data: student
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/students/stats/overview
 * @desc    Get students overview statistics
 * @access  Private (Coordinators only)
 */
router.get('/stats/overview', authenticate, authorize(['coordinator', 'admin']), async (req, res, next) => {
  try {
    const stats = await StudentProfile.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'approved'] }, 1, 0] }
          },
          placed: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'placed'] }, 1, 0] }
          },
          eligible: {
            $sum: { $cond: ['$placementEligible', 1, 0] }
          },
          avgAggregateScore: { $avg: '$aggregateScore' }
        }
      }
    ]);

    const batchStats = await StudentProfile.aggregate([
      {
        $group: {
          _id: '$batch',
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'approved'] }, 1, 0] }
          },
          placed: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'placed'] }, 1, 0] }
          },
          avgScore: { $avg: '$aggregateScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          approved: 0,
          placed: 0,
          eligible: 0,
          avgAggregateScore: 0
        },
        batchStats
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
