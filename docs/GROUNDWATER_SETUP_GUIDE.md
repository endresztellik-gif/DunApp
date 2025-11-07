# Groundwater Monitoring Setup Guide

**Date:** 2025-11-06
**Status:** Partial Deployment Complete - Manual Steps Required

## 📊 Overview

This guide documents the groundwater monitoring feature implementation for the Drought Module, including what's been completed and the manual steps required to finish the setup.

## ✅ Completed Components

### Frontend (100% Complete)
- ✅ `useGroundwaterTimeseries` hook - Fetches 365-day timeseries from Supabase
- ✅ `GroundwaterChart` component - Recharts visualization with 5-day sampling
- ✅ `WellSelector` component - Dropdown selector for 15 wells
- ✅ `DroughtModule` integration - TWO separate selectors (locations + wells)
- ✅ Real-time data display with loading/error states

### Backend (75% Complete)
- ✅ Database schema ready (`groundwater_data`, `groundwater_wells` tables)
- ✅ Edge Function deployed: `fetch-groundwater` ✅
- ✅ Migration file created: `013_groundwater_cron_job.sql`
- ⚠️ Cron job setup (requires manual configuration)
- ⚠️ Initial data population (requires manual trigger)

## 📁 Files Created/Modified

### New Files:
```
src/hooks/useGroundwaterTimeseries.ts          - 365-day data fetching hook
src/modules/drought/GroundwaterChart.tsx       - Chart visualization component
src/components/selectors/WellSelector.tsx     - Well selector dropdown
supabase/functions/fetch-groundwater/index.ts - Edge Function (DEPLOYED ✅)
supabase/migrations/013_groundwater_cron_job.sql - Cron job migration
```

### Modified Files:
```
src/modules/drought/DroughtModule.tsx          - Added groundwater chart section
package.json                                    - Dependencies
vite.config.ts                                  - Build configuration
src/styles/components.css                       - Styling
```

## 🛠️ Manual Setup Required

### Step 1: Configure Supabase Environment Settings

The cron job migration requires two environment settings to be configured in your Supabase project.

**Option A: Via Supabase Dashboard SQL Editor**

1. Go to: https://supabase.com/dashboard/project/zpwoicpajmvbtmtumsah/sql/new
2. Execute the following SQL to set up configuration:

```sql
-- Create app settings schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS app;

-- Set Supabase URL
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://zpwoicpajmvbtmtumsah.supabase.co';

-- Set Service Role Key (get from Dashboard > Project Settings > API > service_role key)
-- Replace YOUR_SERVICE_ROLE_KEY_HERE with your actual service role key
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';
```

**How to get the Service Role Key:**
1. Go to: https://supabase.com/dashboard/project/zpwoicpajmvbtmtumsah/settings/api
2. Find the `service_role` secret key (under "Project API keys")
3. Click "Reveal" and copy the key
4. Paste it in the SQL above

### Step 2: Apply Migration 013

After configuring the environment settings, run the migration:

**Via Supabase Dashboard SQL Editor:**

1. Go to: https://supabase.com/dashboard/project/zpwoicpajmvbtmtumsah/sql/new
2. Copy and paste the contents of `supabase/migrations/013_groundwater_cron_job.sql`
3. Click "Run" to execute

**Expected Output:**
```
✅ Groundwater cron job created successfully
   Schedule: Daily at 05:00 AM UTC (0 5 * * *)
   Function: fetch-groundwater Edge Function
   Wells: 15 monitoring wells
```

### Step 3: Manually Trigger Initial Data Fetch

To populate initial data without waiting for the 05:00 AM cron job:

**Via Supabase Dashboard SQL Editor:**

```sql
-- Manually trigger the fetch-groundwater function
SELECT public.invoke_fetch_groundwater();
```

**OR via curl:**

```bash
# Get your service role key from Dashboard > Settings > API
# Replace YOUR_SERVICE_ROLE_KEY with the actual key

curl -X POST "https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-groundwater" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "status": "completed",
  "timestamp": "2025-11-06T...",
  "execution_time_ms": 45000,
  "wells_total": 15,
  "wells_fetched": 15,
  "wells_cached": 0,
  "wells_failed": 0
}
```

### Step 4: Verify Data

Check if data was successfully populated:

**Via Supabase Dashboard SQL Editor:**

```sql
-- Check groundwater wells
SELECT id, well_name, well_code, city_name
FROM groundwater_wells
ORDER BY well_name;

-- Check groundwater data (should have ~900 records = 15 wells × 60 days)
SELECT
  gw.well_name,
  COUNT(*) as measurement_count,
  MIN(gd.timestamp) as earliest_date,
  MAX(gd.timestamp) as latest_date
FROM groundwater_data gd
JOIN groundwater_wells gw ON gd.well_id = gw.id
GROUP BY gw.well_name
ORDER BY gw.well_name;
```

**Expected Results:**
- 15 wells in `groundwater_wells` table
- ~900 measurements in `groundwater_data` table (60 days × 15 wells)
- Date range should cover the last 60 days

## 📝 Edge Function Details

### fetch-groundwater

**URL:** `https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-groundwater`
**Status:** ✅ DEPLOYED
**Source:** `supabase/functions/fetch-groundwater/index.ts`

**Features:**
- ✅ Parallel processing (Promise.allSettled for all 15 wells)
- ✅ 30-second timeout per API request
- ✅ Daily caching (avoids re-fetching same day's data)
- ✅ Error isolation (one well failure doesn't block others)
- ✅ Fetches 60-day timeseries from vizadat.hu API

**Wells Monitored:**
1. Sátorhely (4576)
2. Mohács II. (912)
3. Kölked (1461)
4. Mohács (1460)
5. Mohács-Sárhát (4481)
6. Dávod (448)
7. Hercegszántó (1450)
8. Nagybaracska (4479)
9. Szeremle (132042)
10. Alsónyék (662)
11. Érsekcsanád (1426)
12. Decs (658)
13. Szekszárd-Borrév (656)
14. Őcsény (653)
15. Báta (660)

## 🎨 UI Components

### GroundwaterChart Component

**Features:**
- 365-day historical trend with 5-day sampling (~73 data points)
- Line chart showing water level over time
- Interactive tooltip with formatted dates
- Well metadata display (name, code, location, depth)
- Loading/error/empty states
- Real-time badge showing data source

**Props:**
```typescript
interface GroundwaterChartProps {
  well: GroundwaterWell;
}
```

**Usage in DroughtModule:**
```tsx
{selectedWell && (
  <div className="mb-6">
    <GroundwaterChart well={selectedWell} />
  </div>
)}
```

### WellSelector Component

**Features:**
- Dropdown selector for 15 wells
- Validation: Must have exactly 15 wells (throws error otherwise)
- Displays well name, code, city, county, depth
- Keyboard navigation support
- Click-outside to close

**Props:**
```typescript
interface WellSelectorProps {
  wells: GroundwaterWell[];
  selectedWell: GroundwaterWell | null;
  onWellChange: (well: GroundwaterWell) => void;
  className?: string;
}
```

## 🔧 Testing Checklist

After completing the manual setup:

- [ ] Verify cron job is created: Check Dashboard > Database > Cron Jobs
- [ ] Confirm data populated: Run verification SQL queries above
- [ ] Test UI: Navigate to Drought Module > Groundwater section
- [ ] Select different wells: Verify chart updates correctly
- [ ] Check chart functionality: Tooltip, zoom, responsive design
- [ ] Verify daily updates: Check logs next day at 05:00 AM UTC

## 📅 Cron Schedule

**Job Name:** `fetch-groundwater-daily`
**Schedule:** `0 5 * * *` (Every day at 05:00 AM UTC)
**Converts to:** 06:00 AM CET / 07:00 AM CEST
**Function:** `public.invoke_fetch_groundwater()`
**Timeout:** 5 minutes (300,000 ms)

## 🐛 Troubleshooting

### Issue: Cron job not running

**Solution:**
1. Check cron job status:
```sql
SELECT jobid, jobname, schedule, active, nodename
FROM cron.job
WHERE jobname = 'fetch-groundwater-daily';
```

2. Verify environment settings:
```sql
SHOW app.settings.supabase_url;
SHOW app.settings.service_role_key;
```

### Issue: Edge Function returns 401 Unauthorized

**Solution:**
- Verify service role key is correct
- Check Authorization header format: `Bearer YOUR_SERVICE_ROLE_KEY`
- Ensure key has not been rotated in Dashboard

### Issue: No data in chart

**Possible Causes:**
1. Data not yet fetched (run manual trigger)
2. Well has no measurements in last 365 days
3. API error during fetch

**Debug:**
```sql
-- Check if any data exists for the well
SELECT COUNT(*) FROM groundwater_data WHERE well_id = 'WELL_ID_HERE';

-- Check Edge Function logs
-- Go to: Dashboard > Edge Functions > fetch-groundwater > Logs
```

### Issue: Chart shows "No data available"

**Solution:**
1. Verify well exists in database
2. Check groundwater_data table for well_id
3. Confirm date range (last 365 days)
4. Re-run fetch-groundwater function

## 🎯 Next Steps

After manual setup is complete:

1. **Test all 15 wells** - Verify each well shows data in the chart
2. **Monitor cron job** - Check logs tomorrow to confirm daily fetch works
3. **Performance testing** - Ensure chart loads quickly with 365 days of data
4. **Mobile testing** - Verify chart responsiveness on mobile devices
5. **Update CLAUDE.md** - Document groundwater monitoring as complete

## 📚 Related Documentation

- Database schema: `supabase/migrations/009_drought_and_groundwater_tables.sql`
- Edge Function: `supabase/functions/fetch-groundwater/README.md`
- API documentation: `docs/API_DOCS.md` (update with groundwater endpoints)
- Phase 5 status: `CLAUDE.md` (Drought Module section)

## 🎉 Success Criteria

Groundwater monitoring is fully functional when:

- ✅ Edge Function deployed
- ✅ Cron job scheduled and running
- ✅ 15 wells with 60-day historical data
- ✅ Chart displays 365-day trend for selected well
- ✅ Daily automatic updates at 05:00 AM UTC
- ✅ All 15 wells selectable and functional in UI

---

**Last Updated:** 2025-11-06
**Author:** Claude Code
**Project:** DunApp PWA - Phase 5 Drought Module
