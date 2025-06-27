# Frontend Integration Guide for Lunara Backend API

This comprehensive guide explains how to integrate your frontend application with the Lunara Backend API. It covers authentication, API endpoints, request/response formats, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Base Configuration](#base-configuration)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints](#api-endpoints)
5. [Request & Response Formats](#request--response-formats)
6. [Error Handling](#error-handling)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)
9. [Rate Limiting](#rate-limiting)
10. [Security Considerations](#security-considerations)

## Overview

The Lunara Backend API is a RESTful service that provides:
- Health data management (cycles, nutrition, fitness, mental health)
- AI-powered health insights
- User profile and settings management
- Firebase Authentication integration

### Architecture Flow
```
Frontend App → Firebase Auth → Backend API → Firestore Database
    ↓              ↓              ↓              ↓
   UI/UX      ID Tokens      CRUD + AI     Health Data
```

## Base Configuration

### API Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Required Headers
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <FIREBASE_ID_TOKEN>"
}
```

### CORS Configuration
The backend allows requests from:
- `http://localhost:*` (development)
- Your production domain (configure in backend)

## Authentication Flow

### 1. User Registration/Login (Frontend)

```javascript
// Using Firebase Auth SDK
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Register new user
async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    return { user: userCredential.user, idToken };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// Login existing user
async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    return { user: userCredential.user, idToken };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

### 2. Getting ID Token

```javascript
// Get current user's ID token
async function getIdToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return await user.getIdToken();
}

// Refresh token when needed (tokens expire after 1 hour)
async function getRefreshedToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return await user.getIdToken(true); // Force refresh
}
```

### 3. Making Authenticated Requests

```javascript
// Create API client with auth
class LunaraAPI {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const token = await getIdToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // PUT request
  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new LunaraAPI();
```

## API Endpoints

### Health Data Endpoints

#### Menstrual Cycles

**GET /health-data/cycles**
```javascript
// Get user's cycles
const response = await api.get('/health-data/cycles?limit=50');
// Response:
{
  "success": true,
  "message": "Cycles retrieved successfully",
  "data": {
    "cycles": [
      {
        "id": "cycle123",
        "user_id": "user123",
        "start_date": "2024-01-01",
        "end_date": "2024-01-28",
        "period_duration": 5,
        "cycle_length": 28,
        "symptoms": ["cramps", "mood_swings"],
        "flow_intensity": "medium",
        "notes": "Regular cycle",
        "current_phase": "follicular",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 1,
    "user_id": "user123"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**POST /health-data/cycles**
```javascript
// Create new cycle
const newCycle = {
  start_date: "2024-01-01",
  period_duration: 5,
  cycle_length: 28,
  symptoms: ["cramps", "headache"],
  flow_intensity: "medium",
  notes: "Started on time"
};

const response = await api.post('/health-data/cycles', newCycle);
```

**GET /health-data/cycles/:id**
```javascript
// Get specific cycle
const response = await api.get('/health-data/cycles/cycle123');
```

**PUT /health-data/cycles/:id**
```javascript
// Update cycle
const updates = {
  end_date: "2024-01-28",
  symptoms: ["cramps", "headache", "fatigue"]
};

const response = await api.put('/health-data/cycles/cycle123', updates);
```

**DELETE /health-data/cycles/:id**
```javascript
// Delete cycle
const response = await api.delete('/health-data/cycles/cycle123');
```

#### Nutrition Logs

**GET /health-data/nutrition**
```javascript
// Get nutrition logs
const response = await api.get('/health-data/nutrition?date=2024-01-15&limit=30');
// Response:
{
  "success": true,
  "data": {
    "nutrition_logs": [
      {
        "id": "nutrition123",
        "user_id": "user123",
        "log_date": "2024-01-15",
        "meals": [
          {
            "type": "breakfast",
            "foods": ["oatmeal", "banana"],
            "calories": 350
          }
        ],
        "water_intake_ml": 2000,
        "calories": 1800,
        "protein_g": 65,
        "carbs_g": 230,
        "fat_g": 70,
        "notes": "Felt energized"
      }
    ],
    "count": 1,
    "date_filter": "2024-01-15"
  }
}
```

**POST /health-data/nutrition**
```javascript
// Create nutrition log
const nutritionLog = {
  log_date: "2024-01-15",
  meals: [
    {
      type: "breakfast",
      foods: ["eggs", "toast"],
      calories: 300
    }
  ],
  water_intake_ml: 500,
  calories: 300,
  protein_g: 20,
  carbs_g: 30,
  fat_g: 15
};

const response = await api.post('/health-data/nutrition', nutritionLog);
```

#### Fitness Logs

**GET /health-data/fitness**
```javascript
// Get fitness logs
const response = await api.get('/health-data/fitness?limit=30');
```

**POST /health-data/fitness**
```javascript
// Create fitness log
const fitnessLog = {
  activity_type: "yoga",
  duration_minutes: 45,
  intensity: "moderate",
  calories_burned: 200,
  notes: "Morning flow session"
};

const response = await api.post('/health-data/fitness', fitnessLog);
```

#### Mental Health Logs

**GET /health-data/mental-health**
```javascript
// Get mental health logs
const response = await api.get('/health-data/mental-health?limit=30');
```

**POST /health-data/mental-health**
```javascript
// Create mental health log
const mentalHealthLog = {
  mood_rating: 8,
  stress_level: 3,
  anxiety_level: 2,
  emotions: ["happy", "energetic"],
  notes: "Great day overall"
};

const response = await api.post('/health-data/mental-health', mentalHealthLog);
```

#### Aggregate Data

**GET /health-data/summary**
```javascript
// Get health data summary
const response = await api.get('/health-data/summary');
// Returns latest data from all categories
```

**GET /health-data/stats**
```javascript
// Get health statistics
const response = await api.get('/health-data/stats');
// Returns calculated statistics like averages
```

### AI Insights Endpoints

**POST /ai/generate-insight**
```javascript
// Generate single insight
const response = await api.post('/ai/generate-insight', {
  type: "general_health" // Options: general_health, cycle_prediction, nutrition_tips, fitness_recommendations, mood_analysis
});

// Response:
{
  "success": true,
  "data": {
    "id": "insight123",
    "type": "general_health",
    "title": "Your Health Overview",
    "content": "Based on your recent data...",
    "recommendations": ["Stay hydrated", "Maintain regular sleep"],
    "priority": "medium",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**POST /ai/generate-multiple-insights**
```javascript
// Generate multiple insights
const response = await api.post('/ai/generate-multiple-insights', {
  types: ["general_health", "cycle_prediction", "nutrition_tips"]
});
```

**GET /ai/insights**
```javascript
// Get saved insights
const response = await api.get('/ai/insights?limit=10');
```

**PATCH /ai/insights/:id/read**
```javascript
// Mark insight as read
const response = await api.patch('/ai/insights/insight123/read');
```

**GET /ai/quick-tip**
```javascript
// Get quick health tip
const response = await api.get('/ai/quick-tip?topic=menstrual+health');
```

**GET /ai/insight-types**
```javascript
// Get available insight types
const response = await api.get('/ai/insight-types');
```

### User Management Endpoints

**GET /users/profile**
```javascript
// Get user profile
const response = await api.get('/users/profile');
```

**PUT /users/profile**
```javascript
// Update user profile
const profileUpdate = {
  display_name: "Jane Doe",
  birth_date: "1990-01-01",
  weight: 65,
  height: 170,
  time_zone: "America/New_York",
  language: "en"
};

const response = await api.put('/users/profile', profileUpdate);
```

**GET /users/dashboard**
```javascript
// Get dashboard data
const response = await api.get('/users/dashboard');
// Returns summary of all user data with statistics
```

**GET /users/settings**
```javascript
// Get user settings
const response = await api.get('/users/settings');
```

**PUT /users/settings**
```javascript
// Update user settings
const settings = {
  notifications: {
    period_reminders: true,
    health_insights: false
  },
  preferences: {
    theme: "dark",
    language: "es"
  }
};

const response = await api.put('/users/settings', settings);
```

**GET /users/data-summary**
```javascript
// Get all user data (for export)
const response = await api.get('/users/data-summary');
```

**DELETE /users/account**
```javascript
// Delete user account (requires email confirmation)
const response = await api.delete('/users/account', {
  confirm_email: "user@example.com"
});
```

## Request & Response Formats

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Error description",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "statusCode": 400
}
```

### HTTP Status Codes
- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Error Handling

### Frontend Error Handler
```javascript
class APIError extends Error {
  constructor(message, statusCode, timestamp) {
    super(message);
    this.statusCode = statusCode;
    this.timestamp = timestamp;
  }
}

// Enhanced request method with error handling
async function makeAPIRequest(endpoint, options) {
  try {
    const response = await api.request(endpoint, options);
    return response;
  } catch (error) {
    // Handle different error types
    if (error.statusCode === 401) {
      // Token expired, refresh and retry
      await auth.currentUser.getIdToken(true);
      return makeAPIRequest(endpoint, options);
    } else if (error.statusCode === 429) {
      // Rate limited
      console.error('Rate limited. Please wait before retrying.');
      throw new APIError('Too many requests', 429);
    } else if (error.statusCode >= 500) {
      // Server error
      console.error('Server error:', error.message);
      throw new APIError('Server error. Please try again later.', error.statusCode);
    } else {
      // Client error
      throw error;
    }
  }
}
```

### Common Error Scenarios

1. **Expired Token**
```javascript
// Auto-refresh token on 401
auth.onIdTokenChanged(async (user) => {
  if (user) {
    const token = await user.getIdToken();
    // Update stored token
  }
});
```

2. **Network Errors**
```javascript
// Implement retry logic
async function retryRequest(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

3. **Validation Errors**
```javascript
// Handle validation errors
try {
  await api.post('/health-data/cycles', invalidData);
} catch (error) {
  if (error.statusCode === 400) {
    // Show validation error to user
    console.error('Validation error:', error.message);
  }
}
```

## Code Examples

### Complete React Example

```jsx
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// API Service
class LunaraService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    this.auth = getAuth();
  }

  async getAuthHeaders() {
    const token = await this.auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async fetchCycles() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/health-data/cycles`, { headers });
    if (!response.ok) throw new Error('Failed to fetch cycles');
    return response.json();
  }

  async createCycle(cycleData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/health-data/cycles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(cycleData)
    });
    if (!response.ok) throw new Error('Failed to create cycle');
    return response.json();
  }

  async generateInsight(type = 'general_health') {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/ai/generate-insight`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type })
    });
    if (!response.ok) throw new Error('Failed to generate insight');
    return response.json();
  }
}

// React Component
function HealthDashboard() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lunaraService = new LunaraService();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const response = await lunaraService.fetchCycles();
          setCycles(response.data.cycles);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        // Redirect to login
        window.location.href = '/login';
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddCycle = async (cycleData) => {
    try {
      const response = await lunaraService.createCycle(cycleData);
      setCycles([...cycles, response.data]);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>My Health Dashboard</h1>
      <div>
        {cycles.map(cycle => (
          <div key={cycle.id}>
            <p>Start Date: {cycle.start_date}</p>
            <p>Duration: {cycle.period_duration} days</p>
            <p>Current Phase: {cycle.current_phase}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Flutter Example

```dart
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:convert';

class LunaraAPI {
  static const String baseUrl = 'http://localhost:3000/api';
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<Map<String, String>> _getHeaders() async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Not authenticated');
    
    final token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> getCycles() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/health-data/cycles'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load cycles');
    }
  }

  Future<Map<String, dynamic>> createCycle(Map<String, dynamic> cycleData) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/health-data/cycles'),
      headers: headers,
      body: json.encode(cycleData),
    );

    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to create cycle');
    }
  }

  Future<Map<String, dynamic>> generateInsight(String type) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/ai/generate-insight'),
      headers: headers,
      body: json.encode({'type': type}),
    );

    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to generate insight');
    }
  }
}

// Usage in Flutter Widget
class HealthScreen extends StatefulWidget {
  @override
  _HealthScreenState createState() => _HealthScreenState();
}

class _HealthScreenState extends State<HealthScreen> {
  final LunaraAPI api = LunaraAPI();
  List<dynamic> cycles = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCycles();
  }

  Future<void> _loadCycles() async {
    try {
      final response = await api.getCycles();
      setState(() {
        cycles = response['data']['cycles'];
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading cycles: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    return ListView.builder(
      itemCount: cycles.length,
      itemBuilder: (context, index) {
        final cycle = cycles[index];
        return ListTile(
          title: Text('Cycle started: ${cycle['start_date']}'),
          subtitle: Text('Duration: ${cycle['period_duration']} days'),
          trailing: Text('Phase: ${cycle['current_phase']}'),
        );
      },
    );
  }
}
```

## Best Practices

### 1. Token Management
- Store tokens securely (never in localStorage for web)
- Refresh tokens before they expire
- Implement token refresh in interceptors

### 2. Data Caching
```javascript
// Simple cache implementation
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
}

const cache = new CacheManager();

// Use cache in API calls
async function getCachedCycles() {
  const cacheKey = 'cycles';
  const cached = cache.get(cacheKey);
  
  if (cached) return cached;
  
  const response = await api.get('/health-data/cycles');
  cache.set(cacheKey, response);
  return response;
}
```

### 3. Optimistic Updates
```javascript
// Update UI before API call completes
async function updateCycleOptimistically(cycleId, updates) {
  // Update local state immediately
  setCycles(cycles.map(c => 
    c.id === cycleId ? { ...c, ...updates } : c
  ));
  
  try {
    // Make API call
    await api.put(`/health-data/cycles/${cycleId}`, updates);
  } catch (error) {
    // Revert on failure
    setCycles(originalCycles);
    throw error;
  }
}
```

### 4. Batch Operations
```javascript
// Batch multiple requests
async function batchHealthDataFetch() {
  const [cycles, nutrition, fitness, insights] = await Promise.all([
    api.get('/health-data/cycles'),
    api.get('/health-data/nutrition'),
    api.get('/health-data/fitness'),
    api.get('/ai/insights')
  ]);
  
  return { cycles, nutrition, fitness, insights };
}
```

### 5. Error Boundaries (React)
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('API Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please refresh the page.</h1>;
    }
    
    return this.props.children;
  }
}
```

## Rate Limiting

The API implements rate limiting:
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Check `X-RateLimit-*` headers in responses
- **429 Status**: When rate limit exceeded

### Handling Rate Limits
```javascript
// Check rate limit headers
function checkRateLimit(response) {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (remaining && parseInt(remaining) < 10) {
    console.warn(`Rate limit warning: ${remaining} requests remaining`);
  }
  
  return {
    remaining: parseInt(remaining),
    reset: new Date(parseInt(reset) * 1000)
  };
}
```

## Security Considerations

### 1. Never expose sensitive data
- Don't store tokens in localStorage (use sessionStorage or cookies with httpOnly)
- Don't log tokens or sensitive health data
- Use HTTPS in production

### 2. Validate user input
```javascript
// Client-side validation example
function validateCycleData(data) {
  const errors = {};
  
  if (!data.start_date) {
    errors.start_date = 'Start date is required';
  }
  
  if (data.period_duration < 1 || data.period_duration > 10) {
    errors.period_duration = 'Period duration must be between 1-10 days';
  }
  
  if (data.cycle_length < 21 || data.cycle_length > 35) {
    errors.cycle_length = 'Cycle length must be between 21-35 days';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
}
```

### 3. Implement CSRF protection
```javascript
// Add CSRF token to requests
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

if (csrfToken) {
  headers['X-CSRF-Token'] = csrfToken;
}
```

### 4. Sanitize display data
```javascript
// Sanitize user-generated content
function sanitizeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Use when displaying user notes
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(cycle.notes) }} />
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if user is logged in
   - Verify token is included in Authorization header
   - Try refreshing the token

2. **403 Forbidden**
   - User trying to access another user's data
   - Check Firebase Auth configuration

3. **400 Bad Request**
   - Validation error - check request body
   - Missing required fields
   - Invalid data format

4. **500 Internal Server Error**
   - Backend service issue
   - Check if Firebase/OpenAI services are configured
   - Contact backend support

### Debug Mode
```javascript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  // Log all API requests
  api.request = new Proxy(api.request, {
    apply: async (target, thisArg, args) => {
      console.log('API Request:', args[0], args[1]);
      const result = await target.apply(thisArg, args);
      console.log('API Response:', result);
      return result;
    }
  });
}
```

## Migration Guide

If migrating from another backend:

1. **Update Authentication**
   - Switch to Firebase Auth
   - Migrate user accounts
   - Update token handling

2. **Update API Endpoints**
   - Map old endpoints to new ones
   - Update request/response handling
   - Handle new response format

3. **Update Data Models**
   - Align with new data structures
   - Handle field mappings
   - Update validation rules

## Support

For backend issues:
- Check server logs
- Verify environment variables
- Ensure Firebase project is configured correctly
- Check API documentation for updates

For integration issues:
- Verify authentication flow
- Check network requests in browser DevTools
- Validate request format matches API expectations
- Test with Postman or similar tools first