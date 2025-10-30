/**
 * useWeatherData Hook
 *
 * Custom hook to fetch current weather data for a selected city.
 * Uses React Query for caching and automatic refetching.
 *
 * @param cityId - The ID of the city to fetch weather data for
 * @returns Query object with weather data, loading state, and error
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { WeatherData, City } from '../types/index';

interface UseWeatherDataReturn {
  weatherData: WeatherData | null;
  city: City | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Fetch the latest weather data for a city
 */
async function fetchWeatherData(cityId: string): Promise<{ weatherData: WeatherData; city: City }> {
  // Get city data
  const { data: cityData, error: cityError } = await supabase
    .from('meteorology_cities')
    .select('*')
    .eq('id', cityId)
    .single();

  if (cityError) {
    throw new Error(`Failed to fetch city data: ${cityError.message}`);
  }

  // Get latest weather data
  const { data: weatherData, error: weatherError } = await supabase
    .from('meteorology_data')
    .select('*')
    .eq('city_id', cityId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (weatherError) {
    throw new Error(`Failed to fetch weather data: ${weatherError.message}`);
  }

  // Transform database fields to match WeatherData type
  return {
    weatherData: {
      cityId: (weatherData as Record<string, unknown>).city_id as string,
      temperature: (weatherData as Record<string, unknown>).temperature as number,
      feelsLike: (weatherData as Record<string, unknown>).feels_like as number,
      tempMin: (weatherData as Record<string, unknown>).temp_min as number,
      tempMax: (weatherData as Record<string, unknown>).temp_max as number,
      pressure: (weatherData as Record<string, unknown>).pressure as number,
      humidity: (weatherData as Record<string, unknown>).humidity as number,
      windSpeed: (weatherData as Record<string, unknown>).wind_speed as number,
      windDirection: (weatherData as Record<string, unknown>).wind_direction as number,
      cloudsPercent: (weatherData as Record<string, unknown>).clouds_percent as number,
      weatherMain: (weatherData as Record<string, unknown>).weather_main as string,
      weatherDescription: (weatherData as Record<string, unknown>).weather_description as string,
      weatherIcon: (weatherData as Record<string, unknown>).weather_icon as string,
      rain1h: (weatherData as Record<string, unknown>).rain_1h as number | null,
      rain3h: (weatherData as Record<string, unknown>).rain_3h as number | null,
      snow1h: (weatherData as Record<string, unknown>).snow_1h as number | null,
      snow3h: (weatherData as Record<string, unknown>).snow_3h as number | null,
      visibility: (weatherData as Record<string, unknown>).visibility as number,
      timestamp: (weatherData as Record<string, unknown>).timestamp as string
    },
    city: {
      id: (cityData as Record<string, unknown>).id as string,
      name: (cityData as Record<string, unknown>).name as string,
      county: (cityData as Record<string, unknown>).county as string,
      latitude: (cityData as Record<string, unknown>).latitude as number,
      longitude: (cityData as Record<string, unknown>).longitude as number,
      population: (cityData as Record<string, unknown>).population as number,
      isActive: (cityData as Record<string, unknown>).is_active as boolean
    }
  };
}

/**
 * Custom hook to fetch weather data with caching
 */
export function useWeatherData(cityId: string | null): UseWeatherDataReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['weather', cityId],
    queryFn: () => fetchWeatherData(cityId!),
    enabled: !!cityId, // Only run if cityId is provided
    staleTime: 20 * 60 * 1000, // Consider data fresh for 20 minutes
    refetchInterval: 20 * 60 * 1000, // Refetch every 20 minutes
    retry: 3, // Retry failed requests 3 times
  });

  return {
    weatherData: data?.weatherData || null,
    city: data?.city || null,
    isLoading,
    error: error as Error | null,
    refetch
  };
}
