const express = require('express');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TrainerEvaluation = require('../models/TrainerEvaluation');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

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

    // Build query for students assigned to this trainer and approved
    const query = {
      trainerId: req.params.id,
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

    const total = await StudentProfile.countDocuments(query);

    res.json({
      success: true,
      data: {
        students,
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

    // Get evaluation statistics
    const evaluationStats = await TrainerEvaluation.aggregate([
      { $match: { trainerId: req.params.id } },
      {
        $group: {
          _id: null,
          totalEvaluations: { $sum: 1 },
          avgOverallRating: { $avg: '$overallRating' },
          avgTechnicalSkills: { $avg: '$technicalSkills' },
          avgCommunication: { $avg: '$communicationSkills' },
          avgProblemSolving: { $avg: '$problemSolving' },
          avgTeamwork: { $avg: '$teamwork' },
          avgPunctuality: { $avg: '$punctuality' }
        }
      }
    ]);

    // Get monthly evaluation trend
    const monthlyTrend = await TrainerEvaluation.aggregate([
      { $match: { trainerId: req.params.id } },
      {
        $group: {
          _id: {
            year: { $year: '$evaluationDate' },
            month: { $month: '$evaluationDate' }
          },
          count: { $sum: 1 },
          avgRating: { $avg: '$overallRating' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Get skill evaluation distribution
    const skillStats = await TrainerEvaluation.aggregate([
      { $match: { trainerId: req.params.id } },
      { $unwind: '$skillsEvaluated' },
      {
        $group: {
          _id: '$skillsEvaluated.skillName',
          avgScore: { $avg: '$skillsEvaluated.score' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get students performance under this trainer
    const studentPerformance = await StudentProfile.aggregate([
      { $match: { 'trainerRemarks.trainerId': req.params.id } },
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
        evaluationStats: evaluationStats[0] || {},
        monthlyTrend,
        skillStats,
        studentPerformance: studentPerformance[0] || {}
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
