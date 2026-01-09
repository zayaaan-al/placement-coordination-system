const express = require('express');
const Joi = require('joi');
 const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TrainerEvaluation = require('../models/TrainerEvaluation');
const StudentEvaluation = require('../models/StudentEvaluation');
const { getPeriodMetadata, getTypeConfig } = require('../utils/evaluationUtils');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const evaluationTypeOptions = ['aptitude', 'logical', 'machine', 'spring_meet'];

const createEvaluationSchema = Joi.object({
  type: Joi.string().valid(...evaluationTypeOptions).required(),
  recordedDate: Joi.date().optional(),
  score: Joi.number().min(0).required(),
  maxScore: Joi.number().min(1).optional(),
  notes: Joi.string().trim().allow('', null).max(500).optional()
});

const updateEvaluationSchema = Joi.object({
  recordedDate: Joi.date().optional(),
  score: Joi.number().min(0).optional(),
  maxScore: Joi.number().min(1).optional(),
  notes: Joi.string().trim().allow('', null).max(500).optional()
}).min(1);

const ensureStudentAssignment = async (studentProfileId, trainerId) => {
  const studentProfile = await StudentProfile.findOne({
    _id: studentProfileId,
    trainerId,
    approvalStatus: 'approved'
  });
  return studentProfile;
};

router.get('/me/students/:studentProfileId/evaluations', authenticate, authorize('trainer'), async (req, res, next) => {
  try {
    const { studentProfileId } = req.params;
    const { type } = req.query;

    const studentProfile = await ensureStudentAssignment(studentProfileId, req.user._id);

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: 'Student not found or not assigned to you'
      });
    }

    const query = {
      studentProfileId: studentProfile._id
    };

    if (type) {
      if (!evaluationTypeOptions.includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid evaluation type filter'
        });
      }
      query.type = type;
    }

    const evaluations = await StudentEvaluation.find(query)
      .sort({ periodStart: -1, createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      data: evaluations
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/trainers/me/analytics/recent-students
 * @desc    Get latest evaluated students for the logged-in trainer
 * @access  Private (trainer only)
 */
router.get('/me/analytics/recent-students', authenticate, authorize('trainer'), async (req, res, next) => {
  try {
    const trainerId = req.user._id;

    // Aggregate latest month average percentage per student profile for this trainer
    const recentEvaluations = await StudentEvaluation.aggregate([
      { $match: { trainerId } },
      {
        $addFields: {
          monthKey: {
            $dateToString: { format: '%Y-%m', date: '$recordedDate' }
          }
        }
      },
      {
        $group: {
          _id: { studentProfileId: '$studentProfileId', monthKey: '$monthKey' },
          avgPercent: {
            $avg: {
              $cond: [
                { $gt: ['$maxScore', 0] },
                { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] },
                0
              ]
            }
          },
          totalScore: { $sum: '$score' },
          totalMaxScore: { $sum: '$maxScore' },
          notes: { $last: '$notes' },
          recordedDate: { $max: '$recordedDate' }
        }
      },
      { $sort: { '_id.studentProfileId': 1, recordedDate: -1 } },
      {
        $group: {
          _id: '$_id.studentProfileId',
          monthKey: { $first: '$_id.monthKey' },
          avgPercent: { $first: '$avgPercent' },
          score: { $first: '$totalScore' },
          maxScore: { $first: '$totalMaxScore' },
          notes: { $first: '$notes' },
          recordedDate: { $first: '$recordedDate' }
        }
      },
      { $sort: { recordedDate: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: '_id',
          as: 'studentProfile'
        }
      },
      { $unwind: '$studentProfile' },
      {
        $lookup: {
          from: 'users',
          localField: 'studentProfile.userId',
          foreignField: '_id',
          as: 'studentUser'
        }
      },
      { $unwind: '$studentUser' },
      {
        $project: {
          _id: 0,
          studentProfileId: '$_id',
          avgPercent: 1,
          score: 1,
          maxScore: 1,
          notes: 1,
          recordedDate: 1,
          monthKey: 1,
          'studentProfile.rollNo': 1,
          'studentProfile.batch': 1,
          'studentProfile.placementStatus': 1,
          'studentUser.name': 1,
          'studentUser.email': 1
        }
      }
    ]);

    res.json({
      success: true,
      data: recentEvaluations
    });
  } catch (error) {
    next(error);
  }
});

router.post('/me/students/:studentProfileId/evaluations', authenticate, authorize('trainer'), async (req, res, next) => {
  try {
    const { error, value } = createEvaluationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const { studentProfileId } = req.params;
    const studentProfile = await ensureStudentAssignment(studentProfileId, req.user._id);

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: 'Student not found or not assigned to you'
      });
    }

    const recordedDate = value.recordedDate ? new Date(value.recordedDate) : new Date();
    const config = getTypeConfig(value.type);
    const maxScore = value.maxScore || config.defaultMax;

    if (value.type === 'aptitude' && maxScore !== 25) {
      return res.status(400).json({
        success: false,
        error: 'Aptitude test must be out of 25 marks'
      });
    }

    if (value.score > maxScore) {
      return res.status(400).json({
        success: false,
        error: 'Score cannot exceed maximum score'
      });
    }

    const { periodStart, periodEnd, periodLabel } = getPeriodMetadata(value.type, recordedDate);

    const filter = {
      studentProfileId: studentProfile._id,
      type: value.type,
      periodStart
    };

    const update = {
      studentProfileId: studentProfile._id,
      studentUserId: studentProfile.userId,
      trainerId: req.user._id,
      type: value.type,
      frequency: config.frequency,
      recordedDate,
      periodStart,
      periodEnd,
      periodLabel,
      score: value.score,
      maxScore,
      notes: value.notes,
      lastUpdatedBy: req.user._id
    };

    const evaluation = await StudentEvaluation.findOneAndUpdate(
      filter,
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also create TrainerEvaluation for analytics
    if (evaluation) {
      const trainerEvaluationData = {
        trainerId: req.user._id,
        studentId: studentProfile.userId,
        evaluationDate: update.recordedDate,
        overallRating: value.type === 'spring_meet' ? Math.round((value.score / maxScore) * 5) : null,
        generalFeedback: value.notes,
        technicalSkills: value.type === 'aptitude' ? Math.round((value.score / maxScore) * 5) : null,
        communicationSkills: value.type === 'logical' ? Math.round((value.score / maxScore) * 5) : null,
        problemSolving: value.type === 'machine' ? Math.round((value.score / maxScore) * 5) : null,
        teamwork: value.type === 'spring_meet' ? Math.round((value.score / maxScore) * 5) : null,
        punctuality: 5 // Default value
      };

      await TrainerEvaluation.create(trainerEvaluationData);
    }

    res.status(201).json({
      success: true,
      message: 'Evaluation recorded successfully',
      data: evaluation
    });
  } catch (error) {
    console.error('=== EVALUATION SUBMIT ERROR ===');
    console.error('Error details:', error);
    console.error('Validation error:', error.details);
    console.error('Error message:', error.message);
    next(error);
  }
});

router.put('/me/evaluations/:evaluationId', authenticate, authorize('trainer'), async (req, res, next) => {
  try {
    const { error, value } = updateEvaluationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const evaluation = await StudentEvaluation.findById(req.params.evaluationId);

    if (!evaluation || evaluation.trainerId.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }

    if (value.score !== undefined) {
      const maxScore = value.maxScore || evaluation.maxScore;
      if (value.score > maxScore) {
        return res.status(400).json({
          success: false,
          error: 'Score cannot exceed maximum score'
        });
      }
    }

    if (evaluation.type === 'aptitude' && value.maxScore !== undefined && value.maxScore !== 25) {
      return res.status(400).json({
        success: false,
        error: 'Aptitude test must be out of 25 marks'
      });
    }

    if (value.recordedDate) {
      const recordedDate = new Date(value.recordedDate);
      const { periodStart, periodEnd, periodLabel } = getPeriodMetadata(evaluation.type, recordedDate);

      evaluation.recordedDate = recordedDate;
      evaluation.periodStart = periodStart;
      evaluation.periodEnd = periodEnd;
      evaluation.periodLabel = periodLabel;
    }

    if (value.score !== undefined) evaluation.score = value.score;
    if (value.maxScore !== undefined) evaluation.maxScore = value.maxScore;
    if (value.notes !== undefined) evaluation.notes = value.notes;
    evaluation.lastUpdatedBy = req.user._id;

    await evaluation.save();

    // Also update TrainerEvaluation for analytics
    const trainerEvaluationUpdate = {
      evaluationDate: evaluation.recordedDate,
      overallRating: evaluation.type === 'spring_meet' ? Math.round((evaluation.score / evaluation.maxScore) * 5) : null,
      generalFeedback: evaluation.notes,
      technicalSkills: evaluation.type === 'aptitude' ? Math.round((evaluation.score / evaluation.maxScore) * 5) : null,
      communicationSkills: evaluation.type === 'logical' ? Math.round((evaluation.score / evaluation.maxScore) * 5) : null,
      problemSolving: evaluation.type === 'machine' ? Math.round((evaluation.score / evaluation.maxScore) * 5) : null,
      teamwork: evaluation.type === 'spring_meet' ? Math.round((evaluation.score / evaluation.maxScore) * 5) : null
    };

    await TrainerEvaluation.findOneAndUpdate(
      { 
        trainerId: req.user._id,
        studentId: evaluation.studentProfileId
      },
      { $set: trainerEvaluationUpdate },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Evaluation updated successfully',
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/trainers/me/students/pending
 * @desc    Get pending student registration requests for the logged-in trainer
 * @access  Private (trainer only)
 */
router.get('/me/students/pending', authenticate, authorize('trainer'), async (req, res, next) => {
  try {
    const pendingStudents = await StudentProfile.find({
      trainerId: req.user._id,
      approvalStatus: 'pending'
    })
      .populate('userId', 'name email profile')
      .select('userId rollNo program batch approvalStatus createdAt');

    res.json({
      success: true,
      data: pendingStudents
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/trainers/me/students/:id/approval
 * @desc    Approve or reject a pending student assigned to the logged-in trainer
 * @access  Private (trainer only)
 */
router.put('/me/students/:id/approval', authenticate, authorize('trainer'), async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be approved or rejected.'
      });
    }

    const studentProfile = await StudentProfile.findOne({
      _id: req.params.id,
      trainerId: req.user._id
    });

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: 'Student not found or not assigned to you'
      });
    }

    studentProfile.approvalStatus = status;
    await studentProfile.save();

    res.json({
      success: true,
      message: `Student ${status} successfully`,
      data: studentProfile
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/trainers
 * @desc    Get all trainers
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search
    } = req.query;

    // Build query
    const query = { role: 'trainer', isActive: true };
    
    if (search) {
      query.$or = [
        { 'name.first': { $regex: search, $options: 'i' } },
        { 'name.last': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const trainers = await User.find(query)
      .select('-passwordHash -refreshTokens')
      .sort({ 'name.first': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get additional stats for each trainer
    const trainersWithStats = await Promise.all(
      trainers.map(async (trainer) => {
        const trainerObj = trainer.toObject();
        
        // Get evaluation count
        const evaluationCount = await TrainerEvaluation.countDocuments({
          trainerId: trainer._id
        });
        
        // Get student count (students with remarks from this trainer)
        const studentCount = await StudentProfile.countDocuments({
          'trainerRemarks.trainerId': trainer._id
        });
        
        trainerObj.stats = {
          evaluationCount,
          studentCount
        };
        
        return trainerObj;
      })
    );

    res.json({
      success: true,
      data: {
        trainers: trainersWithStats,
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
 * @route   GET /api/v1/trainers/:id
 * @desc    Get trainer profile by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const trainer = await User.findOne({
      _id: req.params.id,
      role: 'trainer'
    }).select('-passwordHash -refreshTokens');

    if (!trainer) {
      return res.status(404).json({
        success: false,
        error: 'Trainer not found'
      });
    }

    // Get trainer's evaluations
    const evaluations = await TrainerEvaluation.find({ trainerId: trainer._id })
      .populate('studentId', 'name email')
      .sort({ evaluationDate: -1 })
      .limit(10);

    // Get students with remarks from this trainer
    const studentsWithRemarks = await StudentProfile.find({
      'trainerRemarks.trainerId': trainer._id
    })
      .populate('userId', 'name email')
      .select('userId rollNo batch trainerRemarks aggregateScore')
      .limit(20);

    // Calculate trainer stats
    const totalEvaluations = await TrainerEvaluation.countDocuments({
      trainerId: trainer._id
    });

    const avgRating = await TrainerEvaluation.aggregate([
      { $match: { trainerId: trainer._id } },
      { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
    ]);

    const stats = {
      totalEvaluations,
      totalStudents: studentsWithRemarks.length,
      averageRating: avgRating.length > 0 ? Math.round(avgRating[0].avgRating * 10) / 10 : 0
    };

    res.json({
      success: true,
      data: {
        trainer: trainer.toObject(),
        recentEvaluations: evaluations,
        studentsWithRemarks,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/trainers/:id/students
 * @desc    Get students assigned to a trainer (approved only)
 * @access  Private (Trainers can see their own, Coordinators can see all)
 */
router.get('/:id/students', authenticate, async (req, res, next) => {
  try {
    // Check authorization
    if (req.user.role === 'trainer' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own students'
      });
    }

    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        error: 'Students cannot access this resource'
      });
    }

    const {
      page = 1,
      limit = 20,
      batch
    } = req.query;

    const trainerObjectId = mongoose.Types.ObjectId.isValid(req.params.id)
      ? new mongoose.Types.ObjectId(req.params.id)
      : null;

    if (!trainerObjectId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trainer id'
      });
    }

    // Build query for students assigned to this trainer and approved
    const query = {
      trainerId: trainerObjectId,
      approvalStatus: 'approved'
    };

    if (batch) query.batch = batch;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const students = await StudentProfile.find(query)
      .populate('userId', 'name email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const studentProfileIds = students.map((s) => s._id);

    const avgScores = studentProfileIds.length > 0
      ? await StudentEvaluation.aggregate([
          {
            $match: {
              trainerId: trainerObjectId,
              studentProfileId: { $in: studentProfileIds }
            }
          },
          {
            $addFields: {
              percent: {
                $cond: [
                  { $gt: [{ $ifNull: ['$maxScore', 0] }, 0] },
                  {
                    $multiply: [
                      { $divide: ['$score', { $ifNull: ['$maxScore', 0] }] },
                      100
                    ]
                  },
                  null
                ]
              }
            }
          },
          {
            $group: {
              _id: '$studentProfileId',
              avgScorePercentage: { $avg: '$percent' },
              totalEvaluations: { $sum: 1 }
            }
          }
        ])
      : [];

    const avgScoreMap = new Map(avgScores.map((r) => [String(r._id), r]));

    const studentsWithAvg = students.map((student) => {
      const stats = avgScoreMap.get(String(student._id));
      const obj = student.toObject();
      obj.avgScorePercentage = typeof stats?.avgScorePercentage === 'number'
        ? Math.round(stats.avgScorePercentage * 10) / 10
        : null;
      return obj;
    });

    const total = await StudentProfile.countDocuments(query);

    res.json({
      success: true,
      data: {
        students: studentsWithAvg,
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
 * @route   GET /api/v1/trainers/:id/analytics
 * @desc    Get trainer analytics and performance metrics
 * @access  Private (Trainers can see their own, Coordinators can see all)
 */
router.get('/:id/analytics', authenticate, async (req, res, next) => {
  try {
    // Check authorization
    if (req.user.role === 'trainer' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own analytics'
      });
    }

    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        error: 'Students cannot access this resource'
      });
    }

    const trainerObjectId = mongoose.Types.ObjectId.isValid(req.params.id)
      ? new mongoose.Types.ObjectId(req.params.id)
      : null;

    if (!trainerObjectId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trainer id'
      });
    }

    // Get evaluation statistics from StudentEvaluation
    const evaluationStatsArr = await StudentEvaluation.aggregate([
      { $match: { trainerId: trainerObjectId } },
      {
        $group: {
          _id: null,
          totalEvaluations: { $sum: 1 },
          avgScorePercentage: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } }
        }
      }
    ]);

    const baseStats = evaluationStatsArr[0] || {};

    // Compute evaluationsThisMonth and lastEvaluationAt separately for clarity
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0-based
    const monthStart = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 1, 0, 0, 0));

    const [evaluationsThisMonth, lastEvaluation] = await Promise.all([
      StudentEvaluation.countDocuments({
        trainerId: trainerObjectId,
        createdAt: { $gte: monthStart, $lt: monthEnd }
      }),
      StudentEvaluation.findOne({ trainerId: trainerObjectId })
        .sort({ createdAt: -1 })
        .select('createdAt')
    ]);

    // Get monthly evaluation trend based on creation time
    const monthlyTrend = await StudentEvaluation.aggregate([
      { $match: { trainerId: trainerObjectId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          avgRating: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Get skill evaluation distribution based on evaluation types
    const skillStats = await StudentEvaluation.aggregate([
      { $match: { trainerId: trainerObjectId } },
      {
        $group: {
          _id: '$type',
          avgScore: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get students performance under this trainer
    const studentPerformance = await StudentProfile.aggregate([
      { $match: { 'trainerRemarks.trainerId': trainerObjectId } },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          avgAggregateScore: { $avg: '$aggregateScore' },
          approvedStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'approved'] }, 1, 0] }
          },
          placedStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'placed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        evaluationStats: {
          totalEvaluations: baseStats.totalEvaluations || 0,
          avgScorePercentage: baseStats.avgScorePercentage || 0,
          evaluationsThisMonth: evaluationsThisMonth || 0,
          lastEvaluationAt: lastEvaluation?.createdAt || null
        },
        monthlyTrend,
        skillStats,
        studentPerformance: studentPerformance[0] || {}
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/trainers/me/students/analytics
 * @desc    Get aggregated student performance analytics for the logged-in trainer
 * @access  Private (trainer only)
 */
router.get('/me/students/analytics', authenticate, authorize('trainer'), async (req, res, next) => {
  try {
    const { batch, studentProfileId, month, threshold = 60 } = req.query;

    const studentQuery = {
      trainerId: req.user._id,
      approvalStatus: 'approved'
    };

    if (batch) {
      studentQuery.batch = batch;
    }

    if (studentProfileId) {
      studentQuery._id = studentProfileId;
    }

    const studentProfiles = await StudentProfile.find(studentQuery)
      .populate('userId', 'name email')
      .select('userId rollNo batch aggregateScore');

    if (studentProfiles.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: {},
          perStudent: [],
          monthlyTrend: [],
          typeBreakdown: [],
          insights: {
            mostImproved: null,
            studentsBelowThreshold: []
          }
        }
      });
    }

    const studentIds = studentProfiles.map((s) => s._id);

    const evalQuery = {
      trainerId: req.user._id,
      studentProfileId: { $in: studentIds }
    };

    if (month) {
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10) - 1;
      if (!isNaN(year) && !isNaN(monthNum)) {
        const from = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0));
        const to = new Date(Date.UTC(year, monthNum + 1, 0, 23, 59, 59));
        evalQuery.recordedDate = { $gte: from, $lte: to };
      }
    }

    const evaluations = await StudentEvaluation.find(evalQuery).lean();

    if (evaluations.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: {
            totalStudents: studentProfiles.length,
            totalEvaluations: 0,
            avgScore: 0
          },
          perStudent: studentProfiles.map((s) => ({
            studentProfileId: s._id,
            name: `${s.userId?.name?.first || ''} ${s.userId?.name?.last || ''}`.trim(),
            rollNo: s.rollNo,
            batch: s.batch,
            avgScore: 0,
            latestScore: null,
            trend: null
          })),
          monthlyTrend: [],
          typeBreakdown: [],
          insights: {
            mostImproved: null,
            studentsBelowThreshold: studentProfiles
              .filter((s) => typeof s.aggregateScore === 'number' && s.aggregateScore < Number(threshold))
              .map((s) => ({
                studentProfileId: s._id,
                name: `${s.userId?.name?.first || ''} ${s.userId?.name?.last || ''}`.trim(),
                rollNo: s.rollNo,
                batch: s.batch,
                aggregateScore: s.aggregateScore
              }))
          }
        }
      });
    }

    const studentMap = new Map();
    studentProfiles.forEach((s) => {
      studentMap.set(String(s._id), s);
    });

    const perStudentMap = new Map();
    const monthBuckets = new Map();
    const typeBuckets = new Map();

    evaluations.forEach((ev) => {
      const key = String(ev.studentProfileId);
      const profile = studentMap.get(key);
      if (!profile) return;

      const percent = ev.maxScore > 0 ? (ev.score / ev.maxScore) * 100 : 0;

      if (!perStudentMap.has(key)) {
        perStudentMap.set(key, {
          studentProfileId: profile._id,
          name: `${profile.userId?.name?.first || ''} ${profile.userId?.name?.last || ''}`.trim(),
          rollNo: profile.rollNo,
          batch: profile.batch,
          total: 0,
          count: 0,
          latestDate: null,
          latestScore: null,
          monthlyScores: new Map()
        });
      }

      const ps = perStudentMap.get(key);
      ps.total += percent;
      ps.count += 1;

      const recDate = ev.recordedDate ? new Date(ev.recordedDate) : null;
      if (recDate && (!ps.latestDate || recDate > ps.latestDate)) {
        ps.latestDate = recDate;
        ps.latestScore = percent;
      }

      if (recDate) {
        const mKey = `${recDate.getUTCFullYear()}-${String(recDate.getUTCMonth() + 1).padStart(2, '0')}`;
        if (!ps.monthlyScores.has(mKey)) {
          ps.monthlyScores.set(mKey, { total: 0, count: 0 });
        }
        const ms = ps.monthlyScores.get(mKey);
        ms.total += percent;
        ms.count += 1;

        if (!monthBuckets.has(mKey)) {
          monthBuckets.set(mKey, { total: 0, count: 0 });
        }
        const mb = monthBuckets.get(mKey);
        mb.total += percent;
        mb.count += 1;
      }

      const typeKey = ev.type;
      if (!typeBuckets.has(typeKey)) {
        typeBuckets.set(typeKey, { total: 0, count: 0 });
      }
      const tb = typeBuckets.get(typeKey);
      tb.total += percent;
      tb.count += 1;
    });

    const perStudent = Array.from(perStudentMap.values()).map((ps) => {
      const avgScore = ps.count > 0 ? ps.total / ps.count : 0;

      const months = Array.from(ps.monthlyScores.keys()).sort();
      let firstMonthAvg = null;
      let lastMonthAvg = null;
      if (months.length > 0) {
        const firstKey = months[0];
        const lastKey = months[months.length - 1];
        const fm = ps.monthlyScores.get(firstKey);
        const lm = ps.monthlyScores.get(lastKey);
        firstMonthAvg = fm.count > 0 ? fm.total / fm.count : null;
        lastMonthAvg = lm.count > 0 ? lm.total / lm.count : null;
      }

      const trend = firstMonthAvg !== null && lastMonthAvg !== null
        ? lastMonthAvg - firstMonthAvg
        : null;

      return {
        studentProfileId: ps.studentProfileId,
        name: ps.name,
        rollNo: ps.rollNo,
        batch: ps.batch,
        avgScore: Math.round(avgScore),
        latestScore: ps.latestScore !== null ? Math.round(ps.latestScore) : null,
        trend
      };
    });

    const totalEvaluations = evaluations.length;
    const totalScore = evaluations.reduce((sum, ev) => {
      const percent = ev.maxScore > 0 ? (ev.score / ev.maxScore) * 100 : 0;
      return sum + percent;
    }, 0);
    const avgScore = totalEvaluations > 0 ? totalScore / totalEvaluations : 0;

    const monthlyTrend = Array.from(monthBuckets.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([key, value]) => ({
        month: key,
        avgScore: value.count > 0 ? Math.round((value.total / value.count) * 10) / 10 : 0,
        evaluations: value.count
      }));

    const typeBreakdown = Array.from(typeBuckets.entries()).map(([type, value]) => ({
      type,
      avgScore: value.count > 0 ? Math.round((value.total / value.count) * 10) / 10 : 0,
      evaluations: value.count
    }));

    let mostImproved = null;
    perStudent.forEach((ps) => {
      if (ps.trend === null) return;
      if (!mostImproved || ps.trend > mostImproved.trend) {
        mostImproved = ps;
      }
    });

    const numericThreshold = Number(threshold) || 60;
    const studentsBelowThreshold = perStudent
      .filter((ps) => ps.avgScore < numericThreshold)
      .map((ps) => ({
        studentProfileId: ps.studentProfileId,
        name: ps.name,
        rollNo: ps.rollNo,
        batch: ps.batch,
        avgScore: ps.avgScore
      }));

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents: studentProfiles.length,
          totalEvaluations,
          avgScore: Math.round(avgScore)
        },
        perStudent,
        monthlyTrend,
        typeBreakdown,
        insights: {
          mostImproved,
          studentsBelowThreshold
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get trainer's recent evaluations
 * @route   GET /api/v1/trainers/me/evaluations/recent
 * @access  Private (Trainer)
 */
router.get('/me/evaluations/recent', authenticate, authorize('trainer'), async (req, res, next) => {
  try {
    const { limit = 5, month } = req.query;
    
    // Build query filter
    const filter = { trainerId: req.user._id };
    
    // If month is specified as 'current', filter for current month using UTC
    if (month === 'current') {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      
      // Use UTC date range for accurate month filtering
      const monthStart = new Date(Date.UTC(year, month, 1));
      const monthEnd = new Date(Date.UTC(year, month + 1, 1));
      
      filter.createdAt = {
        $gte: monthStart,
        $lt: monthEnd
      };
    }
    
    const evaluations = await StudentEvaluation.find(filter)
      .populate({
        path: 'studentProfileId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Transform data to match expected format
    const transformedEvaluations = evaluations.map(evaluation => ({
      _id: evaluation._id,
      type: evaluation.type,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      notes: evaluation.notes,
      createdAt: evaluation.createdAt,
      evaluationDate: evaluation.recordedDate,
      studentProfile: {
        _id: evaluation.studentProfileId._id,
        userId: evaluation.studentProfileId.userId,
        rollNo: evaluation.studentProfileId.rollNo,
        batch: evaluation.studentProfileId.batch
      }
    }));
    
    res.json({
      success: true,
      data: transformedEvaluations
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
