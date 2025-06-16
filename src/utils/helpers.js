const { CYCLE_PHASES, DEFAULTS } = require('./constants');

/**
 * Calculate cycle phase based on cycle data
 * @param {Object} cycle - Cycle data
 * @returns {string} - Current cycle phase
 */
const calculateCyclePhase = (cycle) => {
  if (!cycle || !cycle.start_date) return CYCLE_PHASES.UNKNOWN;
  
  const daysSinceStart = Math.floor((new Date() - new Date(cycle.start_date)) / (1000 * 60 * 60 * 24));
  const cycleLength = cycle.cycle_length || DEFAULTS.CYCLE_LENGTH;
  const periodDuration = cycle.period_duration || DEFAULTS.PERIOD_DURATION;
  
  if (daysSinceStart <= periodDuration) return CYCLE_PHASES.MENSTRUAL;
  if (daysSinceStart <= 13) return CYCLE_PHASES.FOLLICULAR;
  if (daysSinceStart <= 15) return CYCLE_PHASES.OVULATION;
  if (daysSinceStart <= cycleLength) return CYCLE_PHASES.LUTEAL;
  return CYCLE_PHASES.NEW_CYCLE;
};

/**
 * Calculate user age from birth date
 * @param {string} birthDate - Birth date in ISO format
 * @returns {number} - Age in years
 */
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted error response
 */
const formatErrorResponse = (message, statusCode = 500) => {
  return {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    statusCode
  };
};

/**
 * Format success response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Formatted success response
 */
const formatSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Validate required fields in object
 * @param {Object} obj - Object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - Validation result
 */
const validateRequiredFields = (obj, requiredFields) => {
  const missingFields = requiredFields.filter(field => 
    !obj.hasOwnProperty(field) || obj[field] === null || obj[field] === undefined || obj[field] === ''
  );
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Generate expiry date for AI insights
 * @param {number} days - Days from now
 * @returns {Date} - Expiry date
 */
const generateExpiryDate = (days = DEFAULTS.INSIGHT_EXPIRY_DAYS) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
};

module.exports = {
  calculateCyclePhase,
  calculateAge,
  formatErrorResponse,
  formatSuccessResponse,
  validateRequiredFields,
  generateExpiryDate
}; 