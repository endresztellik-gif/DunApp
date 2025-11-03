# DunApp PWA - Quick Start Guide for Data Integration

**Status:** PHASE 2B Complete - Ready for PHASE 3 Testing

---

## What Was Implemented

### Edge Functions (4)
1. **fetch-meteorology** - Fetches weather from OpenWeatherMap/Meteoblue/Yr.no
2. **fetch-water-level** - Scrapes water levels from vizugy.hu and hydroinfo.hu
3. **fetch-drought** - Fetches drought data from aszalymonitoring.vizugy.hu
4. **check-water-level-alert** - Sends push notifications when Mohács >= 400cm

### React Hooks (4)
1. **useWeatherData** - Fetch weather with 20-min cache
2. **useWaterLevelData** - Fetch water level with 1-hour cache
3. **useDroughtData** - Fetch drought data with 24-hour cache
4. **useGroundwaterData** - Fetch groundwater data with 24-hour cache

---

## Quick Setup (5 Steps)

### 1. Install Dependencies
```bash
npm install
# @tanstack/react-query already installed
```

### 2. Configure Environment Variables
```bash
# Copy example file
cp .env.example .env

# Edit .env and fill in:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key

# For Edge Functions (set in Supabase dashboard):
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
METEOBLUE_API_KEY=YOUR_METEOBLUE_API_KEY_HERE
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 3. Deploy Edge Functions to Supabase
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy fetch-meteorology
supabase functions deploy fetch-water-level
supabase functions deploy fetch-drought
supabase functions deploy check-water-level-alert
```

### 4. Configure Cron Jobs
```sql
-- Run in Supabase SQL Editor

-- Meteorology: every 20 minutes
SELECT cron.schedule(
  'fetch-meteorology',
  '*/20 * * * *',
  $$SELECT net.http_post(url := 'https://your-project.supabase.co/functions/v1/fetch-meteorology')$$
);

-- Water Level: every hour
SELECT cron.schedule(
  'fetch-water-level',
  '0 * * * *',
  $$SELECT net.http_post(url := 'https://your-project.supabase.co/functions/v1/fetch-water-level')$$
);

-- Drought: daily at 6 AM
SELECT cron.schedule(
  'fetch-drought',
  '0 6 * * *',
  $$SELECT net.http_post(url := 'https://your-project.supabase.co/functions/v1/fetch-drought')$$
);

-- Alerts: every 6 hours
SELECT cron.schedule(
  'check-water-level-alert',
  '0 */6 * * *',
  $$SELECT net.http_post(url := 'https://your-project.supabase.co/functions/v1/check-water-level-alert')$$
);
```

### 5. Test Locally
```bash
# Start dev server
npm run dev

# Test hooks in browser console
# Open DevTools → Console and try:
# 1. Check React Query cache
# 2. Test a module
# 3. Verify data loading
```

---

## Using the Hooks in Components

### Example: Weather Module
```typescript
import { useWeatherData } from '../hooks';

function MeteorologyModule() {
  const [selectedCity, setSelectedCity] = useState('city-id-here');
  const { weatherData, city, isLoading, error } = useWeatherData(selectedCity);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!weatherData) return <EmptyState />;

  return (
    <div>
      <h1>{city?.name}</h1>
      <p>Temperature: {weatherData.temperature}°C</p>
      <p>Humidity: {weatherData.humidity}%</p>
      {/* ... more weather data */}
    </div>
  );
}
```

### Example: Water Level Module
```typescript
import { useWaterLevelData } from '../hooks';

function WaterLevelModule() {
  const [selectedStation, setSelectedStation] = useState('station-id-here');
  const { waterLevelData, station, forecast, isLoading, error } = useWaterLevelData(selectedStation);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!waterLevelData) return <EmptyState />;

  return (
    <div>
      <h1>{station?.stationName}</h1>
      <p>Current Level: {waterLevelData.waterLevelCm} cm</p>
      <h2>5-Day Forecast</h2>
      {forecast.map(f => (
        <div key={f.forecastDay}>
          Day {f.forecastDay}: {f.waterLevelCm} cm
        </div>
      ))}
    </div>
  );
}
```

---

## Testing Edge Functions Manually

```bash
# Test fetch-meteorology
curl -X POST https://your-project.supabase.co/functions/v1/fetch-meteorology \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Expected response:
# {
#   "success": true,
#   "timestamp": "2025-10-27T10:00:00Z",
#   "summary": { "total": 4, "success": 4, "failed": 0 },
#   "results": [...]
# }

# Test fetch-water-level
curl -X POST https://your-project.supabase.co/functions/v1/fetch-water-level

# Test fetch-drought
curl -X POST https://your-project.supabase.co/functions/v1/fetch-drought

# Test check-water-level-alert
curl -X POST https://your-project.supabase.co/functions/v1/check-water-level-alert
```

---

## Troubleshooting

### Edge Function Not Working
```bash
# Check logs
supabase functions logs fetch-meteorology --tail

# Test locally
supabase functions serve fetch-meteorology
curl -X POST http://localhost:54321/functions/v1/fetch-meteorology
```

### Hook Not Returning Data
1. Check Supabase connection: Open DevTools → Network
2. Verify environment variables: `console.log(import.meta.env.VITE_SUPABASE_URL)`
3. Check React Query cache: Install React Query DevTools
4. Verify database has data: Check Supabase dashboard

### CORS Errors
- Edge Functions should automatically handle CORS
- If issues persist, add CORS headers to Edge Function response

### API Rate Limits
- OpenWeatherMap: Max 1,000 calls/day (free tier)
- Monitor usage in Supabase logs
- Increase cache duration if hitting limits

---

## Next Steps (PHASE 3)

### Critical Tasks
1. ⚠️ **Update Module Components** - Replace mock data with real hooks
2. ⚠️ **Add Loading/Error UI** - Skeleton screens and error boundaries
3. ⚠️ **End-to-End Testing** - Test complete data flow
4. ⚠️ **Error Monitoring** - Set up Sentry or similar

### Optional Tasks
- Implement groundwater CSV upload
- Enhance push notification encryption
- Add service worker for offline support
- Create admin panel for data management

---

## File Locations

### Edge Functions
```
/supabase/functions/
  ├── fetch-meteorology/index.ts        (346 lines)
  ├── fetch-water-level/index.ts        (332 lines)
  ├── fetch-drought/index.ts            (270 lines)
  └── check-water-level-alert/index.ts  (317 lines)
```

### React Hooks
```
/src/hooks/
  ├── useWeatherData.ts       (95 lines)
  ├── useWaterLevelData.ts    (113 lines)
  ├── useDroughtData.ts       (93 lines)
  ├── useGroundwaterData.ts   (85 lines)
  └── index.ts                (5 lines)
```

### Documentation
```
/DATA_INTEGRATION_REPORT.md  (Full implementation report)
/QUICK_START_GUIDE.md        (This file)
/DATA_SOURCES.md             (API documentation)
/.env.example                (Environment variables)
```

---

## Support & Resources

- **Full Report:** See DATA_INTEGRATION_REPORT.md for complete details
- **API Docs:** See DATA_SOURCES.md for API specifications
- **Supabase Docs:** https://supabase.com/docs
- **React Query Docs:** https://tanstack.com/query/latest

---

**Ready to proceed with PHASE 3!**

*Last Updated: 2025-10-27*
