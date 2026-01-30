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

    // Get the latest measurement (first row is usually the most recent)
    const latestMeasurement = measurements[0];
    const latestWaterLevel = latestMeasurement.waterLevel;
    const latestTimestamp = latestMeasurement.timestamp;

    // Parse Hungarian timestamp format: '2025.11.20. 22:00' -> ISO 8601
    // Format: YYYY.MM.DD. HH:mm
    const timestampParts = latestTimestamp.match(
      /(\d{4})\.(\d{2})\.(\d{2})\.\s+(\d{2}):(\d{2})/
    );

    if (!timestampParts) {
      throw new Error(`Invalid timestamp format: ${latestTimestamp}`);
    }

    const [_, year, month, day, hour, minute] = timestampParts;
    const measurementDate = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:00.000Z`
    );
    const measurementTimestamp = measurementDate.toISOString();

    console.log('Latest measurement:', {
      waterLevel: latestWaterLevel,
      timestamp: latestTimestamp,
      iso: measurementTimestamp,
    });

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

    // Check if measurement already exists for this timestamp
    const { data: existingMeasurement } = await supabase
      .from('water_body_measurements')
      .select('id')
      .eq('water_body_id', kadiaWaterBody.id)
      .eq('measured_at', measurementTimestamp)
      .single();

    if (existingMeasurement) {
      console.log('Measurement already exists, skipping');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Measurement already exists',
          data: {
            waterLevel: latestWaterLevel,
            timestamp: latestTimestamp,
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert new measurement
    const { data: newMeasurement, error: insertError } = await supabase
      .from('water_body_measurements')
      .insert({
        water_body_id: kadiaWaterBody.id,
        water_level_cm: latestWaterLevel,
        measured_at: measurementTimestamp,
        source: 'vizugy.hu',
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    console.log('New measurement inserted:', newMeasurement);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Kadia measurement imported successfully',
        data: {
          waterLevel: latestWaterLevel,
          timestamp: latestTimestamp,
          inserted: newMeasurement,
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
