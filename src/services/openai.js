const OpenAI = require('openai');
const { INSIGHT_TYPES, DEFAULTS } = require('../utils/constants');
const { calculateAge, generateExpiryDate } = require('../utils/helpers');

class OpenAIService {
  constructor() {
    this.openai = null;
    this.initialized = false;
    this.initializeOpenAI();
  }

  /**
   * Initialize OpenAI client
   */
  initializeOpenAI() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OpenAI API key not provided. AI features will be disabled.');
        return;
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      this.initialized = true;
      console.log('✅ OpenAI service initialized');
    } catch (error) {
      console.error('❌ OpenAI initialization error:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Check if OpenAI is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.initialized && this.openai !== null;
  }

  /**
   * Generate personalized health insight
   * @param {Object} userData - User data for context
   * @param {string} insightType - Type of insight to generate
   * @returns {Promise<Object|null>} - Generated insight or null
   */
  async generateHealthInsight(userData, insightType = INSIGHT_TYPES.GENERAL_HEALTH) {
    try {
      if (!this.isAvailable()) {
        console.warn('OpenAI not available. Skipping insight generation.');
        return null;
      }

      const prompt = this.createInsightPrompt(userData, insightType);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert women's health assistant. Provide useful and personalized advice based on user data. Respond in English in a clear and empathetic manner. Focus on health and wellness advice that is evidence-based and supportive."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: DEFAULTS.MAX_INSIGHT_TOKENS,
        temperature: 0.7
      });

      const insightContent = completion.choices[0].message.content;

      return {
        type: insightType,
        title: this.generateInsightTitle(insightType),
        content: insightContent,
        confidence_score: 0.8,
        generated_at: new Date(),
        expires_at: generateExpiryDate(DEFAULTS.INSIGHT_EXPIRY_DAYS)
      };
    } catch (error) {
      console.error('OpenAI insight generation error:', error.message);
      return null;
    }
  }

  /**
   * Create insight prompt based on user data and type
   * @param {Object} userData - User data
   * @param {string} insightType - Type of insight
   * @returns {string} - Generated prompt
   */
  createInsightPrompt(userData, insightType) {
    const age = userData.age || calculateAge(userData.birth_date) || 25;
    const baseInfo = `User: woman, ${age} years old, weight: ${userData.weight || 'not specified'}kg`;
    
    switch (insightType) {
      case INSIGHT_TYPES.CYCLE_PREDICTION:
        return `${baseInfo}. Menstrual cycle data: average duration ${userData.cycle_length || DEFAULTS.CYCLE_LENGTH} days, period duration ${userData.period_duration || DEFAULTS.PERIOD_DURATION} days. Recent symptoms: ${userData.recent_symptoms || 'none'}. Provide personalized advice for the next cycle.`;
      
      case INSIGHT_TYPES.NUTRITION_ADVICE:
        return `${baseInfo}. Recent nutritional log: ${userData.recent_meals || 'not available'}. Provide personalized nutritional advice considering the menstrual cycle phase.`;
      
      case INSIGHT_TYPES.FITNESS_SUGGESTION:
        return `${baseInfo}. Recent physical activity: ${userData.recent_activities || 'not available'}. Cycle phase: ${userData.cycle_phase || 'not specified'}. Suggest appropriate exercises for this phase.`;
      
      case INSIGHT_TYPES.MOOD_ANALYSIS:
        return `${baseInfo}. Recent mood: ${userData.recent_moods || 'not available'}. Stress level: ${userData.stress_level || 'medium'}. Provide advice to improve emotional wellbeing during the cycle.`;
      
      default:
        return `${baseInfo}. Recent health data: cycles tracked, some nutrition and fitness logs. Provide general personalized health advice for a woman in reproductive age, focusing on menstrual health and overall wellness.`;
    }
  }

  /**
   * Generate insight title based on type
   * @param {string} insightType - Type of insight
   * @returns {string} - Insight title
   */
  generateInsightTitle(insightType) {
    const titles = {
      [INSIGHT_TYPES.GENERAL_HEALTH]: 'General Health Insight',
      [INSIGHT_TYPES.CYCLE_PREDICTION]: 'Cycle Prediction & Tips',
      [INSIGHT_TYPES.NUTRITION_ADVICE]: 'Nutrition Recommendations',
      [INSIGHT_TYPES.FITNESS_SUGGESTION]: 'Fitness Suggestions',
      [INSIGHT_TYPES.MOOD_ANALYSIS]: 'Mood & Wellness Analysis'
    };
    
    return titles[insightType] || 'Health Insight';
  }

  /**
   * Generate multiple insights for a user
   * @param {Object} userData - User data
   * @param {Array} insightTypes - Array of insight types to generate
   * @returns {Promise<Array>} - Array of generated insights
   */
  async generateMultipleInsights(userData, insightTypes = [INSIGHT_TYPES.GENERAL_HEALTH]) {
    try {
      if (!this.isAvailable()) {
        return [];
      }

      const insightPromises = insightTypes.map(type => 
        this.generateHealthInsight(userData, type)
      );

      const insights = await Promise.all(insightPromises);
      return insights.filter(insight => insight !== null);
    } catch (error) {
      console.error('Multiple insights generation error:', error.message);
      return [];
    }
  }

  /**
   * Generate quick health tip
   * @param {string} topic - Health topic
   * @returns {Promise<string|null>} - Quick health tip
   */
  async generateQuickTip(topic = 'menstrual health') {
    try {
      if (!this.isAvailable()) {
        return null;
      }

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a women's health expert. Provide a brief, actionable health tip in English. Keep it under 100 words."
          },
          {
            role: "user",
            content: `Give me a quick health tip about ${topic} for women.`
          }
        ],
        max_tokens: 100,
        temperature: 0.8
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Quick tip generation error:', error.message);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new OpenAIService(); 