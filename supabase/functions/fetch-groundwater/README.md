# 🌊 Groundwater Data Fetch Edge Function

Fetches 60-day groundwater level timeseries data from the **vizadat.hu** public water monitoring API for 15 monitoring wells in the Duna-Dráva region.

---

## 📍 Monitored Wells

| Well Name         | Code    | County       | City            |
|-------------------|---------|--------------|-----------------|
| Sátorhely         | 4576    | Bács-Kiskun  | Sátorhely       |
| Mohács II.        | 912     | Baranya      | Mohács          |
| Kölked            | 1461    | Baranya      | Kölked          |
| Mohács            | 1460    | Baranya      | Mohács          |
| Mohács-Sárhát     | 4481    | Baranya      | Mohács          |
| Dávod             | 448     | Tolna        | Dávod           |
| Hercegszántó      | 1450    | Bács-Kiskun  | Hercegszántó    |
| Nagybaracska      | 4479    | Bács-Kiskun  | Nagybaracska    |
| Szeremle          | 132042  | Bács-Kiskun  | Szeremle        |
| Alsónyék          | 662     | Tolna        | Alsónyék        |
| Érsekcsanád       | 1426    | Bács-Kiskun  | Érsekcsanád     |
| Decs              | 658     | Tolna        | Decs            |
| Szekszárd-Borrév  | 656     | Tolna        | Szekszárd       |
| Őcsény            | 653     | Tolna        | Őcsény          |
| Báta              | 660     | Tolna        | Báta            |

---

## 🔧 Function Overview

### Data Source
- **API**: `https://vizadat.hu/api/v1/observations`
- **Parameter**: `talajvízszint` (groundwater level)
- **Time Range**: 60 days (from today back)
- **Format**: JSON timeseries

### ⚠️ API Availability Issue (2025-11-06)
**Status**: vizadat.hu API currently **not responding** (connection timeout)
- Tested: 2025-11-06 08:23 UTC
- All 15 wells timeout after 30 seconds
- Direct curl test also fails (Connection timed out)
- Edge Function is **working correctly** - issue is with external API
- **Optimizations applied**: Parallel fetching, 30s timeout per well

### Database Tables
- **`groundwater_wells`**: Well metadata (15 wells with coordinates)
- **`groundwater_data`**: Timeseries data (water_level_meters, timestamp)

### Cache Logic
- **Daily cache**: Only fetches new data once per day
- **Check**: Queries `groundwater_data` for today's date
- **Skip**: If data exists for today, uses cached data
- **Fetch**: Only calls API if no data exists for today

---

## 📅 Schedule

**Runs daily at 05:00 AM UTC** via `pg_cron`:

```sql
-- Cron schedule: 0 5 * * *
SELECT cron.schedule(
  'fetch-groundwater-daily',
  '0 5 * * *',
  $$SELECT public.invoke_fetch_groundwater()$$
);
```

---

## 🧪 Manual Testing

### 1. Deploy the Edge Function

```bash
# Set environment variable
export SUPABASE_ACCESS_TOKEN="your_access_token"

# Deploy function
supabase functions deploy fetch-groundwater --project-ref zpwoicpajmvbtmtumsah
```

### 2. Test via Supabase Dashboard

Go to: **Edge Functions > fetch-groundwater > Invoke**

### 3. Test via curl

```bash
curl -X POST "https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-groundwater" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 4. Verify Data in Database

```sql
-- Check recent data
SELECT
  w.well_name,
  w.well_code,
  COUNT(d.id) as data_points,
  MAX(d.timestamp) as latest_reading
FROM groundwater_wells w
LEFT JOIN groundwater_data d ON w.id = d.well_id
GROUP BY w.well_name, w.well_code
ORDER BY w.well_name;
```

---

## 📊 Response Format

### Success Response

```json
{
  "status": "completed",
  "timestamp": "2025-11-05T05:00:00.000Z",
  "wells_total": 15,
  "wells_fetched": 12,
  "wells_cached": 3,
  "wells_failed": 0
}
```

### Error Response

```json
{
  "status": "completed",
  "timestamp": "2025-11-05T05:00:00.000Z",
  "wells_total": 15,
  "wells_fetched": 10,
  "wells_cached": 2,
  "wells_failed": 3,
  "errors": [
    "Kölked: HTTP 404: Not Found",
    "Dávod: Well not found in database: Dávod (448)",
    "Szeremle: Network timeout"
  ]
}
```

---

## 🛠️ Troubleshooting

### Issue: API Connection Timeout (Current)

**Symptom**: All 15 wells report "Request timeout after 30000ms"

**Root Cause**: vizadat.hu API not responding to requests

**Verification**:
```bash
# Test API directly
curl "https://vizadat.hu/api/v1/observations?site_name=Satorhely&parameter=talajvizszint&from=2025-09-07&to=2025-11-06" --max-time 10
# Result: Connection timed out after 10 seconds
```

**Temporary Workarounds**:

1. **Manual Data Injection** (for testing frontend):
```sql
-- Insert sample data for Sátorhely well (60 days)
INSERT INTO groundwater_data (well_id, water_level_meters, timestamp)
SELECT
  (SELECT id FROM groundwater_wells WHERE well_code = '4576'),
  3.5 + (random() * 0.5 - 0.25), -- Random water level 3.25-3.75m
  NOW() - (interval '1 day' * generate_series(0, 59))
ON CONFLICT (well_id, timestamp) DO NOTHING;
```

2. **Check API Status Later**: API might be temporarily down, retry in 24-48 hours

3. **Alternative Data Source**: Consider using VízÜgy's official data portal or web scraping

### Issue: "Well not found in database"

**Solution**: Ensure all 15 wells are seeded in `groundwater_wells` table:

```sql
SELECT well_name, well_code FROM groundwater_wells ORDER BY well_name;
```

Expected count: **15 wells**

### Issue: "HTTP 404 from vizadat.hu"

**Solution**: The well name might have changed on the API side. Check the API documentation:
```bash
curl "https://vizadat.hu/api/v1/observations?site_name=Sátorhely&parameter=talajvízszint"
```

### Issue: Cron job not running

**Solution**: Check cron job status:
```sql
SELECT jobid, jobname, schedule, active, last_run_time, next_run_time
FROM cron.job
WHERE jobname = 'fetch-groundwater-daily';
```

Enable the job if needed:
```sql
UPDATE cron.job SET active = true WHERE jobname = 'fetch-groundwater-daily';
```

---

## 📁 Project Structure

```
supabase/functions/fetch-groundwater/
├── index.ts          # Edge Function implementation
└── README.md         # This file

supabase/migrations/
├── 001_initial_schema.sql  # groundwater_wells & groundwater_data tables
├── 002_seed_data.sql       # 15 wells seeded
└── 013_groundwater_cron_job.sql  # Daily cron job setup
```

---

## 🔐 Environment Variables

Required in Supabase Edge Function:
- `SUPABASE_URL` (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)

---

## 📝 Notes

- **Cache duration**: 24 hours (daily)
- **Timeout**: 5 minutes per Edge Function invocation
- **Retry logic**: 3 attempts per well with exponential backoff (TODO)
- **Data retention**: Unlimited (60-day rolling window per well)

---

**Last Updated**: 2025-11-05
**Version**: 1.0.0
**Author**: DunApp PWA Team
