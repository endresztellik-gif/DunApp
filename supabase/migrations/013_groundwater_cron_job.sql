-- ============================================================================
-- GROUNDWATER DATA CRON JOB
-- ============================================================================
-- Daily fetching of groundwater level data from vizadat.hu API
-- Runs at 05:00 AM UTC every day
--
-- Function: fetch-groundwater Edge Function
-- Wells: 15 monitoring wells (Sátorhely to Báta)
-- Data: 60-day timeseries per well
-- Cache: Daily cache logic to avoid duplicate fetches
-- ============================================================================

-- Ensure pg_cron and pg_net extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create helper function to invoke fetch-groundwater Edge Function
CREATE OR REPLACE FUNCTION public.invoke_fetch_groundwater()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  response_status INT;
  response_body TEXT;
BEGIN
  -- Get Supabase function URL from environment
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/fetch-groundwater';
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Invoke Edge Function using pg_net
  SELECT status, body INTO response_status, response_body
  FROM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000 -- 5 minutes timeout
  );

  -- Log response
  RAISE NOTICE 'Groundwater fetch response: status=%, body=%', response_status, response_body;

  -- Check for errors
  IF response_status >= 400 THEN
    RAISE WARNING 'Groundwater fetch failed with status %: %', response_status, response_body;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error invoking fetch-groundwater: %', SQLERRM;
END;
$$;

-- Drop existing cron job if it exists (safe delete)
DO $$
BEGIN
  PERFORM cron.unschedule('fetch-groundwater-daily');
EXCEPTION
  WHEN OTHERS THEN
    -- Job doesn't exist, that's fine
    NULL;
END $$;

-- Schedule groundwater data fetch (daily at 05:00 AM UTC)
SELECT cron.schedule(
  'fetch-groundwater-daily',
  '0 5 * * *', -- Every day at 05:00 AM UTC
  $$SELECT public.invoke_fetch_groundwater()$$
);

-- Verify cron job was created
DO $$
DECLARE
  job_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = 'fetch-groundwater-daily'
  ) INTO job_exists;

  IF job_exists THEN
    RAISE NOTICE '✅ Groundwater cron job created successfully';
    RAISE NOTICE '   Schedule: Daily at 05:00 AM UTC (0 5 * * *)';
    RAISE NOTICE '   Function: fetch-groundwater Edge Function';
    RAISE NOTICE '   Wells: 15 monitoring wells';
  ELSE
    RAISE EXCEPTION '❌ Failed to create groundwater cron job';
  END IF;
END $$;

-- Add comment to helper function
COMMENT ON FUNCTION public.invoke_fetch_groundwater() IS
'Invokes the fetch-groundwater Edge Function to retrieve 60-day groundwater level data for 15 wells from vizadat.hu API. Called daily at 05:00 AM UTC via pg_cron.';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Check cron job status
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active,
  nodename
FROM cron.job
WHERE jobname = 'fetch-groundwater-daily';
