const { formatErrorResponse } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Global error handler middleware
 * Catches all errors and returns consistent error responses
 */
const globalErrorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error('Global Error Handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation error: ' + err.message;
  } else if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid data format';
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Duplicate data error';
  } else if (err.message.includes('Firebase')) {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Authentication error';
  } else if (err.message) {
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json(
    formatErrorResponse(message, statusCode)
  );
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  res.status(HTTP_STATUS.NOT_FOUND).json(
    formatErrorResponse(message, HTTP_STATUS.NOT_FOUND)
  );
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request logger middleware
 * Logs all incoming requests in development mode
 */
const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Log request body for POST/PUT requests (excluding sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const sanitizedBody = { ...req.body };
      // Remove sensitive fields from logs
      delete sanitizedBody.password;
      delete sanitizedBody.token;
      console.log('Request Body:', sanitizedBody);
    }
  }
  next();
};

/**
 * Rate limiting error handler
 * Handles rate limiting errors with custom message
 */
const rateLimitHandler = (req, res, next) => {
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS || 429).json(
    formatErrorResponse('Too many requests. Please try again later.', 429)
  );
};

/**
 * CORS error handler
 * Handles CORS-related errors
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      formatErrorResponse('CORS policy violation', HTTP_STATUS.FORBIDDEN)
    );
  }
  next(err);
};

/**
 * Request timeout handler
 * Handles request timeout errors
 */
const timeoutHandler = (req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json(
        formatErrorResponse('Request timeout', 408)
      );
    }
  }, 30000); // 30 seconds timeout

  res.on('finish', () => {
    clearTimeout(timeout);
  });

  next();
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  asyncErrorHandler,
  requestLogger,
  rateLimitHandler,
  corsErrorHandler,
  timeoutHandler
}; 