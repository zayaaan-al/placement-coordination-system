const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(error => error.message);
    error = {
      message: 'Validation Error',
      status: 400,
      errors: messages
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      message: `${field} already exists`,
      status: 400,
      field: field
    };
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = {
      message: 'Invalid ID format',
      status: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      status: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      status: 401
    };
  }

  // Joi validation errors
  if (err.isJoi) {
    error = {
      message: 'Validation Error',
      status: 400,
      errors: err.details.map(detail => detail.message)
    };
  }

  // Send error response
  res.status(error.status).json({
    success: false,
    error: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(error.field && { field: error.field }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
