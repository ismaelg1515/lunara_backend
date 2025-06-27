#!/bin/bash

# 🌙 Lunara Backend API - Complete Testing Suite
# Este script ejecuta tests completos de todos los endpoints del API

# Configuración
BASE_URL="http://localhost:3001"
FIREBASE_TOKEN="fake-test-token"  # Reemplazar con token real de Firebase
API_KEY="test-api-key"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar header de sección
show_section() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}🧪 $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Función para mostrar resultado de test
test_result() {
    local url=$1
    local method=$2
    local status=$3
    
    if [ $status -eq 200 ] || [ $status -eq 201 ]; then
        echo -e "${GREEN}✅ $method $url - Status: $status${NC}"
    else
        echo -e "${RED}❌ $method $url - Status: $status${NC}"
    fi
}

# Función para ejecutar test
run_test() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json \
            -H "Authorization: Bearer $FIREBASE_TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$url")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json \
            -X $method \
            -H "Authorization: Bearer $FIREBASE_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$url")
    fi
    
    status_code=${response: -3}
    test_result "$url" "$method" "$status_code"
    
    # Mostrar respuesta si hay error
    if [ $status_code -ge 400 ]; then
        echo -e "${RED}Response:${NC}"
        cat /tmp/response.json | head -5
    fi
}

echo -e "${BLUE}🌙 LUNARA BACKEND API TESTING SUITE${NC}"
echo -e "${BLUE}====================================${NC}"

# 1. SYSTEM ENDPOINTS
show_section "SYSTEM ENDPOINTS"

run_test "GET" "/" "" "Root endpoint information"
run_test "GET" "/api/v1" "" "API version information"
run_test "GET" "/api/health" "" "Health check"

# 2. HEALTH DATA ENDPOINTS
show_section "HEALTH DATA - MENSTRUAL CYCLES"

# GET cycles
run_test "GET" "/api/health-data/cycles" "" "Get user cycles"
run_test "GET" "/api/health-data/cycles?limit=5" "" "Get cycles with limit"

# POST cycle (create)
cycle_data='{
    "start_date": "2024-01-15",
    "cycle_length": 28,
    "period_duration": 5,
    "symptoms": ["cramps", "mood_swings"],
    "flow_intensity": "medium",
    "notes": "Normal cycle"
}'
run_test "POST" "/api/health-data/cycles" "$cycle_data" "Create new cycle"

# GET cycle by ID (usando ID ficticio)
run_test "GET" "/api/health-data/cycles/test-cycle-id" "" "Get specific cycle"

# PUT cycle (update)
update_cycle_data='{
    "period_duration": 6,
    "symptoms": ["cramps", "bloating"],
    "notes": "Updated cycle information"
}'
run_test "PUT" "/api/health-data/cycles/test-cycle-id" "$update_cycle_data" "Update cycle"

# DELETE cycle
run_test "DELETE" "/api/health-data/cycles/test-cycle-id" "" "Delete cycle"

show_section "HEALTH DATA - NUTRITION"

# GET nutrition logs
run_test "GET" "/api/health-data/nutrition" "" "Get nutrition logs"
run_test "GET" "/api/health-data/nutrition?date=2024-01-15" "" "Get nutrition by date"

# POST nutrition log
nutrition_data='{
    "log_date": "2024-01-15",
    "meal_type": "breakfast",
    "food_items": [
        {
            "name": "Oatmeal",
            "quantity": "1 cup",
            "calories": 300
        },
        {
            "name": "Banana",
            "quantity": "1 medium",
            "calories": 105
        }
    ],
    "total_calories": 405,
    "notes": "Healthy breakfast"
}'
run_test "POST" "/api/health-data/nutrition" "$nutrition_data" "Create nutrition log"

show_section "HEALTH DATA - FITNESS"

# GET fitness logs
run_test "GET" "/api/health-data/fitness" "" "Get fitness logs"

# POST fitness log
fitness_data='{
    "exercise_type": "cardio",
    "activity_name": "Running",
    "duration_minutes": 30,
    "intensity": "moderate",
    "calories_burned": 300,
    "notes": "Morning run in the park"
}'
run_test "POST" "/api/health-data/fitness" "$fitness_data" "Create fitness log"

show_section "HEALTH DATA - MENTAL HEALTH"

# GET mental health logs
run_test "GET" "/api/health-data/mental-health" "" "Get mental health logs"

# POST mental health log
mental_health_data='{
    "mood_rating": 7,
    "stress_level": 4,
    "anxiety_level": 3,
    "energy_level": 8,
    "sleep_quality": 7,
    "notes": "Feeling good today"
}'
run_test "POST" "/api/health-data/mental-health" "$mental_health_data" "Create mental health log"

show_section "HEALTH DATA - AGGREGATIONS"

# GET summary
run_test "GET" "/api/health-data/summary" "" "Get health data summary"

# GET stats
run_test "GET" "/api/health-data/stats" "" "Get health statistics"

# 3. AI INSIGHTS ENDPOINTS
show_section "AI INSIGHTS"

# GET insight types
run_test "GET" "/api/ai/insight-types" "" "Get available insight types"

# GET quick tip
run_test "GET" "/api/ai/quick-tip" "" "Get quick health tip"
run_test "GET" "/api/ai/quick-tip?topic=nutrition" "" "Get nutrition tip"

# POST generate insight
insight_data='{
    "type": "general_health"
}'
run_test "POST" "/api/ai/generate-insight" "$insight_data" "Generate AI insight"

# POST generate multiple insights
multiple_insights_data='{
    "types": ["general_health", "nutrition_advice", "fitness_suggestion"]
}'
run_test "POST" "/api/ai/generate-multiple-insights" "$multiple_insights_data" "Generate multiple insights"

# GET user insights
run_test "GET" "/api/ai/insights" "" "Get user insights"
run_test "GET" "/api/ai/insights?limit=5" "" "Get insights with limit"

# PATCH mark insight as read
run_test "PATCH" "/api/ai/insights/test-insight-id/read" "" "Mark insight as read"

# DELETE insight
run_test "DELETE" "/api/ai/insights/test-insight-id" "" "Delete insight"

# TESTS DE VALIDACIÓN
show_section "VALIDATION TESTS"

# Test datos inválidos
invalid_cycle='{
    "start_date": "invalid-date",
    "cycle_length": "not-a-number"
}'
run_test "POST" "/api/health-data/cycles" "$invalid_cycle" "Test invalid cycle data"

# Test sin autenticación
echo -e "\n${YELLOW}Testing: Endpoint without authentication${NC}"
response=$(curl -s -w "%{http_code}" -o /tmp/response.json \
    -H "Content-Type: application/json" \
    "$BASE_URL/api/health-data/cycles")
status_code=${response: -3}
test_result "/api/health-data/cycles" "GET" "$status_code"

# RESUMEN FINAL
show_section "TESTING COMPLETE"

echo -e "${BLUE}📊 SUMMARY${NC}"
echo -e "• Total tests executed: Multiple endpoints"
echo -e "• Check output above for individual results"
echo -e "• Red ❌ = Failed tests (needs attention)"
echo -e "• Green ✅ = Passed tests"
echo -e "\n${YELLOW}NOTE: Some tests may fail if Firebase auth is not properly configured${NC}"
echo -e "${YELLOW}Replace FIREBASE_TOKEN with a real token for accurate results${NC}"

# Limpiar archivo temporal
rm -f /tmp/response.json

echo -e "\n${GREEN}🎉 Testing suite completed!${NC}"