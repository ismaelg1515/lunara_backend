const firebaseService = require('../services/firebase');
const { formatErrorResponse } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Middleware to authenticate Firebase users
 * Verifies Firebase ID token and extracts user information
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatErrorResponse('Firebase token required. Please include Authorization header with Bearer token.', HTTP_STATUS.UNAUTHORIZED)
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatErrorResponse('Invalid token format. Token cannot be empty.', HTTP_STATUS.UNAUTHORIZED)
      );
    }

    // Verify Firebase ID token
    const decodedToken = await firebaseService.verifyIdToken(token);
    
    // Add user information to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      firebase_claims: decodedToken
    };
    
    // Log successful authentication (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ User authenticated: ${req.user.email} (${req.user.uid})`);
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Handle specific Firebase auth errors
    let errorMessage = 'Invalid or expired token';
    let statusCode = HTTP_STATUS.UNAUTHORIZED;
    
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token has expired. Please login again.';
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid token format. Please provide a valid Firebase token.';
    } else if (error.code === 'auth/project-not-found') {
      errorMessage = 'Firebase project configuration error';
      statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    }
    
    return res.status(statusCode).json(
      formatErrorResponse(errorMessage, statusCode)
    );
  }
};

/**
 * Middleware to check if user's email is verified
 * Use this for sensitive operations that require email verification
 */
const requireEmailVerification = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatErrorResponse('User not authenticated', HTTP_STATUS.UNAUTHORIZED)
      );
    }

    if (!req.user.email_verified) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        formatErrorResponse('Email verification required for this operation', HTTP_STATUS.FORBIDDEN)
      );
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Email verification check failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
};

/**
 * Middleware to add user context to requests (optional authentication)
 * Won't block the request if no token is provided, but will add user info if available
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user context
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token, but don't fail if invalid
    try {
      const decodedToken = await firebaseService.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
        firebase_claims: decodedToken
      };
    } catch (authError) {
      // Token invalid, but continue without user context
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error.message);
    req.user = null;
    next();
  }
};

/**
 * Middleware to extract and validate user ID from token
 * Ensures the user can only access their own data
 */
const validateUserAccess = (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatErrorResponse('User authentication required', HTTP_STATUS.UNAUTHORIZED)
      );
    }

    // Add user ID to request for easy access in route handlers
    req.userId = req.user.uid;
    
    next();
  } catch (error) {
    console.error('User access validation error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('User access validation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
};

module.exports = {
  authenticateUser,
  requireEmailVerification,
  optionalAuth,
  validateUserAccess
}; 