const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

class AuthService {
  /**
   * Generate JWT access token
   * @param {string} userId - User ID
   * @returns {string} JWT token
   */
  generateAccessToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  }

  /**
   * Generate JWT refresh token
   * @param {string} userId - User ID
   * @returns {string} Refresh token
   */
  generateRefreshToken(userId) {
    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('Refresh token secret is not configured');
    }

    return jwt.sign(
      { userId, type: 'refresh' },
      secret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} User and tokens
   */
  async register(userData) {
    const { name, email, password, role, ...profileData } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user with appropriate status
    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save middleware
      role,
      trainerStatus: role === 'trainer' ? 'pending' : undefined,
      profile: profileData.profile || {}
    });

    await user.save();

    // Create student profile if role is student
    if (role === 'student') {
      const studentProfile = new StudentProfile({
        userId: user._id,
        rollNo: profileData.rollNo || `STU${Date.now()}`,
        trainerId: profileData.trainerId || null,
        // approvalStatus defaults to 'pending' in schema
        program: profileData.program || '',
        batch: profileData.batch || '',
        skills: profileData.skills || []
      });
      await studentProfile.save();
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Store refresh token
    await user.addRefreshToken(refreshToken);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User and tokens
   */
  async login(email, password) {
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      throw new Error('Invalid email or password');
    }

    // Check if trainer is approved
    if (user.role === 'trainer' && user.trainerStatus !== 'approved') {
      throw new Error('Your account is pending approval from the coordinator');
    }

    // Check if student has been approved by assigned trainer
    if (user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: user._id });
      if (!studentProfile) {
        throw new Error('Student profile not found. Please contact support.');
      }

      if (studentProfile.approvalStatus === 'pending') {
        throw new Error('Your trainer has not approved your account yet. Please wait for approval.');
      }

      if (studentProfile.approvalStatus === 'rejected') {
        throw new Error('Your trainer has removed your access. Please contact your trainer for more details.');
      }

      if (studentProfile.approvalStatus !== 'approved') {
        throw new Error('Your account is not approved. Please contact support.');
      }
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Store refresh token
    await user.addRefreshToken(refreshToken);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive || !user.refreshTokens.includes(refreshToken)) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user._id);
      const newRefreshToken = this.generateRefreshToken(user._id);

      // Replace old refresh token with new one
      await user.removeRefreshToken(refreshToken);
      await user.addRefreshToken(newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user
   * @param {string} refreshToken - Refresh token to invalidate
   * @param {string} userId - User ID
   */
  async logout(refreshToken, userId) {
    const user = await User.findById(userId);
    if (user && refreshToken) {
      await user.removeRefreshToken(refreshToken);
    }
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    // Invalidate all refresh tokens for security
    user.refreshTokens = [];
    await user.save();
  }

  /**
   * Get user profile with role-specific data
   * @param {string} userId - User ID
   * @returns {Object} User profile
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId).select('-passwordHash -refreshTokens');
    if (!user) {
      throw new Error('User not found');
    }

    let profile = user.toJSON();

    // Add role-specific data
    if (user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId }).populate('trainerRemarks.trainerId', 'name');
      if (studentProfile) {
        profile.studentProfile = studentProfile;
      }
    }

    return profile;
  }
}

module.exports = new AuthService();
