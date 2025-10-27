/**
 * DunApp PWA - Fetch Meteorology Data Edge Function
 *
 * PURPOSE:
 * - Fetches current weather data for 4 cities (Szekszárd, Baja, Dunaszekcső, Mohács)
 * - Stores data in meteorology_data table
 * - Called by cron job every 20 minutes
 *
 * IMPLEMENTATION:
 * - OpenWeatherMap API integration (primary source)
 * - Meteoblue API fallback
 * - Yr.no fallback
 * - Retry logic with exponential backoff
 * - Error logging and handling
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
const YR_NO_USER_AGENT = Deno.env.get('YR_NO_USER_AGENT') || 'DunApp PWA/1.0 (contact@dunapp.hu)';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Cities to fetch weather for
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
 * Fetch weather data from OpenWeatherMap (primary source)
 */
async function fetchFromOpenWeatherMap(city: { name: string; lat: number; lon: number }) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OPENWEATHER_API_KEY not configured');
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=hu`;

  const response = await fetchWithRetry(() => fetch(url));

  if (!response.ok) {
    throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    temperature: data.main?.temp ?? null,
    feels_like: data.main?.feels_like ?? null,
    temp_min: data.main?.temp_min ?? null,
    temp_max: data.main?.temp_max ?? null,
    pressure: data.main?.pressure ?? null,
    humidity: data.main?.humidity ?? null,
    wind_speed: data.wind?.speed ?? null,
    wind_direction: data.wind?.deg ?? null,
    clouds_percent: data.clouds?.all ?? null,
    weather_main: data.weather?.[0]?.main ?? null,
    weather_description: data.weather?.[0]?.description ?? null,
    weather_icon: data.weather?.[0]?.icon ?? null,
    rain_1h: data.rain?.['1h'] ?? null,
    rain_3h: data.rain?.['3h'] ?? null,
    snow_1h: data.snow?.['1h'] ?? null,
    snow_3h: data.snow?.['3h'] ?? null,
    visibility: data.visibility ?? null,
    source: 'openweathermap'
  };
}

/**
 * Fetch weather data from Meteoblue (fallback)
 */
async function fetchFromMeteoblue(city: { name: string; lat: number; lon: number }) {
  if (!METEOBLUE_API_KEY) {
    throw new Error('METEOBLUE_API_KEY not configured');
  }

  const url = `https://my.meteoblue.com/packages/basic-1h?apikey=${METEOBLUE_API_KEY}&lat=${city.lat}&lon=${city.lon}&format=json`;

  const response = await fetchWithRetry(() => fetch(url));

  if (!response.ok) {
    throw new Error(`Meteoblue API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Get the latest (first) data point from the hourly forecast
  const latest = {
    temperature: data.data_1h?.temperature?.[0] ?? null,
    humidity: data.data_1h?.relativehumidity?.[0] ?? null,
    wind_speed: data.data_1h?.windspeed?.[0] ? data.data_1h.windspeed[0] / 3.6 : null, // km/h to m/s
    wind_direction: data.data_1h?.winddirection?.[0] ?? null,
    precipitation: data.data_1h?.precipitation?.[0] ?? null,
    clouds_percent: data.data_1h?.totalcloudcover?.[0] ?? null,
  };

  return {
    temperature: latest.temperature,
    feels_like: null, // Meteoblue doesn't provide feels_like
    temp_min: null,
    temp_max: null,
    pressure: null,
    humidity: latest.humidity,
    wind_speed: latest.wind_speed,
    wind_direction: latest.wind_direction,
    clouds_percent: latest.clouds_percent,
    weather_main: null,
    weather_description: null,
    weather_icon: null,
    rain_1h: latest.precipitation,
    rain_3h: null,
    snow_1h: null,
    snow_3h: null,
    visibility: null,
    source: 'meteoblue'
  };
}

/**
 * Fetch weather data from Yr.no (fallback)
 */
async function fetchFromYrNo(city: { name: string; lat: number; lon: number }) {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${city.lat}&lon=${city.lon}`;

  const response = await fetchWithRetry(() => fetch(url, {
    headers: {
      'User-Agent': YR_NO_USER_AGENT
    }
  }));

  if (!response.ok) {
    throw new Error(`Yr.no API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Get the first timeseries entry (current/near-future weather)
  const current = data.properties?.timeseries?.[0]?.data?.instant?.details;
  const nextHour = data.properties?.timeseries?.[0]?.data?.next_1_hours?.details;

  return {
    temperature: current?.air_temperature ?? null,
    feels_like: null, // Yr.no doesn't provide feels_like
    temp_min: null,
    temp_max: null,
    pressure: current?.air_pressure_at_sea_level ?? null,
    humidity: current?.relative_humidity ?? null,
    wind_speed: current?.wind_speed ?? null,
    wind_direction: current?.wind_from_direction ?? null,
    clouds_percent: current?.cloud_area_fraction ?? null,
    weather_main: null,
    weather_description: null,
    weather_icon: null,
    rain_1h: nextHour?.precipitation_amount ?? null,
    rain_3h: null,
    snow_1h: null,
    snow_3h: null,
    visibility: null,
    source: 'yr.no'
  };
}

/**
 * Fetch weather data with fallback hierarchy
 */
async function fetchWeatherData(city: { name: string; lat: number; lon: number }) {
  // Try OpenWeatherMap first
  try {
    console.log(`Fetching from OpenWeatherMap for ${city.name}...`);
    return await fetchFromOpenWeatherMap(city);
  } catch (error) {
    console.warn(`OpenWeatherMap failed for ${city.name}:`, error.message);

    // Try Meteoblue as fallback
    try {
      console.log(`Trying Meteoblue for ${city.name}...`);
      return await fetchFromMeteoblue(city);
    } catch (error2) {
      console.warn(`Meteoblue failed for ${city.name}:`, error2.message);

      // Try Yr.no as last fallback
      try {
        console.log(`Trying Yr.no for ${city.name}...`);
        return await fetchFromYrNo(city);
      } catch (error3) {
        console.error(`All weather sources failed for ${city.name}`);
        throw new Error(`Failed to fetch weather data for ${city.name}: all sources failed`);
      }
    }
  }
}

serve(async (req) => {
  try {
    console.log('🌤️  Fetch Meteorology Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Fetch weather data for each city
    for (const city of CITIES) {
      try {
        console.log(`Processing ${city.name}...`);

        // Fetch weather data
        const weatherData = await fetchWeatherData(city);

        // Get city_id from database
        const { data: cityData, error: cityError } = await supabase
          .from('meteorology_cities')
          .select('id')
          .eq('name', city.name)
          .single();

        if (cityError || !cityData) {
          throw new Error(`City not found in database: ${city.name}`);
        }

        // Insert weather data into database
        const { error: insertError } = await supabase
          .from('meteorology_data')
          .insert({
            city_id: cityData.id,
            temperature: weatherData.temperature,
            feels_like: weatherData.feels_like,
            temp_min: weatherData.temp_min,
            temp_max: weatherData.temp_max,
            pressure: weatherData.pressure,
            humidity: weatherData.humidity,
            wind_speed: weatherData.wind_speed,
            wind_direction: weatherData.wind_direction,
            clouds_percent: weatherData.clouds_percent,
            weather_main: weatherData.weather_main,
            weather_description: weatherData.weather_description,
            weather_icon: weatherData.weather_icon,
            rain_1h: weatherData.rain_1h,
            rain_3h: weatherData.rain_3h,
            snow_1h: weatherData.snow_1h,
            snow_3h: weatherData.snow_3h,
            visibility: weatherData.visibility,
            timestamp: new Date().toISOString()
          });

        if (insertError) {
          throw insertError;
        }

        successCount++;
        results.push({
          city: city.name,
          status: 'success',
          source: weatherData.source,
          temperature: weatherData.temperature
        });

        console.log(`✅ Success: ${city.name} (${weatherData.source})`);
      } catch (error) {
        failureCount++;
        results.push({
          city: city.name,
          status: 'error',
          error: error.message
        });
        console.error(`❌ Error for ${city.name}:`, error.message);
      }
    }

    console.log(`✅ Fetch Meteorology Edge Function - Completed: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          total: CITIES.length,
          success: successCount,
          failed: failureCount
        },
        results
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
