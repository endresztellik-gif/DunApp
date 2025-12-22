-- ============================================================================
-- MIGRATION 019: Fix Water Level Cron Job URL (Correct Migration 015 Mistake)
-- ============================================================================
-- Issue: Migration 015 attempted to fix migration 010, but used WRONG URL
-- Impact: Hourly water level cron job has been broken since migration 015
-- Fix: Update invoke_fetch_water_level() with correct project URL
-- ============================================================================
-- Created: 2025-12-07
-- Related: Migration 010 (water level cron), Migration 015 (incorrect fix)

-- ============================================================================
-- FIX: Update helper function with CORRECT project URL
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_fetch_water_level()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  -- CORRECT project URL and anon key (was wrong in migration 015!)
  project_url text := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0';
BEGIN
  -- Call Edge Function using pg_net.http_post
  SELECT net.http_post(
    url := project_url || '/functions/v1/fetch-water-level',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  -- Log the request
  RAISE NOTICE 'Water level data refresh triggered: request_id=%', request_id;
END;
$$;

COMMENT ON FUNCTION invoke_fetch_water_level() IS 'Invokes the fetch-water-level Edge Function to refresh water level data and forecasts (CORRECTED URL - Migration 019)';

-- ============================================================================
-- VERIFICATION: Test the function manually
-- ============================================================================

-- Trigger function to verify it works
SELECT invoke_fetch_water_level();

-- Verify cron job is still active
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'fetch-water-level-hourly';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- HISTORY:
-- - Migration 010: Created with CORRECT URL (zpwoicpajmvbtmtumsah)
-- - Migration 015: "Fixed" but used WRONG URL (tihqkmzwfjhfltzskfgi) ❌
-- - Migration 019: This migration - ACTUALLY fixes it! ✅
--
-- BEFORE (Migration 015):
--   URL: https://tihqkmzwfjhfltzskfgi.supabase.co/functions/v1/fetch-water-level
--   Result: 404 Not Found (wrong project)
--
-- AFTER (Migration 019):
--   URL: https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-water-level
--   Result: 200 OK (correct project)
--
-- The cron job schedule remains unchanged:
--   - Schedule: '10 * * * *' (hourly at :10)
--   - Job name: 'fetch-water-level-hourly'
--
-- To check execution history:
--   SELECT * FROM cron.job_run_details
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-water-level-hourly')
--   ORDER BY start_time DESC LIMIT 10;
--
-- ============================================================================
