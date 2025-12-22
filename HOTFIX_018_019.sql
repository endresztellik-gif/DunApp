-- ============================================================================
-- HOTFIX: Migrations 018 & 019 - Manual Execution Script
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Date: 2025-12-07
-- Issue: Fix broken cron job URLs (precipitation & water level)
-- ============================================================================

-- ============================================================================
-- MIGRATION 018: Fix Precipitation Summary Cron Job URL
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
-- MIGRATION 019: Fix Water Level Cron Job URL
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_fetch_water_level()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  -- CORRECT project URL and anon key
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
-- VERIFICATION & TESTING
-- ============================================================================

-- Test both functions
SELECT 'Testing precipitation function...' AS status;
SELECT invoke_fetch_precipitation_summary();

SELECT 'Testing water level function...' AS status;
SELECT invoke_fetch_water_level();

-- Verify cron jobs are active
SELECT
  jobname,
  schedule,
  active,
  jobid
FROM cron.job
WHERE jobname IN ('fetch-precipitation-summary-daily', 'fetch-water-level-hourly')
ORDER BY jobname;

-- Check recent precipitation data
SELECT
  mc.name AS city,
  ps.last_7_days,
  ps.last_30_days,
  ps.year_to_date,
  ps.updated_at
FROM precipitation_summary ps
JOIN meteorology_cities mc ON ps.city_id = mc.id
ORDER BY ps.updated_at DESC;

-- Check recent water level data
SELECT
  wls.station_name,
  wld.water_level_cm,
  wld.timestamp AS measured_at
FROM water_level_data wld
JOIN water_level_stations wls ON wld.station_id = wls.id
ORDER BY wld.timestamp DESC
LIMIT 10;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ Hotfix 018 & 019 applied successfully! Cron jobs fixed.' AS result;
