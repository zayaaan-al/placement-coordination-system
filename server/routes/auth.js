const express = require('express');
const Joi = require('joi');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { registrationLimiter, authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.object({
    first: Joi.string().trim().min(2).max(50).required(),
    last: Joi.string().trim().min(1).max(50).required()
  }).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
  // Only student and trainer can self-register; coordinator is seeded/admin-only
  role: Joi.string().valid('student', 'trainer').required(),
  profile: Joi.object({
    phone: Joi.string().trim().optional(),
    bio: Joi.string().trim().max(500).optional()
  }).optional(),
  trainerId: Joi.string().trim().optional(),
  // Student-specific fields (rollNo will be auto-generated if not provided)
  rollNo: Joi.string().trim().optional(),
  program: Joi.string().trim().when('role', {
    is: 'student',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  batch: Joi.string().trim().when('role', {
    is: 'student',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  skills: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().required(),
      level: Joi.number().min(0).max(100).required(),
      tags: Joi.array().items(Joi.string().trim()).optional()
    })
  ).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required()
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registrationLimiter, async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Register user
    const result = await authService.register(value);

    // Prepare response based on user role and approval status
    const response = {
      success: true,
      message: result.message || 'Registration successful!',
      data: {
        user: result.user
      }
    };

    // Add tokens if available (not for pending trainers)
    if (result.accessToken && result.refreshToken) {
      response.data.accessToken = result.accessToken;
      response.data.refreshToken = result.refreshToken;
    }

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Login user
    const result = await authService.login(value.email, value.password);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Refresh token
    const result = await authService.refreshToken(value.refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    if (error.message === 'Invalid refresh token') {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;
    
    await authService.logout(refreshToken, req.user._id);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    await authService.changePassword(
      req.user._id,
      value.currentPassword,
      value.newPassword
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user._id);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
