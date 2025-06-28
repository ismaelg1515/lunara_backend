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

async function getUsers() {
  try {
    const usersSnapshot = await db.collection('users').limit(5).get();
    
    console.log('Users in database:');
    usersSnapshot.forEach(doc => {
      console.log(`User ID: ${doc.id}`);
      console.log('Data:', doc.data());
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error getting users:', error);
  }
  
  process.exit(0);
}

getUsers();
