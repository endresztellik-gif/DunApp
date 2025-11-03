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
  refetch: () => Promise<unknown>;
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
    .maybeSingle();

  if (groundwaterError) {
    throw new Error(`Failed to fetch groundwater data: ${groundwaterError.message}`);
  }

  // If no data exists yet, return null for groundwaterData
  if (!groundwaterData) {
    return {
      groundwaterData: null,
      well: {
        id: (wellData as Record<string, unknown>).id as string,
        wellName: (wellData as Record<string, unknown>).well_name as string,
        wellCode: (wellData as Record<string, unknown>).well_code as string,
        county: (wellData as Record<string, unknown>).county as string,
        cityName: (wellData as Record<string, unknown>).city_name as string,
        latitude: (wellData as Record<string, unknown>).latitude as number,
        longitude: (wellData as Record<string, unknown>).longitude as number,
        depthMeters: (wellData as Record<string, unknown>).depth_meters as number,
        wellType: (wellData as Record<string, unknown>).well_type as string,
        isActive: (wellData as Record<string, unknown>).is_active as boolean
      }
    };
  }

  return {
    groundwaterData: {
      wellId: (groundwaterData as Record<string, unknown>).well_id as string,
      waterLevelMeters: (groundwaterData as Record<string, unknown>).water_level_meters as number,
      waterLevelMasl: (groundwaterData as Record<string, unknown>).water_level_masl as number,
      waterTemperature: (groundwaterData as Record<string, unknown>).water_temperature as number,
      timestamp: (groundwaterData as Record<string, unknown>).timestamp as string
    },
    well: {
      id: (wellData as Record<string, unknown>).id as string,
      wellName: (wellData as Record<string, unknown>).well_name as string,
      wellCode: (wellData as Record<string, unknown>).well_code as string,
      county: (wellData as Record<string, unknown>).county as string,
      cityName: (wellData as Record<string, unknown>).city_name as string,
      latitude: (wellData as Record<string, unknown>).latitude as number,
      longitude: (wellData as Record<string, unknown>).longitude as number,
      depthMeters: (wellData as Record<string, unknown>).depth_meters as number,
      wellType: (wellData as Record<string, unknown>).well_type as string,
      isActive: (wellData as Record<string, unknown>).is_active as boolean
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
