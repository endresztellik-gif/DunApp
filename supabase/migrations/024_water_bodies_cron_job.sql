-- DunApp PWA - Setup Cron Job for Water Bodies Data Refresh
-- Migration: 024_water_bodies_cron_job.sql
-- Created: 2026-01-31
-- Description: Sets up automatic daily water bodies data refresh (Kadia, FTCS, Belső-Béda)
-- Schedule: Daily at 7:00 AM UTC (8:00 CET / 9:00 CEST) - 1 hour after 6:00 AM measurements

-- ============================================================================
-- HELPER FUNCTION: Invoke all 3 water bodies Edge Functions via HTTP
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_fetch_water_bodies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id_kadia bigint;
  request_id_ftcs bigint;
  request_id_beda bigint;
  project_url text := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0';
BEGIN
  -- Call Kadia Edge Function
  SELECT net.http_post(
    url := project_url || '/functions/v1/fetch-kadia-water-level',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id_kadia;

  -- Call FTCS (Karapancsa) Edge Function
  SELECT net.http_post(
    url := project_url || '/functions/v1/fetch-ftcs-water-level',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id_ftcs;

  -- Call Belső-Béda Edge Function
  SELECT net.http_post(
    url := project_url || '/functions/v1/fetch-belso-beda-water-level',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id_beda;

  -- Log the requests
  RAISE NOTICE 'Water bodies data refresh triggered - Kadia: %, FTCS: %, Belső-Béda: %',
    request_id_kadia, request_id_ftcs, request_id_beda;
END;
$$;

COMMENT ON FUNCTION invoke_fetch_water_bodies() IS 'Invokes all 3 water bodies Edge Functions (Kadia, FTCS, Belső-Béda) to refresh daily water level data';

-- ============================================================================
-- CRON JOB: Daily Water Bodies Data Refresh
-- ============================================================================

-- Remove existing job if it exists (for migration re-runs)
SELECT cron.unschedule('fetch-water-bodies-daily') WHERE true;

-- Schedule job to run every day at 7:00 AM UTC (8:00 CET / 9:00 CEST)
-- Runs 1 hour after the 6:00 AM measurements to ensure data availability
SELECT cron.schedule(
  'fetch-water-bodies-daily',            -- Job name
  '0 7 * * *',                           -- Cron expression (daily at 7:00 AM UTC)
  $$SELECT invoke_fetch_water_bodies()$$ -- SQL to execute
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that the cron job was created
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'fetch-water-bodies-daily';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Cron Expression: '0 7 * * *'
-- ┌───────────── minute (0 - 59)
-- │ ┌───────────── hour (0 - 23)
-- │ │ ┌───────────── day of the month (1 - 31)
-- │ │ │ ┌───────────── month (1 - 12)
-- │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
-- │ │ │ │ │
-- 0 7 * * *  = Daily at 7:00 AM UTC (8:00 CET / 9:00 CEST)
--
-- SCHEDULE:
-- - Daily refresh at 7:00 AM UTC (1 hour after 6:00 AM measurements)
-- - Fetches water level data for Kadia, FTCS, Belső-Béda
-- - Each Edge Function imports ~15 daily measurements (6:00 AM preference)
--
-- EDGE FUNCTIONS INVOKED:
-- 1. fetch-kadia-water-level
-- 2. fetch-ftcs-water-level
-- 3. fetch-belso-beda-water-level
--
-- DATA SOURCE: https://www.vizugy.hu (HTML scraping)
-- UPDATE FREQUENCY: Daily (vizugy.hu updates hourly, but daily scrape is sufficient)
--
-- MANUAL TRIGGER (for testing):
-- SELECT invoke_fetch_water_bodies();
--
-- MONITOR CRON RUNS:
-- SELECT start_time, status, return_message
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-water-bodies-daily')
-- ORDER BY start_time DESC
-- LIMIT 10;
--
