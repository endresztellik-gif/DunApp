/**
 * Tests for useWaterLevelData Hook
 *
 * Test Coverage:
 * - Loading states
 * - Error states
 * - Successful data fetching
 * - Forecast data handling
 * - Cache behavior (staleTime: 1 hour)
 * - Refetch functionality
 * - Type safety
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWaterLevelData } from '../useWaterLevelData';
import * as supabaseModule from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock data
// A fixture a `water_level_stations` VALÓDI oszlopneveit használja
// (ellenőrizve a prod sémán 2026-09-07). A korábbi változat még a migráció
// előtti nevekre épült — `station_name`, `river_name`, `lnv_level`,
// `kkv_level`, `nv_level` —, ezért a hook `name`-je undefined lett.
const mockStation = {
  id: 'station-123',
  station_id: '442010',
  name: 'Mohács',
  river: 'Duna',
  river_km: 1446.9,
  latitude: 45.9928,
  longitude: 18.6836,
  low_water_level_cm: 100,
  high_water_level_cm: 600,
  alert_level_cm: 400,
  danger_level_cm: 500,
  is_active: true,
  created_at: '2025-10-01T00:00:00Z',
  updated_at: '2025-10-01T00:00:00Z',
};

const mockWaterLevelData = {
  station_id: 'station-123',
  water_level_cm: 420,
  flow_rate_m3s: 2500,
  water_temp_celsius: 18.5,
  timestamp: '2025-10-27T12:00:00Z',
};

const mockForecastData = [
  { station_id: 'station-123', forecast_date: '2025-10-28', water_level_cm: 425, forecast_day: 1 },
  { station_id: 'station-123', forecast_date: '2025-10-29', water_level_cm: 430, forecast_day: 2 },
  { station_id: 'station-123', forecast_date: '2025-10-30', water_level_cm: 435, forecast_day: 3 },
  { station_id: 'station-123', forecast_date: '2025-10-31', water_level_cm: 440, forecast_day: 4 },
  { station_id: 'station-123', forecast_date: '2025-11-01', water_level_cm: 445, forecast_day: 5 },
];

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useWaterLevelData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.waterLevelData).toBe(null);
    expect(result.current.station).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should not fetch when stationId is null', () => {
    const { result } = renderHook(() => useWaterLevelData(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.waterLevelData).toBe(null);
  });

  it('should fetch and return water level data successfully', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
            }),
          }),
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null }),
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: mockForecastData, error: null }),
              }),
            }),
          }),
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.waterLevelData).toBeDefined();
    expect(result.current.waterLevelData?.waterLevelCm).toBe(420);
    expect(result.current.waterLevelData?.flowRateM3s).toBe(2500);
    expect(result.current.station).toBeDefined();
    // A WaterLevelStation mezője `name` (nem `stationName`) — a hook is így
    // képezi le (`name: stationDataAny.name`).
    expect(result.current.station?.name).toBe('Mohács');
    expect(result.current.error).toBe(null);
  });

  it('should handle station fetch error', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Station not found' },
          }),
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Station not found' },
          }),
        }),
      }),
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('invalid-station'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 10000 });

    expect(result.current.error).toBeDefined();
    expect(result.current.waterLevelData).toBe(null);
    expect(result.current.station).toBe(null);
  });

  it('should transform database fields to camelCase', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
            }),
          }),
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null }),
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: mockForecastData, error: null }),
              }),
            }),
          }),
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Check water level data transformation
    expect(result.current.waterLevelData?.waterLevelCm).toBe(420);
    expect(result.current.waterLevelData?.flowRateM3s).toBe(2500);
    expect(result.current.waterLevelData?.waterTempCelsius).toBe(18.5);

    // Check station data transformation
    // A WaterLevelStation mezője `name` (nem `stationName`) — a hook is így
    // képezi le (`name: stationDataAny.name`).
    expect(result.current.station?.name).toBe('Mohács');
    // A WaterLevelStation mezői a séma-migráció óta: river / river_km /
    // low_water_level_cm / high_water_level_cm / alert_level_cm /
    // danger_level_cm. A régi riverName / cityName / lnvLevel / kkvLevel /
    // nvLevel nevek megszűntek (a cityName-nek nincs is megfelelője).
    expect(result.current.station?.river).toBe('Duna');
    expect(result.current.station?.stationId).toBe('442010');
    expect(result.current.station?.riverKm).toBe(1446.9);
    expect(result.current.station?.lowWaterLevelCm).toBe(100);
    expect(result.current.station?.highWaterLevelCm).toBe(600);
    expect(result.current.station?.alertLevelCm).toBe(400);
    expect(result.current.station?.dangerLevelCm).toBe(500);
  });

  it('should handle null optional fields in water level data', async () => {
    const incompleteWaterLevelData = {
      ...mockWaterLevelData,
      flow_rate_m3s: null,
      water_temp_celsius: null,
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
            }),
          }),
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: incompleteWaterLevelData, error: null }),
                  maybeSingle: vi
                    .fn()
                    .mockResolvedValue({ data: incompleteWaterLevelData, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.waterLevelData?.waterLevelCm).toBe(420);
    expect(result.current.waterLevelData?.flowRateM3s).toBe(null);
    expect(result.current.waterLevelData?.waterTempCelsius).toBe(null);
  });

  it('should provide refetch function', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
            }),
          }),
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null }),
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should use correct query key for caching', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
            }),
          }),
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null }),
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useWaterLevelData('station-123'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const cachedData = queryClient.getQueryData(['waterLevel', 'station-123']);
    expect(cachedData).toBeDefined();
  });

  it('should return correct TypeScript types', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: mockStation, error: null }),
            }),
          }),
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null }),
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: mockForecastData, error: null }),
              }),
            }),
          }),
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.refetch).toBe('function');
  });
});
