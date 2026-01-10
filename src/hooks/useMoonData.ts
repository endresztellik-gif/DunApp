/**
 * useMoonData Hook
 *
 * Calculates moon rise, set times and phase for Budapest using SunCalc.
 * Data cached for 24 hours and automatically refreshes at midnight.
 *
 * Features:
 * - Client-side calculation (no API calls)
 * - 24-hour cache with midnight refresh
 * - Budapest coordinates: 47.4979°N, 19.0402°E
 * - Hungarian timezone (Europe/Budapest)
 * - Moon phase names in Hungarian
 */

import { useQuery } from '@tanstack/react-query';
import SunCalc from 'suncalc';

// Budapest coordinates (same as sun times)
const BUDAPEST_COORDS = {
  lat: 47.4979,
  lon: 19.0402,
};

export interface MoonData {
  moonrise: Date | null;
  moonset: Date | null;
  phase: number; // 0-1 (0 = new moon, 0.5 = full moon)
  illumination: number; // 0-1 (percentage of moon illuminated)
  phaseName: string; // Hungarian moon phase name
  alwaysUp: boolean; // Moon never sets (polar regions)
  alwaysDown: boolean; // Moon never rises (polar regions)
  calculatedAt: Date;
}

interface UseMoonDataReturn {
  moonData: MoonData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Get Hungarian moon phase name based on phase value
 *
 * Phase cycle:
 * 0.00 - 0.05: Újhold (New Moon)
 * 0.05 - 0.25: Növekvő hold (Waxing Crescent)
 * 0.25 - 0.30: Első negyed (First Quarter)
 * 0.30 - 0.50: Növekvő hold (Waxing Gibbous)
 * 0.50 - 0.55: Telihold (Full Moon)
 * 0.55 - 0.75: Fogyó hold (Waning Gibbous)
 * 0.75 - 0.80: Utolsó negyed (Last Quarter)
 * 0.80 - 1.00: Fogyó hold (Waning Crescent)
 */
function getMoonPhaseName(phase: number): string {
  if (phase < 0.05 || phase >= 0.95) {
    return 'Újhold';
  } else if (phase < 0.25) {
    return 'Növekvő holdsarló';
  } else if (phase < 0.30) {
    return 'Első negyed';
  } else if (phase < 0.50) {
    return 'Növekvő púpos hold';
  } else if (phase < 0.55) {
    return 'Telihold';
  } else if (phase < 0.75) {
    return 'Fogyó púpos hold';
  } else if (phase < 0.80) {
    return 'Utolsó negyed';
  } else {
    return 'Fogyó holdsarló';
  }
}

/**
 * Calculate milliseconds until next midnight (for refetchInterval)
 *
 * This ensures data refreshes automatically at midnight when
 * moon times change for the new day.
 */
function getMillisecondsUntilMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0); // Next midnight
  return tomorrow.getTime() - now.getTime();
}

/**
 * Calculate moon data using SunCalc
 *
 * SunCalc returns Date objects in local timezone (Europe/Budapest)
 * automatically, so no manual timezone conversion is needed.
 */
async function calculateMoonData(): Promise<MoonData> {
  try {
    const now = new Date();

    // Get moon times (rise/set)
    const moonTimes = SunCalc.getMoonTimes(now, BUDAPEST_COORDS.lat, BUDAPEST_COORDS.lon);

    // Get moon illumination (phase)
    const moonIllumination = SunCalc.getMoonIllumination(now);

    // Get Hungarian phase name
    const phaseName = getMoonPhaseName(moonIllumination.phase);

    return {
      moonrise: moonTimes.rise || null,
      moonset: moonTimes.set || null,
      phase: moonIllumination.phase,
      illumination: moonIllumination.fraction,
      phaseName,
      alwaysUp: moonTimes.alwaysUp || false,
      alwaysDown: moonTimes.alwaysDown || false,
      calculatedAt: now,
    };
  } catch (error) {
    console.error('Failed to calculate moon data:', error);
    throw new Error('Moon data calculation failed');
  }
}

/**
 * Custom hook to fetch moon data with 24h caching
 *
 * React Query Configuration:
 * - staleTime: 24 hours (data fresh all day)
 * - refetchInterval: Dynamic - recalculates at next midnight
 * - refetchOnWindowFocus: false (no need, data changes daily)
 * - refetchOnMount: false (use cache if within 24h)
 * - retry: 1 (calculation rarely fails, minimal retry)
 */
export function useMoonData(): UseMoonDataReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['moonData', 'budapest'],
    queryFn: calculateMoonData,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - data fresh all day
    refetchInterval: getMillisecondsUntilMidnight, // Recalculate at midnight
    retry: 1, // Minimal retry (calculation rarely fails)
    refetchOnWindowFocus: false, // No need - data changes daily only
    refetchOnMount: false, // Use cache if within 24h
    refetchOnReconnect: false, // No need - fully client-side
  });

  return {
    moonData: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
