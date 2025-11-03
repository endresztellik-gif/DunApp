# Testing fetch-meteorology Edge Function

**Created:** 2025-11-01
**Edge Function:** `/supabase/functions/fetch-meteorology/index.ts`
**Purpose:** Test current weather + 3-day forecast fetching

---

## Summary of Changes

The `fetch-meteorology` Edge Function has been updated to include:

1. **Current Weather Fetching** (PRESERVED - unchanged)
   - OpenWeatherMap API (primary)
   - Meteoblue API (fallback)
   - Yr.no API (fallback)
   - Stores in `meteorology_data` table

2. **Forecast Fetching** (NEW)
   - Yr.no API for 3-day forecasts
   - 6-hour intervals (approximately 12 forecast points)
   - Stores in `meteorology_forecasts` table
   - Upsert strategy: deletes old forecasts before inserting new

---

## Prerequisites

1. **Database Migration Applied:**
   ```bash
   # Verify meteorology_forecasts table exists
   psql $DATABASE_URL -c "\d meteorology_forecasts"
   ```

2. **Environment Variables Set:**
   - `OPENWEATHER_API_KEY` (required)
   - `METEOBLUE_API_KEY` (optional)
   - `YR_NO_USER_AGENT` (optional, defaults to 'DunApp PWA/1.0 (contact@dunapp.hu)')
   - `SUPABASE_URL` (required)
   - `SUPABASE_SERVICE_ROLE_KEY` (required)

---

## Local Testing

### 1. Start Supabase Locally

```bash
cd /Volumes/Endre_Samsung1T/codeing/dunapp-pwa

# Start local Supabase
supabase start
```

### 2. Serve the Edge Function

```bash
# Serve fetch-meteorology function
supabase functions serve fetch-meteorology --env-file .env.local
```

### 3. Test the Function

```bash
# Invoke the function
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/fetch-meteorology' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

### 4. Expected Response

```json
{
  "success": true,
  "timestamp": "2025-11-01T10:30:00.000Z",
  "current": {
    "summary": {
      "total": 4,
      "success": 4,
      "failed": 0
    },
    "results": [
      {
        "city": "Szekszárd",
        "status": "success",
        "source": "openweathermap",
        "temperature": 15.2
      },
      {
        "city": "Baja",
        "status": "success",
        "source": "openweathermap",
        "temperature": 14.8
      },
      {
        "city": "Dunaszekcső",
        "status": "success",
        "source": "openweathermap",
        "temperature": 15.0
      },
      {
        "city": "Mohács",
        "status": "success",
        "source": "openweathermap",
        "temperature": 14.5
      }
    ]
  },
  "forecast": {
    "summary": {
      "total": 4,
      "success": 4,
      "failed": 0
    },
    "results": [
      {
        "city": "Szekszárd",
        "status": "success",
        "forecastCount": 12
      },
      {
        "city": "Baja",
        "status": "success",
        "forecastCount": 12
      },
      {
        "city": "Dunaszekcső",
        "status": "success",
        "forecastCount": 12
      },
      {
        "city": "Mohács",
        "status": "success",
        "forecastCount": 12
      }
    ]
  }
}
```

---

## Database Verification

### 1. Check Current Weather Data

```sql
-- Check latest current weather records
SELECT
  mc.name AS city,
  md.temperature,
  md.humidity,
  md.wind_speed,
  md.timestamp
FROM meteorology_data md
JOIN meteorology_cities mc ON md.city_id = mc.id
ORDER BY md.timestamp DESC
LIMIT 10;
```

### 2. Check Forecast Data

```sql
-- Check forecast records
SELECT
  mc.name AS city,
  mf.forecast_time,
  mf.temperature,
  mf.precipitation_amount,
  mf.wind_speed,
  mf.weather_symbol
FROM meteorology_forecasts mf
JOIN meteorology_cities mc ON mf.city_id = mc.id
ORDER BY mc.name, mf.forecast_time
LIMIT 50;
```

### 3. Verify Forecast Count per City

```sql
-- Count forecasts per city
SELECT
  mc.name AS city,
  COUNT(mf.id) AS forecast_count,
  MIN(mf.forecast_time) AS first_forecast,
  MAX(mf.forecast_time) AS last_forecast
FROM meteorology_forecasts mf
JOIN meteorology_cities mc ON mf.city_id = mc.id
GROUP BY mc.name
ORDER BY mc.name;
```

Expected result: Each city should have ~12 forecast points spanning 72 hours.

---

## Production Deployment

### 1. Deploy to Supabase

```bash
# Deploy the updated function
supabase functions deploy fetch-meteorology
```

### 2. Set Environment Variables

Go to Supabase Dashboard → Edge Functions → fetch-meteorology → Settings:

```
OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
METEOBLUE_API_KEY=YOUR_METEOBLUE_API_KEY_HERE
YR_NO_USER_AGENT=DunApp PWA/1.0 (contact@dunapp.hu)
```

### 3. Test Production Function

```bash
# Test production deployment
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-meteorology' \
  --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  --header 'Content-Type: application/json'
```

### 4. Verify Cron Job

The existing cron job should still work:

```sql
-- Verify cron job exists
SELECT * FROM cron.job WHERE jobname = 'fetch-meteorology';
```

Expected: Runs every 20 minutes (`*/20 * * * *`)

---

## Monitoring

### 1. Check Logs

```bash
# View Edge Function logs
supabase functions logs fetch-meteorology --tail
```

### 2. Expected Log Output

```
🌤️  Fetch Meteorology Edge Function - Starting
🌡️  Fetching current weather data...
Processing current weather for Szekszárd...
Fetching from OpenWeatherMap for Szekszárd...
✅ Current weather success: Szekszárd (openweathermap)
Processing current weather for Baja...
Fetching from OpenWeatherMap for Baja...
✅ Current weather success: Baja (openweathermap)
...
📊 Fetching forecast data...
📊 Starting forecast fetch for all cities...
Fetching forecast for Szekszárd...
Fetching Yr.no forecast for Szekszárd...
✅ Forecast success: Szekszárd (12 forecast points)
Fetching forecast for Baja...
Fetching Yr.no forecast for Baja...
✅ Forecast success: Baja (12 forecast points)
...
✅ Fetch Meteorology Edge Function - Completed
   Current weather: 4 success, 0 failed
   Forecasts: 4 success, 0 failed
```

---

## Troubleshooting

### Issue: Yr.no API returns 403 Forbidden

**Cause:** Missing or invalid User-Agent header

**Solution:**
```bash
# Ensure YR_NO_USER_AGENT is set
echo $YR_NO_USER_AGENT

# Should output: DunApp PWA/1.0 (contact@dunapp.hu)
```

### Issue: No forecast data in database

**Cause:** Migration not applied or table doesn't exist

**Solution:**
```bash
# Apply migration
supabase db push

# Verify table exists
psql $DATABASE_URL -c "\d meteorology_forecasts"
```

### Issue: Old forecasts not being deleted

**Cause:** Delete operation failed (check permissions)

**Solution:**
```sql
-- Verify RLS policies allow service_role to delete
SELECT * FROM pg_policies
WHERE tablename = 'meteorology_forecasts';
```

### Issue: Forecast count is less than 12

**Cause:** Yr.no API may not provide full 72-hour data

**Solution:** This is normal. Yr.no provides variable-length forecasts. Expect 8-12 points.

---

## Performance Metrics

**Expected Execution Time:**
- Current weather: ~4-8 seconds (4 cities × 1-2s per city)
- Forecasts: ~4-8 seconds (4 cities × 1-2s per city)
- **Total:** ~10-15 seconds

**API Rate Limits:**
- OpenWeatherMap: 1,000 calls/day → 4 calls per run → OK ✅
- Yr.no: Fair use policy → 4 calls per run → OK ✅

**Database Impact:**
- Current weather: 4 new rows per run
- Forecasts: ~48 rows deleted + 48 rows inserted per run

---

## Success Criteria

- ✅ All 4 cities return current weather successfully
- ✅ All 4 cities return forecast data successfully
- ✅ Each city has 8-12 forecast points in database
- ✅ Forecast data spans approximately 72 hours
- ✅ Old forecasts are deleted before inserting new ones
- ✅ No errors in Edge Function logs
- ✅ Response time < 20 seconds

---

## Next Steps

1. Test locally with `supabase functions serve`
2. Verify database records after test run
3. Deploy to production with `supabase functions deploy`
4. Monitor logs for first few cron runs
5. Verify forecast data is being updated correctly

---

**End of Test Instructions**
