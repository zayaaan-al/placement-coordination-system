const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token. User not found or inactive.' });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

/**
 * Authorization middleware to check user roles
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without authentication
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication on token errors
    next();
  }
};

/**
 * Middleware to check if user owns the resource or has admin privileges
 */
const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    // Coordinators can access all resources
    if (req.user.role === 'coordinator') {
      return next();
    }
    
    // Check if user owns the resource
    const resourceUserId = req.params.userId || req.body[resourceUserIdField] || req.params.id;
    
    if (req.user._id.toString() !== resourceUserId) {
      return res.status(403).json({ error: 'Access denied. You can only access your own resources.' });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkOwnership
};
