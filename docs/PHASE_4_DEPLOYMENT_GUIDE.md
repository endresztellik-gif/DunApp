# Phase 4: Water Level Module - Deployment Guide

**Date:** 2025-11-03
**Status:** Ready for Deployment
**Phase:** 4.1 - 4.4 Complete (Backend)

---

## 📋 Overview

This guide covers the deployment of the Water Level Module backend:
- ✅ Database schema (Migrations 008, 009, 010)
- ✅ Edge Function (fetch-water-level)
- ✅ Cron job setup (hourly refresh)

---

## 🗄️ Step 1: Apply Database Migrations

The migrations are already applied via SQL Editor. Verify with:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'water_level%'
ORDER BY table_name;

-- Expected result:
-- water_level_data
-- water_level_forecasts
-- water_level_stations

-- Check stations are seeded
SELECT id, station_id, name, alert_level_cm
FROM water_level_stations
ORDER BY name;

-- Expected result:
-- Baja (442027) - alert: 500cm
-- Mohács (442010) - alert: 400cm
-- Nagybajcs (442051) - alert: 550cm
```

### Manual Migration (if needed):

If migrations haven't been applied yet, run these in SQL Editor:

1. **Migration 008:** `supabase/migrations/008_water_level_stations_and_data.sql`
2. **Migration 009:** `supabase/migrations/009_water_level_forecasts.sql`
3. **Migration 010:** `supabase/migrations/010_water_level_cron_job.sql`

---

## 🚀 Step 2: Deploy Edge Function

### Option A: Supabase CLI (Recommended)

```bash
# 1. Login to Supabase
supabase login

# 2. Link to project
supabase link --project-ref zpwoicpajmvbtmtumsah

# 3. Deploy Edge Function
supabase functions deploy fetch-water-level

# 4. Verify deployment
supabase functions list
```

### Option B: Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/zpwoicpajmvbtmtumsah/functions
2. Click "New Function"
3. Name: `fetch-water-level`
4. Copy contents from: `supabase/functions/fetch-water-level/index.ts`
5. Click "Deploy"

---

## ⏰ Step 3: Verify Cron Job

Check that the cron job is scheduled:

```sql
-- Check cron job exists
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'fetch-water-level-hourly';

-- Expected result:
-- jobname: fetch-water-level-hourly
-- schedule: 10 * * * * (every hour at :10)
-- active: true
```

---

## 🧪 Step 4: Test Edge Function

### Manual Test:

```sql
-- Trigger function manually
SELECT invoke_fetch_water_level();

-- Check logs
SELECT * FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job
  WHERE jobname = 'fetch-water-level-hourly'
)
ORDER BY start_time DESC
LIMIT 5;
```

### API Test:

```bash
# Test via HTTP (replace with your anon key)
curl -X POST \
  'https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-water-level' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Expected Response:

```json
{
  "success": true,
  "timestamp": "2025-11-03T10:10:00Z",
  "summary": {
    "total": 3,
    "success": 3,
    "failed": 0
  },
  "results": [
    {
      "station": "Nagybajcs",
      "status": "success",
      "waterLevel": 250,
      "forecastDays": 5
    },
    {
      "station": "Baja",
      "status": "success",
      "waterLevel": 180,
      "forecastDays": 5
    },
    {
      "station": "Mohács",
      "status": "success",
      "waterLevel": 120,
      "forecastDays": 5
    }
  ]
}
```

---

## ✅ Step 5: Verify Data

Check that data is being inserted:

```sql
-- Check latest water levels
SELECT
  s.name AS station,
  d.water_level_cm,
  d.measured_at,
  d.source
FROM water_level_data d
INNER JOIN water_level_stations s ON d.station_id = s.id
ORDER BY d.measured_at DESC
LIMIT 10;

-- Check forecasts
SELECT
  s.name AS station,
  f.forecast_date,
  f.forecasted_level_cm,
  f.issued_at
FROM water_level_forecasts f
INNER JOIN water_level_stations s ON f.station_id = s.id
ORDER BY f.issued_at DESC, f.forecast_date ASC
LIMIT 15;
```

---

## 🔧 Troubleshooting

### Problem: No data inserted

**Check Edge Function logs:**

```bash
# CLI
supabase functions logs fetch-water-level

# Or SQL
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-water-level-hourly')
ORDER BY start_time DESC
LIMIT 10;
```

### Problem: Scraping fails

**Common issues:**
- vizugy.hu or hydroinfo.hu down
- HTML structure changed
- Network timeout

**Solution:** Check logs for error messages, retry manually

### Problem: Cron job not running

**Check:**
```sql
-- Is pg_cron enabled?
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Is job active?
SELECT * FROM cron.job WHERE jobname = 'fetch-water-level-hourly';

-- Re-schedule if needed
SELECT cron.unschedule('fetch-water-level-hourly');
SELECT cron.schedule(
  'fetch-water-level-hourly',
  '10 * * * *',
  $$SELECT invoke_fetch_water_level()$$
);
```

---

## 📊 Data Sources

### vizugy.hu (Current Water Levels)
- **URL:** https://www.vizugy.hu/index.php?module=content&programelemid=138
- **Data:** Water level (cm), flow rate (m³/s), water temperature (°C)
- **Encoding:** UTF-8
- **Frequency:** Hourly

### hydroinfo.hu (Forecasts)
- **URL:** http://www.hydroinfo.hu/Html/hidelo/duna.html
- **Data:** 5-day water level forecasts (cm)
- **Encoding:** ISO-8859-2
- **Frequency:** Hourly

---

## 📈 Expected Behavior

### Hourly Execution

- **Time:** Every hour at :10 (e.g., 00:10, 01:10, 02:10)
- **Duration:** ~5-10 seconds
- **Success Rate:** >95% (depends on source availability)

### Data Flow

```
┌─────────────────┐
│ Cron Job (:10)  │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ invoke_fetch_water_  │
│ level() function     │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────────┐
│ fetch-water-level Edge Fn    │
│                              │
│ 1. Scrape vizugy.hu          │
│ 2. Scrape hydroinfo.hu       │
│ 3. Parse HTML (DOMParser)    │
│ 4. Insert to database        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Database Tables              │
│                              │
│ - water_level_data           │
│ - water_level_forecasts      │
└──────────────────────────────┘
```

---

## 🎯 Success Criteria

- ✅ All 3 stations return data (Nagybajcs, Baja, Mohács)
- ✅ Water levels are realistic (50-700 cm range)
- ✅ Forecasts cover 5 days
- ✅ Data updates hourly
- ✅ No errors in logs
- ✅ Cron job runs successfully

---

## 🚨 Alert System (Phase 4.6)

**Note:** Push notifications for Mohács >= 400cm will be implemented in Phase 4.6.

Current alert level configuration:
- **Nagybajcs:** 550 cm (alert), 700 cm (danger)
- **Baja:** 500 cm (alert), 700 cm (danger)
- **Mohács:** 400 cm (alert), 650 cm (danger) ⚠️

---

## 📝 Next Steps (Phase 4.5)

After successful backend deployment:

1. **Frontend Development:**
   - WaterLevelModule component
   - StationSelector component
   - DataCard components (3 stations)
   - WaterLevelChart (3-station comparison)
   - ForecastTable (5-day predictions)

2. **Testing:**
   - Unit tests for hooks
   - Integration tests for components
   - E2E tests for module

3. **Documentation:**
   - User guide for Water Level Module
   - API documentation update

---

## 🔗 Related Files

- **Migrations:**
  - `supabase/migrations/008_water_level_stations_and_data.sql`
  - `supabase/migrations/009_water_level_forecasts.sql`
  - `supabase/migrations/010_water_level_cron_job.sql`

- **Edge Function:**
  - `supabase/functions/fetch-water-level/index.ts`

- **Documentation:**
  - `docs/WATER_LEVEL_MODULE_PLAN.md`
  - `WATER_LEVEL_MODULE_SUMMARY.md`
  - `API_INTEGRATION_GUIDE.md`

---

**Deployment Completed:** ⬜ (Pending)
**Verified By:** _______________
**Date:** _______________

---

*Generated by Claude Code - Phase 4.4*
