/**
 * useForecastData Hook
 *
 * Custom hook to fetch weather forecast data for a selected city.
 * Uses React Query for caching and automatic refetching.
 *
 * @param cityId - The ID of the city to fetch forecast data for
 * @returns Query object with forecast data, loading state, and error
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * ForecastPoint
 * Single forecast data point (6-hour interval)
 */
export interface ForecastPoint {
  id: string;
  cityId: string;
  forecastTime: string; // ISO timestamp
  temperature: number | null;
  precipitationAmount: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  humidity: number | null;
  pressure: number | null;
  cloudsPercent: number | null;
  weatherSymbol: string | null;
}

/**
 * Return type for useForecastData hook
 */
export interface UseForecastDataReturn {
  forecasts: ForecastPoint[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Fetch weather forecast data for a city
 * Retrieves next 72 hours (3 days) of forecasts in 6-hour intervals
 */
async function fetchForecastData(cityId: string): Promise<ForecastPoint[]> {
  // Calculate time range (next 72 hours)
  const now = new Date();
  const endTime = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now

  // Get forecast data from database
  const { data: forecastData, error: forecastError } = await supabase
    .from('meteorology_forecasts')
    .select('*')
    .eq('city_id', cityId)
    .gte('forecast_time', now.toISOString())
    .lte('forecast_time', endTime.toISOString())
    .order('forecast_time', { ascending: true });

  if (forecastError) {
    throw new Error(`Failed to fetch forecast data: ${forecastError.message}`);
  }

  if (!forecastData || forecastData.length === 0) {
    // Return empty array if no forecast data available
    return [];
  }

  // Transform database fields (snake_case) to frontend fields (camelCase)
  return forecastData.map((f: Record<string, unknown>) => ({
    id: f.id as string,
    cityId: f.city_id as string,
    forecastTime: f.forecast_time as string,
    temperature: f.temperature as number | null,
    precipitationAmount: f.precipitation_amount as number | null,
    windSpeed: f.wind_speed as number | null,
    windDirection: f.wind_direction as number | null,
    humidity: f.humidity as number | null,
    pressure: f.pressure as number | null,
    cloudsPercent: f.clouds_percent as number | null,
    weatherSymbol: f.weather_symbol as string | null,
  }));
}

/**
 * Custom hook to fetch forecast data with caching
 *
 * Features:
 * - Fetches next 3 days (72 hours) of forecasts
 * - 6-hour intervals
 * - Caches for 1 hour
 * - Auto-refetches every 1 hour
 * - Only runs when cityId is provided
 */
export function useForecastData(cityId: string | null): UseForecastDataReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['forecast', cityId],
    queryFn: () => fetchForecastData(cityId!),
    enabled: !!cityId, // Only run if cityId is provided
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    refetchInterval: 60 * 60 * 1000, // Refetch every 1 hour
    retry: 3, // Retry failed requests 3 times
  });

  return {
    forecasts: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
