/**
 * DunApp PWA - Fetch Drought Data Edge Function
 *
 * PURPOSE:
 * - Fetches drought monitoring data for 5 locations
 * - Fetches groundwater data for 15 wells
 * - Stores data in drought_data and groundwater_data tables
 * - Called by cron job daily at 6:00 AM
 *
 * TODO (Data Engineer):
 * 1. Implement aszalymonitoring.vizugy.hu API integration
 * 2. Implement vmservice.vizugy.hu scraping for groundwater wells
 * 3. Handle CSV parsing for groundwater data
 * 4. Add error handling and retry logic
 * 5. Cache responses appropriately
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

// Groundwater well codes
const GROUNDWATER_WELLS = [
  '4576', '1460', '1450', '662', '656',
  '912', '4481', '4479', '1426', '653',
  '1461', '448', '132042', '658', '660'
];

serve(async (req) => {
  try {
    console.log('🏜️  Fetch Drought Data Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // TODO: Implement actual drought and groundwater data fetching
    // For now, return placeholder response

    const droughtResults = DROUGHT_LOCATIONS.map(location => ({
      location: location.name,
      status: 'placeholder',
      message: 'Data Engineer: Implement aszalymonitoring.vizugy.hu API here',
      coordinates: { lat: location.lat, lon: location.lon }
    }));

    const groundwaterResults = GROUNDWATER_WELLS.map(wellCode => ({
      wellCode: wellCode,
      status: 'placeholder',
      message: 'Data Engineer: Implement vmservice.vizugy.hu scraping here'
    }));

    console.log('✅ Fetch Drought Data Edge Function - Completed (placeholder)');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        drought: droughtResults,
        groundwater: groundwaterResults,
        todo: [
          'Implement aszalymonitoring.vizugy.hu API calls for drought data',
          'Search for nearest station by settlement name',
          'Fetch HDI (drought index), soil moisture, water deficit',
          'Implement vmservice.vizugy.hu scraping for groundwater wells',
          'Parse CSV data from vmservice',
          'Store in drought_data table',
          'Store in groundwater_data table',
          'Add error handling and retry logic'
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
