# Fetch Drought Data - Testing Guide

## Prerequisites

1. Supabase CLI installed: `brew install supabase/tap/supabase`
2. Docker running (for local Supabase)
3. Environment variables configured

## Environment Variables

Create `.env.local` in project root:

```bash
# Supabase (from dashboard)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# No API key needed for aszalymonitoring.vizugy.hu (public API)
```

---

## Local Testing

### 1. Start Supabase Locally

```bash
cd /Volumes/Endre_Samsung1T/codeing/dunapp-pwa

# Start local Supabase (PostgreSQL + Edge Functions runtime)
supabase start
```

Output:
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Apply Migrations

```bash
# Apply all migrations to local database
supabase db reset

# Or apply individually
supabase db push
```

### 3. Serve Edge Function

```bash
# Serve fetch-drought function (reads .env.local automatically)
supabase functions serve fetch-drought --env-file .env.local
```

Output:
```
Serving functions on http://localhost:54321/functions/v1/
fetch-drought: http://localhost:54321/functions/v1/fetch-drought
```

### 4. Test with curl

```bash
# POST request to trigger function
curl -X POST http://localhost:54321/functions/v1/fetch-drought \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2025-11-03T06:00:00.000Z",
  "duration": 12453,
  "summary": {
    "total": 5,
    "success": 5,
    "failed": 0
  },
  "results": [
    {
      "location": "Katymár",
      "status": "success",
      "station": "Katymár monitoring állomás",
      "distance": 1200,
      "droughtIndex": 2.5
    },
    {
      "location": "Dávod",
      "status": "success",
      "station": "Dávod monitoring állomás",
      "distance": 850,
      "droughtIndex": 1.8
    },
    ...
  ]
}
```

### 5. Verify Database

```bash
# Connect to local database
supabase db connect

# Or use Studio UI
open http://localhost:54323
```

SQL query to verify:
```sql
-- Check if data was inserted
SELECT
  dl.location_name,
  dd.drought_index,
  dd.soil_moisture_20cm,
  dd.timestamp
FROM drought_data dd
JOIN drought_locations dl ON dd.location_id = dl.id
ORDER BY dd.timestamp DESC
LIMIT 10;
```

---

## Unit Testing (with Deno)

### Test API Search Function

```typescript
// test/fetch-drought.test.ts

import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("searchDroughtStation - finds nearest station", async () => {
  const result = await searchDroughtStation("Katymár");

  assertEquals(typeof result.stationId, "string");
  assertEquals(typeof result.stationName, "string");
  assertEquals(typeof result.distance, "number");
});

Deno.test("searchDroughtStation - throws on invalid settlement", async () => {
  try {
    await searchDroughtStation("InvalidSettlement12345");
    throw new Error("Should have thrown");
  } catch (error) {
    assertEquals(error.message.includes("No station found"), true);
  }
});
```

Run tests:
```bash
deno test --allow-net test/fetch-drought.test.ts
```

### Test Retry Logic

```typescript
Deno.test("fetchWithRetry - retries on failure", async () => {
  let attempts = 0;

  const mockFetch = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error("Network error");
    }
    return new Response(JSON.stringify({ success: true }));
  };

  const result = await fetchWithRetry(mockFetch, 3, 100);
  assertEquals(attempts, 3);
  assertEquals(result.ok, true);
});
```

---

## Integration Testing

### Test Full Flow (API → Database)

```bash
# 1. Clean database
supabase db reset

# 2. Run function
curl -X POST http://localhost:54321/functions/v1/fetch-drought \
  -H "Authorization: Bearer [service-role-key]"

# 3. Verify database
supabase db connect
```

SQL verification:
```sql
-- Should have 5 records (1 per location)
SELECT COUNT(*) FROM drought_data;
-- Expected: 5

-- Check for NULLs (should be minimal)
SELECT
  location_id,
  COUNT(*) FILTER (WHERE drought_index IS NULL) AS null_drought_index,
  COUNT(*) FILTER (WHERE soil_moisture_20cm IS NULL) AS null_soil_moisture
FROM drought_data
GROUP BY location_id;
```

---

## Production Testing

### 1. Deploy Edge Function

```bash
# Deploy to production Supabase project
supabase functions deploy fetch-drought --project-ref [project-ref]
```

### 2. Test Deployed Function

```bash
# Test via HTTPS
curl -X POST https://[project-ref].supabase.co/functions/v1/fetch-drought \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json"
```

### 3. Verify Logs

**Option A: Supabase Dashboard**
1. Go to https://app.supabase.com/project/[project-ref]/functions
2. Click "fetch-drought"
3. View "Invocations" tab
4. Check logs for errors

**Option B: CLI**
```bash
supabase functions logs fetch-drought --project-ref [project-ref]
```

### 4. Test Cron Job

```bash
# Manually trigger cron job via SQL
supabase db connect --project-ref [project-ref]
```

SQL:
```sql
-- Trigger cron job manually
SELECT invoke_fetch_drought();

-- Check execution logs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-drought-daily')
ORDER BY start_time DESC
LIMIT 5;
```

---

## Performance Testing

### Measure Execution Time

```bash
# Run 5 times and average
for i in {1..5}; do
  time curl -X POST http://localhost:54321/functions/v1/fetch-drought \
    -H "Authorization: Bearer [service-role-key]" \
    -H "Content-Type: application/json" \
    -o /dev/null -s
done
```

Target: **< 30 seconds** for 5 locations

### Optimize Slow Queries

If execution time > 30s:
1. **Check API response time**
   - Add timing logs to `fetchWithTimeout()`
   - Consider increasing timeout

2. **Check database inserts**
   - Ensure indexes exist on `drought_data(location_id, timestamp)`
   - Use batch inserts if possible

3. **Check retry logic**
   - Reduce retries to 2 instead of 3
   - Decrease backoff delay

---

## Error Scenarios to Test

### 1. API Unavailable
```bash
# Simulate by using invalid URL
# Edit index.ts temporarily:
const url = `https://invalid-api.example.com/search?settlement=${settlement}`;

# Expected: Retry 3 times, then fail gracefully
```

### 2. No Data Available
```bash
# Search for a station with no recent data
# Expected: Insert NULL values, log warning, continue
```

### 3. Database Connection Failure
```bash
# Temporarily use invalid SUPABASE_URL
export SUPABASE_URL=https://invalid.supabase.co

# Expected: Throw error immediately, log error
```

### 4. Partial Success
```bash
# Simulate by making 1 location fail (invalid name)
# Expected: 4 success, 1 failed in summary
```

---

## Monitoring & Alerts

### Set Up Alerts (Optional)

**Supabase Dashboard:**
1. Go to Project Settings → Integrations
2. Add Webhook for Edge Function failures
3. URL: Your monitoring service (e.g., Sentry, DataDog)

**Custom Alert Query:**
```sql
-- Find failed cron executions
SELECT * FROM cron.job_run_details
WHERE jobname = 'fetch-drought-daily'
  AND status = 'failed'
  AND start_time > NOW() - INTERVAL '7 days'
ORDER BY start_time DESC;
```

### Health Check Endpoint

Add to Edge Function:
```typescript
if (req.method === 'GET') {
  return new Response(JSON.stringify({
    status: 'ok',
    function: 'fetch-drought',
    version: '1.0.0',
    lastRun: '2025-11-03T06:00:00Z'
  }), { status: 200 });
}
```

Test:
```bash
curl https://[project-ref].supabase.co/functions/v1/fetch-drought
# Expected: { "status": "ok", ... }
```

---

## Troubleshooting

### Issue: "No station found near {location}"

**Solution:**
1. Check if location name matches exactly (case-sensitive)
2. Try searching manually: `https://aszalymonitoring.vizugy.hu/api/search?settlement=Katymár`
3. Update `DROUGHT_LOCATIONS` array with correct name

### Issue: "Missing required environment variables"

**Solution:**
1. Verify `.env.local` exists and contains all keys
2. Restart `supabase functions serve` after changing env vars
3. For production, check Supabase Dashboard → Edge Functions → Environment Variables

### Issue: Database insert fails with "location_id not found"

**Solution:**
1. Ensure `002_seed_data.sql` migration ran successfully
2. Verify 5 locations exist in `drought_locations` table:
   ```sql
   SELECT * FROM drought_locations;
   ```
3. Re-run seed migration if needed:
   ```bash
   supabase db reset
   ```

### Issue: Timeout errors

**Solution:**
1. Increase `REQUEST_TIMEOUT` from 10s to 30s
2. Check network connectivity to aszalymonitoring.vizugy.hu
3. Reduce `MAX_RETRIES` from 3 to 2

---

## Test Checklist

Before deploying to production:

- [ ] Local testing passes (5/5 success)
- [ ] Database has 5 records after test run
- [ ] Execution time < 30 seconds
- [ ] Logs show no errors
- [ ] Retry logic tested (network failure simulation)
- [ ] NULL handling tested (no data scenario)
- [ ] Cron job scheduled correctly
- [ ] Production deployment successful
- [ ] Production test run successful
- [ ] Monitoring/alerts configured (optional)

---

**Last Updated:** 2025-11-03
**Status:** Ready for testing
