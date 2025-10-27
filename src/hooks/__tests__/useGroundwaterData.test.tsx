/**
 * Tests for useGroundwaterData Hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGroundwaterData } from '../useGroundwaterData';
import * as supabaseModule from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

const mockWell = {
  id: 'well-123',
  well_name: 'Baja K-17',
  well_code: 'K-17',
  county: 'Bács-Kiskun',
  city_name: 'Baja',
  latitude: 46.1811,
  longitude: 18.9550,
  depth_meters: 45.5,
  well_type: 'monitoring',
  is_active: true
};

const mockGroundwaterData = {
  well_id: 'well-123',
  water_level_meters: 12.5,
  water_level_masl: 95.3,
  water_temperature: 14.2,
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

describe('useGroundwaterData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useGroundwaterData('well-123'), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.groundwaterData).toBe(null);
    expect(result.current.well).toBe(null);
  });

  it('should not fetch when wellId is null', () => {
    const { result } = renderHook(() => useGroundwaterData(null), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.groundwaterData).toBe(null);
  });

  it('should fetch and return groundwater data successfully', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'groundwater_wells') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockWell, error: null })
            })
          })
        };
      }
      if (table === 'groundwater_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockGroundwaterData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useGroundwaterData('well-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groundwaterData).toBeDefined();
    expect(result.current.groundwaterData?.waterLevelMeters).toBe(12.5);
    expect(result.current.groundwaterData?.waterLevelMasl).toBe(95.3);
    expect(result.current.well?.wellName).toBe('Baja K-17');
    expect(result.current.well?.wellCode).toBe('K-17');
  });

  it('should handle errors', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Well not found' }
          })
        })
      })
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useGroundwaterData('invalid'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 10000 });

    expect(result.current.error).toBeDefined();
    expect(result.current.groundwaterData).toBe(null);
  });

  it('should transform well metadata fields', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'groundwater_wells') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockWell, error: null })
            })
          })
        };
      }
      if (table === 'groundwater_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockGroundwaterData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useGroundwaterData('well-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const well = result.current.well;
    expect(well?.wellName).toBe('Baja K-17');
    expect(well?.wellCode).toBe('K-17');
    expect(well?.cityName).toBe('Baja');
    expect(well?.depthMeters).toBe(45.5);
    expect(well?.wellType).toBe('monitoring');
  });

  it('should handle null temperature data', async () => {
    const dataWithoutTemp = {
      ...mockGroundwaterData,
      water_temperature: null
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'groundwater_wells') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockWell, error: null })
            })
          })
        };
      }
      if (table === 'groundwater_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: dataWithoutTemp, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useGroundwaterData('well-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groundwaterData?.waterTemperature).toBe(null);
    expect(result.current.groundwaterData?.waterLevelMeters).toBe(12.5);
  });

  it('should provide refetch function', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'groundwater_wells') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: mockWell, error: null })
            })
          })
        };
      }
      if (table === 'groundwater_data') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: vi.fn().mockResolvedValue({ data: mockGroundwaterData, error: null })
                })
              })
            })
          })
        };
      }
    });

    (supabaseModule.supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useGroundwaterData('well-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(typeof result.current.refetch).toBe('function');
  });
});
