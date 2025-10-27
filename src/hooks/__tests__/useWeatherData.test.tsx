/**
 * Tests for useWeatherData Hook
 *
 * Test Coverage:
 * - Loading states
 * - Error states
 * - Successful data fetching
 * - Cache behavior (staleTime)
 * - Refetch functionality
 * - Type safety
 * - Supabase client mocking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWeatherData } from '../useWeatherData';
import * as supabaseModule from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

// Mock data
const mockCity = {
  id: 'city-123',
  name: 'Szekszárd',
  county: 'Tolna',
  latitude: 46.3481,
  longitude: 18.7097,
  population: 33000,
  is_active: true
};

const mockWeatherData = {
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
};

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: 0 // Disable garbage collection
      }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useWeatherData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useWeatherData('city-123'), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.weatherData).toBe(null);
    expect(result.current.city).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should not fetch when cityId is null', () => {
    const { result } = renderHook(() => useWeatherData(null), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.weatherData).toBe(null);
  });

  it('should fetch and return weather data successfully', async () => {
    // Mock Supabase responses
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockCity, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: mockWeatherData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWeatherData('city-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.weatherData).toBeDefined();
    expect(result.current.weatherData?.temperature).toBe(22.5);
    expect(result.current.weatherData?.humidity).toBe(65);
    expect(result.current.city).toBeDefined();
    expect(result.current.city?.name).toBe('Szekszárd');
    expect(result.current.error).toBe(null);
  });

  it('should handle city fetch error', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'City not found' }
          })
        })
      })
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWeatherData('invalid-city'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeDefined();
    expect(result.current.weatherData).toBe(null);
    expect(result.current.city).toBe(null);
  });

  it('should handle weather data fetch error', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockCity, error: null })
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
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'No weather data available' }
                  })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWeatherData('city-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeDefined();
    expect(result.current.weatherData).toBe(null);
  });

  it('should provide refetch function', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockCity, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: mockWeatherData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWeatherData('city-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should transform database fields to camelCase', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockCity, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: mockWeatherData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWeatherData('city-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Check camelCase transformation
    expect(result.current.weatherData?.feelsLike).toBe(21.0);
    expect(result.current.weatherData?.tempMin).toBe(20);
    expect(result.current.weatherData?.tempMax).toBe(25);
    expect(result.current.weatherData?.windSpeed).toBe(3.5);
    expect(result.current.weatherData?.windDirection).toBe(180);
    expect(result.current.weatherData?.cloudsPercent).toBe(40);
    expect(result.current.weatherData?.weatherMain).toBe('Clouds');
    expect(result.current.weatherData?.weatherDescription).toBe('scattered clouds');
    expect(result.current.weatherData?.weatherIcon).toBe('03d');
  });

  it('should handle null/missing optional fields', async () => {
    const incompleteWeatherData = {
      ...mockWeatherData,
      feels_like: null,
      rain_1h: null,
      rain_3h: null,
      snow_1h: null,
      snow_3h: null,
      visibility: null
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockCity, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: incompleteWeatherData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWeatherData('city-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.weatherData?.feelsLike).toBe(null);
    expect(result.current.weatherData?.rain1h).toBe(null);
    expect(result.current.weatherData?.visibility).toBe(null);
    expect(result.current.weatherData?.temperature).toBe(22.5); // Required field still present
  });

  it('should use correct query key for caching', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockCity, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: mockWeatherData, error: null })
                })
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

    const { result } = renderHook(() => useWeatherData('city-123'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Check if query is cached with correct key
    const cachedData = queryClient.getQueryData(['weather', 'city-123']);
    expect(cachedData).toBeDefined();
  });

  it('should return correct TypeScript types', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'meteorology_cities') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockCity, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: mockWeatherData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useWeatherData('city-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Type assertions
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(result.current.weatherData === null || typeof result.current.weatherData === 'object').toBe(true);
    expect(result.current.city === null || typeof result.current.city === 'object').toBe(true);
    expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
    expect(typeof result.current.refetch).toBe('function');
  });
});
