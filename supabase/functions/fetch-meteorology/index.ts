/**
 * DunApp PWA - Fetch Meteorology Data Edge Function
 *
 * PURPOSE:
 * - Fetches current weather data for 4 cities (Szekszárd, Baja, Dunaszekcső, Mohács)
 * - Stores data in meteorology_data table
 * - Called by cron job every 20 minutes
 *
 * TODO (Data Engineer):
 * 1. Implement OpenWeatherMap API integration (primary source)
 * 2. Implement Meteoblue API fallback
 * 3. Implement Yr.no fallback
 * 4. Add error handling and retry logic
 * 5. Add logging for debugging
 * 6. Cache responses appropriately
 *
 * API Keys needed (set in Supabase dashboard):
 * - OPENWEATHER_API_KEY
 * - METEOBLUE_API_KEY
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
const METEOBLUE_API_KEY = Deno.env.get('METEOBLUE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Cities to fetch weather for
const CITIES = [
  { name: 'Szekszárd', lat: 46.3481, lon: 18.7097 },
  { name: 'Baja', lat: 46.1811, lon: 18.9550 },
  { name: 'Dunaszekcső', lat: 46.0833, lon: 18.7667 },
  { name: 'Mohács', lat: 45.9928, lon: 18.6836 },
];

serve(async (req) => {
  try {
    console.log('🌤️  Fetch Meteorology Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // TODO: Implement actual weather data fetching
    // For now, return placeholder response

    const results = CITIES.map(city => ({
      city: city.name,
      status: 'placeholder',
      message: 'Data Engineer: Implement OpenWeatherMap API integration here',
      coordinates: { lat: city.lat, lon: city.lon }
    }));

    console.log('✅ Fetch Meteorology Edge Function - Completed (placeholder)');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results: results,
        todo: [
          'Implement OpenWeatherMap API calls',
          'Parse weather data',
          'Store in meteorology_data table',
          'Add error handling',
          'Implement fallback sources (Meteoblue, Yr.no)'
        ]
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Fetch Meteorology Error:', error);

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
 * 1. OpenWeatherMap API Call:
 *    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=hu`;
 *    const response = await fetch(url);
 *    const data = await response.json();
 *
 * 2. Parse response and extract:
 *    - temperature, feels_like, temp_min, temp_max
 *    - pressure, humidity
 *    - wind_speed, wind_direction
 *    - clouds_percent
 *    - weather_main, weather_description, weather_icon
 *    - rain_1h, rain_3h, snow_1h, snow_3h
 *    - visibility
 *
 * 3. Get city_id from database:
 *    const { data: cityData } = await supabase
 *      .from('meteorology_cities')
 *      .select('id')
 *      .eq('name', cityName)
 *      .single();
 *
 * 4. Insert into meteorology_data table:
 *    const { error } = await supabase
 *      .from('meteorology_data')
 *      .insert({
 *        city_id: cityData.id,
 *        temperature: data.main.temp,
 *        humidity: data.main.humidity,
 *        // ... other fields
 *      });
 *
 * 5. Handle errors with retry logic (see DATA_SOURCES.md for examples)
 *
 * 6. Implement fallback hierarchy:
 *    - Try OpenWeatherMap first
 *    - If fails, try Meteoblue
 *    - If fails, try Yr.no
 *    - If all fail, log error and return cached data if available
 */
