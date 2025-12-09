const rateLimit = require('express-rate-limit');

// Handler for rate limit exceeded
const handler = (req, res, next, message) => {
  res.status(429).json({
    success: false,
    error: message
  });
};

// Rate limiting configuration
const createLimiter = (windowMs, max, errorMessage) => {
  return rateLimit({
    windowMs,
    max,
    handler: (req, res) => handler(req, res, null, errorMessage),
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Development-friendly rate limiters
const apiLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests per window
  'Too many requests from this IP, please try again later'
);

const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 login attempts per window
  'Too many login attempts, please try again later'
);

const registrationLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes (reduced from 1 hour)
  20, // 20 registration attempts per window (increased from 3)
  'Too many registration attempts, please try again later'
);

module.exports = {
  apiLimiter,
  authLimiter,
  registrationLimiter
};
