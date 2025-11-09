-- DunApp PWA - Fix Water Level Cron Job URLs
-- Migration: 015_fix_water_level_cron_urls.sql
-- Created: 2025-11-09
-- Description: Fix incorrect project URL and API key in invoke_fetch_water_level function
-- Issue: Migration 010 had wrong hardcoded URLs from old project

-- ============================================================================
-- FIX: Update helper function with correct project URL and anon key
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_fetch_water_level()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  -- CORRECT project URL and anon key
  project_url text := 'https://tihqkmzwfjhfltzskfgi.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpaHFrbXp3ZmpoZmx0enNrZmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzNzI2NjQsImV4cCI6MjA0NTk0ODY2NH0.r3o4lwda33Z6SOW6oazJIdQkLVKs2d4PLtm8TjjxqvA';
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

COMMENT ON FUNCTION invoke_fetch_water_level() IS 'Invokes the fetch-water-level Edge Function to refresh water level data and forecasts (FIXED URLs)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test the function manually to verify it works
SELECT invoke_fetch_water_level();

-- Check cron job is still active
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'fetch-water-level-hourly';
