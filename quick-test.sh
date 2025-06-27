#!/bin/bash

# 🧪 Quick Test Suite - Verificación Rápida de Endpoints

BASE_URL="http://localhost:3001"

echo "🌙 LUNARA BACKEND - QUICK VERIFICATION"
echo "======================================"

# Test 1: Root endpoint
echo -e "\n1️⃣ Root Endpoint"
curl -s "$BASE_URL/" | grep -q "Lunara Backend API" && echo "✅ Root endpoint OK" || echo "❌ Root endpoint FAILED"

# Test 2: Health check
echo -e "\n2️⃣ Health Check"
health_response=$(curl -s "$BASE_URL/api/health")
echo "$health_response" | grep -q '"status":"OK"' && echo "✅ Health check OK" || echo "❌ Health check FAILED"

# Mostrar detalles del health check
echo "📊 Services Status:"
echo "$health_response" | grep -o '"firebase":[^,]*' | sed 's/"firebase":/  Firebase: /'
echo "$health_response" | grep -o '"firestore":[^,]*' | sed 's/"firestore":/  Firestore: /'
echo "$health_response" | grep -o '"openai":[^,]*' | sed 's/"openai":/  OpenAI: /'

# Test 3: Authentication test
echo -e "\n3️⃣ Authentication"
auth_response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/health-data/cycles")
if [ "$auth_response" = "401" ]; then
    echo "✅ Authentication protection OK"
else
    echo "❌ Authentication protection FAILED (Status: $auth_response)"
fi

# Test 4: AI endpoints (sin auth para ver si responde correctamente con error)
echo -e "\n4️⃣ AI Service Availability"
ai_response=$(curl -s "$BASE_URL/api/ai/quick-tip")
echo "$ai_response" | grep -q "Firebase token required" && echo "✅ AI endpoint protected OK" || echo "❌ AI endpoint not properly protected"

# Test 5: Invalid endpoint
echo -e "\n5️⃣ 404 Handling"
not_found_response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/nonexistent")
if [ "$not_found_response" = "404" ]; then
    echo "✅ 404 handling OK"
else
    echo "❌ 404 handling FAILED (Status: $not_found_response)"
fi

# Test 6: CORS headers
echo -e "\n6️⃣ CORS Headers"
cors_response=$(curl -s -I "$BASE_URL/api/health" | grep -i "access-control")
if [ -n "$cors_response" ]; then
    echo "✅ CORS headers present"
else
    echo "❌ CORS headers missing"
fi

echo -e "\n🎉 Quick verification completed!"
echo "For detailed testing, run: ./test-endpoints.sh"