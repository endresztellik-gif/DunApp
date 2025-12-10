/**
 * DunApp PWA - Fetch Precipitation Summary Edge Function
 *
 * PURPOSE:
 * - Fetches historical precipitation data from Open-Meteo Archive API
 * - Calculates 3 aggregations per city:
 *   - Last 7 days
 *   - Last 30 days
 *   - Year-to-date (YTD)
 * - Stores in precipitation_summary table
 *
 * DATA SOURCE:
 * Open-Meteo Historical Weather API (free, no API key required)
 * URL: https://archive-api.open-meteo.com/v1/archive
 * Data available from: 1940-present
 *
 * SCHEDULE:
 * Run daily via pg_cron (recommended: 6:00 AM local time)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sanitizeError } from '../_shared/error-sanitizer.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Cities to fetch precipitation for (same as meteorology)
const CITIES = [
  { name: 'Szekszárd', lat: 46.3481, lon: 18.7097 },
  { name: 'Baja', lat: 46.1811, lon: 18.9550 },
  { name: 'Dunaszekcső', lat: 46.0833, lon: 18.7667 },
  { name: 'Mohács', lat: 45.9928, lon: 18.6836 },
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
    return await fetchFn();
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
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Fetch precipitation data from Open-Meteo Historical API
 */
async function fetchPrecipitationData(
  city: { name: string; lat: number; lon: number },
  startDate: string,
  endDate: string
): Promise<number[]> {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${city.lat}&longitude=${city.lon}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum&timezone=Europe/Budapest`;

  console.log(`Fetching precipitation for ${city.name} (${startDate} to ${endDate})...`);

  const response = await fetchWithRetry(() => fetch(url));

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Return array of daily precipitation values
  return data.daily?.precipitation_sum || [];
}

/**
 * Sum precipitation values, handling null values
 */
function sumPrecipitation(values: (number | null)[]): number {
  return values.reduce((sum: number, val: number | null) => {
    return sum + (val ?? 0);
  }, 0);
}

/**
 * Fetch and calculate precipitation summary for a city
 */
async function fetchCityPrecipitationSummary(city: { name: string; lat: number; lon: number }) {
  const now = new Date();

  // Calculate date ranges
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const yearStart = new Date(now.getFullYear(), 0, 1); // January 1st

  // Use yesterday as end date to ensure data is available
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const endDate = formatDate(yesterday);

  // Fetch all data in one request (from Jan 1 to yesterday)
  // This is more efficient than 3 separate requests
  const startDate = formatDate(yearStart);
  const allPrecipitation = await fetchPrecipitationData(city, startDate, endDate);

  // Calculate days for each period
  const daysInLast7 = 7;
  const daysInLast30 = 30;

  // Extract relevant slices
  const last7DaysData = allPrecipitation.slice(-daysInLast7);
  const last30DaysData = allPrecipitation.slice(-daysInLast30);
  const ytdData = allPrecipitation;

  // Calculate sums
  const last7Days = sumPrecipitation(last7DaysData);
  const last30Days = sumPrecipitation(last30DaysData);
  const yearToDate = sumPrecipitation(ytdData);

  console.log(`✅ ${city.name}: 7d=${last7Days.toFixed(1)}mm, 30d=${last30Days.toFixed(1)}mm, YTD=${yearToDate.toFixed(1)}mm`);

  return {
    last_7_days: Math.round(last7Days * 100) / 100,  // Round to 2 decimal places
    last_30_days: Math.round(last30Days * 100) / 100,
    year_to_date: Math.round(yearToDate * 100) / 100,
  };
}

serve(async (req) => {
  try {
    console.log('🌧️  Fetch Precipitation Summary Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each city
    for (const city of CITIES) {
      try {
        // Get city_id from database
        const { data: cityData, error: cityError } = await supabase
          .from('meteorology_cities')
          .select('id')
          .eq('name', city.name)
          .single();

        if (cityError || !cityData) {
          throw new Error(`City not found in database: ${city.name}`);
        }

        // Fetch precipitation summary
        const summary = await fetchCityPrecipitationSummary(city);

        // Upsert into database
        const { error: upsertError } = await supabase
          .from('precipitation_summary')
          .upsert({
            city_id: cityData.id,
            last_7_days: summary.last_7_days,
            last_30_days: summary.last_30_days,
            year_to_date: summary.year_to_date,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'city_id',
          });

        if (upsertError) {
          throw upsertError;
        }

        successCount++;
        results.push({
          city: city.name,
          status: 'success',
          data: summary,
        });
      } catch (error) {
        failureCount++;
        results.push({
          city: city.name,
          status: 'error',
          error: sanitizeError(error, 'Failed to fetch precipitation data'),
        });
        console.error(`❌ Error for ${city.name}:`, error.message);
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Fetch Precipitation Summary - Completed`);
    console.log(`   Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          total: CITIES.length,
          success: successCount,
          failed: failureCount,
        },
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Fetch Precipitation Summary Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: sanitizeError(error, 'Failed to fetch precipitation summary'),
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
