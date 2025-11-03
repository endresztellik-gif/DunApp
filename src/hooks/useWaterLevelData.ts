/**
 * useWaterLevelData Hook
 *
 * Custom hook to fetch current water level data for a selected station.
 * Uses React Query for caching and automatic refetching.
 *
 * Updated: 2025-11-03 (Phase 4.5b)
 * Compatible with Migration 008 + 009 schema
 *
 * @param stationId - The UUID of the station to fetch water level data for
 * @returns Query object with water level data, station info, loading state, and error
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { WaterLevelData, WaterLevelStation } from '../types/index';

interface UseWaterLevelDataReturn {
  waterLevelData: WaterLevelData | null;
  station: WaterLevelStation | null;
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
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle() to allow null if no data exists yet

  if (waterLevelError) {
    throw new Error(`Failed to fetch water level data: ${waterLevelError.message}`);
  }

  // Transform station data to match TypeScript interface
  const stationDataAny = stationData as any;
  const station: WaterLevelStation = {
    id: stationDataAny.id,
    stationId: stationDataAny.station_id,
    name: stationDataAny.name,
    river: stationDataAny.river,
    riverKm: stationDataAny.river_km,
    latitude: stationDataAny.latitude,
    longitude: stationDataAny.longitude,
    lowWaterLevelCm: stationDataAny.low_water_level_cm,
    highWaterLevelCm: stationDataAny.high_water_level_cm,
    alertLevelCm: stationDataAny.alert_level_cm,
    dangerLevelCm: stationDataAny.danger_level_cm,
    isActive: stationDataAny.is_active,
    createdAt: stationDataAny.created_at,
    updatedAt: stationDataAny.updated_at,
  };

  // Transform water level data if it exists
  const waterLevelDataAny = waterLevelData as any;
  const currentData: WaterLevelData | null = waterLevelDataAny
    ? {
        id: waterLevelDataAny.id,
        stationId: waterLevelDataAny.station_id,
        measuredAt: waterLevelDataAny.measured_at,
        waterLevelCm: waterLevelDataAny.water_level_cm,
        flowRateM3s: waterLevelDataAny.flow_rate_m3s,
        waterTempCelsius: waterLevelDataAny.water_temp_celsius,
        source: waterLevelDataAny.source,
        createdAt: waterLevelDataAny.created_at,
      }
    : null;

  return {
    station,
    waterLevelData: currentData,
  };
}

/**
 * Custom hook to fetch water level data with caching
 *
 * PERFORMANCE OPTIMIZATION:
 * - staleTime: 20 minutes (water levels update hourly at :10)
 * - refetchInterval: 20 minutes (automatic background refresh)
 * - retry: 3 attempts with exponential backoff
 */
export function useWaterLevelData(stationId: string | null): UseWaterLevelDataReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['waterLevel', stationId],
    queryFn: () => fetchWaterLevelData(stationId!),
    enabled: !!stationId, // Only run if stationId is provided
    staleTime: 20 * 60 * 1000, // Consider data fresh for 20 minutes
    refetchInterval: 20 * 60 * 1000, // Refetch every 20 minutes
    retry: 3, // Retry failed requests 3 times
  });

  return {
    waterLevelData: data?.waterLevelData || null,
    station: data?.station || null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
