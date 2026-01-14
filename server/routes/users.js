const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { authenticate, authorize, checkOwnership } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.object({
    first: Joi.string().trim().min(2).max(50),
    last: Joi.string().trim().min(2).max(50)
  }),
  profile: Joi.object({
    phone: Joi.string().trim(),
    avatarUrl: Joi.string().uri(),
    bio: Joi.string().trim().max(500)
  })
});

const updateStudentProfileSchema = Joi.object({
  program: Joi.string().trim(),
  batch: Joi.string().trim(),
  skills: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().required(),
      level: Joi.number().min(0).max(100).required(),
      tags: Joi.array().items(Joi.string().trim())
    })
  )
});

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    let userProfile = req.user.toJSON();

    // Add role-specific data
    if (req.user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: req.user._id })
        .populate('trainerRemarks.trainerId', 'name email');
      
      if (studentProfile) {
        userProfile.studentProfile = studentProfile;
      }
    }

    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', authenticate, async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Update user profile
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    if (value.name) {
      user.name = { ...user.name, ...value.name };
    }
    if (value.profile) {
      user.profile = { ...user.profile, ...value.profile };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/users/me/student-profile
 * @desc    Update student-specific profile data
 * @access  Private (Students only)
 */
router.put('/me/student-profile', authenticate, authorize(['student']), async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = updateStudentProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Find and update student profile
    const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    // Update fields
    if (value.program) studentProfile.program = value.program;
    if (value.batch) studentProfile.batch = value.batch;
    if (value.skills) {
      // Update skills with timestamps
      value.skills.forEach(skill => {
        skill.lastUpdated = new Date();
      });
      studentProfile.skills = value.skills;
    }

    await studentProfile.save();

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: studentProfile
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/users/id/:id
 * @desc    Get user profile by ID
 * @access  Private (Trainers and Coordinators)
 */
router.get('/id/:id', authenticate, authorize(['trainer', 'coordinator']), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user id'
      });
    }

    const user = await User.findById(req.params.id).select('-passwordHash -refreshTokens');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    let userProfile = user.toJSON();

    // Add role-specific data
    if (user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: user._id })
        .populate('trainerRemarks.trainerId', 'name email');
      
      if (studentProfile) {
        userProfile.studentProfile = studentProfile;
      }
    }

    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with filtering
 * @access  Private (Coordinators only)
 */
router.get('/', authenticate, authorize(['coordinator', 'admin']), async (req, res, next) => {
  try {
    const {
      role,
      page = 1,
      limit = 20,
      search,
      isActive
    } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { 'name.first': { $regex: search, $options: 'i' } },
        { 'name.last': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-passwordHash -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
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
 * @route   PUT /api/v1/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Coordinators only)
 */
router.put('/:id/status', authenticate, authorize(['coordinator', 'admin']), async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean value'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/users/coordinator/trainers
 * @desc    Get trainers with optional status filter (for coordinators)
 * @access  Private (Coordinators only)
 */
router.get('/coordinator/trainers',
  authenticate,
  authorize([ROLES.COORDINATOR]),
  async (req, res, next) => {
    try {
      const { status } = req.query;
      const validStatuses = ['pending', 'approved', 'rejected'];

      const query = {
        role: 'trainer'
      };

      if (status) {
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: 'Status must be one of pending, approved, or rejected'
          });
        }
        query.trainerStatus = status;
      }

      const trainers = await User.find(query).select('-passwordHash -refreshTokens');

      res.json({
        success: true,
        count: trainers.length,
        data: trainers
      });
    } catch (error) {
      next(error);
    }
  }
);

// Public: get approved & active trainers for student registration
router.get('/public/trainers', async (req, res, next) => {
  try {
    const trainers = await User.find({
      role: 'trainer',
      trainerStatus: 'approved',
      isActive: true
    }).select('name _id');

    res.json({
      success: true,
      data: trainers
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/users/pending-trainers
 * @desc    Get all pending trainer approvals (for coordinators)
 * @access  Private (Coordinators only)
 */
router.get('/pending-trainers', 
  authenticate, 
  authorize([ROLES.COORDINATOR]),
  async (req, res, next) => {
    try {
      const pendingTrainers = await User.find({
        role: 'trainer',
        trainerStatus: 'pending'
      }).select('-passwordHash -refreshTokens');

      res.json({
        success: true,
        count: pendingTrainers.length,
        data: pendingTrainers
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/v1/users/trainer-approval/:id
 * @desc    Approve or reject a trainer (for coordinators)
 * @access  Private (Coordinators only)
 */
router.put('/trainer-approval/:id', 
  authenticate, 
  authorize([ROLES.COORDINATOR]),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status must be either "approved" or "rejected"'
        });
      }

      const trainer = await User.findOneAndUpdate(
        { 
          _id: req.params.id, 
          role: 'trainer',
          trainerStatus: 'pending' // Only update if status is pending
        },
        { trainerStatus: status },
        { new: true, runValidators: true }
      );

      if (!trainer) {
        return res.status(404).json({
          success: false,
          error: 'Trainer not found or already processed'
        });
      }

      res.json({
        success: true,
        message: `Trainer ${status} successfully`,
        data: trainer
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
