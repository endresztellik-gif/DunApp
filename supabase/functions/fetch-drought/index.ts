/**
 * DunApp PWA - Fetch Drought Data Edge Function
 *
 * PURPOSE:
 * - Fetches drought monitoring data for 5 locations
 * - Fetches groundwater data for 15 wells (note: scraping required)
 * - Stores data in drought_data and groundwater_data tables
 * - Called by cron job daily at 6:00 AM
 *
 * IMPLEMENTATION:
 * - aszalymonitoring.vizugy.hu API integration for drought data
 * - Error handling and retry logic
 * - Last 60 days of data fetched
 *
 * NOTE: Groundwater well data from vmservice.vizugy.hu requires
 * complex automation (Puppeteer) which is not feasible in Edge Functions.
 * Recommend implementing a separate manual CSV upload feature or
 * using a dedicated scraping service.
 *
 * Environment variables needed:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Drought monitoring locations
const DROUGHT_LOCATIONS = [
  { name: 'Katymár', lat: 46.2167, lon: 19.5667 },
  { name: 'Dávod', lat: 46.4167, lon: 18.7667 },
  { name: 'Szederkény', lat: 46.3833, lon: 19.2500 },
  { name: 'Sükösd', lat: 46.2833, lon: 19.0000 },
  { name: 'Csávoly', lat: 46.4500, lon: 19.2833 }
];

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // ms

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
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fetchFn, retries - 1, delay * 2);
  }
}

/**
 * Search for nearest drought monitoring station by settlement name
 */
async function searchDroughtStation(settlement: string) {
  const url = `https://aszalymonitoring.vizugy.hu/api/search?settlement=${encodeURIComponent(settlement)}`;

  const response = await fetchWithRetry(() => fetch(url));
  const data = await response.json();

  if (!data.nearestStation) {
    throw new Error(`No station found near ${settlement}`);
  }

  return {
    stationId: data.nearestStation.id,
    stationName: data.nearestStation.name,
    distance: data.nearestStation.distance
  };
}

/**
 * Fetch drought monitoring data for a station
 */
async function fetchDroughtStationData(stationId: string) {
  // Fetch last 60 days of data
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const url = `https://aszalymonitoring.vizugy.hu/api/station/${stationId}/data?from=${startDate}&to=${endDate}`;

  const response = await fetchWithRetry(() => fetch(url));
  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No data returned for station ${stationId}`);
  }

  // Return the latest data point
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
 * Fetch drought data for a location
 */
async function fetchDroughtData(location: { name: string; lat: number; lon: number }) {
  try {
    console.log(`Searching for station near ${location.name}...`);

    // Search for nearest station
    const station = await searchDroughtStation(location.name);
    console.log(`Found station: ${station.stationName} (${station.distance}m away)`);

    // Fetch station data
    const data = await fetchDroughtStationData(station.stationId);
    console.log(`Fetched data for ${location.name}`);

    return {
      ...data,
      stationName: station.stationName,
      distance: station.distance
    };
  } catch (error) {
    console.error(`Failed to fetch drought data for ${location.name}:`, error.message);
    throw error;
  }
}

serve(async (req) => {
  try {
    console.log('🏜️  Fetch Drought Data Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Fetch drought monitoring data for each location
    for (const location of DROUGHT_LOCATIONS) {
      try {
        console.log(`Processing ${location.name}...`);

        // Fetch drought data
        const droughtData = await fetchDroughtData(location);

        // Get location_id from database
        const { data: locationData, error: locationError } = await supabase
          .from('drought_locations')
          .select('id')
          .eq('location_name', location.name)
          .single();

        if (locationError || !locationData) {
          throw new Error(`Location not found in database: ${location.name}`);
        }

        // Insert drought data into database
        const { error: insertError } = await supabase
          .from('drought_data')
          .insert({
            location_id: locationData.id,
            drought_index: droughtData.droughtIndex,
            water_deficit_index: droughtData.waterDeficitIndex,
            soil_moisture_10cm: droughtData.soilMoisture10cm,
            soil_moisture_20cm: droughtData.soilMoisture20cm,
            soil_moisture_30cm: droughtData.soilMoisture30cm,
            soil_moisture_50cm: droughtData.soilMoisture50cm,
            soil_moisture_70cm: droughtData.soilMoisture70cm,
            soil_moisture_100cm: droughtData.soilMoisture100cm,
            soil_temperature: droughtData.soilTemperature,
            air_temperature: droughtData.airTemperature,
            precipitation: droughtData.precipitation,
            relative_humidity: droughtData.relativeHumidity,
            timestamp: new Date().toISOString()
          });

        if (insertError) {
          throw insertError;
        }

        successCount++;
        results.push({
          location: location.name,
          status: 'success',
          station: droughtData.stationName,
          distance: droughtData.distance,
          droughtIndex: droughtData.droughtIndex
        });

        console.log(`✅ Success: ${location.name} (station: ${droughtData.stationName})`);
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

    console.log(`✅ Fetch Drought Data Edge Function - Completed: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          total: DROUGHT_LOCATIONS.length,
          success: successCount,
          failed: failureCount
        },
        results,
        notes: [
          'Groundwater well data requires manual CSV upload or external scraping service',
          'vmservice.vizugy.hu requires Puppeteer automation which is not feasible in Edge Functions',
          'Recommend implementing a separate CSV upload feature for groundwater data'
        ]
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Fetch Drought Data Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * IMPLEMENTATION GUIDE (for Data Engineer):
 *
 * PART 1: DROUGHT MONITORING DATA (aszalymonitoring.vizugy.hu)
 *
 * 1. Search for nearest station by settlement name:
 *    const searchUrl = `https://aszalymonitoring.vizugy.hu/api/search?settlement=${locationName}`;
 *    const searchResponse = await fetch(searchUrl);
 *    const searchData = await searchResponse.json();
 *    const stationId = searchData.nearestStation.id;
 *
 * 2. Fetch station data (last 60 days):
 *    const endDate = new Date().toISOString().split('T')[0];
 *    const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
 *    const dataUrl = `https://aszalymonitoring.vizugy.hu/api/station/${stationId}/data?from=${startDate}&to=${endDate}`;
 *    const dataResponse = await fetch(dataUrl);
 *    const data = await dataResponse.json();
 *
 * 3. Extract relevant fields:
 *    - HDI (Hungarian Drought Index)
 *    - HDIS (Water Deficit Index)
 *    - Soil moisture at 6 depths (10, 20, 30, 50, 70, 100 cm)
 *    - Soil temperature
 *    - Air temperature
 *    - Precipitation
 *    - Relative humidity
 *
 * 4. Get location_id from database:
 *    const { data: locationData } = await supabase
 *      .from('drought_locations')
 *      .select('id')
 *      .eq('location_name', locationName)
 *      .single();
 *
 * 5. Insert into drought_data table:
 *    const { error } = await supabase
 *      .from('drought_data')
 *      .insert({
 *        location_id: locationData.id,
 *        drought_index: data.HDI,
 *        water_deficit_index: data.HDIS,
 *        soil_moisture_10cm: data.soilMoisture_10cm,
 *        // ... other fields
 *      });
 *
 * PART 2: GROUNDWATER WELL DATA (vmservice.vizugy.hu)
 *
 * 1. This requires scraping/automation (Puppeteer or similar):
 *    - Navigate to https://vmservice.vizugy.hu/
 *    - Select "Talajvíz adatok"
 *    - Enter well code
 *    - Set date range (last 60 days)
 *    - Export CSV
 *
 * 2. Parse CSV data:
 *    - Columns: Date, Water Level (m), Water Level (mBf), Temperature (°C)
 *    - mBf = meters above Baltic Sea level
 *
 * 3. Get well_id from database:
 *    const { data: wellData } = await supabase
 *      .from('groundwater_wells')
 *      .select('id')
 *      .eq('well_code', wellCode)
 *      .single();
 *
 * 4. Insert into groundwater_data table:
 *    const { error } = await supabase
 *      .from('groundwater_data')
 *      .insert({
 *        well_id: wellData.id,
 *        water_level_meters: csvRow.waterLevel,
 *        water_level_masl: csvRow.waterLevelMasl,
 *        water_temperature: csvRow.temperature,
 *        timestamp: csvRow.date
 *      });
 *
 * ALTERNATIVE for vmservice (if automation is complex):
 * - Implement manual CSV upload endpoint
 * - User downloads CSV from vmservice
 * - User uploads CSV to DunApp
 * - Parse and store data
 */
