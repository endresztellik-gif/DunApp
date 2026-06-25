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
import type { GroundwaterWell, Region } from '../types';

interface UseGroundwaterWellsReturn {
  wells: GroundwaterWell[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch groundwater wells from Supabase, optionally filtered by region.
 *
 * Always filters is_active=true AND enabled=true; adds the region filter when given.
 * (Dráva wells are enabled=true since migration 028 — no special-casing needed.)
 */
async function fetchGroundwaterWells(region?: Region | null): Promise<GroundwaterWell[]> {
  let query = supabase.from('groundwater_wells').select('*').eq('is_active', true).eq('enabled', true);

  if (region) {
    query = query.eq('region', region);
  }

  const { data, error } = await query.order('well_name');

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
    enabled: well.enabled,
    region: well.region as Region | undefined,
  }));
}

/**
 * Custom hook to fetch groundwater wells with caching
 *
 * PERFORMANCE OPTIMIZATION:
 * Wells are static data that rarely changes, so we cache for 24 hours.
 * This reduces API calls and improves offline experience.
 */
export function useGroundwaterWells(region?: Region | null): UseGroundwaterWellsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['groundwaterWells', region ?? 'all'],
    queryFn: () => fetchGroundwaterWells(region),
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
