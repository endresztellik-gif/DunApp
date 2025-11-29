/**
 * DunApp PWA - Fetch Meteorology Data Edge Function
 *
 * PURPOSE:
 * - Fetches current weather data for 4 cities (Szekszárd, Baja, Dunaszekcső, Mohács)
 * - Fetches 3-day forecast data (72 hours, 6-hour intervals) from Yr.no
 * - Stores current data in meteorology_data table
 * - Stores forecast data in meteorology_forecasts table
 * - Called by cron job every 20 minutes
 *
 * IMPLEMENTATION:
 * Current Weather:
 * - OpenWeatherMap API integration (primary source)
 * - Yr.no fallback
 *
 * Forecast:
 * - Yr.no API (3-day forecast, 6-hour intervals)
 * - Upsert strategy: deletes old forecasts before inserting new ones
 *
 * Features:
 * - Retry logic with exponential backoff
 * - Error logging and handling
 * - User-Agent header for Yr.no (REQUIRED by API)
 *
 * API Keys needed (set in Supabase dashboard):
 * - OPENWEATHER_API_KEY
 * - YR_NO_USER_AGENT (optional, defaults to 'DunApp PWA/1.0 (contact@dunapp.hu)')
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
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
 * Fetch 3-day forecast from Yr.no API
 * Returns forecast data with 6-hour intervals for the next 72 hours
 */
async function fetchYrNoForecast(city: { name: string; lat: number; lon: number }) {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${city.lat}&lon=${city.lon}`;

  console.log(`Fetching Yr.no forecast for ${city.name}...`);

  const response = await fetchWithRetry(() => fetch(url, {
    headers: {
      'User-Agent': YR_NO_USER_AGENT
    }
  }));

  if (!response.ok) {
    throw new Error(`Yr.no API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const timeseries = data.properties?.timeseries || [];

  if (timeseries.length === 0) {
    throw new Error('No forecast data available from Yr.no');
  }

  // Filter to next 72 hours and 6-hour intervals
  const now = new Date();
  const maxTime = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now
  const forecasts = [];

  for (let i = 0; i < timeseries.length; i++) {
    const entry = timeseries[i];
    const forecastTime = new Date(entry.time);

    // Only include forecasts within next 72 hours
    if (forecastTime > maxTime) {
      break;
    }

    // Only include every 6th hour (approximately - Yr.no provides hourly data)
    // We want roughly: 0h, 6h, 12h, 18h, 24h, 30h, etc.
    const hoursDiff = (forecastTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursDiff < 0 || hoursDiff % 6 > 1) {
      continue; // Skip if not close to a 6-hour interval
    }

    const instant = entry.data?.instant?.details;
    const next6h = entry.data?.next_6_hours;
    const next12h = entry.data?.next_12_hours;

    // Use next_6_hours if available, otherwise next_12_hours
    const precipitationData = next6h?.details || next12h?.details;
    const symbolData = next6h?.summary || next12h?.summary;

    forecasts.push({
      forecast_time: forecastTime.toISOString(),
      temperature: instant?.air_temperature ?? null,
      temperature_min: precipitationData?.air_temperature_min ?? null,
      temperature_max: precipitationData?.air_temperature_max ?? null,
      precipitation_amount: precipitationData?.precipitation_amount ?? null,
      wind_speed: instant?.wind_speed ?? null,
      wind_direction: instant?.wind_from_direction ? Math.round(instant.wind_from_direction) : null,
      humidity: instant?.relative_humidity ? Math.round(instant.relative_humidity) : null,
      pressure: instant?.air_pressure_at_sea_level ?? null,
      clouds_percent: instant?.cloud_area_fraction ? Math.round(instant.cloud_area_fraction) : null,
      weather_symbol: symbolData?.symbol_code ?? null
    });

    // Limit to reasonable number of forecast points (12 points = 72 hours / 6 hour intervals)
    if (forecasts.length >= 12) {
      break;
    }
  }

  return forecasts;
}

/**
 * Fetch weather data with fallback hierarchy (OpenWeatherMap → Yr.no)
 */
async function fetchWeatherData(city: { name: string; lat: number; lon: number }) {
  // Try OpenWeatherMap first
  try {
    console.log(`Fetching from OpenWeatherMap for ${city.name}...`);
    return await fetchFromOpenWeatherMap(city);
  } catch (error) {
    console.warn(`OpenWeatherMap failed for ${city.name}:`, error.message);

    // Try Yr.no as fallback
    try {
      console.log(`Trying Yr.no for ${city.name}...`);
      return await fetchFromYrNo(city);
    } catch (error2) {
      console.error(`All weather sources failed for ${city.name}`);
      throw new Error(`Failed to fetch weather data for ${city.name}: all sources failed`);
    }
  }
}

/**
 * Fetch and store forecasts for all cities
 */
async function fetchAndStoreForecastsForAllCities(supabase: any) {
  console.log('📊 Starting forecast fetch for all cities...');

  const forecastResults = [];
  let forecastSuccessCount = 0;
  let forecastFailureCount = 0;

  for (const city of CITIES) {
    try {
      console.log(`Fetching forecast for ${city.name}...`);

      // Fetch forecast from Yr.no (6-hourly intervals, 12 points for 3 days)
      const forecastData = await fetchYrNoForecast(city);

      if (forecastData.length === 0) {
        throw new Error('No forecast data received');
      }

      // Get city_id from database
      const { data: cityData, error: cityError } = await supabase
        .from('meteorology_cities')
        .select('id')
        .eq('name', city.name)
        .single();

      if (cityError || !cityData) {
        throw new Error(`City not found in database: ${city.name}`);
      }

      // Delete old forecasts for this city (upsert strategy)
      const { error: deleteError } = await supabase
        .from('meteorology_forecasts')
        .delete()
        .eq('city_id', cityData.id);

      if (deleteError) {
        console.warn(`Warning: Failed to delete old forecasts for ${city.name}:`, deleteError.message);
      }

      // Insert new forecasts
      const forecastsToInsert = forecastData.map(f => ({
        city_id: cityData.id,
        forecast_time: f.forecast_time,
        temperature: f.temperature,
        precipitation_amount: f.precipitation_amount,
        wind_speed: f.wind_speed,
        wind_direction: f.wind_direction,
        humidity: f.humidity,
        pressure: f.pressure,
        clouds_percent: f.clouds_percent,
        weather_symbol: f.weather_symbol
      }));

      const { error: insertError } = await supabase
        .from('meteorology_forecasts')
        .insert(forecastsToInsert);

      if (insertError) {
        throw insertError;
      }

      forecastSuccessCount++;
      forecastResults.push({
        city: city.name,
        status: 'success',
        forecastCount: forecastData.length
      });

      console.log(`✅ Forecast success: ${city.name} (${forecastData.length} forecast points)`);
    } catch (error) {
      forecastFailureCount++;
      forecastResults.push({
        city: city.name,
        status: 'error',
        error: error.message
      });
      console.error(`❌ Forecast error for ${city.name}:`, error.message);
    }
  }

  return {
    results: forecastResults,
    summary: {
      total: CITIES.length,
      success: forecastSuccessCount,
      failed: forecastFailureCount
    }
  };
}

serve(async (req) => {
  try {
    console.log('🌤️  Fetch Meteorology Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ========================================
    // PART 1: Fetch CURRENT weather for all cities
    // ========================================
    console.log('🌡️  Fetching current weather data...');

    const currentResults = [];
    let currentSuccessCount = 0;
    let currentFailureCount = 0;

    // Fetch weather data for each city
    for (const city of CITIES) {
      try {
        console.log(`Processing current weather for ${city.name}...`);

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

        currentSuccessCount++;
        currentResults.push({
          city: city.name,
          status: 'success',
          source: weatherData.source,
          temperature: weatherData.temperature
        });

        console.log(`✅ Current weather success: ${city.name} (${weatherData.source})`);
      } catch (error) {
        currentFailureCount++;
        currentResults.push({
          city: city.name,
          status: 'error',
          error: error.message
        });
        console.error(`❌ Current weather error for ${city.name}:`, error.message);
      }
    }

    // ========================================
    // PART 2: Fetch FORECASTS for all cities
    // ========================================
    console.log('📊 Fetching forecast data...');

    const forecastResponse = await fetchAndStoreForecastsForAllCities(supabase);

    // ========================================
    // FINAL RESPONSE
    // ========================================
    console.log(`✅ Fetch Meteorology Edge Function - Completed`);
    console.log(`   Current weather: ${currentSuccessCount} success, ${currentFailureCount} failed`);
    console.log(`   Forecasts: ${forecastResponse.summary.success} success, ${forecastResponse.summary.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        current: {
          summary: {
            total: CITIES.length,
            success: currentSuccessCount,
            failed: currentFailureCount
          },
          results: currentResults
        },
        forecast: {
          summary: forecastResponse.summary,
          results: forecastResponse.results
        }
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
