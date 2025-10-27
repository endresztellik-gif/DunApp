# Supabase Deployment Guide - DunApp PWA

> **Complete guide for setting up and deploying the DunApp PWA Supabase backend**

**Last Updated:** 2025-10-27
**Version:** 1.0
**Status:** Ready for Deployment

---

## 📋 PREREQUISITES

Before deploying, ensure you have:

- [x] Node.js 18+ installed
- [x] Supabase CLI installed: `npm install -g supabase`
- [x] Git installed
- [x] API keys from DATA_SOURCES.md
- [x] VAPID keys for push notifications

---

## 🚀 PHASE 1: CREATE SUPABASE PROJECT

### Step 1: Create Project on Supabase

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in project details:
   - **Name:** `dunapp-pwa` or `dunapp-production`
   - **Database Password:** (generate strong password, save it securely!)
   - **Region:** Select closest to Hungary (e.g., `eu-central-1` Frankfurt)
   - **Plan:** Free tier is sufficient for MVP, upgrade to Pro later if needed
5. Click **"Create new project"**
6. Wait 2-3 minutes for project initialization

### Step 2: Get Project Credentials

Once project is ready:

1. Go to **Settings** → **API**
2. Note down these values:

```
Project URL:          https://YOUR_PROJECT_REF.supabase.co
Project Ref:          YOUR_PROJECT_REF
API Key (anon/public): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key:      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANT:** Keep Service Role Key secret! Never commit it to Git.

---

## 🗄️ PHASE 2: DEPLOY DATABASE SCHEMA

### Step 1: Link Local Project to Supabase

```bash
cd /path/to/dunapp-pwa

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Run Migrations

```bash
# Apply all migrations
supabase db push

# This will run:
# - 001_initial_schema.sql (creates all tables)
# - 002_seed_data.sql (seeds 27 locations)
# - 003_rls_policies.sql (enables RLS and creates policies)
```

### Step 3: Verify Migrations

Open Supabase Dashboard → **Table Editor** and verify:

- ✅ 13 tables created (meteorology_cities, meteorology_data, water_level_stations, etc.)
- ✅ 4 meteorology cities seeded
- ✅ 3 water level stations seeded
- ✅ 5 drought locations seeded
- ✅ 15 groundwater wells seeded
- ✅ **Total: 27 locations**

### Step 4: Verify RLS Policies

Go to **Database** → **Policies** and check:

- ✅ RLS enabled on all tables
- ✅ Public SELECT policies exist for location tables
- ✅ Service role policies exist for data tables
- ✅ Push subscription policies allow public INSERT/DELETE

### Alternative: Manual Migration

If `supabase db push` doesn't work, run migrations manually:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click **"Run"**
4. Repeat for `002_seed_data.sql`
5. Repeat for `003_rls_policies.sql`

---

## ⚡ PHASE 3: DEPLOY EDGE FUNCTIONS

### Step 1: Set Environment Variables

Go to **Settings** → **Edge Functions** → **Environment Variables**

Add these variables:

```env
# Meteorology APIs
OPENWEATHER_API_KEY=cd125c5eeeda398551503129fc08636d
METEOBLUE_API_KEY=M3VCztJiO2Gn7jsS

# Push Notifications (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=your_generated_vapid_public_key
VAPID_PRIVATE_KEY=your_generated_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com

# Yr.no User-Agent
YR_NO_USER_AGENT=DunApp PWA/1.0 (contact@dunapp.hu)

# Debug
DEBUG=true
```

### Step 2: Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Copy the output and add to environment variables above.

### Step 3: Deploy Edge Functions

```bash
# Deploy all functions at once
supabase functions deploy fetch-meteorology
supabase functions deploy fetch-water-level
supabase functions deploy fetch-drought
supabase functions deploy check-water-level-alert
```

### Step 4: Test Edge Functions

```bash
# Test fetch-meteorology
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-meteorology \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Expected response: JSON with placeholder message
```

Repeat for other functions.

---

## 🕐 PHASE 4: SET UP CRON JOBS

### Enable pg_cron Extension

1. Go to **Database** → **Extensions**
2. Search for `pg_cron`
3. Click **"Enable"**

### Create Cron Jobs

Go to **SQL Editor** and run:

```sql
-- Enable pg_net extension (for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Meteorology: Every 20 minutes
SELECT cron.schedule(
  'fetch-meteorology',
  '*/20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-meteorology',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Water Level: Every hour
SELECT cron.schedule(
  'fetch-water-level',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-water-level',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Drought: Daily at 6:00 AM
SELECT cron.schedule(
  'fetch-drought',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-drought',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Water Level Alert Check: Every 6 hours
SELECT cron.schedule(
  'check-water-level-alert',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-water-level-alert',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

**IMPORTANT:** Replace `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY` with actual values!

### Verify Cron Jobs

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- Should show 4 jobs:
-- 1. fetch-meteorology (*/20 * * * *)
-- 2. fetch-water-level (0 * * * *)
-- 3. fetch-drought (0 6 * * *)
-- 4. check-water-level-alert (0 */6 * * *)
```

### Monitor Cron Execution

```sql
-- View cron job run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

---

## 🌐 PHASE 5: CONFIGURE FRONTEND

### Step 1: Update .env File

Create `.env` file in project root (if not exists):

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### Step 2: Update Netlify Environment Variables

If deploying to Netlify:

1. Go to **Site Settings** → **Environment Variables**
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY`

### Step 3: Test Connection

```bash
npm run dev
```

Open browser console and check for Supabase connection errors.

---

## ✅ PHASE 6: VERIFICATION CHECKLIST

Run these queries in Supabase SQL Editor to verify everything is set up correctly:

### Verify Locations (27 total)

```sql
-- Should return 27 locations
SELECT
  'Meteorology Cities' AS type, COUNT(*) AS count FROM meteorology_cities
UNION ALL
SELECT 'Water Level Stations', COUNT(*) FROM water_level_stations
UNION ALL
SELECT 'Drought Locations', COUNT(*) FROM drought_locations
UNION ALL
SELECT 'Groundwater Wells', COUNT(*) FROM groundwater_wells
UNION ALL
SELECT 'TOTAL',
  (SELECT COUNT(*) FROM meteorology_cities) +
  (SELECT COUNT(*) FROM water_level_stations) +
  (SELECT COUNT(*) FROM drought_locations) +
  (SELECT COUNT(*) FROM groundwater_wells);
```

Expected output:
```
type                      | count
--------------------------+-------
Meteorology Cities        |     4
Water Level Stations      |     3
Drought Locations         |     5
Groundwater Wells         |    15
TOTAL                     |    27
```

### Verify Critical Water Levels

```sql
-- Verify Mohács station critical levels
SELECT
  station_name,
  lnv_level AS "LNV (cm)",
  kkv_level AS "KKV (cm)",
  nv_level AS "NV (cm)"
FROM water_level_stations
WHERE station_name = 'Mohács';
```

Expected output:
```
station_name | LNV (cm) | KKV (cm) | NV (cm)
-------------+----------+----------+---------
Mohács       |      120 |      280 |     700
```

### Verify RLS Policies

```sql
-- Count policies per table
SELECT
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

Expected: Each table should have 2-3 policies.

### Verify Cron Jobs

```sql
-- List all cron jobs
SELECT
  jobname,
  schedule,
  active
FROM cron.job
ORDER BY jobname;
```

Expected: 4 active cron jobs.

---

## 🐛 TROUBLESHOOTING

### Issue: Migrations Fail

**Solution:**
```bash
# Reset database (WARNING: deletes all data!)
supabase db reset

# Or manually run migrations in SQL Editor
```

### Issue: Edge Functions Not Deploying

**Solution:**
```bash
# Check function logs
supabase functions logs fetch-meteorology

# Redeploy with verbose output
supabase functions deploy fetch-meteorology --debug
```

### Issue: Cron Jobs Not Running

**Solution:**
```sql
-- Check if pg_cron is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check cron job status
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC LIMIT 10;

-- Manually trigger a job
SELECT cron.unschedule('fetch-meteorology');
SELECT cron.schedule(...);  -- Re-create the job
```

### Issue: RLS Policies Blocking Queries

**Solution:**
```sql
-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE meteorology_cities DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE meteorology_cities ENABLE ROW LEVEL SECURITY;

-- Check policy definitions
SELECT * FROM pg_policies WHERE tablename = 'meteorology_cities';
```

### Issue: Environment Variables Not Set

**Solution:**
1. Go to **Settings** → **Edge Functions** → **Environment Variables**
2. Verify all variables are set
3. Redeploy functions after adding variables:
   ```bash
   supabase functions deploy fetch-meteorology
   ```

---

## 📊 MONITORING

### Database Size

```sql
-- Check database size
SELECT
  pg_size_pretty(pg_database_size(current_database())) AS database_size;
```

### Table Sizes

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Row Counts

```sql
-- Check row counts for data tables
SELECT 'meteorology_data' AS table_name, COUNT(*) FROM meteorology_data
UNION ALL
SELECT 'water_level_data', COUNT(*) FROM water_level_data
UNION ALL
SELECT 'drought_data', COUNT(*) FROM drought_data
UNION ALL
SELECT 'groundwater_data', COUNT(*) FROM groundwater_data;
```

### Function Execution Stats

```bash
# View function logs
supabase functions logs fetch-meteorology --tail

# View function metrics in Supabase Dashboard
# Go to: Edge Functions → Select function → Metrics tab
```

---

## 🔒 SECURITY BEST PRACTICES

1. **Never commit secrets to Git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for templates only

2. **Rotate API keys regularly**
   - OpenWeatherMap: Generate new key every 6 months
   - Service Role Key: Only if compromised

3. **Monitor for suspicious activity**
   - Check logs for unusual patterns
   - Set up alerts for high API usage

4. **Enable database backups**
   - Go to **Database** → **Backups**
   - Enable daily backups (Pro plan)

5. **Use connection pooling**
   - Already configured in `config.toml`
   - Max 100 client connections

---

## 📈 SCALING CONSIDERATIONS

### Free Tier Limits
- Database: 500 MB
- Bandwidth: 2 GB/month
- Edge Functions: 500,000 invocations/month

### When to Upgrade to Pro ($25/month)
- Database exceeds 400 MB
- Bandwidth exceeds 1.5 GB/month
- Need daily backups
- Need more than 2 cron jobs

### Optimization Tips
- Use indexes (already included in schema)
- Cache frequently accessed data
- Limit data retention (e.g., keep only last 90 days)

---

## 🎯 NEXT STEPS

After successful deployment:

1. **Data Engineer Tasks:**
   - Implement actual API integrations in Edge Functions
   - Replace placeholder code with real data fetching
   - Test each data source (OpenWeather, vizugy.hu, etc.)

2. **Frontend Developer Tasks:**
   - Connect React components to Supabase
   - Test data fetching in UI
   - Implement push notification subscription

3. **Testing:**
   - Verify all 27 locations display correctly
   - Test push notifications
   - Monitor cron job execution

4. **Production Deployment:**
   - Deploy frontend to Netlify
   - Test end-to-end workflow
   - Monitor for errors

---

## 📚 USEFUL COMMANDS

```bash
# Supabase CLI commands
supabase login
supabase link --project-ref YOUR_REF
supabase db push
supabase db reset
supabase functions deploy FUNCTION_NAME
supabase functions logs FUNCTION_NAME --tail

# Generate TypeScript types from database
supabase gen types typescript --linked > src/types/database.types.ts

# Test Edge Function locally
supabase functions serve FUNCTION_NAME

# View database migrations status
supabase migration list
```

---

## 🔗 RESOURCES

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Cron Documentation](https://github.com/citusdata/pg_cron)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)

---

**Deployment Guide v1.0**
**DunApp PWA - Backend Infrastructure**
**Created:** 2025-10-27
**Status:** ✅ Complete and Ready
