-- ============================================================================
-- UPDATE GROUNDWATER CRON JOB TO USE VIZUGY.HU (5-DAY INTERVAL)
-- ============================================================================
-- Updates the groundwater fetch cron job to use the new vizugy.hu Edge Function
-- instead of the old vizadat.hu API (which times out).
--
-- Schedule: Every 5 days (matches frontend 5-day chart sampling)
-- Savings: 73 API calls/year vs 365 daily (80% reduction)
--
-- Migration created: 2026-01-09
-- Reason: vizadat.hu API too slow (60+ sec timeout), vizugy.hu is 13× faster
-- New function: fetch-groundwater-vizugy (4.4 sec for all 15 wells)
-- Data improvement: 13,885 measurements vs 450-900 (15-30× more data)
-- ============================================================================

-- Step 1: Create new helper function for vizugy.hu Edge Function
CREATE OR REPLACE FUNCTION public.invoke_fetch_groundwater_vizugy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url TEXT := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  function_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Build function URL
  function_url := project_url || '/functions/v1/fetch-groundwater-vizugy';

  -- Get service role key from settings
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Invoke Edge Function using pg_net (async)
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000 -- 2 minutes timeout (much faster than old API)
  ) INTO request_id;

  RAISE NOTICE '✅ Groundwater fetch (vizugy.hu) invoked successfully, request_id=%', request_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error invoking fetch-groundwater-vizugy: %', SQLERRM;
END;
$$;

-- Add comment to new helper function
COMMENT ON FUNCTION public.invoke_fetch_groundwater_vizugy() IS
'Invokes the fetch-groundwater-vizugy Edge Function to retrieve full-year groundwater data for 15 wells from vizugy.hu PHP endpoint. Called every 5 days at 05:00 AM UTC via pg_cron (matches 5-day chart sampling). 13× faster than old vizadat.hu API (4.4 sec vs 60+ sec), fetches 15-30× more data per well.';

-- Step 2: Delete old cron job
DO $$
BEGIN
  PERFORM cron.unschedule('fetch-groundwater-daily');
  RAISE NOTICE '🗑️  Old cron job (vizadat.hu) removed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Old cron job not found (already removed or never existed)';
END $$;

-- Step 3: Create new cron job with vizugy.hu function (every 5 days)
SELECT cron.schedule(
  'fetch-groundwater-daily',
  '0 5 */5 * *', -- Every 5 days at 05:00 AM UTC (matches 5-day chart sampling)
  $$SELECT public.invoke_fetch_groundwater_vizugy()$$
);

-- Step 4: Verify new cron job was created
DO $$
DECLARE
  job_exists BOOLEAN;
  job_command TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = 'fetch-groundwater-daily'
  ) INTO job_exists;

  IF job_exists THEN
    -- Get the command to verify it's the new one
    SELECT command INTO job_command
    FROM cron.job
    WHERE jobname = 'fetch-groundwater-daily';

    RAISE NOTICE '✅ Groundwater cron job updated successfully!';
    RAISE NOTICE '   Schedule: Every 5 days at 05:00 AM UTC (0 5 */5 * *)';
    RAISE NOTICE '   Function: fetch-groundwater-vizugy (NEW - vizugy.hu)';
    RAISE NOTICE '   Command: %', job_command;
    RAISE NOTICE '   Wells: 15 monitoring wells';
    RAISE NOTICE '   Frequency: 73 calls/year (80% reduction vs daily)';
    RAISE NOTICE '   Performance: 4.4 sec (13× faster than old API)';
    RAISE NOTICE '   Data: ~926 measurements/well (15-30× more than old API)';
  ELSE
    RAISE EXCEPTION '❌ Failed to create new groundwater cron job';
  END IF;
END $$;

-- Step 5: Show current cron jobs for verification
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active,
  nodename
FROM cron.job
WHERE jobname = 'fetch-groundwater-daily';
