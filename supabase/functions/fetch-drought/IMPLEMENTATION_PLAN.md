# Fetch Drought Data - Implementation Plan

## Overview

This Edge Function fetches drought monitoring data from aszalymonitoring.vizugy.hu API for 5 locations in southern Hungary and stores it in Supabase.

## API Endpoints

### 1. Search Nearest Station
```
GET https://aszalymonitoring.vizugy.hu/api/search?settlement={locationName}
```

**Response:**
```json
{
  "nearestStation": {
    "id": "ABC123",
    "name": "Katymár monitoring állomás",
    "distance": 1200,
    "latitude": 46.2170,
    "longitude": 19.5665
  }
}
```

### 2. Fetch Station Data (60 days)
```
GET https://aszalymonitoring.vizugy.hu/api/station/{stationId}/data?from={startDate}&to={endDate}
```

**Response:**
```json
[
  {
    "date": "2024-11-03",
    "HDI": 2.5,
    "HDIS": 35.2,
    "soilMoisture_10cm": 30.5,
    "soilMoisture_20cm": 28.5,
    "soilMoisture_30cm": 27.0,
    "soilMoisture_50cm": 25.5,
    "soilMoisture_70cm": 24.0,
    "soilMoisture_100cm": 22.5,
    "soilTemp": 15.3,
    "airTemp": 18.5,
    "precipitation": 12.5,
    "relativeHumidity": 65.0
  },
  ...
]
```

## Database Schema

### drought_data table
```sql
CREATE TABLE drought_data (
  id UUID PRIMARY KEY,
  location_id UUID REFERENCES drought_locations(id),
  drought_index DECIMAL(5,2),           -- HDI
  water_deficit_index DECIMAL(5,2),     -- HDIS
  soil_moisture_10cm DECIMAL(5,2),
  soil_moisture_20cm DECIMAL(5,2),
  soil_moisture_30cm DECIMAL(5,2),
  soil_moisture_50cm DECIMAL(5,2),
  soil_moisture_70cm DECIMAL(5,2),
  soil_moisture_100cm DECIMAL(5,2),
  soil_temperature DECIMAL(4,1),
  air_temperature DECIMAL(4,1),
  precipitation DECIMAL(6,2),
  relative_humidity DECIMAL(5,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Steps

### Step 1: Fetch with Retry Logic
```typescript
async function fetchWithRetry(
  fetchFn: () => Promise<Response>,
  maxRetries = 3,
  backoffMs = 1000
): Promise<Response>
```

### Step 2: Search Nearest Station
```typescript
async function searchDroughtStation(settlement: string): Promise<{
  stationId: string;
  stationName: string;
  distance: number;
}>
```

### Step 3: Fetch Station Data
```typescript
async function fetchDroughtStationData(stationId: string): Promise<DroughtDataRecord>
```

### Step 4: Process Each Location
```typescript
for (const location of DROUGHT_LOCATIONS) {
  1. Search nearest station
  2. Fetch 60-day data
  3. Extract latest record
  4. Get location_id from database
  5. Insert drought_data
  6. Handle errors gracefully
}
```

## Error Handling

### Retry Logic
- **Max retries:** 3
- **Backoff:** Exponential (1s, 2s, 4s)
- **Timeout:** 10 seconds per request

### Error Scenarios
1. **Station not found** → Skip location, log warning
2. **No data available** → Insert NULL values, log info
3. **API timeout** → Retry with backoff
4. **Database error** → Fail gracefully, return partial results

## Cron Job Configuration

```sql
-- Run daily at 6:00 AM (CEST/CET)
SELECT cron.schedule(
  'fetch-drought-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/fetch-drought',
    headers := '{"Authorization": "Bearer [service-role-key]"}'::jsonb
  ) AS request_id;
  $$
);
```

## Testing Strategy

### Local Testing
```bash
# 1. Start Supabase locally
supabase start

# 2. Serve Edge Function
supabase functions serve fetch-drought --env-file .env.local

# 3. Test with curl
curl -X POST http://localhost:54321/functions/v1/fetch-drought \
  -H "Authorization: Bearer [anon-key]"
```

### Unit Tests
1. **Test API search** → Mock aszalymonitoring search endpoint
2. **Test data fetch** → Mock station data response
3. **Test retry logic** → Simulate network failures
4. **Test database insert** → Verify schema mapping

### Integration Tests
1. **End-to-end test** → Fetch real data, insert into test database
2. **Cron job test** → Verify scheduled execution
3. **Performance test** → Measure execution time (target: <30s)

## Deployment Checklist

- [ ] Environment variables set in Supabase dashboard
- [ ] Edge Function deployed: `supabase functions deploy fetch-drought`
- [ ] Cron job scheduled (migration 012)
- [ ] Initial test run successful
- [ ] Logs verified in Supabase dashboard
- [ ] Error alerts configured (optional)

## Groundwater Wells (Phase 2)

**Status:** Deferred

**Reason:** vmservice.vizugy.hu requires browser automation (Puppeteer), which is not supported in Edge Functions.

**Future Options:**
1. **Manual CSV upload** → User downloads CSV, uploads to admin panel
2. **GitHub Actions scraper** → Scheduled workflow with Puppeteer
3. **Third-party scraping service** → Bright Data, ScrapingBee, etc.

**Recommended:** Option 1 (manual CSV upload) for MVP, Option 2 for production.

---

**Created:** 2025-11-03
**Author:** Claude Code (Backend Engineer Agent)
**Status:** Ready for implementation
