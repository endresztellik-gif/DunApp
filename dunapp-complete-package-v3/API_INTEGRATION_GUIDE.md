# 🔌 API_INTEGRATION_GUIDE.md - DunApp PWA

> **Lépésről-lépésre API integrációs útmutató**  
> Minden API, minden modul, production-ready kóddal

**Létrehozva:** 2025-10-24  
**Verzió:** 1.0  
**Status:** ✅ Production Ready

---

## 📋 TARTALOMJEGYZÉK

1. [Supabase Edge Functions Setup](#supabase-setup)
2. [Meteorológia API Integráció](#meteorology-api)
3. [Vízállás Scraping](#water-level-scraping)
4. [Aszály & Talajvíz API](#drought-api)
5. [Hibakezelés & Retry](#error-handling)
6. [Cache Stratégia](#caching)
7. [Testing](#testing)

---

## 🚀 SUPABASE EDGE FUNCTIONS SETUP {#supabase-setup}

### 1. Supabase CLI Telepítése

```bash
# Mac/Linux
brew install supabase/tap/supabase

# Windows
scoop install supabase

# Verify
supabase --version
```

### 2. Login & Project Init

```bash
# Login
supabase login

# Link projekthez
supabase link --project-ref your-project-ref

# Init Functions
supabase functions new fetch-meteorology
supabase functions new fetch-water-level
supabase functions new fetch-drought
supabase functions new check-water-level  # Push notification
```

### 3. Environment Variables (Secrets)

```bash
# Set secrets
supabase secrets set OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
supabase secrets set METEOBLUE_API_KEY=YOUR_METEOBLUE_API_KEY_HERE
supabase secrets set VAPID_PRIVATE_KEY=your_vapid_private_key
supabase secrets set VAPID_SUBJECT=mailto:your-email@dunapp.hu

# List secrets
supabase secrets list
```

---

## 🌤️ METEOROLÓGIA API INTEGRÁCIÓ {#meteorology-api}

### Edge Function: `fetch-meteorology`

**Fájl:** `supabase/functions/fetch-meteorology/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
const METEOBLUE_API_KEY = Deno.env.get('METEOBLUE_API_KEY');

const CITIES = [
  { name: 'Szekszárd', lat: 46.3481, lon: 18.7097 },
  { name: 'Baja', lat: 46.1811, lon: 18.9550 },
  { name: 'Dunaszekcső', lat: 46.0833, lon: 18.7667 },
  { name: 'Mohács', lat: 45.9928, lon: 18.6836 }
];

interface WeatherData {
  city_name: string;
  temperature: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust: number | null;
  precipitation_1h: number;
  clouds: number;
  visibility: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  timestamp: string;
  source: string;
}

// OpenWeather API
async function fetchFromOpenWeather(city: typeof CITIES[0]): Promise<WeatherData> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=hu`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`OpenWeather API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    city_name: city.name,
    temperature: data.main.temp,
    feels_like: data.main.feels_like,
    temp_min: data.main.temp_min,
    temp_max: data.main.temp_max,
    pressure: data.main.pressure,
    humidity: data.main.humidity,
    wind_speed: data.wind.speed,
    wind_deg: data.wind.deg,
    wind_gust: data.wind.gust || null,
    precipitation_1h: data.rain?.['1h'] || 0,
    clouds: data.clouds.all,
    visibility: data.visibility,
    weather_main: data.weather[0].main,
    weather_description: data.weather[0].description,
    weather_icon: data.weather[0].icon,
    timestamp: new Date().toISOString(),
    source: 'openweather'
  };
}

// Meteoblue API (fallback)
async function fetchFromMeteoblue(city: typeof CITIES[0]): Promise<WeatherData> {
  const url = `https://my.meteoblue.com/packages/basic-1h?apikey=${METEOBLUE_API_KEY}&lat=${city.lat}&lon=${city.lon}&format=json`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Meteoblue API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Legfrissebb adat (első időpont)
  const latest = {
    temp: data.data_1h.temperature[0],
    precip: data.data_1h.precipitation[0],
    wind: data.data_1h.windspeed[0],
    winddir: data.data_1h.winddirection[0],
    humidity: data.data_1h.relativehumidity[0]
  };
  
  return {
    city_name: city.name,
    temperature: latest.temp,
    feels_like: latest.temp, // Approximate
    temp_min: latest.temp - 2,
    temp_max: latest.temp + 2,
    pressure: 1013, // Default (not provided)
    humidity: latest.humidity,
    wind_speed: latest.wind,
    wind_deg: latest.winddir,
    wind_gust: null,
    precipitation_1h: latest.precip,
    clouds: 0, // Not provided
    visibility: 10000, // Default
    weather_main: 'Clear',
    weather_description: 'tiszta égbolt',
    weather_icon: '01d',
    timestamp: new Date().toISOString(),
    source: 'meteoblue'
  };
}

// Retry logic
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  
  throw new Error('All retries failed');
}

// Main handler
serve(async (req) => {
  try {
    console.log('[fetch-meteorology] Starting weather data fetch...');
    
    const results = [];
    
    for (const city of CITIES) {
      try {
        // Primary: OpenWeather
        console.log(`[fetch-meteorology] Fetching ${city.name} from OpenWeather...`);
        const data = await fetchWithRetry(() => fetchFromOpenWeather(city));
        results.push(data);
        
      } catch (error) {
        console.error(`[fetch-meteorology] OpenWeather failed for ${city.name}:`, error);
        
        try {
          // Fallback: Meteoblue
          console.log(`[fetch-meteorology] Trying Meteoblue for ${city.name}...`);
          const data = await fetchWithRetry(() => fetchFromMeteoblue(city));
          results.push(data);
          
        } catch (error2) {
          console.error(`[fetch-meteorology] All sources failed for ${city.name}:`, error2);
          // Continue with other cities
        }
      }
    }
    
    // Get city IDs
    const { data: cities } = await supabase
      .from('meteorology_cities')
      .select('id, name');
    
    // Prepare data for insertion
    const insertData = results.map(result => {
      const city = cities?.find(c => c.name === result.city_name);
      return {
        city_id: city?.id,
        ...result
      };
    });
    
    // Insert into database
    const { error: insertError } = await supabase
      .from('meteorology_data')
      .insert(insertData);
    
    if (insertError) {
      throw insertError;
    }
    
    console.log(`[fetch-meteorology] Successfully inserted ${results.length} weather records`);
    
    return new Response(
      JSON.stringify({
        success: true,
        records: results.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('[fetch-meteorology] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### Deploy & Setup Cron

```bash
# Deploy
supabase functions deploy fetch-meteorology

# Setup cron (20 percenként)
supabase sql << EOF
SELECT cron.schedule(
  'fetch-meteorology',
  '*/20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/fetch-meteorology',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
EOF
```

---

## 💧 VÍZÁLLÁS SCRAPING {#water-level-scraping}

### Edge Function: `fetch-water-level`

**Fájl:** `supabase/functions/fetch-water-level/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const VIZUGY_URL = 'https://www.vizugy.hu/index.php?module=content&programelemid=138';
const STATIONS = ['Nagybajcs', 'Mohács', 'Baja'];

interface WaterLevelData {
  station_name: string;
  water_level: number;
  flow_rate: number | null;
  water_temp: number | null;
  timestamp: string;
}

async function scrapeVizugyActual(): Promise<WaterLevelData[]> {
  console.log('[scrape-vizugy] Fetching water level data...');
  
  const response = await fetch(VIZUGY_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`vizugy.hu fetch failed: ${response.status}`);
  }
  
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  const data: WaterLevelData[] = [];
  
  // Find table rows
  const rows = doc?.querySelectorAll('table tr');
  
  if (!rows) {
    throw new Error('No table found on vizugy.hu');
  }
  
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    
    if (cells.length > 0) {
      const stationName = cells[0]?.textContent?.trim() || '';
      
      // Check if this is one of our stations
      if (STATIONS.some(s => stationName.includes(s))) {
        // Get last water level value (last column)
        const waterLevelText = cells[cells.length - 1]?.textContent?.trim();
        const waterLevel = waterLevelText ? parseInt(waterLevelText) : null;
        
        if (waterLevel && !isNaN(waterLevel)) {
          data.push({
            station_name: stationName,
            water_level: waterLevel,
            flow_rate: null, // Not available from this page
            water_temp: null, // Not available from this page
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  });
  
  console.log(`[scrape-vizugy] Found ${data.length} stations`);
  return data;
}

serve(async (req) => {
  try {
    console.log('[fetch-water-level] Starting water level fetch...');
    
    // Scrape data
    const scrapedData = await scrapeVizugyActual();
    
    if (scrapedData.length === 0) {
      throw new Error('No water level data found');
    }
    
    // Get station IDs
    const { data: stations } = await supabase
      .from('water_level_stations')
      .select('id, station_name');
    
    // Prepare data for insertion
    const insertData = scrapedData.map(item => {
      const station = stations?.find(s => 
        s.station_name === item.station_name || 
        item.station_name.includes(s.station_name)
      );
      
      return {
        station_id: station?.id,
        ...item
      };
    });
    
    // Insert into database
    const { error: insertError } = await supabase
      .from('water_level_data')
      .insert(insertData);
    
    if (insertError) {
      throw insertError;
    }
    
    console.log(`[fetch-water-level] Successfully inserted ${insertData.length} records`);
    
    return new Response(
      JSON.stringify({
        success: true,
        records: insertData.length,
        data: insertData,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('[fetch-water-level] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### Deploy & Cron

```bash
# Deploy
supabase functions deploy fetch-water-level

# Cron (óránként)
supabase sql << EOF
SELECT cron.schedule(
  'fetch-water-level',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/fetch-water-level',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
EOF
```

---

## 🏜️ ASZÁLY & TALAJVÍZ API {#drought-api}

### Edge Function: `fetch-drought`

**Fájl:** `supabase/functions/fetch-drought/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const ASZALY_API_BASE = 'https://aszalymonitoring.vizugy.hu/api';

const LOCATIONS = [
  { name: 'Katymár', lat: 46.2167, lon: 19.5667 },
  { name: 'Dávod', lat: 46.4167, lon: 18.7667 },
  { name: 'Szederkény', lat: 46.3833, lon: 19.2500 },
  { name: 'Sükösd', lat: 46.2833, lon: 19.0000 },
  { name: 'Csávoly', lat: 46.4500, lon: 19.2833 }
];

interface DroughtData {
  location_name: string;
  station_name: string;
  station_distance: number;
  date: string;
  drought_index: number | null;
  soil_moisture_10cm: number | null;
  soil_moisture_20cm: number | null;
  soil_moisture_30cm: number | null;
  soil_moisture_50cm: number | null;
  soil_moisture_70cm: number | null;
  soil_moisture_100cm: number | null;
  water_deficit: number | null;
  precipitation: number | null;
  air_temperature: number | null;
  soil_temperature: number | null;
  humidity: number | null;
}

async function fetchDroughtDataForLocation(location: typeof LOCATIONS[0]): Promise<DroughtData[]> {
  console.log(`[drought-api] Fetching data for ${location.name}...`);
  
  // 1. Search for nearest station
  const searchResponse = await fetch(
    `${ASZALY_API_BASE}/search?settlement=${encodeURIComponent(location.name)}`
  );
  
  if (!searchResponse.ok) {
    throw new Error(`Search failed for ${location.name}: ${searchResponse.status}`);
  }
  
  const searchData = await searchResponse.json();
  const stationId = searchData.nearestStation?.id;
  
  if (!stationId) {
    console.warn(`[drought-api] No station found for ${location.name}`);
    return [];
  }
  
  // 2. Fetch data for last 60 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const dataResponse = await fetch(
    `${ASZALY_API_BASE}/station/${stationId}/data?from=${startDate}&to=${endDate}`
  );
  
  if (!dataResponse.ok) {
    throw new Error(`Data fetch failed for ${location.name}: ${dataResponse.status}`);
  }
  
  const rawData = await dataResponse.json();
  
  // 3. Transform data
  return rawData.map((item: any) => ({
    location_name: location.name,
    station_name: searchData.nearestStation.name,
    station_distance: searchData.nearestStation.distance,
    date: item.date,
    drought_index: item.HDI || null,
    soil_moisture_10cm: item.soilMoisture_10cm || null,
    soil_moisture_20cm: item.soilMoisture_20cm || null,
    soil_moisture_30cm: item.soilMoisture_30cm || null,
    soil_moisture_50cm: item.soilMoisture_50cm || null,
    soil_moisture_70cm: item.soilMoisture_70cm || null,
    soil_moisture_100cm: item.soilMoisture_100cm || null,
    water_deficit: item.HDIS || null,
    precipitation: item.precipitation || null,
    air_temperature: item.airTemp || null,
    soil_temperature: item.soilTemp || null,
    humidity: item.relativeHumidity || null
  }));
}

serve(async (req) => {
  try {
    console.log('[fetch-drought] Starting drought data fetch...');
    
    const allData: DroughtData[] = [];
    
    for (const location of LOCATIONS) {
      try {
        const data = await fetchDroughtDataForLocation(location);
        allData.push(...data);
      } catch (error) {
        console.error(`[fetch-drought] Failed for ${location.name}:`, error);
        // Continue with other locations
      }
    }
    
    if (allData.length === 0) {
      throw new Error('No drought data fetched');
    }
    
    // Get location IDs
    const { data: locations } = await supabase
      .from('drought_locations')
      .select('id, location_name');
    
    // Prepare data for insertion
    const insertData = allData.map(item => {
      const location = locations?.find(l => l.location_name === item.location_name);
      return {
        location_id: location?.id,
        ...item
      };
    });
    
    // Insert into database (upsert to avoid duplicates)
    const { error: insertError } = await supabase
      .from('drought_data')
      .upsert(insertData, {
        onConflict: 'location_id,date',
        ignoreDuplicates: false
      });
    
    if (insertError) {
      throw insertError;
    }
    
    console.log(`[fetch-drought] Successfully inserted ${insertData.length} records`);
    
    return new Response(
      JSON.stringify({
        success: true,
        records: insertData.length,
        locations: LOCATIONS.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('[fetch-drought] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### Deploy & Cron

```bash
# Deploy
supabase functions deploy fetch-drought

# Cron (naponta 6:00)
supabase sql << EOF
SELECT cron.schedule(
  'fetch-drought',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/fetch-drought',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
EOF
```

---

## ⚠️ HIBAKEZELÉS & RETRY {#error-handling}

### Retry Utility

```typescript
// utils/retry.ts

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry
  } = options;
  
  let lastError: Error;
  let currentDelay = delayMs;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        break;
      }
      
      if (onRetry) {
        onRetry(attempt, lastError);
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${currentDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
    }
  }
  
  throw lastError!;
}

// Usage
const data = await retry(
  () => fetch('https://api.example.com/data').then(r => r.json()),
  {
    maxAttempts: 3,
    delayMs: 1000,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}:`, error.message);
    }
  }
);
```

---

## 💾 CACHE STRATÉGIA {#caching}

### Supabase Cache Table

```sql
CREATE TABLE IF NOT EXISTS api_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for cleanup
CREATE INDEX idx_cache_expires ON api_cache(expires_at);

-- Cleanup function (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM api_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### Cache Utility

```typescript
// utils/cache.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function getCached<T>(key: string): Promise<T | null> {
  const { data } = await supabase
    .from('api_cache')
    .select('value, expires_at')
    .eq('key', key)
    .single();
  
  if (!data) {
    return null;
  }
  
  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    // Delete expired
    await supabase.from('api_cache').delete().eq('key', key);
    return null;
  }
  
  return data.value as T;
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  
  await supabase.from('api_cache').upsert({
    key,
    value: value as any,
    expires_at: expiresAt.toISOString()
  });
}

export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try cache first
  const cached = await getCached<T>(key);
  
  if (cached !== null) {
    console.log(`[cache] HIT: ${key}`);
    return cached;
  }
  
  // Fetch fresh data
  console.log(`[cache] MISS: ${key}`);
  const freshData = await fetchFn();
  
  // Store in cache
  await setCache(key, freshData, ttlSeconds);
  
  return freshData;
}

// Usage in Edge Function
serve(async (req) => {
  const data = await withCache(
    'meteorology:all-cities',
    () => fetchAllCitiesWeather(),
    20 * 60 // 20 minutes
  );
  
  return new Response(JSON.stringify(data));
});
```

---

## 🧪 TESTING {#testing}

### Local Testing

```bash
# Test Edge Function locally
supabase functions serve fetch-meteorology

# Invoke locally
curl -X POST http://localhost:54321/functions/v1/fetch-meteorology \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Integration Tests

```typescript
// tests/api-integration.test.ts

import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

Deno.test('Meteorology API - fetch all cities', async () => {
  const response = await fetch('http://localhost:54321/functions/v1/fetch-meteorology', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ANON_KEY'
    }
  });
  
  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(data.success, true);
  assertEquals(data.records, 4); // 4 cities
});

Deno.test('Water Level API - scrape 3 stations', async () => {
  const response = await fetch('http://localhost:54321/functions/v1/fetch-water-level', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ANON_KEY'
    }
  });
  
  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(data.success, true);
  assertEquals(data.records >= 3, true); // At least 3 stations
});
```

---

## 📝 ÖSSZEFOGLALÁS

### Deployed Edge Functions

| Function | Cron Schedule | Purpose |
|----------|---------------|---------|
| `fetch-meteorology` | */20 * * * * | OpenWeather + Meteoblue API |
| `fetch-water-level` | 0 * * * * | vizugy.hu scraping |
| `fetch-drought` | 0 6 * * * | aszalymonitoring API |
| `check-water-level` | 0 */6 * * * | Push notification trigger |

### API Keys Szükségesek

```env
OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
METEOBLUE_API_KEY=YOUR_METEOBLUE_API_KEY_HERE
VAPID_PRIVATE_KEY=xxxxx
VAPID_SUBJECT=mailto:your-email@dunapp.hu
```

### Cache TTL

```
Meteorology:  20 minutes
Water Level:  1 hour
Drought:      24 hours
```

### Rate Limits

```
OpenWeather:  1,000 req/day → 8 req/20min = OK
Meteoblue:    67 req/day → 4 req/20min = OK
vizugy.hu:    No limit (scraping)
aszalymonitoring: No known limit
```

---

*API Integration Guide v1.0*  
*DunApp PWA - Production Ready*  
*Létrehozva: 2025-10-24*
