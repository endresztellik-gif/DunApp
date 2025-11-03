/**
 * DunApp PWA - Fetch Drought Data Edge Function (PRODUCTION v2.0)
 *
 * PURPOSE:
 * - Fetches drought monitoring data from aszalymonitoring.vizugy.hu API
 * - Stores data for 5 locations in southern Hungary
 * - Called by cron job daily at 6:00 AM
 *
 * OFFICIAL API DOCUMENTATION:
 * - URL: https://aszalymonitoring.vizugy.hu/api.php (POST only)
 * - Endpoints: getstations, getvariables, getmeas
 * - Response: HTML-encoded JSON
 * - Documentation: https://aszalymonitoring.vizugy.hu/makings/api.docx
 *
 * ENVIRONMENT VARIABLES:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * CRON SCHEDULE: 0 6 * * * (daily at 6:00 AM)
 *
 * VERSION: 2.0 (Upgraded to official API)
 * LAST UPDATED: 2025-11-03
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const API_URL = 'https://aszalymonitoring.vizugy.hu/api.php';
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 20000; // 20 seconds (slow server)

// Drought monitoring locations with station UUIDs
const DROUGHT_LOCATIONS = [
  {
    name: 'Katymár',
    lat: 46.2167,
    lon: 19.5667,
    county: 'Bács-Kiskun',
    uuid: 'F5D851F8-27B9-4C70-96C2-CD6906F91D5B'
  },
  {
    name: 'Dávod',
    lat: 46.4167,
    lon: 18.7667,
    county: 'Tolna',
    uuid: 'E07DCC61-B817-4BFF-AB8C-3D4BB35EB7E1'
  },
  {
    name: 'Szederkény',
    lat: 46.3833,
    lon: 19.2500,
    county: 'Bács-Kiskun',
    uuid: 'BAEE61BE-51FA-41BC-AFAF-6AD99E2598AE'
  },
  {
    name: 'Sükösd',
    lat: 46.2833,
    lon: 19.0000,
    county: 'Bács-Kiskun',
    uuid: 'EC63ACE6-990E-40BD-BEE7-CC8581F908B8'
  },
  {
    name: 'Csávoly',
    lat: 46.4500,
    lon: 19.2833,
    county: 'Bács-Kiskun',
    uuid: '16FFA799-C5E4-42EE-B08F-FA51E8720815'
  }
];

// Parameter IDs (varid) from getvariables API
const PARAM_IDS = {
  drought_index: 16,          // Aszályindex (HDI) - daily, computed
  water_deficit_35cm: 17,     // Vízhiány 35 cm - daily, computed
  water_deficit_80cm: 18,     // Vízhiány 80 cm - daily, computed
  soil_moisture_10cm: 8,      // Talajnedvesség 10 cm - hourly, measured
  soil_moisture_20cm: 9,      // Talajnedvesség 20 cm - hourly, measured
  soil_moisture_30cm: 10,     // Talajnedvesség 30 cm - hourly, measured
  soil_moisture_45cm: 11,     // Talajnedvesség 45 cm (not 50)
  soil_moisture_60cm: 12,     // Talajnedvesség 60 cm (not 70)
  soil_moisture_75cm: 13,     // Talajnedvesség 75 cm (not 100)
  air_temperature: 1,         // Levegőhőmérséklet - hourly, measured
  soil_temperature_10cm: 2,   // Talajhőmérséklet 10 cm - hourly, measured
  humidity: 14,               // Relatív páratartalom - hourly, measured
  precipitation: 15           // Csapadek60 - hourly, measured
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DroughtLocation {
  name: string;
  lat: number;
  lon: number;
  county: string;
  uuid: string;
}

interface Measurement {
  value: string | null;
  date: string;
}

interface DroughtDataRecord {
  drought_index: number | null;
  water_deficit_index: number | null;
  soil_moisture_10cm: number | null;
  soil_moisture_20cm: number | null;
  soil_moisture_30cm: number | null;
  soil_moisture_50cm: number | null;  // Map from 45cm
  soil_moisture_70cm: number | null;  // Map from 60cm
  soil_moisture_100cm: number | null; // Map from 75cm
  soil_temperature: number | null;
  air_temperature: number | null;
  precipitation: number | null;
  relative_humidity: number | null;
}

interface ProcessResult {
  location: string;
  status: 'success' | 'error';
  droughtIndex?: number | null;
  error?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Decode HTML entities (equivalent to Python's html.unescape())
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };

  return text.replace(/&[a-z]+;|&#\d+;/g, (match) => {
    return entities[match] || match;
  });
}

/**
 * Get date range (today and N days back)
 */
function getDateRange(daysBack: number): { fromDate: string; toDate: string } {
  const today = new Date();
  const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  return {
    fromDate: from.toISOString().split('T')[0],
    toDate: today.toISOString().split('T')[0]
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch measurements from aszalymonitoring.vizugy.hu API
 *
 * API expects POST request with form data:
 * - view: 'getmeas'
 * - statid: station UUID
 * - varid: parameter ID
 * - fromdate: start date (YYYY-MM-DD)
 * - todate: end date (YYYY-MM-DD)
 *
 * Returns: HTML-encoded JSON with structure {"entries": [[{value, date}, ...]]}
 */
async function fetchMeasurementsFromApi(
  statid: string,
  varid: number,
  daysBack: number = 7
): Promise<Measurement[] | null> {
  const { fromDate, toDate } = getDateRange(daysBack);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const formData = new URLSearchParams({
        view: 'getmeas',
        statid: statid,
        varid: String(varid),
        fromdate: fromDate,
        todate: toDate
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'DunApp PWA/1.0 (https://dunapp-pwa.netlify.app)'
        },
        body: formData.toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        const text = await response.text();

        // Decode HTML entities
        const decoded = decodeHtmlEntities(text);

        // Parse JSON
        const data = JSON.parse(decoded);

        // API returns: {"entries": [[{value, date}, ...]]}
        const entries = data.entries || [];
        if (Array.isArray(entries) && entries.length > 0 && Array.isArray(entries[0])) {
          return entries[0]; // Return the measurements array
        }

        return null; // No data
      }

      return null;

    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        console.warn(`  ⚠️  Attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      return null; // Give up after retries
    }
  }

  return null;
}

/**
 * Get most recent value from measurements array
 */
function getLatestValue(measurements: Measurement[] | null): number | null {
  if (!measurements || measurements.length === 0) {
    return null;
  }

  const latest = measurements[measurements.length - 1];
  const value = latest?.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Fetch drought data for a location from official API
 */
async function fetchDroughtData(location: DroughtLocation): Promise<DroughtDataRecord> {
  const statid = location.uuid;

  console.log(`  → Fetching HDI (drought index)...`);
  const hdiData = await fetchMeasurementsFromApi(statid, PARAM_IDS.drought_index, 3);
  const droughtIndex = getLatestValue(hdiData);

  console.log(`  → Fetching water deficit...`);
  const wdData = await fetchMeasurementsFromApi(statid, PARAM_IDS.water_deficit_35cm, 3);
  const waterDeficit = getLatestValue(wdData);

  console.log(`  → Fetching soil moisture (6 depths)...`);
  const sm10Data = await fetchMeasurementsFromApi(statid, PARAM_IDS.soil_moisture_10cm, 1);
  const sm20Data = await fetchMeasurementsFromApi(statid, PARAM_IDS.soil_moisture_20cm, 1);
  const sm30Data = await fetchMeasurementsFromApi(statid, PARAM_IDS.soil_moisture_30cm, 1);
  const sm45Data = await fetchMeasurementsFromApi(statid, PARAM_IDS.soil_moisture_45cm, 1);
  const sm60Data = await fetchMeasurementsFromApi(statid, PARAM_IDS.soil_moisture_60cm, 1);
  const sm75Data = await fetchMeasurementsFromApi(statid, PARAM_IDS.soil_moisture_75cm, 1);

  console.log(`  → Fetching temperature & humidity...`);
  const airTempData = await fetchMeasurementsFromApi(statid, PARAM_IDS.air_temperature, 1);
  const soilTempData = await fetchMeasurementsFromApi(statid, PARAM_IDS.soil_temperature_10cm, 1);
  const humidityData = await fetchMeasurementsFromApi(statid, PARAM_IDS.humidity, 1);
  const precipData = await fetchMeasurementsFromApi(statid, PARAM_IDS.precipitation, 1);

  return {
    drought_index: droughtIndex,
    water_deficit_index: waterDeficit,
    soil_moisture_10cm: getLatestValue(sm10Data),
    soil_moisture_20cm: getLatestValue(sm20Data),
    soil_moisture_30cm: getLatestValue(sm30Data),
    soil_moisture_50cm: getLatestValue(sm45Data),  // Map 45cm → 50cm
    soil_moisture_70cm: getLatestValue(sm60Data),  // Map 60cm → 70cm
    soil_moisture_100cm: getLatestValue(sm75Data), // Map 75cm → 100cm
    soil_temperature: getLatestValue(soilTempData),
    air_temperature: getLatestValue(airTempData),
    precipitation: getLatestValue(precipData),
    relative_humidity: getLatestValue(humidityData)
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
      drought_index: data.drought_index,
      water_deficit_index: data.water_deficit_index,
      soil_moisture_10cm: data.soil_moisture_10cm,
      soil_moisture_20cm: data.soil_moisture_20cm,
      soil_moisture_30cm: data.soil_moisture_30cm,
      soil_moisture_50cm: data.soil_moisture_50cm,
      soil_moisture_70cm: data.soil_moisture_70cm,
      soil_moisture_100cm: data.soil_moisture_100cm,
      soil_temperature: data.soil_temperature,
      air_temperature: data.air_temperature,
      precipitation: data.precipitation,
      relative_humidity: data.relative_humidity,
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
    console.log('🏜️  Fetch Drought Data Edge Function v2.0 - Starting');
    console.log(`   Date: ${new Date().toISOString()}`);
    console.log(`   API: ${API_URL} (Official aszalymonitoring.vizugy.hu API)`);

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
        console.log(`   Station UUID: ${location.uuid}`);

        // Fetch drought data from official API
        const droughtData = await fetchDroughtData(location);

        console.log(`  ✓ Fetched data from API`);
        console.log(`    HDI: ${droughtData.drought_index ?? 'N/A'}`);
        console.log(`    Soil Moisture (10cm): ${droughtData.soil_moisture_10cm ?? 'N/A'}%`);

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
          droughtIndex: droughtData.drought_index
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
    console.log(`   Duration: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
    console.log(`${'='.repeat(60)}\n`);

    return new Response(
      JSON.stringify({
        success: true,
        version: '2.0',
        apiSource: 'Official aszalymonitoring.vizugy.hu REST API',
        timestamp: new Date().toISOString(),
        duration,
        summary: {
          total: DROUGHT_LOCATIONS.length,
          success: successCount,
          failed: failureCount
        },
        results,
        notes: [
          'Using official API documented at https://aszalymonitoring.vizugy.hu/makings/api.docx',
          'API endpoints: getstations, getvariables, getmeas',
          'Upgraded from web scraping to real API (v2.0)',
          'Groundwater well data (15 wells) requires separate implementation'
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
