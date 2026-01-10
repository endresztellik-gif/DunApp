-- ============================================================================
-- CRON JOB UPDATE - VIZUGY.HU AUTOMATION (5-DAY INTERVAL)
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Purpose: Enable automatic updates every 5 days using the new vizugy.hu Edge Function
-- Schedule: Every 5 days at 5:00 AM UTC (matches 5-day chart sampling)
-- Savings: 73 API calls/year vs 365 daily (80% reduction)
-- ============================================================================

-- Step 1: Create new helper function for vizugy.hu
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
  function_url := project_url || '/functions/v1/fetch-groundwater-vizugy';
  service_role_key := current_setting('app.settings.service_role_key', true);

  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) INTO request_id;

  RAISE NOTICE '✅ Groundwater fetch invoked, request_id=%', request_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
END;
$$;

-- Step 2: Remove old cron job
DO $$
BEGIN
  PERFORM cron.unschedule('fetch-groundwater-daily');
  RAISE NOTICE '🗑️  Old cron job removed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Old job not found';
END $$;

-- Step 3: Create new cron job (every 5 days at 5:00 AM UTC)
SELECT cron.schedule(
  'fetch-groundwater-daily',
  '0 5 */5 * *', -- Every 5 days (matches 5-day chart sampling)
  $$SELECT public.invoke_fetch_groundwater_vizugy()$$
);

-- Step 4: Verify
SELECT
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'fetch-groundwater-daily';

-- Expected output:
-- jobname                  | schedule    | active | command
-- -------------------------|-------------|--------|------------------------------------------
-- fetch-groundwater-daily  | 0 5 * * *   | t      | SELECT public.invoke_fetch_groundwater_vizugy()
