const admin = require('firebase-admin');
require('dotenv').config();

class FirebaseService {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initializeFirebase() {
    try {
      if (this.initialized) {
        console.log('✅ Firebase Admin SDK already initialized');
        return;
      }

      // Firebase configuration from environment variables
      const firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      };

      // Validate required configuration
      if (!firebaseConfig.projectId || !firebaseConfig.privateKey || !firebaseConfig.clientEmail || 
          firebaseConfig.projectId === 'your-firebase-project-id' || 
          firebaseConfig.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.warn('⚠️ Firebase configuration not properly set. Running in development mode without Firebase.');
        this.initialized = false;
        return;
      }

      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
        databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
      });

      this.initialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log(`🔥 Connected to Firebase project: ${firebaseConfig.projectId}`);
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      throw error;
    }
  }

  /**
   * Get Firestore database instance
   * @returns {admin.firestore.Firestore}
   */
  getFirestore() {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }
    return admin.firestore();
  }

  /**
   * Get Firebase Auth instance
   * @returns {admin.auth.Auth}
   */
  getAuth() {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }
    return admin.auth();
  }

  /**
   * Get server timestamp
   * @returns {admin.firestore.FieldValue}
   */
  getServerTimestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
  }

  /**
   * Verify Firebase ID token
   * @param {string} idToken - Firebase ID token
   * @returns {Promise<admin.auth.DecodedIdToken>}
   */
  async verifyIdToken(idToken) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase not initialized');
      }
      
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Token verification error:', error.message);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Check if Firebase is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized;
  }
}

// Export singleton instance
module.exports = new FirebaseService(); 