const fetch = require('node-fetch');

// Get a test token - you'll need to replace this with a real token
const TOKEN = 'YOUR_FIREBASE_TOKEN_HERE';

async function testAPI() {
  try {
    // Test fitness endpoint
    const fitnessResponse = await fetch('http://localhost:3000/api/health-data/fitness?limit=10', {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Fitness API Status:', fitnessResponse.status);
    const fitnessData = await fitnessResponse.json();
    console.log('Fitness Response:', JSON.stringify(fitnessData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

console.log('To test the API, you need to:');
console.log('1. Open the Flutter app in Chrome');
console.log('2. Open Chrome DevTools (F12)');
console.log('3. Go to Network tab');
console.log('4. Look for any API request to /api/health-data');
console.log('5. Copy the Authorization header value (after "Bearer ")');
console.log('6. Replace YOUR_FIREBASE_TOKEN_HERE in this file with that token');
console.log('7. Run this script again');

// testAPI();
