/**
 * Groundwater Data Fetch Edge Function — data.vizugy REST (adatFajtaKod=69), PHP fallback
 *
 * PRIMARY source: data.vizugy.hu REST API (vmservice.vizugy.hu/vraquery)
 *   - Station list:  InternetVmo/12  (groundwater wells, törzsszám = well_code)
 *   - Time series:   TS/TsShortList, adatFajtaKod=69 (Talajvízállás, cm), UTC timestamps
 *   This is the official, authenticated, future-proof contract — the same client
 *   the water-level function uses (supabase/functions/_shared/vizugy-api-client.ts).
 *
 * FALLBACK source: legacy vizugy.hu PHP chart endpoint (talajvizkut_grafikon),
 *   used only for wells the REST API returns no data for.
 *
 * IMPORTANT — datum: REST and the legacy PHP scrape report the same groundwater
 * signal from DIFFERENT reference points (a constant per-well offset, ~0.5–0.8 m).
 * To avoid a step discontinuity, the historical PHP-datum data is replaced with a
 * full REST re-fetch ONCE at go-live via `?backfill=true` (see below). After that
 * the whole series is single-datum (REST); the daily cron just appends REST data.
 *
 * Wells: loaded from the `groundwater_wells` table (ALL wells, regardless of
 * `enabled` — disabled Duna wells and not-yet-live Dráva wells get data too; the
 * frontend decides visibility). well_code = vizugy törzsszám.
 *
 * Query params:
 *   ?days=N        Lookback window in days (default 7 for the cron).
 *   ?backfill=true Full re-base: window defaults to 400 days and existing rows for
 *                  each well are DELETED before insert (single-datum clean history).
 *                  Run ONCE at go-live; not used by the daily cron.
 *
 * Cron: daily at 05:00 UTC (smart — only when ≥5 days since last data).
 * Rewritten: 2026-06-23 (REST-first migration + Dráva expansion).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { sanitizeError } from '../_shared/error-sanitizer.ts';
import { fetchTimeSeries, DATA_TYPE } from '../_shared/vizugy-api-client.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PHP_BASE_URL = 'https://www.vizugy.hu/talajvizkut_grafikon/index.php';
const PHP_TIMEOUT_MS = 30000;
const REST_BATCH_SIZE = 6; // wells per REST time-series request (keeps responses small)
const CRON_LOOKBACK_DAYS = 7;
const BACKFILL_LOOKBACK_DAYS = 400;

interface WellRow {
  id: string;
  well_code: string;
  well_name: string;
}

interface Reading {
  /** UTC ISO timestamp. */
  timestamp: string;
  /** Stored value: depth below reference in meters, negative (matches legacy convention). */
  waterLevelMeters: number;
}

interface ProcessResult {
  wellName: string;
  source: 'rest' | 'php' | 'none';
  status: 'fetched' | 'failed' | 'empty';
  recordCount?: number;
  error?: string;
}

/** REST cm value → stored meters (depth below reference, negative). */
function cmToMeters(valueCm: number): number {
  return -Math.abs(valueCm / 100);
}

// ─── REST (primary) ────────────────────────────────────────────────────────────

/** Fetch groundwater-level time series for a list of törzsszám in batches. */
async function fetchRestReadings(
  tszList: number[],
  start: Date,
  end: Date,
): Promise<Map<number, Reading[]>> {
  const byTsz = new Map<number, Reading[]>();

  for (let i = 0; i < tszList.length; i += REST_BATCH_SIZE) {
    const batch = tszList.slice(i, i + REST_BATCH_SIZE);
    const series = await fetchTimeSeries(batch, start, end, DATA_TYPE.GROUNDWATER_LEVEL);
    for (const s of series) {
      byTsz.set(
        s.tsz,
        s.readings.map((r) => ({
          timestamp: r.utcTime,
          waterLevelMeters: cmToMeters(r.valueCm),
        })),
      );
    }
  }

  return byTsz;
}

// ─── PHP (fallback) ──────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Parse the legacy chartView() call.
 *   OLD: chartView([values],[timestamps],[],[meta])
 *   NEW: chartView("CODE",[values],[timestamps],[],[meta])
 * Timestamps are LOCAL time ("YYYY-MM-DD HH:MM:SS…") → converted to UTC on read.
 */
function parsePhpReadings(html: string): Reading[] {
  const pattern =
    /chartView\s*\(\s*(?:"[^"]*"\s*,\s*)?(\[.*?\])\s*,\s*(\[.*?\])\s*,\s*\[.*?\]\s*,\s*\[.*?\]\s*\)/s;
  const match = html.match(pattern);
  if (!match) return [];

  let values: string[];
  let timestamps: string[];
  try {
    values = JSON.parse(match[1]);
    timestamps = JSON.parse(match[2]);
  } catch {
    return [];
  }

  const readings: Reading[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const num = parseFloat(values[i]);
    if (Number.isNaN(num)) continue;
    // Local CEST/CET → UTC. June is CEST (UTC+2); use a fixed -2h (legacy data is summer-heavy).
    const local = new Date(timestamps[i].slice(0, 19).replace(' ', 'T') + 'Z');
    local.setUTCHours(local.getUTCHours() - 2);
    readings.push({ timestamp: local.toISOString(), waterLevelMeters: cmToMeters(num) });
  }
  return readings;
}

async function fetchPhpReadings(wellCode: string): Promise<Reading[]> {
  const res = await fetchWithTimeout(`${PHP_BASE_URL}?torzsszam=${wellCode}`, PHP_TIMEOUT_MS);
  if (!res.ok) throw new Error(`PHP HTTP ${res.status}`);
  return parsePhpReadings(await res.text());
}

// ─── Persistence ─────────────────────────────────────────────────────────────────

async function persistReadings(
  well: WellRow,
  readings: Reading[],
  replace: boolean,
): Promise<void> {
  if (replace) {
    const { error } = await supabase.from('groundwater_data').delete().eq('well_id', well.id);
    if (error) throw new Error(`delete failed: ${error.message}`);
  }

  const rows = readings.map((r) => ({
    well_id: well.id,
    water_level_meters: r.waterLevelMeters,
    timestamp: r.timestamp,
    created_at: new Date().toISOString(),
  }));

  // Insert in chunks to stay within payload limits.
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('groundwater_data')
      .upsert(rows.slice(i, i + CHUNK), { onConflict: 'well_id,timestamp', ignoreDuplicates: true });
    if (error) throw new Error(`insert failed: ${error.message}`);
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const backfill = url.searchParams.get('backfill') === 'true';
    const days = Number(url.searchParams.get('days')) ||
      (backfill ? BACKFILL_LOOKBACK_DAYS : CRON_LOOKBACK_DAYS);

    const end = new Date();
    const start = new Date(end.getTime() - days * 86_400_000);

    console.log(`🌊 Groundwater fetch — REST-first, ${days}d window${backfill ? ' (BACKFILL/replace)' : ''}`);

    const { data: wells, error: wellsError } = await supabase
      .from('groundwater_wells')
      .select('id, well_code, well_name');
    if (wellsError) throw new Error(`load wells: ${wellsError.message}`);
    if (!wells || wells.length === 0) throw new Error('no wells in groundwater_wells');

    // 1. Primary: one batched REST fetch for every well.
    const tszList = wells.map((w) => Number(w.well_code)).filter((n) => Number.isFinite(n));
    let restByTsz = new Map<number, Reading[]>();
    try {
      restByTsz = await fetchRestReadings(tszList, start, end);
    } catch (error) {
      console.error('❌ REST batch failed, every well falls back to PHP:', (error as Error).message);
    }

    // 2. Per well: use REST if it returned data, else PHP fallback.
    const results = await Promise.all(
      (wells as WellRow[]).map(async (well): Promise<ProcessResult> => {
        try {
          const tsz = Number(well.well_code);
          let readings = restByTsz.get(tsz) ?? [];
          let source: ProcessResult['source'] = readings.length > 0 ? 'rest' : 'none';

          if (readings.length === 0) {
            try {
              readings = await fetchPhpReadings(well.well_code);
              if (readings.length > 0) source = 'php';
            } catch (phpError) {
              console.warn(`⚠️ PHP fallback failed for ${well.well_name}:`, (phpError as Error).message);
            }
          }

          if (readings.length === 0) {
            return { wellName: well.well_name, source: 'none', status: 'empty', recordCount: 0 };
          }

          await persistReadings(well, readings, backfill);
          console.log(`✅ ${well.well_name}: ${readings.length} via ${source}${backfill ? ' (replaced)' : ''}`);
          return { wellName: well.well_name, source, status: 'fetched', recordCount: readings.length };
        } catch (error) {
          console.error(`❌ ${well.well_name}:`, (error as Error).message);
          return {
            wellName: well.well_name,
            source: 'none',
            status: 'failed',
            error: sanitizeError(error, 'Failed to process well'),
          };
        }
      }),
    );

    const summary = {
      status: 'completed',
      mode: backfill ? 'backfill' : 'cron',
      window_days: days,
      wells_total: wells.length,
      wells_rest: results.filter((r) => r.source === 'rest').length,
      wells_php: results.filter((r) => r.source === 'php').length,
      wells_empty: results.filter((r) => r.status === 'empty').length,
      wells_failed: results.filter((r) => r.status === 'failed').length,
      records_total: results.reduce((s, r) => s + (r.recordCount || 0), 0),
      timestamp: new Date().toISOString(),
    };
    console.log('📊 Summary:', summary);

    const allFailed = results.every((r) => r.status === 'failed');
    return new Response(JSON.stringify(summary, null, 2), {
      headers: { 'Content-Type': 'application/json' },
      status: allFailed ? 500 : 200,
    });
  } catch (error) {
    console.error('💥 Fatal:', error);
    return new Response(
      JSON.stringify({ error: sanitizeError(error, 'Failed to process groundwater data') }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
