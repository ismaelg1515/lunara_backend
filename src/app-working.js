const express = require('express');
require('dotenv').config();

// Import services
const firebaseService = require('./services/firebase');
const firestoreService = require('./services/firestore');
const openaiService = require('./services/openai');

// Import utilities
const { formatSuccessResponse } = require('./utils/helpers');
const { HTTP_STATUS } = require('./utils/constants');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS for all origins during testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
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

// Test AI endpoint
app.get('/api/test-ai', (req, res) => {
  res.json({
    success: true,
    data: {
      aiAvailable: openaiService.isAvailable(),
      apiKeyConfigured: !!process.env.OPENAI_API_KEY
    }
  });
});

// Test AI generation
app.post('/api/test-ai/generate', async (req, res) => {
  try {
    const { topic = 'menstrual health' } = req.body;
    const tip = await openaiService.generateQuickTip(topic);
    
    res.json({
      success: true,
      data: {
        tip: tip,
        generated: !!tip
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API routes
app.use('/api/health-data', require('./routes/health'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/users', require('./routes/users'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Lunara Backend API',
    version: '1.0.0',
    openai: {
      configured: !!process.env.OPENAI_API_KEY,
      available: openaiService.isAvailable()
    }
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Start server
const startServer = async () => {
  try {
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

    return server;
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };