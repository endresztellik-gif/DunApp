/**
 * useDroughtLocations Hook
 *
 * Fetches the list of drought monitoring locations from Supabase.
 * Similar to useCities but for drought monitoring locations.
 *
 * Created: 2025-11-03 (Phase 5)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DroughtLocation } from '../types';

interface UseDroughtLocationsReturn {
  locations: DroughtLocation[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch all active drought monitoring locations from Supabase
 */
async function fetchDroughtLocations(): Promise<DroughtLocation[]> {
  const { data, error } = await supabase
    .from('drought_locations')
    .select('*')
    .eq('is_active', true)
    .order('location_name');

  if (error) {
    throw new Error(`Failed to fetch drought locations: ${error.message}`);
  }

  // Transform database fields to match DroughtLocation type
  return ((data as any[]) || []).map((location: any) => ({
    id: location.id,
    locationName: location.location_name,
    locationType: location.location_type,
    county: location.county,
    latitude: location.latitude,
    longitude: location.longitude,
    isActive: location.is_active,
  }));
}

/**
 * Custom hook to fetch drought locations with caching
 *
 * PERFORMANCE OPTIMIZATION:
 * Locations are static data that rarely changes, so we cache for 24 hours.
 * This reduces API calls and improves offline experience.
 */
export function useDroughtLocations(): UseDroughtLocationsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['droughtLocations'],
    queryFn: fetchDroughtLocations,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (static data)
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    retry: 3, // Retry failed requests 3 times
  });

  return {
    locations: data || [],
    isLoading,
    error: error as Error | null,
  };
}
