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
  const userId = 'test-user-123'; // You should replace with a real user ID
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  try {
    // Create a fitness log
    const fitnessLog = {
      user_id: userId,
      date: admin.firestore.Timestamp.fromDate(today),
      activity_type: 'cardio',
      activity_name: 'Running',
      duration_minutes: 30,
      calories_burned: 250,
      intensity: 'moderate',
      notes: 'Test fitness log',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const fitnessRef = await db.collection('fitness_logs').add(fitnessLog);
    console.log('Created fitness log:', fitnessRef.id);
    
    // Create a nutrition log
    const nutritionLog = {
      user_id: userId,
      date: admin.firestore.Timestamp.fromDate(today),
      meal_type: 'lunch',
      food_name: 'Chicken Salad',
      calories: 350,
      protein: 30,
      carbs: 20,
      fat: 15,
      notes: 'Test nutrition log',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const nutritionRef = await db.collection('nutrition_logs').add(nutritionLog);
    console.log('Created nutrition log:', nutritionRef.id);
    
    // Create a mental health log
    const mentalHealthLog = {
      user_id: userId,
      date: admin.firestore.Timestamp.fromDate(today),
      mood_rating: 7,
      stress_level: 3,
      anxiety_level: 2,
      energy_level: 8,
      sleep_quality: 8,
      symptoms: ['focused', 'calm'],
      notes: 'Test mental health log',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const mentalRef = await db.collection('mental_health_logs').add(mentalHealthLog);
    console.log('Created mental health log:', mentalRef.id);
    
    console.log('\nAll test logs created successfully\!');
    console.log('Replace the userId with your actual user ID from Firebase Auth');
    
  } catch (error) {
    console.error('Error creating test logs:', error);
  }
  
  process.exit(0);
}

createTestLogs();
