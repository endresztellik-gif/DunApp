-- ============================================================================
-- MIGRATION 018: Fix Precipitation Summary Cron Job URL
-- ============================================================================
-- Issue: Migration 017 had incorrect hardcoded Supabase URL
-- Impact: Daily cron job failed with 404, data only updated manually
-- Fix: Update invoke_fetch_precipitation_summary() with correct project URL
-- ============================================================================
-- Created: 2025-12-07
-- Related: Migration 017 (precipitation_summary cron job)

-- ============================================================================
-- FIX: Update helper function with correct project URL
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_fetch_precipitation_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  -- CORRECTED project URL and anon key
  project_url text := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0';
BEGIN
  -- Call Edge Function using pg_net.http_post
  PERFORM net.http_post(
    url := project_url || '/functions/v1/fetch-precipitation-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{}'::jsonb
  );

  RAISE NOTICE 'Precipitation summary fetch triggered at %', NOW();
END;
$$;

COMMENT ON FUNCTION invoke_fetch_precipitation_summary() IS 'Invokes the fetch-precipitation-summary Edge Function to refresh precipitation data (FIXED URL - Migration 018)';

-- ============================================================================
-- VERIFICATION: Test the function manually
-- ============================================================================

-- Trigger function to verify it works
SELECT invoke_fetch_precipitation_summary();

-- Verify cron job is still active
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'fetch-precipitation-summary-daily';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- BEFORE (Migration 017):
--   URL: https://tihqkmzwfjhfltzskfgi.supabase.co/functions/v1/fetch-precipitation-summary
--   Result: 404 Not Found (wrong project)
--
-- AFTER (Migration 018):
--   URL: https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-precipitation-summary
--   Result: 200 OK (correct project)
--
-- The cron job schedule remains unchanged:
--   - Schedule: '0 6 * * *' (daily at 6:00 AM UTC)
--   - Job name: 'fetch-precipitation-summary-daily'
--
-- To check execution history:
--   SELECT * FROM cron.job_run_details
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-precipitation-summary-daily')
--   ORDER BY start_time DESC LIMIT 10;
--
-- ============================================================================
