const { validateRequiredFields, formatErrorResponse } = require('../utils/helpers');
const { HTTP_STATUS, INSIGHT_TYPES } = require('../utils/constants');

/**
 * Middleware to validate menstrual cycle data
 */
const validateCycleData = (req, res, next) => {
  try {
    const requiredFields = ['start_date'];
    const validation = validateRequiredFields(req.body, requiredFields);
    
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse(`Missing required fields: ${validation.missingFields.join(', ')}`, HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate date format
    const startDate = new Date(req.body.start_date);
    if (isNaN(startDate.getTime())) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Invalid start_date format. Please use ISO date format (YYYY-MM-DD)', HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate optional numeric fields
    if (req.body.cycle_length && (req.body.cycle_length < 21 || req.body.cycle_length > 35)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('cycle_length must be between 21 and 35 days', HTTP_STATUS.BAD_REQUEST)
      );
    }

    if (req.body.period_duration && (req.body.period_duration < 2 || req.body.period_duration > 8)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('period_duration must be between 2 and 8 days', HTTP_STATUS.BAD_REQUEST)
      );
    }

    next();
  } catch (error) {
    console.error('Cycle data validation error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Data validation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
};

/**
 * Middleware to validate nutrition log data
 */
const validateNutritionData = (req, res, next) => {
  try {
    const requiredFields = ['log_date', 'meal_type'];
    const validation = validateRequiredFields(req.body, requiredFields);
    
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse(`Missing required fields: ${validation.missingFields.join(', ')}`, HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate date format
    const logDate = new Date(req.body.log_date);
    if (isNaN(logDate.getTime())) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Invalid log_date format. Please use ISO date format', HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate meal type
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];
    if (!validMealTypes.includes(req.body.meal_type.toLowerCase())) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse(`meal_type must be one of: ${validMealTypes.join(', ')}`, HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate optional numeric fields
    if (req.body.calories && (req.body.calories < 0 || req.body.calories > 5000)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('calories must be between 0 and 5000', HTTP_STATUS.BAD_REQUEST)
      );
    }

    next();
  } catch (error) {
    console.error('Nutrition data validation error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Data validation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
};

/**
 * Middleware to validate fitness log data
 */
const validateFitnessData = (req, res, next) => {
  try {
    const requiredFields = ['activity_type', 'duration_minutes'];
    const validation = validateRequiredFields(req.body, requiredFields);
    
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse(`Missing required fields: ${validation.missingFields.join(', ')}`, HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate duration
    if (req.body.duration_minutes < 1 || req.body.duration_minutes > 480) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('duration_minutes must be between 1 and 480 minutes (8 hours)', HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate optional numeric fields
    if (req.body.calories_burned && (req.body.calories_burned < 0 || req.body.calories_burned > 2000)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('calories_burned must be between 0 and 2000', HTTP_STATUS.BAD_REQUEST)
      );
    }

    if (req.body.intensity_level && ![1, 2, 3, 4, 5].includes(req.body.intensity_level)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('intensity_level must be between 1 and 5', HTTP_STATUS.BAD_REQUEST)
      );
    }

    next();
  } catch (error) {
    console.error('Fitness data validation error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Data validation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
};

/**
 * Middleware to validate mental health log data
 */
const validateMentalHealthData = (req, res, next) => {
  try {
    const requiredFields = ['mood_rating'];
    const validation = validateRequiredFields(req.body, requiredFields);
    
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse(`Missing required fields: ${validation.missingFields.join(', ')}`, HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate mood rating
    if (req.body.mood_rating < 1 || req.body.mood_rating > 10) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('mood_rating must be between 1 and 10', HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate optional stress level
    if (req.body.stress_level && (req.body.stress_level < 1 || req.body.stress_level > 10)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('stress_level must be between 1 and 10', HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate optional energy level
    if (req.body.energy_level && (req.body.energy_level < 1 || req.body.energy_level > 10)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('energy_level must be between 1 and 10', HTTP_STATUS.BAD_REQUEST)
      );
    }

    next();
  } catch (error) {
    console.error('Mental health data validation error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Data validation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
};

/**
 * Middleware to validate AI insight request data
 */
const validateInsightRequest = (req, res, next) => {
  try {
    // Validate insight type if provided
    if (req.body.type && !Object.values(INSIGHT_TYPES).includes(req.body.type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse(`Invalid insight type. Must be one of: ${Object.values(INSIGHT_TYPES).join(', ')}`, HTTP_STATUS.BAD_REQUEST)
      );
    }

    next();
  } catch (error) {
    console.error('Insight request validation error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Data validation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
};

/**
 * Middleware to validate MongoDB ObjectId format
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      
      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          formatErrorResponse(`${paramName} parameter is required`, HTTP_STATUS.BAD_REQUEST)
        );
      }

      // Simple validation for Firestore document ID (alphanumeric and some special chars)
      const firestoreIdPattern = /^[a-zA-Z0-9_-]+$/;
      if (!firestoreIdPattern.test(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          formatErrorResponse(`Invalid ${paramName} format`, HTTP_STATUS.BAD_REQUEST)
        );
      }

      next();
    } catch (error) {
      console.error('ObjectId validation error:', error.message);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('ID validation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      );
    }
  };
};

/**
 * Middleware to validate query parameters
 */
const validateQueryParams = (req, res, next) => {
  try {
    // Validate limit parameter
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          formatErrorResponse('limit must be a number between 1 and 100', HTTP_STATUS.BAD_REQUEST)
        );
      }
      req.query.limit = limit;
    }

    // Validate date parameter
    if (req.query.date) {
      const date = new Date(req.query.date);
      if (isNaN(date.getTime())) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          formatErrorResponse('Invalid date format. Please use YYYY-MM-DD format', HTTP_STATUS.BAD_REQUEST)
        );
      }
    }

    next();
  } catch (error) {
    console.error('Query params validation error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Query parameter validation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
};

/**
 * General purpose request body sanitizer
 * Removes potentially dangerous fields and trims strings
 */
const sanitizeRequestBody = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      // Remove potentially dangerous fields
      const dangerousFields = ['_id', 'id', 'user_id', 'created_at', 'updated_at'];
      dangerousFields.forEach(field => {
        delete req.body[field];
      });

      // Trim string values
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }

    next();
  } catch (error) {
    console.error('Request body sanitization error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Request sanitization failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
};

module.exports = {
  validateCycleData,
  validateNutritionData,
  validateFitnessData,
  validateMentalHealthData,
  validateInsightRequest,
  validateObjectId,
  validateQueryParams,
  sanitizeRequestBody
}; 