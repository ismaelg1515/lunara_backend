const express = require('express');
const router = express.Router();
const openAIService = require('../services/openai');
const { asyncErrorHandler } = require('../middleware/errorHandler');

router.get('/test-connection', asyncErrorHandler(async (req, res) => {
  const isAvailable = openAIService.isAvailable();
  
  res.json({
    success: true,
    data: {
      aiAvailable: isAvailable,
      apiKeyConfigured: !!process.env.OPENAI_API_KEY,
      apiKeyValue: process.env.OPENAI_API_KEY ? 'Configured (hidden)' : 'Not configured'
    }
  });
}));

router.post('/test-generation', asyncErrorHandler(async (req, res) => {
  if (!openAIService.isAvailable()) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'AI service not available. Please check API key configuration.',
        code: 'AI_NOT_AVAILABLE'
      }
    });
  }

  const { topic = 'menstrual health' } = req.body;
  
  const quickTip = await openAIService.generateQuickTip(topic);
  
  if (!quickTip) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate AI response',
        code: 'AI_GENERATION_FAILED'
      }
    });
  }

  res.json({
    success: true,
    data: {
      message: 'AI is working correctly!',
      generatedTip: quickTip,
      timestamp: new Date()
    }
  });
}));

router.post('/test-insight', asyncErrorHandler(async (req, res) => {
  if (!openAIService.isAvailable()) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'AI service not available. Please check API key configuration.',
        code: 'AI_NOT_AVAILABLE'
      }
    });
  }

  const testUserData = {
    age: 28,
    weight: 65,
    cycle_length: 28,
    period_duration: 5,
    recent_symptoms: 'mild cramps, fatigue',
    cycle_phase: 'follicular'
  };

  const insight = await openAIService.generateHealthInsight(
    testUserData, 
    'GENERAL_HEALTH'
  );
  
  if (!insight) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate insight',
        code: 'INSIGHT_GENERATION_FAILED'
      }
    });
  }

  res.json({
    success: true,
    data: {
      message: 'AI insight generation successful!',
      insight: insight
    }
  });
}));

module.exports = router;