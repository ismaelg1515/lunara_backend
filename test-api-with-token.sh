#\!/bin/bash

# Get a valid Firebase token first
echo "Please provide a valid Firebase ID token for user clHzrFe0jZOAnWWtZzAR3pzy2im1:"
echo "(You can get this from the browser console when logged in)"
read -p "Token: " TOKEN

if [ -z "$TOKEN" ]; then
  echo "No token provided"
  exit 1
fi

echo -e "\n=== Testing Fitness Logs API ==="
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/health-data/fitness?limit=10  < /dev/null |  jq

echo -e "\n\n=== Testing Nutrition Logs API ==="
TODAY=$(date +%Y-%m-%d)
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:3000/api/health-data/nutrition?date=$TODAY&limit=10" | jq

echo -e "\n\n=== Testing Mental Health Logs API ==="
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/health-data/mental-health?limit=10 | jq
