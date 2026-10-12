/**
 * DunApp PWA - Fetch Measured Precipitation Edge Function
 *
 * PURPOSE:
 * A meglévő Open-Meteo alapú `fetch-precipitation-summary` MELLETT, párhuzamosan futó rendszer,
 * amely valódi mérőállomási adatból számolja a 7 napos, 30 napos és tárgyévi csapadékot.
 *
 * DATA SOURCE:
 * HungaroMet Meteorológiai Adattár (odp.met.hu), napi csapadékmérők (HABP_1RD).
 *   - napi mód:  weather/weather_reports/synoptic/hungary/daily_rain/csv/HABP_1RD_YYYYMMDD.csv.zip
 *                (egy fájl = egy nap, ~198 állomás; a mappa csak az utolsó ~9 napot tartja meg)
 *   - visszatöltés: climate/observations_hungary/daily_rain/recent/HABP_1RD_<állomás>_akt.zip
 *                (állomásonként az év eleje óta, de csak a lezárt hónapokig)
 *
 * METHOD (supabase/functions/_shared/precipitation-geo.ts):
 *   - legközelebbi állomás ≤ 10 km  → közvetlen állomásérték
 *   - különben 2–4 állomás ≤ 30 km → IDW (távolsággal súlyozott átlag)
 *   - különben nincs érték (nem 0 mm!)
 *   - a tárgyév mindig az adott év január 1-jétől számolódik
 *
 * SCHEDULE: naponta 07:30 UTC (pg_cron, migration 031). Minden futás az ÖSSZES elérhető napi
 * fájlt feldolgozza (idempotens upsert), így a kiesett vagy késve érkező nap magától pótlódik.
 *
 * BACKFILL: POST ?backfill=YYYY + `x-backfill-token` fejléc (PRECIP_BACKFILL_TOKEN secret).
 * A token nélkül a visszatöltés tiltott. A mért adattal nem fedett napokat Open-Meteo Archive
 * értékkel tölti ki, `method='model'` jelöléssel (a UI külön mutatja).
 *
 * Forrásmegjelölés: Adatbázis: Meteorológiai Adattár, HungaroMet Nonprofit Zrt.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { unzipSync } from 'https://esm.sh/fflate@0.8.2';
import { sanitizeError } from '../_shared/error-sanitizer.ts';
import {
  estimateForCity,
  haversineKm,
  parseStationYearFile,
  parseSynopticDailyRain,
  shiftIsoDate,
  stationsNearCity,
  summarizeWindows,
  type CityEstimate,
  type CityRef,
  type DailyValue,
  type Station,
  type StationReading,
} from '../_shared/precipitation-geo.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const BACKFILL_TOKEN = Deno.env.get('PRECIP_BACKFILL_TOKEN');

const ODP = 'https://odp.met.hu';
const SYNOPTIC_DIR = `${ODP}/weather/weather_reports/synoptic/hungary/daily_rain/csv/`;
const STATION_META_URL = `${ODP}/climate/observations_hungary/meta/station_meta_daily_rain.csv`;
const recentStationUrl = (stationId: string) =>
  `${ODP}/climate/observations_hungary/daily_rain/recent/HABP_1RD_${stationId}_akt.zip`;

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const BACKFILL_CONCURRENCY = 6;
const UPSERT_BATCH = 500;

// ---------------------------------------------------------------------------
// HTTP / ZIP segédek
// ---------------------------------------------------------------------------

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok || response.status === 404) return response;
      lastError = new Error(`HTTP ${response.status} ${url}`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Fetch failed: ${url}`);
}

/** Letölt egy ZIP-et és az első .csv fájl szövegét adja vissza (UTF-8). null: 404. */
async function fetchZippedCsv(url: string): Promise<string | null> {
  const response = await fetchWithRetry(url);
  if (response.status === 404) return null;
  const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const csvName = Object.keys(files).find((name) => name.toLowerCase().endsWith('.csv'));
  if (!csvName) throw new Error(`Nincs CSV a ZIP-ben: ${url}`);
  return new TextDecoder('utf-8').decode(files[csvName]);
}

/** Az elérhető napi fájlok (YYYY-MM-DD → URL), dátum szerint növekvő sorrendben. */
async function listSynopticFiles(): Promise<Array<{ date: string; url: string }>> {
  const response = await fetchWithRetry(SYNOPTIC_DIR);
  if (!response.ok) throw new Error(`Synoptic directory HTTP ${response.status}`);
  const html = await response.text();
  const dates = new Set<string>();
  for (const match of html.matchAll(/HABP_1RD_(\d{8})\.csv\.zip/g)) dates.add(match[1]);
  return [...dates]
    .sort()
    .map((compact) => ({
      date: `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`,
      url: `${SYNOPTIC_DIR}HABP_1RD_${compact}.csv.zip`,
    }));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

// deno-lint-ignore no-explicit-any
async function upsertInBatches(supabase: any, table: string, rows: unknown[], onConflict: string) {
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const { error } = await supabase
      .from(table)
      .upsert(rows.slice(i, i + UPSERT_BATCH), { onConflict });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Adatgyűjtés
// ---------------------------------------------------------------------------

async function loadSynopticReadings(): Promise<StationReading[]> {
  const files = await listSynopticFiles();
  if (files.length === 0) throw new Error('A napi csapadékmérő mappa üres');

  const readings: StationReading[] = [];
  for (const file of files) {
    const csv = await fetchZippedCsv(file.url);
    if (csv) readings.push(...parseSynopticDailyRain(csv));
  }
  return readings;
}

/** Az év elejétől a lezárt hónapokig: a városok közelében lévő állomások éves fájljai. */
async function loadYearReadings(cities: CityRef[], year: number): Promise<StationReading[]> {
  const metaResponse = await fetchWithRetry(STATION_META_URL);
  if (!metaResponse.ok) throw new Error(`Station meta HTTP ${metaResponse.status}`);
  const metaText = await metaResponse.text();

  // StationNumber;StartDate; EndDate;Latitude;Longitude;Elevation;StationName;RegioName;EOR
  const stations: Station[] = [];
  for (const line of metaText.split(/\r?\n/).slice(1)) {
    const cells = line.split(';').map((cell) => cell.trim());
    if (!/^\d+$/.test(cells[0] ?? '')) continue;
    const endDate = cells[2];
    if (!endDate || endDate < `${year}0101`) continue; // már nem működő állomás
    const lat = Number(cells[3]);
    const lon = Number(cells[4]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    stations.push({ id: cells[0], name: cells[6] ?? '', lat, lon, elevation: Number(cells[5]) || null });
  }

  const needed = new Map<string, Station>();
  for (const city of cities) {
    for (const station of stationsNearCity(city, stations)) needed.set(station.id, station);
  }
  console.log(`[Backfill] ${needed.size} állomás a városok 30 km-es körzetében`);

  const perStation = await mapWithConcurrency([...needed.keys()], BACKFILL_CONCURRENCY, async (id) => {
    try {
      const csv = await fetchZippedCsv(recentStationUrl(id));
      return csv ? parseStationYearFile(csv) : [];
    } catch (error) {
      console.warn(`[Backfill] ${id} kihagyva:`, (error as Error).message);
      return [];
    }
  });

  return perStation.flat().filter((reading) => reading.date.startsWith(`${year}-`));
}

/** Open-Meteo Archive napi értékei (csak a mérés nélküli napok pótlására). */
async function fetchModelDaily(city: CityRef, start: string, end: string): Promise<Map<string, number>> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${city.lat}&longitude=${city.lon}` +
    `&start_date=${start}&end_date=${end}&daily=precipitation_sum&timezone=Europe/Budapest`;
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`Open-Meteo Archive HTTP ${response.status}`);
  const data = await response.json();
  const times: string[] = data.daily?.time ?? [];
  const values: Array<number | null> = data.daily?.precipitation_sum ?? [];
  const result = new Map<string, number>();
  times.forEach((date, i) => {
    const value = values[i];
    if (value !== null && value !== undefined) result.set(date, value);
  });
  return result;
}

// ---------------------------------------------------------------------------
// Feldolgozás
// ---------------------------------------------------------------------------

function groupByDate(readings: StationReading[]): Map<string, StationReading[]> {
  // Ugyanaz az állomás+nap többféle forrásból is jöhet → az utolsó érték marad, duplikáció nélkül.
  const unique = new Map<string, StationReading>();
  for (const reading of readings) unique.set(`${reading.id}|${reading.date}`, reading);
  const byDate = new Map<string, StationReading[]>();
  for (const reading of unique.values()) {
    const list = byDate.get(reading.date) ?? [];
    list.push(reading);
    byDate.set(reading.date, list);
  }
  return byDate;
}

serve(async (req) => {
  try {
    console.log('🌧️  Fetch Measured Precipitation - Starting');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // --- mód ---
    const backfillParam = new URL(req.url).searchParams.get('backfill');
    let backfillYear: number | null = null;
    if (backfillParam !== null) {
      const year = Number(backfillParam);
      const thisYear = new Date().getUTCFullYear();
      if (!BACKFILL_TOKEN || req.headers.get('x-backfill-token') !== BACKFILL_TOKEN) {
        return new Response(JSON.stringify({ success: false, error: 'Backfill not allowed' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 403,
        });
      }
      if (!Number.isInteger(year) || year < thisYear - 1 || year > thisYear) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid backfill year' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      backfillYear = year;
    }

    // --- városok ---
    const { data: cityRows, error: cityError } = await supabase
      .from('meteorology_cities')
      .select('id, name, latitude, longitude')
      .eq('is_active', true);
    if (cityError || !cityRows?.length) {
      throw new Error(`Cities not available: ${cityError?.message ?? 'empty'}`);
    }
    const cities: CityRef[] = cityRows.map(
      (row: { id: string; name: string; latitude: number; longitude: number }) => ({
        id: row.id,
        name: row.name,
        lat: Number(row.latitude),
        lon: Number(row.longitude),
      })
    );

    // --- mérések ---
    const synoptic = await loadSynopticReadings();
    const yearReadings = backfillYear ? await loadYearReadings(cities, backfillYear) : [];
    const byDate = groupByDate([...yearReadings, ...synoptic]);
    const synopticDates = [...new Set(synoptic.map((reading) => reading.date))].sort();
    const dataThrough = synopticDates[synopticDates.length - 1];
    if (!dataThrough) throw new Error('A napi fájlokban nincs érvényes mérés');
    const dates = [...byDate.keys()].sort();

    // --- nyers állomásadat (csak a városok 30 km-es körzetéből) ---
    const stationRows = [...byDate.values()]
      .flat()
      .filter((reading) => cities.some((city) => stationsNearCity(city, [reading]).length > 0))
      .map((reading) => ({
        station_id: reading.id,
        obs_date: reading.date,
        mm: reading.mm,
        station_name: reading.name,
        lat: reading.lat,
        lon: reading.lon,
        elevation: reading.elevation,
        updated_at: new Date().toISOString(),
      }));
    await upsertInBatches(supabase, 'precipitation_station_daily', stationRows, 'station_id,obs_date');

    // --- városonkénti napi értékek ---
    const lastEstimate = new Map<string, { estimate: CityEstimate; date: string }>();
    const dailyRows: Array<Record<string, unknown>> = [];
    for (const city of cities) {
      for (const date of dates) {
        const estimate = estimateForCity(city, byDate.get(date) ?? []);
        if (!estimate) continue;
        dailyRows.push({
          city_id: city.id,
          obs_date: date,
          mm: estimate.mm,
          method: estimate.method,
          n_stations: estimate.nStations,
          nearest_km: estimate.nearestKm,
          updated_at: new Date().toISOString(),
        });
        lastEstimate.set(city.id, { estimate, date }); // dátum szerint növekvő → az utolsó marad
      }
    }

    // --- visszatöltés: a mérés nélküli napok pótlása modellértékkel (csak mért városokra) ---
    let modelFilled = 0;
    if (backfillYear) {
      const yearStart = `${backfillYear}-01-01`;
      const modelEnd = shiftIsoDate(dataThrough, -8); // az ERA5 ~5 napos késése + biztonsági tartalék
      const have = new Set(dailyRows.map((row) => `${row.city_id}|${row.obs_date}`));
      const citiesWithStations = new Set(dailyRows.map((row) => row.city_id as string));

      for (const city of cities.filter((c) => citiesWithStations.has(c.id))) {
        const missing: string[] = [];
        for (let d = yearStart; d <= modelEnd; d = shiftIsoDate(d, 1)) {
          if (!have.has(`${city.id}|${d}`)) missing.push(d);
        }
        if (missing.length === 0) continue;
        try {
          const model = await fetchModelDaily(city, missing[0], missing[missing.length - 1]);
          for (const date of missing) {
            const mm = model.get(date);
            if (mm === undefined) continue;
            dailyRows.push({
              city_id: city.id,
              obs_date: date,
              mm: Math.round(mm * 10) / 10,
              method: 'model',
              n_stations: 0,
              nearest_km: null,
              updated_at: new Date().toISOString(),
            });
            modelFilled++;
          }
        } catch (error) {
          console.error(`[Backfill] Open-Meteo pótlás sikertelen (${city.name}):`, error);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    await upsertInBatches(supabase, 'precipitation_city_daily', dailyRows, 'city_id,obs_date');

    // --- összesítés városonként ---
    const { data: oldRows } = await supabase
      .from('precipitation_summary')
      .select('city_id, last_7_days, last_30_days, year_to_date');
    interface OldSummary {
      city_id: string;
      last_7_days: number | null;
      last_30_days: number | null;
      year_to_date: number | null;
    }
    const oldByCity = new Map<string, OldSummary>(
      (oldRows ?? []).map((row: OldSummary) => [row.city_id, row])
    );

    const windowStart = [`${dataThrough.slice(0, 4)}-01-01`, shiftIsoDate(dataThrough, -29)].sort()[0];
    const results = [];
    const summaryRows = [];
    const compareRows = [];
    const logDate = new Date().toISOString().slice(0, 10);

    for (const city of cities) {
      // Összesítést csak az kap, akinek az ÉLŐ napi feedben (synoptic) is van mérőállomása:
      // az éves fájlban szereplő, de a napi feedből hiányzó állomás értéke nem frissülne,
      // az összesítés csendben elavulna. Ilyenkor a meglévő sort töröljük (nincs mért adat).
      const latest = lastEstimate.get(city.id);
      if (!latest || latest.date < synopticDates[0]) {
        const { error: deleteError } = await supabase
          .from('precipitation_measured_summary')
          .delete()
          .eq('city_id', city.id);
        if (deleteError) throw new Error(`summary delete: ${deleteError.message}`);
        results.push({ city: city.name, status: 'no-station' });
        continue;
      }
      const { estimate } = latest;

      const { data: dailyData, error: dailyError } = await supabase
        .from('precipitation_city_daily')
        .select('obs_date, mm, method')
        .eq('city_id', city.id)
        .gte('obs_date', windowStart)
        .lte('obs_date', dataThrough)
        .order('obs_date');
      if (dailyError) throw new Error(`city_daily read: ${dailyError.message}`);

      const daily: DailyValue[] = (dailyData ?? []).map(
        (row: { obs_date: string; mm: number; method: DailyValue['method'] }) => ({
          date: row.obs_date,
          mm: Number(row.mm),
          method: row.method,
        })
      );
      const totals = summarizeWindows(daily, dataThrough);

      const lastDayReadings = byDate.get(latest.date);
      const stationList = estimate.stationIds.map((id) => {
        const reading = lastDayReadings?.find((r) => r.id === id);
        return {
          id,
          name: reading?.name ?? id,
          km: reading
            ? Math.round(haversineKm(city.lat, city.lon, reading.lat, reading.lon) * 10) / 10
            : null,
        };
      });

      summaryRows.push({
        city_id: city.id,
        last_7_days: totals.last7Days,
        last_30_days: totals.last30Days,
        year_to_date: totals.yearToDate,
        days_available_7: totals.daysAvailable7,
        days_available_30: totals.daysAvailable30,
        days_measured_ytd: totals.daysMeasuredYtd,
        days_modeled_ytd: totals.daysModeledYtd,
        days_expected_ytd: totals.daysExpectedYtd,
        data_through: dataThrough,
        method: estimate.method,
        stations: stationList,
        nearest_km: estimate.nearestKm,
        updated_at: new Date().toISOString(),
      });

      const old = oldByCity.get(city.id);
      compareRows.push({
        city_id: city.id,
        log_date: logDate,
        old_7: old?.last_7_days ?? null,
        old_30: old?.last_30_days ?? null,
        old_ytd: old?.year_to_date ?? null,
        new_7: totals.last7Days,
        new_30: totals.last30Days,
        new_ytd: totals.yearToDate,
        method: estimate.method,
      });

      results.push({
        city: city.name,
        status: 'success',
        method: estimate.method,
        nearestKm: estimate.nearestKm,
        yearToDate: totals.yearToDate,
        daysMeasured: totals.daysMeasuredYtd,
        daysModeled: totals.daysModeledYtd,
        daysExpected: totals.daysExpectedYtd,
      });
      console.log(
        `✅ ${city.name}: ${estimate.method}, 7d=${totals.last7Days}mm, 30d=${totals.last30Days}mm, YTD=${totals.yearToDate}mm ` +
          `(${totals.daysMeasuredYtd}+${totals.daysModeledYtd}/${totals.daysExpectedYtd} nap)`
      );
    }

    await upsertInBatches(supabase, 'precipitation_measured_summary', summaryRows, 'city_id');
    await upsertInBatches(supabase, 'precipitation_compare_log', compareRows, 'city_id,log_date');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        mode: backfillYear ? `backfill-${backfillYear}` : 'daily',
        dataThrough,
        filesProcessed: synopticDates.length,
        modelFilledDays: modelFilled,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Fetch Measured Precipitation Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: sanitizeError(error, 'Failed to fetch measured precipitation'),
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
