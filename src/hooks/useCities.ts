/**
 * useCities Hook
 *
 * Fetches the list of meteorology cities from Supabase.
 * Replaces MOCK_CITIES with real database data.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { City, Region } from '../types';

interface UseCitiesReturn {
  cities: City[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch meteorology cities from Supabase, optionally filtered by region.
 *
 * - No region (legacy): only is_active=true rows (all of which are Duna in prod).
 * - region='duna': region='duna' AND is_active=true (unchanged behaviour).
 * - region='drava': region='drava' WITHOUT the is_active filter — Dráva rows ship
 *   is_active=false until the go-live migration, so the region-aware develop build
 *   must surface them. (TODO go-live: drop this exception once Dráva is_active=true.)
 */
async function fetchCities(region?: Region | null): Promise<City[]> {
  let query = supabase.from('meteorology_cities').select('*');

  if (region) {
    query = query.eq('region', region);
    if (region === 'duna') query = query.eq('is_active', true);
  } else {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('name');

  if (error) {
    throw new Error(`Failed to fetch cities: ${error.message}`);
  }

  // Transform database fields to match City type
  return (data || []).map((city) => ({
    id: (city as Record<string, unknown>).id as string,
    name: (city as Record<string, unknown>).name as string,
    county: (city as Record<string, unknown>).county as string,
    latitude: (city as Record<string, unknown>).latitude as number,
    longitude: (city as Record<string, unknown>).longitude as number,
    population: (city as Record<string, unknown>).population as number,
    isActive: (city as Record<string, unknown>).is_active as boolean,
    region: (city as Record<string, unknown>).region as Region | undefined,
  }));
}

/**
 * Custom hook to fetch cities with caching
 *
 * PERFORMANCE OPTIMIZATION:
 * Cities are static data that rarely changes, so we cache for 24 hours.
 * This reduces API calls and improves offline experience.
 */
export function useCities(region?: Region | null): UseCitiesReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cities', region ?? 'all'],
    queryFn: () => fetchCities(region),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (static data)
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    retry: 3, // Retry failed requests 3 times
  });

  return {
    cities: data || [],
    isLoading,
    error: error as Error | null,
  };
}
