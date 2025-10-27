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
  refetch: () => void;
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
      cityId: weatherData.city_id,
      temperature: weatherData.temperature,
      feelsLike: weatherData.feels_like,
      tempMin: weatherData.temp_min,
      tempMax: weatherData.temp_max,
      pressure: weatherData.pressure,
      humidity: weatherData.humidity,
      windSpeed: weatherData.wind_speed,
      windDirection: weatherData.wind_direction,
      cloudsPercent: weatherData.clouds_percent,
      weatherMain: weatherData.weather_main,
      weatherDescription: weatherData.weather_description,
      weatherIcon: weatherData.weather_icon,
      rain1h: weatherData.rain_1h,
      rain3h: weatherData.rain_3h,
      snow1h: weatherData.snow_1h,
      snow3h: weatherData.snow_3h,
      visibility: weatherData.visibility,
      timestamp: weatherData.timestamp
    },
    city: {
      id: cityData.id,
      name: cityData.name,
      county: cityData.county,
      latitude: cityData.latitude,
      longitude: cityData.longitude,
      population: cityData.population,
      isActive: cityData.is_active
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
