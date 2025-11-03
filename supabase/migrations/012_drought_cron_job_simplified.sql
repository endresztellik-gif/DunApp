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
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status INT;
  response_body TEXT;
  service_role_key TEXT;
  response json;
BEGIN
  -- Get service role key from Supabase secrets
  -- This should be set in Supabase Dashboard: Settings > Vault
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  -- If not in vault, try to get from environment
  IF service_role_key IS NULL THEN
    service_role_key := current_setting('app.settings.service_role_key', true);
  END IF;

  -- If still null, use SUPABASE_SERVICE_ROLE_KEY env var
  IF service_role_key IS NULL THEN
    SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
    LIMIT 1;
  END IF;

  -- Call Edge Function via pg_net with hardcoded project URL
  SELECT status, content::text INTO response_status, response_body
  FROM net.http_post(
    url := 'https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-drought',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := '{}'::jsonb
  );

  RAISE NOTICE 'Invoked fetch-drought Edge Function - Status: %', response_status;

  -- Return response for logging
  RETURN json_build_object(
    'status', response_status,
    'body', response_body,
    'timestamp', NOW()
  );
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
COMMENT ON FUNCTION invoke_fetch_drought IS 'Invokes fetch-drought Edge Function via pg_net (hardcoded URL)';

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
