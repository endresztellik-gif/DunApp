/**
 * DunApp PWA - Fetch FTCS (Karapancsa) Water Level
 *
 * Primary:  vizugy.hu REST API — TSZ 130033 (Hercegszántó-Karapancsa alvíz, FTCS)
 * Fallback: vizugy.hu HTML scraping — VOA 164960F8-97AB-11D4-BB62-00508BA24287
 *
 * The vmservice REST API may not carry data for smaller canal/pump stations,
 * so the original HTML scraper is kept as a fallback.
 * Schedule: Daily at 9:00 AM
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sanitizeError } from '../_shared/error-sanitizer.ts';
import { fetchTimeSeries, DATA_TYPE } from '../_shared/vizugy-api-client.ts';

const FTCS_TSZ = 130033;
const FTCS_VOA_URL =
  'https://www.vizugy.hu/?mapModule=OpGrafikon&AllomasVOA=164960F8-97AB-11D4-BB62-00508BA24287&mapData=OrasIdosor';
const FETCH_DAYS = 7;

interface DailyReading {
  utcTime: string;
  valueCm: number;
}

/** Select one reading per day, preferring 04:00 UTC (= 06:00 Budapest). */
function selectDailyReadings(
  readings: { utcTime: string; valueCm: number }[]
): Map<string, DailyReading> {
  const map = new Map<string, DailyReading>();
  for (const r of readings) {
    const d = new Date(r.utcTime);
    const dayKey = d.toISOString().split('T')[0];
    const h = d.getUTCHours();
    if (!map.has(dayKey)) {
      map.set(dayKey, r);
    } else {
      const existingH = new Date(map.get(dayKey)!.utcTime).getUTCHours();
      if (Math.abs(h - 4) < Math.abs(existingH - 4)) map.set(dayKey, r);
    }
  }
  return map;
}

/** HTML scraping fallback — original method. */
async function scrapeFromHtml(): Promise<Map<string, DailyReading>> {
  const response = await fetch(FTCS_VOA_URL);
  const html = await response.text();

  const pattern =
    /<tr[^>]*>\s*<td[^>]*><strong>([\d.]+\.\s+\d{2}:\d{2})<\/strong><\/td>\s*<td[^>]*><strong>(\d+)<\/strong><\/td>/gi;

  const readings: DailyReading[] = [];
  let m;
  while ((m = pattern.exec(html)) !== null) {
    const ts = m[1].trim();
    const val = parseInt(m[2], 10);
    const parts = ts.match(/(\d{4})\.(\d{2})\.(\d{2})\.\s+(\d{2}):(\d{2})/);
    if (!parts || isNaN(val)) continue;
    const [, y, mo, d, h, min] = parts;
    readings.push({ utcTime: `${y}-${mo}-${d}T${h}:${min}:00Z`, valueCm: val });
  }

  if (readings.length === 0) throw new Error('No data in HTML scrape for FTCS');
  return selectDailyReadings(readings);
}

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('💧 Fetch FTCS (Karapancsa) Water Level - Starting');

    let dailyMap: Map<string, DailyReading>;
    let sourceUsed = 'vizugy.hu';

    // Try REST API first
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - FETCH_DAYS * 24 * 3600 * 1000);
      const [series] = await fetchTimeSeries([FTCS_TSZ], startTime, endTime, DATA_TYPE.WATER_LEVEL);

      if (!series || series.readings.length === 0) {
        throw new Error('Empty response from vizugy API');
      }
      dailyMap = selectDailyReadings(series.readings);
      console.log(`✅ API: ${series.readings.length} readings`);
    } catch (apiError) {
      console.warn(`⚠️  REST API failed (${apiError.message}), falling back to HTML scraping`);
      dailyMap = await scrapeFromHtml();
      console.log(`✅ HTML scrape: ${dailyMap.size} daily readings`);
    }

    const { data: waterBody, error: wbError } = await supabase
      .from('water_bodies')
      .select('id')
      .eq('name', 'FTCS (Karapancsa)')
      .single();

    if (wbError) throw new Error(`FTCS water body not found: ${wbError.message}`);

    const toInsert = Array.from(dailyMap.values()).map(r => ({
      water_body_id: waterBody.id,
      water_level_cm: r.valueCm,
      measured_at: r.utcTime,
      source: sourceUsed,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('water_body_measurements')
      .upsert(toInsert, { onConflict: 'water_body_id,measured_at', ignoreDuplicates: true })
      .select();

    if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

    console.log(`✅ Inserted ${inserted?.length ?? 0} measurements`);

    return new Response(
      JSON.stringify({
        success: true,
        data: { dailySelected: dailyMap.size, inserted: inserted?.length ?? 0 },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ FTCS error:', error);
    return new Response(
      JSON.stringify({ success: false, error: sanitizeError(error, 'Failed to fetch FTCS data') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
