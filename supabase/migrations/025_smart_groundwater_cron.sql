-- DunApp PWA - Smart 5-Day Groundwater Cron Fix
-- Migration: 025_smart_groundwater_cron.sql
-- Created: 2026-02-01
-- Description: Fixes cron schedule to TRUE 5-day intervals (not day-of-month pattern)
-- Issue: `0 5 */5 * *` runs on day 1,6,11,16,21,26,31 - NOT uniform intervals!
-- Solution: Daily cron (0 5 * * *) + smart function checks if ≥5 days passed

-- ============================================================================
-- SMART HELPER FUNCTION: Check last run date before fetching
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_fetch_groundwater_vizugy_smart()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  project_url text := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0';
  last_run_date timestamptz;
  days_since_last_run numeric;
BEGIN
  -- Get last successful data timestamp across ALL wells
  SELECT MAX(timestamp) INTO last_run_date
  FROM groundwater_data;

  -- Calculate days since last run
  IF last_run_date IS NOT NULL THEN
    days_since_last_run := EXTRACT(EPOCH FROM (NOW() - last_run_date)) / 86400.0;
  ELSE
    days_since_last_run := 999; -- Force run if no data exists
  END IF;

  -- Only run if ≥5 days have passed
  IF days_since_last_run >= 5.0 OR last_run_date IS NULL THEN
    -- Fetch groundwater data via Edge Function
    SELECT net.http_post(
      url := project_url || '/functions/v1/fetch-groundwater-vizugy',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || anon_key,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) INTO request_id;

    RAISE NOTICE 'Groundwater refresh triggered (%.1f days since last): request_id=%',
      days_since_last_run, request_id;
  ELSE
    RAISE NOTICE 'Skipping groundwater refresh - only %.1f days since last run (need 5.0)',
      days_since_last_run;
  END IF;
END;
$$;

COMMENT ON FUNCTION invoke_fetch_groundwater_vizugy_smart() IS
  'Smart groundwater fetch: runs daily but only fetches if ≥5 days since last data. Enables TRUE 5-day sampling across month boundaries.';

-- ============================================================================
-- UPDATE CRON JOB: Daily execution with smart threshold check
-- ============================================================================

-- Remove old cron job (runs on day 1,6,11,16,21,26,31)
SELECT cron.unschedule('fetch-groundwater-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fetch-groundwater-daily');

-- Create new DAILY cron job (smart function checks 5-day threshold)
SELECT cron.schedule(
  'fetch-groundwater-daily',
  '0 5 * * *',                                    -- Daily at 05:00 UTC (6:00 CET / 7:00 CEST)
  $$SELECT invoke_fetch_groundwater_vizugy_smart()$$ -- Smart function (checks threshold)
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that the new cron job was created
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'fetch-groundwater-daily';

-- Expected result:
-- jobname: fetch-groundwater-daily
-- schedule: 0 5 * * * (DAILY, not */5)
-- command: SELECT invoke_fetch_groundwater_vizugy_smart()
-- active: true

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- OLD SCHEDULE: '0 5 */5 * *'
-- ┌───────────── minute (0)
-- │ ┌───────────── hour (5)
-- │ │ ┌───────────── day of month (*/5 = 1,6,11,16,21,26,31) ❌ WRONG!
-- │ │ │ ┌───────────── month (any)
-- │ │ │ │ ┌───────────── day of week (any)
-- 0 5 */5 * *  = Runs on day 1,6,11,16,21,26,31 (NOT uniform 5-day intervals!)
--
-- NEW SCHEDULE: '0 5 * * *'
-- ┌───────────── minute (0)
-- │ ┌───────────── hour (5)
-- │ │ ┌───────────── day of month (any) ✅ DAILY
-- │ │ │ ┌───────────── month (any)
-- │ │ │ │ ┌───────────── day of week (any)
-- 0 5 * * *  = DAILY at 05:00 UTC (smart function checks threshold)
--
-- SMART FUNCTION BEHAVIOR:
-- - Runs daily at 05:00 UTC
-- - Checks: Has ≥5 days passed since last data?
-- - If YES → Fetch new data via Edge Function
-- - If NO → Skip (log "only X.X days since last run")
--
-- EXAMPLE TIMELINE (assuming successful fetches):
-- - Feb 1, 05:00 UTC: Run → 6.0 days since last → FETCH ✅
-- - Feb 2, 05:00 UTC: Run → 1.0 days since last → SKIP ⏭️
-- - Feb 3, 05:00 UTC: Run → 2.0 days since last → SKIP ⏭️
-- - Feb 4, 05:00 UTC: Run → 3.0 days since last → SKIP ⏭️
-- - Feb 5, 05:00 UTC: Run → 4.0 days since last → SKIP ⏭️
-- - Feb 6, 05:00 UTC: Run → 5.0 days since last → FETCH ✅
--
-- BENEFITS:
-- ✅ TRUE 5-day sampling (works across month boundaries)
-- ✅ Uniform intervals (not dependent on day-of-month)
-- ✅ Self-adjusting (if manual trigger happens, auto-adjusts next run)
-- ✅ Logs skipped runs for debugging
--
-- MANUAL TRIGGER (for testing):
-- SELECT invoke_fetch_groundwater_vizugy_smart();
--
-- MONITOR CRON RUNS:
-- SELECT start_time, status, return_message
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-groundwater-daily')
-- ORDER BY start_time DESC
-- LIMIT 10;
--
-- CHECK LAST DATA TIMESTAMP:
-- SELECT MAX(timestamp) as last_data,
--        EXTRACT(EPOCH FROM (NOW() - MAX(timestamp))) / 86400.0 as days_ago
-- FROM groundwater_data;
--
