/**
 * useWeatherData Hook Tests
 *
 * Comprehensive tests for weather data fetching hook.
 * Tests React Query integration, caching, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWeatherData } from '../useWeatherData';
import type { ReactNode } from 'react';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Import mocked supabase
import { supabase } from '../../lib/supabase';

describe('useWeatherData - Data Fetching', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retry for tests
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch weather data successfully', async () => {
    const mockCityData = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      is_active: true,
    };

    const mockWeatherData = {
      city_id: 'city-1',
      temperature: 25.5,
      feels_like: 26.0,
      temp_min: 23.0,
      temp_max: 28.0,
      pressure: 1013,
      humidity: 60,
      wind_speed: 3.5,
      wind_direction: 180,
      clouds_percent: 40,
      weather_main: 'Clear',
      weather_description: 'clear sky',
      weather_icon: '01d',
      rain_1h: null,
      rain_3h: null,
      snow_1h: null,
      snow_3h: null,
      visibility: 10000,
      timestamp: '2025-10-27T12:00:00Z',
    };

    // Mock Supabase chain for city data
    const mockCitySelect = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockCityData,
          error: null,
        }),
      }),
    };

    // Mock Supabase chain for weather data
    const mockWeatherSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockWeatherData,
              error: null,
            }),
          }),
        }),
      }),
    };

    // Setup mock implementation
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: vi.fn().mockReturnValue(mockCitySelect),
        } as never;
      }
      if (table === 'meteorology_data') {
        return {
          select: vi.fn().mockReturnValue(mockWeatherSelect),
        } as never;
      }
      return {} as never;
    });

    const { result } = renderHook(() => useWeatherData('city-1'), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.weatherData).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check transformed data
    expect(result.current.weatherData).toEqual({
      cityId: 'city-1',
      temperature: 25.5,
      feelsLike: 26.0,
      tempMin: 23.0,
      tempMax: 28.0,
      pressure: 1013,
      humidity: 60,
      windSpeed: 3.5,
      windDirection: 180,
      cloudsPercent: 40,
      weatherMain: 'Clear',
      weatherDescription: 'clear sky',
      weatherIcon: '01d',
      rain1h: null,
      rain3h: null,
      snow1h: null,
      snow3h: null,
      visibility: 10000,
      timestamp: '2025-10-27T12:00:00Z',
    });

    expect(result.current.city).toEqual({
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    });

    expect(result.current.error).toBeNull();
  });

  it('should not fetch when cityId is null', async () => {
    const { result } = renderHook(() => useWeatherData(null), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.weatherData).toBeNull();
    expect(result.current.city).toBeNull();
    expect(vi.mocked(supabase.from)).not.toHaveBeenCalled();
  });

  it('should handle city data fetch error', async () => {
    const mockError = { message: 'City not found', code: 'PGRST116' };

    const mockCitySelect = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    };

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue(mockCitySelect),
    }) as never);

    const { result } = renderHook(() => useWeatherData('invalid-city'), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.weatherData).toBeNull();
  });

  it('should handle weather data fetch error', async () => {
    const mockCityData = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      is_active: true,
    };

    const mockCitySelect = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockCityData,
          error: null,
        }),
      }),
    };

    const mockWeatherError = { message: 'No data available', code: 'PGRST116' };
    const mockWeatherSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockWeatherError,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: vi.fn().mockReturnValue(mockCitySelect),
        } as never;
      }
      if (table === 'meteorology_data') {
        return {
          select: vi.fn().mockReturnValue(mockWeatherSelect),
        } as never;
      }
      return {} as never;
    });

    const { result } = renderHook(() => useWeatherData('city-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useWeatherData - React Query Configuration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should use correct query key', async () => {
    const mockCityData = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      is_active: true,
    };

    const mockWeatherData = {
      city_id: 'city-1',
      temperature: 25.5,
      feels_like: 26.0,
      temp_min: 23.0,
      temp_max: 28.0,
      pressure: 1013,
      humidity: 60,
      wind_speed: 3.5,
      wind_direction: 180,
      clouds_percent: 40,
      weather_main: 'Clear',
      weather_description: 'clear sky',
      weather_icon: '01d',
      rain_1h: null,
      rain_3h: null,
      snow_1h: null,
      snow_3h: null,
      visibility: 10000,
      timestamp: '2025-10-27T12:00:00Z',
    };

    const mockCitySelect = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockCityData,
          error: null,
        }),
      }),
    };

    const mockWeatherSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockWeatherData,
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: vi.fn().mockReturnValue(mockCitySelect),
        } as never;
      }
      if (table === 'meteorology_data') {
        return {
          select: vi.fn().mockReturnValue(mockWeatherSelect),
        } as never;
      }
      return {} as never;
    });

    renderHook(() => useWeatherData('city-1'), { wrapper });

    await waitFor(() => {
      const queryState = queryClient.getQueryState(['weather', 'city-1']);
      expect(queryState).toBeDefined();
    });
  });

  it('should have refetch method', async () => {
    const mockCityData = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      is_active: true,
    };

    const mockWeatherData = {
      city_id: 'city-1',
      temperature: 25.5,
      feels_like: 26.0,
      temp_min: 23.0,
      temp_max: 28.0,
      pressure: 1013,
      humidity: 60,
      wind_speed: 3.5,
      wind_direction: 180,
      clouds_percent: 40,
      weather_main: 'Clear',
      weather_description: 'clear sky',
      weather_icon: '01d',
      rain_1h: null,
      rain_3h: null,
      snow_1h: null,
      snow_3h: null,
      visibility: 10000,
      timestamp: '2025-10-27T12:00:00Z',
    };

    const mockCitySelect = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockCityData,
          error: null,
        }),
      }),
    };

    const mockWeatherSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockWeatherData,
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: vi.fn().mockReturnValue(mockCitySelect),
        } as never;
      }
      if (table === 'meteorology_data') {
        return {
          select: vi.fn().mockReturnValue(mockWeatherSelect),
        } as never;
      }
      return {} as never;
    });

    const { result } = renderHook(() => useWeatherData('city-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });
});
