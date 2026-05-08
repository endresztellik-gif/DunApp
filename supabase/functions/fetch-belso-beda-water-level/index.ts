/**
 * DunApp PWA - Fetch Belső-Béda Water Level
 *
 * Data source: vizugy.hu REST API (replaces HTML scraping)
 * TSZ: 150035 (Bédai szivattyútelep Béda)
 * Schedule: Daily at 9:00 AM
 *
 * Fetches last 7 days of hourly readings, selects the 06:00 Budapest time
 * measurement per day, upserts into water_body_measurements.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sanitizeError } from '../_shared/error-sanitizer.ts';
import { fetchTimeSeries, DATA_TYPE } from '../_shared/vizugy-api-client.ts';

const BELSO_BEDA_TSZ = 150035;
const FETCH_DAYS = 7;

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('💧 Fetch Belső-Béda Water Level - Starting (vizugy API)');

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - FETCH_DAYS * 24 * 3600 * 1000);

    const [levelSeries] = await fetchTimeSeries(
      [BELSO_BEDA_TSZ],
      startTime,
      endTime,
      DATA_TYPE.WATER_LEVEL
    );

    if (!levelSeries || levelSeries.readings.length === 0) {
      throw new Error('No readings returned from vizugy API for Belső-Béda');
    }

    console.log(`Received ${levelSeries.readings.length} readings`);

    // Select one measurement per day: prefer 04:00 UTC (= 06:00 Budapest summer time)
    const dailyMap = new Map<string, { utcTime: string; valueCm: number }>();

    for (const reading of levelSeries.readings) {
      const d = new Date(reading.utcTime);
      const dayKey = d.toISOString().split('T')[0];
      const hourUTC = d.getUTCHours();

      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, reading);
      } else {
        const existing = new Date(dailyMap.get(dayKey)!.utcTime).getUTCHours();
        if (Math.abs(hourUTC - 4) < Math.abs(existing - 4)) {
          dailyMap.set(dayKey, reading);
        }
      }
    }

    console.log(`Selected ${dailyMap.size} daily measurements`);

    const { data: waterBody, error: wbError } = await supabase
      .from('water_bodies')
      .select('id')
      .eq('name', 'Belső-Béda')
      .single();

    if (wbError) throw new Error(`Belső-Béda water body not found: ${wbError.message}`);

    const toInsert = Array.from(dailyMap.values()).map(r => ({
      water_body_id: waterBody.id,
      water_level_cm: r.valueCm,
      measured_at: r.utcTime,
      source: 'vizugy.hu',
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
        data: { readingsReceived: levelSeries.readings.length, dailySelected: dailyMap.size, inserted: inserted?.length ?? 0 },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Belső-Béda error:', error);
    return new Response(
      JSON.stringify({ success: false, error: sanitizeError(error, 'Failed to fetch Belső-Béda data') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
