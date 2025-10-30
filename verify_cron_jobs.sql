-- DunApp PWA - Cron Jobs Verification Script
-- Run this to verify cron jobs are set up correctly

-- List all scheduled jobs
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
ORDER BY jobname;

-- Expected output:
-- 4 rows with jobnames:
-- - check-water-level-alert (0 */6 * * *)
-- - fetch-drought (0 6 * * *)
-- - fetch-meteorology (*/20 * * * *)
-- - fetch-water-level (0 * * * *)

-- Check recent job runs
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- Check data freshness
SELECT
  'meteorology_data' as table_name,
  COUNT(*) as record_count,
  MAX(timestamp) as latest_timestamp,
  NOW() - MAX(timestamp) as age
FROM meteorology_data
UNION ALL
SELECT
  'water_level_data',
  COUNT(*),
  MAX(timestamp),
  NOW() - MAX(timestamp)
FROM water_level_data
UNION ALL
SELECT
  'drought_data',
  COUNT(*),
  MAX(timestamp),
  NOW() - MAX(timestamp)
FROM drought_data;
