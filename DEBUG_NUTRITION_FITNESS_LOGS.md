# Debug: Nutrition and Fitness Logs Not Appearing in Today's Activities

## Issue
Nutrition and fitness logs weren't showing up in the home screen's "Today's Activities" count, even though they were being created successfully.

## Root Causes Identified

1. **Field Name Mismatches**: 
   - Backend returns `log_date` for nutrition logs, but frontend expected `date`
   - Backend returns `logged_at` for fitness logs, but frontend expected `date`
   - Backend uses `activity_type` and `duration_minutes`, but frontend expected `exercise_type` and `duration`

2. **Date Format Issues**:
   - Backend stores dates as Firestore Timestamps (with `_seconds` field)
   - Frontend expected ISO string format
   - Date filtering logic wasn't accounting for timezone differences

3. **API Response Format**:
   - Backend wraps data differently than frontend expects
   - Field names in backend don't match frontend model properties

## Fixes Applied

### 1. Updated Frontend Models

**NutritionLog (`/frontend/lib/models/nutrition_log.dart`)**:
- Added date parsing logic to handle both string dates and Firestore Timestamps
- Updated `fromJson` to use `log_date` field from backend
- Updated `toJson` to send data in backend-expected format

**FitnessLog (`/frontend/lib/models/fitness_log.dart`)**:
- Added date parsing logic for Firestore Timestamps
- Updated field mappings (`logged_at` → `date`, `activity_type` → `exerciseType`, etc.)
- Fixed intensity level mapping between numeric and string values

### 2. Added Debug Logging

Updated `home_screen.dart` to include detailed logging:
- Log number of records fetched
- Log date comparisons for filtering
- Log total activities count

### 3. Created Test Script

Created `/backend/test-today-data.sh` to:
- Add nutrition logs with today's date
- Add fitness logs (which automatically use current timestamp)
- Verify data retrieval

## How to Test

1. Run the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Get a valid Firebase auth token from the Flutter app's console logs

3. Update the token in `test-today-data.sh` and run:
   ```bash
   ./test-today-data.sh
   ```

4. Run the Flutter app and check the console for debug output

5. The home screen should now show the correct activity count

## Additional Recommendations

1. **Standardize Date Handling**:
   - Consider using ISO strings consistently across backend and frontend
   - Or implement a centralized date converter utility

2. **API Contract**:
   - Document the exact field names and types expected by both frontend and backend
   - Consider using TypeScript on the backend for better type safety

3. **Testing**:
   - Add unit tests for date parsing logic
   - Add integration tests for the full data flow

4. **Backend Improvements**:
   - Consider adding a `date` field to fitness logs for consistency
   - Standardize response format across all endpoints