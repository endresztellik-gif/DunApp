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
  refetch: () => void;
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
  const { data: forecastData, error: forecastError } = await supabase
    .from('water_level_forecasts')
    .select('*')
    .eq('station_id', stationId)
    .order('forecast_day', { ascending: true })
    .limit(5);

  // Forecast data is optional
  const forecast = forecastData || [];

  return {
    waterLevelData: {
      stationId: waterLevelData.station_id,
      waterLevelCm: waterLevelData.water_level_cm,
      flowRateM3s: waterLevelData.flow_rate_m3s,
      waterTempCelsius: waterLevelData.water_temp_celsius,
      timestamp: waterLevelData.timestamp
    },
    station: {
      id: stationData.id,
      stationName: stationData.station_name,
      riverName: stationData.river_name,
      cityName: stationData.city_name,
      latitude: stationData.latitude,
      longitude: stationData.longitude,
      lnvLevel: stationData.lnv_level,
      kkvLevel: stationData.kkv_level,
      nvLevel: stationData.nv_level,
      isActive: stationData.is_active,
      displayInComparison: stationData.display_in_comparison
    },
    forecast: forecast.map((f: any) => ({
      stationId: f.station_id,
      forecastDate: f.forecast_date,
      waterLevelCm: f.water_level_cm,
      forecastDay: f.forecast_day
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
