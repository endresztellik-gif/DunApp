# Hotfix 018 & 019 Deployment Instructions

**Date:** 2025-12-07
**Issue:** Csapadék és vízállás cron job-ok rossz URL-t használnak
**Fix:** Migration 018 & 019 - Cron job URL-ek javítása

---

## 🚨 Probléma Összefoglaló

- ❌ **Precipitation cron** (naponta 6:00 AM UTC) - 404 error, rossz URL
- ❌ **Water level cron** (óránként :10) - 404 error, rossz URL
- ✅ **Edge Function-ök** - Működnek (tesztelve)
- ✅ **Database schema** - Helyes
- ✅ **Frontend** - Helyes

**Root cause:** Migration 015 és 017 hardcoded ROSSZ Supabase URL-t használnak:
- **Helytelen:** `tihqkmzwfjhfltzskfgi.supabase.co`
- **Helyes:** `zpwoicpajmvbtmtumsah.supabase.co`

---

## 📝 Deployment Lépések

### Opció A: Supabase Dashboard SQL Editor (AJÁNLOTT)

**Legegyszerűbb módszer - 2 perc**

1. **Nyisd meg a Supabase Dashboard:**
   - https://supabase.com/dashboard/project/zpwoicpajmvbtmtumsah

2. **Navigálj a SQL Editor-hoz:**
   - Bal oldali menü → "SQL Editor"

3. **Futtasd le a hotfix SQL-t:**
   - Nyisd meg a `HOTFIX_018_019.sql` fájlt a projekt gyökérkönyvtárában
   - Másold ki a teljes tartalmat
   - Illeszd be a SQL Editor-ba
   - Kattints a "Run" gombra (vagy Cmd/Ctrl + Enter)

4. **Ellenőrizd a sikerességet:**
   - Az utolsó sor: `✅ Hotfix 018 & 019 applied successfully! Cron jobs fixed.`
   - Nincsenek error üzenetek
   - Mindkét cron job aktív (`active=true`)

---

### Opció B: CLI Migration (Ha működik a DB push)

**Ha a Supabase CLI működik (jelenleg permission denied)**

```bash
cd /Volumes/Endre_Samsung1T/codeing/dunapp-pwa

# Link to project (if not already linked)
SUPABASE_ACCESS_TOKEN="$SUPABASE_ADMIN_TOKEN" supabase link --project-ref zpwoicpajmvbtmtumsah

# Push migrations
SUPABASE_ACCESS_TOKEN="$SUPABASE_ADMIN_TOKEN" supabase db push --yes
```

**Ha ez is hibát ad, használd az Opció A-t.**

---

## ✅ Verification Steps

### 1. Test Functions Manually

```bash
# Test precipitation function
curl -X POST \
  "https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-precipitation-summary" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0"

# Expected: {"success":true,...}

# Test water level function
curl -X POST \
  "https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-water-level" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0"

# Expected: Success response
```

### 2. Check Database (via Supabase Dashboard SQL Editor)

```sql
-- Check precipitation data updated
SELECT mc.name, ps.last_7_days, ps.last_30_days, ps.year_to_date, ps.updated_at
FROM precipitation_summary ps
JOIN meteorology_cities mc ON ps.city_id = mc.id
ORDER BY ps.updated_at DESC;
-- Expected: updated_at within last few minutes

-- Check water level data
SELECT wls.station_name, wld.water_level_cm, wld.timestamp AS measured_at
FROM water_level_data wld
JOIN water_level_stations wls ON wld.station_id = wls.id
ORDER BY wld.timestamp DESC LIMIT 10;
-- Expected: timestamp is recent

-- Verify cron jobs active
SELECT jobname, schedule, active FROM cron.job
WHERE jobname IN ('fetch-precipitation-summary-daily', 'fetch-water-level-hourly');
-- Expected: Both show active=true
```

### 3. Check Frontend

1. Open https://your-netlify-url.netlify.app
2. Navigate to **Meteorology** module
3. Verify **PrecipitationSummaryCard** shows recent data
4. Check "Last updated" timestamp (should be recent)
5. Navigate to **Water Level** module
6. Verify water levels are current

---

## 📊 Expected Results

### Immediate (within 5 minutes):
- ✅ Both functions execute successfully via curl
- ✅ Database shows fresh timestamps (updated_at)
- ✅ No errors in Supabase function logs

### Short-term (next 24 hours):
- ✅ Precipitation cron runs at 6:00 AM UTC (tomorrow)
- ✅ Water level cron runs every hour at :10
- ✅ Frontend displays fresh data

### Monitor Cron Job Execution:

```sql
-- Check recent cron job runs
SELECT start_time, status, return_message
FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job
  WHERE jobname IN ('fetch-precipitation-summary-daily', 'fetch-water-level-hourly')
)
ORDER BY start_time DESC LIMIT 20;
-- Expected: status='succeeded' for recent runs
```

---

## 🛟 Troubleshooting

### Issue: "HOTFIX_018_019.sql" nem található

```bash
# Check current directory
pwd
# Should be: /Volumes/Endre_Samsung1T/codeing/dunapp-pwa

# List file
ls -la HOTFIX_018_019.sql
# Should exist in project root
```

### Issue: SQL Editor hibát ad

- Ellenőrizd, hogy a teljes SQL-t kimásoltad-e (4203 karakter)
- Futtasd le részletekben:
  1. Először csak a Migration 018 CREATE FUNCTION-t
  2. Majd a Migration 019 CREATE FUNCTION-t
  3. Végül a verification query-ket

### Issue: Cron job még mindig nem fut

```sql
-- Check cron job configuration
SELECT * FROM cron.job
WHERE jobname LIKE 'fetch-%';

-- Manually trigger the cron
SELECT cron.schedule_in_database(
  'manual-precipitation-test',
  '* * * * *',  -- Run every minute for testing
  $$SELECT invoke_fetch_precipitation_summary()$$
);

-- After 2-3 minutes, check if it ran
SELECT * FROM cron.job_run_details
WHERE jobname = 'manual-precipitation-test'
ORDER BY start_time DESC;

-- Remove test job
SELECT cron.unschedule('manual-precipitation-test');
```

---

## 📄 Files Created

1. `supabase/migrations/018_fix_precipitation_cron_url.sql` - Migration 018
2. `supabase/migrations/019_fix_water_level_cron_url.sql` - Migration 019
3. `HOTFIX_018_019.sql` - Combined SQL for manual execution
4. `DEPLOY_INSTRUCTIONS.md` - This file

---

## 🎯 Next Steps After Deployment

1. [ ] Run HOTFIX_018_019.sql in Supabase Dashboard
2. [ ] Test both functions manually (curl commands above)
3. [ ] Verify database data updated
4. [ ] Monitor cron job runs for 24 hours
5. [ ] Update CLAUDE.md with hotfix changelog

---

**Prepared by:** Claude Code
**Date:** 2025-12-07
**Status:** Ready for deployment
