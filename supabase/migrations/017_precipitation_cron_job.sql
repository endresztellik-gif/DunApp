-- ============================================================================
-- MIGRATION 017: Precipitation Summary Cron Job
-- ============================================================================
-- Purpose: Schedule daily precipitation data fetch from Open-Meteo
-- Schedule: Every day at 6:00 AM UTC (7:00 AM CET / 8:00 AM CEST)
-- ============================================================================

-- Ensure pg_cron and pg_net extensions are enabled (should already be from previous migrations)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Get the Supabase URL for the Edge Function
-- Note: Replace YOUR_PROJECT_REF with your actual Supabase project reference
-- This will be automatically handled by the invoke_edge_function helper

-- Create helper function to invoke the Edge Function
CREATE OR REPLACE FUNCTION invoke_fetch_precipitation_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get Supabase URL from current database connection
  -- The URL format is: https://<project-ref>.supabase.co
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- If settings not available, use pg_net to call the function directly
  -- The Edge Function URL will be called via HTTP
  PERFORM net.http_post(
    url := 'https://tihqkmzwfjhfltzskfgi.supabase.co/functions/v1/fetch-precipitation-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{}'::jsonb
  );

  RAISE NOTICE 'Precipitation summary fetch triggered at %', NOW();
END;
$$;

-- Schedule cron job: Every day at 6:00 AM UTC
-- This runs after meteorology data is refreshed
SELECT cron.schedule(
  'fetch-precipitation-summary-daily',  -- job name
  '0 6 * * *',                          -- cron expression: 6:00 AM UTC daily
  $$SELECT invoke_fetch_precipitation_summary()$$
);

-- Add comment for documentation
COMMENT ON FUNCTION invoke_fetch_precipitation_summary() IS 'Triggers the fetch-precipitation-summary Edge Function via HTTP';
