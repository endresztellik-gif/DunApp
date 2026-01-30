/**
 * useWaterBodiesThreeDayData Hook
 *
 * Fetches 3-day water level data for all water bodies (Kadia, FTCS, Belső-Béda).
 * Returns daily measurements with change from previous day.
 *
 * Created: 2026-01-30
 * Compatible with Migration 023 schema
 *
 * @returns Query object with 3-day data for each water body, loading state, and error
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface DayMeasurement {
  value: number; // Water level in cm
  change: number | null; // Change from previous day in cm (null if no previous data)
  timestamp: string; // ISO timestamp
}

interface WaterBodyThreeDayData {
  waterBodyId: string;
  waterBodyName: string;
  dayBeforeYesterday: DayMeasurement | null;
  yesterday: DayMeasurement | null;
  today: DayMeasurement | null;
}

interface UseWaterBodiesThreeDayDataReturn {
  waterBodiesData: WaterBodyThreeDayData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Fetch 3-day water level data for all water bodies
 */
async function fetchWaterBodiesThreeDayData(): Promise<WaterBodyThreeDayData[]> {
  // Get all water bodies
  const { data: waterBodies, error: waterBodiesError } = await supabase
    .from('water_bodies')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  if (waterBodiesError) {
    throw new Error(`Failed to fetch water bodies: ${waterBodiesError.message}`);
  }

  if (!waterBodies || waterBodies.length === 0) {
    return [];
  }

  // Calculate date range for last 3 days (UTC midnight)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setUTCDate(dayBeforeYesterday.getUTCDate() - 2);

  // Fetch measurements for each water body
  const waterBodiesData: WaterBodyThreeDayData[] = [];

  for (const waterBody of waterBodies) {
    // Get latest measurement for each of the last 3 days
    const { data: measurements, error: measurementsError } = await supabase
      .from('water_body_measurements')
      .select('measured_at, water_level_cm')
      .eq('water_body_id', waterBody.id)
      .gte('measured_at', dayBeforeYesterday.toISOString())
      .order('measured_at', { ascending: false });

    if (measurementsError) {
      console.error(`Failed to fetch measurements for ${waterBody.name}:`, measurementsError.message);
      continue;
    }

    // Group measurements by day and get latest for each day
    const measurementsByDay: { [key: string]: any } = {};

    if (measurements && measurements.length > 0) {
      for (const measurement of measurements) {
        const measurementDate = new Date(measurement.measured_at);
        measurementDate.setUTCHours(0, 0, 0, 0);
        const dayKey = measurementDate.toISOString();

        // Keep only the latest measurement for each day
        if (!measurementsByDay[dayKey]) {
          measurementsByDay[dayKey] = measurement;
        }
      }
    }

    // Get measurements for each day
    const todayKey = today.toISOString();
    const yesterdayKey = yesterday.toISOString();
    const dayBeforeYesterdayKey = dayBeforeYesterday.toISOString();

    const todayMeasurement = measurementsByDay[todayKey];
    const yesterdayMeasurement = measurementsByDay[yesterdayKey];
    const dayBeforeYesterdayMeasurement = measurementsByDay[dayBeforeYesterdayKey];

    // Calculate changes
    const dayBeforeYesterdayData: DayMeasurement | null = dayBeforeYesterdayMeasurement
      ? {
          value: dayBeforeYesterdayMeasurement.water_level_cm,
          change: null, // No previous day to compare
          timestamp: dayBeforeYesterdayMeasurement.measured_at,
        }
      : null;

    const yesterdayData: DayMeasurement | null = yesterdayMeasurement
      ? {
          value: yesterdayMeasurement.water_level_cm,
          change: dayBeforeYesterdayMeasurement
            ? yesterdayMeasurement.water_level_cm - dayBeforeYesterdayMeasurement.water_level_cm
            : null,
          timestamp: yesterdayMeasurement.measured_at,
        }
      : null;

    const todayData: DayMeasurement | null = todayMeasurement
      ? {
          value: todayMeasurement.water_level_cm,
          change: yesterdayMeasurement
            ? todayMeasurement.water_level_cm - yesterdayMeasurement.water_level_cm
            : null,
          timestamp: todayMeasurement.measured_at,
        }
      : null;

    waterBodiesData.push({
      waterBodyId: waterBody.id,
      waterBodyName: waterBody.name,
      dayBeforeYesterday: dayBeforeYesterdayData,
      yesterday: yesterdayData,
      today: todayData,
    });
  }

  return waterBodiesData;
}

/**
 * Custom hook to fetch 3-day water body data with caching
 *
 * PERFORMANCE OPTIMIZATION:
 * - staleTime: 30 minutes (measurements update daily at 9:00 AM)
 * - refetchInterval: 30 minutes (automatic background refresh)
 * - retry: 3 attempts with exponential backoff
 */
export function useWaterBodiesThreeDayData(): UseWaterBodiesThreeDayDataReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['waterBodiesThreeDay'],
    queryFn: fetchWaterBodiesThreeDayData,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
    retry: 3,
  });

  return {
    waterBodiesData: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
