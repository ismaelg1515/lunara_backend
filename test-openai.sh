#!/bin/bash

echo "🧪 Testing OpenAI Connection for Lunara Backend"
echo "=============================================="

# Base URL
BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo -e "\n1️⃣  Checking if server is running..."
if curl -s "${BASE_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start it with: npm run dev${NC}"
    exit 1
fi

# Test AI connection status
echo -e "\n2️⃣  Testing AI connection status..."
RESPONSE=$(curl -s "${BASE_URL}/api/test-ai/test-connection")
echo "Response: $RESPONSE"

AI_AVAILABLE=$(echo $RESPONSE | grep -o '"aiAvailable":[^,}]*' | cut -d':' -f2)
API_KEY_CONFIGURED=$(echo $RESPONSE | grep -o '"apiKeyConfigured":[^,}]*' | cut -d':' -f2)

if [ "$AI_AVAILABLE" = "true" ]; then
    echo -e "${GREEN}✅ AI is available${NC}"
else
    echo -e "${RED}❌ AI is not available${NC}"
fi

if [ "$API_KEY_CONFIGURED" = "true" ]; then
    echo -e "${GREEN}✅ API key is configured${NC}"
else
    echo -e "${YELLOW}⚠️  API key is not configured${NC}"
    echo -e "${YELLOW}   Please set OPENAI_API_KEY in your .env file${NC}"
fi

# Test quick tip generation
echo -e "\n3️⃣  Testing AI quick tip generation..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/test-ai/test-generation" \
  -H "Content-Type: application/json" \
  -d '{"topic": "menstrual health"}')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ AI generation successful${NC}"
    echo "Generated tip:"
    echo "$RESPONSE" | grep -o '"generatedTip":"[^"]*' | cut -d'"' -f4
else
    echo -e "${RED}❌ AI generation failed${NC}"
    echo "Error: $RESPONSE"
fi

# Test full insight generation
echo -e "\n4️⃣  Testing AI insight generation..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/test-ai/test-insight" \
  -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ AI insight generation successful${NC}"
    echo "Insight type:"
    echo "$RESPONSE" | grep -o '"type":"[^"]*' | cut -d'"' -f4
else
    echo -e "${RED}❌ AI insight generation failed${NC}"
    echo "Error: $RESPONSE"
fi

echo -e "\n=============================================="
echo "📊 Test Summary:"
if [ "$AI_AVAILABLE" = "true" ] && [ "$API_KEY_CONFIGURED" = "true" ]; then
    echo -e "${GREEN}✅ OpenAI is properly connected and working!${NC}"
else
    echo -e "${YELLOW}⚠️  OpenAI connection needs configuration${NC}"
    echo -e "\nTo fix this:"
    echo -e "1. Make sure you have your OpenAI API key"
    echo -e "2. Add it to your .env file:"
    echo -e "   OPENAI_API_KEY=sk-your-actual-api-key-here"
    echo -e "3. Restart the server: npm run dev"
fi