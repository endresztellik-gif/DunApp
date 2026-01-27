/**
 * useGroundwaterTimeseries Hook
 *
 * Fetches ALL available groundwater level timeseries data for chart visualization.
 * Returns historical water level measurements for a selected well.
 * Frontend will sample every 5th day for optimal trend visualization.
 *
 * NOTE: Database contains 14 months of data (Nov 2024 → Jan 2026) from vizugy.hu:
 * - Scraper fetches 30-day increments every 5 days (cron schedule)
 * - Database accumulates data through daily incremental scraping
 * - No date range filter applied - fetches ALL available data
 * - .limit(10000) protects against excessive data (sufficient for years of 4-hour samples)
 *
 * BUG FIX (2026-01-27): Removed .gte() date filter that was excluding fresh data
 * causing charts to show stale data (Oct 15) while timestamp table showed Jan 25.
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
 * Fetch groundwater timeseries for a well (ALL available data, no date filter)
 * Database contains 14 months of historical data (Nov 2024 → Jan 2026) from vizugy.hu.
 * Scraper runs every 5 days, fetching 30-day increments (API limitation).
 */
async function fetchGroundwaterTimeseries(wellId: string) {
  // No date filtering - fetch ALL available data from database
  // Database self-limits to ~14 months through 5-day incremental scraping
  // .limit(10000) protects against excessive data (sufficient for years)

  const { data, error} = await supabase
    .from('groundwater_data')
    .select('timestamp, water_level_meters, water_level_masl, water_temperature')
    .eq('well_id', wellId)
    // Fetch ALL available data (no date filter) - database only has 14 months
    .order('timestamp', { ascending: true })
    .limit(10000) as {
      data: GroundwaterDataRow[] | null;
      error: any;
    }; // Chronological order for chart (limit 10k to handle wells with dense data)

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
