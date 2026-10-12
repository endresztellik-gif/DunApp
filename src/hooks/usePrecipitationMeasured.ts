/**
 * usePrecipitationMeasured Hook
 *
 * Mérőállomásos (HungaroMet) vagy interpolált csapadék-összesítés egy településre.
 * A meglévő Open-Meteo alapú usePrecipitationSummary MELLETT működik (párhuzamos rendszer).
 *
 * Nincs sor a táblában = a településhez nincs elég közeli mérőállomás → `null` (nem hiba, nem 0 mm).
 *
 * @param cityId - A település azonosítója
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface PrecipitationStationRef {
  id: string;
  name: string;
  km: number | null;
}

export interface PrecipitationMeasured {
  cityId: string;
  /** null: az ablakban egyetlen napra sincs adat (nem 0 mm) */
  last7Days: number | null;
  last30Days: number | null;
  yearToDate: number | null;
  daysAvailable7: number;
  daysAvailable30: number;
  /** Mért vagy interpolált napok az év eleje óta */
  daysMeasuredYtd: number;
  /** Modellel (Open-Meteo) pótolt napok az év eleje óta */
  daysModeledYtd: number;
  /** Napok száma január 1-től az utolsó mérési napig (inkluzív) */
  daysExpectedYtd: number;
  /** Az utolsó feldolgozott mérési nap, YYYY-MM-DD */
  dataThrough: string;
  method: 'station' | 'idw';
  stations: PrecipitationStationRef[];
  nearestKm: number | null;
  updatedAt: string;
}

interface UsePrecipitationMeasuredReturn {
  precipitationData: PrecipitationMeasured | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

const toNumberOrNull = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);

async function fetchPrecipitationMeasured(cityId: string): Promise<PrecipitationMeasured | null> {
  const { data, error } = await supabase
    .from('precipitation_measured_summary')
    .select('*')
    .eq('city_id', cityId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch measured precipitation: ${error.message}`);
  }
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    cityId: row.city_id as string,
    last7Days: toNumberOrNull(row.last_7_days),
    last30Days: toNumberOrNull(row.last_30_days),
    yearToDate: toNumberOrNull(row.year_to_date),
    daysAvailable7: Number(row.days_available_7 ?? 0),
    daysAvailable30: Number(row.days_available_30 ?? 0),
    daysMeasuredYtd: Number(row.days_measured_ytd ?? 0),
    daysModeledYtd: Number(row.days_modeled_ytd ?? 0),
    daysExpectedYtd: Number(row.days_expected_ytd ?? 0),
    dataThrough: row.data_through as string,
    method: row.method as 'station' | 'idw',
    stations: ((row.stations as PrecipitationStationRef[] | null) ?? []).map((station) => ({
      id: station.id,
      name: station.name,
      km: toNumberOrNull(station.km),
    })),
    nearestKm: toNumberOrNull(row.nearest_km),
    updatedAt: row.updated_at as string,
  };
}

export function usePrecipitationMeasured(cityId: string | null): UsePrecipitationMeasuredReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['precipitation-measured', cityId],
    queryFn: () => fetchPrecipitationMeasured(cityId!),
    enabled: !!cityId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  });

  return {
    precipitationData: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
