# 📡 API Documentation - DunApp PWA

> Edge Functions and API Integration Reference

**Last Updated:** 2025-11-02
**Version:** 1.0.0

---

## 📖 Table of Contents

- [Overview](#overview)
- [Edge Functions](#edge-functions)
  - [fetch-meteorology](#fetch-meteorology)
- [External APIs](#external-apis)
  - [OpenWeatherMap](#openweathermap)
  - [Yr.no (MET Norway)](#yrno-met-norway)
  - [RainViewer](#rainviewer)
  - [Meteoblue](#meteoblue-fallback)
  - [HydroInfo](#hydroinfo)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)

---

## Overview

DunApp PWA uses **Supabase Edge Functions** (Deno runtime) to fetch data from external weather APIs and store it in PostgreSQL.

### Architecture

```
External APIs → Edge Functions (Deno) → PostgreSQL (Supabase) → React Frontend
     ↓                    ↓                      ↓                     ↓
OpenWeatherMap    fetch-meteorology      meteorology_data       useWeatherData hook
Yr.no API         (hourly cron)          meteorology_forecasts  useForecastData hook
RainViewer        -                      -                      Direct client fetch
```

---

## Edge Functions

### `fetch-precipitation-measured`

Mért (HungaroMet mérőállomás) vagy interpolált (IDW) csapadék-összesítés városonként: 7 nap, 30 nap, tárgyév (az adott év jan. 1-jétől).
A `fetch-precipitation-summary` (Open-Meteo) MELLETT fut, azt nem módosítja.

**Runtime:** Deno · **Trigger:** pg_cron naponta 07:30 UTC (jobid 14) + manuális POST · `--no-verify-jwt`
**Location:** `supabase/functions/fetch-precipitation-measured/index.ts` (+ `_shared/precipitation-geo.ts`)

```
POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/fetch-precipitation-measured            # napi mód (az utolsó ~9 napi fájl)
POST …/fetch-precipitation-measured?backfill=2026   (x-backfill-token: <PRECIP_BACKFILL_TOKEN>) # egyszeri visszatöltés
```

Válasz: `{ success, mode, dataThrough, filesProcessed, modelFilledDays, results: [{ city, status, method, nearestKm, yearToDate, daysMeasured, daysModeled, daysExpected }] }`.
`status: "no-station"` = a településhez nincs elég közeli mérőállomás (nincs `precipitation_measured_summary` sor).

Táblák: `precipitation_station_daily`, `precipitation_city_daily`, `precipitation_measured_summary` (ezt olvassa a frontend), `precipitation_compare_log`.
Forrásmegjelölés (kötelező): *Adatbázis: Meteorológiai Adattár, HungaroMet Nonprofit Zrt.*

---

### `fetch-meteorology`

Fetches current weather and 6-hourly forecast data for all 4 cities.

**Runtime:** Deno
**Trigger:** Hourly cron job (every hour at :05) + Manual HTTP POST
**Location:** `supabase/functions/fetch-meteorology/index.ts`

#### Endpoint

```
POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/fetch-meteorology
```

#### Authentication

```http
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

#### Request

No request body required.

```bash
curl -X POST 'https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-meteorology' \
  -H 'Authorization: Bearer eyJhbGci...' \
  -H 'Content-Type: application/json'
```

#### Response

```json
{
  "success": true,
  "timestamp": "2025-11-02T22:33:08.262Z",
  "current": {
    "summary": {
      "total": 4,
      "success": 4,
      "failed": 0
    },
    "results": [
      {
        "city": "Szekszárd",
        "status": "success",
        "source": "openweathermap",
        "temperature": 13.23
      },
      {
        "city": "Baja",
        "status": "success",
        "source": "openweathermap",
        "temperature": 13.06
      },
      {
        "city": "Dunaszekcső",
        "status": "success",
        "source": "openweathermap",
        "temperature": 12.84
      },
      {
        "city": "Mohács",
        "status": "success",
        "source": "openweathermap",
        "temperature": 13.95
      }
    ]
  },
  "forecast": {
    "summary": {
      "total": 4,
      "success": 4,
      "failed": 0
    },
    "results": [
      {
        "city": "Szekszárd",
        "status": "success",
        "forecastCount": 11
      },
      {
        "city": "Baja",
        "status": "success",
        "forecastCount": 11
      },
      {
        "city": "Dunaszekcső",
        "status": "success",
        "forecastCount": 11
      },
      {
        "city": "Mohács",
        "status": "success",
        "forecastCount": 11
      }
    ]
  }
}
```

#### Error Response

```json
{
  "error": "Error message",
  "timestamp": "2025-11-02T22:33:08.262Z"
}
```

#### Functionality

1. **Fetch Current Weather** (OpenWeatherMap API)
   - Fetches current conditions for all 4 cities
   - Falls back to Meteoblue if OpenWeatherMap fails
   - Stores in `meteorology_data` table

2. **Fetch Forecast** (Yr.no API)
   - Fetches 6-hourly forecast for next 72 hours (11 data points)
   - Deletes old forecasts before inserting new ones (upsert strategy)
   - Stores in `meteorology_forecasts` table

3. **Automatic Execution**
   - Triggered by pg_cron every hour at :05 (00:05, 01:05, 02:05, etc.)
   - Cron job name: `fetch-meteorology-hourly`
   - Schedule: `5 * * * *`

#### Environment Variables (Edge Function Secrets)

Set these in Supabase Dashboard (Settings > Edge Functions > Secrets):

```env
OPENWEATHER_API_KEY=your_api_key_here
METEOBLUE_API_KEY=your_api_key_here
YR_NO_USER_AGENT="DunApp PWA/1.0 (contact@dunapp.hu)"
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Internal Functions

```typescript
// Fetch from OpenWeatherMap
async function fetchFromOpenWeatherMap(city: { lat: number; lon: number })

// Fetch from Meteoblue (fallback)
async function fetchFromMeteoblue(city: { lat: number; lon: number })

// Fetch 6-hourly forecast from Yr.no
async function fetchYrNoForecast(city: { name: string; lat: number; lon: number })

// Retry logic (3 attempts)
async function fetchWithRetry<T>(fetchFn: () => Promise<T>, maxRetries = 3): Promise<T>
```

#### Cities Configuration

Hardcoded in Edge Function:

```typescript
const CITIES = [
  { name: 'Szekszárd', lat: 46.3517, lon: 18.7086 },
  { name: 'Baja', lat: 46.1810, lon: 18.9550 },
  { name: 'Dunaszekcső', lat: 46.0833, lon: 18.7667 },
  { name: 'Mohács', lat: 45.9933, lon: 18.6850 }
];
```

#### Testing

Manual trigger:
```bash
# Trigger via HTTP
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/fetch-meteorology' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# Or via SQL (if cron function exists)
SELECT invoke_fetch_meteorology();
```

Check cron job history:
```sql
SELECT
  jobid, runid, status, return_message,
  start_time, end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job
  WHERE jobname = 'fetch-meteorology-hourly'
)
ORDER BY start_time DESC
LIMIT 10;
```

---

## External APIs

### OpenWeatherMap

**Purpose:** Current weather data (temperature, humidity, wind, pressure)

**API Endpoint:**
```
https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&lang=hu
```

**Authentication:** API Key
**Rate Limit:** 1,000 calls/day (free tier)
**Documentation:** https://openweathermap.org/current

**Response Fields Used:**
- `main.temp` → temperature
- `main.feels_like` → feelsLike
- `main.temp_min` → tempMin
- `main.temp_max` → tempMax
- `main.pressure` → pressure
- `main.humidity` → humidity
- `wind.speed` → windSpeed (m/s)
- `wind.deg` → windDirection (degrees)
- `clouds.all` → cloudsPercent
- `rain.1h` / `rain.3h` → precipitation
- `snow.1h` / `snow.3h` → snow
- `visibility` → visibility (meters)
- `weather[0].main` → weatherMain
- `weather[0].description` → weatherDescription
- `weather[0].icon` → weatherIcon

**Example Response:**
```json
{
  "coord": {"lon": 18.7086, "lat": 46.3517},
  "weather": [{"id": 800, "main": "Clear", "description": "clear sky", "icon": "01d"}],
  "main": {
    "temp": 13.23,
    "feels_like": 12.45,
    "temp_min": 12.5,
    "temp_max": 14.0,
    "pressure": 1013,
    "humidity": 64
  },
  "wind": {"speed": 2.6, "deg": 196},
  "clouds": {"all": 0},
  "visibility": 10000,
  "dt": 1698940800
}
```

---

### Yr.no (MET Norway)

**Purpose:** 6-hourly weather forecast (next 72 hours)

**API Endpoint:**
```
https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={lat}&lon={lon}
```

**Authentication:** User-Agent header required (no API key)
**Rate Limit:** Respectful caching (10 requests/second max)
**Documentation:** https://api.met.no/weatherapi/locationforecast/2.0/documentation

**Required Headers:**
```http
User-Agent: DunApp PWA/1.0 (contact@dunapp.hu)
```

**Response Fields Used:**
- `properties.timeseries[].time` → forecastTime
- `data.instant.details.air_temperature` → temperature
- `data.next_6_hours.details.precipitation_amount` → precipitationAmount
- `data.instant.details.wind_speed` → windSpeed
- `data.instant.details.wind_from_direction` → windDirection
- `data.instant.details.relative_humidity` → humidity
- `data.instant.details.air_pressure_at_sea_level` → pressure
- `data.instant.details.cloud_area_fraction` → cloudsPercent
- `data.next_6_hours.summary.symbol_code` → weatherSymbol

**Data Processing:**
- Filters to next 72 hours
- Returns every 6th hour (~11 data points)
- Uses `next_6_hours` data if available, otherwise `next_12_hours`

**Example Response (simplified):**
```json
{
  "type": "Feature",
  "properties": {
    "timeseries": [
      {
        "time": "2025-11-03T00:00:00Z",
        "data": {
          "instant": {
            "details": {
              "air_temperature": 12.3,
              "wind_speed": 2.5,
              "wind_from_direction": 180,
              "relative_humidity": 65,
              "air_pressure_at_sea_level": 1013,
              "cloud_area_fraction": 20
            }
          },
          "next_6_hours": {
            "summary": {"symbol_code": "partlycloudy_day"},
            "details": {"precipitation_amount": 0.5}
          }
        }
      }
    ]
  }
}
```

---

### RainViewer

**Purpose:** Animated weather radar overlay

**API Endpoint:**
```
https://api.rainviewer.com/public/weather-maps.json
```

**Authentication:** None (free public API)
**Rate Limit:** No strict limits (respectful usage)
**Documentation:** https://www.rainviewer.com/api.html

**Response:**
```json
{
  "radar": {
    "past": [
      {"time": 1698940800, "path": "/v2/radar/1698940800/256/{z}/{x}/{y}/2/0_0.png"}
    ],
    "nowcast": []
  }
}
```

**Tile URL Format:**
```
https://tilecache.rainviewer.com/v2/radar/{timestamp}/256/{z}/{x}/{y}/2/0_0.png
```

**Parameters:**
- `{timestamp}` → Unix timestamp from API
- `{z}` → Zoom level (Leaflet)
- `{x}/{y}` → Tile coordinates (Leaflet)
- `2` → Color scheme (0-8 available)
- `0_0` → smooth_0_snow_0 (smoothing + snow mode)

**Client-Side Usage:**
- Fetched directly from React component (RadarMap.tsx)
- No backend proxy needed
- Auto-refresh every 10 minutes
- Animation: 8-12 frames at 500ms intervals

---

### Meteoblue (Fallback)

**Purpose:** Fallback weather API if OpenWeatherMap fails

**API Endpoint:**
```
https://my.meteoblue.com/packages/basic-1h?apikey={API_KEY}&lat={lat}&lon={lon}&format=json
```

**Authentication:** API Key
**Rate Limit:** 3,000 calls/month (free tier)
**Documentation:** https://docs.meteoblue.com

**Used For:**
- Current weather fallback
- Backup forecast data (if needed)

**Response Fields:**
- `data_1h.temperature[]` → hourly temperature
- `data_1h.precipitation[]` → hourly precipitation
- `data_1h.windspeed[]` → hourly wind speed
- `data_1h.winddirection[]` → hourly wind direction

---

### HydroInfo

**Purpose:** Danube water level data

**API Endpoint:** _(Documentation pending)_
```
http://www.hydroinfo.hu/...
```

**Authentication:** None
**Status:** 🔄 **Planned** (not yet implemented)

**Planned Fields:**
- Water level (cm)
- Flow rate (m³/s)
- Water temperature (°C)
- Timestamp

**Stations:**
- Baja
- Mohács
- Nagybajcs

---

## Database Schema

### `meteorology_data` Table

Stores current weather data.

```sql
CREATE TABLE meteorology_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES meteorology_cities(id) ON DELETE CASCADE,
  temperature DECIMAL(4,1),
  feels_like DECIMAL(4,1),
  temp_min DECIMAL(4,1),
  temp_max DECIMAL(4,1),
  pressure INTEGER,
  humidity INTEGER,
  wind_speed DECIMAL(5,2),
  wind_direction INTEGER,
  clouds_percent INTEGER,
  weather_main TEXT,
  weather_description TEXT,
  weather_icon TEXT,
  rain_1h DECIMAL(5,2),
  rain_3h DECIMAL(5,2),
  snow_1h DECIMAL(5,2),
  snow_3h DECIMAL(5,2),
  visibility INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `meteorology_forecasts` Table

Stores 6-hourly forecast data.

```sql
CREATE TABLE meteorology_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES meteorology_cities(id) ON DELETE CASCADE,
  forecast_time TIMESTAMPTZ NOT NULL,
  temperature DECIMAL(4,1),
  temperature_min DECIMAL(4,1),      -- Currently NULL (Yr.no doesn't provide)
  temperature_max DECIMAL(4,1),      -- Currently NULL (Yr.no doesn't provide)
  precipitation_amount DECIMAL(5,2),
  wind_speed DECIMAL(5,2),
  wind_direction INTEGER,
  humidity INTEGER,
  pressure DECIMAL(6,2),
  clouds_percent INTEGER,
  weather_symbol TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_id, forecast_time)
);
```

### `meteorology_cities` Table

Reference table for cities.

```sql
CREATE TABLE meteorology_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  county TEXT,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  population INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Error Handling

### Edge Function Error Codes

| Status | Meaning | Cause |
|--------|---------|-------|
| 200 | Success | All data fetched successfully |
| 500 | Internal Error | Edge Function crashed |
| 503 | API Unavailable | External API down |

### Error Response Format

```json
{
  "error": "Failed to fetch weather data: OpenWeatherMap API error",
  "timestamp": "2025-11-02T22:33:08.262Z"
}
```

### Retry Logic

All API calls use exponential backoff retry (3 attempts):

```typescript
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  // Retry with delays: 1s, 2s, 4s
  const delays = [1000, 2000, 4000];
  // ...
}
```

### Fallback Hierarchy

```
OpenWeatherMap (primary)
    ↓ (fails)
Meteoblue (fallback)
    ↓ (fails)
Return error
```

### Logging

All Edge Function logs visible in Supabase Dashboard:
- **Location:** Logs > Edge Functions > fetch-meteorology
- **Retention:** 7 days

**Log Levels:**
- `console.log()` → Info
- `console.warn()` → Warning
- `console.error()` → Error

---

## Support

For API issues or questions:
- **Edge Function Logs:** https://supabase.com/dashboard/project/YOUR_PROJECT_ID/logs/edge-functions
- **Cron Job History:** See SQL query in [fetch-meteorology section](#fetch-meteorology)
- **GitHub Issues:** https://github.com/endresztellik-gif/DunApp/issues

---

**Last Updated:** 2025-11-02 (Phase 9 Complete)
**Documentation Version:** 1.0.0
