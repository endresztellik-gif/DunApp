/**
 * DunApp PWA - Fetch Water Level Data Edge Function
 *
 * PURPOSE:
 * - Scrapes current water level data for 3 stations (Nagybajcs, Baja, Mohács)
 * - Stores data in water_level_data table
 * - Fetches forecasts and stores in water_level_forecasts table
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
 *
 * Updated: 2025-11-03 (Phase 4.2)
 * Compatible with Migration 008 + 009 schema
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Station configuration (matches database seed data)
const STATIONS = [
  {
    name: 'Nagybajcs',
    stationId: '442051', // External station ID from vizugy.hu/hydroinfo.hu
    hydroinfoCode: 'nagybajcs'
  },
  {
    name: 'Baja',
    stationId: '442027',
    hydroinfoCode: 'baja'
  },
  {
    name: 'Mohács',
    stationId: '442010',
    hydroinfoCode: 'mohacs'
  }
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
 * Returns: { stationName: { waterLevel: number, flowRate?: number, waterTemp?: number } }
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

  const waterLevelData: Record<string, {
    waterLevel: number;
    flowRate?: number;
    waterTemp?: number
  }> = {};

  // Find all table rows
  const rows = doc.querySelectorAll('table tr');

  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) continue;

    const stationText = cells[0]?.textContent?.trim() || '';

    // Check if this row contains one of our stations
    for (const station of STATIONS) {
      if (stationText.includes(station.name)) {
        // Extract water level (typically in cm)
        // Pattern: look for numbers in the last few columns
        const lastCell = cells[cells.length - 1];
        const waterLevelText = lastCell?.textContent?.trim() || '';
        const waterLevel = parseInt(waterLevelText.replace(/[^\d-]/g, ''));

        if (!isNaN(waterLevel)) {
          waterLevelData[station.name] = { waterLevel };
          console.log(`✅ Scraped ${station.name}: ${waterLevel} cm`);
        }
        break;
      }
    }
  }

  return waterLevelData;
}

/**
 * Scrape water level forecast from hydroinfo.hu
 * Returns: { stationName: [{ day: 1-6, waterLevel: number, date: string }] }
 *
 * Data source: https://www.hydroinfo.hu/tables/dunelotH.html
 * Table format: All 3 stations in one consolidated table
 * Columns: Station | Ma reggel | Day+1 07h | Day+2 07h | Day+3 07h | Day+4 07h | Day+5 07h | Day+6 07h
 */
async function scrapeHydroinfoForecast() {
  const url = 'https://www.hydroinfo.hu/tables/dunelotH.html';

  const response = await fetchWithRetry(() => fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DunApp/1.0; +https://dunapp.hu)'
    }
  }));

  // Handle ISO-8859-2 encoding for Hungarian characters
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-2');
  const html = decoder.decode(buffer);

  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Failed to parse HTML from hydroinfo.hu');
  }

  const forecasts: Record<string, Array<{ day: number; waterLevel: number; date: string }>> = {};

  // Find all table rows
  const tables = doc.querySelectorAll('table');

  for (const table of tables) {
    const rows = table.querySelectorAll('tr');

    for (const row of rows) {
      const cells = row.querySelectorAll('td');

      // Need at least 8 cells: station name + "Ma reggel" + 6 forecast days
      if (cells.length < 8) continue;

      const stationText = cells[0]?.textContent?.trim() || '';

      // Check if this row contains one of our stations
      for (const station of STATIONS) {
        if (stationText.includes(station.name)) {
          const stationForecasts = [];

          // Skip cell[1] which is "Ma reggel" (current day)
          // Extract 6-day forecast from cells[2] through cells[7]
          for (let i = 2; i <= 7 && i < cells.length; i++) {
            const cell = cells[i];

            // Forecast values are in nested <b> tags within nested tables
            // Extract the first <b> tag which contains the forecasted water level
            const boldTags = cell.querySelectorAll('b');

            if (boldTags.length > 0) {
              const forecastText = boldTags[0]?.textContent?.trim() || '';
              const forecastLevel = parseInt(forecastText.replace(/[^\d-]/g, ''));

              if (!isNaN(forecastLevel)) {
                // Calculate forecast date
                // i=2 is tomorrow (day+1), i=3 is day+2, etc.
                const dayOffset = i - 1;
                const forecastDate = new Date();
                forecastDate.setDate(forecastDate.getDate() + dayOffset);

                stationForecasts.push({
                  day: dayOffset,
                  waterLevel: forecastLevel,
                  date: forecastDate.toISOString().split('T')[0] // YYYY-MM-DD
                });
              }
            }
          }

          if (stationForecasts.length > 0) {
            forecasts[station.name] = stationForecasts;
            console.log(`✅ Scraped forecast for ${station.name}: ${stationForecasts.length} days`);
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
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Scrape actual water levels from vizugy.hu
    console.log('🌐 Scraping actual water levels from vizugy.hu...');
    let waterLevelData: Record<string, { waterLevel: number; flowRate?: number; waterTemp?: number }> = {};

    try {
      waterLevelData = await scrapeVizugyActual();
      console.log(`✅ Scraped ${Object.keys(waterLevelData).length} stations from vizugy.hu`);
    } catch (error) {
      console.error('❌ Failed to scrape vizugy.hu:', error.message);
      // Continue anyway - we might still have forecast data
    }

    // Scrape forecasts from hydroinfo.hu
    console.log('🌐 Scraping forecasts from hydroinfo.hu...');
    let forecasts: Record<string, Array<{ day: number; waterLevel: number; date: string }>> = {};

    try {
      forecasts = await scrapeHydroinfoForecast();
      console.log(`✅ Scraped forecasts for ${Object.keys(forecasts).length} stations from hydroinfo.hu`);
    } catch (error) {
      console.error('❌ Failed to scrape hydroinfo.hu:', error.message);
      // Continue anyway - we might have actual data
    }

    // Process each station
    for (const station of STATIONS) {
      try {
        console.log(`\n📍 Processing ${station.name}...`);

        // Get station UUID from database using station_id (TEXT)
        const { data: stationData, error: stationError } = await supabase
          .from('water_level_stations')
          .select('id')
          .eq('station_id', station.stationId) // Use external station_id
          .single();

        if (stationError || !stationData) {
          throw new Error(`Station not found in database: ${station.name} (station_id: ${station.stationId})`);
        }

        const stationUUID = stationData.id;
        console.log(`  Station UUID: ${stationUUID}`);

        // Insert actual water level if available
        if (waterLevelData[station.name]) {
          const data = waterLevelData[station.name];

          const { error: insertError } = await supabase
            .from('water_level_data')
            .insert({
              station_id: stationUUID,
              measured_at: new Date().toISOString(), // TIMESTAMPTZ
              water_level_cm: data.waterLevel,
              flow_rate_m3s: data.flowRate || null,
              water_temp_celsius: data.waterTemp || null,
              source: 'vizugy.hu'
            });

          if (insertError) {
            console.error(`  ❌ Failed to insert water level:`, insertError.message);
            throw insertError;
          } else {
            console.log(`  ✅ Inserted water level: ${data.waterLevel} cm`);
          }
        } else {
          console.log(`  ⚠️  No water level data available from vizugy.hu`);
        }

        // Insert forecasts if available
        if (forecasts[station.name]) {
          const forecastData = forecasts[station.name];
          const issuedAt = new Date().toISOString();

          for (const forecast of forecastData) {
            const { error: forecastError } = await supabase
              .from('water_level_forecasts')
              .upsert({
                station_id: stationUUID,
                forecast_date: forecast.date, // DATE (YYYY-MM-DD)
                issued_at: issuedAt, // TIMESTAMPTZ
                forecasted_level_cm: forecast.waterLevel,
                source: 'hydroinfo.hu'
              }, {
                onConflict: 'station_id,forecast_date,issued_at'
              });

            if (forecastError) {
              console.error(`  ❌ Failed to insert forecast for day ${forecast.day}:`, forecastError.message);
            }
          }
          console.log(`  ✅ Inserted ${forecastData.length} forecasts`);
        } else {
          console.log(`  ⚠️  No forecast data available from hydroinfo.hu`);
        }

        successCount++;
        results.push({
          station: station.name,
          status: 'success',
          waterLevel: waterLevelData[station.name]?.waterLevel || null,
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

    console.log(`\n✅ Fetch Water Level Edge Function - Completed`);
    console.log(`   Success: ${successCount} / ${STATIONS.length}`);
    console.log(`   Failed: ${failureCount} / ${STATIONS.length}`);

    // Step: Call check-water-level-alert to check Mohács threshold
    console.log('\n🚨 Calling check-water-level-alert...');
    try {
      const alertResponse = await fetch(`${SUPABASE_URL}/functions/v1/check-water-level-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });

      const alertResult = await alertResponse.json();

      if (alertResponse.ok) {
        console.log('✅ Alert check completed');
        if (alertResult.alert_sent) {
          console.log(`   🔔 Alert sent! Level: ${alertResult.current_level} cm`);
        } else {
          console.log(`   ℹ️  No alert needed: ${alertResult.reason || 'N/A'}`);
        }
      } else {
        console.error('❌ Alert check failed:', alertResult.error);
      }
    } catch (alertError) {
      console.error('❌ Failed to call check-water-level-alert:', alertError.message);
      // Don't fail the main function if alert check fails
    }

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
