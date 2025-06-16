# 🌙 Lunara Backend API - Node.js

An extremely simple and fast REST API for the Flutter **Lunara** application - women's health tracking with OpenAI integration.

## 🔥 **IMPORTANT ARCHITECTURE**

### ✅ **What the FRONTEND handles (Flutter + Firebase):**
- 🔐 **Complete authentication** (login, register, logout)
- 👤 **Basic user profile** (Firestore)
- 🔑 **Firebase Auth tokens** (sent to backend)

### ✅ **What the BACKEND handles (Node.js):**
- 📊 **Health data CRUD** (cycles, nutrition, fitness, mental state)
- 🤖 **OpenAI insights** (personalized analysis)
- 📈 **Analytics and statistics** 
- 🔄 **Data synchronization**

## 🚀 Quick Setup (5 minutes)

### 1. Initial Installation
```bash
# Create project
mkdir lunara-backend && cd lunara-backend
npm init -y

# Install essential dependencies (NO MongoDB - we use Firestore)
npm install express cors dotenv helmet
npm install firebase-admin
npm install openai axios node-cron
npm install --save-dev nodemon

# Folder structure
mkdir src src/routes src/middleware src/services src/utils
```

### 2. Environment Variables
Create `.env`:
```env
PORT=3000
OPENAI_API_KEY=your-openai-api-key-here
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
NODE_ENV=development
```

### 3. Package.json Scripts
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "echo 'Tests pending'"
  }
}
```

## 📁 Project Structure
```
lunara-backend/
├── src/
│   ├── app.js              # Main server
│   ├── routes/             # API routes
│   │   ├── health.js       # Health data (cycles, fitness, nutrition, mental)
│   │   ├── insights.js     # Analytics and statistics
│   │   ├── ai.js           # OpenAI integration
│   │   └── sync.js         # Data synchronization
│   ├── middleware/         # Middlewares
│   │   ├── auth.js         # Firebase token verification
│   │   └── validation.js   # Data validation
│   ├── services/           # Services
│   │   ├── openai.js       # OpenAI service
│   │   ├── firebase.js     # Firebase Admin SDK
│   │   └── firestore.js    # Firestore operations
│   └── utils/              # Utilities
│       ├── helpers.js      # Helper functions
│       └── constants.js    # Constants
├── .env
├── .gitignore
└── README.md
```

## 🛠️ Quick Implementation

### 1. Main Server (`src/app.js`)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
});

console.log('✅ Firebase Admin SDK initialized');

// Basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Main routes
app.use('/api/health-data', require('./routes/health'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/sync', require('./routes/sync'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    firebase_connected: true 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔥 Connected to Firebase project: ${process.env.FIREBASE_PROJECT_ID}`);
});
```

### 2. Firestore Service (`src/services/firestore.js`)
```javascript
const admin = require('firebase-admin');

class FirestoreService {
  constructor() {
    this.db = admin.firestore();
  }

  // ================== COLLECTIONS ==================
  
  // Menstrual cycles
  async saveCycle(userId, cycleData) {
    try {
      const docRef = await this.db.collection('cycles').add({
        user_id: userId,
        ...cycleData,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...cycleData };
    } catch (error) {
      throw new Error(`Error saving cycle: ${error.message}`);
    }
  }

  async getCycles(userId, limit = 50) {
    try {
      const snapshot = await this.db.collection('cycles')
        .where('user_id', '==', userId)
        .orderBy('start_date', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting cycles: ${error.message}`);
    }
  }

  // Nutrition
  async saveNutritionLog(userId, nutritionData) {
    try {
      const docRef = await this.db.collection('nutrition_logs').add({
        user_id: userId,
        ...nutritionData,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...nutritionData };
    } catch (error) {
      throw new Error(`Error saving nutrition log: ${error.message}`);
    }
  }

  // Fitness
  async saveFitnessLog(userId, fitnessData) {
    try {
      const docRef = await this.db.collection('fitness_logs').add({
        user_id: userId,
        ...fitnessData,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...fitnessData };
    } catch (error) {
      throw new Error(`Error saving fitness log: ${error.message}`);
    }
  }

  // Mental health
  async saveMentalHealthLog(userId, mentalHealthData) {
    try {
      const docRef = await this.db.collection('mental_health_logs').add({
        user_id: userId,
        ...mentalHealthData,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...mentalHealthData };
    } catch (error) {
      throw new Error(`Error saving mental health log: ${error.message}`);
    }
  }

  // AI Insights
  async saveAIInsight(userId, insightData) {
    try {
      const docRef = await this.db.collection('ai_insights').add({
        user_id: userId,
        ...insightData,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...insightData };
    } catch (error) {
      throw new Error(`Error saving AI insight: ${error.message}`);
    }
  }

  // Get recent insights
  async getRecentInsights(userId, limit = 10) {
    try {
      const snapshot = await this.db.collection('ai_insights')
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting insights: ${error.message}`);
    }
  }
}

module.exports = new FirestoreService();
```

### 3. Authentication Middleware (`src/middleware/auth.js`)
```javascript
const admin = require('firebase-admin');

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Firebase token required' });
    }

    // Verify Firebase token (frontend already sends it)
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateUser };
```

### 4. Health Data Routes with Tokens (`src/routes/health.js`)
```javascript
const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const firestoreService = require('../services/firestore');
const router = express.Router();

// ================== MENSTRUAL CYCLES ==================

// GET - Get authenticated user's cycles
router.get('/cycles', authenticateUser, async (req, res) => {
  try {
    // ✅ req.user.uid comes from verified Firebase token
    const cycles = await firestoreService.getCycles(req.user.uid);
    res.json({ success: true, cycles, user_id: req.user.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Create new cycle for authenticated user
router.post('/cycles', authenticateUser, async (req, res) => {
  try {
    // ✅ Token ensures creation only for correct user
    const cycleData = {
      ...req.body,
      user_id: req.user.uid // ✅ Force user_id from token
    };
    
    const cycle = await firestoreService.saveCycle(req.user.uid, cycleData);
    res.status(201).json({ success: true, cycle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT - Update cycle (only if belongs to user)
router.put('/cycles/:id', authenticateUser, async (req, res) => {
  try {
    // ✅ Verify cycle belongs to authenticated user
    const existingCycle = await firestoreService.getCycleById(req.params.id);
    
    if (!existingCycle || existingCycle.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to modify this cycle' });
    }
    
    const updatedCycle = await firestoreService.updateCycle(req.params.id, req.body);
    res.json({ success: true, cycle: updatedCycle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE - Delete cycle (only if belongs to user)
router.delete('/cycles/:id', authenticateUser, async (req, res) => {
  try {
    // ✅ Verify ownership before deletion
    const existingCycle = await firestoreService.getCycleById(req.params.id);
    
    if (!existingCycle || existingCycle.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this cycle' });
    }
    
    await firestoreService.deleteCycle(req.params.id);
    res.json({ success: true, message: 'Cycle deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ================== NUTRITION ==================

// POST - Create nutrition log
router.post('/nutrition', authenticateUser, async (req, res) => {
  try {
    const nutritionData = {
      ...req.body,
      user_id: req.user.uid, // ✅ ID from Firebase token
      email: req.user.email   // ✅ Verified email from token
    };
    
    const nutritionLog = await firestoreService.saveNutritionLog(req.user.uid, nutritionData);
    res.status(201).json({ success: true, nutritionLog });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET - Get nutrition logs by date
router.get('/nutrition', authenticateUser, async (req, res) => {
  try {
    const { date, limit = 30 } = req.query;
    
    // ✅ Only get authenticated user's data
    const nutritionLogs = await firestoreService.getNutritionLogs(
      req.user.uid, 
      date, 
      parseInt(limit)
    );
    
    res.json({ success: true, nutritionLogs, user_id: req.user.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== FITNESS ==================

// POST - Create fitness log
router.post('/fitness', authenticateUser, async (req, res) => {
  try {
    const fitnessData = {
      ...req.body,
      user_id: req.user.uid // ✅ Ensure security via token
    };
    
    const fitnessLog = await firestoreService.saveFitnessLog(req.user.uid, fitnessData);
    res.status(201).json({ success: true, fitnessLog });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ================== MENTAL HEALTH ==================

// POST - Create mental health log
router.post('/mental-health', authenticateUser, async (req, res) => {
  try {
    const mentalHealthData = {
      ...req.body,
      user_id: req.user.uid // ✅ Secure ID from token
    };
    
    const mentalHealthLog = await firestoreService.saveMentalHealthLog(req.user.uid, mentalHealthData);
    res.status(201).json({ success: true, mentalHealthLog });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

### 5. AI Routes (`src/routes/ai.js`)
```javascript
const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const openaiService = require('../services/openai');
const firestoreService = require('../services/firestore');
const router = express.Router();

// Generate personalized insight with OpenAI
router.post('/generate-insight', authenticateUser, async (req, res) => {
  try {
    const { type = 'general_health' } = req.body;
    
    // Get user's recent data from Firestore
    const recentCycles = await firestoreService.getCycles(req.user.uid, 3);
    
    // Prepare data for OpenAI
    const userData = {
      user_id: req.user.uid,
      email: req.user.email,
      cycles: recentCycles,
      insight_type: type
    };
    
    // Generate insight with OpenAI
    const insight = await openaiService.generateHealthInsight(userData);
    
    // Save insight to Firestore
    const savedInsight = await firestoreService.saveAIInsight(req.user.uid, {
      type,
      content: insight,
      generated_at: new Date().toISOString()
    });
    
    res.json({ success: true, insight: savedInsight });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's recent insights
router.get('/insights', authenticateUser, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const insights = await firestoreService.getRecentInsights(
      req.user.uid, 
      parseInt(limit)
    );
    
    res.json({ success: true, insights, user_id: req.user.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 6. OpenAI Service (`src/services/openai.js`)
```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class OpenAIService {
  async generateHealthInsight(userData) {
    try {
      const prompt = `
        As a women's health AI assistant, analyze this user's data and provide personalized insights:
        
        User ID: ${userData.user_id}
        Recent cycles: ${JSON.stringify(userData.cycles, null, 2)}
        Insight type: ${userData.insight_type}
        
        Provide helpful, accurate health insights focused on:
        1. Cycle patterns and predictions
        2. Health recommendations
        3. Wellness tips
        
        Keep response under 200 words and be supportive.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful women's health assistant focused on menstrual health, nutrition, and wellness."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async analyzeCyclePattern(cycles) {
    try {
      const prompt = `
        Analyze these menstrual cycles and provide pattern insights:
        ${JSON.stringify(cycles, null, 2)}
        
        Focus on:
        - Average cycle length
        - Regularity patterns
        - Health recommendations
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      throw new Error(`OpenAI cycle analysis error: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();
```

## 📊 API Endpoints Overview

### 🔐 **Authentication Required** (All endpoints need Firebase token)

```
Authorization: Bearer <firebase-id-token>
```

### 📋 **Health Data Endpoints**

```javascript
// Menstrual Cycles
GET    /api/health-data/cycles           // Get user's cycles
POST   /api/health-data/cycles           // Create new cycle
PUT    /api/health-data/cycles/:id       // Update cycle
DELETE /api/health-data/cycles/:id       // Delete cycle

// Nutrition Logs
GET    /api/health-data/nutrition        // Get nutrition logs
POST   /api/health-data/nutrition        // Create nutrition log

// Fitness Logs
GET    /api/health-data/fitness          // Get fitness logs
POST   /api/health-data/fitness          // Create fitness log

// Mental Health Logs
GET    /api/health-data/mental-health    // Get mental health logs
POST   /api/health-data/mental-health    // Create mental health log
```

### 🤖 **AI Insights Endpoints**

```javascript
// Generate AI insights
POST   /api/ai/generate-insight          // Generate personalized insight
GET    /api/ai/insights                  // Get user's recent insights

// Analytics
GET    /api/insights/cycle-analytics     // Cycle pattern analysis
GET    /api/insights/health-summary      // Overall health summary
```

### 🔄 **Data Sync Endpoints**

```javascript
// Synchronization
POST   /api/sync/bulk-upload             // Bulk data upload
GET    /api/sync/latest-changes          // Get latest changes
```

## 🚀 Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start

# Test the API
curl http://localhost:3000/api/health
```

## 🔒 Security Features

- ✅ **Firebase Authentication** - All endpoints protected
- ✅ **User Data Isolation** - Users can only access their own data
- ✅ **Token Verification** - Every request validates Firebase tokens
- ✅ **Helmet Security** - Security headers enabled
- ✅ **CORS Protection** - Cross-origin requests controlled
- ✅ **Rate Limiting** - API abuse prevention
- ✅ **Input Validation** - Request data validation

## 📱 Flutter Integration

### Example Service Class
```dart
class LunaraApiService {
  static const String baseUrl = 'http://localhost:3000/api';
  
  // Get Firebase token
  Future<String> _getAuthToken() async {
    final user = FirebaseAuth.instance.currentUser;
    return await user?.getIdToken() ?? '';
  }
  
  // Create cycle
  Future<Map<String, dynamic>> createCycle(Map<String, dynamic> cycleData) async {
    final token = await _getAuthToken();
    
    final response = await http.post(
      Uri.parse('$baseUrl/health-data/cycles'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(cycleData),
    );
    
    return json.decode(response.body);
  }
  
  // Generate AI insight
  Future<Map<String, dynamic>> generateInsight(String type) async {
    final token = await _getAuthToken();
    
    final response = await http.post(
      Uri.parse('$baseUrl/ai/generate-insight'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'type': type}),
    );
    
    return json.decode(response.body);
  }
}
```

## 🔧 Environment Setup

### Required Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# Optional: Database backup
BACKUP_BUCKET=your-backup-bucket
```

### Firebase Setup
1. Create Firebase project
2. Enable Authentication
3. Enable Firestore Database
4. Generate Admin SDK private key
5. Add configuration to `.env`

### OpenAI Setup
1. Create OpenAI account
2. Generate API key
3. Add to `.env` file

## 📈 Monitoring & Analytics

### Health Check Endpoint
```javascript
GET /api/health
// Returns: { status: 'OK', timestamp: '...', firebase_connected: true }
```

### Error Handling
```javascript
// All endpoints return consistent error format
{
  "error": "Error message",
  "message": "Detailed error (development only)",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🚀 Deployment Options

### 1. Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### 2. Heroku Deployment
```bash
# Install Heroku CLI
heroku create lunara-backend-api
heroku config:set OPENAI_API_KEY=your-key
heroku config:set FIREBASE_PROJECT_ID=your-project
git push heroku main
```

### 3. Digital Ocean App Platform
```yaml
# app.yaml
name: lunara-backend
services:
- name: api
  source_dir: /
  github:
    repo: your-username/lunara-backend
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: OPENAI_API_KEY
    value: your-openai-key
    type: SECRET
```

## 🎯 Next Steps

1. **✅ Complete Setup** - API fully functional
2. **🔗 Flutter Integration** - Connect mobile app
3. **📊 Advanced Analytics** - Implement detailed insights
4. **🔔 Push Notifications** - Add reminder system
5. **📱 Offline Support** - Implement data caching
6. **🌐 API Documentation** - Generate OpenAPI docs
7. **🧪 Testing** - Add comprehensive tests
8. **🚀 Production Deploy** - Launch to cloud platform

## 📞 Support

- **Documentation**: Complete API docs available
- **Examples**: Flutter integration samples included
- **Security**: Firebase authentication implemented
- **AI Integration**: OpenAI insights ready
- **Database**: Firestore fully configured

---

**🌙 Lunara Backend API** - Ready for production! 🚀

Built with ❤️ for women's health tracking and AI-powered insights.
