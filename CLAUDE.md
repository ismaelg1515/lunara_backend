# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development
npm run dev          # Start development server with nodemon (uses app-working.js)
npm start           # Start production server (uses app-working.js)
npm run dev:original # Start original app.js (has path-to-regexp issues)
npm run start:original # Start original app.js in production mode

# Testing
npm test            # Run all tests with coverage
npm run test:watch  # Run tests in watch mode
npm test -- --testPathPattern=filename  # Run specific test file
npm test -- --testNamePattern="test name"  # Run specific test

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run format      # Format code with Prettier

# Build & Utilities
npm run build       # TypeScript compilation (if using TS)
npm run clean       # Clean build artifacts

# AI Testing
node test-openai-direct.js  # Test OpenAI connection directly
./test-openai.sh           # Test AI endpoints with server running
```

## Architecture Overview

This is a Node.js/Express backend for Lunara, a women's health tracking application with AI-powered personalized insights.

### Core Stack
- **Runtime**: Node.js with Express.js
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Admin SDK
- **AI**: OpenAI GPT-3.5-turbo for health insights
- **Testing**: Jest + Supertest

### Project Structure

```
src/
├── routes/          # Express route handlers
├── middleware/      # Auth, validation, error handling
├── services/        # External service integrations
├── utils/           # Shared utilities
├── config/          # Configuration files
├── app.js           # Original server entry point (has issues)
└── app-working.js   # Working server entry point (temporary fix)
```

### Key Architectural Patterns

1. **Authentication Flow**: 
   - Frontend (Flutter) obtains Firebase ID tokens
   - Backend verifies tokens via Firebase Admin SDK
   - User context attached to `req.user` after verification
   - All endpoints except `/health` require authentication

2. **Service Layer Pattern**:
   - `FirebaseService`: Firestore operations with automatic userId filtering
   - `FirebaseAuthService`: Token verification
   - `OpenAIService`: AI insight generation
   - All services are singletons

3. **Middleware Pipeline**:
   ```javascript
   app.use(helmet())           // Security headers
   app.use(cors())            // CORS configuration
   app.use(express.json())    // Body parsing
   app.use(authMiddleware)    // Firebase auth
   app.use(routes)            // Route handlers
   app.use(errorHandler)      // Global error handling
   ```

4. **Data Architecture**:
   - Collections: `users`, `health_entries`, `symptoms`, `moods`, `medications`, `insights`, `sessions`
   - All queries automatically filtered by `user_id`
   - Server-side timestamps for consistency
   - No client-side writes to sensitive fields

5. **AI Insights System**:
   - Builds context from user's health data
   - 5 insight types: cycle_prediction, health_tip, mood_analysis, symptom_correlation, wellness_advice
   - Saves generated insights to Firestore
   - Gracefully handles OpenAI failures

### Critical Files to Understand

1. **src/middleware/auth.js**: Firebase token verification
   - Validates ID tokens
   - Attaches user to request
   - Handles public endpoints

2. **src/services/firebase.service.js**: Database abstraction
   - CRUD operations for all collections
   - Automatic userId filtering
   - Timestamp management

3. **src/services/openai.js**: AI integration
   - Context building from user data
   - Prompt engineering for health insights
   - Error handling and retries
   - Graceful degradation when API key not available

4. **src/utils/asyncHandler.js**: Error handling wrapper
   - Catches async errors
   - Forwards to error middleware
   - Prevents unhandled rejections

### Common Modification Patterns

1. **Adding a New Endpoint**:
   ```javascript
   // In src/routes/newFeature.js
   const { asyncErrorHandler } = require('../middleware/errorHandler');
   
   router.post('/new-endpoint', authMiddleware, asyncErrorHandler(async (req, res) => {
     const userId = req.user.uid;
     // Use FirebaseService for data operations
     // Return standardized response
   }));
   ```
   
   Note: Use `asyncErrorHandler` not `asyncHandler` for wrapping async routes

2. **Adding New Data Collection**:
   ```javascript
   // In FirebaseService
   async createDocument(collection, userId, data) {
     return await db.collection(collection).add({
       user_id: userId,
       ...data,
       created_at: admin.firestore.FieldValue.serverTimestamp()
     });
   }
   ```

3. **Modifying AI Insights**:
   - Update prompt templates in `OpenAIService`
   - Add new insight types to the enum
   - Test with various user data scenarios

### Environment Variables

Required for production:
```
PORT=3000
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
OPENAI_API_KEY=your-openai-key
ALLOWED_ORIGINS=https://your-frontend.com
```

### Security Considerations

1. **Authentication**: All user endpoints require valid Firebase tokens
2. **Data Isolation**: Users can only access their own data
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **Input Validation**: Sanitization middleware on all inputs
5. **CORS**: Restricted to specific frontend origins

### Testing Approach

- Mock all external services (Firebase, OpenAI)
- Use `supertest` for API testing
- Test authentication and authorization
- Environment set in `jest.setup.js`
- Run specific tests with `--testPathPattern`

### API Response Format

```javascript
// Success
{
  "success": true,
  "data": { /* response data */ }
}

// Error
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE" // optional
  }
}
```

### Firestore Collections

- `users`: User profiles and settings
- `health_entries`: Daily health records
- `symptoms`: Symptom tracking
- `moods`: Mood entries
- `medications`: Medication records
- `insights`: AI-generated insights
- `sessions`: Authentication sessions

### Common Gotchas

1. **User ID Filtering**: FirebaseService automatically adds userId - don't filter manually
2. **Timestamps**: Always use server timestamps, not client timestamps
3. **Async Errors**: Wrap route handlers with `asyncErrorHandler` (not `asyncHandler`)
4. **Test Data**: Use mock user IDs in tests
5. **CORS Origins**: Update for new frontend deployments
6. **OpenAI Service**: 
   - Service file is `openai.js` not `openai.service.js`
   - Initializes automatically on import
   - Gracefully handles missing API key
7. **Middleware Imports**: 
   - `helmet` and `cors` are exported as configured instances from security.js
   - Use them directly without calling as functions

### Production Deployment

- Deployed on Google Cloud Platform (App Engine)
- Environment variables in app.yaml
- Health check at `/health`
- Automatic scaling based on traffic
- Firestore indexes defined in `firestore.indexes.json`

### Troubleshooting

1. **path-to-regexp Error**: If you see "Missing parameter name" error:
   - This is a known issue with the original app.js
   - Use `app-working.js` instead (already configured in package.json)
   - The issue is related to middleware initialization order

2. **OpenAI Connection Issues**:
   - Verify API key is set in .env file
   - Run `node test-openai-direct.js` to test connection
   - Check console logs for "✅ OpenAI service initialized"

3. **Firebase Connection Issues**:
   - Ensure all Firebase credentials are in .env
   - Check service account permissions
   - Verify project ID matches

### Testing OpenAI Integration

```bash
# Direct test (no server needed)
node test-openai-direct.js

# API endpoint test
curl http://localhost:3000/api/test-ai

# Generate health tip
curl -X POST http://localhost:3000/api/test-ai/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "menstrual health"}'
```

When modifying this codebase:
- Follow existing patterns for consistency
- Add tests for new functionality
- Update API documentation
- Ensure backward compatibility
- Test with production-like data
- Always verify OpenAI works after environment changes