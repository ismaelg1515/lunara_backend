const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/test-ai', (req, res) => {
  const openaiService = require('./src/services/openai');
  res.json({
    aiAvailable: openaiService.isAvailable(),
    apiKeyConfigured: !!process.env.OPENAI_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});