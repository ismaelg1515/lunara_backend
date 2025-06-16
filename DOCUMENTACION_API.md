# 🌙 API Backend Lunara - Documentación Completa

## Descripción General

La **API Backend de Lunara** es una API REST robusta diseñada para aplicaciones de seguimiento de salud femenina. Proporciona operaciones CRUD completas para seguimiento del ciclo menstrual, registro nutricional, monitoreo de fitness y evaluación de salud mental, mejorada con perspectivas personalizadas impulsadas por IA usando OpenAI.

### Key Features
- 🩸 **Menstrual Cycle Tracking** - Complete cycle management with phase calculation
- 🍎 **Nutrition Logging** - Meal tracking with calorie counting
- 🏃 **Fitness Monitoring** - Workout logging with duration and intensity
- 🧠 **Mental Health Assessment** - Mood and stress level tracking
- 🤖 **AI-Powered Insights** - Personalized health recommendations
- 🔒 **Firebase Authentication** - Secure token-based user authentication
- 📊 **Health Analytics** - Statistics and data aggregation

## Architecture

```
Flutter App → Firebase Auth → Backend API → Firestore Database
     ↓              ↓              ↓              ↓
  UI/UX        JWT Tokens     CRUD + AI      Health Data
```

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth (JWT tokens)
- **AI Service**: OpenAI GPT-3.5-turbo
- **Security**: Helmet, CORS, Rate limiting

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

All API endpoints (except health checks) require Firebase authentication.

### Headers Required
```javascript
{
  "Authorization": "Bearer <firebase_jwt_token>",
  "Content-Type": "application/json"
}
```

### Flutter Implementation Example
```dart
// Get Firebase token
String? token = await FirebaseAuth.instance.currentUser?.getIdToken();

// Add to headers
Map<String, String> headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer $token',
};
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "statusCode": 400
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

# API Endpoints

## 🏥 Health Check

### GET `/api/health`
Get server health status and service connectivity.

**Response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "OK",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "environment": "development",
    "services": {
      "firebase": true,
      "firestore": true,
      "openai": true
    },
    "version": "1.0.0",
    "uptime": 12345.67
  }
}
```

---

## 🩸 Menstrual Cycles

### GET `/api/health-data/cycles`
Get user's menstrual cycles with automatic phase calculation.

**Query Parameters:**
- `limit` (optional): Number of cycles to return (default: 50, max: 100)

**Flutter Example:**
```dart
Future<List<Cycle>> getCycles({int limit = 50}) async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/health-data/cycles?limit=$limit'),
    headers: await getAuthHeaders(),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return data['data']['cycles'].map<Cycle>((json) => Cycle.fromJson(json)).toList();
  }
  throw Exception('Failed to load cycles');
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cycles retrieved successfully",
  "data": {
    "cycles": [
      {
        "id": "cycle_id_123",
        "user_id": "user_firebase_uid",
        "start_date": "2024-01-15T00:00:00.000Z",
        "cycle_length": 28,
        "period_duration": 5,
        "symptoms": ["cramping", "fatigue"],
        "flow_intensity": "medium",
        "notes": "Feeling good overall",
        "current_phase": "follicular",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "count": 1,
    "user_id": "user_firebase_uid"
  }
}
```

### POST `/api/health-data/cycles`
Create a new menstrual cycle entry.

**Request Body:**
```json
{
  "start_date": "2024-01-15T00:00:00.000Z",
  "cycle_length": 28,
  "period_duration": 5,
  "symptoms": ["cramping", "fatigue"],
  "flow_intensity": "medium",
  "notes": "Optional notes"
}
```

**Required Fields:**
- `start_date`: ISO date string

**Optional Fields:**
- `cycle_length`: Number (21-35 days)
- `period_duration`: Number (2-8 days)
- `symptoms`: Array of strings
- `flow_intensity`: String ("light", "medium", "heavy")
- `notes`: String

**Flutter Example:**
```dart
Future<Cycle> createCycle(CycleData cycleData) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/health-data/cycles'),
    headers: await getAuthHeaders(),
    body: json.encode(cycleData.toJson()),
  );
  
  if (response.statusCode == 201) {
    final data = json.decode(response.body);
    return Cycle.fromJson(data['data']);
  }
  throw Exception('Failed to create cycle');
}
```

### GET `/api/health-data/cycles/:id`
Get a specific cycle by ID.

### PUT `/api/health-data/cycles/:id`
Update a specific cycle (user must own the cycle).

### DELETE `/api/health-data/cycles/:id`
Delete a specific cycle (user must own the cycle).

---

## 🍎 Nutrition Logs

### GET `/api/health-data/nutrition`
Get user's nutrition logs.

**Query Parameters:**
- `date` (optional): Filter by specific date (YYYY-MM-DD format)
- `limit` (optional): Number of logs to return (default: 30, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Nutrition logs retrieved successfully",
  "data": {
    "nutrition_logs": [
      {
        "id": "nutrition_id_123",
        "user_id": "user_firebase_uid",
        "log_date": "2024-01-15T08:00:00.000Z",
        "meal_type": "breakfast",
        "food_items": ["oatmeal", "banana", "almonds"],
        "calories": 350,
        "protein_grams": 12,
        "carbs_grams": 45,
        "fat_grams": 8,
        "notes": "Healthy start to the day",
        "created_at": "2024-01-15T08:30:00.000Z"
      }
    ],
    "count": 1,
    "date_filter": "2024-01-15",
    "user_id": "user_firebase_uid"
  }
}
```

### POST `/api/health-data/nutrition`
Create a new nutrition log entry.

**Request Body:**
```json
{
  "log_date": "2024-01-15T08:00:00.000Z",
  "meal_type": "breakfast",
  "food_items": ["oatmeal", "banana", "almonds"],
  "calories": 350,
  "protein_grams": 12,
  "carbs_grams": 45,
  "fat_grams": 8,
  "notes": "Healthy breakfast"
}
```

**Required Fields:**
- `log_date`: ISO date string
- `meal_type`: String ("breakfast", "lunch", "dinner", "snack", "other")

**Flutter Example:**
```dart
Future<NutritionLog> logNutrition(NutritionData nutritionData) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/health-data/nutrition'),
    headers: await getAuthHeaders(),
    body: json.encode(nutritionData.toJson()),
  );
  
  if (response.statusCode == 201) {
    final data = json.decode(response.body);
    return NutritionLog.fromJson(data['data']);
  }
  throw Exception('Failed to log nutrition');
}
```

---

## 🏃 Fitness Logs

### GET `/api/health-data/fitness`
Get user's fitness logs.

**Response:**
```json
{
  "success": true,
  "message": "Fitness logs retrieved successfully",
  "data": {
    "fitness_logs": [
      {
        "id": "fitness_id_123",
        "user_id": "user_firebase_uid",
        "activity_type": "running",
        "duration_minutes": 30,
        "calories_burned": 250,
        "intensity_level": 4,
        "notes": "Morning jog in the park",
        "logged_at": "2024-01-15T07:00:00.000Z",
        "created_at": "2024-01-15T07:30:00.000Z"
      }
    ],
    "count": 1,
    "user_id": "user_firebase_uid"
  }
}
```

### POST `/api/health-data/fitness`
Create a new fitness log entry.

**Request Body:**
```json
{
  "activity_type": "running",
  "duration_minutes": 30,
  "calories_burned": 250,
  "intensity_level": 4,
  "notes": "Morning jog"
}
```

**Required Fields:**
- `activity_type`: String
- `duration_minutes`: Number (1-480 minutes)

**Optional Fields:**
- `calories_burned`: Number (0-2000)
- `intensity_level`: Number (1-5)
- `notes`: String

---

## 🧠 Mental Health Logs

### GET `/api/health-data/mental-health`
Get user's mental health logs.

**Response:**
```json
{
  "success": true,
  "message": "Mental health logs retrieved successfully",
  "data": {
    "mental_health_logs": [
      {
        "id": "mental_id_123",
        "user_id": "user_firebase_uid",
        "mood_rating": 7,
        "stress_level": 3,
        "energy_level": 6,
        "sleep_hours": 8,
        "notes": "Feeling good today",
        "logged_at": "2024-01-15T09:00:00.000Z",
        "created_at": "2024-01-15T09:15:00.000Z"
      }
    ],
    "count": 1,
    "user_id": "user_firebase_uid"
  }
}
```

### POST `/api/health-data/mental-health`
Create a new mental health log entry.

**Request Body:**
```json
{
  "mood_rating": 7,
  "stress_level": 3,
  "energy_level": 6,
  "sleep_hours": 8,
  "notes": "Feeling good today"
}
```

**Required Fields:**
- `mood_rating`: Number (1-10)

**Optional Fields:**
- `stress_level`: Number (1-10)
- `energy_level`: Number (1-10)
- `sleep_hours`: Number
- `notes`: String

---

## 📊 Health Analytics

### GET `/api/health-data/summary`
Get comprehensive health data summary for the user.

**Response:**
```json
{
  "success": true,
  "message": "Health data summary retrieved successfully",
  "data": {
    "latest_cycle": {
      "id": "cycle_id_123",
      "start_date": "2024-01-15T00:00:00.000Z",
      "current_phase": "follicular"
    },
    "recent_nutrition": [...],
    "recent_fitness": [...],
    "recent_mental_health": [...],
    "user_id": "user_firebase_uid",
    "generated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET `/api/health-data/stats`
Get detailed health statistics and averages.

**Response:**
```json
{
  "success": true,
  "message": "Health statistics retrieved successfully",
  "data": {
    "cycles": {
      "total_tracked": 12,
      "average_cycle_length": 28.5,
      "average_period_duration": 5.2
    },
    "nutrition": {
      "total_logs": 90,
      "average_calories_per_day": 1850
    },
    "fitness": {
      "total_workouts": 45,
      "total_minutes": 1350,
      "average_duration": 30
    },
    "mental_health": {
      "total_logs": 30,
      "average_mood": 7.2,
      "average_stress": 4.1
    },
    "user_id": "user_firebase_uid",
    "generated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🤖 AI Insights

### GET `/api/ai/insight-types`
Get available AI insight types.

**Response:**
```json
{
  "success": true,
  "message": "Insight types retrieved successfully",
  "data": {
    "insight_types": [
      {
        "key": "GENERAL_HEALTH",
        "value": "general_health",
        "description": "General health and wellness advice"
      },
      {
        "key": "CYCLE_PREDICTION",
        "value": "cycle_prediction",
        "description": "Menstrual cycle predictions and tips"
      },
      {
        "key": "NUTRITION_ADVICE",
        "value": "nutrition_advice",
        "description": "Personalized nutrition recommendations"
      },
      {
        "key": "FITNESS_SUGGESTION",
        "value": "fitness_suggestion",
        "description": "Exercise suggestions based on cycle phase"
      },
      {
        "key": "MOOD_ANALYSIS",
        "value": "mood_analysis",
        "description": "Mood and mental health insights"
      }
    ],
    "count": 5
  }
}
```

### POST `/api/ai/generate-insight`
Generate a personalized AI insight.

**Request Body:**
```json
{
  "type": "cycle_prediction"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI insight generated successfully",
  "data": {
    "id": "insight_id_123",
    "user_id": "user_firebase_uid",
    "type": "cycle_prediction",
    "title": "Cycle Prediction & Tips",
    "content": "Based on your recent cycle data showing an average length of 28 days...",
    "confidence_score": 0.8,
    "generated_at": "2024-01-15T10:30:00.000Z",
    "expires_at": "2024-01-22T10:30:00.000Z",
    "is_read": false,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET `/api/ai/insights`
Get user's AI insights history.

**Query Parameters:**
- `limit` (optional): Number of insights to return (default: 10)

### PATCH `/api/ai/insights/:id/read`
Mark an insight as read.

### GET `/api/ai/quick-tip`
Get a quick health tip.

**Query Parameters:**
- `topic` (optional): Topic for the tip (default: "menstrual health")

**Response:**
```json
{
  "success": true,
  "message": "Quick tip generated successfully",
  "data": {
    "tip": "Stay hydrated and maintain a balanced diet rich in iron during your menstrual cycle.",
    "topic": "menstrual health",
    "source": "ai_generated",
    "generated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

# Flutter Integration

## Setup

### 1. Add Dependencies
```yaml
dependencies:
  http: ^1.1.0
  firebase_auth: ^4.15.3
  firebase_core: ^2.24.2
```

### 2. API Service Class
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class LunaraApiService {
  static const String baseUrl = 'http://localhost:3000'; // Update for production
  
  Future<Map<String, String>> _getHeaders() async {
    final user = FirebaseAuth.instance.currentUser;
    final token = await user?.getIdToken();
    
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }
  
  Future<http.Response> get(String endpoint) async {
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _getHeaders(),
    );
    return response;
  }
  
  Future<http.Response> post(String endpoint, Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _getHeaders(),
      body: json.encode(data),
    );
    return response;
  }
  
  Future<http.Response> put(String endpoint, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _getHeaders(),
      body: json.encode(data),
    );
    return response;
  }
  
  Future<http.Response> delete(String endpoint) async {
    final response = await http.delete(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _getHeaders(),
    );
    return response;
  }
}
```

### 3. Model Classes
```dart
class Cycle {
  final String id;
  final String userId;
  final DateTime startDate;
  final int? cycleLength;
  final int? periodDuration;
  final List<String>? symptoms;
  final String? flowIntensity;
  final String? notes;
  final String? currentPhase;
  final DateTime createdAt;
  final DateTime updatedAt;

  Cycle({
    required this.id,
    required this.userId,
    required this.startDate,
    this.cycleLength,
    this.periodDuration,
    this.symptoms,
    this.flowIntensity,
    this.notes,
    this.currentPhase,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Cycle.fromJson(Map<String, dynamic> json) {
    return Cycle(
      id: json['id'],
      userId: json['user_id'],
      startDate: DateTime.parse(json['start_date']),
      cycleLength: json['cycle_length'],
      periodDuration: json['period_duration'],
      symptoms: json['symptoms']?.cast<String>(),
      flowIntensity: json['flow_intensity'],
      notes: json['notes'],
      currentPhase: json['current_phase'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'start_date': startDate.toIso8601String(),
      'cycle_length': cycleLength,
      'period_duration': periodDuration,
      'symptoms': symptoms,
      'flow_intensity': flowIntensity,
      'notes': notes,
    };
  }
}
```

### 4. Repository Pattern
```dart
class CycleRepository {
  final LunaraApiService _apiService = LunaraApiService();

  Future<List<Cycle>> getCycles({int limit = 50}) async {
    final response = await _apiService.get('/api/health-data/cycles?limit=$limit');
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final cycles = data['data']['cycles'] as List;
      return cycles.map((cycle) => Cycle.fromJson(cycle)).toList();
    } else {
      throw Exception('Failed to load cycles: ${response.body}');
    }
  }

  Future<Cycle> createCycle(Map<String, dynamic> cycleData) async {
    final response = await _apiService.post('/api/health-data/cycles', cycleData);
    
    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      return Cycle.fromJson(data['data']);
    } else {
      throw Exception('Failed to create cycle: ${response.body}');
    }
  }

  Future<Cycle> updateCycle(String id, Map<String, dynamic> cycleData) async {
    final response = await _apiService.put('/api/health-data/cycles/$id', cycleData);
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Cycle.fromJson(data['data']);
    } else {
      throw Exception('Failed to update cycle: ${response.body}');
    }
  }

  Future<void> deleteCycle(String id) async {
    final response = await _apiService.delete('/api/health-data/cycles/$id');
    
    if (response.statusCode != 200) {
      throw Exception('Failed to delete cycle: ${response.body}');
    }
  }
}
```

## Error Handling

```dart
class ApiException implements Exception {
  final String message;
  final int statusCode;
  
  ApiException(this.message, this.statusCode);
  
  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}

Future<T> handleApiResponse<T>(
  Future<http.Response> Function() apiCall,
  T Function(Map<String, dynamic>) fromJson,
) async {
  try {
    final response = await apiCall();
    final data = json.decode(response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return fromJson(data['data']);
    } else {
      throw ApiException(
        data['error'] ?? 'Unknown error occurred',
        response.statusCode,
      );
    }
  } catch (e) {
    if (e is ApiException) rethrow;
    throw ApiException('Network error: $e', 0);
  }
}
```

## Environment Configuration

### Development
```dart
class Config {
  static const String baseUrl = 'http://localhost:3000';
  static const bool isProduction = false;
}
```

### Production
```dart
class Config {
  static const String baseUrl = 'https://api.lunara-app.com';
  static const bool isProduction = true;
}
```

---

# Rate Limiting

The API implements rate limiting:
- **100 requests per 15 minutes** per IP address
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: When the rate limit resets

---

# Error Codes Reference

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 400 | Bad Request | Invalid request data, validation errors |
| 401 | Unauthorized | Missing or invalid Firebase token |
| 403 | Forbidden | User doesn't own the requested resource |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error, database issues |

---

# Development Setup

## Backend Requirements
- Node.js 18+
- Firebase project with Firestore
- OpenAI API key (optional, for AI features)

## Environment Variables
```env
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your-openai-api-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

## Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health
```

---

This documentation provides everything needed for AI agents and Flutter developers to implement and integrate with the Lunara Backend API successfully.