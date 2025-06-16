const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateUser, validateUserAccess } = require('../middleware/auth');
const { 
  validateCycleData, 
  validateNutritionData, 
  validateFitnessData, 
  validateMentalHealthData,
  validateObjectId,
  validateQueryParams,
  sanitizeRequestBody 
} = require('../middleware/validation');
const { asyncErrorHandler } = require('../middleware/errorHandler');

// Import services
const firestoreService = require('../services/firestore');

// Import utilities
const { formatSuccessResponse, formatErrorResponse, calculateCyclePhase } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

// Apply authentication and sanitization to all routes
router.use(authenticateUser);
router.use(validateUserAccess);
router.use(sanitizeRequestBody);

// =================== MENSTRUAL CYCLES ===================

/**
 * GET /api/health-data/cycles
 * Get user's menstrual cycles
 */
router.get('/cycles', validateQueryParams, asyncErrorHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const cycles = await firestoreService.getCycles(req.userId, limit);
  
  // Add cycle phase calculation to each cycle
  const cyclesWithPhase = cycles.map(cycle => ({
    ...cycle,
    current_phase: calculateCyclePhase(cycle)
  }));

  res.json(formatSuccessResponse({
    cycles: cyclesWithPhase,
    count: cyclesWithPhase.length,
    user_id: req.userId
  }, 'Cycles retrieved successfully'));
}));

/**
 * POST /api/health-data/cycles
 * Create new menstrual cycle
 */
router.post('/cycles', validateCycleData, asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const cycleData = {
    ...req.body,
    user_id: req.userId // Ensure user ID from token
  };

  const cycle = await firestoreService.saveCycle(req.userId, cycleData);
  
  // Add cycle phase to response
  cycle.current_phase = calculateCyclePhase(cycle);

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(cycle, 'Cycle created successfully')
  );
}));

/**
 * GET /api/health-data/cycles/:id
 * Get specific cycle by ID
 */
router.get('/cycles/:id', validateObjectId('id'), asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const cycle = await firestoreService.getCycleById(req.params.id);
  
  if (!cycle) {
    return res.status(HTTP_STATUS.NOT_FOUND).json(
      formatErrorResponse('Cycle not found', HTTP_STATUS.NOT_FOUND)
    );
  }

  // Verify cycle belongs to authenticated user
  if (cycle.user_id !== req.userId) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      formatErrorResponse('Access denied to this cycle', HTTP_STATUS.FORBIDDEN)
    );
  }

  // Add cycle phase
  cycle.current_phase = calculateCyclePhase(cycle);

  res.json(formatSuccessResponse(cycle, 'Cycle retrieved successfully'));
}));

/**
 * PUT /api/health-data/cycles/:id
 * Update specific cycle
 */
router.put('/cycles/:id', validateObjectId('id'), validateCycleData, asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  // Check if cycle exists and belongs to user
  const existingCycle = await firestoreService.getCycleById(req.params.id);
  
  if (!existingCycle) {
    return res.status(HTTP_STATUS.NOT_FOUND).json(
      formatErrorResponse('Cycle not found', HTTP_STATUS.NOT_FOUND)
    );
  }

  if (existingCycle.user_id !== req.userId) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      formatErrorResponse('Access denied to this cycle', HTTP_STATUS.FORBIDDEN)
    );
  }

  const updatedCycle = await firestoreService.updateCycle(req.params.id, req.body);
  updatedCycle.current_phase = calculateCyclePhase(updatedCycle);

  res.json(formatSuccessResponse(updatedCycle, 'Cycle updated successfully'));
}));

/**
 * DELETE /api/health-data/cycles/:id
 * Delete specific cycle
 */
router.delete('/cycles/:id', validateObjectId('id'), asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  // Check if cycle exists and belongs to user
  const existingCycle = await firestoreService.getCycleById(req.params.id);
  
  if (!existingCycle) {
    return res.status(HTTP_STATUS.NOT_FOUND).json(
      formatErrorResponse('Cycle not found', HTTP_STATUS.NOT_FOUND)
    );
  }

  if (existingCycle.user_id !== req.userId) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      formatErrorResponse('Access denied to this cycle', HTTP_STATUS.FORBIDDEN)
    );
  }

  await firestoreService.deleteCycle(req.params.id);

  res.json(formatSuccessResponse(null, 'Cycle deleted successfully'));
}));

// =================== NUTRITION LOGS ===================

/**
 * GET /api/health-data/nutrition
 * Get user's nutrition logs
 */
router.get('/nutrition', validateQueryParams, asyncErrorHandler(async (req, res) => {
  const { date, limit = 30 } = req.query;
  
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const nutritionLogs = await firestoreService.getNutritionLogs(req.userId, date, limit);

  res.json(formatSuccessResponse({
    nutrition_logs: nutritionLogs,
    count: nutritionLogs.length,
    date_filter: date || 'all',
    user_id: req.userId
  }, 'Nutrition logs retrieved successfully'));
}));

/**
 * POST /api/health-data/nutrition
 * Create new nutrition log
 */
router.post('/nutrition', validateNutritionData, asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const nutritionData = {
    ...req.body,
    user_id: req.userId,
    log_date: new Date(req.body.log_date)
  };

  const nutritionLog = await firestoreService.saveNutritionLog(req.userId, nutritionData);

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(nutritionLog, 'Nutrition log created successfully')
  );
}));

// =================== FITNESS LOGS ===================

/**
 * GET /api/health-data/fitness
 * Get user's fitness logs
 */
router.get('/fitness', validateQueryParams, asyncErrorHandler(async (req, res) => {
  const { limit = 30 } = req.query;
  
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const fitnessLogs = await firestoreService.getFitnessLogs(req.userId, limit);

  res.json(formatSuccessResponse({
    fitness_logs: fitnessLogs,
    count: fitnessLogs.length,
    user_id: req.userId
  }, 'Fitness logs retrieved successfully'));
}));

/**
 * POST /api/health-data/fitness
 * Create new fitness log
 */
router.post('/fitness', validateFitnessData, asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const fitnessData = {
    ...req.body,
    user_id: req.userId,
    logged_at: new Date()
  };

  const fitnessLog = await firestoreService.saveFitnessLog(req.userId, fitnessData);

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(fitnessLog, 'Fitness log created successfully')
  );
}));

// =================== MENTAL HEALTH LOGS ===================

/**
 * GET /api/health-data/mental-health
 * Get user's mental health logs
 */
router.get('/mental-health', validateQueryParams, asyncErrorHandler(async (req, res) => {
  const { limit = 30 } = req.query;
  
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const mentalHealthLogs = await firestoreService.getMentalHealthLogs(req.userId, limit);

  res.json(formatSuccessResponse({
    mental_health_logs: mentalHealthLogs,
    count: mentalHealthLogs.length,
    user_id: req.userId
  }, 'Mental health logs retrieved successfully'));
}));

/**
 * POST /api/health-data/mental-health
 * Create new mental health log
 */
router.post('/mental-health', validateMentalHealthData, asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const mentalHealthData = {
    ...req.body,
    user_id: req.userId,
    logged_at: new Date()
  };

  const mentalHealthLog = await firestoreService.saveMentalHealthLog(req.userId, mentalHealthData);

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(mentalHealthLog, 'Mental health log created successfully')
  );
}));

// =================== AGGREGATE DATA ===================

/**
 * GET /api/health-data/summary
 * Get user's health data summary
 */
router.get('/summary', asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const summary = await firestoreService.getUserLatestData(req.userId);

  res.json(formatSuccessResponse({
    ...summary,
    user_id: req.userId,
    generated_at: new Date().toISOString()
  }, 'Health data summary retrieved successfully'));
}));

/**
 * GET /api/health-data/stats
 * Get user's health statistics
 */
router.get('/stats', asyncErrorHandler(async (req, res) => {
  if (!firestoreService.db) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Database service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  const [cycles, nutritionLogs, fitnessLogs, mentalHealthLogs] = await Promise.all([
    firestoreService.getCycles(req.userId, 12), // Last 12 cycles
    firestoreService.getNutritionLogs(req.userId, null, 100),
    firestoreService.getFitnessLogs(req.userId, 100),
    firestoreService.getMentalHealthLogs(req.userId, 100)
  ]);

  const stats = {
    cycles: {
      total_tracked: cycles.length,
      average_cycle_length: cycles.length > 0 ? 
        cycles.reduce((sum, cycle) => sum + (cycle.cycle_length || 28), 0) / cycles.length : 28,
      average_period_duration: cycles.length > 0 ?
        cycles.reduce((sum, cycle) => sum + (cycle.period_duration || 5), 0) / cycles.length : 5
    },
    nutrition: {
      total_logs: nutritionLogs.length,
      average_calories_per_day: nutritionLogs.length > 0 ?
        nutritionLogs.reduce((sum, log) => sum + (log.calories || 0), 0) / nutritionLogs.length : 0
    },
    fitness: {
      total_workouts: fitnessLogs.length,
      total_minutes: fitnessLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0),
      average_duration: fitnessLogs.length > 0 ?
        fitnessLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / fitnessLogs.length : 0
    },
    mental_health: {
      total_logs: mentalHealthLogs.length,
      average_mood: mentalHealthLogs.length > 0 ?
        mentalHealthLogs.reduce((sum, log) => sum + (log.mood_rating || 5), 0) / mentalHealthLogs.length : 5,
      average_stress: mentalHealthLogs.length > 0 ?
        mentalHealthLogs.reduce((sum, log) => sum + (log.stress_level || 5), 0) / mentalHealthLogs.length : 5
    },
    user_id: req.userId,
    generated_at: new Date().toISOString()
  };

  res.json(formatSuccessResponse(stats, 'Health statistics retrieved successfully'));
}));

module.exports = router; 