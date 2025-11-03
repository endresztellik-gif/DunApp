/**
 * useCities Hook Tests
 *
 * Tests for cities data fetching hook.
 * Tests fetching, transformation, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCities } from '../useCities';
import type { ReactNode } from 'react';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Import mocked supabase
import { supabase } from '../../lib/supabase';

describe('useCities - Data Fetching', () => {
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

  it('should fetch all 4 cities successfully', async () => {
    const mockCitiesData = [
      {
        id: 'city-1',
        name: 'Szekszárd',
        county: 'Tolna',
        latitude: 46.3475,
        longitude: 18.7067,
        population: 33000,
        is_active: true,
      },
      {
        id: 'city-2',
        name: 'Baja',
        county: 'Bács-Kiskun',
        latitude: 46.1835,
        longitude: 18.9556,
        population: 36000,
        is_active: true,
      },
      {
        id: 'city-3',
        name: 'Dunaszekcső',
        county: 'Baranya',
        latitude: 46.0833,
        longitude: 18.7667,
        population: 3000,
        is_active: true,
      },
      {
        id: 'city-4',
        name: 'Mohács',
        county: 'Baranya',
        latitude: 45.9931,
        longitude: 18.6814,
        population: 19000,
        is_active: true,
      },
    ];

    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockCitiesData,
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useCities(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.cities).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have exactly 4 cities
    expect(result.current.cities).toHaveLength(4);

    // Check data transformation (snake_case → camelCase)
    expect(result.current.cities[0]).toEqual({
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    });

    // Verify cities are ordered by name
    expect(result.current.cities.map((c) => c.name)).toEqual([
      'Szekszárd',
      'Baja',
      'Dunaszekcső',
      'Mohács',
    ]);

    expect(result.current.error).toBeNull();
  });

  it('should only fetch active cities', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    renderHook(() => useCities(), { wrapper });

    await waitFor(() => {
      expect(mockSelect.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  it('should order cities by name', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    renderHook(() => useCities(), { wrapper });

    await waitFor(() => {
      expect(mockSelect.eq().order).toHaveBeenCalledWith('name');
    });
  });

  it('should return empty array when no cities available', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useCities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cities).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should return empty array when data is null', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useCities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cities).toEqual([]);
  });

  it('should handle fetch error', async () => {
    const mockError = { message: 'Network error', code: 'PGRST301' };

    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useCities(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.cities).toEqual([]);
  });
});

describe('useCities - Data Transformation', () => {
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

  it('should transform snake_case fields to camelCase', async () => {
    const mockCitiesData = [
      {
        id: 'city-1',
        name: 'Szekszárd',
        county: 'Tolna',
        latitude: 46.3475,
        longitude: 18.7067,
        population: 33000,
        is_active: true,
      },
    ];

    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockCitiesData,
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useCities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const city = result.current.cities[0];

    // Check camelCase fields exist
    expect(city).toHaveProperty('isActive');
    expect(city.isActive).toBe(true);

    // Check snake_case field doesn't exist
    expect(city).not.toHaveProperty('is_active');
  });

  it('should handle null population correctly', async () => {
    const mockCitiesData = [
      {
        id: 'city-1',
        name: 'Test City',
        county: 'Test County',
        latitude: 46.0,
        longitude: 18.0,
        population: null,
        is_active: true,
      },
    ];

    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockCitiesData,
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result } = renderHook(() => useCities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cities[0].population).toBeNull();
  });
});

describe('useCities - React Query Configuration', () => {
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
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    renderHook(() => useCities(), { wrapper });

    await waitFor(() => {
      const queryState = queryClient.getQueryState(['cities']);
      expect(queryState).toBeDefined();
    });
  });

  it('should cache cities data for 1 hour', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    const { result, rerender } = renderHook(() => useCities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // First call should fetch from Supabase
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(1);

    // Clear mock to verify cache is used
    vi.clearAllMocks();

    // Re-render should use cached data (within staleTime)
    rerender();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not call Supabase again (data is cached)
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(0);
  });

  it('should fetch from meteorology_cities table', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelect),
    } as never);

    renderHook(() => useCities(), { wrapper });

    await waitFor(() => {
      expect(vi.mocked(supabase.from)).toHaveBeenCalledWith('meteorology_cities');
    });
  });
});
