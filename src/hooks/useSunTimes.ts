/**
 * useSunTimes Hook
 *
 * Calculates sunrise and sunset times for Budapest using SunCalc.
 * Data cached for 24 hours and automatically refreshes at midnight.
 *
 * Features:
 * - Client-side calculation (no API calls)
 * - 24-hour cache with midnight refresh
 * - Budapest coordinates: 47.4979°N, 19.0402°E
 * - Hungarian timezone (Europe/Budapest)
 */

import { useQuery } from '@tanstack/react-query';
import SunCalc from 'suncalc';

// Budapest coordinates
const BUDAPEST_COORDS = {
  lat: 47.4979,
  lon: 19.0402,
};

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  calculatedAt: Date;
}

interface UseSunTimesReturn {
  sunTimes: SunTimes | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Calculate milliseconds until next midnight (for refetchInterval)
 *
 * This ensures data refreshes automatically at midnight when
 * sunrise/sunset times change for the new day.
 */
function getMillisecondsUntilMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0); // Next midnight
  return tomorrow.getTime() - now.getTime();
}

/**
 * Calculate sunrise and sunset times using SunCalc
 *
 * SunCalc returns Date objects in local timezone (Europe/Budapest)
 * automatically, so no manual timezone conversion is needed.
 */
async function calculateSunTimes(): Promise<SunTimes> {
  try {
    const now = new Date();
    const times = SunCalc.getTimes(now, BUDAPEST_COORDS.lat, BUDAPEST_COORDS.lon);

    if (!times.sunrise || !times.sunset) {
      throw new Error('SunCalc returned invalid times');
    }

    return {
      sunrise: times.sunrise,
      sunset: times.sunset,
      calculatedAt: now,
    };
  } catch (error) {
    console.error('Failed to calculate sun times:', error);
    throw new Error('Sun time calculation failed');
  }
}

/**
 * Custom hook to fetch sun times with 24h caching
 *
 * React Query Configuration:
 * - staleTime: 24 hours (data fresh all day)
 * - refetchInterval: Dynamic - recalculates at next midnight
 * - refetchOnWindowFocus: false (no need, data changes daily)
 * - refetchOnMount: false (use cache if within 24h)
 * - retry: 1 (calculation rarely fails, minimal retry)
 */
export function useSunTimes(): UseSunTimesReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sunTimes', 'budapest'],
    queryFn: calculateSunTimes,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - data fresh all day
    refetchInterval: getMillisecondsUntilMidnight, // Recalculate at midnight
    retry: 1, // Minimal retry (calculation rarely fails)
    refetchOnWindowFocus: false, // No need - data changes daily only
    refetchOnMount: false, // Use cache if within 24h
    refetchOnReconnect: false, // No need - fully client-side
  });

  return {
    sunTimes: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
