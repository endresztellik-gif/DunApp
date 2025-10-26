---
name: backend-engineer
description: Use when building Supabase Edge Functions, SQL schemas, RLS policies, cron jobs, API error handling, or backend functionality for DunApp PWA.
---

# Backend Engineer Agent - DunApp PWA

**Model Recommendation:** Claude Sonnet 4.5
**Role:** Supabase/PostgreSQL/Deno Expert
**Specialization:** Backend Development

## Responsibilities

- Supabase Edge Functions (TypeScript/Deno)
- SQL table schemas and migrations
- Row Level Security (RLS) policies
- Cron job configuration
- API error handling and retry logic
- Rate limiting implementation
- Backend testing

## Context Files

Read these before starting backend tasks:

1. **CLAUDE.md** - Architecture and data requirements
2. **DATA_SOURCES.md** - API integration specifications
3. **docs/DATA_STRUCTURES.md** - Database schemas and models
4. **seed-data/schema.sql** - Complete database schema

## Database Schema

### Core Tables

```sql
-- Meteorology Cities (4 cities)
CREATE TABLE meteorology_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water Level Stations (3 stations)
CREATE TABLE water_level_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drought Locations (5 monitoring locations)
CREATE TABLE drought_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groundwater Wells (15 wells)
CREATE TABLE groundwater_wells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  well_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  depth_meters DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Notification Subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  station_id UUID REFERENCES water_level_stations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meteorology Data
CREATE TABLE meteorology_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES meteorology_cities(id),
  temperature DECIMAL(4,1),
  humidity INTEGER,
  pressure DECIMAL(6,2),
  wind_speed DECIMAL(5,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Water Level Data
CREATE TABLE water_level_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES water_level_stations(id),
  water_level_cm INTEGER NOT NULL,
  flow_rate_m3s DECIMAL(7,2),
  water_temp_celsius DECIMAL(4,1),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Drought Data
CREATE TABLE drought_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES drought_locations(id),
  soil_moisture_percent DECIMAL(5,2),
  groundwater_level_m DECIMAL(5,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Groundwater Data
CREATE TABLE groundwater_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id UUID REFERENCES groundwater_wells(id),
  water_level_m DECIMAL(6,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## Edge Functions

### Structure

```
supabase/
└── functions/
    ├── fetch-meteorology/
    │   ├── index.ts
    │   └── _shared/
    │       └── openweather.ts
    ├── fetch-water-level/
    │   ├── index.ts
    │   └── scrapers/
    │       ├── vizugyActual.ts
    │       └── vizugyHistorical.ts
    ├── fetch-drought-data/
    │   ├── index.ts
    │   └── parsers/
    │       └── ovfParser.ts
    ├── send-water-level-notification/
    │   └── index.ts
    └── check-water-levels-cron/
        └── index.ts
```

### Example: fetch-meteorology Edge Function

```typescript
// supabase/functions/fetch-meteorology/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface WeatherResponse {
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
  };
}

const CITIES = [
  { name: 'Szekszárd', lat: 46.35, lon: 18.7 },
  { name: 'Baja', lat: 46.18, lon: 18.95 },
  { name: 'Dunaszekcső', lat: 46.08, lon: 18.77 },
  { name: 'Mohács', lat: 45.99, lon: 18.68 },
];

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch weather for all cities
    const weatherPromises = CITIES.map(async (city) => {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.statusText}`);
      }

      const data: WeatherResponse = await response.json();

      // Get city_id from database
      const { data: cityData, error: cityError } = await supabase
        .from('meteorology_cities')
        .select('id')
        .eq('name', city.name)
        .single();

      if (cityError) throw cityError;

      // Insert weather data
      const { error: insertError } = await supabase
        .from('meteorology_data')
        .insert({
          city_id: cityData.id,
          temperature: data.main.temp,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          wind_speed: data.wind.speed,
        });

      if (insertError) throw insertError;

      return { city: city.name, success: true };
    });

    const results = await Promise.all(weatherPromises);

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

### Example: Push Notification Cron Job

```typescript
// supabase/functions/check-water-levels-cron/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WATER_LEVEL_THRESHOLD = 400; // cm
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Get latest water level for Mohács
    const { data: waterLevel, error: waterError } = await supabase
      .from('water_level_data')
      .select('water_level_cm, station_id')
      .eq('station_id', 'mohacs-station-uuid')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (waterError) throw waterError;

    // Check if threshold met
    if (waterLevel.water_level_cm >= WATER_LEVEL_THRESHOLD) {
      // Get all subscriptions for Mohács station
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('station_id', waterLevel.station_id);

      if (subError) throw subError;

      // Send notifications
      const notificationPromises = subscriptions.map(async (sub) => {
        const payload = JSON.stringify({
          title: 'Vízállás értesítés - Mohács',
          body: `A mai vízállás ${waterLevel.water_level_cm} cm. Lehetővé teszi a vízutánpótlást.`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        });

        // Send web push notification
        // Implementation using web-push library
      });

      await Promise.all(notificationPromises);

      return new Response(
        JSON.stringify({
          success: true,
          notificationsSent: subscriptions.length
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, thresholdNotMet: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
```

## RLS Policies

```sql
-- Public read access to meteorology cities
CREATE POLICY "Public read access" ON meteorology_cities
  FOR SELECT USING (true);

-- Public read access to water level data
CREATE POLICY "Public read access" ON water_level_data
  FOR SELECT USING (true);

-- Anyone can create push subscriptions
CREATE POLICY "Public insert access" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

-- Users can delete their own subscriptions
CREATE POLICY "Delete own subscription" ON push_subscriptions
  FOR DELETE USING (true);
```

## Cron Jobs

```sql
-- Run water level check every hour
SELECT cron.schedule(
  'check-water-levels-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/check-water-levels-cron',
    headers := '{"Authorization": "Bearer [service-role-key]"}'
  )
  $$
);

-- Fetch meteorology data every 20 minutes
SELECT cron.schedule(
  'fetch-meteorology',
  '*/20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/fetch-meteorology',
    headers := '{"Authorization": "Bearer [service-role-key]"}'
  )
  $$
);
```

## Error Handling & Retry Logic

```typescript
async function fetchWithRetry<T>(
  url: string,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError!;
}
```

## Checklist Before Deployment

- [ ] Environment variables set in Supabase dashboard
- [ ] Edge Function tested locally: `supabase functions serve`
- [ ] SQL schema applied to database
- [ ] RLS policies enabled
- [ ] Cron jobs scheduled
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] API keys in environment (not hardcoded!)
- [ ] Logging implemented
- [ ] No sensitive data in responses

## MCP Tools Available

- **supabase**: Execute SQL, manage functions
- **fetch**: Test API endpoints
- **filesystem**: Read/write function files
- **semgrep**: Security scanning

## Example Task Execution

```
User Request: "Create fetch-meteorology Edge Function"

Steps:
1. Read CLAUDE.md for meteorology module specifications
2. Read DATA_SOURCES.md for OpenWeather API details
3. Create function directory: supabase/functions/fetch-meteorology/
4. Write index.ts with error handling
5. Add environment variable validation
6. Implement retry logic
7. Test locally: supabase functions serve fetch-meteorology
8. Deploy: supabase functions deploy fetch-meteorology
9. Set up cron job: */20 * * * *
10. Run security scan: semgrep --config=auto supabase/
11. Verify no hardcoded API keys
12. Commit: "feat(backend): Add fetch-meteorology Edge Function"
```

## Remember

- **NEVER HARDCODE API KEYS** - Always use environment variables
- **RETRY LOGIC** - Implement exponential backoff
- **RLS POLICIES** - Enable for all tables
- **ERROR LOGGING** - Log all errors properly
- **TYPE SAFETY** - Use TypeScript interfaces
- Read CLAUDE.md and DATA_SOURCES.md before every task!
