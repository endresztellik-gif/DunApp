/**
 * useWaterLevelData Hook
 *
 * Custom hook to fetch current water level data for a selected station.
 * Uses React Query for caching and automatic refetching.
 *
 * @param stationId - The ID of the station to fetch water level data for
 * @returns Query object with water level data, station info, loading state, and error
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { WaterLevelData, WaterLevelStation, WaterLevelForecast } from '../types/index';

interface UseWaterLevelDataReturn {
  waterLevelData: WaterLevelData | null;
  station: WaterLevelStation | null;
  forecast: WaterLevelForecast[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Fetch the latest water level data for a station
 */
async function fetchWaterLevelData(stationId: string) {
  // Get station data
  const { data: stationData, error: stationError } = await supabase
    .from('water_level_stations')
    .select('*')
    .eq('id', stationId)
    .single();

  if (stationError) {
    throw new Error(`Failed to fetch station data: ${stationError.message}`);
  }

  // Get latest water level data
  const { data: waterLevelData, error: waterLevelError } = await supabase
    .from('water_level_data')
    .select('*')
    .eq('station_id', stationId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (waterLevelError) {
    throw new Error(`Failed to fetch water level data: ${waterLevelError.message}`);
  }

  // Get forecast data (next 5 days)
  const { data: forecastData } = await supabase
    .from('water_level_forecasts')
    .select('*')
    .eq('station_id', stationId)
    .order('forecast_day', { ascending: true })
    .limit(5);

  // Forecast data is optional
  const forecast = forecastData || [];

  return {
    waterLevelData: {
      stationId: (waterLevelData as Record<string, unknown>).station_id as string,
      waterLevelCm: (waterLevelData as Record<string, unknown>).water_level_cm as number,
      flowRateM3s: (waterLevelData as Record<string, unknown>).flow_rate_m3s as number,
      waterTempCelsius: (waterLevelData as Record<string, unknown>).water_temp_celsius as number,
      timestamp: (waterLevelData as Record<string, unknown>).timestamp as string
    },
    station: {
      id: (stationData as Record<string, unknown>).id as string,
      stationName: (stationData as Record<string, unknown>).station_name as string,
      riverName: (stationData as Record<string, unknown>).river_name as string,
      cityName: (stationData as Record<string, unknown>).city_name as string,
      latitude: (stationData as Record<string, unknown>).latitude as number,
      longitude: (stationData as Record<string, unknown>).longitude as number,
      lnvLevel: (stationData as Record<string, unknown>).lnv_level as number,
      kkvLevel: (stationData as Record<string, unknown>).kkv_level as number,
      nvLevel: (stationData as Record<string, unknown>).nv_level as number,
      isActive: (stationData as Record<string, unknown>).is_active as boolean,
      displayInComparison: (stationData as Record<string, unknown>).display_in_comparison as boolean
    },
    forecast: forecast.map((f: Record<string, unknown>) => ({
      stationId: f.station_id as string,
      forecastDate: f.forecast_date as string,
      waterLevelCm: f.water_level_cm as number,
      forecastDay: f.forecast_day as number
    }))
  };
}

/**
 * Custom hook to fetch water level data with caching
 */
export function useWaterLevelData(stationId: string | null): UseWaterLevelDataReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['waterLevel', stationId],
    queryFn: () => fetchWaterLevelData(stationId!),
    enabled: !!stationId, // Only run if stationId is provided
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    refetchInterval: 60 * 60 * 1000, // Refetch every 1 hour
    retry: 3, // Retry failed requests 3 times
  });

  return {
    waterLevelData: data?.waterLevelData || null,
    station: data?.station || null,
    forecast: data?.forecast || [],
    isLoading,
    error: error as Error | null,
    refetch
  };
}
