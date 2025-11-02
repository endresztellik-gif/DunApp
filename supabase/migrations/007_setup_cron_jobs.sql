-- DunApp PWA - Setup Cron Jobs for Automatic Data Refresh
-- Migration: 007_setup_cron_jobs.sql
-- Created: 2025-11-02
-- Description: Enables pg_cron extension and sets up automatic weather data refresh

-- ============================================================================
-- ENABLE EXTENSIONS
-- ============================================================================

-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net for HTTP requests (used to call Edge Functions)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- HELPER FUNCTION: Invoke Edge Function via HTTP
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_fetch_meteorology()
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
    url := project_url || '/functions/v1/fetch-meteorology',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  -- Log the request (optional)
  RAISE NOTICE 'Meteorology data refresh triggered: request_id=%', request_id;
END;
$$;

COMMENT ON FUNCTION invoke_fetch_meteorology() IS 'Invokes the fetch-meteorology Edge Function to refresh weather data';

-- ============================================================================
-- CRON JOB: Hourly Weather Data Refresh
-- ============================================================================

-- Remove existing job if it exists (for migration re-runs)
SELECT cron.unschedule('fetch-meteorology-hourly') WHERE true;

-- Schedule job to run every hour at :05 (e.g., 00:05, 01:05, 02:05, etc.)
SELECT cron.schedule(
  'fetch-meteorology-hourly',           -- Job name
  '5 * * * *',                          -- Cron expression (every hour at :05)
  $$SELECT invoke_fetch_meteorology()$$ -- SQL to execute
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
WHERE jobname = 'fetch-meteorology-hourly';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Cron Expression: '5 * * * *'
-- ┌───────────── minute (0 - 59)
-- │ ┌───────────── hour (0 - 23)
-- │ │ ┌───────────── day of the month (1 - 31)
-- │ │ │ ┌───────────── month (1 - 12)
-- │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
-- │ │ │ │ │
-- 5 * * * *  = Every hour at 5 minutes past the hour
--
-- To manually trigger: SELECT invoke_fetch_meteorology();
-- To check job history: SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-meteorology-hourly') ORDER BY start_time DESC LIMIT 10;
-- To unschedule: SELECT cron.unschedule('fetch-meteorology-hourly');
--
