/**
 * useGroundwaterData Hook
 *
 * Custom hook to fetch groundwater level data for a selected well.
 * Uses React Query for caching and automatic refetching.
 *
 * @param wellId - The ID of the well to fetch groundwater data for
 * @returns Query object with groundwater data, well info, loading state, and error
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { GroundwaterData, GroundwaterWell } from '../types/index';

interface UseGroundwaterDataReturn {
  groundwaterData: GroundwaterData | null;
  well: GroundwaterWell | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch the latest groundwater data for a well
 */
async function fetchGroundwaterData(wellId: string) {
  // Get well data
  const { data: wellData, error: wellError } = await supabase
    .from('groundwater_wells')
    .select('*')
    .eq('id', wellId)
    .single();

  if (wellError) {
    throw new Error(`Failed to fetch well data: ${wellError.message}`);
  }

  // Get latest groundwater data
  const { data: groundwaterData, error: groundwaterError } = await supabase
    .from('groundwater_data')
    .select('*')
    .eq('well_id', wellId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (groundwaterError) {
    throw new Error(`Failed to fetch groundwater data: ${groundwaterError.message}`);
  }

  return {
    groundwaterData: {
      wellId: groundwaterData.well_id,
      waterLevelMeters: groundwaterData.water_level_meters,
      waterLevelMasl: groundwaterData.water_level_masl,
      waterTemperature: groundwaterData.water_temperature,
      timestamp: groundwaterData.timestamp
    },
    well: {
      id: wellData.id,
      wellName: wellData.well_name,
      wellCode: wellData.well_code,
      county: wellData.county,
      cityName: wellData.city_name,
      latitude: wellData.latitude,
      longitude: wellData.longitude,
      depthMeters: wellData.depth_meters,
      wellType: wellData.well_type,
      isActive: wellData.is_active
    }
  };
}

/**
 * Custom hook to fetch groundwater data with caching
 */
export function useGroundwaterData(wellId: string | null): UseGroundwaterDataReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['groundwater', wellId],
    queryFn: () => fetchGroundwaterData(wellId!),
    enabled: !!wellId, // Only run if wellId is provided
    staleTime: 24 * 60 * 60 * 1000, // Consider data fresh for 24 hours
    refetchInterval: 24 * 60 * 60 * 1000, // Refetch every 24 hours
    retry: 3, // Retry failed requests 3 times
  });

  return {
    groundwaterData: data?.groundwaterData || null,
    well: data?.well || null,
    isLoading,
    error: error as Error | null,
    refetch
  };
}
