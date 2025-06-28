const firebaseService = require('./firebase');
const { COLLECTIONS, DEFAULTS } = require('../utils/constants');
const { formatErrorResponse } = require('../utils/helpers');

class FirestoreService {
  constructor() {
    this.db = null;
    this.initializeDatabase();
  }

  /**
   * Initialize Firestore database connection
   */
  initializeDatabase() {
    try {
      if (!firebaseService.isInitialized()) {
        console.warn('⚠️ Firebase not initialized. Firestore service disabled.');
        this.db = null;
        return;
      }
      this.db = firebaseService.getFirestore();
      console.log('✅ Firestore service initialized');
    } catch (error) {
      console.error('❌ Firestore initialization error:', error.message);
      this.db = null;
    }
  }

  // =================== MENSTRUAL CYCLES ===================

  /**
   * Save menstrual cycle data
   * @param {string} userId - User ID
   * @param {Object} cycleData - Cycle data
   * @returns {Promise<Object>} - Saved cycle
   */
  async saveCycle(userId, cycleData) {
    try {
      const docRef = await this.db.collection(COLLECTIONS.CYCLES).add({
        user_id: userId,
        ...cycleData,
        created_at: firebaseService.getServerTimestamp(),
        updated_at: firebaseService.getServerTimestamp()
      });
      return { id: docRef.id, ...cycleData };
    } catch (error) {
      throw new Error(`Error saving cycle: ${error.message}`);
    }
  }

  /**
   * Get user's menstrual cycles
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} - User cycles
   */
  async getCycles(userId, limit = DEFAULTS.DEFAULT_LIMIT) {
    try {
      const snapshot = await this.db.collection(COLLECTIONS.CYCLES)
        .where('user_id', '==', userId)
        .orderBy('start_date', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting cycles: ${error.message}`);
    }
  }

  /**
   * Get cycle by ID
   * @param {string} cycleId - Cycle ID
   * @returns {Promise<Object|null>} - Cycle data
   */
  async getCycleById(cycleId) {
    try {
      const doc = await this.db.collection(COLLECTIONS.CYCLES).doc(cycleId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      throw new Error(`Error getting cycle: ${error.message}`);
    }
  }

  /**
   * Update cycle
   * @param {string} cycleId - Cycle ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated cycle
   */
  async updateCycle(cycleId, updateData) {
    try {
      await this.db.collection(COLLECTIONS.CYCLES).doc(cycleId).update({
        ...updateData,
        updated_at: firebaseService.getServerTimestamp()
      });
      return { id: cycleId, ...updateData };
    } catch (error) {
      throw new Error(`Error updating cycle: ${error.message}`);
    }
  }

  /**
   * Delete cycle
   * @param {string} cycleId - Cycle ID
   * @returns {Promise<void>}
   */
  async deleteCycle(cycleId) {
    try {
      await this.db.collection(COLLECTIONS.CYCLES).doc(cycleId).delete();
    } catch (error) {
      throw new Error(`Error deleting cycle: ${error.message}`);
    }
  }

  // =================== NUTRITION LOGS ===================

  /**
   * Save nutrition log
   * @param {string} userId - User ID
   * @param {Object} nutritionData - Nutrition data
   * @returns {Promise<Object>} - Saved nutrition log
   */
  async saveNutritionLog(userId, nutritionData) {
    try {
      const docRef = await this.db.collection(COLLECTIONS.NUTRITION_LOGS).add({
        user_id: userId,
        ...nutritionData,
        created_at: firebaseService.getServerTimestamp()
      });
      return { id: docRef.id, ...nutritionData };
    } catch (error) {
      throw new Error(`Error saving nutrition log: ${error.message}`);
    }
  }

  /**
   * Get nutrition logs by date
   * @param {string} userId - User ID
   * @param {string} date - Date filter (YYYY-MM-DD)
   * @param {number} limit - Number of records
   * @returns {Promise<Array>} - Nutrition logs
   */
  async getNutritionLogs(userId, date = null, limit = DEFAULTS.DEFAULT_LIMIT) {
    try {
      let query = this.db.collection(COLLECTIONS.NUTRITION_LOGS)
        .where('user_id', '==', userId);
      
      // Temporarily disable date filtering to debug
      // TODO: Fix date filtering with proper timezone handling
      
      const snapshot = await query.orderBy('created_at', 'desc')
                                 .limit(limit)
                                 .get();
      
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // If date filter provided, filter results in memory
      if (date) {
        const filterDate = new Date(date);
        const filterDateStr = filterDate.toISOString().split('T')[0];
        
        results = results.filter(log => {
          if (log.log_date) {
            const logDate = new Date(log.log_date._seconds ? log.log_date._seconds * 1000 : log.log_date);
            const logDateStr = logDate.toISOString().split('T')[0];
            return logDateStr === filterDateStr;
          }
          return false;
        });
      }
      
      return results;
    } catch (error) {
      throw new Error(`Error getting nutrition logs: ${error.message}`);
    }
  }

  // =================== FITNESS LOGS ===================

  /**
   * Save fitness log
   * @param {string} userId - User ID
   * @param {Object} fitnessData - Fitness data
   * @returns {Promise<Object>} - Saved fitness log
   */
  async saveFitnessLog(userId, fitnessData) {
    try {
      const docRef = await this.db.collection(COLLECTIONS.FITNESS_LOGS).add({
        user_id: userId,
        ...fitnessData,
        created_at: firebaseService.getServerTimestamp()
      });
      return { id: docRef.id, ...fitnessData };
    } catch (error) {
      throw new Error(`Error saving fitness log: ${error.message}`);
    }
  }

  /**
   * Get fitness logs
   * @param {string} userId - User ID
   * @param {number} limit - Number of records
   * @returns {Promise<Array>} - Fitness logs
   */
  async getFitnessLogs(userId, limit = DEFAULTS.DEFAULT_LIMIT) {
    try {
      const snapshot = await this.db.collection(COLLECTIONS.FITNESS_LOGS)
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting fitness logs: ${error.message}`);
    }
  }

  // =================== MENTAL HEALTH LOGS ===================

  /**
   * Save mental health log
   * @param {string} userId - User ID
   * @param {Object} mentalHealthData - Mental health data
   * @returns {Promise<Object>} - Saved mental health log
   */
  async saveMentalHealthLog(userId, mentalHealthData) {
    try {
      const docRef = await this.db.collection(COLLECTIONS.MENTAL_HEALTH_LOGS).add({
        user_id: userId,
        ...mentalHealthData,
        created_at: firebaseService.getServerTimestamp()
      });
      return { id: docRef.id, ...mentalHealthData };
    } catch (error) {
      throw new Error(`Error saving mental health log: ${error.message}`);
    }
  }

  /**
   * Get mental health logs
   * @param {string} userId - User ID
   * @param {number} limit - Number of records
   * @returns {Promise<Array>} - Mental health logs
   */
  async getMentalHealthLogs(userId, limit = DEFAULTS.DEFAULT_LIMIT) {
    try {
      const snapshot = await this.db.collection(COLLECTIONS.MENTAL_HEALTH_LOGS)
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting mental health logs: ${error.message}`);
    }
  }

  // =================== AI INSIGHTS ===================

  /**
   * Save AI insight
   * @param {string} userId - User ID
   * @param {Object} insightData - Insight data
   * @returns {Promise<Object>} - Saved insight
   */
  async saveAIInsight(userId, insightData) {
    try {
      const docRef = await this.db.collection(COLLECTIONS.AI_INSIGHTS).add({
        user_id: userId,
        ...insightData,
        is_read: false,
        created_at: firebaseService.getServerTimestamp()
      });
      return { id: docRef.id, ...insightData };
    } catch (error) {
      throw new Error(`Error saving AI insight: ${error.message}`);
    }
  }

  /**
   * Get recent AI insights
   * @param {string} userId - User ID
   * @param {number} limit - Number of records
   * @returns {Promise<Array>} - AI insights
   */
  async getRecentInsights(userId, limit = 10) {
    try {
      const snapshot = await this.db.collection(COLLECTIONS.AI_INSIGHTS)
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting insights: ${error.message}`);
    }
  }

  /**
   * Mark insight as read
   * @param {string} insightId - Insight ID
   * @returns {Promise<void>}
   */
  async markInsightAsRead(insightId) {
    try {
      await this.db.collection(COLLECTIONS.AI_INSIGHTS).doc(insightId).update({
        is_read: true,
        read_at: firebaseService.getServerTimestamp()
      });
    } catch (error) {
      throw new Error(`Error marking insight as read: ${error.message}`);
    }
  }

  // =================== GENERAL QUERIES ===================

  /**
   * Get user's latest data across all collections
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Latest user data
   */
  async getUserLatestData(userId) {
    try {
      const [latestCycle, recentNutrition, recentFitness, recentMentalHealth] = await Promise.all([
        this.getCycles(userId, 1),
        this.getNutritionLogs(userId, null, 5),
        this.getFitnessLogs(userId, 5),
        this.getMentalHealthLogs(userId, 5)
      ]);

      return {
        latest_cycle: latestCycle[0] || null,
        recent_nutrition: recentNutrition,
        recent_fitness: recentFitness,
        recent_mental_health: recentMentalHealth
      };
    } catch (error) {
      throw new Error(`Error getting user latest data: ${error.message}`);
    }
  }

  // =================== COUNT METHODS ===================

  /**
   * Get count of user's cycles
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of cycles
   */
  async getCycleCount(userId) {
    try {
      const snapshot = await this.db.collection(COLLECTIONS.CYCLES)
        .where('user_id', '==', userId)
        .get();
      return snapshot.size;
    } catch (error) {
      throw new Error(`Error getting cycle count: ${error.message}`);
    }
  }

  /**
   * Get count of user's nutrition logs
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of nutrition logs
   */
  async getNutritionLogCount(userId) {
    try {
      const snapshot = await this.db.collection(COLLECTIONS.NUTRITION_LOGS)
        .where('user_id', '==', userId)
        .get();
      return snapshot.size;
    } catch (error) {
      throw new Error(`Error getting nutrition log count: ${error.message}`);
    }
  }

  /**
   * Get count of user's fitness logs
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of fitness logs
   */
  async getFitnessLogCount(userId) {
    try {
      const snapshot = await this.db.collection(COLLECTIONS.FITNESS_LOGS)
        .where('user_id', '==', userId)
        .get();
      return snapshot.size;
    } catch (error) {
      throw new Error(`Error getting fitness log count: ${error.message}`);
    }
  }

  /**
   * Get count of user's mental health logs
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of mental health logs
   */
  async getMentalHealthLogCount(userId) {
    try {
      const snapshot = await this.db.collection(COLLECTIONS.MENTAL_HEALTH_LOGS)
        .where('user_id', '==', userId)
        .get();
      return snapshot.size;
    } catch (error) {
      throw new Error(`Error getting mental health log count: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new FirestoreService(); 