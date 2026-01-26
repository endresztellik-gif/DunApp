/**
 * useGroundwaterTimeseries Hook
 *
 * Fetches up to 365-day groundwater level timeseries data for chart visualization.
 * Returns historical water level measurements for a selected well.
 * Frontend will sample every 5th day for optimal trend visualization.
 *
 * NOTE: Due to vizadat.hu API timeout limits (as of 2026-01-09):
 * - The scraper can only fetch 30 days at a time without timing out
 * - However, the database contains 8-9 months of historical data from previous scrapes
 * - Daily incremental fetching will gradually build up a full 365-day dataset
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
 * Fetch groundwater timeseries for a well (requests 365 days)
 * Database contains 8-9 months of historical data from incremental daily scraping.
 * Current API limitation: vizadat.hu times out for 60+ days, so only 30 days scraped daily (2026-01-09).
 */
async function fetchGroundwaterTimeseries(wellId: string) {
  // Calculate date range (365 days ago to now)
  // Database contains 8-9 months of accumulated data from daily incremental scraping
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
 * Custom hook to fetch groundwater timeseries with caching (requests 365 days)
 * Frontend samples every 5th day for optimal visualization (~73 points for 365 days)
 * Database currently contains 8-9 months of data from incremental daily scraping
 *
 * PERFORMANCE OPTIMIZATION (2026-01-26):
 * - Reduced cache from 1 hour to 5 minutes (matches timestamp table)
 * - Ensures chart shows fresh data after cron runs (every 5 days)
 * - Balances freshness with API call reduction
 */
export function useGroundwaterTimeseries(wellId: string | null): UseGroundwaterTimeseriesReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['groundwater-timeseries', wellId],
    queryFn: () => fetchGroundwaterTimeseries(wellId!),
    enabled: !!wellId, // Only run if wellId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes cache (was 1 hour)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes (was 1 hour)
    retry: 3, // Retry failed requests 3 times
  });

  return {
    timeseriesData: data || [],
    isLoading,
    error: error as Error | null,
    refetch
  };
}
