/**
 * DunApp PWA - Fetch Drought Data Edge Function (PRODUCTION)
 *
 * PURPOSE:
 * - Fetches drought monitoring data from aszalymonitoring.vizugy.hu API
 * - Stores data for 5 locations in southern Hungary
 * - Called by cron job daily at 6:00 AM
 *
 * API ENDPOINTS:
 * 1. Search: https://aszalymonitoring.vizugy.hu/api/search?settlement={name}
 * 2. Data: https://aszalymonitoring.vizugy.hu/api/station/{id}/data?from={date}&to={date}
 *
 * ENVIRONMENT VARIABLES:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * CRON SCHEDULE: 0 6 * * * (daily at 6:00 AM)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // ms
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Drought monitoring locations (from mockData.ts)
const DROUGHT_LOCATIONS = [
  { name: 'Katymár', lat: 46.2167, lon: 19.5667, county: 'Bács-Kiskun' },
  { name: 'Dávod', lat: 46.4167, lon: 18.7667, county: 'Tolna' },
  { name: 'Szederkény', lat: 46.3833, lon: 19.2500, county: 'Bács-Kiskun' },
  { name: 'Sükösd', lat: 46.2833, lon: 19.0000, county: 'Bács-Kiskun' },
  { name: 'Csávoly', lat: 46.4500, lon: 19.2833, county: 'Bács-Kiskun' }
];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DroughtLocation {
  name: string;
  lat: number;
  lon: number;
  county: string;
}

interface NearestStation {
  stationId: string;
  stationName: string;
  distance: number;
}

interface DroughtDataRecord {
  date: string;
  droughtIndex: number | null;
  waterDeficitIndex: number | null;
  soilMoisture10cm: number | null;
  soilMoisture20cm: number | null;
  soilMoisture30cm: number | null;
  soilMoisture50cm: number | null;
  soilMoisture70cm: number | null;
  soilMoisture100cm: number | null;
  soilTemperature: number | null;
  airTemperature: number | null;
  precipitation: number | null;
  relativeHumidity: number | null;
}

interface ProcessResult {
  location: string;
  status: 'success' | 'error';
  station?: string;
  distance?: number;
  droughtIndex?: number | null;
  error?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch with retry logic (exponential backoff)
 */
async function fetchWithRetry(
  fetchFn: () => Promise<Response>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<Response> {
  try {
    const response = await fetchFn();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    console.warn(`Fetch failed, retrying in ${delay}ms... (${retries} retries left)`);
    console.warn(`Error: ${error.message}`);

    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fetchFn, retries - 1, delay * 2);
  }
}

/**
 * Get date range (last 60 days)
 */
function getDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Search for nearest drought monitoring station by settlement name
 *
 * API: https://aszalymonitoring.vizugy.hu/api/search?settlement={name}
 */
async function searchDroughtStation(settlement: string): Promise<NearestStation> {
  const url = `https://aszalymonitoring.vizugy.hu/api/search?settlement=${encodeURIComponent(settlement)}`;

  console.log(`  → Searching for station near ${settlement}...`);

  const response = await fetchWithRetry(() => fetchWithTimeout(url));
  const data = await response.json();

  if (!data.nearestStation) {
    throw new Error(`No station found near ${settlement}`);
  }

  return {
    stationId: data.nearestStation.id,
    stationName: data.nearestStation.name,
    distance: data.nearestStation.distance || 0
  };
}

/**
 * Fetch drought monitoring data for a station (last 60 days)
 *
 * API: https://aszalymonitoring.vizugy.hu/api/station/{id}/data?from={date}&to={date}
 */
async function fetchDroughtStationData(stationId: string): Promise<DroughtDataRecord> {
  const { startDate, endDate } = getDateRange();
  const url = `https://aszalymonitoring.vizugy.hu/api/station/${stationId}/data?from=${startDate}&to=${endDate}`;

  console.log(`  → Fetching data for station ${stationId}...`);

  const response = await fetchWithRetry(() => fetchWithTimeout(url));
  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    console.warn(`  ⚠️  No data returned for station ${stationId}`);
    // Return null values instead of throwing
    return {
      date: new Date().toISOString().split('T')[0],
      droughtIndex: null,
      waterDeficitIndex: null,
      soilMoisture10cm: null,
      soilMoisture20cm: null,
      soilMoisture30cm: null,
      soilMoisture50cm: null,
      soilMoisture70cm: null,
      soilMoisture100cm: null,
      soilTemperature: null,
      airTemperature: null,
      precipitation: null,
      relativeHumidity: null
    };
  }

  // Get the latest data point (last element)
  const latest = data[data.length - 1];

  return {
    date: latest.date,
    droughtIndex: latest.HDI ?? null,
    waterDeficitIndex: latest.HDIS ?? null,
    soilMoisture10cm: latest.soilMoisture_10cm ?? null,
    soilMoisture20cm: latest.soilMoisture_20cm ?? null,
    soilMoisture30cm: latest.soilMoisture_30cm ?? null,
    soilMoisture50cm: latest.soilMoisture_50cm ?? null,
    soilMoisture70cm: latest.soilMoisture_70cm ?? null,
    soilMoisture100cm: latest.soilMoisture_100cm ?? null,
    soilTemperature: latest.soilTemp ?? null,
    airTemperature: latest.airTemp ?? null,
    precipitation: latest.precipitation ?? null,
    relativeHumidity: latest.relativeHumidity ?? null
  };
}

/**
 * Fetch drought data for a location (search + data fetch)
 */
async function fetchDroughtData(location: DroughtLocation): Promise<DroughtDataRecord & { stationName: string; distance: number }> {
  // Search for nearest station
  const station = await searchDroughtStation(location.name);
  console.log(`  ✓ Found station: ${station.stationName} (${station.distance}m away)`);

  // Fetch station data
  const data = await fetchDroughtStationData(station.stationId);
  console.log(`  ✓ Fetched data for ${location.name}`);

  return {
    ...data,
    stationName: station.stationName,
    distance: station.distance
  };
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

/**
 * Get location_id from database by location name
 */
async function getLocationId(supabase: any, locationName: string): Promise<string> {
  const { data, error } = await supabase
    .from('drought_locations')
    .select('id')
    .eq('location_name', locationName)
    .single();

  if (error || !data) {
    throw new Error(`Location not found in database: ${locationName}`);
  }

  return data.id;
}

/**
 * Insert drought data into database
 */
async function insertDroughtData(
  supabase: any,
  locationId: string,
  data: DroughtDataRecord
): Promise<void> {
  const { error } = await supabase
    .from('drought_data')
    .insert({
      location_id: locationId,
      drought_index: data.droughtIndex,
      water_deficit_index: data.waterDeficitIndex,
      soil_moisture_10cm: data.soilMoisture10cm,
      soil_moisture_20cm: data.soilMoisture20cm,
      soil_moisture_30cm: data.soilMoisture30cm,
      soil_moisture_50cm: data.soilMoisture50cm,
      soil_moisture_70cm: data.soilMoisture70cm,
      soil_moisture_100cm: data.soilMoisture100cm,
      soil_temperature: data.soilTemperature,
      air_temperature: data.airTemperature,
      precipitation: data.precipitation,
      relative_humidity: data.relativeHumidity,
      timestamp: new Date().toISOString()
    });

  if (error) {
    throw error;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  const startTime = Date.now();

  try {
    console.log('🏜️  Fetch Drought Data Edge Function - Starting');
    console.log(`   Date: ${new Date().toISOString()}`);

    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results: ProcessResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each drought monitoring location
    for (const location of DROUGHT_LOCATIONS) {
      try {
        console.log(`\n📍 Processing ${location.name} (${location.county})...`);

        // Fetch drought data from API
        const droughtData = await fetchDroughtData(location);

        // Get location_id from database
        const locationId = await getLocationId(supabase, location.name);
        console.log(`  ✓ Found location in database (ID: ${locationId.substring(0, 8)}...)`);

        // Insert drought data
        await insertDroughtData(supabase, locationId, droughtData);
        console.log(`  ✓ Inserted drought data into database`);

        successCount++;
        results.push({
          location: location.name,
          status: 'success',
          station: droughtData.stationName,
          distance: droughtData.distance,
          droughtIndex: droughtData.droughtIndex
        });

        console.log(`✅ Success: ${location.name}`);

      } catch (error) {
        failureCount++;
        results.push({
          location: location.name,
          status: 'error',
          error: error.message
        });

        console.error(`❌ Error for ${location.name}:`, error.message);
      }
    }

    const duration = Date.now() - startTime;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Fetch Drought Data Edge Function - Completed`);
    console.log(`   Success: ${successCount}/${DROUGHT_LOCATIONS.length}`);
    console.log(`   Failed: ${failureCount}/${DROUGHT_LOCATIONS.length}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`${'='.repeat(60)}\n`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        duration,
        summary: {
          total: DROUGHT_LOCATIONS.length,
          success: successCount,
          failed: failureCount
        },
        results,
        notes: [
          'Groundwater well data (15 wells) requires manual CSV upload or external scraping service',
          'vmservice.vizugy.hu requires browser automation which is not feasible in Edge Functions',
          'See IMPLEMENTATION_PLAN.md for Phase 2 groundwater implementation options'
        ]
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ Fetch Drought Data Error:', error);
    console.error('   Duration:', duration, 'ms');

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
