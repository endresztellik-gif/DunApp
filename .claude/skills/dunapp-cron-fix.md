# Skill: DunApp Broken Cron Job Debugging

Use this skill when a cron job appears to not be running or data is not updating automatically.

## Common Failure Causes

1. **Wrong Supabase project URL in helper function** - Most common cause. URL was copied from wrong project.
   - CORRECT URL: `https://zpwoicpajmvbtmtumsah.supabase.co`
   - WRONG URL (old mistake): `https://tihqkmzwfjhfltzskfgi.supabase.co`

2. **Cron job was never created** - Migration was written but never deployed to Supabase.

3. **service_role_key returning NULL** - `current_setting('app.settings.service_role_key', true)` may return NULL.
   - Solution: Use anon key in the helper function (Edge Functions are protected by JWT auth).

4. **Cron schedule pattern confusion** - `0 5 */5 * *` is day-of-month (1,6,11,...) NOT uniform 5-day intervals.
   - For uniform 5-day intervals: use daily cron + smart threshold function (see Migration 025).

5. **Edge Function code error** - The function was deployed but throws an exception.
   - Check: Edge Function logs in Supabase Dashboard.

---

## Step 1: Check If Cron Job Exists

Run in Supabase Dashboard > SQL Editor:

```sql
SELECT jobid, jobname, schedule, command, active
FROM cron.job
ORDER BY jobid;
```

If the job is missing entirely, the migration that creates it was never deployed. Deploy the migration via SQL Editor.

---

## Step 2: Check Cron Job Run History

```sql
SELECT
  j.jobname,
  d.start_time,
  d.end_time,
  d.status,
  d.return_message
FROM cron.job_run_details d
JOIN cron.job j ON d.jobid = j.jobid
WHERE j.jobname LIKE 'fetch-%'
ORDER BY d.start_time DESC
LIMIT 20;
```

Interpret results:
- `status = 'succeeded'` but data still stale -> Function ran but URL was wrong (404 response)
- `status = 'failed'` -> The pg function threw an error (check `return_message`)
- No rows / no recent rows -> Cron job does not exist or has wrong schedule

---

## Step 3: Check Edge Function Logs

In Supabase Dashboard > Edge Functions > select function > Logs tab.

---

## Step 4: Verify the Correct Supabase Project URL

The correct project URL is always `zpwoicpajmvbtmtumsah`.

```bash
# Verify from project .env
grep SUPABASE_URL /Volumes/Endre_Samsung1T/codeing/dunapp-pwa/.env
# Expected: VITE_SUPABASE_URL=https://zpwoicpajmvbtmtumsah.supabase.co
```

---

## Pattern: Fix Wrong URL in Helper Function

If the helper function has the wrong Supabase URL:

```sql
-- Check current helper function body
SELECT prosrc
FROM pg_proc
WHERE proname = 'invoke_fetch_precipitation_summary';

-- Fix: Replace the function with correct URL
CREATE OR REPLACE FUNCTION public.invoke_fetch_precipitation_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  project_url text := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  anon_key text := 'eyJhbGci...';  -- anon key from .env VITE_SUPABASE_ANON_KEY
  function_url text;
  request_id bigint;
BEGIN
  function_url := project_url || '/functions/v1/fetch-precipitation-summary';

  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'Function triggered, request_id: %', request_id;
END;
$function$;
```

Note: Use anon key (not service_role_key) because `current_setting('app.settings.service_role_key', true)` often returns NULL in Supabase Edge Function invocations.

---

## Pattern: Create Missing Cron Job

If the job does not exist (was never deployed):

```sql
-- Create cron job (example for precipitation summary)
SELECT cron.schedule(
  'fetch-precipitation-summary-daily',  -- job name (must be unique)
  '0 6 * * *',                          -- schedule: daily at 06:00 UTC
  $$SELECT invoke_fetch_precipitation_summary()$$
);

-- Verify it was created
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'fetch-precipitation-summary-daily';
```

---

## Pattern: Smart Threshold Cron (for infrequent fetches)

When you need TRUE N-day intervals that work across month boundaries (see Migration 025 for full implementation):

```sql
-- Smart function: only fetches if N days have passed since last data
CREATE OR REPLACE FUNCTION invoke_fetch_groundwater_vizugy_smart()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  last_run_date timestamptz;
  days_since_last_run numeric;
BEGIN
  SELECT MAX(timestamp) INTO last_run_date FROM groundwater_data;
  days_since_last_run := EXTRACT(EPOCH FROM (NOW() - last_run_date)) / 86400.0;

  IF days_since_last_run >= 5.0 OR last_run_date IS NULL THEN
    PERFORM net.http_post(
      url := 'https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-groundwater-vizugy',
      headers := jsonb_build_object('Authorization', 'Bearer ' || anon_key, 'Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
    RAISE NOTICE 'Triggered (%.1f days since last run)', days_since_last_run;
  ELSE
    RAISE NOTICE 'Skipping - only %.1f days since last run (need 5.0)', days_since_last_run;
  END IF;
END;
$$;

-- Schedule daily but the function self-regulates
SELECT cron.schedule('fetch-groundwater-daily', '0 5 * * *',
  $$SELECT invoke_fetch_groundwater_vizugy_smart()$$
);
```

---

## Quick Diagnostics Checklist

1. Is the cron job in `cron.job`? (Step 1)
2. Is it `active = true`?
3. Does `cron.job_run_details` show recent runs? (Step 2)
4. Do recent runs have `status = 'succeeded'`?
5. If succeeded but data stale: check the URL in the helper function (Step 4)
6. If failed: check `return_message` and Edge Function logs (Step 3)
7. Can you trigger the Edge Function manually via curl? (see dunapp-deploy.md)
8. If manual trigger works but cron does not: the helper function has wrong URL or is missing

---

## Known Past Issues (for reference)

| Date | Issue | Cause | Fix |
|------|-------|-------|-----|
| 2025-12-07 | Precipitation & water level never auto-updated | Wrong URL (tihqkmzwfjhfltzskfgi) in Migrations 015+017 | Migrations 018+019 with correct URL |
| 2026-01-12 | Precipitation cron still not running | Migration 018 fixed function but forgot to create cron job | Manually ran `cron.schedule()` |
| 2026-01-23 | Groundwater frozen at Jan 9 | Migration 021 never deployed | Deployed via SQL Editor |
| 2026-01-23 | Helper function errored | service_role_key returned NULL | Switched to anon key |
| 2026-02-01 | Groundwater failing (vizugy.hu API change) | chartView() gained new string param | Regex fix in Edge Function |
| 2026-02-01 | Non-uniform 5-day intervals | `*/5` in day-of-month = 1,6,11... not every 5 days | Smart threshold function (Migration 025) |
