-- ============================================================================
-- CHECK CRON JOB STATUS
-- ============================================================================
-- Purpose: Verify if Migration 021 was deployed and cron job is active
-- ============================================================================

-- 1. Check if helper function exists
SELECT
  routine_name AS "Function Name",
  routine_type AS "Type",
  created AS "Created"
FROM information_schema.routines
WHERE routine_name = 'invoke_fetch_groundwater_vizugy'
  AND routine_schema = 'public';

-- Expected: 1 row with "invoke_fetch_groundwater_vizugy"
-- If 0 rows: ❌ Migration 021 NOT deployed!

-- ============================================================================

-- 2. Check cron job configuration
SELECT
  jobid AS "Job ID",
  jobname AS "Job Name",
  schedule AS "Schedule",
  active AS "Active",
  command AS "Command"
FROM cron.job
WHERE jobname = 'fetch-groundwater-daily';

-- Expected:
-- Job Name: fetch-groundwater-daily
-- Schedule: 0 5 */5 * * (every 5 days at 05:00 UTC)
-- Active: true
-- Command: SELECT public.invoke_fetch_groundwater_vizugy()

-- If 0 rows: ❌ Cron job not created!

-- ============================================================================

-- 3. Check recent cron job runs
SELECT
  start_time AS "Start Time",
  end_time AS "End Time",
  status AS "Status",
  return_message AS "Message"
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-groundwater-daily')
ORDER BY start_time DESC
LIMIT 5;

-- Expected: At least 1 successful run
-- If 0 rows: ❌ Cron job never ran!
-- If status = 'failed': ❌ Check return_message for error

-- ============================================================================
-- DIAGNOSIS GUIDE:
-- ============================================================================
-- If function NOT EXISTS:
--   ❌ Migration 021 was NEVER deployed to Supabase
--   ✅ Solution: Deploy Migration 021 via SQL Editor
--
-- If cron job NOT EXISTS:
--   ❌ Migration 021 was partially deployed (function only)
--   ✅ Solution: Re-run Migration 021 (full script)
--
-- If cron job NEVER RAN:
--   ⚠️ Wait for next scheduled run (every 5 days at 05:00 UTC)
--   ✅ Or trigger manually: SELECT public.invoke_fetch_groundwater_vizugy()
--
-- If cron job FAILED:
--   ❌ Check return_message for error details
--   ❌ Common issues: Network timeout, wrong URL, permissions
-- ============================================================================
