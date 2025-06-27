require('dotenv').config();
const openAIService = require('./src/services/openai');

console.log('🧪 Direct OpenAI Service Test');
console.log('============================\n');

// Check if API key is configured
console.log('1️⃣  Checking API key configuration...');
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
    console.log('✅ API key is configured');
    console.log(`   Key starts with: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
} else {
    console.log('❌ API key is NOT configured');
    console.log('   Please add your OpenAI API key to the .env file:');
    console.log('   OPENAI_API_KEY=sk-your-actual-api-key-here\n');
    process.exit(1);
}

// Check if service is available
console.log('\n2️⃣  Checking service availability...');
if (openAIService.isAvailable()) {
    console.log('✅ OpenAI service is available');
} else {
    console.log('❌ OpenAI service is NOT available');
    process.exit(1);
}

// Test quick tip generation
console.log('\n3️⃣  Testing quick tip generation...');
openAIService.generateQuickTip('hydration during menstruation')
    .then(tip => {
        if (tip) {
            console.log('✅ Quick tip generated successfully:');
            console.log(`   "${tip}"`);
        } else {
            console.log('❌ Failed to generate quick tip');
        }
    })
    .catch(error => {
        console.log('❌ Error generating quick tip:', error.message);
    })
    .then(() => {
        // Test full insight generation
        console.log('\n4️⃣  Testing full insight generation...');
        const testUserData = {
            age: 28,
            weight: 65,
            cycle_length: 28,
            period_duration: 5,
            recent_symptoms: 'mild cramps, fatigue',
            cycle_phase: 'follicular'
        };

        return openAIService.generateHealthInsight(testUserData, 'GENERAL_HEALTH');
    })
    .then(insight => {
        if (insight) {
            console.log('✅ Insight generated successfully:');
            console.log(`   Type: ${insight.type}`);
            console.log(`   Title: ${insight.title}`);
            console.log(`   Content: ${insight.content.substring(0, 100)}...`);
        } else {
            console.log('❌ Failed to generate insight');
        }
    })
    .catch(error => {
        console.log('❌ Error generating insight:', error.message);
    })
    .finally(() => {
        console.log('\n============================');
        console.log('✅ Test completed!');
        console.log('\nIf all tests passed, your OpenAI integration is working correctly!');
        console.log('You can now use the AI features in your Lunara backend.');
        process.exit(0);
    });