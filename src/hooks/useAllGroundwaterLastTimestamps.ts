/**
 * useAllGroundwaterLastTimestamps Hook
 *
 * Fetches last measurement timestamp for all enabled groundwater wells.
 * Used by GroundwaterTimestampTable to display data freshness.
 *
 * Created: 2026-01-24
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface WellLastTimestamp {
  wellId: string;
  wellName: string;
  wellCode: string;
  cityName: string;
  lastTimestamp: string | null;
}

interface UseAllGroundwaterLastTimestampsReturn {
  timestamps: WellLastTimestamp[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

async function fetchAllWellTimestamps(): Promise<WellLastTimestamp[]> {
  const { data, error } = await supabase.rpc('get_all_well_last_timestamps') as {
    data: any[] | null;
    error: any;
  };

  if (error) {
    throw new Error(`Failed to fetch well timestamps: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    wellId: row.well_id,
    wellName: row.well_name,
    wellCode: row.well_code,
    cityName: row.city_name,
    lastTimestamp: row.last_timestamp,
  }));
}

/**
 * Custom hook to fetch last timestamps for all enabled groundwater wells
 *
 * PERFORMANCE OPTIMIZATION:
 * - 5-minute cache: Balances freshness with API call reduction
 * - Auto-refresh every 5 minutes: Keeps data current
 * - Background refetch: Updates silently while showing cached data
 */
export function useAllGroundwaterLastTimestamps(): UseAllGroundwaterLastTimestampsReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['groundwater-all-timestamps'],
    queryFn: fetchAllWellTimestamps,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 3,
  });

  return {
    timestamps: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
