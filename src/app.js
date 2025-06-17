const express = require('express');
require('dotenv').config();

// Import services
const firebaseService = require('./services/firebase');
const firestoreService = require('./services/firestore');
const openaiService = require('./services/openai');

// Import middleware
const { cors, helmet, securityHeaders, ipRateLimit, healthCheckBypass } = require('./middleware/security');
const { globalErrorHandler, notFoundHandler, requestLogger, timeoutHandler } = require('./middleware/errorHandler');

// Import utilities
const { formatSuccessResponse } = require('./utils/helpers');
const { HTTP_STATUS } = require('./utils/constants');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// =================== MIDDLEWARE SETUP ===================

// Security middleware (applied first)
app.use(helmet);
app.use(cors);
app.use(securityHeaders);
app.use(healthCheckBypass);

// Request processing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(timeoutHandler);

// Rate limiting (after health check bypass)
app.use((req, res, next) => {
  if (req.skipRateLimit) {
    return next();
  }
  ipRateLimit(req, res, next);
});

// Trust proxy for proper IP detection
app.set('trust proxy', 1);

// =================== HEALTH CHECK ENDPOINT ===================

/**
 * Health check endpoint
 * Returns server status and service connectivity
 */
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        firebase: firebaseService.isInitialized(),
        firestore: !!firestoreService.db,
        openai: openaiService.isAvailable()
      },
      version: '1.0.0',
      uptime: process.uptime()
    };

    res.json(formatSuccessResponse(healthStatus, 'Server is healthy'));
  } catch (error) {
    console.error('Health check error:', error.message);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      message: 'Health check failed'
    });
  }
});

/**
 * Simple health check endpoint (without detailed info)
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// =================== API ROUTES ===================

// Health data routes
app.use('/api/health-data', require('./routes/health'));

// AI insights routes
app.use('/api/ai', require('./routes/ai'));

// User management routes
app.use('/api/users', require('./routes/users'));

// Analytics routes (to be implemented in next stage)
// app.use('/api/analytics', require('./routes/analytics'));

// =================== ROOT ENDPOINT ===================

/**
 * Root endpoint - API information
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Lunara Backend API',
    version: '1.0.0',
    description: 'REST API for Lunara - Women\'s Health Tracking App with AI Insights',
    endpoints: {
      health: '/api/health',
      healthData: '/api/health-data',
      aiInsights: '/api/ai',
      users: '/api/users',
      analytics: '/api/analytics'
    },
    documentation: 'https://github.com/your-repo/lunara-backend',
    timestamp: new Date().toISOString()
  });
});

// =================== API VERSION ENDPOINT ===================

/**
 * API version and status endpoint
 */
app.get('/api', (req, res) => {
  res.json({
    api: 'Lunara Backend',
    version: '1.0.0',
    status: 'active',
    features: [
      'Menstrual cycle tracking',
      'Nutrition logging',
      'Fitness tracking',
      'Mental health monitoring',
      'AI-powered insights',
      'User profile management',
      'Dashboard analytics',
      'App settings',
      'Data export',
      'Firebase authentication'
    ],
    timestamp: new Date().toISOString()
  });
});

// =================== ERROR HANDLING ===================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// =================== SERVER STARTUP ===================

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Check Firebase connection (optional in development)
    if (!firebaseService.isInitialized()) {
      console.warn('⚠️ Firebase service not initialized. Some features will be disabled.');
    }

    // Verify OpenAI availability (optional)
    if (!openaiService.isAvailable()) {
      console.warn('⚠️ OpenAI service not available. AI features will be disabled.');
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log('🌙 ================================');
      console.log('🚀 LUNARA BACKEND API STARTED');
      console.log('🌙 ================================');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔥 Firebase: ${firebaseService.isInitialized() ? 'Connected' : 'Disconnected'}`);
      console.log(`🤖 OpenAI: ${openaiService.isAvailable() ? 'Available' : 'Disabled'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🌙 ================================');
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        
        // Close database connections, cleanup, etc.
        console.log('🔄 Cleaning up resources...');
        
        // Exit process
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

    return server;
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export app for testing
module.exports = { app, startServer }; 