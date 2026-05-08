/**
 * DunApp PWA - Fetch Water Level Data Edge Function
 *
 * Current data (water level, flow rate, temp): vizugy.hu REST API
 * Forecasts (6-day, with uncertainty bands):   hydroinfo.hu scraping (no API alternative)
 *
 * TSZ identifiers (vizugy API):
 *   Nagybajcs  TSZ 3     (hydroinfo 442502)
 *   Baja       TSZ 1344  (hydroinfo 442031)
 *   Mohács     TSZ 831   (hydroinfo 442032)
 *
 * Cron: every hour at :10
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';
import { sanitizeError } from '../_shared/error-sanitizer.ts';
import { fetchTimeSeries, DATA_TYPE } from '../_shared/vizugy-api-client.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const STATIONS = [
  {
    name: 'Nagybajcs',
    stationId: '442051',
    tsz: 3,
    hydroinfoId: null,          // No detail forecast table
    useConsolidatedTable: true,
  },
  {
    name: 'Baja',
    stationId: '442027',
    tsz: 1344,
    hydroinfoId: '442031',      // 6-day forecast detail table
    useConsolidatedTable: false,
  },
  {
    name: 'Mohács',
    stationId: '442010',
    tsz: 831,
    hydroinfoId: '442032',
    useConsolidatedTable: false,
  },
];

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

async function fetchWithRetry(
  fetchFn: () => Promise<Response>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<Response> {
  try {
    const response = await fetchFn();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response;
  } catch (error) {
    if (retries === 0) throw error;
    console.warn(`Fetch failed, retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fetchFn, retries - 1, delay * 2);
  }
}

/**
 * Fetch current water level, flow rate, and temperature from vizugy.hu REST API.
 * Uses 3 parallel requests (one per data type) for all stations at once.
 */
async function fetchCurrentDataFromAPI(): Promise<
  Record<string, { waterLevel: number; flowRate?: number; waterTemp?: number }>
> {
  const tszList = STATIONS.map(s => s.tsz);
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 3 * 3600 * 1000); // last 3 hours

  console.log('🌐 Fetching current water data from vizugy.hu REST API...');

  const [waterLevelSeries, flowRateSeries, waterTempSeries] = await Promise.all([
    fetchTimeSeries(tszList, startTime, endTime, DATA_TYPE.WATER_LEVEL),
    fetchTimeSeries(tszList, startTime, endTime, DATA_TYPE.FLOW_RATE),
    fetchTimeSeries(tszList, startTime, endTime, DATA_TYPE.WATER_TEMP),
  ]);

  const byTsz = (series: typeof waterLevelSeries) =>
    Object.fromEntries(series.map(s => [s.tsz, s.latest?.valueCm ?? null]));

  const wlMap = byTsz(waterLevelSeries);
  const frMap = byTsz(flowRateSeries);
  const wtMap = byTsz(waterTempSeries);

  const result: Record<string, { waterLevel: number; flowRate?: number; waterTemp?: number }> = {};

  for (const station of STATIONS) {
    const wl = wlMap[station.tsz];
    if (wl == null) {
      console.warn(`⚠️  No water level data for ${station.name} (TSZ ${station.tsz})`);
      continue;
    }
    const entry: { waterLevel: number; flowRate?: number; waterTemp?: number } = {
      waterLevel: wl,
    };
    const fr = frMap[station.tsz];
    if (fr != null) entry.flowRate = fr;
    const wt = wtMap[station.tsz];
    if (wt != null) entry.waterTemp = wt;

    result[station.name] = entry;
    console.log(
      `✅ API: ${station.name} → ${wl} cm` +
      (fr != null ? `, ${fr} m³/s` : '') +
      (wt != null ? `, ${wt} °C` : '')
    );
  }

  return result;
}

/**
 * Scrape 6-day forecast from hydroinfo.hu detail table for one station.
 * Keeps existing hydroinfo scraping — no REST API alternative for forecasts.
 */
async function scrapeHydroinfoDetailTable(
  hydroinfoId: string
): Promise<Array<{ day: number; waterLevel: number; uncertainty: number; date: string }>> {
  const url = `https://www.hydroinfo.hu/tables/${hydroinfoId}H.html`;

  const response = await fetchWithRetry(() =>
    fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DunApp/1.0)' } })
  );

  const buffer = await response.arrayBuffer();
  const html = new TextDecoder('iso-8859-2').decode(buffer);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (!doc) throw new Error(`Failed to parse HTML from ${url}`);

  const forecasts: Array<{ day: number; waterLevel: number; uncertainty: number; date: string }> = [];
  const rows = doc.querySelectorAll('table tr');

  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) continue;

    const dateCell = cells[0]?.textContent?.trim() || '';
    if (!dateCell.includes('07:00') || !dateCell.match(/\d{4}\.\d{2}\.\d{2}/)) continue;

    const dateMatch = dateCell.match(/(\d{4})\.(\d{2})\.(\d{2})/);
    if (!dateMatch) continue;

    const forecastDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOffset = Math.round(
      (new Date(forecastDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const boldTags = cells[1]?.querySelectorAll('b');
    if (!boldTags?.length) continue;

    const forecastLevel = parseInt((boldTags[0]?.textContent?.trim() || '').replace(/[^\d-]/g, ''));
    let uncertainty = 0;
    if (boldTags.length > 1) {
      const m = (boldTags[1]?.textContent?.trim() || '').match(/±\s*(\d+)/);
      if (m) uncertainty = parseInt(m[1]);
    }

    if (!isNaN(forecastLevel) && dayOffset > 0 && dayOffset <= 6) {
      forecasts.push({ day: dayOffset, waterLevel: forecastLevel, uncertainty, date: forecastDate });
    }
  }

  return forecasts;
}

/**
 * Scrape consolidated hydroinfo forecast table (Nagybajcs fallback — 1-2 days only).
 */
async function scrapeHydroinfoConsolidated(): Promise<
  Record<string, Array<{ day: number; waterLevel: number; uncertainty: number; date: string }>>
> {
  const url = 'https://www.hydroinfo.hu/tables/dunelotH.html';
  const response = await fetchWithRetry(() =>
    fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DunApp/1.0)' } })
  );

  const buffer = await response.arrayBuffer();
  const html = new TextDecoder('iso-8859-2').decode(buffer);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (!doc) throw new Error('Failed to parse consolidated forecast HTML');

  const forecasts: Record<string, Array<{ day: number; waterLevel: number; uncertainty: number; date: string }>> = {};

  for (const table of doc.querySelectorAll('table')) {
    for (const row of table.querySelectorAll('tr')) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) continue;

      const stationText =
        (cells[0]?.textContent?.trim() || '') + ' ' + (cells[1]?.textContent?.trim() || '');

      for (const station of STATIONS) {
        if (!stationText.includes(station.name)) continue;

        const stationForecasts: typeof forecasts[string] = [];
        let dayCounter = 0;

        for (let i = 2; i < cells.length; i++) {
          const cellText = cells[i].textContent?.trim() || '';
          if (cellText.includes('±') || i === 2) continue;

          const boldTags = cells[i].querySelectorAll('b');
          if (!boldTags.length) continue;

          const forecastLevel = parseInt(
            (boldTags[0]?.textContent?.trim() || '').replace(/[^\d-]/g, '')
          );
          let uncertainty = 0;
          const next = cells[i + 1];
          if (next) {
            const m = (next.textContent?.trim() || '').match(/±\s*(\d+)/);
            if (m) uncertainty = parseInt(m[1]);
          }

          if (!isNaN(forecastLevel) && forecastLevel < 1000) {
            dayCounter++;
            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + dayCounter);
            stationForecasts.push({
              day: dayCounter,
              waterLevel: forecastLevel,
              uncertainty,
              date: forecastDate.toISOString().split('T')[0],
            });
            if (dayCounter >= 6) break;
          }
        }

        if (stationForecasts.length > 0) {
          forecasts[station.name] = stationForecasts;
          console.log(`✅ Consolidated forecast for ${station.name}: ${stationForecasts.length} days`);
        }
        break;
      }
    }
  }

  return forecasts;
}

serve(async () => {
  try {
    console.log('💧 Fetch Water Level Edge Function - Starting');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // ── 1. Current data from vizugy REST API ─────────────────────────────────
    let waterLevelData: Record<string, { waterLevel: number; flowRate?: number; waterTemp?: number }> = {};

    try {
      waterLevelData = await fetchCurrentDataFromAPI();
    } catch (error) {
      console.error('❌ vizugy API failed:', error.message);
      // No fallback scraper needed — if API is down, skip current data insertion
    }

    // ── 2. Forecasts from hydroinfo.hu (no API alternative) ──────────────────
    console.log('🌐 Fetching forecasts from hydroinfo.hu...');
    const forecasts: Record<string, Array<{ day: number; waterLevel: number; uncertainty?: number; date: string }>> = {};

    for (const station of STATIONS) {
      if (station.hydroinfoId && !station.useConsolidatedTable) {
        try {
          const stationForecasts = await scrapeHydroinfoDetailTable(station.hydroinfoId);
          if (stationForecasts.length > 0) {
            forecasts[station.name] = stationForecasts;
            console.log(`  ✅ ${station.name}: ${stationForecasts.length} days (detail table)`);
          }
        } catch (error) {
          console.error(`  ❌ Detail table for ${station.name}:`, error.message);
        }
      }
    }

    try {
      const consolidated = await scrapeHydroinfoConsolidated();
      for (const [name, data] of Object.entries(consolidated)) {
        if (!forecasts[name]) forecasts[name] = data;
      }
    } catch (error) {
      console.error('  ❌ Consolidated table:', error.message);
    }

    // ── 3. Persist to database ────────────────────────────────────────────────
    for (const station of STATIONS) {
      try {
        const { data: stationData, error: stationError } = await supabase
          .from('water_level_stations')
          .select('id')
          .eq('station_id', station.stationId)
          .single();

        if (stationError || !stationData) {
          throw new Error(`Station not found: ${station.name} (${station.stationId})`);
        }

        const stationUUID = stationData.id;

        if (waterLevelData[station.name]) {
          const data = waterLevelData[station.name];
          const { error: insertError } = await supabase
            .from('water_level_data')
            .insert({
              station_id: stationUUID,
              measured_at: new Date().toISOString(),
              water_level_cm: data.waterLevel,
              flow_rate_m3s: data.flowRate ?? null,
              water_temp_celsius: data.waterTemp ?? null,
              source: 'vizugy.hu',
            });

          if (insertError) throw insertError;
          console.log(`  ✅ Inserted ${station.name}: ${data.waterLevel} cm`);
        }

        if (forecasts[station.name]) {
          const issuedAt = new Date().toISOString();
          for (const forecast of forecasts[station.name]) {
            const { error } = await supabase
              .from('water_level_forecasts')
              .upsert({
                station_id: stationUUID,
                forecast_date: forecast.date,
                issued_at: issuedAt,
                forecasted_level_cm: forecast.waterLevel,
                forecast_uncertainty_cm: forecast.uncertainty ?? null,
                source: 'hydroinfo.hu',
              }, { onConflict: 'station_id,forecast_date,issued_at' });

            if (error) console.error(`  ❌ Forecast upsert for ${station.name}:`, error.message);
          }
          console.log(`  ✅ Inserted ${forecasts[station.name].length} forecasts for ${station.name}`);
        }

        successCount++;
        results.push({
          station: station.name,
          status: 'success',
          waterLevel: waterLevelData[station.name]?.waterLevel ?? null,
          forecastDays: forecasts[station.name]?.length ?? 0,
        });
      } catch (error) {
        failureCount++;
        results.push({
          station: station.name,
          status: 'error',
          error: sanitizeError(error, 'Failed to process station data'),
        });
        console.error(`❌ ${station.name}:`, error.message);
      }
    }

    console.log(`✅ Done — success: ${successCount}, failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: { total: STATIONS.length, success: successCount, failed: failureCount },
        results,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Fetch Water Level Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: sanitizeError(error, 'Failed to fetch water level data'),
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
