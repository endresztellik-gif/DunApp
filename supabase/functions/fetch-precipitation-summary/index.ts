/**
 * DunApp PWA - Fetch Precipitation Summary Edge Function
 *
 * PURPOSE:
 * - Fetches historical precipitation data and calculates:
 *   - Last 7 days  → Open-Meteo Forecast API (no lag, real-time)
 *   - Last 30 days → Open-Meteo Forecast API (no lag, real-time)
 *   - Year-to-date → Archive API (Jan 1 to 3 days ago) + Forecast last 3 days
 *
 * WHY TWO APIS:
 * The Archive API has a 2-5 day lag — recent days return null (summed as 0).
 * The Forecast API (past_days param) has no lag and covers the recent window.
 * For YTD we combine both to avoid gaps without double-counting.
 *
 * SCHEDULE:
 * Run daily via pg_cron at 6:00 AM UTC
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sanitizeError } from '../_shared/error-sanitizer.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CITIES = [
  { name: 'Szekszárd', lat: 46.3481, lon: 18.7097 },
  { name: 'Baja', lat: 46.1811, lon: 18.9550 },
  { name: 'Dunaszekcső', lat: 46.0833, lon: 18.7667 },
  { name: 'Mohács', lat: 45.9928, lon: 18.6836 },
];

// Archive API is reliably lag-free up to this many days ago
const ARCHIVE_SAFE_LAG_DAYS = 3;
const FORECAST_WINDOW_DAYS = 30;

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

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

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Forecast API — no lag, covers recent days accurately.
 * Returns daily precipitation for the last `pastDays` days.
 */
async function fetchForecastPrecipitation(
  city: { name: string; lat: number; lon: number },
  pastDays: number
): Promise<number[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=precipitation_sum&past_days=${pastDays}&forecast_days=0&timezone=Europe/Budapest`;

  console.log(`[Forecast] Fetching last ${pastDays} days for ${city.name}...`);
  const response = await fetchWithRetry(() => fetch(url));

  if (!response.ok) {
    throw new Error(`Open-Meteo Forecast API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.daily?.precipitation_sum || [];
}

/**
 * Archive API — has 2-5 day lag. Use only for older data (safe end = today - ARCHIVE_SAFE_LAG_DAYS).
 */
async function fetchArchivePrecipitation(
  city: { name: string; lat: number; lon: number },
  startDate: string,
  endDate: string
): Promise<number[]> {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${city.lat}&longitude=${city.lon}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum&timezone=Europe/Budapest`;

  console.log(`[Archive] Fetching ${city.name} (${startDate} to ${endDate})...`);
  const response = await fetchWithRetry(() => fetch(url));

  if (!response.ok) {
    throw new Error(`Open-Meteo Archive API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.daily?.precipitation_sum || [];
}

function sumPrecipitation(values: (number | null)[]): number {
  return values.reduce((sum: number, val: number | null) => sum + (val ?? 0), 0);
}

async function fetchCityPrecipitationSummary(city: { name: string; lat: number; lon: number }) {
  const now = new Date();

  // --- 7-day and 30-day: Forecast API (no lag) ---
  const forecastData = await fetchForecastPrecipitation(city, FORECAST_WINDOW_DAYS);
  const last7Days = sumPrecipitation(forecastData.slice(-7));
  const last30Days = sumPrecipitation(forecastData);

  // --- YTD: Archive (Jan 1 to today-ARCHIVE_SAFE_LAG_DAYS) + Forecast last N days ---
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const archiveSafeEnd = new Date(now);
  archiveSafeEnd.setDate(now.getDate() - ARCHIVE_SAFE_LAG_DAYS);

  const archiveStartStr = formatDate(yearStart);
  const archiveEndStr = formatDate(archiveSafeEnd);

  const archiveData = await fetchArchivePrecipitation(city, archiveStartStr, archiveEndStr);
  const archiveSum = sumPrecipitation(archiveData);

  // Recent days not covered by archive (last ARCHIVE_SAFE_LAG_DAYS from forecast)
  const recentDays = forecastData.slice(-ARCHIVE_SAFE_LAG_DAYS);
  const recentSum = sumPrecipitation(recentDays);

  const yearToDate = archiveSum + recentSum;

  console.log(
    `✅ ${city.name}: 7d=${last7Days.toFixed(1)}mm, 30d=${last30Days.toFixed(1)}mm, YTD=${yearToDate.toFixed(1)}mm`
  );

  return {
    last_7_days: Math.round(last7Days * 100) / 100,
    last_30_days: Math.round(last30Days * 100) / 100,
    year_to_date: Math.round(yearToDate * 100) / 100,
  };
}

serve(async (req) => {
  try {
    console.log('🌧️  Fetch Precipitation Summary Edge Function - Starting');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const city of CITIES) {
      try {
        const { data: cityData, error: cityError } = await supabase
          .from('meteorology_cities')
          .select('id')
          .eq('name', city.name)
          .single();

        if (cityError || !cityData) {
          throw new Error(`City not found in database: ${city.name}`);
        }

        const summary = await fetchCityPrecipitationSummary(city);

        const { error: upsertError } = await supabase
          .from('precipitation_summary')
          .upsert({
            city_id: cityData.id,
            last_7_days: summary.last_7_days,
            last_30_days: summary.last_30_days,
            year_to_date: summary.year_to_date,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'city_id' });

        if (upsertError) throw upsertError;

        successCount++;
        results.push({ city: city.name, status: 'success', data: summary });
      } catch (error) {
        failureCount++;
        results.push({
          city: city.name,
          status: 'error',
          error: sanitizeError(error, 'Failed to fetch precipitation data'),
        });
        console.error(`❌ Error for ${city.name}:`, error.message);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Fetch Precipitation Summary - Completed`);
    console.log(`   Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: { total: CITIES.length, success: successCount, failed: failureCount },
        results,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Fetch Precipitation Summary Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: sanitizeError(error, 'Failed to fetch precipitation summary'),
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
