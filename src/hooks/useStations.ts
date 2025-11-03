/**
 * useStations Hook
 *
 * Fetches the list of water level monitoring stations from Supabase.
 * Similar to useCities but for water level stations.
 *
 * Created: 2025-11-03 (Phase 4.5b)
 * Compatible with Migration 008 schema
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { WaterLevelStation } from '../types';

interface UseStationsReturn {
  stations: WaterLevelStation[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch all active water level monitoring stations from Supabase
 */
async function fetchStations(): Promise<WaterLevelStation[]> {
  const { data, error } = await supabase
    .from('water_level_stations')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch stations: ${error.message}`);
  }

  // Transform database fields to match WaterLevelStation type
  return ((data as any[]) || []).map((station: any) => ({
    id: station.id,
    stationId: station.station_id,
    name: station.name,
    river: station.river,
    riverKm: station.river_km,
    latitude: station.latitude,
    longitude: station.longitude,
    lowWaterLevelCm: station.low_water_level_cm,
    highWaterLevelCm: station.high_water_level_cm,
    alertLevelCm: station.alert_level_cm,
    dangerLevelCm: station.danger_level_cm,
    isActive: station.is_active,
    createdAt: station.created_at,
    updatedAt: station.updated_at,
  }));
}

/**
 * Custom hook to fetch stations with caching
 *
 * PERFORMANCE OPTIMIZATION:
 * Stations are static data that rarely changes, so we cache for 24 hours.
 * This reduces API calls and improves offline experience.
 */
export function useStations(): UseStationsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['waterLevelStations'],
    queryFn: fetchStations,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (static data)
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    retry: 3, // Retry failed requests 3 times
  });

  return {
    stations: data || [],
    isLoading,
    error: error as Error | null,
  };
}
