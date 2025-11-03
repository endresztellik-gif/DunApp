# Fetch Drought Data - Deployment Guide

## Pre-Deployment Checklist

- [ ] Code review completed
- [ ] Local testing passed (see TESTING.md)
- [ ] Database migrations applied
- [ ] Environment variables documented
- [ ] Cron job configuration ready
- [ ] Backup plan prepared

---

## Step 1: Prepare Environment Variables

### Required Variables

```bash
# Supabase credentials (auto-injected by Supabase)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Note: No API key needed for aszalymonitoring.vizugy.hu (public API)
```

### Set in Supabase Dashboard

1. Go to https://app.supabase.com/project/[project-ref]/settings/functions
2. Navigate to "Edge Functions" → "Environment variables"
3. Add variables:
   - `SUPABASE_URL` (usually auto-set)
   - `SUPABASE_SERVICE_ROLE_KEY` (usually auto-set)
4. Click "Save"

**Note:** These are usually auto-injected. Verify in dashboard.

---

## Step 2: Apply Database Migrations

### Option A: Via Supabase CLI

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref [project-ref]

# Push migrations
supabase db push
```

Expected output:
```
Applying migration 012_drought_cron_job.sql...
✓ All migrations applied successfully
```

### Option B: Via Supabase Dashboard

1. Go to https://app.supabase.com/project/[project-ref]/editor
2. Open SQL Editor
3. Copy contents of `supabase/migrations/012_drought_cron_job.sql`
4. Run query
5. Verify output: "Migration applied successfully"

### Verify Migration

```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'fetch-drought-daily';

-- Check if helper function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'invoke_fetch_drought';
```

---

## Step 3: Deploy Edge Function

### Deploy Command

```bash
cd /Volumes/Endre_Samsung1T/codeing/dunapp-pwa

# Deploy fetch-drought function to production
supabase functions deploy fetch-drought --project-ref [project-ref]
```

Expected output:
```
Deploying function fetch-drought...
✓ Function deployed successfully
  URL: https://[project-ref].supabase.co/functions/v1/fetch-drought
```

### Verify Deployment

```bash
# Check function status
supabase functions list --project-ref [project-ref]
```

Expected output:
```
┌─────────────────┬──────────┬────────────────────────┐
│ Name            │ Status   │ Last deployed          │
├─────────────────┼──────────┼────────────────────────┤
│ fetch-drought   │ ACTIVE   │ 2025-11-03 10:30:00 UTC│
└─────────────────┴──────────┴────────────────────────┘
```

---

## Step 4: Test Deployed Function

### Manual Test

```bash
# Get service role key from dashboard
export SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test function
curl -X POST https://[project-ref].supabase.co/functions/v1/fetch-drought \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2025-11-03T10:35:00.000Z",
  "duration": 12453,
  "summary": {
    "total": 5,
    "success": 5,
    "failed": 0
  },
  "results": [...]
}
```

### Verify Database

```sql
-- Connect to production database
-- supabase db connect --project-ref [project-ref]

SELECT
  dl.location_name,
  dd.drought_index,
  dd.soil_moisture_20cm,
  dd.timestamp
FROM drought_data dd
JOIN drought_locations dl ON dd.location_id = dl.id
ORDER BY dd.timestamp DESC
LIMIT 5;
```

Expected: 5 rows (1 per location)

---

## Step 5: Configure Cron Job

### Set Environment Variables for Cron

The cron job needs to know the Supabase URL and service role key.

**Option A: Use Supabase Vault (Recommended)**

```sql
-- Store service role key in vault
SELECT vault.create_secret(
  'service_role_key',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'Service role key for Edge Function calls'
);

-- Update helper function to use vault
CREATE OR REPLACE FUNCTION invoke_fetch_drought()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url TEXT := 'https://[project-ref].supabase.co';
BEGIN
  PERFORM net.http_post(
    url := project_url || '/functions/v1/fetch-drought',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || vault.decrypted_secret('service_role_key')
    )
  );
END;
$$;
```

**Option B: Hardcode URL (Less Secure)**

```sql
-- Update helper function with hardcoded URL
CREATE OR REPLACE FUNCTION invoke_fetch_drought()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/fetch-drought',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    )::jsonb
  );
END;
$$;
```

### Test Cron Job

```sql
-- Manually trigger cron job
SELECT invoke_fetch_drought();

-- Check cron job run history
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-drought-daily')
ORDER BY start_time DESC
LIMIT 5;
```

Expected output:
```
jobid | runid | job_pid | database | username | command | status | start_time | end_time
------|-------|---------|----------|----------|---------|--------|------------|----------
123   | 456   | 789     | postgres | postgres | ...     | succeeded | 2025-11-03 10:40:00 | 2025-11-03 10:40:15
```

---

## Step 6: Monitor & Verify

### Check Logs (First 24 Hours)

**Supabase Dashboard:**
1. Go to https://app.supabase.com/project/[project-ref]/functions
2. Click "fetch-drought"
3. Click "Invocations" tab
4. Monitor for:
   - Success rate (should be 100%)
   - Average duration (should be < 30s)
   - Error rate (should be 0%)

**CLI:**
```bash
# Stream logs in real-time
supabase functions logs fetch-drought --project-ref [project-ref] --follow

# View last 100 log entries
supabase functions logs fetch-drought --project-ref [project-ref] --limit 100
```

### Check Cron Execution

```sql
-- View cron job execution history (last 7 days)
SELECT
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-drought-daily')
  AND start_time > NOW() - INTERVAL '7 days'
ORDER BY start_time DESC;
```

### Data Quality Check

```sql
-- Check for NULL values (should be minimal)
SELECT
  dl.location_name,
  COUNT(*) AS total_records,
  COUNT(drought_index) AS has_drought_index,
  COUNT(soil_moisture_20cm) AS has_soil_moisture,
  AVG(drought_index) AS avg_drought_index
FROM drought_data dd
JOIN drought_locations dl ON dd.location_id = dl.id
WHERE dd.timestamp > NOW() - INTERVAL '7 days'
GROUP BY dl.location_name;
```

Expected:
- `total_records`: ~7 (1 per day for 7 days)
- `has_drought_index`: ~7 (100% data availability)
- `avg_drought_index`: -5 to +5 (typical range)

---

## Step 7: Set Up Alerts (Optional)

### Email Alerts on Failure

**Option A: Supabase Dashboard**
1. Go to Project Settings → Integrations
2. Add Webhook for Edge Function failures
3. Configure email notification service (e.g., SendGrid)

**Option B: Custom SQL Alert**

```sql
-- Create alert function
CREATE OR REPLACE FUNCTION check_fetch_drought_health()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  failed_count INT;
BEGIN
  -- Count failures in last 24 hours
  SELECT COUNT(*) INTO failed_count
  FROM cron.job_run_details
  WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-drought-daily')
    AND status = 'failed'
    AND start_time > NOW() - INTERVAL '24 hours';

  -- Send alert if failures detected
  IF failed_count > 0 THEN
    PERFORM net.http_post(
      url := 'https://your-webhook-url.com/alert',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'alert', 'fetch-drought failures detected',
        'failed_count', failed_count,
        'timestamp', NOW()
      )
    );
  END IF;
END;
$$;

-- Schedule health check (run every 6 hours)
SELECT cron.schedule(
  'check-fetch-drought-health',
  '0 */6 * * *',
  'SELECT check_fetch_drought_health();'
);
```

---

## Rollback Plan

### If Deployment Fails

1. **Undeploy Edge Function:**
   ```bash
   supabase functions delete fetch-drought --project-ref [project-ref]
   ```

2. **Disable Cron Job:**
   ```sql
   SELECT cron.unschedule('fetch-drought-daily');
   ```

3. **Revert Database Migration:**
   ```sql
   -- Drop cron job
   SELECT cron.unschedule('fetch-drought-daily');

   -- Drop helper function
   DROP FUNCTION IF EXISTS invoke_fetch_drought();
   ```

4. **Restore Previous Version:**
   ```bash
   # Checkout previous commit
   git checkout [previous-commit-hash]

   # Redeploy old version
   supabase functions deploy fetch-drought --project-ref [project-ref]
   ```

---

## Post-Deployment Monitoring

### First Week Checklist

Day 1:
- [ ] Check logs every hour for errors
- [ ] Verify first cron execution at 6:00 AM
- [ ] Confirm 5 records inserted daily

Day 3:
- [ ] Review average execution time
- [ ] Check for any NULL values in data
- [ ] Verify no API rate limiting issues

Day 7:
- [ ] Analyze 7-day data quality
- [ ] Review error patterns (if any)
- [ ] Optimize if execution time > 30s

### Metrics to Track

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Success Rate | 100% | - | - |
| Avg Duration | < 30s | - | - |
| Data Completeness | > 95% | - | - |
| Cron Reliability | 100% | - | - |

---

## Troubleshooting

### Issue: Cron job not executing

**Check:**
```sql
-- Is cron job scheduled?
SELECT * FROM cron.job WHERE jobname = 'fetch-drought-daily';

-- Are there any errors?
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-drought-daily')
ORDER BY start_time DESC LIMIT 5;
```

**Solution:**
- Verify pg_cron extension is enabled
- Check helper function exists and has correct URL
- Ensure service role key is valid

### Issue: Edge Function timeout

**Check:**
```bash
supabase functions logs fetch-drought --project-ref [project-ref] | grep timeout
```

**Solution:**
- Increase `REQUEST_TIMEOUT` in code
- Reduce `MAX_RETRIES` from 3 to 2
- Check aszalymonitoring API status

### Issue: No data inserted

**Check:**
```sql
SELECT COUNT(*) FROM drought_data
WHERE timestamp > NOW() - INTERVAL '24 hours';
```

**Solution:**
- Verify `drought_locations` table has 5 records
- Check RLS policies allow inserts from service role
- Review Edge Function logs for errors

---

## Deployment Completion

After successful deployment:

1. **Update Documentation:**
   - Mark deployment date in CLAUDE.md
   - Update API_DOCS.md with any changes
   - Document any issues encountered

2. **Notify Team:**
   - Share deployment status
   - Provide dashboard links
   - Schedule review meeting (Day 7)

3. **Archive Deployment:**
   ```bash
   git tag -a v1.0.0-drought -m "Drought module backend deployed"
   git push origin v1.0.0-drought
   ```

---

**Deployed:** [DATE]
**Deployed by:** [NAME]
**Status:** ✅ Production Ready
