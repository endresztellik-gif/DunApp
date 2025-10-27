/**
 * Tests for useDroughtData Hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDroughtData } from '../useDroughtData';
import * as supabaseModule from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

const mockLocation = {
  id: 'loc-123',
  location_name: 'Katymár',
  location_type: 'agricultural',
  county: 'Bács-Kiskun',
  latitude: 46.2167,
  longitude: 19.5667,
  is_active: true
};

const mockDroughtData = {
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
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDroughtData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useDroughtData('loc-123'), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.droughtData).toBe(null);
    expect(result.current.location).toBe(null);
  });

  it('should not fetch when locationId is null', () => {
    const { result } = renderHook(() => useDroughtData(null), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.droughtData).toBe(null);
  });

  it('should fetch and return drought data successfully', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'drought_locations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockLocation, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: mockDroughtData, error: null })
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

    expect(result.current.droughtData).toBeDefined();
    expect(result.current.droughtData?.droughtIndex).toBe(0.65);
    expect(result.current.droughtData?.soilMoisture10cm).toBe(28.5);
    expect(result.current.location?.locationName).toBe('Katymár');
  });

  it('should handle errors', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Location not found' }
          })
        })
      })
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useDroughtData('invalid'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeDefined();
    expect(result.current.droughtData).toBe(null);
  });

  it('should transform all soil moisture fields', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'drought_locations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockLocation, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: mockDroughtData, error: null })
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

    const data = result.current.droughtData;
    expect(data?.soilMoisture10cm).toBe(28.5);
    expect(data?.soilMoisture20cm).toBe(30.2);
    expect(data?.soilMoisture30cm).toBe(32.1);
    expect(data?.soilMoisture50cm).toBe(34.5);
    expect(data?.soilMoisture70cm).toBe(36.8);
    expect(data?.soilMoisture100cm).toBe(38.2);
  });

  it('should provide refetch function', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'drought_locations') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockLocation, error: null })
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
                  single: vi.fn().mockResolvedValue({ data: mockDroughtData, error: null })
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

    expect(typeof result.current.refetch).toBe('function');
  });
});
