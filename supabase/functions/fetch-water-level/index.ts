/**
 * DunApp PWA - Fetch Water Level Data Edge Function
 *
 * PURPOSE:
 * - Scrapes current water level data for 3 stations (Baja, Mohács, Nagybajcs)
 * - Stores data in water_level_data table
 * - Called by cron job every hour
 *
 * TODO (Data Engineer):
 * 1. Implement vizugy.hu scraping (primary source for actual data)
 * 2. Implement hydroinfo.hu scraping (for forecasts)
 * 3. Add HTML parsing with Cheerio or similar
 * 4. Handle ISO-8859-2 encoding for hydroinfo.hu
 * 5. Add error handling and retry logic
 * 6. Store both actual and forecast data
 *
 * Environment variables needed:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Stations to scrape
const STATIONS = [
  {
    name: 'Baja',
    vizugyUrl: 'https://www.vizugy.hu/index.php?id=vizmerce&mernev=Baja'
  },
  {
    name: 'Mohács',
    vizugyUrl: 'https://www.vizugy.hu/index.php?id=vizmerce&mernev=Mohács'
  },
  {
    name: 'Nagybajcs',
    vizugyUrl: 'https://www.vizugy.hu/index.php?id=vizmerce&mernev=Nagybajcs'
  }
];

serve(async (req) => {
  try {
    console.log('💧 Fetch Water Level Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // TODO: Implement actual water level scraping
    // For now, return placeholder response

    const results = STATIONS.map(station => ({
      station: station.name,
      status: 'placeholder',
      message: 'Data Engineer: Implement vizugy.hu scraping here',
      url: station.vizugyUrl
    }));

    console.log('✅ Fetch Water Level Edge Function - Completed (placeholder)');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results: results,
        todo: [
          'Implement vizugy.hu scraping for actual water levels',
          'Implement hydroinfo.hu scraping for forecasts',
          'Parse HTML tables with Cheerio or DOMParser',
          'Handle ISO-8859-2 encoding for hydroinfo.hu',
          'Store in water_level_data table',
          'Store forecasts in water_level_forecasts table',
          'Add error handling and retry logic'
        ]
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Fetch Water Level Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * IMPLEMENTATION GUIDE (for Data Engineer):
 *
 * 1. Scrape vizugy.hu for actual water levels:
 *    - URL: https://www.vizugy.hu/index.php?module=content&programelemid=138
 *    - Look for table rows with station names
 *    - Extract water level from last column (cm)
 *    - User-Agent header required
 *
 * 2. Example scraping code:
 *    const response = await fetch(VIZUGY_URL, {
 *      headers: {
 *        'User-Agent': 'Mozilla/5.0 DunApp/1.0'
 *      }
 *    });
 *    const html = await response.text();
 *    // Parse HTML with Cheerio or DOMParser
 *
 * 3. Get station_id from database:
 *    const { data: stationData } = await supabase
 *      .from('water_level_stations')
 *      .select('id')
 *      .eq('station_name', stationName)
 *      .single();
 *
 * 4. Insert into water_level_data table:
 *    const { error } = await supabase
 *      .from('water_level_data')
 *      .insert({
 *        station_id: stationData.id,
 *        water_level_cm: waterLevel,
 *        timestamp: new Date().toISOString()
 *      });
 *
 * 5. Scrape hydroinfo.hu for forecasts:
 *    - URL: http://www.hydroinfo.hu/Html/hidelo/duna.html
 *    - IMPORTANT: ISO-8859-2 encoding!
 *    - Use iconv-lite or similar for decoding
 *    - Extract 5-day forecast for each station
 *
 * 6. Store forecasts in water_level_forecasts table:
 *    const { error } = await supabase
 *      .from('water_level_forecasts')
 *      .upsert({
 *        station_id: stationData.id,
 *        forecast_date: forecastDate,
 *        water_level_cm: forecastLevel,
 *        forecast_day: dayNumber
 *      });
 *
 * 7. Error handling:
 *    - Retry scraping 3 times with exponential backoff
 *    - Log all errors for debugging
 *    - If scraping fails, keep previous cached data
 *
 * CRITICAL: For hydroinfo.hu, handle ISO-8859-2 encoding:
 * const buffer = await response.arrayBuffer();
 * const decoder = new TextDecoder('iso-8859-2');
 * const html = decoder.decode(buffer);
 */
