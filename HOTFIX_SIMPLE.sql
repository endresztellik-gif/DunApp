-- HOTFIX: Fix Precipitation and Water Level Cron Job URLs
-- Date: 2025-12-07

-- Migration 018: Fix Precipitation Summary Cron Job URL
CREATE OR REPLACE FUNCTION invoke_fetch_precipitation_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  project_url text := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0';
BEGIN
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

-- Migration 019: Fix Water Level Cron Job URL
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
  SELECT net.http_post(
    url := project_url || '/functions/v1/fetch-water-level',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  RAISE NOTICE 'Water level data refresh triggered: request_id=%', request_id;
END;
$$;

-- Test the functions
SELECT 'Testing precipitation function...' AS status;
SELECT invoke_fetch_precipitation_summary();

SELECT 'Testing water level function...' AS status;
SELECT invoke_fetch_water_level();

-- Verify cron jobs are active
SELECT jobname, schedule, active, jobid
FROM cron.job
WHERE jobname IN ('fetch-precipitation-summary-daily', 'fetch-water-level-hourly')
ORDER BY jobname;

-- Success message
SELECT 'SUCCESS: Hotfix 018 & 019 applied! Cron jobs fixed.' AS result;
