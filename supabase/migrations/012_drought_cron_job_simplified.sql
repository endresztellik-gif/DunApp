-- Migration: 012_drought_cron_job (Simplified)
-- Description: Sets up cron job for daily drought data fetching
-- Created: 2025-11-03
-- Note: Hardcoded project URL for simplicity

-- ============================================================================
-- CRON JOB SETUP
-- ============================================================================

-- Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- HELPER FUNCTION (Simplified - Hardcoded URL)
-- ============================================================================

-- Function to invoke fetch-drought Edge Function
CREATE OR REPLACE FUNCTION invoke_fetch_drought()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  project_url text := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  service_role_key text;
BEGIN
  -- Get service role key from Supabase secrets
  -- This should be set in Supabase Dashboard: Settings > Vault
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  -- If not in vault, try SUPABASE_SERVICE_ROLE_KEY env var
  IF service_role_key IS NULL THEN
    SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
    LIMIT 1;
  END IF;

  -- Call Edge Function using pg_net.http_post (async execution)
  SELECT net.http_post(
    url := project_url || '/functions/v1/fetch-drought',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  -- Log the request
  RAISE NOTICE 'Drought data fetch triggered: request_id=%', request_id;
END;
$$;

-- ============================================================================
-- CRON JOB SCHEDULE
-- ============================================================================

-- Remove existing cron job if exists
DO $$
BEGIN
  PERFORM cron.unschedule('fetch-drought-daily');
EXCEPTION
  WHEN undefined_object THEN
    -- Job doesn't exist, continue
    NULL;
END $$;

-- Schedule fetch-drought to run daily at 6:00 AM (UTC)
-- Note: 6:00 AM UTC = 7:00 AM CET (winter) / 8:00 AM CEST (summer)
-- Cron format: minute hour day month weekday
SELECT cron.schedule(
  'fetch-drought-daily',
  '0 6 * * *',
  $$SELECT invoke_fetch_drought();$$
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add comment
COMMENT ON FUNCTION invoke_fetch_drought IS 'Invokes fetch-drought Edge Function to refresh drought monitoring data (async via pg_net)';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION invoke_fetch_drought() TO service_role;
GRANT EXECUTE ON FUNCTION invoke_fetch_drought() TO postgres;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View scheduled jobs
SELECT jobname, schedule, active, nodename
FROM cron.job
WHERE jobname = 'fetch-drought-daily';

-- ============================================================================
-- MANUAL TESTING
-- ============================================================================

-- To manually trigger (uncomment to run):
-- SELECT invoke_fetch_drought();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
