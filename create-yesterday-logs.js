const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestLogs() {
  const userId = 'clHzrFe0jZOAnWWtZzAR3pzy2im1'; // Real user ID
  
  // Create logs for June 27, 2025
  const june27 = new Date('2025-06-27T12:00:00');
  
  try {
    // Create a nutrition log for June 27
    const nutritionLog = {
      user_id: userId,
      date: admin.firestore.Timestamp.fromDate(june27),
      meal_type: 'dinner',
      food_name: 'Pasta with vegetables',
      calories: 500,
      protein: 15,
      carbs: 70,
      fat: 20,
      notes: 'June 27 dinner',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const nutritionRef = await db.collection('nutrition_logs').add(nutritionLog);
    console.log('Created nutrition log for June 27:', nutritionRef.id);
    
    // Create a fitness log for June 27
    const fitnessLog = {
      user_id: userId,
      date: admin.firestore.Timestamp.fromDate(june27),
      activity_type: 'strength',
      activity_name: 'Weight Training',
      duration_minutes: 45,
      calories_burned: 300,
      intensity: 'high',
      notes: 'June 27 workout',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const fitnessRef = await db.collection('fitness_logs').add(fitnessLog);
    console.log('Created fitness log for June 27:', fitnessRef.id);
    
    console.log('\nLogs created for June 27, 2025');
    
  } catch (error) {
    console.error('Error creating logs:', error);
  }
  
  process.exit(0);
}

createTestLogs();
