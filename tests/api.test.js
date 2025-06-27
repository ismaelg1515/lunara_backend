const request = require('supertest');
const express = require('express');

// Mock Firebase Admin para tests
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com'
    })
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn()
  }))
}));

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Test AI response'
            }
          }]
        })
      }
    }
  }));
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
process.env.OPENAI_API_KEY = 'test-openai-key';

describe('🌙 Lunara Backend API Tests', () => {
  let app;

  beforeAll(async () => {
    // Importar la app después de configurar los mocks
    delete require.cache[require.resolve('../src/app.js')];
    const appModule = require('../src/app.js');
    app = appModule.app; // Extraer solo la app de Express
    
    // Esperar un poco para que la app se inicialice
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('📍 System Endpoints', () => {
    test('GET / should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Lunara Backend API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('healthData');
      expect(response.body.endpoints).toHaveProperty('aiInsights');
    });

    test('GET /api/health should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Server is healthy');
      expect(response.body.data).toHaveProperty('status', 'OK');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data.services).toHaveProperty('firebase');
      expect(response.body.data.services).toHaveProperty('firestore');
      expect(response.body.data.services).toHaveProperty('openai');
    });

    test('GET /nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('statusCode', 404);
    });
  });

  describe('🔒 Authentication', () => {
    test('Protected endpoints should require authentication', async () => {
      const protectedEndpoints = [
        '/api/health-data/cycles',
        '/api/health-data/nutrition',
        '/api/health-data/fitness',
        '/api/health-data/mental-health',
        '/api/ai/insights'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toContain('Firebase token required');
      }
    });

    test('Invalid token should be rejected', async () => {
      const response = await request(app)
        .get('/api/health-data/cycles')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid or expired token');
    });
  });

  describe('🩸 Health Data Endpoints', () => {
    const validToken = 'valid-test-token';

    // Mock del middleware de autenticación para tests
    beforeEach(() => {
      // Este es un hack para tests - en producción el token real se valida
      jest.clearAllMocks();
    });

    test('GET /api/health-data/cycles should handle database unavailable', async () => {
      const response = await request(app)
        .get('/api/health-data/cycles')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Database service unavailable');
    });

    test('POST /api/health-data/cycles should validate cycle data', async () => {
      const invalidCycleData = {
        start_date: 'invalid-date',
        cycle_length: 'not-a-number'
      };

      const response = await request(app)
        .post('/api/health-data/cycles')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidCycleData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Validation failed');
    });
  });

  describe('🤖 AI Endpoints', () => {
    const validToken = 'valid-test-token';

    test('GET /api/ai/insight-types should return available types', async () => {
      const response = await request(app)
        .get('/api/ai/insight-types')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('insight_types');
      expect(Array.isArray(response.body.data.insight_types)).toBe(true);
    });

    test('GET /api/ai/quick-tip should return a tip', async () => {
      const response = await request(app)
        .get('/api/ai/quick-tip?topic=nutrition')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('tip');
      expect(response.body.data).toHaveProperty('topic', 'nutrition');
    });
  });

  describe('📊 Response Format', () => {
    test('All successful responses should follow standard format', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Verificar formato estándar de respuesta
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      
      // Verificar tipos
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
    });

    test('All error responses should follow standard format', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      // Verificar formato estándar de error
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('timestamp');
      
      // Verificar tipos
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.statusCode).toBe('number');
      expect(typeof response.body.timestamp).toBe('string');
    });
  });

  describe('🛡️ Security Headers', () => {
    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Verificar headers de seguridad (Helmet)
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    test('Should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // En desarrollo, CORS debería permitir cualquier origen
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('⚡ Performance & Reliability', () => {
    test('Health endpoint should respond quickly', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Menos de 1 segundo
    });

    test('Multiple concurrent requests should be handled', async () => {
      const requests = Array(5).fill().map(() => 
        request(app).get('/api/health').expect(200)
      );

      const responses = await Promise.all(requests);
      
      // Todos deberían ser exitosos
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });
  });
});