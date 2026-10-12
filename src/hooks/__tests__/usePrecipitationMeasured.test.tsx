/**
 * usePrecipitationMeasured Hook Tests
 *
 * Mért / interpolált csapadék-összesítés: snake_case → camelCase leképezés,
 * "nincs sor" (nincs elég közeli állomás) → null, hibakezelés.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePrecipitationMeasured } from '../usePrecipitationMeasured';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../lib/supabase';

const mockMaybeSingle = (result: { data: unknown; error: unknown }) => {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  vi.mocked(supabase.from).mockReturnValue({ select } as never);
  return { select, eq, maybeSingle };
};

describe('usePrecipitationMeasured', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // A hook saját `retry: 3`-at ad, ami felülírja a defaultOptions-t → retryDelay: 0,
    // különben a hibaág tesztjei a visszalépési várakozáson időznek ki.
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0, gcTime: 0 } },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const row = {
    city_id: 'city-1',
    last_7_days: '23.6',
    last_30_days: 31.2,
    year_to_date: '403.4',
    days_available_7: 7,
    days_available_30: 30,
    days_measured_ytd: 250,
    days_modeled_ytd: 33,
    days_expected_ytd: 283,
    data_through: '2026-10-10',
    method: 'idw',
    stations: [{ id: '38411', name: 'Pörböly', km: '18.0' }],
    nearest_km: '18.0',
    updated_at: '2026-10-12T07:30:00Z',
  };

  it('a mezőket camelCase-re képezi, a numerikus szövegeket számmá alakítja', async () => {
    const { select, eq } = mockMaybeSingle({ data: row, error: null });

    const { result } = renderHook(() => usePrecipitationMeasured('city-1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('precipitation_measured_summary');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('city_id', 'city-1');
    expect(result.current.precipitationData).toEqual({
      cityId: 'city-1',
      last7Days: 23.6,
      last30Days: 31.2,
      yearToDate: 403.4,
      daysAvailable7: 7,
      daysAvailable30: 30,
      daysMeasuredYtd: 250,
      daysModeledYtd: 33,
      daysExpectedYtd: 283,
      dataThrough: '2026-10-10',
      method: 'idw',
      stations: [{ id: '38411', name: 'Pörböly', km: 18 }],
      nearestKm: 18,
      updatedAt: '2026-10-12T07:30:00Z',
    });
  });

  it('a hiányzó (null) összeg null marad, nem lesz belőle 0 mm', async () => {
    mockMaybeSingle({
      data: { ...row, last_7_days: null, last_30_days: null, year_to_date: null },
      error: null,
    });

    const { result } = renderHook(() => usePrecipitationMeasured('city-1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.precipitationData?.last7Days).toBeNull();
    expect(result.current.precipitationData?.yearToDate).toBeNull();
  });

  it('nincs sor (nincs elég közeli állomás) → null adat, nem hiba', async () => {
    mockMaybeSingle({ data: null, error: null });

    const { result } = renderHook(() => usePrecipitationMeasured('city-9'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.precipitationData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('adatbázis-hibánál hibát ad', async () => {
    mockMaybeSingle({ data: null, error: { message: 'boom' } });

    const { result } = renderHook(() => usePrecipitationMeasured('city-1'), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 5000 });

    expect(result.current.error?.message).toContain('boom');
    expect(result.current.precipitationData).toBeNull();
  });

  it('cityId nélkül nem kérdez le semmit', () => {
    const { result } = renderHook(() => usePrecipitationMeasured(null), { wrapper });

    expect(supabase.from).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.precipitationData).toBeNull();
  });
});
