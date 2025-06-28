const express = require('express');
const app = express();

console.log('Testing express routes...');

// Test basic route
app.get('/', (req, res) => {
  res.json({ test: 'ok' });
});

// Test route with parameter
app.get('/test/:id', (req, res) => {
  res.json({ id: req.params.id });
});

// Test importing routes
try {
  console.log('Testing health routes...');
  const healthRoutes = require('./src/routes/health');
  app.use('/health', healthRoutes);
  console.log('✅ Health routes loaded');
} catch (error) {
  console.log('❌ Health routes error:', error.message);
}

try {
  console.log('Testing AI routes...');
  const aiRoutes = require('./src/routes/ai');
  app.use('/ai', aiRoutes);
  console.log('✅ AI routes loaded');
} catch (error) {
  console.log('❌ AI routes error:', error.message);
}

try {
  console.log('Testing users routes...');
  const usersRoutes = require('./src/routes/users');
  app.use('/users', usersRoutes);
  console.log('✅ Users routes loaded');
} catch (error) {
  console.log('❌ Users routes error:', error.message);
}

console.log('All tests completed.');