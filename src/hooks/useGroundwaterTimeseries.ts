/**
 * useGroundwaterTimeseries Hook
 *
 * Fetches 365-day groundwater level timeseries data for chart visualization.
 * Returns historical water level measurements for a selected well.
 * Frontend will sample every 5th day to show ~73 data points for optimal trend visualization.
 *
 * @param wellId - The ID of the well to fetch timeseries data for
 * @returns Query object with timeseries data array, loading state, and error
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface GroundwaterTimeseriesPoint {
  timestamp: string;
  waterLevelMeters: number;
  waterLevelMasl: number | null;
  waterTemperature: number | null;
}

interface UseGroundwaterTimeseriesReturn {
  timeseriesData: GroundwaterTimeseriesPoint[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

// Database row type
interface GroundwaterDataRow {
  timestamp: string;
  water_level_meters: number;
  water_level_masl: number | null;
  water_temperature: number | null;
}

/**
 * Fetch 365-day groundwater timeseries for a well
 * (Changed from 60-day to get better long-term trend visualization)
 */
async function fetchGroundwaterTimeseries(wellId: string) {
  // Calculate date range (365 days ago to now)
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('groundwater_data')
    .select('timestamp, water_level_meters, water_level_masl, water_temperature')
    .eq('well_id', wellId)
    .gte('timestamp', oneYearAgo.toISOString())
    .order('timestamp', { ascending: true }) as {
      data: GroundwaterDataRow[] | null;
      error: any;
    }; // Chronological order for chart

  if (error) {
    throw new Error(`Failed to fetch groundwater timeseries: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Transform to typed data
  return data.map((point) => ({
    timestamp: point.timestamp,
    waterLevelMeters: point.water_level_meters,
    waterLevelMasl: point.water_level_masl,
    waterTemperature: point.water_temperature
  }));
}

/**
 * Custom hook to fetch 365-day groundwater timeseries with caching
 * Frontend will sample every 5th day for optimal visualization (~73 points)
 */
export function useGroundwaterTimeseries(wellId: string | null): UseGroundwaterTimeseriesReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['groundwater-timeseries', wellId],
    queryFn: () => fetchGroundwaterTimeseries(wellId!),
    enabled: !!wellId, // Only run if wellId is provided
    staleTime: 1 * 60 * 60 * 1000, // Consider data fresh for 1 hour
    refetchInterval: 1 * 60 * 60 * 1000, // Refetch every 1 hour
    retry: 3, // Retry failed requests 3 times
  });

  return {
    timeseriesData: data || [],
    isLoading,
    error: error as Error | null,
    refetch
  };
}
