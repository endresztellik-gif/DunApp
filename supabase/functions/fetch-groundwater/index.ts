/**
 * Groundwater Data Fetch Edge Function (OPTIMIZED)
 *
 * Fetches 60-day groundwater level data from vizadat.hu API for 15 monitoring wells
 * in the Duna-Dráva region. Implements daily caching to avoid unnecessary API calls.
 *
 * OPTIMIZATIONS:
 * - Parallel processing using Promise.allSettled()
 * - 30-second timeout per API request
 * - Batch cache checking (all wells at once)
 * - Concurrent API fetches (up to 15 parallel)
 * - Better error isolation (one well failure doesn't block others)
 *
 * API Source: https://vizadat.hu/api/v1/observations
 * Parameter: talajvízszint (groundwater level)
 * Wells: 15 monitoring wells from Sátorhely to Báta
 *
 * Schedule: Daily at 05:00 AM via pg_cron
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { sanitizeError } from '../_shared/error-sanitizer.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 15 monitoring wells
const WELLS = [
  { name: 'Sátorhely', code: '4576' },
  { name: 'Mohács II.', code: '912' },
  { name: 'Kölked', code: '1461' },
  { name: 'Mohács', code: '1460' },
  { name: 'Mohács-Sárhát', code: '4481' },
  { name: 'Dávod', code: '448' },
  { name: 'Hercegszántó', code: '1450' },
  { name: 'Nagybaracska', code: '4479' },
  { name: 'Szeremle', code: '132042' },
  { name: 'Alsónyék', code: '662' },
  { name: 'Érsekcsanád', code: '1426' },
  { name: 'Decs', code: '658' },
  { name: 'Szekszárd-Borrév', code: '656' },
  { name: 'Őcsény', code: '653' },
  { name: 'Báta', code: '660' }
];

const DAYS = 60;
const PARAM = 'talajvízszint';
const API_TIMEOUT_MS = 30000; // 30 seconds per API request

interface VizadatObservation {
  time: string;
  value: number;
}

interface VizadatResponse {
  data: VizadatObservation[];
}

interface WellConfig {
  name: string;
  code: string;
}

interface ProcessResult {
  wellName: string;
  status: 'cached' | 'fetched' | 'failed';
  recordCount?: number;
  error?: string;
}

/**
 * Fetch with timeout helper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Check if well data exists for today (cache check)
 */
async function checkWellCache(wellCode: string, today: string): Promise<boolean> {
  const { data: wellData } = await supabase
    .from('groundwater_wells')
    .select('id')
    .eq('well_code', wellCode)
    .single();

  if (!wellData) {
    return false;
  }

  const { data: existingData, error: checkError } = await supabase
    .from('groundwater_data')
    .select('id')
    .eq('well_id', wellData.id)
    .gte('timestamp', `${today}T00:00:00Z`)
    .lte('timestamp', `${today}T23:59:59Z`)
    .limit(1)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    console.warn(`⚠️ Cache check error for ${wellCode}:`, checkError.message);
    return false;
  }

  return !!existingData;
}

/**
 * Process a single well: fetch from API and insert into database
 */
async function processWell(
  well: WellConfig,
  fromDate: Date,
  toDate: Date
): Promise<ProcessResult> {
  try {
    console.log(`🔹 ${well.name}: fetching new data...`);

    // Fetch from vizadat.hu API with timeout
    const url = new URL('https://vizadat.hu/api/v1/observations');
    url.searchParams.set('site_name', well.name);
    url.searchParams.set('parameter', PARAM);
    url.searchParams.set('from', fromDate.toISOString().split('T')[0]);
    url.searchParams.set('to', toDate.toISOString().split('T')[0]);

    const response = await fetchWithTimeout(
      url.toString(),
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DunApp PWA/1.0 (contact@dunapp.hu)'
        }
      },
      API_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: VizadatResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      console.log(`⚠️ No data available for ${well.name}`);
      return {
        wellName: well.name,
        status: 'failed',
        error: 'No data available from API'
      };
    }

    // Get well_id from database
    const { data: wellData, error: wellError } = await supabase
      .from('groundwater_wells')
      .select('id')
      .eq('well_code', well.code)
      .single();

    if (wellError || !wellData) {
      throw new Error(`Well not found in database: ${well.name} (${well.code})`);
    }

    // Insert observations into database
    const observations = data.data.map(obs => ({
      well_id: wellData.id,
      water_level_meters: obs.value,
      timestamp: obs.time,
      created_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('groundwater_data')
      .upsert(observations, {
        onConflict: 'well_id,timestamp',
        ignoreDuplicates: true
      });

    if (insertError) {
      throw new Error(`Insert error: ${insertError.message}`);
    }

    console.log(`✅ ${well.name}: ${observations.length} records inserted`);

    return {
      wellName: well.name,
      status: 'fetched',
      recordCount: observations.length
    };

  } catch (error) {
    console.error(`❌ Error fetching ${well.name}:`, error);
    return {
      wellName: well.name,
      status: 'failed',
      error: sanitizeError(error, 'Failed to fetch well data')
    };
  }
}

serve(async (req) => {
  try {
    console.log('🌊 Starting OPTIMIZED groundwater data fetch...');
    const startTime = Date.now();

    const today = new Date().toISOString().split('T')[0];
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - DAYS);

    // STEP 1: Parallel cache check for all wells
    console.log('🔍 Step 1: Checking cache for all 15 wells (parallel)...');
    const cacheCheckStart = Date.now();

    const cacheResults = await Promise.allSettled(
      WELLS.map(well => checkWellCache(well.code, today))
    );

    const wellsToFetch: WellConfig[] = [];
    const cachedWells: string[] = [];

    WELLS.forEach((well, index) => {
      const cacheResult = cacheResults[index];
      if (cacheResult.status === 'fulfilled' && cacheResult.value === true) {
        cachedWells.push(well.name);
        console.log(`🟡 ${well.name}: using cached data`);
      } else {
        wellsToFetch.push(well);
      }
    });

    console.log(`✅ Cache check complete in ${Date.now() - cacheCheckStart}ms`);
    console.log(`   - Cached: ${cachedWells.length} wells`);
    console.log(`   - To fetch: ${wellsToFetch.length} wells`);

    // STEP 2: Parallel fetch for wells not in cache
    let results: ProcessResult[] = [];

    if (wellsToFetch.length > 0) {
      console.log(`🚀 Step 2: Fetching ${wellsToFetch.length} wells (parallel)...`);
      const fetchStart = Date.now();

      const fetchResults = await Promise.allSettled(
        wellsToFetch.map(well => processWell(well, fromDate, toDate))
      );

      results = fetchResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            wellName: wellsToFetch[index].name,
            status: 'failed' as const,
            error: result.reason?.message || 'Unknown error'
          };
        }
      });

      console.log(`✅ Fetch complete in ${Date.now() - fetchStart}ms`);
    }

    // Calculate summary
    const successCount = results.filter(r => r.status === 'fetched').length;
    const failCount = results.filter(r => r.status === 'failed').length;
    const cacheHitCount = cachedWells.length;

    const errors = results
      .filter(r => r.status === 'failed' && r.error)
      .map(r => `${r.wellName}: ${r.error}`);

    const totalTime = Date.now() - startTime;

    const summary = {
      status: 'completed',
      timestamp: new Date().toISOString(),
      execution_time_ms: totalTime,
      wells_total: WELLS.length,
      wells_fetched: successCount,
      wells_cached: cacheHitCount,
      wells_failed: failCount,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('📊 Groundwater fetch summary:', summary);
    console.log(`⏱️  Total execution time: ${totalTime}ms`);

    return new Response(
      JSON.stringify(summary, null, 2),
      {
        headers: { 'Content-Type': 'application/json' },
        status: failCount === WELLS.length ? 500 : 200
      }
    );

  } catch (error) {
    console.error('💥 Fatal error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: sanitizeError(error, 'Failed to process groundwater data')
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
