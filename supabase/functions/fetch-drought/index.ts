/**
 * DunApp PWA - Fetch Drought Data Edge Function (PRODUCTION v3.0)
 *
 * PURPOSE:
 * - Fetches drought monitoring data from aszalymonitoring.vizugy.hu pattern endpoint
 * - Stores data for 5 locations in southern Hungary
 * - Called by cron job daily at 6:00 AM
 *
 * OFFICIAL API ENDPOINT:
 * - URL: https://aszalymonitoring.vizugy.hu/index.php?voa={UUID}&view=pattern&model={MODEL_UUID}
 * - Method: GET with AJAX header (X-Requested-With: XMLHttpRequest)
 * - Response: JSON with 7 datasets (temp, soil temp, soil moisture, precip, humidity, drought index, water deficit)
 * - This is the SAME endpoint the official website uses!
 *
 * ENVIRONMENT VARIABLES:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * CRON SCHEDULE: 0 6 * * * (daily at 6:00 AM)
 *
 * VERSION: 3.0 (Switched to pattern endpoint - includes water deficit!)
 * LAST UPDATED: 2025-11-04
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sanitizeError } from '../_shared/error-sanitizer.ts';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const API_BASE_URL = 'https://aszalymonitoring.vizugy.hu/index.php';
const FORECAST_MODEL_UUID = '2904392D-50A3-4DDC-A42E-ED338D78BA78'; // ECMWF model
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

// Dataset indexes in the pattern API response
const DATASET_INDEXES = {
  temperature: 0,         // Hőmérséklet °C
  soil_temperature: 1,    // Talajhőmérséklet °C (6 depths)
  soil_moisture: 2,       // Talajnedvesség V/V % (6 depths)
  precipitation: 3,       // Csapadék mm
  humidity: 4,            // Relatív páratartalom %
  drought_index: 5,       // Aszályindex (HDI)
  water_deficit: 6        // Vízhiány mm (35cm) - THIS IS WHAT WE NEED!
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

// Pattern API response structure
interface DataPoint {
  msec: number;
  value: string;
  date?: string;
}

interface Dataset {
  data: DataPoint[][];
  graphtitle: string;
  unit?: string;
  [key: string]: unknown;
}

interface PatternResponse {
  data: Dataset[];
  result: boolean;
  [key: string]: unknown;
}

interface DroughtDataRecord {
  drought_index: number | null;
  water_deficit_index: number | null;
  soil_moisture_10cm: number | null;
  soil_moisture_20cm: number | null;
  soil_moisture_30cm: number | null;
  soil_moisture_50cm: number | null;
  soil_moisture_70cm: number | null;
  soil_moisture_100cm: number | null;
  soil_temperature: number | null;
  air_temperature: number | null;
  precipitation: number | null;
  relative_humidity: number | null;
}

interface ProcessResult {
  location: string;
  status: 'success' | 'error';
  droughtIndex?: number | null;
  waterDeficit?: number | null;
  error?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get latest NON-NULL value from a dataset array
 * Returns null if no data available
 *
 * NOTE: Some datasets have future dates with null values,
 * so we need to iterate backwards to find the last valid measurement
 */
function getLatestValueFromDataset(dataset: Dataset | undefined, arrayIndex: number = 0): number | null {
  if (!dataset || !dataset.data || dataset.data.length === 0) {
    return null;
  }

  const dataArray = dataset.data[arrayIndex];
  if (!dataArray || dataArray.length === 0) {
    return null;
  }

  // Find the LAST NON-NULL value (iterate backwards)
  for (let i = dataArray.length - 1; i >= 0; i--) {
    const point = dataArray[i];
    if (point && point.value !== null && point.value !== undefined && point.value !== '') {
      const parsed = parseFloat(point.value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch pattern data from aszalymonitoring.vizugy.hu
 * This is the SAME endpoint the official website uses!
 */
async function fetchPatternData(locationUUID: string): Promise<PatternResponse> {
  const url = `${API_BASE_URL}?voa=${locationUUID}&view=pattern&model=${FORECAST_MODEL_UUID}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'DunApp PWA/1.0 (https://dunapp-pwa.netlify.app)',
          'X-Requested-With': 'XMLHttpRequest', // Required for JSON response!
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        const data = await response.json();
        return data as PatternResponse;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        console.warn(`  ⚠️  Attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed after max retries');
}

/**
 * Fetch drought data for a location from pattern API
 */
async function fetchDroughtData(location: DroughtLocation): Promise<DroughtDataRecord> {
  console.log(`  → Fetching pattern data from official API...`);
  const pattern = await fetchPatternData(location.uuid);

  if (!pattern.data || pattern.data.length < 7) {
    throw new Error(`Incomplete data: expected 7 datasets, got ${pattern.data?.length || 0}`);
  }

  const datasets = pattern.data;

  console.log(`  → Extracting values from ${datasets.length} datasets...`);

  // Extract all values from datasets
  const airTemp = getLatestValueFromDataset(datasets[DATASET_INDEXES.temperature]);
  const soilTemp = getLatestValueFromDataset(datasets[DATASET_INDEXES.soil_temperature], 0);

  // Soil moisture - 6 depths (10cm, 20cm, 30cm, 50cm, 70cm, 100cm)
  const sm10cm = getLatestValueFromDataset(datasets[DATASET_INDEXES.soil_moisture], 0);
  const sm20cm = getLatestValueFromDataset(datasets[DATASET_INDEXES.soil_moisture], 1);
  const sm30cm = getLatestValueFromDataset(datasets[DATASET_INDEXES.soil_moisture], 2);
  const sm50cm = getLatestValueFromDataset(datasets[DATASET_INDEXES.soil_moisture], 3);
  const sm70cm = getLatestValueFromDataset(datasets[DATASET_INDEXES.soil_moisture], 4);
  const sm100cm = getLatestValueFromDataset(datasets[DATASET_INDEXES.soil_moisture], 5);

  const precip = getLatestValueFromDataset(datasets[DATASET_INDEXES.precipitation]);
  const humidity = getLatestValueFromDataset(datasets[DATASET_INDEXES.humidity]);
  const droughtIndex = getLatestValueFromDataset(datasets[DATASET_INDEXES.drought_index]);

  // THE KEY VALUE WE WERE MISSING! Dataset 6 = Vízhiány mm (35cm depth)
  const waterDeficit = getLatestValueFromDataset(datasets[DATASET_INDEXES.water_deficit]);

  return {
    drought_index: droughtIndex,
    water_deficit_index: waterDeficit,  // NOW WE GET THE REAL VALUE!
    soil_moisture_10cm: sm10cm,
    soil_moisture_20cm: sm20cm,
    soil_moisture_30cm: sm30cm,
    soil_moisture_50cm: sm50cm,
    soil_moisture_70cm: sm70cm,
    soil_moisture_100cm: sm100cm,
    soil_temperature: soilTemp,
    air_temperature: airTemp,
    precipitation: precip,
    relative_humidity: humidity
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
    console.log('🏜️  Fetch Drought Data Edge Function v3.0 - Starting');
    console.log(`   Date: ${new Date().toISOString()}`);
    console.log(`   API: ${API_BASE_URL} (Pattern endpoint - includes vízhiány!)`);

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

        // Fetch drought data from pattern API
        const droughtData = await fetchDroughtData(location);

        console.log(`  ✓ Fetched data from pattern API`);
        console.log(`    HDI: ${droughtData.drought_index ?? 'N/A'}`);
        console.log(`    Vízhiány: ${droughtData.water_deficit_index ?? 'N/A'} mm`);
        console.log(`    Talajnedvesség (10cm): ${droughtData.soil_moisture_10cm ?? 'N/A'}%`);

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
          droughtIndex: droughtData.drought_index,
          waterDeficit: droughtData.water_deficit_index
        });

        console.log(`✅ Success: ${location.name}`);

      } catch (error) {
        failureCount++;
        results.push({
          location: location.name,
          status: 'error',
          error: sanitizeError(error, 'Failed to fetch drought data')
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
        version: '3.0',
        apiSource: 'Official aszalymonitoring.vizugy.hu Pattern Endpoint',
        endpoint: `${API_BASE_URL}?voa={UUID}&view=pattern&model={MODEL_UUID}`,
        timestamp: new Date().toISOString(),
        duration,
        summary: {
          total: DROUGHT_LOCATIONS.length,
          success: successCount,
          failed: failureCount
        },
        results,
        notes: [
          'Using pattern endpoint - the SAME endpoint the official website uses!',
          'Returns 7 datasets: temp, soil temp, soil moisture, precip, humidity, HDI, vízhiány',
          'Dataset 6 contains water deficit (vízhiány) in mm at 35cm depth',
          'Upgraded from api.php (which did not return vízhiány) to pattern endpoint (v3.0)',
          'All data now available including previously missing water deficit values'
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
        error: sanitizeError(error, 'Failed to fetch drought monitoring data'),
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
