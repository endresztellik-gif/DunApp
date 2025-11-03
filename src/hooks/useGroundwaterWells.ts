/**
 * useGroundwaterWells Hook
 *
 * Fetches the list of groundwater monitoring wells from Supabase.
 * Similar to useCities but for groundwater wells.
 *
 * Created: 2025-11-03 (Phase 5)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { GroundwaterWell } from '../types';

interface UseGroundwaterWellsReturn {
  wells: GroundwaterWell[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch all active groundwater wells from Supabase
 */
async function fetchGroundwaterWells(): Promise<GroundwaterWell[]> {
  const { data, error } = await supabase
    .from('groundwater_wells')
    .select('*')
    .eq('is_active', true)
    .order('well_name');

  if (error) {
    throw new Error(`Failed to fetch groundwater wells: ${error.message}`);
  }

  // Transform database fields to match GroundwaterWell type
  return ((data as any[]) || []).map((well: any) => ({
    id: well.id,
    wellName: well.well_name,
    wellCode: well.well_code,
    county: well.county,
    cityName: well.city_name,
    latitude: well.latitude,
    longitude: well.longitude,
    depthMeters: well.depth_meters,
    wellType: well.well_type,
    isActive: well.is_active,
  }));
}

/**
 * Custom hook to fetch groundwater wells with caching
 *
 * PERFORMANCE OPTIMIZATION:
 * Wells are static data that rarely changes, so we cache for 24 hours.
 * This reduces API calls and improves offline experience.
 */
export function useGroundwaterWells(): UseGroundwaterWellsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['groundwaterWells'],
    queryFn: fetchGroundwaterWells,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (static data)
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    retry: 3, // Retry failed requests 3 times
  });

  return {
    wells: data || [],
    isLoading,
    error: error as Error | null,
  };
}
