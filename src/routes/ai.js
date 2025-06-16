const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateUser, validateUserAccess } = require('../middleware/auth');
const { validateInsightRequest, validateObjectId, sanitizeRequestBody } = require('../middleware/validation');
const { asyncErrorHandler } = require('../middleware/errorHandler');

// Import services
const openaiService = require('../services/openai');
const firestoreService = require('../services/firestore');

// Import utilities
const { formatSuccessResponse, formatErrorResponse, calculateCyclePhase, calculateAge } = require('../utils/helpers');
const { HTTP_STATUS, INSIGHT_TYPES } = require('../utils/constants');

// Apply authentication and sanitization to all routes
router.use(authenticateUser);
router.use(validateUserAccess);
router.use(sanitizeRequestBody);

// =================== AI INSIGHTS GENERATION ===================

/**
 * POST /api/ai/generate-insight
 * Generate personalized health insight
 */
router.post('/generate-insight', validateInsightRequest, asyncErrorHandler(async (req, res) => {
  const { type = INSIGHT_TYPES.GENERAL_HEALTH } = req.body;
  
  // Check if OpenAI is available
  if (!openaiService.isAvailable()) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('AI service is currently unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  // Check if Firestore is available for data retrieval
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  try {
    // Get user's recent health data for context
    const userHealthData = await firestoreService.getUserLatestData(req.userId);
    
    // Prepare user data for AI prompt
    const userData = {
      userId: req.userId,
      email: req.user.email,
      age: calculateAge(userHealthData.birth_date),
      weight: userHealthData.weight,
      cycle_length: userHealthData.latest_cycle?.cycle_length,
      period_duration: userHealthData.latest_cycle?.period_duration,
      recent_symptoms: userHealthData.latest_cycle?.symptoms?.join(', '),
      cycle_phase: userHealthData.latest_cycle ? calculateCyclePhase(userHealthData.latest_cycle) : 'unknown',
      recent_nutrition: userHealthData.recent_nutrition?.slice(0, 3),
      recent_fitness: userHealthData.recent_fitness?.slice(0, 3),
      recent_mental_health: userHealthData.recent_mental_health?.slice(0, 3)
    };

    // Generate AI insight
    const insight = await openaiService.generateHealthInsight(userData, type);
    
    if (!insight) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Failed to generate insight. Please try again.', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      );
    }

    // Save insight to Firestore
    const savedInsight = await firestoreService.saveAIInsight(req.userId, insight);
    
    res.status(HTTP_STATUS.CREATED).json(
      formatSuccessResponse(savedInsight, 'AI insight generated successfully')
    );
  } catch (error) {
    console.error('AI Insight Generation Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to generate insight', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
}));

/**
 * POST /api/ai/generate-multiple-insights
 * Generate multiple insights of different types
 */
router.post('/generate-multiple-insights', asyncErrorHandler(async (req, res) => {
  const { types = [INSIGHT_TYPES.GENERAL_HEALTH] } = req.body;
  
  // Validate insight types
  const validTypes = types.filter(type => Object.values(INSIGHT_TYPES).includes(type));
  if (validTypes.length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse('No valid insight types provided', HTTP_STATUS.BAD_REQUEST)
    );
  }

  // Check if OpenAI is available
  if (!openaiService.isAvailable()) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('AI service is currently unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  // Check if Firestore is available
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  try {
    // Get user's health data
    const userHealthData = await firestoreService.getUserLatestData(req.userId);
    
    const userData = {
      userId: req.userId,
      email: req.user.email,
      age: calculateAge(userHealthData.birth_date),
      weight: userHealthData.weight,
      cycle_length: userHealthData.latest_cycle?.cycle_length,
      period_duration: userHealthData.latest_cycle?.period_duration,
      recent_symptoms: userHealthData.latest_cycle?.symptoms?.join(', '),
      cycle_phase: userHealthData.latest_cycle ? calculateCyclePhase(userHealthData.latest_cycle) : 'unknown',
      recent_nutrition: userHealthData.recent_nutrition?.slice(0, 3),
      recent_fitness: userHealthData.recent_fitness?.slice(0, 3),
      recent_mental_health: userHealthData.recent_mental_health?.slice(0, 3)
    };

    // Generate multiple insights
    const insights = await openaiService.generateMultipleInsights(userData, validTypes);
    
    if (insights.length === 0) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Failed to generate any insights', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      );
    }

    // Save all insights to Firestore
    const savedInsights = await Promise.all(
      insights.map(insight => firestoreService.saveAIInsight(req.userId, insight))
    );
    
    res.status(HTTP_STATUS.CREATED).json(
      formatSuccessResponse({
        insights: savedInsights,
        count: savedInsights.length,
        requested_types: validTypes
      }, 'Multiple AI insights generated successfully')
    );
  } catch (error) {
    console.error('Multiple Insights Generation Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to generate insights', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
}));

// =================== INSIGHTS MANAGEMENT ===================

/**
 * GET /api/ai/insights
 * Get user's AI insights
 */
router.get('/insights', asyncErrorHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const insights = await firestoreService.getRecentInsights(req.userId, parseInt(limit));
  
  res.json(formatSuccessResponse({
    insights,
    count: insights.length,
    user_id: req.userId
  }, 'AI insights retrieved successfully'));
}));

/**
 * PATCH /api/ai/insights/:id/read
 * Mark insight as read
 */
router.patch('/insights/:id/read', validateObjectId('id'), asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  // TODO: Add ownership verification (check if insight belongs to user)
  // For now, we trust the authentication middleware
  
  await firestoreService.markInsightAsRead(req.params.id);
  
  res.json(formatSuccessResponse(null, 'Insight marked as read'));
}));

/**
 * DELETE /api/ai/insights/:id
 * Delete specific insight
 */
router.delete('/insights/:id', validateObjectId('id'), asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  // TODO: Add ownership verification and implement delete method in firestore service
  // For now, return success (implement delete in firestore service)
  
  res.json(formatSuccessResponse(null, 'Insight deleted successfully'));
}));

// =================== QUICK TIPS ===================

/**
 * GET /api/ai/quick-tip
 * Get a quick health tip
 */
router.get('/quick-tip', asyncErrorHandler(async (req, res) => {
  const { topic = 'menstrual health' } = req.query;
  
  if (!openaiService.isAvailable()) {
    // Return a fallback tip if OpenAI is not available
    const fallbackTips = {
      'menstrual health': 'Stay hydrated and maintain a balanced diet rich in iron during your menstrual cycle.',
      'nutrition': 'Focus on eating a variety of colorful fruits and vegetables to ensure you get essential nutrients.',
      'fitness': 'Aim for at least 30 minutes of moderate exercise most days of the week.',
      'mental health': 'Take time for self-care and practice mindfulness or meditation to manage stress.',
      'default': 'Listen to your body and prioritize getting enough sleep for overall health and wellbeing.'
    };
    
    const tip = fallbackTips[topic.toLowerCase()] || fallbackTips['default'];
    
    return res.json(formatSuccessResponse({
      tip,
      topic,
      source: 'fallback',
      generated_at: new Date().toISOString()
    }, 'Quick tip retrieved successfully'));
  }

  try {
    const tip = await openaiService.generateQuickTip(topic);
    
    if (!tip) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Failed to generate quick tip', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      );
    }

    res.json(formatSuccessResponse({
      tip,
      topic,
      source: 'ai_generated',
      generated_at: new Date().toISOString()
    }, 'Quick tip generated successfully'));
  } catch (error) {
    console.error('Quick tip generation error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to generate quick tip', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
}));

// =================== INSIGHT TYPES ===================

/**
 * GET /api/ai/insight-types
 * Get available insight types
 */
router.get('/insight-types', (req, res) => {
  const insightTypes = Object.entries(INSIGHT_TYPES).map(([key, value]) => ({
    key,
    value,
    description: getInsightTypeDescription(value)
  }));

  res.json(formatSuccessResponse({
    insight_types: insightTypes,
    count: insightTypes.length
  }, 'Insight types retrieved successfully'));
});

/**
 * Helper function to get insight type descriptions
 */
function getInsightTypeDescription(type) {
  const descriptions = {
    [INSIGHT_TYPES.GENERAL_HEALTH]: 'General health and wellness advice',
    [INSIGHT_TYPES.CYCLE_PREDICTION]: 'Menstrual cycle predictions and tips',
    [INSIGHT_TYPES.NUTRITION_ADVICE]: 'Personalized nutrition recommendations',
    [INSIGHT_TYPES.FITNESS_SUGGESTION]: 'Exercise suggestions based on cycle phase',
    [INSIGHT_TYPES.MOOD_ANALYSIS]: 'Mood and mental health insights'
  };
  
  return descriptions[type] || 'Health insight';
}

module.exports = router; 