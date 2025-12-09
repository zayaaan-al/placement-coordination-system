const express = require('express');
const Joi = require('joi');
const StudentProfile = require('../models/StudentProfile');
const TrainerEvaluation = require('../models/TrainerEvaluation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');

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
 * @route   GET /api/v1/students
 * @desc    Get all students with filtering and pagination
 * @access  Private (Trainers and Coordinators)
 */
router.get('/', authenticate, authorize(['trainer', 'coordinator']), async (req, res, next) => {
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
      search
    } = req.query;

    // Build query
    const query = {};
    
    if (skills) {
      const skillsArray = skills.split(',');
      query['skills.name'] = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }
    
    if (batch) query.batch = batch;
    if (program) query.program = program;
    if (placementStatus) query.placementStatus = placementStatus;
    if (placementEligible !== undefined) query.placementEligible = placementEligible === 'true';
    if (minAggregateScore) query.aggregateScore = { $gte: parseInt(minAggregateScore) };

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let studentsQuery = StudentProfile.find(query)
      .populate('userId', 'name email profile isActive')
      .populate('trainerRemarks.trainerId', 'name')
      .sort({ aggregateScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add search filter if provided
    if (search) {
      const users = await User.find({
        $or: [
          { 'name.first': { $regex: search, $options: 'i' } },
          { 'name.last': { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ],
        role: 'student'
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      query.userId = { $in: userIds };
    }

    const students = await studentsQuery;
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
router.put('/:id/approve', authenticate, authorize(['coordinator']), async (req, res, next) => {
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
router.get('/stats/overview', authenticate, authorize(['coordinator']), async (req, res, next) => {
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
