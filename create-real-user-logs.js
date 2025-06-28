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
  const today = new Date();
  
  try {
    // Create a fitness log
    const fitnessLog = {
      user_id: userId,
      date: admin.firestore.Timestamp.fromDate(today),
      activity_type: 'cardio',
      activity_name: 'Morning Run',
      duration_minutes: 30,
      calories_burned: 250,
      intensity: 'moderate',
      notes: 'Great morning run\!',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const fitnessRef = await db.collection('fitness_logs').add(fitnessLog);
    console.log('Created fitness log:', fitnessRef.id);
    
    // Create a nutrition log
    const nutritionLog = {
      user_id: userId,
      date: admin.firestore.Timestamp.fromDate(today),
      meal_type: 'breakfast',
      food_name: 'Oatmeal with fruits',
      calories: 350,
      protein: 12,
      carbs: 60,
      fat: 8,
      notes: 'Healthy breakfast',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const nutritionRef = await db.collection('nutrition_logs').add(nutritionLog);
    console.log('Created nutrition log:', nutritionRef.id);
    
    // Create another nutrition log
    const nutritionLog2 = {
      user_id: userId,
      date: admin.firestore.Timestamp.fromDate(today),
      meal_type: 'lunch',
      food_name: 'Grilled Chicken Salad',
      calories: 420,
      protein: 35,
      carbs: 25,
      fat: 18,
      notes: 'Light lunch',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const nutritionRef2 = await db.collection('nutrition_logs').add(nutritionLog2);
    console.log('Created nutrition log 2:', nutritionRef2.id);
    
    // Create a mental health log
    const mentalHealthLog = {
      user_id: userId,
      date: admin.firestore.Timestamp.fromDate(today),
      mood_rating: 8,
      stress_level: 3,
      anxiety_level: 2,
      energy_level: 9,
      sleep_quality: 8,
      symptoms: ['happy', 'energetic'],
      notes: 'Feeling great today\!',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const mentalRef = await db.collection('mental_health_logs').add(mentalHealthLog);
    console.log('Created mental health log:', mentalRef.id);
    
    console.log('\nAll logs created successfully for user:', userId);
    
  } catch (error) {
    console.error('Error creating logs:', error);
  }
  
  process.exit(0);
}

createTestLogs();
