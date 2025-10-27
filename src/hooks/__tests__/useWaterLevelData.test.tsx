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
    from: vi.fn()
  }
}));

// Mock data
const mockStation = {
  id: 'station-123',
  station_name: 'Mohács',
  river_name: 'Duna',
  city_name: 'Mohács',
  latitude: 45.9928,
  longitude: 18.6836,
  lnv_level: 100,
  kkv_level: 250,
  nv_level: 600,
  is_active: true,
  display_in_comparison: true
};

const mockWaterLevelData = {
  station_id: 'station-123',
  water_level_cm: 420,
  flow_rate_m3s: 2500,
  water_temp_celsius: 18.5,
  timestamp: '2025-10-27T12:00:00Z'
};

const mockForecastData = [
  { station_id: 'station-123', forecast_date: '2025-10-28', water_level_cm: 425, forecast_day: 1 },
  { station_id: 'station-123', forecast_date: '2025-10-29', water_level_cm: 430, forecast_day: 2 },
  { station_id: 'station-123', forecast_date: '2025-10-30', water_level_cm: 435, forecast_day: 3 },
  { station_id: 'station-123', forecast_date: '2025-10-31', water_level_cm: 440, forecast_day: 4 },
  { station_id: 'station-123', forecast_date: '2025-11-01', water_level_cm: 445, forecast_day: 5 }
];

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
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
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.waterLevelData).toBe(null);
    expect(result.current.station).toBe(null);
    expect(result.current.forecast).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should not fetch when stationId is null', () => {
    const { result } = renderHook(() => useWaterLevelData(null), {
      wrapper: createWrapper()
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
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null })
            })
          })
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null })
                })
              })
            })
          })
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: mockForecastData, error: null })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.waterLevelData).toBeDefined();
    expect(result.current.waterLevelData?.waterLevelCm).toBe(420);
    expect(result.current.waterLevelData?.flowRateM3s).toBe(2500);
    expect(result.current.station).toBeDefined();
    expect(result.current.station?.stationName).toBe('Mohács');
    expect(result.current.forecast).toHaveLength(5);
    expect(result.current.error).toBe(null);
  });

  it('should handle station fetch error', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Station not found' }
          })
        })
      })
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('invalid-station'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 10000 });

    expect(result.current.error).toBeDefined();
    expect(result.current.waterLevelData).toBe(null);
    expect(result.current.station).toBe(null);
  });

  it('should handle missing forecast data gracefully', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null })
            })
          })
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null })
                })
              })
            })
          })
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: null, error: null }) // No forecast data
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.waterLevelData).toBeDefined();
    expect(result.current.forecast).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should transform database fields to camelCase', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null })
            })
          })
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null })
                })
              })
            })
          })
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: mockForecastData, error: null })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Check water level data transformation
    expect(result.current.waterLevelData?.waterLevelCm).toBe(420);
    expect(result.current.waterLevelData?.flowRateM3s).toBe(2500);
    expect(result.current.waterLevelData?.waterTempCelsius).toBe(18.5);

    // Check station data transformation
    expect(result.current.station?.stationName).toBe('Mohács');
    expect(result.current.station?.riverName).toBe('Duna');
    expect(result.current.station?.cityName).toBe('Mohács');
    expect(result.current.station?.lnvLevel).toBe(100);
    expect(result.current.station?.kkvLevel).toBe(250);
    expect(result.current.station?.nvLevel).toBe(600);

    // Check forecast data transformation
    expect(result.current.forecast[0].waterLevelCm).toBe(425);
    expect(result.current.forecast[0].forecastDate).toBe('2025-10-28');
    expect(result.current.forecast[0].forecastDay).toBe(1);
  });

  it('should handle null optional fields in water level data', async () => {
    const incompleteWaterLevelData = {
      ...mockWaterLevelData,
      flow_rate_m3s: null,
      water_temp_celsius: null
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null })
            })
          })
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: incompleteWaterLevelData, error: null })
                })
              })
            })
          })
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper()
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
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null })
            })
          })
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null })
                })
              })
            })
          })
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper()
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
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null })
            })
          })
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null })
                })
              })
            })
          })
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            })
          })
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

  it('should validate forecast is sorted by day', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null })
            })
          })
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null })
                })
              })
            })
          })
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: mockForecastData, error: null })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const forecast = result.current.forecast;
    for (let i = 1; i < forecast.length; i++) {
      expect(forecast[i].forecastDay).toBeGreaterThan(forecast[i - 1].forecastDay);
    }
  });

  it('should return correct TypeScript types', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockStation, error: null })
            })
          })
        };
      }
      if (table === 'water_level_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelData, error: null })
                })
              })
            })
          })
        };
      }
      if (table === 'water_level_forecasts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: mockForecastData, error: null })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWaterLevelData('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(typeof result.current.isLoading).toBe('boolean');
    expect(Array.isArray(result.current.forecast)).toBe(true);
    expect(typeof result.current.refetch).toBe('function');
  });
});
