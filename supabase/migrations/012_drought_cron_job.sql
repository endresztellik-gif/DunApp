-- Migration: 012_drought_cron_job.sql
-- Description: Sets up cron job for daily drought data fetching
-- Created: 2025-11-03

-- ============================================================================
-- CRON JOB SETUP
-- ============================================================================

-- Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

-- Function to invoke fetch-drought Edge Function
CREATE OR REPLACE FUNCTION invoke_fetch_drought()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key TEXT;
  project_url TEXT;
BEGIN
  -- Get Supabase URL from environment (set in dashboard)
  -- Format: https://[project-ref].supabase.co
  SELECT current_setting('app.settings.supabase_url', true) INTO project_url;

  -- Get service role key from environment (set in dashboard)
  SELECT current_setting('app.settings.service_role_key', true) INTO service_role_key;

  -- Call Edge Function via pg_net
  PERFORM net.http_post(
    url := project_url || '/functions/v1/fetch-drought',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    )
  );

  RAISE NOTICE 'Invoked fetch-drought Edge Function';
END;
$$;

-- ============================================================================
-- CRON JOB SCHEDULE
-- ============================================================================

-- Remove existing cron job if exists
SELECT cron.unschedule('fetch-drought-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'fetch-drought-daily'
);

-- Schedule fetch-drought to run daily at 6:00 AM (CEST/CET)
-- Cron format: minute hour day month weekday
-- 0 6 * * * = At 6:00 AM every day
SELECT cron.schedule(
  'fetch-drought-daily',
  '0 6 * * *',
  $$
  SELECT invoke_fetch_drought();
  $$
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- View scheduled jobs
COMMENT ON FUNCTION invoke_fetch_drought IS 'Invokes fetch-drought Edge Function via pg_net';

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION invoke_fetch_drought() TO service_role;

-- ============================================================================
-- MANUAL TESTING (Run in SQL Editor)
-- ============================================================================

-- To manually trigger the fetch:
-- SELECT invoke_fetch_drought();

-- To view cron job status:
-- SELECT * FROM cron.job WHERE jobname = 'fetch-drought-daily';

-- To view cron job run history:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-drought-daily')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Environment variables must be set in Supabase Dashboard:
--    - app.settings.supabase_url
--    - app.settings.service_role_key
--
-- 2. Alternative: Hardcode project URL and use vault for service role key
--    Example:
--    PERFORM net.http_post(
--      url := 'https://[project-ref].supabase.co/functions/v1/fetch-drought',
--      headers := jsonb_build_object(
--        'Authorization', 'Bearer ' || vault.get_secret('service_role_key')
--      )
--    );
--
-- 3. Cron job runs in UTC timezone. Adjust schedule for CEST/CET if needed.
--    6:00 AM CEST = 4:00 AM UTC (summer)
--    6:00 AM CET  = 5:00 AM UTC (winter)
--
-- 4. To disable cron job:
--    SELECT cron.unschedule('fetch-drought-daily');
--
-- 5. To change schedule:
--    SELECT cron.unschedule('fetch-drought-daily');
--    SELECT cron.schedule('fetch-drought-daily', 'new-cron-expression', $$..$$);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
