// 🌙 Lunara Backend - Application Constants

// Firestore Collections
const COLLECTIONS = {
  CYCLES: 'cycles',
  NUTRITION_LOGS: 'nutrition_logs',
  FITNESS_LOGS: 'fitness_logs',
  MENTAL_HEALTH_LOGS: 'mental_health_logs',
  AI_INSIGHTS: 'ai_insights',
  USER_PROFILES: 'user_profiles'
};

// AI Insight Types
const INSIGHT_TYPES = {
  GENERAL_HEALTH: 'general_health',
  CYCLE_PREDICTION: 'cycle_prediction',
  NUTRITION_ADVICE: 'nutrition_advice',
  FITNESS_SUGGESTION: 'fitness_suggestion',
  MOOD_ANALYSIS: 'mood_analysis'
};

// Cycle Phases
const CYCLE_PHASES = {
  MENSTRUAL: 'menstrual',
  FOLLICULAR: 'follicular',
  OVULATION: 'ovulation',
  LUTEAL: 'luteal',
  NEW_CYCLE: 'new_cycle',
  UNKNOWN: 'unknown'
};

// Default Values
const DEFAULTS = {
  CYCLE_LENGTH: 28,
  PERIOD_DURATION: 5,
  INSIGHT_EXPIRY_DAYS: 7,
  DEFAULT_LIMIT: 50,
  MAX_INSIGHT_TOKENS: 300
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

module.exports = {
  COLLECTIONS,
  INSIGHT_TYPES,
  CYCLE_PHASES,
  DEFAULTS,
  HTTP_STATUS
}; 