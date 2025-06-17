const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateUser, validateUserAccess } = require('../middleware/auth');
const { asyncErrorHandler } = require('../middleware/errorHandler');

// Import services
const firestoreService = require('../services/firestore');

// Import utilities
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

// Apply authentication to all routes
router.use(authenticateUser);
router.use(validateUserAccess);

// =================== USER PROFILE ENDPOINTS ===================

/**
 * GET /api/users/profile
 * Get current user profile information
 * Firebase handles authentication - we just return token info + any additional data
 */
router.get('/profile', asyncErrorHandler(async (req, res) => {
  try {
    // Get basic info from Firebase token (already verified by middleware)
    const userProfile = {
      uid: req.user.uid,
      email: req.user.email,
      email_verified: req.user.email_verified,
      firebase_claims: req.user.firebase_claims
    };

    // Try to get additional profile data from Firestore (if exists)
    try {
      const profileDoc = await firestoreService.db.collection('user_profiles').doc(req.userId).get();
      if (profileDoc.exists) {
        userProfile.profile = profileDoc.data();
      }
    } catch (error) {
      // Profile doesn't exist yet - that's okay
      console.log('No additional profile data found for user:', req.userId);
    }

    res.json(formatSuccessResponse(userProfile, 'User profile retrieved successfully'));
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to retrieve user profile', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
}));

/**
 * PUT /api/users/profile
 * Update user profile information (additional data beyond Firebase)
 * Firebase Auth data can't be changed here - only additional profile data
 */
router.put('/profile', asyncErrorHandler(async (req, res) => {
  try {
    const allowedFields = [
      'display_name',
      'birth_date',
      'weight',
      'height',
      'time_zone',
      'language',
      'notifications_enabled',
      'privacy_settings',
      'health_goals',
      'cycle_length_average',
      'period_length_average'
    ];

    // Filter only allowed fields
    const profileData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        profileData[key] = req.body[key];
      }
    });

    // Add metadata
    profileData.updated_at = new Date().toISOString();
    profileData.user_id = req.userId;

    // Save to Firestore
    await firestoreService.db.collection('user_profiles').doc(req.userId).set(profileData, { merge: true });

    res.json(formatSuccessResponse(profileData, 'User profile updated successfully'));
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to update user profile', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
}));

// =================== USER DASHBOARD ENDPOINTS ===================

/**
 * GET /api/users/dashboard
 * Get user dashboard data - summary of all user data
 */
router.get('/dashboard', asyncErrorHandler(async (req, res) => {
  try {
    // Get user's latest data across all collections
    const dashboardData = await firestoreService.getUserLatestData(req.userId);
    
    // Add user basic info
    dashboardData.user = {
      uid: req.user.uid,
      email: req.user.email,
      email_verified: req.user.email_verified
    };

    // Add counts
    const [cycleCount, nutritionCount, fitnessCount, mentalHealthCount] = await Promise.all([
      firestoreService.getCycleCount(req.userId),
      firestoreService.getNutritionLogCount(req.userId),
      firestoreService.getFitnessLogCount(req.userId),
      firestoreService.getMentalHealthLogCount(req.userId)
    ]);

    dashboardData.statistics = {
      total_cycles: cycleCount,
      total_nutrition_logs: nutritionCount,
      total_fitness_logs: fitnessCount,
      total_mental_health_logs: mentalHealthCount,
      account_created: req.user.firebase_claims.auth_time ? new Date(req.user.firebase_claims.auth_time * 1000).toISOString() : null
    };

    res.json(formatSuccessResponse(dashboardData, 'Dashboard data retrieved successfully'));
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to retrieve dashboard data', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
}));

// =================== USER SETTINGS ENDPOINTS ===================

/**
 * GET /api/users/settings
 * Get user app settings
 */
router.get('/settings', asyncErrorHandler(async (req, res) => {
  try {
    const settingsDoc = await firestoreService.db.collection('user_settings').doc(req.userId).get();
    
    const defaultSettings = {
      notifications: {
        period_reminders: true,
        ovulation_reminders: true,
        medication_reminders: true,
        health_insights: true
      },
      privacy: {
        data_sharing: false,
        analytics: true,
        crash_reports: true
      },
      preferences: {
        theme: 'light',
        language: 'en',
        units: 'metric',
        first_day_of_week: 'monday'
      }
    };

    const settings = settingsDoc.exists ? { ...defaultSettings, ...settingsDoc.data() } : defaultSettings;

    res.json(formatSuccessResponse(settings, 'User settings retrieved successfully'));
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to retrieve user settings', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
}));

/**
 * PUT /api/users/settings
 * Update user app settings
 */
router.put('/settings', asyncErrorHandler(async (req, res) => {
  try {
    const settingsData = {
      ...req.body,
      updated_at: new Date().toISOString(),
      user_id: req.userId
    };

    await firestoreService.db.collection('user_settings').doc(req.userId).set(settingsData, { merge: true });

    res.json(formatSuccessResponse(settingsData, 'User settings updated successfully'));
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to update user settings', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
}));

// =================== USER DATA MANAGEMENT ===================

/**
 * GET /api/users/data-summary
 * Get summary of all user data (for data export/backup)
 */
router.get('/data-summary', asyncErrorHandler(async (req, res) => {
  try {
    const [cycles, nutritionLogs, fitnessLogs, mentalHealthLogs, aiInsights] = await Promise.all([
      firestoreService.getCycles(req.userId, 1000), // Get all cycles
      firestoreService.getNutritionLogs(req.userId, null, 1000),
      firestoreService.getFitnessLogs(req.userId, 1000),
      firestoreService.getMentalHealthLogs(req.userId, 1000),
      firestoreService.getRecentInsights(req.userId, 100)
    ]);

    const dataSummary = {
      user: {
        uid: req.user.uid,
        email: req.user.email,
        email_verified: req.user.email_verified
      },
      data: {
        cycles: cycles,
        nutrition_logs: nutritionLogs,
        fitness_logs: fitnessLogs,
        mental_health_logs: mentalHealthLogs,
        ai_insights: aiInsights
      },
      summary: {
        total_cycles: cycles.length,
        total_nutrition_logs: nutritionLogs.length,
        total_fitness_logs: fitnessLogs.length,
        total_mental_health_logs: mentalHealthLogs.length,
        total_ai_insights: aiInsights.length,
        export_date: new Date().toISOString()
      }
    };

    res.json(formatSuccessResponse(dataSummary, 'User data summary retrieved successfully'));
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to retrieve user data summary', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
}));

/**
 * DELETE /api/users/account
 * Delete user account and all associated data
 * WARNING: This is irreversible!
 */
router.delete('/account', asyncErrorHandler(async (req, res) => {
  try {
    // This endpoint should be used carefully
    // It deletes all user data but NOT the Firebase Auth account
    // Firebase Auth account deletion should be handled by the frontend
    
    const { confirm_email } = req.body;
    
    if (confirm_email !== req.user.email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Email confirmation required for account deletion', HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Delete all user data from Firestore
    const batch = firestoreService.db.batch();
    
    // Get all user documents
    const collections = ['cycles', 'nutrition_logs', 'fitness_logs', 'mental_health_logs', 'ai_insights', 'user_profiles', 'user_settings'];
    
    for (const collectionName of collections) {
      const snapshot = await firestoreService.db.collection(collectionName).where('user_id', '==', req.userId).get();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    // Execute batch delete
    await batch.commit();

    res.json(formatSuccessResponse(null, 'All user data deleted successfully. Please delete your Firebase Auth account from the app.'));
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to delete user account data', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }
}));

module.exports = router; 