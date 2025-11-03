/**
 * useDroughtData Hook
 *
 * Custom hook to fetch drought monitoring data for a selected location.
 * Uses React Query for caching and automatic refetching.
 *
 * @param locationId - The ID of the location to fetch drought data for
 * @returns Query object with drought data, location info, loading state, and error
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DroughtData, DroughtLocation } from '../types/index';

interface UseDroughtDataReturn {
  droughtData: DroughtData | null;
  location: DroughtLocation | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Fetch the latest drought data for a location
 */
async function fetchDroughtData(locationId: string) {
  // Get location data
  const { data: locationData, error: locationError } = await supabase
    .from('drought_locations')
    .select('*')
    .eq('id', locationId)
    .single();

  if (locationError) {
    throw new Error(`Failed to fetch location data: ${locationError.message}`);
  }

  // Get latest drought data
  const { data: droughtData, error: droughtError } = await supabase
    .from('drought_data')
    .select('*')
    .eq('location_id', locationId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (droughtError) {
    throw new Error(`Failed to fetch drought data: ${droughtError.message}`);
  }

  // If no data exists yet, return null for droughtData
  if (!droughtData) {
    return {
      droughtData: null,
      location: {
        id: (locationData as Record<string, unknown>).id as string,
        locationName: (locationData as Record<string, unknown>).location_name as string,
        locationType: (locationData as Record<string, unknown>).location_type as string,
        county: (locationData as Record<string, unknown>).county as string,
        latitude: (locationData as Record<string, unknown>).latitude as number,
        longitude: (locationData as Record<string, unknown>).longitude as number,
        isActive: (locationData as Record<string, unknown>).is_active as boolean
      }
    };
  }

  return {
    droughtData: {
      locationId: (droughtData as Record<string, unknown>).location_id as string,
      droughtIndex: (droughtData as Record<string, unknown>).drought_index as number,
      waterDeficitIndex: (droughtData as Record<string, unknown>).water_deficit_index as number,
      soilMoisture10cm: (droughtData as Record<string, unknown>).soil_moisture_10cm as number,
      soilMoisture20cm: (droughtData as Record<string, unknown>).soil_moisture_20cm as number,
      soilMoisture30cm: (droughtData as Record<string, unknown>).soil_moisture_30cm as number,
      soilMoisture50cm: (droughtData as Record<string, unknown>).soil_moisture_50cm as number,
      soilMoisture70cm: (droughtData as Record<string, unknown>).soil_moisture_70cm as number,
      soilMoisture100cm: (droughtData as Record<string, unknown>).soil_moisture_100cm as number,
      soilTemperature: (droughtData as Record<string, unknown>).soil_temperature as number,
      airTemperature: (droughtData as Record<string, unknown>).air_temperature as number,
      precipitation: (droughtData as Record<string, unknown>).precipitation as number,
      relativeHumidity: (droughtData as Record<string, unknown>).relative_humidity as number,
      timestamp: (droughtData as Record<string, unknown>).timestamp as string
    },
    location: {
      id: (locationData as Record<string, unknown>).id as string,
      locationName: (locationData as Record<string, unknown>).location_name as string,
      locationType: (locationData as Record<string, unknown>).location_type as string,
      county: (locationData as Record<string, unknown>).county as string,
      latitude: (locationData as Record<string, unknown>).latitude as number,
      longitude: (locationData as Record<string, unknown>).longitude as number,
      isActive: (locationData as Record<string, unknown>).is_active as boolean
    }
  };
}

/**
 * Custom hook to fetch drought data with caching
 */
export function useDroughtData(locationId: string | null): UseDroughtDataReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['drought', locationId],
    queryFn: () => fetchDroughtData(locationId!),
    enabled: !!locationId, // Only run if locationId is provided
    staleTime: 24 * 60 * 60 * 1000, // Consider data fresh for 24 hours
    refetchInterval: 24 * 60 * 60 * 1000, // Refetch every 24 hours
    retry: 3, // Retry failed requests 3 times
  });

  return {
    droughtData: data?.droughtData || null,
    location: data?.location || null,
    isLoading,
    error: error as Error | null,
    refetch
  };
}
