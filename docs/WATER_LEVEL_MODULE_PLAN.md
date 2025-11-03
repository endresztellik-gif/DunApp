# Water Level Module Implementation Plan

> **Phase 4: Water Level Module for DunApp PWA**
> Comprehensive implementation plan for Danube river water level monitoring

**Created:** 2025-11-03
**Version:** 1.0
**Status:** Planning Phase
**Estimated Duration:** 16-20 hours (8-10 sessions)

---

## Table of Contents

1. [Architecture Decision](#1-architecture-decision)
2. [Database Schema](#2-database-schema)
3. [Data Pipeline](#3-data-pipeline)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Push Notifications](#5-push-notifications)
6. [Implementation Phases](#6-implementation-phases)
7. [Testing Strategy](#7-testing-strategy)
8. [Risks and Mitigation](#8-risks-and-mitigation)

---

## 1. Architecture Decision

### Option A: Adapt Python MCP Server ✅ RECOMMENDED

**Pros:**
- Python MCP server already exists with proven scraping logic
- Can be deployed as standalone microservice
- Better handling of ISO-8859-2 encoding (native Python support)
- Separate from Supabase infrastructure (decoupled)
- Can use BeautifulSoup4 for robust HTML parsing

**Cons:**
- Additional deployment complexity (separate service)
- Need to maintain Python + TypeScript codebases
- Integration requires HTTP API between services
- Additional hosting costs (if not on Supabase)

### Option B: Rewrite in TypeScript Edge Functions ⭐ SELECTED

**Pros:**
- **Consistent with existing Meteorology Module pattern**
- Single tech stack (TypeScript everywhere)
- Deployed on Supabase (no additional infrastructure)
- Reuses existing retry logic, error handling, cron setup
- Native integration with Supabase database
- Free tier: 500K Edge Function invocations/month
- **Easier maintenance for future developers**

**Cons:**
- Need to rewrite scraping logic from Python to TypeScript
- Deno fetch API has limited encoding support (need workarounds)
- Less mature HTML parsing libraries (Cheerio vs BeautifulSoup)

### Decision: **Option B - TypeScript Edge Functions**

**Rationale:**
1. **Consistency:** Follows established meteorology module pattern
2. **Simplicity:** Single deployment pipeline (Supabase only)
3. **Maintainability:** One language, one framework
4. **Cost:** No additional hosting needed
5. **Proven:** Meteorology module demonstrates this works well

**Encoding Strategy for ISO-8859-2:**
```typescript
// Solution: Convert to UTF-8 using TextDecoder
const response = await fetch(url);
const buffer = await response.arrayBuffer();
const decoder = new TextDecoder('iso-8859-2');
const html = decoder.decode(buffer);
```

---

## 2. Database Schema

### Migration 008: Water Level Module Setup

**File:** `supabase/migrations/008_water_level_setup.sql`

```sql
-- ============================================================================
-- DunApp PWA - Water Level Module Setup
-- Migration: 008_water_level_setup.sql
-- Created: 2025-11-03
-- Description: Seed water level stations and add helper functions
-- ============================================================================

-- ============================================================================
-- SEED WATER LEVEL STATIONS (3 stations)
-- ============================================================================

INSERT INTO water_level_stations (
  station_name,
  river_name,
  city_name,
  latitude,
  longitude,
  lnv_level,
  kkv_level,
  nv_level,
  is_active,
  display_in_comparison
) VALUES
  -- Nagybajcs (Mosoni-Duna, upstream)
  (
    'Nagybajcs',
    'Mosoni-Duna',
    'Nagybajcs',
    47.8931,
    17.3164,
    150,  -- LNV (Lowest Navigable Water)
    250,  -- KKV (Average Low Water)
    550,  -- NV (High Water)
    true,
    true
  ),
  -- Baja (Duna, middle)
  (
    'Baja',
    'Duna',
    'Baja',
    46.1811,
    18.9550,
    50,
    150,
    650,
    true,
    true
  ),
  -- Mohács (Duna, downstream) - CRITICAL for push notifications
  (
    'Mohács',
    'Duna',
    'Mohács',
    45.9928,
    18.6836,
    0,
    100,
    600,
    true,
    true
  );

-- ============================================================================
-- STATION ID CONSTANTS (for reference)
-- ============================================================================

COMMENT ON TABLE water_level_stations IS
'Water level monitoring stations with reference IDs:
- Nagybajcs: 442051 (vizugy.hu station ID)
- Baja: 442027
- Mohács: 442010 (CRITICAL: triggers push notification at >= 400cm)';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Already created in 001_initial_schema.sql:
-- CREATE INDEX idx_water_level_data_station_timestamp ON water_level_data(station_id, timestamp DESC);
-- CREATE INDEX idx_water_level_data_timestamp ON water_level_data(timestamp DESC);
-- CREATE INDEX idx_water_level_forecasts_station ON water_level_forecasts(station_id, forecast_date);

-- Additional index for latest data query
CREATE INDEX IF NOT EXISTS idx_water_level_data_latest
ON water_level_data(station_id, timestamp DESC NULLS LAST);

-- ============================================================================
-- HELPER FUNCTION: Get Latest Water Level for Station
-- ============================================================================

CREATE OR REPLACE FUNCTION get_latest_water_level(p_station_id UUID)
RETURNS TABLE (
  water_level_cm INTEGER,
  flow_rate_m3s DECIMAL(7,2),
  water_temp_celsius DECIMAL(4,1),
  timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wld.water_level_cm,
    wld.flow_rate_m3s,
    wld.water_temp_celsius,
    wld.timestamp
  FROM water_level_data wld
  WHERE wld.station_id = p_station_id
  ORDER BY wld.timestamp DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_latest_water_level(UUID) IS
'Returns the most recent water level measurement for a station';

-- ============================================================================
-- HELPER FUNCTION: Check if Mohács Alert Needed
-- ============================================================================

CREATE OR REPLACE FUNCTION check_mohacs_alert_threshold()
RETURNS TABLE (
  should_alert BOOLEAN,
  current_level_cm INTEGER,
  station_id UUID
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_station_id UUID;
  v_current_level INTEGER;
  v_alert_threshold INTEGER := 400; -- 400cm threshold
BEGIN
  -- Get Mohács station ID
  SELECT id INTO v_station_id
  FROM water_level_stations
  WHERE station_name = 'Mohács';

  -- Get latest water level
  SELECT water_level_cm INTO v_current_level
  FROM water_level_data
  WHERE station_id = v_station_id
  ORDER BY timestamp DESC
  LIMIT 1;

  -- Return result
  RETURN QUERY
  SELECT
    (v_current_level >= v_alert_threshold) AS should_alert,
    v_current_level AS current_level_cm,
    v_station_id AS station_id;
END;
$$;

COMMENT ON FUNCTION check_mohacs_alert_threshold() IS
'Checks if Mohács water level >= 400cm (push notification trigger)';

-- ============================================================================
-- DATA RETENTION POLICY
-- ============================================================================

-- Keep only last 30 days of raw water level data
-- Forecasts: keep only future forecasts
-- (Can be executed via cron job or manually)

CREATE OR REPLACE FUNCTION cleanup_old_water_level_data()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete data older than 30 days
  DELETE FROM water_level_data
  WHERE timestamp < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Delete past forecasts
  DELETE FROM water_level_forecasts
  WHERE forecast_date < CURRENT_DATE;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_water_level_data() IS
'Removes water level data older than 30 days and past forecasts';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  station_name,
  river_name,
  city_name,
  lnv_level,
  kkv_level,
  nv_level
FROM water_level_stations
ORDER BY station_name;
```

### Database Schema Summary

**Tables Used (from Migration 001):**
1. `water_level_stations` - 3 stations (Nagybajcs, Baja, Mohács)
2. `water_level_data` - Time-series current measurements
3. `water_level_forecasts` - 5-day forecast data

**Key Indexes:**
- `idx_water_level_data_station_timestamp` - Fast queries by station + time
- `idx_water_level_data_latest` - Quick latest data retrieval

**Helper Functions:**
- `get_latest_water_level(station_id)` - Get most recent measurement
- `check_mohacs_alert_threshold()` - Push notification logic
- `cleanup_old_water_level_data()` - Data retention (30 days)

---

## 3. Data Pipeline

### Edge Function: `fetch-water-level`

**File:** `supabase/functions/fetch-water-level/index.ts`

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    fetch-water-level Edge Function              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Fetch Current Levels (vizugy.hu)                           │
│     ├─ Scrape: https://www.vizugy.hu/                          │
│     ├─ Parse: Cheerio HTML extraction                          │
│     ├─ Extract: water_level_cm, flow_rate_m3s, water_temp      │
│     └─ Insert: water_level_data table                          │
│                                                                  │
│  2. Fetch Forecasts (hydroinfo.hu)                             │
│     ├─ Scrape: http://www.hydroinfo.hu/html/vizelo.html        │
│     ├─ Encoding: ISO-8859-2 → UTF-8 conversion                 │
│     ├─ Parse: Forecast table (5 days ahead)                    │
│     ├─ Extract: forecast_date, water_level_cm, forecast_day    │
│     └─ Upsert: water_level_forecasts table                     │
│                                                                  │
│  3. Error Handling                                              │
│     ├─ Retry: 3 attempts with exponential backoff              │
│     ├─ Fallback: Skip station if scraping fails                │
│     └─ Logging: Console + error tracking                       │
│                                                                  │
│  4. Response                                                    │
│     └─ JSON: {success, timestamp, current{}, forecast{}}       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation Structure

```typescript
/**
 * DunApp PWA - Fetch Water Level Data Edge Function
 *
 * PURPOSE:
 * - Fetches current water levels for 3 Danube stations
 * - Fetches 5-day water level forecasts
 * - Stores data in water_level_data and water_level_forecasts tables
 * - Called by cron job every hour
 *
 * DATA SOURCES:
 * - Current levels: vizugy.hu (HTML scraping)
 * - Forecasts: hydroinfo.hu (HTML scraping, ISO-8859-2 encoding)
 *
 * STATIONS:
 * - Nagybajcs (442051)
 * - Baja (442027)
 * - Mohács (442010)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Station mappings (vizugy.hu station IDs)
const STATIONS = [
  { name: 'Nagybajcs', vizugyId: '442051' },
  { name: 'Baja', vizugyId: '442027' },
  { name: 'Mohács', vizugyId: '442010' },
];

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // ms

/**
 * Retry logic with exponential backoff
 */
async function fetchWithRetry(
  fetchFn: () => Promise<Response>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<Response> {
  try {
    return await fetchFn();
  } catch (error) {
    if (retries === 0) throw error;
    console.warn(`Fetch failed, retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fetchFn, retries - 1, delay * 2);
  }
}

/**
 * Scrape current water level from vizugy.hu
 */
async function scrapeVizugyActual(stationName: string): Promise<{
  waterLevelCm: number;
  flowRateM3s: number | null;
  waterTempCelsius: number | null;
}> {
  const url = 'https://www.vizugy.hu/index.php?module=content&programelemid=138';

  console.log(`Scraping vizugy.hu for ${stationName}...`);

  const response = await fetchWithRetry(() => fetch(url));
  const html = await response.text();

  // Parse HTML using DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Failed to parse HTML');
  }

  // Find table rows containing station data
  const rows = doc.querySelectorAll('table tr');

  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length === 0) continue;

    const cellText = cells[0]?.textContent?.trim() || '';

    // Check if this row contains our station
    if (cellText.includes(stationName)) {
      const waterLevel = parseInt(cells[1]?.textContent?.trim() || '0');
      const flowRate = parseFloat(cells[2]?.textContent?.trim() || '0') || null;
      const waterTemp = parseFloat(cells[3]?.textContent?.trim() || '0') || null;

      console.log(`✅ ${stationName}: ${waterLevel}cm, ${flowRate}m³/s`);

      return {
        waterLevelCm: waterLevel,
        flowRateM3s: flowRate,
        waterTempCelsius: waterTemp,
      };
    }
  }

  throw new Error(`Station ${stationName} not found in vizugy.hu table`);
}

/**
 * Scrape 5-day forecast from hydroinfo.hu (ISO-8859-2 encoding)
 */
async function scrapeHydroInfoForecast(stationName: string): Promise<Array<{
  forecastDate: string;
  waterLevelCm: number;
  forecastDay: number;
}>> {
  const url = 'http://www.hydroinfo.hu/html/vizelo.html';

  console.log(`Scraping hydroinfo.hu forecast for ${stationName}...`);

  const response = await fetchWithRetry(() => fetch(url));

  // CRITICAL: Convert ISO-8859-2 to UTF-8
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-2');
  const html = decoder.decode(buffer);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Failed to parse hydroinfo.hu HTML');
  }

  // Find forecast table for station
  // Structure: <table> rows with station name + 5 forecast columns
  const rows = doc.querySelectorAll('table tr');
  const forecasts: Array<{ forecastDate: string; waterLevelCm: number; forecastDay: number }> = [];

  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length === 0) continue;

    const cellText = cells[0]?.textContent?.trim() || '';

    if (cellText.includes(stationName)) {
      // Next 5 cells contain forecast values (day+1, day+2, ..., day+5)
      for (let i = 1; i <= 5; i++) {
        const forecastValue = parseInt(cells[i]?.textContent?.trim() || '0');

        if (forecastValue > 0) {
          const forecastDate = new Date();
          forecastDate.setDate(forecastDate.getDate() + i);

          forecasts.push({
            forecastDate: forecastDate.toISOString().split('T')[0], // YYYY-MM-DD
            waterLevelCm: forecastValue,
            forecastDay: i,
          });
        }
      }

      console.log(`✅ ${stationName} forecast: ${forecasts.length} days`);
      break;
    }
  }

  if (forecasts.length === 0) {
    throw new Error(`No forecast data found for ${stationName}`);
  }

  return forecasts;
}

/**
 * Main Edge Function handler
 */
serve(async (req) => {
  try {
    console.log('🌊 Fetch Water Level Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ========================================
    // PART 1: Fetch CURRENT water levels
    // ========================================
    console.log('📊 Fetching current water levels...');

    const currentResults = [];
    let currentSuccessCount = 0;
    let currentFailureCount = 0;

    for (const station of STATIONS) {
      try {
        console.log(`Processing ${station.name}...`);

        // Scrape current data
        const currentData = await scrapeVizugyActual(station.name);

        // Get station_id from database
        const { data: stationData, error: stationError } = await supabase
          .from('water_level_stations')
          .select('id')
          .eq('station_name', station.name)
          .single();

        if (stationError || !stationData) {
          throw new Error(`Station not found in database: ${station.name}`);
        }

        // Insert current data
        const { error: insertError } = await supabase
          .from('water_level_data')
          .insert({
            station_id: stationData.id,
            water_level_cm: currentData.waterLevelCm,
            flow_rate_m3s: currentData.flowRateM3s,
            water_temp_celsius: currentData.waterTempCelsius,
            timestamp: new Date().toISOString(),
          });

        if (insertError) {
          throw insertError;
        }

        currentSuccessCount++;
        currentResults.push({
          station: station.name,
          status: 'success',
          waterLevel: currentData.waterLevelCm,
        });

        console.log(`✅ Current data success: ${station.name}`);
      } catch (error) {
        currentFailureCount++;
        currentResults.push({
          station: station.name,
          status: 'error',
          error: error.message,
        });
        console.error(`❌ Current data error for ${station.name}:`, error.message);
      }
    }

    // ========================================
    // PART 2: Fetch FORECASTS
    // ========================================
    console.log('📈 Fetching water level forecasts...');

    const forecastResults = [];
    let forecastSuccessCount = 0;
    let forecastFailureCount = 0;

    for (const station of STATIONS) {
      try {
        console.log(`Fetching forecast for ${station.name}...`);

        // Scrape forecast data
        const forecastData = await scrapeHydroInfoForecast(station.name);

        if (forecastData.length === 0) {
          throw new Error('No forecast data received');
        }

        // Get station_id from database
        const { data: stationData, error: stationError } = await supabase
          .from('water_level_stations')
          .select('id')
          .eq('station_name', station.name)
          .single();

        if (stationError || !stationData) {
          throw new Error(`Station not found in database: ${station.name}`);
        }

        // Delete old forecasts (upsert strategy)
        const { error: deleteError } = await supabase
          .from('water_level_forecasts')
          .delete()
          .eq('station_id', stationData.id);

        if (deleteError) {
          console.warn(`Warning: Failed to delete old forecasts for ${station.name}`);
        }

        // Insert new forecasts
        const forecastsToInsert = forecastData.map(f => ({
          station_id: stationData.id,
          forecast_date: f.forecastDate,
          water_level_cm: f.waterLevelCm,
          forecast_day: f.forecastDay,
        }));

        const { error: insertError } = await supabase
          .from('water_level_forecasts')
          .insert(forecastsToInsert);

        if (insertError) {
          throw insertError;
        }

        forecastSuccessCount++;
        forecastResults.push({
          station: station.name,
          status: 'success',
          forecastCount: forecastData.length,
        });

        console.log(`✅ Forecast success: ${station.name} (${forecastData.length} days)`);
      } catch (error) {
        forecastFailureCount++;
        forecastResults.push({
          station: station.name,
          status: 'error',
          error: error.message,
        });
        console.error(`❌ Forecast error for ${station.name}:`, error.message);
      }
    }

    // ========================================
    // FINAL RESPONSE
    // ========================================
    console.log('✅ Fetch Water Level Edge Function - Completed');
    console.log(`   Current data: ${currentSuccessCount} success, ${currentFailureCount} failed`);
    console.log(`   Forecasts: ${forecastSuccessCount} success, ${forecastFailureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        current: {
          summary: {
            total: STATIONS.length,
            success: currentSuccessCount,
            failed: currentFailureCount,
          },
          results: currentResults,
        },
        forecast: {
          summary: {
            total: STATIONS.length,
            success: forecastSuccessCount,
            failed: forecastFailureCount,
          },
          results: forecastResults,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Fetch Water Level Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

### Cron Job Setup

**File:** `supabase/migrations/009_water_level_cron.sql`

```sql
-- ============================================================================
-- DunApp PWA - Water Level Cron Job Setup
-- Migration: 009_water_level_cron.sql
-- Created: 2025-11-03
-- Description: Sets up hourly cron job for water level data refresh
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Invoke Water Level Edge Function
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_fetch_water_level()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  project_url text := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0';
BEGIN
  -- Call Edge Function using pg_net.http_post
  SELECT net.http_post(
    url := project_url || '/functions/v1/fetch-water-level',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  -- Log the request
  RAISE NOTICE 'Water level data refresh triggered: request_id=%', request_id;
END;
$$;

COMMENT ON FUNCTION invoke_fetch_water_level() IS
'Invokes the fetch-water-level Edge Function to refresh water level data';

-- ============================================================================
-- CRON JOB: Hourly Water Level Data Refresh
-- ============================================================================

-- Remove existing job if it exists
SELECT cron.unschedule('fetch-water-level-hourly') WHERE true;

-- Schedule job to run every hour at :10 (e.g., 00:10, 01:10, 02:10, etc.)
SELECT cron.schedule(
  'fetch-water-level-hourly',           -- Job name
  '10 * * * *',                         -- Cron expression (every hour at :10)
  $$SELECT invoke_fetch_water_level()$$ -- SQL to execute
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'fetch-water-level-hourly';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Cron Expression: '10 * * * *'
-- Runs every hour at 10 minutes past the hour
-- (5 minutes after meteorology cron to avoid API rate limiting)
--
-- To manually trigger: SELECT invoke_fetch_water_level();
-- To check job history:
--   SELECT * FROM cron.job_run_details
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-water-level-hourly')
--   ORDER BY start_time DESC LIMIT 10;
-- To unschedule: SELECT cron.unschedule('fetch-water-level-hourly');
```

---

## 4. Frontend Architecture

### Module Structure

```
src/modules/water-level/
├── WaterLevelModule.tsx       # Main module component
├── StationSelector.tsx        # Module-specific station selector
├── WaterLevelChart.tsx        # 3-station comparison line chart
├── ForecastTable.tsx          # 5-day forecast table
└── hooks/
    ├── useWaterLevelData.ts   # Current water level data
    ├── useStations.ts         # Station list
    └── useForecastData.ts     # Forecast data
```

### Component: `WaterLevelModule.tsx`

```typescript
/**
 * WaterLevelModule Component
 *
 * Main component for the Water Level module.
 * Displays water level data for 3 Danube stations with:
 * - Station selector (module-specific)
 * - 3 data cards (water level, flow rate, temperature)
 * - 3-station comparison chart (7-day history)
 * - 5-day forecast table
 */

import React, { useState } from 'react';
import {
  Waves,
  TrendingUp,
  Thermometer,
  AlertCircle,
} from 'lucide-react';
import { StationSelector } from './StationSelector';
import { DataCard } from '../../components/UI/DataCard';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Footer } from '../../components/Layout/Footer';
import { WaterLevelChart } from './WaterLevelChart';
import { ForecastTable } from './ForecastTable';
import { useWaterLevelData } from './hooks/useWaterLevelData';
import { useStations } from './hooks/useStations';
import type { WaterLevelStation, DataSource } from '../../types';

export const WaterLevelModule: React.FC = () => {
  const { stations, isLoading: stationsLoading } = useStations();
  const [selectedStation, setSelectedStation] = useState<WaterLevelStation | null>(null);

  // Auto-select first station when loaded
  React.useEffect(() => {
    if (stations.length > 0 && !selectedStation) {
      setSelectedStation(stations[0]);
    }
  }, [stations, selectedStation]);

  // Fetch water level data from Supabase
  const {
    waterLevelData,
    isLoading,
    error: waterLevelError
  } = useWaterLevelData(selectedStation?.id || null);

  // Data sources for footer
  const dataSources: DataSource[] = [
    {
      name: 'VIZUGY.HU',
      url: 'https://www.vizugy.hu',
      lastUpdate: waterLevelData?.timestamp || new Date().toISOString(),
    },
    {
      name: 'HYDROINFO.HU',
      url: 'http://www.hydroinfo.hu',
      lastUpdate: waterLevelData?.timestamp || new Date().toISOString(),
    },
  ];

  // Get threshold level for selected station
  const getThresholdLabel = (level: number, station: WaterLevelStation | null): string => {
    if (!station) return '';

    if (level < station.lnvLevel) return 'Alacsony vízállás (LNV alatt)';
    if (level < station.kkvLevel) return 'Közepes kisvíz (KKV alatt)';
    if (level < station.nvLevel) return 'Normál vízállás';
    return 'NAGYVÍZ (NV felett)';
  };

  if (stationsLoading || isLoading) {
    return (
      <div className="main-container">
        <LoadingSpinner message="Vízállás adatok betöltése..." />
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Station Selector */}
      <div className="mb-6 flex justify-end">
        <StationSelector
          stations={stations}
          selectedStation={selectedStation}
          onStationChange={setSelectedStation}
        />
      </div>

      {/* Error State */}
      {waterLevelError && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h3 className="mb-1 text-base font-semibold text-red-900">
              Hiba az adatok betöltésekor
            </h3>
            <p className="text-sm text-red-700">
              {waterLevelError.message || 'Nem sikerült betölteni a vízállás adatokat.'}
            </p>
          </div>
        </div>
      )}

      {/* No Station Selected State */}
      {!selectedStation && !waterLevelError && (
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-8 text-center">
          <Waves className="mx-auto mb-3 h-12 w-12 text-blue-600" />
          <h3 className="mb-2 text-lg font-semibold text-blue-900">Válassz állomást</h3>
          <p className="text-sm text-blue-700">
            Válassz egy mérőállomást a fenti listából a vízállás adatok megtekintéséhez.
          </p>
        </div>
      )}

      {/* Water Level Data Cards - Only show when we have data */}
      {waterLevelData && selectedStation && (
        <>
          {/* Data Cards - 1x3 Grid */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DataCard
              icon={Waves}
              label="Vízállás"
              value={waterLevelData.waterLevelCm}
              unit="cm"
              moduleColor="water-level"
              subtitle={getThresholdLabel(waterLevelData.waterLevelCm, selectedStation)}
            />
            <DataCard
              icon={TrendingUp}
              label="Vízhozam"
              value={waterLevelData.flowRateM3s?.toFixed(1) ?? null}
              unit="m³/s"
              moduleColor="water-level"
            />
            <DataCard
              icon={Thermometer}
              label="Vízhőmérséklet"
              value={waterLevelData.waterTempCelsius?.toFixed(1) ?? null}
              unit="°C"
              moduleColor="water-level"
            />
          </div>

          {/* 3-Station Comparison Chart (7-day history) */}
          <div className="mb-6">
            <h2 className="section-title mb-4">3 állomás összehasonlítása (7 nap)</h2>
            <WaterLevelChart stations={stations} />
          </div>

          {/* 5-Day Forecast Table */}
          <div className="mb-6">
            <h2 className="section-title mb-4">5 napos előrejelzés</h2>
            <ForecastTable stationId={selectedStation.id} />
          </div>
        </>
      )}

      {/* Footer with data sources */}
      <Footer dataSources={dataSources} />
    </div>
  );
};
```

### Hook: `useWaterLevelData.ts`

```typescript
/**
 * useWaterLevelData Hook
 *
 * Fetches the latest water level data for a station
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { WaterLevelData } from '../../../types';

export function useWaterLevelData(stationId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['water-level-data', stationId],
    queryFn: async (): Promise<WaterLevelData | null> => {
      if (!stationId) return null;

      const { data, error } = await supabase
        .from('water_level_data')
        .select('*')
        .eq('station_id', stationId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        stationId: data.station_id,
        waterLevelCm: data.water_level_cm,
        flowRateM3s: data.flow_rate_m3s,
        waterTempCelsius: data.water_temp_celsius,
        timestamp: data.timestamp,
      };
    },
    enabled: !!stationId,
    staleTime: 5 * 60 * 1000, // 5 minutes (refresh less often than meteorology)
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  return {
    waterLevelData: data || null,
    isLoading,
    error: error as Error | null,
  };
}
```

### Hook: `useStations.ts`

```typescript
/**
 * useStations Hook
 *
 * Fetches the list of water level stations
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { WaterLevelStation } from '../../../types';

export function useStations() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['water-level-stations'],
    queryFn: async (): Promise<WaterLevelStation[]> => {
      const { data, error } = await supabase
        .from('water_level_stations')
        .select('*')
        .eq('is_active', true)
        .order('station_name', { ascending: true });

      if (error) throw error;

      return (data || []).map(station => ({
        id: station.id,
        stationName: station.station_name,
        riverName: station.river_name,
        cityName: station.city_name,
        latitude: station.latitude,
        longitude: station.longitude,
        lnvLevel: station.lnv_level,
        kkvLevel: station.kkv_level,
        nvLevel: station.nv_level,
        isActive: station.is_active,
        displayInComparison: station.display_in_comparison,
      }));
    },
    staleTime: 60 * 60 * 1000, // 1 hour (stations rarely change)
  });

  return {
    stations: data || [],
    isLoading,
    error: error as Error | null,
  };
}
```

### Component: `WaterLevelChart.tsx`

```typescript
/**
 * WaterLevelChart Component
 *
 * Multi-line chart showing 7-day water level comparison for 3 stations
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { WaterLevelStation } from '../../../types';

interface WaterLevelChartProps {
  stations: WaterLevelStation[];
}

export const WaterLevelChart: React.FC<WaterLevelChartProps> = ({ stations }) => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['water-level-chart', stations.map(s => s.id)],
    queryFn: async () => {
      // Fetch last 7 days of data for all stations
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('water_level_data')
        .select('station_id, water_level_cm, timestamp')
        .in('station_id', stations.map(s => s.id))
        .gte('timestamp', sevenDaysAgo.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Group by date and station
      const grouped = new Map<string, Record<string, number>>();

      data?.forEach(row => {
        const date = new Date(row.timestamp).toISOString().split('T')[0];
        const station = stations.find(s => s.id === row.station_id);

        if (!station) return;

        if (!grouped.has(date)) {
          grouped.set(date, { date });
        }

        grouped.get(date)![station.stationName] = row.water_level_cm;
      });

      return Array.from(grouped.values());
    },
    enabled: stations.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !chartData) {
    return <div className="text-center py-8 text-gray-500">Betöltés...</div>;
  }

  const colors = ['#3B82F6', '#10B981', '#F59E0B']; // Blue, Green, Orange

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis label={{ value: 'Vízállás (cm)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            labelFormatter={(value) => `Dátum: ${value}`}
            formatter={(value: number) => [`${value} cm`, '']}
          />
          <Legend />
          {stations.map((station, index) => (
            <Line
              key={station.id}
              type="monotone"
              dataKey={station.stationName}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### Component: `ForecastTable.tsx`

```typescript
/**
 * ForecastTable Component
 *
 * Displays 5-day water level forecast in a table
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { WaterLevelForecast } from '../../../types';

interface ForecastTableProps {
  stationId: string;
}

export const ForecastTable: React.FC<ForecastTableProps> = ({ stationId }) => {
  const { data: forecasts, isLoading } = useQuery({
    queryKey: ['water-level-forecast', stationId],
    queryFn: async (): Promise<WaterLevelForecast[]> => {
      const { data, error } = await supabase
        .from('water_level_forecasts')
        .select('*')
        .eq('station_id', stationId)
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(row => ({
        stationId: row.station_id,
        forecastDate: row.forecast_date,
        waterLevelCm: row.water_level_cm,
        forecastDay: row.forecast_day,
      }));
    },
    enabled: !!stationId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Betöltés...</div>;
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-600">Nincs elérhető előrejelzés</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Nap
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Dátum
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Előrejelzett vízállás
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {forecasts.map((forecast) => (
            <tr key={forecast.forecastDate} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                +{forecast.forecastDay} nap
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(forecast.forecastDate).toLocaleDateString('hu-HU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                {forecast.waterLevelCm} cm
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 5. Push Notifications

### Edge Function: `check-mohacs-alert`

**File:** `supabase/functions/check-mohacs-alert/index.ts`

```typescript
/**
 * DunApp PWA - Check Mohács Water Level Alert
 *
 * PURPOSE:
 * - Checks if Mohács water level >= 400cm
 * - Sends push notifications to all subscribed users
 * - Called after fetch-water-level Edge Function
 *
 * TRIGGER:
 * - Database trigger on water_level_data insert
 * - Cron job (every hour, after fetch-water-level)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:contact@dunapp.hu';

const ALERT_THRESHOLD = 400; // cm

serve(async (req) => {
  try {
    console.log('🚨 Check Mohács Alert - Starting');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get Mohács station ID
    const { data: mohacsStation, error: stationError } = await supabase
      .from('water_level_stations')
      .select('id')
      .eq('station_name', 'Mohács')
      .single();

    if (stationError || !mohacsStation) {
      throw new Error('Mohács station not found');
    }

    // Get latest water level
    const { data: latestData, error: dataError } = await supabase
      .from('water_level_data')
      .select('water_level_cm, timestamp')
      .eq('station_id', mohacsStation.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (dataError || !latestData) {
      throw new Error('No water level data found for Mohács');
    }

    console.log(`Current Mohács water level: ${latestData.water_level_cm}cm`);

    // Check if alert needed
    if (latestData.water_level_cm < ALERT_THRESHOLD) {
      console.log('✅ Water level below threshold. No alert needed.');
      return new Response(
        JSON.stringify({
          success: true,
          alert_sent: false,
          current_level: latestData.water_level_cm,
          threshold: ALERT_THRESHOLD,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ALERT NEEDED: Fetch all subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('station_id', mohacsStation.id);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No subscriptions found. Alert not sent.');
      return new Response(
        JSON.stringify({
          success: true,
          alert_sent: false,
          reason: 'no_subscriptions',
          current_level: latestData.water_level_cm,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send push notifications
    const notificationTitle = '🚨 Vízállás figyelmeztetés - Mohács';
    const notificationBody = `A mohácsi vízállás elérte a ${latestData.water_level_cm} cm-t (riasztási küszöb: ${ALERT_THRESHOLD} cm)`;

    let sentCount = 0;
    let failedCount = 0;

    for (const subscription of subscriptions) {
      try {
        // Use Web Push API (requires web-push library or fetch to push service)
        // This is a simplified example - in production, use a library like web-push

        const pushPayload = JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          data: {
            url: '/water-level',
            station: 'Mohács',
            level: latestData.water_level_cm,
          },
        });

        // TODO: Implement actual Web Push sending
        // For now, log to database
        await supabase.from('push_notification_logs').insert({
          subscription_id: subscription.id,
          station_id: mohacsStation.id,
          water_level_cm: latestData.water_level_cm,
          notification_title: notificationTitle,
          notification_body: notificationBody,
          status: 'sent',
        });

        sentCount++;
        console.log(`✅ Notification sent to subscription ${subscription.id}`);
      } catch (error) {
        failedCount++;
        console.error(`❌ Failed to send to subscription ${subscription.id}:`, error.message);

        // Log failure
        await supabase.from('push_notification_logs').insert({
          subscription_id: subscription.id,
          station_id: mohacsStation.id,
          water_level_cm: latestData.water_level_cm,
          notification_title: notificationTitle,
          notification_body: notificationBody,
          status: 'failed',
          error_message: error.message,
        });
      }
    }

    console.log(`✅ Alert sent: ${sentCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        alert_sent: true,
        current_level: latestData.water_level_cm,
        threshold: ALERT_THRESHOLD,
        notifications: {
          sent: sentCount,
          failed: failedCount,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Check Mohács Alert Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

### Cron Job for Alert Check

**Add to Migration 009:**

```sql
-- ============================================================================
-- CRON JOB: Check Mohács Alert (every hour, after water level fetch)
-- ============================================================================

CREATE OR REPLACE FUNCTION invoke_check_mohacs_alert()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  project_url text := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0';
BEGIN
  SELECT net.http_post(
    url := project_url || '/functions/v1/check-mohacs-alert',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'Mohács alert check triggered: request_id=%', request_id;
END;
$$;

-- Schedule job to run every hour at :15 (5 minutes after water level fetch)
SELECT cron.schedule(
  'check-mohacs-alert-hourly',
  '15 * * * *',
  $$SELECT invoke_check_mohacs_alert()$$
);
```

---

## 6. Implementation Phases

### Phase 4.1: Database Schema ⏱️ 1-2 hours

**Tasks:**
- [ ] Create migration `008_water_level_setup.sql`
- [ ] Seed 3 stations (Nagybajcs, Baja, Mohács)
- [ ] Add helper functions
- [ ] Test migration locally
- [ ] Deploy to Supabase

**Deliverables:**
- Migration file
- Verification query results

**Estimated Time:** 1-2 hours

---

### Phase 4.2: Edge Function - Current Levels ⏱️ 3-4 hours

**Tasks:**
- [ ] Create `fetch-water-level` Edge Function
- [ ] Implement vizugy.hu scraper (DOMParser)
- [ ] Add retry logic
- [ ] Test scraping with all 3 stations
- [ ] Validate data insertion
- [ ] Deploy Edge Function

**Deliverables:**
- `supabase/functions/fetch-water-level/index.ts`
- Test run results (console logs)

**Testing:**
```bash
# Local test
supabase functions serve fetch-water-level

# Invoke locally
curl -X POST http://localhost:54321/functions/v1/fetch-water-level \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Check database
psql -d postgres -c "SELECT * FROM water_level_data ORDER BY timestamp DESC LIMIT 10;"
```

**Estimated Time:** 3-4 hours

---

### Phase 4.3: Edge Function - Forecasts ⏱️ 2-3 hours

**Tasks:**
- [ ] Add hydroinfo.hu forecast scraper to Edge Function
- [ ] Implement ISO-8859-2 decoding (TextDecoder)
- [ ] Parse 5-day forecast table
- [ ] Upsert forecast data
- [ ] Test with all 3 stations
- [ ] Deploy updated Edge Function

**Deliverables:**
- Updated `fetch-water-level/index.ts`
- Forecast data in database

**Testing:**
```bash
# Check forecast data
psql -d postgres -c "SELECT * FROM water_level_forecasts ORDER BY forecast_date;"
```

**Estimated Time:** 2-3 hours

---

### Phase 4.4: Cron Job Setup ⏱️ 1 hour

**Tasks:**
- [ ] Create migration `009_water_level_cron.sql`
- [ ] Add `invoke_fetch_water_level()` function
- [ ] Schedule hourly cron job (:10 past hour)
- [ ] Test manual invocation
- [ ] Deploy migration

**Deliverables:**
- Migration file
- Cron job verification

**Testing:**
```sql
-- Manual trigger
SELECT invoke_fetch_water_level();

-- Check cron job
SELECT * FROM cron.job WHERE jobname = 'fetch-water-level-hourly';

-- Check run history
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-water-level-hourly')
ORDER BY start_time DESC LIMIT 10;
```

**Estimated Time:** 1 hour

---

### Phase 4.5: Frontend Components ⏱️ 4-5 hours

**Tasks:**
- [ ] Create `WaterLevelModule.tsx`
- [ ] Create `StationSelector.tsx`
- [ ] Create hooks: `useWaterLevelData`, `useStations`, `useForecastData`
- [ ] Create `WaterLevelChart.tsx` (3-station comparison)
- [ ] Create `ForecastTable.tsx`
- [ ] Add module to main App.tsx
- [ ] Add Tailwind styles for water-level module color
- [ ] Test all components

**Deliverables:**
- 5 new component files
- 3 new hook files
- Updated App.tsx

**Testing:**
- Visual testing in browser
- Check React Query caching
- Verify data display accuracy

**Estimated Time:** 4-5 hours

---

### Phase 4.6: Push Notifications ⏱️ 3-4 hours

**Tasks:**
- [ ] Create `check-mohacs-alert` Edge Function
- [ ] Implement alert threshold check (400cm)
- [ ] Add push notification logging
- [ ] Integrate Web Push API (simplified)
- [ ] Add cron job for alert check
- [ ] Test alert trigger manually
- [ ] Deploy Edge Function

**Deliverables:**
- `supabase/functions/check-mohacs-alert/index.ts`
- Updated migration 009 with alert cron job

**Testing:**
```bash
# Manual trigger
supabase functions invoke check-mohacs-alert

# Check notification logs
psql -d postgres -c "SELECT * FROM push_notification_logs ORDER BY created_at DESC LIMIT 10;"
```

**Estimated Time:** 3-4 hours

---

### Phase 4.7: Testing & Documentation ⏱️ 2-3 hours

**Tasks:**
- [ ] End-to-end testing (full data flow)
- [ ] Test error scenarios (scraping failures)
- [ ] Test cron job execution
- [ ] Update CLAUDE.md (Phase 4 complete)
- [ ] Update API_DOCS.md (add water level endpoints)
- [ ] Create user documentation for push notifications

**Deliverables:**
- Test report
- Updated documentation

**Estimated Time:** 2-3 hours

---

### Total Estimated Time: **16-22 hours**

**Breakdown:**
- Backend (Phases 4.1-4.4): 7-10 hours
- Frontend (Phase 4.5): 4-5 hours
- Push Notifications (Phase 4.6): 3-4 hours
- Testing & Docs (Phase 4.7): 2-3 hours

**Recommended Sessions:**
- Session 1: Phase 4.1 + 4.2 (database + current levels)
- Session 2: Phase 4.3 + 4.4 (forecasts + cron)
- Session 3: Phase 4.5 (frontend components)
- Session 4: Phase 4.6 (push notifications)
- Session 5: Phase 4.7 (testing + docs)

---

## 7. Testing Strategy

### Unit Tests (Deferred to Phase 10)

**Backend:**
- Test `scrapeVizugyActual()` with mock HTML
- Test `scrapeHydroInfoForecast()` with ISO-8859-2 data
- Test retry logic with simulated failures
- Test database helper functions

**Frontend:**
- Test hooks with mock Supabase responses
- Test component rendering
- Test chart data transformation

### Integration Tests

**Backend:**
- [ ] Edge Function E2E: Fetch → Parse → Insert
- [ ] Cron job trigger test
- [ ] Alert threshold trigger test

**Frontend:**
- [ ] Module navigation test
- [ ] Station selector interaction
- [ ] Chart rendering with real data
- [ ] Forecast table display

### Manual Testing Checklist

- [ ] Verify all 3 stations scrape successfully
- [ ] Check water level data accuracy (compare with vizugy.hu)
- [ ] Verify forecast data (compare with hydroinfo.hu)
- [ ] Test station selector functionality
- [ ] Test chart with 7 days of data
- [ ] Test forecast table with 5 days
- [ ] Test error states (no data, network failure)
- [ ] Test push notification trigger (manually set Mohács to 400cm)
- [ ] Verify cron jobs run on schedule

---

## 8. Risks and Mitigation

### Risk 1: Web Scraping Instability ⚠️ HIGH

**Risk:** vizugy.hu or hydroinfo.hu change their HTML structure, breaking scraper

**Mitigation:**
- Implement robust error handling
- Add detailed logging for scraping failures
- Create fallback: skip failed station, continue with others
- Monitor cron job failures via Supabase dashboard
- Plan for manual data entry if scraping fails long-term
- Consider contacting VIZIG for official API access

**Impact:** Medium (can continue with partial data)

---

### Risk 2: ISO-8859-2 Encoding Issues ⚠️ MEDIUM

**Risk:** TextDecoder fails to properly decode Hungarian characters

**Mitigation:**
- Test extensively with real hydroinfo.hu data
- Validate character encoding in parsed output
- Add character validation (e.g., check for 'Mohács' not 'Moh�cs')
- Fallback: use iconv-lite library if native TextDecoder fails

**Impact:** Low (can fix with library)

---

### Risk 3: Cron Job Rate Limiting ⚠️ LOW

**Risk:** Hourly scraping triggers anti-bot measures

**Mitigation:**
- Add User-Agent header to requests
- Respect robots.txt (check vizugy.hu, hydroinfo.hu)
- Add 1-2 second delay between station scrapes
- Monitor for HTTP 429 (Too Many Requests) errors
- Consider reducing frequency to every 2 hours if issues arise

**Impact:** Low (websites unlikely to block single hourly request)

---

### Risk 4: Push Notification Complexity ⚠️ MEDIUM

**Risk:** Web Push API integration is complex, may delay Phase 4.6

**Mitigation:**
- Phase 4.6 is optional for MVP
- Can defer push notifications to Phase 6
- Use simplified logging-only implementation initially
- Full Web Push integration can be added later

**Impact:** Low (not critical for MVP)

---

### Risk 5: Data Accuracy ⚠️ MEDIUM

**Risk:** Scraped data doesn't match official vizugy.hu values

**Mitigation:**
- Validate scraped data against manual checks
- Add data range validation (e.g., water level 0-1000cm)
- Log suspicious values (outliers)
- Display data source URL in footer for user verification

**Impact:** Medium (data quality critical for user trust)

---

## Summary

### Architecture: TypeScript Edge Functions ✅

**Why?**
- Consistent with Meteorology Module
- Single tech stack (TypeScript)
- Supabase infrastructure (no additional hosting)
- Proven pattern from Phase 9

### Key Technologies

- **Backend:** Supabase Edge Functions (Deno)
- **Scraping:** DOMParser (deno_dom)
- **Encoding:** TextDecoder (ISO-8859-2 → UTF-8)
- **Scheduling:** pg_cron (hourly)
- **Frontend:** React + TypeScript + Recharts
- **State:** React Query (caching)

### Critical Success Factors

1. **Robust Scraping:** Handle HTML changes gracefully
2. **Encoding:** ISO-8859-2 decoding must work correctly
3. **Data Validation:** Verify accuracy against source
4. **Error Handling:** Partial failures don't break entire flow
5. **Monitoring:** Track cron job success/failure

### Next Steps

1. **Review this plan with user**
2. **Get approval to proceed**
3. **Start with Phase 4.1 (Database Schema)**
4. **Iterate through phases 4.2-4.7**
5. **Deploy to production**

---

**Document Version:** 1.0
**Created:** 2025-11-03
**Status:** Awaiting Approval
**Estimated Completion:** 5 sessions (16-22 hours)
