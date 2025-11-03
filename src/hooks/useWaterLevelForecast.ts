/**
 * useWaterLevelForecast Hook
 *
 * Custom hook to fetch 5-day water level forecast for a selected station.
 * Uses React Query for caching and automatic refetching.
 *
 * Created: 2025-11-03 (Phase 4.5b)
 * Compatible with Migration 009 schema
 *
 * @param stationId - The UUID of the station to fetch forecast data for
 * @returns Query object with forecast data array, loading state, and error
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { WaterLevelForecast } from '../types';

interface UseWaterLevelForecastReturn {
  forecasts: WaterLevelForecast[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Fetch the latest 5-day forecast for a station
 */
async function fetchWaterLevelForecast(stationId: string): Promise<WaterLevelForecast[]> {
  // Get the latest issued forecast (newest issued_at)
  const { data: latestIssue, error: issueError } = await supabase
    .from('water_level_forecasts')
    .select('issued_at')
    .eq('station_id', stationId)
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (issueError) {
    throw new Error(`Failed to fetch forecast issue time: ${issueError.message}`);
  }

  // If no forecasts exist yet, return empty array
  if (!latestIssue) {
    return [];
  }

  const latestIssueAny = latestIssue as any;

  // Get all forecasts from the latest issue
  const { data: forecastData, error: forecastError } = await supabase
    .from('water_level_forecasts')
    .select('*')
    .eq('station_id', stationId)
    .eq('issued_at', latestIssueAny.issued_at)
    .gte('forecast_date', new Date().toISOString().split('T')[0]) // Only future/today forecasts
    .order('forecast_date', { ascending: true })
    .limit(5);

  if (forecastError) {
    throw new Error(`Failed to fetch forecast data: ${forecastError.message}`);
  }

  // Transform to TypeScript interface
  return ((forecastData as any[]) || []).map((forecast: any) => ({
    id: forecast.id,
    stationId: forecast.station_id,
    forecastDate: forecast.forecast_date,
    issuedAt: forecast.issued_at,
    forecastedLevelCm: forecast.forecasted_level_cm,
    source: forecast.source,
    createdAt: forecast.created_at,
  }));
}

/**
 * Custom hook to fetch water level forecast with caching
 *
 * PERFORMANCE OPTIMIZATION:
 * - staleTime: 1 hour (forecasts update hourly at :10)
 * - refetchInterval: 1 hour (automatic background refresh)
 * - retry: 3 attempts with exponential backoff
 */
export function useWaterLevelForecast(
  stationId: string | null
): UseWaterLevelForecastReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['waterLevelForecast', stationId],
    queryFn: () => fetchWaterLevelForecast(stationId!),
    enabled: !!stationId, // Only run if stationId is provided
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
