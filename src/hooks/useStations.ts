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
import type { WaterLevelStation, Region } from '../types';

interface UseStationsReturn {
  stations: WaterLevelStation[];
  isLoading: boolean;
  error: Error | null;
}

const RIVER_BY_REGION: Record<Region, string> = { duna: 'Duna', drava: 'Dráva' };

/**
 * Fetch water level monitoring stations from Supabase, optionally filtered by region.
 *
 * Region maps to the station's river: duna→'Duna', drava→'Dráva'.
 * - region='drava' skips the is_active filter — Dráva stations ship is_active=false
 *   until go-live, yet the develop build must surface them.
 *   (TODO go-live: drop this exception once Dráva stations are is_active=true.)
 */
async function fetchStations(region?: Region | null): Promise<WaterLevelStation[]> {
  let query = supabase.from('water_level_stations').select('*');

  if (region) {
    query = query.eq('river', RIVER_BY_REGION[region]);
    if (region === 'duna') query = query.eq('is_active', true);
  } else {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('name');

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
export function useStations(region?: Region | null): UseStationsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['waterLevelStations', region ?? 'all'],
    queryFn: () => fetchStations(region),
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
