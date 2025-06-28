#!/bin/bash

# Test script to add today's data for nutrition and fitness logs

# Configuration
BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL/api"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get Firebase auth token (you'll need to update this with a real token)
AUTH_TOKEN="YOUR_FIREBASE_AUTH_TOKEN"

# Get today's date in ISO format
TODAY=$(date -I)
echo -e "${BLUE}Adding data for today: $TODAY${NC}"

# Function to make API call
run_test() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}$description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            "$API_BASE$endpoint")
    else
        echo "Request body: $data"
        response=$(curl -s -X $method \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint")
    fi
    
    echo "Response: $response"
    
    if [[ $response == *"error"* ]]; then
        echo -e "${RED}✗ Test failed${NC}"
    else
        echo -e "${GREEN}✓ Test passed${NC}"
    fi
}

# Add nutrition logs for today
echo -e "\n${BLUE}=== ADDING NUTRITION LOGS ===${NC}"

# Breakfast
nutrition_breakfast="{
    \"log_date\": \"$TODAY\",
    \"meal_type\": \"breakfast\",
    \"food_items\": [\"Oatmeal with berries\", \"Green tea\"],
    \"calories\": 350,
    \"protein_grams\": 12,
    \"carbs_grams\": 55,
    \"fat_grams\": 8,
    \"notes\": \"Healthy start to the day\"
}"
run_test "POST" "/health-data/nutrition" "$nutrition_breakfast" "Add breakfast"

# Lunch
nutrition_lunch="{
    \"log_date\": \"$TODAY\",
    \"meal_type\": \"lunch\",
    \"food_items\": [\"Grilled chicken salad\", \"Whole wheat bread\"],
    \"calories\": 450,
    \"protein_grams\": 35,
    \"carbs_grams\": 40,
    \"fat_grams\": 15,
    \"notes\": \"Post-workout meal\"
}"
run_test "POST" "/health-data/nutrition" "$nutrition_lunch" "Add lunch"

# Snack
nutrition_snack="{
    \"log_date\": \"$TODAY\",
    \"meal_type\": \"snack\",
    \"food_items\": [\"Apple\", \"Almonds\"],
    \"calories\": 200,
    \"protein_grams\": 6,
    \"carbs_grams\": 25,
    \"fat_grams\": 10,
    \"notes\": \"Afternoon snack\"
}"
run_test "POST" "/health-data/nutrition" "$nutrition_snack" "Add snack"

# Add fitness logs for today
echo -e "\n${BLUE}=== ADDING FITNESS LOGS ===${NC}"

# Morning workout
fitness_morning="{
    \"activity_type\": \"cardio\",
    \"duration_minutes\": 30,
    \"calories_burned\": 250,
    \"intensity_level\": 3,
    \"notes\": \"Morning jog in the park\"
}"
run_test "POST" "/health-data/fitness" "$fitness_morning" "Add morning cardio"

# Evening workout
fitness_evening="{
    \"activity_type\": \"strength\",
    \"duration_minutes\": 45,
    \"calories_burned\": 180,
    \"intensity_level\": 2,
    \"notes\": \"Upper body workout\"
}"
run_test "POST" "/health-data/fitness" "$fitness_evening" "Add evening strength training"

# Verify the data was added
echo -e "\n${BLUE}=== VERIFYING TODAY'S DATA ===${NC}"
run_test "GET" "/health-data/nutrition?date=$TODAY" "" "Get today's nutrition logs"
run_test "GET" "/health-data/fitness?limit=5" "" "Get recent fitness logs"

echo -e "\n${BLUE}=== TEST COMPLETE ===${NC}"
echo "Remember to update AUTH_TOKEN with a valid Firebase token!"