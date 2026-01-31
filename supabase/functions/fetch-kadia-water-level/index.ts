// Supabase Edge Function: Fetch Kadia Water Level from vizugy.hu
// URL: https://www.vizugy.hu/?mapModule=OpFeGrafikon&AllomasVOA=164960F7-97AB-11D4-BB62-00508BA24287&mapData=OrasIdosor
// Schedule: Daily at 9:00 AM (using pg_cron)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const KADIA_STATION_URL =
  'https://www.vizugy.hu/?mapModule=OpFeGrafikon&AllomasVOA=164960F7-97AB-11D4-BB62-00508BA24287&mapData=OrasIdosor';

interface MeasurementData {
  timestamp: string;
  waterLevel: number;
  waterTemp?: number;
}

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch vizugy.hu Kadia station page
    console.log('Fetching Kadia data from vizugy.hu...');
    const response = await fetch(KADIA_STATION_URL);
    const html = await response.text();

    // Parse HTML table data
    // Format: <tr><td><strong>2025.11.20. 22:00</strong></td><td><strong>234</strong></td><td>...</td></tr>
    const tableRowPattern = /<tr[^>]*>\s*<td[^>]*><strong>([\d.]+\.\s+\d{2}:\d{2})<\/strong><\/td>\s*<td[^>]*><strong>(\d+)<\/strong><\/td>/gi;
    const measurements: MeasurementData[] = [];

    let match;
    while ((match = tableRowPattern.exec(html)) !== null) {
      const timestamp = match[1].trim();
      const waterLevel = parseInt(match[2], 10);

      if (timestamp && !isNaN(waterLevel)) {
        measurements.push({ timestamp, waterLevel });
      }
    }

    if (measurements.length === 0) {
      throw new Error('No valid water level data found in HTML table');
    }

    console.log(`Found ${measurements.length} measurements`);

    // Group measurements by day and find the 6:00 AM measurement (or closest)
    const dailyMeasurements: Map<string, MeasurementData> = new Map();

    for (const measurement of measurements) {
      const timestampParts = measurement.timestamp.match(
        /(\d{4})\.(\d{2})\.(\d{2})\.\s+(\d{2}):(\d{2})/
      );

      if (!timestampParts) continue;

      const [_, year, month, day, hour, minute] = timestampParts;
      const dayKey = `${year}-${month}-${day}`;
      const hourNum = parseInt(hour, 10);

      // Prefer 6:00 AM measurement (or closest to 6:00 AM)
      if (!dailyMeasurements.has(dayKey)) {
        dailyMeasurements.set(dayKey, measurement);
      } else {
        const existing = dailyMeasurements.get(dayKey)!;
        const existingHour = parseInt(existing.timestamp.match(/(\d{2}):(\d{2})/)![1], 10);
        const existingDiff = Math.abs(existingHour - 6);
        const currentDiff = Math.abs(hourNum - 6);

        // Replace if current measurement is closer to 6:00 AM
        if (currentDiff < existingDiff) {
          dailyMeasurements.set(dayKey, measurement);
        }
      }
    }

    console.log(`Found ${dailyMeasurements.size} daily measurements (6:00 AM preferred)`);

    // Find Kadia water body ID
    const { data: kadiaWaterBody, error: waterBodyError } = await supabase
      .from('water_bodies')
      .select('id')
      .eq('name', 'Kadia')
      .single();

    if (waterBodyError) {
      throw new Error(
        `Kadia water body not found in database: ${waterBodyError.message}. Please add it first.`
      );
    }

    console.log('Kadia water body ID:', kadiaWaterBody.id);

    // Prepare all daily measurements for bulk insert
    const measurementsToInsert = Array.from(dailyMeasurements.values()).map((measurement) => {
      const timestampParts = measurement.timestamp.match(
        /(\d{4})\.(\d{2})\.(\d{2})\.\s+(\d{2}):(\d{2})/
      );

      if (!timestampParts) {
        throw new Error(`Invalid timestamp format: ${measurement.timestamp}`);
      }

      const [_, year, month, day, hour, minute] = timestampParts;
      const measurementDate = new Date(
        `${year}-${month}-${day}T${hour}:${minute}:00.000Z`
      );

      return {
        water_body_id: kadiaWaterBody.id,
        water_level_cm: measurement.waterLevel,
        measured_at: measurementDate.toISOString(),
        source: 'vizugy.hu',
      };
    });

    // Bulk insert (upsert to avoid duplicates)
    const { data: insertedMeasurements, error: insertError } = await supabase
      .from('water_body_measurements')
      .upsert(measurementsToInsert, {
        onConflict: 'water_body_id,measured_at',
        ignoreDuplicates: true,
      })
      .select();

    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    console.log(`Inserted ${insertedMeasurements?.length || 0} measurements`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Kadia measurements imported successfully',
        data: {
          measurementsFound: measurements.length,
          dailyMeasurements: dailyMeasurements.size,
          inserted: insertedMeasurements?.length || 0,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
