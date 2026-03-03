# Skill: DunApp Edge Function Deployment & Cron Verification

Use this skill when deploying Supabase Edge Functions or verifying/troubleshooting cron jobs.

## Deploy an Edge Function via CLI

```bash
# Set the admin token (required for CLI deployment)
export SUPABASE_ACCESS_TOKEN="$SUPABASE_ADMIN_TOKEN"

# Deploy a single function
supabase functions deploy <function-name>

# Examples:
supabase functions deploy fetch-meteorology
supabase functions deploy fetch-groundwater-vizugy
supabase functions deploy send-push-notification
```

Supabase project reference: `zpwoicpajmvbtmtumsah`

Available functions:
- `fetch-meteorology`
- `fetch-water-level`
- `fetch-drought`
- `fetch-groundwater-vizugy` (primary groundwater function)
- `fetch-precipitation-summary`
- `send-push-notification`
- `check-water-level-alert`
- `fetch-belso-beda-water-level`
- `fetch-ftcs-water-level`
- `fetch-kadia-water-level`

## Manually Trigger an Edge Function

```bash
# Replace ANON_KEY with actual value from .env (VITE_SUPABASE_ANON_KEY)
curl -X POST "https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/<function-name>" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"

# Example: manually trigger groundwater fetch
curl -X POST "https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-groundwater-vizugy" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"
```

Expected response shape for groundwater:
```json
{
  "wells_fetched": 14,
  "wells_failed": 1,
  "total_records_inserted": 12971,
  "execution_time_ms": 4595
}
```

## Verify a Cron Job Exists in Supabase

Run in Supabase Dashboard > SQL Editor:

```sql
-- List all cron jobs
SELECT jobid, jobname, schedule, command, active
FROM cron.job
ORDER BY jobid;
```

Expected active cron jobs:
| jobname | schedule | jobid |
|---------|----------|-------|
| fetch-meteorology-hourly | `5 * * * *` | - |
| fetch-water-level-hourly | `10 * * * *` | - |
| fetch-precipitation-summary-daily | `0 6 * * *` | 9 |
| fetch-drought-daily | `0 6 * * *` | - |
| fetch-groundwater-daily | `0 5 * * *` | 13 |

## Check Cron Job Run History

```sql
-- Recent run history for all fetch jobs
SELECT
  j.jobname,
  d.start_time,
  d.end_time,
  d.status,
  d.return_message
FROM cron.job_run_details d
JOIN cron.job j ON d.jobid = j.jobid
WHERE j.jobname LIKE 'fetch-%'
ORDER BY d.start_time DESC
LIMIT 20;
```

Status values:
- `succeeded` - Job ran and function returned HTTP 2xx
- `failed` - Job ran but function errored (check `return_message`)
- `running` - Currently executing

## Create a New Cron Job

```sql
-- Basic pattern for creating a cron job
SELECT cron.schedule(
  'fetch-my-function-daily',  -- unique job name
  '0 6 * * *',                -- cron expression
  $$SELECT invoke_my_function()$$
);
```

Always create a helper function that calls the Edge Function via HTTP, then schedule the cron to call the helper function. See `supabase/migrations/` for examples (007, 010, 012, 018, 025).

## Verify Data Was Inserted After Trigger

```sql
-- Check latest data for groundwater
SELECT
  gw.well_name,
  COUNT(gd.id) AS records,
  MAX(gd.timestamp) AS latest_data
FROM groundwater_wells gw
LEFT JOIN groundwater_data gd ON gw.id = gd.well_id
WHERE gw.enabled = true
GROUP BY gw.well_name
ORDER BY latest_data DESC;

-- Check latest meteorology data
SELECT city_id, MAX(timestamp) AS latest
FROM weather_current
GROUP BY city_id
ORDER BY latest DESC;
```
