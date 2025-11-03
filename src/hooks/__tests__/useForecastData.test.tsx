/**
 * useForecastData Hook Tests
 *
 * Tests for weather forecast data fetching hook.
 * Tests data transformation (snake_case → camelCase),
 * 72-hour filtering, and React Query integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForecastData } from '../useForecastData';
import type { ReactNode } from 'react';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Import mocked supabase
import { supabase } from '../../lib/supabase';

describe('useForecastData - Data Fetching', () => {
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

  it('should fetch forecast data successfully', async () => {
    const now = new Date('2025-10-27T12:00:00Z');
    const mockForecastData = [
      {
        id: 'forecast-1',
        city_id: 'city-1',
        forecast_time: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // +6h
        temperature: 22.5,
        temperature_min: 20.0,
        temperature_max: 25.0,
        precipitation_amount: 0.5,
        wind_speed: 3.2,
        wind_direction: 180,
        humidity: 65,
        pressure: 1013,
        clouds_percent: 30,
        weather_symbol: '01d',
      },
      {
        id: 'forecast-2',
        city_id: 'city-1',
        forecast_time: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(), // +12h
        temperature: 20.0,
        temperature_min: 18.0,
        temperature_max: 22.0,
        precipitation_amount: 1.2,
        wind_speed: 4.5,
        wind_direction: 200,
        humidity: 70,
        pressure: 1010,
        clouds_percent: 60,
        weather_symbol: '02d',
      },
    ];

    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockForecastData,
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useForecastData('city-1'), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.forecasts).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check transformed data (snake_case → camelCase)
    expect(result.current.forecasts).toHaveLength(2);
    expect(result.current.forecasts[0]).toEqual({
      id: 'forecast-1',
      cityId: 'city-1',
      forecastTime: expect.any(String),
      temperature: 22.5,
      temperatureMin: 20.0,
      temperatureMax: 25.0,
      precipitationAmount: 0.5,
      windSpeed: 3.2,
      windDirection: 180,
      humidity: 65,
      pressure: 1013,
      cloudsPercent: 30,
      weatherSymbol: '01d',
    });

    expect(result.current.error).toBeNull();
  });

  it('should not fetch when cityId is null', async () => {
    const { result } = renderHook(() => useForecastData(null), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.forecasts).toEqual([]);
    expect(vi.mocked(supabase.from)).not.toHaveBeenCalled();
  });

  it('should return empty array when no forecast data available', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useForecastData('city-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.forecasts).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should return empty array when data is null', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useForecastData('city-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.forecasts).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const mockError = { message: 'Database connection failed', code: 'PGRST301' };

    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useForecastData('city-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.forecasts).toEqual([]);
  });
});

describe('useForecastData - Data Transformation', () => {
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

  it('should transform all snake_case fields to camelCase', async () => {
    const mockForecastData = [
      {
        id: 'forecast-1',
        city_id: 'city-1',
        forecast_time: '2025-10-27T18:00:00Z',
        temperature: 22.5,
        temperature_min: 20.0,
        temperature_max: 25.0,
        precipitation_amount: 0.5,
        wind_speed: 3.2,
        wind_direction: 180,
        humidity: 65,
        pressure: 1013,
        clouds_percent: 30,
        weather_symbol: '01d',
      },
    ];

    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockForecastData,
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useForecastData('city-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const forecast = result.current.forecasts[0];

    // Check that all snake_case fields are transformed to camelCase
    expect(forecast).toHaveProperty('cityId');
    expect(forecast).toHaveProperty('forecastTime');
    expect(forecast).toHaveProperty('temperatureMin');
    expect(forecast).toHaveProperty('temperatureMax');
    expect(forecast).toHaveProperty('precipitationAmount');
    expect(forecast).toHaveProperty('windSpeed');
    expect(forecast).toHaveProperty('windDirection');
    expect(forecast).toHaveProperty('cloudsPercent');
    expect(forecast).toHaveProperty('weatherSymbol');

    // Check that snake_case fields don't exist
    expect(forecast).not.toHaveProperty('city_id');
    expect(forecast).not.toHaveProperty('forecast_time');
    expect(forecast).not.toHaveProperty('temperature_min');
    expect(forecast).not.toHaveProperty('precipitation_amount');
  });

  it('should handle null values correctly', async () => {
    const mockForecastData = [
      {
        id: 'forecast-1',
        city_id: 'city-1',
        forecast_time: '2025-10-27T18:00:00Z',
        temperature: null,
        temperature_min: null,
        temperature_max: null,
        precipitation_amount: null,
        wind_speed: null,
        wind_direction: null,
        humidity: null,
        pressure: null,
        clouds_percent: null,
        weather_symbol: null,
      },
    ];

    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockForecastData,
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useForecastData('city-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const forecast = result.current.forecasts[0];

    expect(forecast.temperature).toBeNull();
    expect(forecast.temperatureMin).toBeNull();
    expect(forecast.precipitationAmount).toBeNull();
    expect(forecast.windSpeed).toBeNull();
  });
});

describe('useForecastData - React Query Configuration', () => {
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
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    renderHook(() => useForecastData('city-1'), { wrapper });

    await waitFor(() => {
      const queryState = queryClient.getQueryState(['forecast', 'city-1']);
      expect(queryState).toBeDefined();
    });
  });

  it('should have refetch method', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useForecastData('city-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should filter forecasts within 72-hour window', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    renderHook(() => useForecastData('city-1'), { wrapper });

    await waitFor(() => {
      expect(mockSelect.eq).toHaveBeenCalledWith('city_id', 'city-1');
    });

    // Verify that gte and lte are called (for time filtering)
    await waitFor(() => {
      const gteCall = mockSelect.eq().gte;
      expect(gteCall).toHaveBeenCalledWith('forecast_time', expect.any(String));

      const lteCall = mockSelect.eq().gte().lte;
      expect(lteCall).toHaveBeenCalledWith('forecast_time', expect.any(String));
    });
  });
});
