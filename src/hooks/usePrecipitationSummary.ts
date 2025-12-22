/**
 * usePrecipitationSummary Hook
 *
 * Custom hook to fetch precipitation summary data for a selected city.
 * Uses React Query for caching and automatic refetching.
 *
 * Data includes:
 * - Last 7 days precipitation (mm)
 * - Last 30 days precipitation (mm)
 * - Year-to-date precipitation (mm)
 *
 * @param cityId - The ID of the city to fetch precipitation data for
 * @returns Query object with precipitation data, loading state, and error
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface PrecipitationSummary {
  cityId: string;
  last7Days: number;
  last30Days: number;
  yearToDate: number;
  updatedAt: string;
}

interface UsePrecipitationSummaryReturn {
  precipitationData: PrecipitationSummary | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Fetch the precipitation summary for a city
 */
async function fetchPrecipitationSummary(cityId: string): Promise<PrecipitationSummary> {
  const { data, error } = await supabase
    .from('precipitation_summary')
    .select('*')
    .eq('city_id', cityId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch precipitation summary: ${error.message}`);
  }

  // Transform database fields to match PrecipitationSummary type
  return {
    cityId: (data as Record<string, unknown>).city_id as string,
    last7Days: (data as Record<string, unknown>).last_7_days as number ?? 0,
    last30Days: (data as Record<string, unknown>).last_30_days as number ?? 0,
    yearToDate: (data as Record<string, unknown>).year_to_date as number ?? 0,
    updatedAt: (data as Record<string, unknown>).updated_at as string,
  };
}

/**
 * Custom hook to fetch precipitation summary with caching
 */
export function usePrecipitationSummary(cityId: string | null): UsePrecipitationSummaryReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['precipitation', cityId],
    queryFn: () => fetchPrecipitationSummary(cityId!),
    enabled: !!cityId, // Only run if cityId is provided
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes (ensures fresh data)
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to window/tab
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 3, // Retry failed requests 3 times
  });

  return {
    precipitationData: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
