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
 * - hydroinfo.hu iframe table scraping for ALL current data (water level, flow rate, temperature)
 * - hydroinfo.hu detail tables for 6-day forecasts (with uncertainty bands)
 * - vizugy.hu fallback (water level only, no flow rate or temperature)
 * - HTML parsing with DOMParser
 * - ISO-8859-2 encoding support for Hungarian characters
 * - Retry logic with exponential backoff
 * - Error logging and handling
 *
 * DATA SOURCES:
 * - Current data: https://www.hydroinfo.hu/tables/dunhif_a.html (iframe table)
 * - Forecasts: https://www.hydroinfo.hu/tables/{station_id}H.html (detail tables)
 * - Fallback: https://www.vizugy.hu/index.php?module=content&programelemid=138
 *
 * Environment variables needed:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Updated: 2025-11-09 (Phase 4.3 - hydroinfo.hu iframe table integration)
 * Compatible with Migration 008 + 009 schema
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Station configuration (matches database seed data)
// IMPORTANT: stationId = Database station_id (for lookups)
//            hydroinfoActualId = hydroinfo.hu iframe table code (for current data)
//            hydroinfoId = hydroinfo.hu ID (for forecast detail tables)
const STATIONS = [
  {
    name: 'Nagybajcs',
    stationId: '442051', // Database station_id reference
    hydroinfoActualId: '442502', // hydroinfo.hu iframe table code (current data)
    hydroinfoId: null,   // No detail table available on hydroinfo.hu
    useConsolidatedTable: true // Must use dunelotH.html (limited to 1-2 days)
  },
  {
    name: 'Baja',
    stationId: '442027', // Database station_id reference
    hydroinfoActualId: '442031', // hydroinfo.hu iframe table code (current data)
    hydroinfoId: '442031', // hydroinfo.hu detail table ID (6-day forecast)
    useConsolidatedTable: false
  },
  {
    name: 'Mohács',
    stationId: '442010', // Database station_id reference
    hydroinfoActualId: '442032', // hydroinfo.hu iframe table code (current data)
    hydroinfoId: '442032', // hydroinfo.hu detail table ID (6-day forecast)
    useConsolidatedTable: false
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
 * Scrape current water level data from hydroinfo.hu iframe table
 * Returns: { stationName: { waterLevel: number, flowRate?: number, waterTemp?: number } }
 *
 * Data source: https://www.hydroinfo.hu/tables/dunhif_a.html
 * Table format: All Danube stations in one iframe table
 * Columns: [station_code, name, river, level1, level2, level3, trend, flow_rate, water_temp, extra]
 */
async function scrapeHydroinfoActual() {
  const url = 'https://www.hydroinfo.hu/tables/dunhif_a.html';

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
    throw new Error('Failed to parse HTML from hydroinfo.hu iframe table');
  }

  const waterLevelData: Record<string, {
    waterLevel: number;
    flowRate?: number;
    waterTemp?: number
  }> = {};

  // Helper function to extract text from table cell
  const getCellText = (cell: any): string => {
    if (!cell) return '';
    const text = cell.textContent?.trim() || '';
    return text;
  };

  // Find the main table
  const tables = doc.querySelectorAll('table');

  for (const table of tables) {
    const rows = table.querySelectorAll('tr');

    for (const row of rows) {
      const cells = row.querySelectorAll('td');

      // Need at least 10 cells for a valid data row
      if (cells.length < 10) continue;

      const stationCode = getCellText(cells[0]);

      // Check if this is one of our target stations
      for (const station of STATIONS) {
        if (stationCode === station.hydroinfoActualId) {
          // Column structure:
          // 0: station code (e.g., "442032")
          // 1: station name (e.g., "Mohács")
          // 2: river name (e.g., "Duna")
          // 3: water level 1 (current)
          // 4: water level 2 (forecast 1)
          // 5: water level 3 (forecast 2)
          // 6: trend (change in cm)
          // 7: flow rate (m³/s)
          // 8: water temperature (°C)
          // 9: extra info

          const waterLevel = parseInt(getCellText(cells[3]).replace(/[^\d-]/g, ''));
          const flowRateText = getCellText(cells[7]);
          const waterTempText = getCellText(cells[8]);

          if (!isNaN(waterLevel)) {
            const data: {
              waterLevel: number;
              flowRate?: number;
              waterTemp?: number;
            } = { waterLevel };

            // Parse flow rate (skip if "//" which means no data)
            if (flowRateText && flowRateText !== '//' && flowRateText !== '//') {
              const flowRate = parseInt(flowRateText.replace(/[^\d]/g, ''));
              if (!isNaN(flowRate)) {
                data.flowRate = flowRate;
              }
            }

            // Parse water temperature (convert "11,1" to 11.1)
            if (waterTempText && waterTempText !== '//' && waterTempText !== '//') {
              const waterTemp = parseFloat(waterTempText.replace(',', '.'));
              if (!isNaN(waterTemp)) {
                data.waterTemp = waterTemp;
              }
            }

            waterLevelData[station.name] = data;
            console.log(`✅ Scraped ${station.name}: ${waterLevel} cm, ${data.flowRate || 'N/A'} m³/s, ${data.waterTemp || 'N/A'} °C`);
          }
          break;
        }
      }
    }
  }

  return waterLevelData;
}

/**
 * Scrape water level data from vizugy.hu (DEPRECATED - kept as fallback)
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
        // Extract water level from the SECOND TO LAST cell (blue number = actual water level)
        // Structure: [station, forecasts..., ACTUAL (blue), reference (red)]
        // The last cell contains a reference value (red), not the actual water level
        const actualWaterLevelCell = cells[cells.length - 2]; // Second to last cell
        const waterLevelText = actualWaterLevelCell?.textContent?.trim() || '';
        const waterLevel = parseInt(waterLevelText.replace(/[^\d-]/g, ''));

        if (!isNaN(waterLevel)) {
          waterLevelData[station.name] = { waterLevel };
          console.log(`✅ Scraped ${station.name}: ${waterLevel} cm (from second-to-last cell)`);
        }
        break;
      }
    }
  }

  return waterLevelData;
}

/**
 * Scrape water level forecast from station-specific detail table
 * Returns: [{ day: 1-6, waterLevel: number, uncertainty: number, date: string }]
 *
 * Data source: https://www.hydroinfo.hu/tables/{hydroinfoId}H.html
 * Table format: Single station, 6-hour intervals for 6 days
 * We extract only the 07:00 values (daily forecast)
 *
 * HTML structure for forecast cells:
 * <table>
 *   <tr>
 *     <td><b>232</b></td>  <!-- forecast value -->
 *     <td><b> ± 2</b></td>  <!-- uncertainty -->
 *   </tr>
 * </table>
 */
async function scrapeHydroinfoDetailTable(hydroinfoId: string): Promise<Array<{ day: number; waterLevel: number; uncertainty: number; date: string }>> {
  const url = `https://www.hydroinfo.hu/tables/${hydroinfoId}H.html`;

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
    throw new Error(`Failed to parse HTML from ${url}`);
  }

  const forecasts: Array<{ day: number; waterLevel: number; uncertainty: number; date: string }> = [];

  // Find all table rows
  const rows = doc.querySelectorAll('table tr');

  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) continue;

    const dateCell = cells[0]?.textContent?.trim() || '';

    // Look for rows with "07:00" timestamp (daily forecast at 07:00)
    // Format: "2025.11.08. 07:00"
    if (dateCell.includes('07:00') && dateCell.match(/\d{4}\.\d{2}\.\d{2}/)) {
      // Extract date
      const dateMatch = dateCell.match(/(\d{4})\.(\d{2})\.(\d{2})/);
      if (!dateMatch) continue;

      const year = dateMatch[1];
      const month = dateMatch[2];
      const day = dateMatch[3];
      const forecastDate = `${year}-${month}-${day}`; // YYYY-MM-DD

      // Calculate day offset from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(forecastDate);
      const dayOffset = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Extract forecast value and uncertainty from the second cell (nested table with 2 <b> tags)
      const valueCell = cells[1];
      const boldTags = valueCell?.querySelectorAll('b');

      if (boldTags && boldTags.length > 0) {
        const forecastText = boldTags[0]?.textContent?.trim() || '';
        const forecastLevel = parseInt(forecastText.replace(/[^\d-]/g, ''));

        // Parse uncertainty (± value) from second <b> tag if exists
        let uncertainty = 0;
        if (boldTags.length > 1) {
          const uncertaintyText = boldTags[1]?.textContent?.trim() || '';
          // Extract number from " ± 2" or " ±10" format
          const uncertaintyMatch = uncertaintyText.match(/±\s*(\d+)/);
          if (uncertaintyMatch) {
            uncertainty = parseInt(uncertaintyMatch[1]);
          }
        }

        if (!isNaN(forecastLevel) && dayOffset > 0 && dayOffset <= 6) {
          forecasts.push({
            day: dayOffset,
            waterLevel: forecastLevel,
            uncertainty: uncertainty,
            date: forecastDate
          });
        }
      }
    }
  }

  return forecasts;
}

/**
 * Scrape water level forecast from hydroinfo.hu consolidated table (FALLBACK for Nagybajcs)
 * Returns: { stationName: [{ day: 1-6, waterLevel: number, uncertainty: number, date: string }] }
 *
 * Data source: https://www.hydroinfo.hu/tables/dunelotH.html
 * Table format: All 3 stations in one consolidated table
 * WARNING: Baja/Mohács/Nagybajcs rows are TRUNCATED in this table (only 1-2 days)
 * This function should ONLY be used for Nagybajcs (no detail table available)
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

  const forecasts: Record<string, Array<{ day: number; waterLevel: number; uncertainty: number; date: string }>> = {};

  // Find all table rows
  const tables = doc.querySelectorAll('table');

  for (const table of tables) {
    const rows = table.querySelectorAll('tr');

    for (const row of rows) {
      const cells = row.querySelectorAll('td');

      // Need at least 4 cells for station row
      if (cells.length < 4) continue;

      // Check BOTH cells[0] AND cells[1] for station name
      // Table structure varies: sometimes "Duna" is in cells[0] and station name in cells[1]
      const cell0Text = cells[0]?.textContent?.trim() || '';
      const cell1Text = cells[1]?.textContent?.trim() || '';
      const stationText = cell0Text + ' ' + cell1Text;

      // Check if this row contains one of our stations
      for (const station of STATIONS) {
        if (stationText.includes(station.name)) {
          const stationForecasts = [];
          let dayCounter = 0;

          // Iterate through ALL cells looking for forecast values
          // Skip: river name (cell 0), station name (cell 1), current level (cell 2)
          // Table structure: forecast value cells alternate with uncertainty cells (± XX)
          for (let i = 2; i < cells.length; i++) {
            const cell = cells[i];
            const cellText = cell.textContent?.trim() || '';

            // IMPORTANT: Skip uncertainty cells (contain ± symbol)
            // These were being incorrectly parsed as forecast values!
            if (cellText.includes('±')) {
              continue;
            }

            // Skip current water level (first numeric cell after station name)
            // It's typically a larger number without date context
            if (i === 2) {
              continue;
            }

            // Forecast values are in <b> tags
            const boldTags = cell.querySelectorAll('b');

            if (boldTags.length > 0) {
              const forecastText = boldTags[0]?.textContent?.trim() || '';
              const forecastLevel = parseInt(forecastText.replace(/[^\d-]/g, ''));

              // Get uncertainty from the NEXT cell (which contains ± value)
              let uncertainty = 0;
              const nextCell = cells[i + 1];
              if (nextCell) {
                const nextCellText = nextCell.textContent?.trim() || '';
                const uncertaintyMatch = nextCellText.match(/±\s*(\d+)/);
                if (uncertaintyMatch) {
                  uncertainty = parseInt(uncertaintyMatch[1]);
                }
              }

              if (!isNaN(forecastLevel) && forecastLevel < 1000) {
                // Calculate forecast date
                dayCounter++;
                const dayOffset = dayCounter;
                const forecastDate = new Date();
                forecastDate.setDate(forecastDate.getDate() + dayOffset);

                stationForecasts.push({
                  day: dayOffset,
                  waterLevel: forecastLevel,
                  uncertainty: uncertainty,
                  date: forecastDate.toISOString().split('T')[0] // YYYY-MM-DD
                });

                // Maximum 5-6 day forecast
                if (dayCounter >= 6) break;
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

    // Scrape actual water levels from hydroinfo.hu iframe table
    console.log('🌐 Scraping actual water levels from hydroinfo.hu iframe table...');
    let waterLevelData: Record<string, { waterLevel: number; flowRate?: number; waterTemp?: number }> = {};

    try {
      waterLevelData = await scrapeHydroinfoActual();
      console.log(`✅ Scraped ${Object.keys(waterLevelData).length} stations from hydroinfo.hu`);
    } catch (error) {
      console.error('❌ Failed to scrape hydroinfo.hu:', error.message);
      console.log('⚠️  Falling back to vizugy.hu...');

      // Fallback to vizugy.hu (only has water level, no flow rate or temperature)
      try {
        waterLevelData = await scrapeVizugyActual();
        console.log(`✅ Scraped ${Object.keys(waterLevelData).length} stations from vizugy.hu (fallback)`);
      } catch (fallbackError) {
        console.error('❌ Failed to scrape vizugy.hu fallback:', fallbackError.message);
        // Continue anyway - we might still have forecast data
      }
    }

    // Scrape forecasts from hydroinfo.hu
    console.log('🌐 Scraping forecasts from hydroinfo.hu...');
    let forecasts: Record<string, Array<{ day: number; waterLevel: number; uncertainty?: number; date: string }>> = {};

    // Strategy: Use detail tables for Baja/Mohács (6-day forecast)
    //           Use consolidated table for Nagybajcs (1-2 day forecast, no detail table)
    for (const station of STATIONS) {
      try {
        if (station.hydroinfoId && !station.useConsolidatedTable) {
          // Use detail table (Baja/Mohács)
          console.log(`  Fetching detail table for ${station.name} (ID: ${station.hydroinfoId})...`);
          const stationForecasts = await scrapeHydroinfoDetailTable(station.hydroinfoId);
          if (stationForecasts.length > 0) {
            forecasts[station.name] = stationForecasts;
            console.log(`  ✅ ${station.name}: ${stationForecasts.length} days from detail table`);
          } else {
            console.log(`  ⚠️  ${station.name}: No forecasts found in detail table`);
          }
        }
      } catch (error) {
        console.error(`  ❌ Failed to scrape detail table for ${station.name}:`, error.message);
      }
    }

    // Fallback: Use consolidated table for stations without detail tables (Nagybajcs)
    try {
      const consolidatedForecasts = await scrapeHydroinfoForecast();
      for (const [stationName, stationForecasts] of Object.entries(consolidatedForecasts)) {
        // Only use if not already fetched from detail table
        if (!forecasts[stationName]) {
          forecasts[stationName] = stationForecasts;
          console.log(`  ✅ ${stationName}: ${stationForecasts.length} days from consolidated table (fallback)`);
        }
      }
    } catch (error) {
      console.error('  ❌ Failed to scrape consolidated table:', error.message);
    }

    console.log(`✅ Total forecasts scraped: ${Object.keys(forecasts).length} stations`);

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
              source: 'hydroinfo.hu' // Primary source (iframe table)
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
                forecast_uncertainty_cm: forecast.uncertainty || null, // Uncertainty (± value)
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

    // Alert check removed - now triggered by app load (user request)
    // Notification will be sent when user opens the PWA instead of automatic cron
    console.log('✅ Water level data updated. Alert will be triggered when user opens app.');

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
