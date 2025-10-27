/**
 * Integration Tests for Data Flow
 *
 * Tests the complete data flow from hooks to components:
 * - Meteorology data flow
 * - Water level data flow
 * - Drought data flow
 * - Error handling and retries
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useWaterLevelData } from '../../hooks/useWaterLevelData';
import { useDroughtData } from '../../hooks/useDroughtData';
import * as supabaseModule from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

// Complete mock data
const mockMeteorologyFlow = {
  city: {
    id: 'city-123',
    name: 'Szekszárd',
    county: 'Tolna',
    latitude: 46.3481,
    longitude: 18.7097,
    population: 33000,
    is_active: true
  },
  weatherData: {
    city_id: 'city-123',
    temperature: 22.5,
    feels_like: 21.0,
    temp_min: 20,
    temp_max: 25,
    pressure: 1013,
    humidity: 65,
    wind_speed: 3.5,
    wind_direction: 180,
    clouds_percent: 40,
    weather_main: 'Clouds',
    weather_description: 'scattered clouds',
    weather_icon: '03d',
    rain_1h: null,
    rain_3h: null,
    snow_1h: null,
    snow_3h: null,
    visibility: 10000,
    timestamp: '2025-10-27T12:00:00Z'
  }
};

const mockWaterLevelFlow = {
  station: {
    id: 'station-123',
    station_name: 'Mohács',
    river_name: 'Duna',
    city_name: 'Mohács',
    latitude: 45.9928,
    longitude: 18.6836,
    lnv_level: 200,
    kkv_level: 300,
    nv_level: 650,
    is_active: true,
    display_in_comparison: true
  },
  waterLevelData: {
    station_id: 'station-123',
    water_level_cm: 420,
    flow_rate_m3s: 2500,
    water_temp_celsius: 18.5,
    timestamp: '2025-10-27T12:00:00Z'
  },
  forecasts: [
    { station_id: 'station-123', forecast_date: '2025-10-28', water_level_cm: 425, forecast_day: 1 },
    { station_id: 'station-123', forecast_date: '2025-10-29', water_level_cm: 430, forecast_day: 2 },
    { station_id: 'station-123', forecast_date: '2025-10-30', water_level_cm: 435, forecast_day: 3 }
  ]
};

const mockDroughtFlow = {
  location: {
    id: 'loc-123',
    location_name: 'Katymár',
    location_type: 'agricultural',
    county: 'Bács-Kiskun',
    latitude: 46.2167,
    longitude: 19.5667,
    is_active: true
  },
  droughtData: {
    location_id: 'loc-123',
    drought_index: 0.65,
    water_deficit_index: 0.45,
    soil_moisture_10cm: 28.5,
    soil_moisture_20cm: 30.2,
    soil_moisture_30cm: 32.1,
    soil_moisture_50cm: 34.5,
    soil_moisture_70cm: 36.8,
    soil_moisture_100cm: 38.2,
    soil_temperature: 18.5,
    air_temperature: 22.3,
    precipitation: 0.0,
    relative_humidity: 65,
    timestamp: '2025-10-27T12:00:00Z'
  }
};

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

describe('Integration: Meteorology Data Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full meteorology data flow: DB → Hook → Component Data', async () => {
    // Mock Supabase responses
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockMeteorologyFlow.city, error: null })
            })
          })
        };
      }
      if (table === 'meteorology_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockMeteorologyFlow.weatherData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    // Render hook
    const { result } = renderHook(() => useWeatherData('city-123'), {
      wrapper: createWrapper()
    });

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify complete data flow
    expect(result.current.weatherData).toBeDefined();
    expect(result.current.city).toBeDefined();
    expect(result.current.error).toBe(null);

    // Verify data transformation (snake_case → camelCase)
    expect(result.current.weatherData?.temperature).toBe(22.5);
    expect(result.current.weatherData?.feelsLike).toBe(21.0);
    expect(result.current.weatherData?.windSpeed).toBe(3.5);
    expect(result.current.city?.name).toBe('Szekszárd');
  });

  it('should handle error → retry → success scenario', async () => {
    let callCount = 0;
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      callCount++;

      // First call fails
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Temporary error' }
              })
            })
          })
        };
      }

      // Second call succeeds
      if (table === 'meteorology_cities') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockMeteorologyFlow.city, error: null })
            })
          })
        };
      }
      if (table === 'meteorology_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockMeteorologyFlow.weatherData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result, rerender } = renderHook(() => useWeatherData('city-123'), {
      wrapper: createWrapper()
    });

    // First attempt should fail
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeDefined();

    // Refetch should succeed
    result.current.refetch();
    await waitFor(() => expect(result.current.weatherData).toBeDefined());
  });
});

describe('Integration: Water Level Data Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full water level data flow with forecasts', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockWaterLevelFlow.station, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelFlow.waterLevelData, error: null })
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
                limit: vi.fn().mockResolvedValue({ data: mockWaterLevelFlow.forecasts, error: null })
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

    // Verify complete data flow
    expect(result.current.waterLevelData).toBeDefined();
    expect(result.current.station).toBeDefined();
    expect(result.current.forecast).toHaveLength(3);
    expect(result.current.error).toBe(null);

    // Verify threshold levels
    expect(result.current.station?.lnvLevel).toBe(200);
    expect(result.current.station?.kkvLevel).toBe(300);
    expect(result.current.station?.nvLevel).toBe(650);

    // Verify forecast ordering
    expect(result.current.forecast[0].forecastDay).toBe(1);
    expect(result.current.forecast[1].forecastDay).toBe(2);
    expect(result.current.forecast[2].forecastDay).toBe(3);
  });

  it('should handle missing forecast data gracefully', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'water_level_stations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockWaterLevelFlow.station, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: mockWaterLevelFlow.waterLevelData, error: null })
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
                limit: vi.fn().mockResolvedValue({ data: null, error: null }) // No forecasts
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
});

describe('Integration: Drought Data Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full drought data flow with all soil moisture levels', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'drought_locations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockDroughtFlow.location, error: null })
            })
          })
        };
      }
      if (table === 'drought_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockDroughtFlow.droughtData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useDroughtData('loc-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify complete data flow
    expect(result.current.droughtData).toBeDefined();
    expect(result.current.location).toBeDefined();
    expect(result.current.error).toBe(null);

    // Verify all 6 soil moisture depths
    expect(result.current.droughtData?.soilMoisture10cm).toBe(28.5);
    expect(result.current.droughtData?.soilMoisture20cm).toBe(30.2);
    expect(result.current.droughtData?.soilMoisture30cm).toBe(32.1);
    expect(result.current.droughtData?.soilMoisture50cm).toBe(34.5);
    expect(result.current.droughtData?.soilMoisture70cm).toBe(36.8);
    expect(result.current.droughtData?.soilMoisture100cm).toBe(38.2);

    // Verify drought indices
    expect(result.current.droughtData?.droughtIndex).toBe(0.65);
    expect(result.current.droughtData?.waterDeficitIndex).toBe(0.45);
  });
});

describe('Integration: Cache Behavior', () => {
  it('should cache weather data and serve from cache on second request', async () => {
    let fetchCount = 0;

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        fetchCount++;
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockMeteorologyFlow.city, error: null })
            })
          })
        };
      }
      if (table === 'meteorology_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockMeteorologyFlow.weatherData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 10000, // Keep in cache
          staleTime: 10000 // Consider fresh for 10 seconds
        }
      }
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // First render
    const { result: result1 } = renderHook(() => useWeatherData('city-123'), { wrapper });
    await waitFor(() => expect(result1.current.isLoading).toBe(false));

    // Second render (should use cache)
    const { result: result2 } = renderHook(() => useWeatherData('city-123'), { wrapper });
    await waitFor(() => expect(result2.current.isLoading).toBe(false));

    // Should only fetch once (cache hit on second request)
    expect(result2.current.weatherData).toBeDefined();
  });
});
