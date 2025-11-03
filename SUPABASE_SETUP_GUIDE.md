# Supabase Setup Guide - DunApp PWA

**Created:** 2025-10-30
**Status:** Ready for configuration

---

## Step 1: Get Supabase Credentials

1. Open your Supabase project dashboard: https://app.supabase.com
2. Go to **Settings → API**
3. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **Project Reference ID** (e.g., `abcdefghijklmnop`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

---

## Step 2: Update .env File

Open the `.env` file in the project root and replace these values:

```bash
# Replace these with your actual Supabase credentials:
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (your anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (your service role key)
```

**IMPORTANT:**
- Keep the `VITE_` prefix for frontend variables
- Never commit the service_role key to Git
- The .env file is already in .gitignore

---

## Step 3: Link Supabase Project

Run this command to link the project:

```bash
supabase link --project-ref YOUR-PROJECT-REF
```

Replace `YOUR-PROJECT-REF` with your actual project reference ID from Step 1.

If asked for a database password, get it from:
- Supabase Dashboard → Settings → Database → Database Password

---

## Step 4: Verify Connection

Test the connection:

```bash
supabase status
```

You should see:
- ✅ API URL
- ✅ DB URL
- ✅ Studio URL
- ✅ Project linked successfully

---

## Step 5: Set Supabase Secrets (for Edge Functions)

These secrets are needed for Edge Functions to access external APIs:

```bash
# API Keys
supabase secrets set OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
supabase secrets set METEOBLUE_API_KEY=YOUR_METEOBLUE_API_KEY_HERE
supabase secrets set YR_NO_USER_AGENT="DunApp PWA/1.0 (contact@dunapp.hu)"

# VAPID Keys (for push notifications)
supabase secrets set VITE_VAPID_PUBLIC_KEY=BGU-xuubTzjN5AFb8aEaapyuoBINLd5qUeIocIi1p_ohsBTAsQFpXxByDTatp_19tbvk2DehTighbzIpufhDKdU
supabase secrets set VAPID_PRIVATE_KEY=dysnyO0A961F3BdcSMNVH-fNceUwB-FJ9XdclTDaUF8
supabase secrets set VAPID_SUBJECT=mailto:contact@dunapp.hu
```

**Verify secrets:**
```bash
supabase secrets list
```

You should see all 6 secrets listed.

---

## Step 6: Run Database Migrations

Now that the project is linked, run the migrations:

```bash
supabase db push
```

This will:
- Create all database tables
- Insert seed data (4 cities, 3 stations, 5 locations, 15 wells)
- Set up RLS policies

**Verify seed data:**
```bash
supabase db execute "SELECT COUNT(*) FROM meteorology_cities"
# Expected: 4

supabase db execute "SELECT COUNT(*) FROM water_level_stations"
# Expected: 3

supabase db execute "SELECT COUNT(*) FROM drought_locations"
# Expected: 5

supabase db execute "SELECT COUNT(*) FROM groundwater_wells"
# Expected: 15
```

---

## Step 7: Deploy Edge Functions

Deploy all 4 Edge Functions:

```bash
supabase functions deploy fetch-meteorology
supabase functions deploy fetch-water-level
supabase functions deploy fetch-drought
supabase functions deploy check-water-level-alert
```

**Test functions:**
```bash
# Get your anon key from .env file
ANON_KEY="your_anon_key_here"
PROJECT_REF="your_project_ref"

# Test fetch-meteorology
curl -X POST https://${PROJECT_REF}.supabase.co/functions/v1/fetch-meteorology \
  -H "Authorization: Bearer ${ANON_KEY}"

# Expected response:
# {"success": true, "summary": {"total": 4, "success": 4, "failed": 0}}
```

---

## Step 8: Set Up Cron Jobs

Enable pg_cron extension:

```bash
supabase db execute "CREATE EXTENSION IF NOT EXISTS pg_cron;"
```

Create cron jobs (replace PROJECT_REF and ANON_KEY):

```sql
-- 1. Fetch meteorology data every 20 minutes
SELECT cron.schedule(
  'fetch-meteorology',
  '*/20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/fetch-meteorology',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- 2. Fetch water level data every hour
SELECT cron.schedule(
  'fetch-water-level',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/fetch-water-level',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- 3. Fetch drought data daily at 6:00 AM
SELECT cron.schedule(
  'fetch-drought',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/fetch-drought',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- 4. Check water level alerts every 6 hours
SELECT cron.schedule(
  'check-water-level-alert',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/check-water-level-alert',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

**Verify cron jobs:**
```sql
SELECT * FROM cron.job ORDER BY jobname;
```

---

## Step 9: Test Everything

1. **Check data freshness:**
```sql
SELECT
  'meteorology_data' as table,
  MAX(timestamp) as latest,
  COUNT(*) as records
FROM meteorology_data;
```

2. **Check for errors:**
```sql
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 10;
```

3. **Test push notification:**
```bash
curl -X POST https://${PROJECT_REF}.supabase.co/functions/v1/check-water-level-alert \
  -H "Authorization: Bearer ${ANON_KEY}"
```

---

## Troubleshooting

### Issue: "Project not found"
- Check project reference ID is correct
- Verify you have access to the project

### Issue: "Database password required"
- Get password from Supabase Dashboard → Settings → Database
- Or reset database password

### Issue: "Secrets not set"
- Run `supabase secrets list` to verify
- Re-run `supabase secrets set` commands

### Issue: "Migration failed"
- Check for existing tables: `supabase db execute "\dt"`
- Reset if needed (WARNING: deletes data): `supabase db reset`

---

## Quick Commands Reference

```bash
# Link project
supabase link --project-ref YOUR-PROJECT-REF

# Check status
supabase status

# Run migrations
supabase db push

# Deploy function
supabase functions deploy FUNCTION-NAME

# Test function
supabase functions invoke FUNCTION-NAME

# View logs
supabase functions logs FUNCTION-NAME

# List secrets
supabase secrets list

# Execute SQL
supabase db execute "YOUR SQL HERE"
```

---

## Next Steps After Setup

1. Update frontend to use real data (remove mock data)
2. Test all modules in development
3. Run integration tests
4. Deploy frontend to Netlify
5. Monitor data quality for 24 hours
6. Go live! 🚀

---

**Setup Status:** ⏳ Pending manual configuration

**Complete this guide to:** ✅ Finish Phase 4-7 (API Integration)

---

*Generated: 2025-10-30*
*Last Updated: 2025-10-30*
