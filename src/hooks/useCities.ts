/**
 * useCities Hook
 *
 * Fetches the list of meteorology cities from Supabase.
 * Replaces MOCK_CITIES with real database data.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { City } from '../types';

interface UseCitiesReturn {
  cities: City[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch all active meteorology cities from Supabase
 */
async function fetchCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from('meteorology_cities')
    .select('*')
    .eq('is_active', true)
    .order('name');

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
  }));
}

/**
 * Custom hook to fetch cities with caching
 *
 * PERFORMANCE OPTIMIZATION:
 * Cities are static data that rarely changes, so we cache for 24 hours.
 * This reduces API calls and improves offline experience.
 */
export function useCities(): UseCitiesReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
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
