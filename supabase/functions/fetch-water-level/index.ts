/**
 * DunApp PWA - Fetch Water Level Data Edge Function
 *
 * PURPOSE:
 * - Scrapes current water level data for 3 stations (Baja, Mohács, Nagybajcs)
 * - Stores data in water_level_data table
 * - Called by cron job every hour
 *
 * IMPLEMENTATION:
 * - vizugy.hu scraping for actual water levels
 * - hydroinfo.hu scraping for forecasts (with ISO-8859-2 encoding)
 * - HTML parsing with DOMParser
 * - Retry logic with exponential backoff
 * - Error logging and handling
 *
 * Environment variables needed:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Stations to scrape
const STATIONS = [
  { name: 'Baja', hydroinfoCode: 'baja' },
  { name: 'Mohács', hydroinfoCode: 'mohacs' },
  { name: 'Nagybajcs', hydroinfoCode: 'nagybajcs' }
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
 * Scrape water level data from vizugy.hu
 */
async function scrapeVizugyActual() {
  const url = 'https://www.vizugy.hu/index.php?module=content&programelemid=138';

  const response = await fetchWithRetry(() => fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DunApp/1.0; +https://dunapp.hu)'
    }
  }));

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Failed to parse HTML from vizugy.hu');
  }

  const waterLevels: Record<string, number> = {};

  // Find all table rows
  const rows = doc.querySelectorAll('table tr');

  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length === 0) continue;

    const stationText = cells[0]?.textContent?.trim() || '';

    // Check if this row contains one of our stations
    for (const station of STATIONS) {
      if (stationText.includes(station.name)) {
        // Water level is typically in the last column
        const lastCell = cells[cells.length - 1];
        const waterLevelText = lastCell?.textContent?.trim() || '';
        const waterLevel = parseInt(waterLevelText);

        if (!isNaN(waterLevel)) {
          waterLevels[station.name] = waterLevel;
          console.log(`Scraped ${station.name}: ${waterLevel} cm`);
        }
        break;
      }
    }
  }

  return waterLevels;
}

/**
 * Scrape water level forecast from hydroinfo.hu
 */
async function scrapeHydroinfoForecast() {
  const url = 'http://www.hydroinfo.hu/Html/hidelo/duna.html';

  const response = await fetchWithRetry(() => fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DunApp/1.0; +https://dunapp.hu)'
    }
  }));

  // Handle ISO-8859-2 encoding
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-2');
  const html = decoder.decode(buffer);

  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Failed to parse HTML from hydroinfo.hu');
  }

  const forecasts: Record<string, Array<{ day: number; waterLevel: number; date: string }>> = {};

  // Find forecast table
  const tables = doc.querySelectorAll('table');

  for (const table of tables) {
    const rows = table.querySelectorAll('tr');

    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 6) continue; // Need at least station name + 5 days forecast

      const stationText = cells[0]?.textContent?.trim() || '';

      // Check if this row contains one of our stations
      for (const station of STATIONS) {
        if (stationText.includes(station.name)) {
          const stationForecasts = [];

          // Extract 5-day forecast (next 5 cells)
          for (let i = 1; i <= 5 && i < cells.length; i++) {
            const forecastText = cells[i]?.textContent?.trim() || '';
            const forecastLevel = parseInt(forecastText);

            if (!isNaN(forecastLevel)) {
              const forecastDate = new Date();
              forecastDate.setDate(forecastDate.getDate() + i);

              stationForecasts.push({
                day: i,
                waterLevel: forecastLevel,
                date: forecastDate.toISOString().split('T')[0]
              });
            }
          }

          if (stationForecasts.length > 0) {
            forecasts[station.name] = stationForecasts;
            console.log(`Scraped forecast for ${station.name}: ${stationForecasts.length} days`);
          }
          break;
        }
      }
    }
  }

  return forecasts;
}

serve(async (req) => {
  try {
    console.log('💧 Fetch Water Level Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Scrape actual water levels from vizugy.hu
    console.log('Scraping actual water levels from vizugy.hu...');
    let waterLevels: Record<string, number> = {};

    try {
      waterLevels = await scrapeVizugyActual();
    } catch (error) {
      console.error('Failed to scrape vizugy.hu:', error.message);
      // Continue anyway - we might still have forecast data
    }

    // Scrape forecasts from hydroinfo.hu
    console.log('Scraping forecasts from hydroinfo.hu...');
    let forecasts: Record<string, Array<{ day: number; waterLevel: number; date: string }>> = {};

    try {
      forecasts = await scrapeHydroinfoForecast();
    } catch (error) {
      console.error('Failed to scrape hydroinfo.hu:', error.message);
      // Continue anyway - we might have actual data
    }

    // Process each station
    for (const station of STATIONS) {
      try {
        console.log(`Processing ${station.name}...`);

        // Get station_id from database
        const { data: stationData, error: stationError } = await supabase
          .from('water_level_stations')
          .select('id')
          .eq('station_name', station.name)
          .single();

        if (stationError || !stationData) {
          throw new Error(`Station not found in database: ${station.name}`);
        }

        // Insert actual water level if available
        if (waterLevels[station.name]) {
          const { error: insertError } = await supabase
            .from('water_level_data')
            .insert({
              station_id: stationData.id,
              water_level_cm: waterLevels[station.name],
              flow_rate_m3s: null, // Not available from scraping
              water_temp_celsius: null, // Not available from scraping
              timestamp: new Date().toISOString()
            });

          if (insertError) {
            console.error(`Failed to insert water level for ${station.name}:`, insertError.message);
          } else {
            console.log(`✅ Inserted water level for ${station.name}: ${waterLevels[station.name]} cm`);
          }
        }

        // Insert forecasts if available
        if (forecasts[station.name]) {
          for (const forecast of forecasts[station.name]) {
            const { error: forecastError } = await supabase
              .from('water_level_forecasts')
              .upsert({
                station_id: stationData.id,
                forecast_date: forecast.date,
                water_level_cm: forecast.waterLevel,
                forecast_day: forecast.day
              }, {
                onConflict: 'station_id,forecast_date'
              });

            if (forecastError) {
              console.error(`Failed to insert forecast for ${station.name} day ${forecast.day}:`, forecastError.message);
            }
          }
          console.log(`✅ Inserted ${forecasts[station.name].length} forecasts for ${station.name}`);
        }

        successCount++;
        results.push({
          station: station.name,
          status: 'success',
          waterLevel: waterLevels[station.name] || null,
          forecastDays: forecasts[station.name]?.length || 0
        });

      } catch (error) {
        failureCount++;
        results.push({
          station: station.name,
          status: 'error',
          error: error.message
        });
        console.error(`❌ Error for ${station.name}:`, error.message);
      }
    }

    console.log(`✅ Fetch Water Level Edge Function - Completed: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          total: STATIONS.length,
          success: successCount,
          failed: failureCount
        },
        results
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
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
