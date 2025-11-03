-- DunApp PWA - Setup Cron Job for Water Level Data Refresh
-- Migration: 010_water_level_cron_job.sql
-- Created: 2025-11-03
-- Description: Sets up automatic water level data refresh (current levels + forecasts)
-- Phase: 4.4 - Cron Jobs Setup

-- ============================================================================
-- HELPER FUNCTION: Invoke fetch-water-level Edge Function via HTTP
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_fetch_water_level()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
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

COMMENT ON FUNCTION invoke_fetch_water_level() IS 'Invokes the fetch-water-level Edge Function to refresh water level data and forecasts';

-- ============================================================================
-- CRON JOB: Hourly Water Level Data Refresh
-- ============================================================================

-- Remove existing job if it exists (for migration re-runs)
SELECT cron.unschedule('fetch-water-level-hourly') WHERE true;

-- Schedule job to run every hour at :10 (e.g., 00:10, 01:10, 02:10, etc.)
-- Offset from meteorology job (:05) to avoid concurrent execution
SELECT cron.schedule(
  'fetch-water-level-hourly',            -- Job name
  '10 * * * *',                          -- Cron expression (every hour at :10)
  $$SELECT invoke_fetch_water_level()$$  -- SQL to execute
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
WHERE jobname = 'fetch-water-level-hourly';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Cron Expression: '10 * * * *'
-- ┌───────────── minute (0 - 59)
-- │ ┌───────────── hour (0 - 23)
-- │ │ ┌───────────── day of the month (1 - 31)
-- │ │ │ ┌───────────── month (1 - 12)
-- │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
-- │ │ │ │ │
-- 10 * * * *  = Every hour at 10 minutes past the hour
--
-- SCHEDULE:
-- - Meteorology: Every hour at :05
-- - Water Level: Every hour at :10 (5 minute offset)
--
-- This ensures:
-- 1. Both vizugy.hu (current levels) and hydroinfo.hu (forecasts) are scraped
-- 2. Data is refreshed hourly for up-to-date information
-- 3. No concurrent execution with meteorology job
-- 4. Forecasts are automatically updated (5-day predictions)
--
-- MANUAL OPERATIONS:
-- - Trigger manually: SELECT invoke_fetch_water_level();
-- - Check job history: SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-water-level-hourly') ORDER BY start_time DESC LIMIT 10;
-- - Unschedule: SELECT cron.unschedule('fetch-water-level-hourly');
-- - Re-enable: SELECT cron.schedule('fetch-water-level-hourly', '10 * * * *', $$SELECT invoke_fetch_water_level()$$);
--
-- DATA SOURCES:
-- - vizugy.hu: Current water levels (cm), flow rate (m³/s), water temperature (°C)
-- - hydroinfo.hu: 5-day forecasts (cm) with ISO-8859-2 encoding
--
-- STATIONS:
-- - Nagybajcs (station_id: 442051)
-- - Baja (station_id: 442027)
-- - Mohács (station_id: 442010) - Alert level: 400cm
--
