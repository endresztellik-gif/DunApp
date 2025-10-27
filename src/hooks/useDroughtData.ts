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
  refetch: () => void;
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
    .single();

  if (droughtError) {
    throw new Error(`Failed to fetch drought data: ${droughtError.message}`);
  }

  return {
    droughtData: {
      locationId: droughtData.location_id,
      droughtIndex: droughtData.drought_index,
      waterDeficitIndex: droughtData.water_deficit_index,
      soilMoisture10cm: droughtData.soil_moisture_10cm,
      soilMoisture20cm: droughtData.soil_moisture_20cm,
      soilMoisture30cm: droughtData.soil_moisture_30cm,
      soilMoisture50cm: droughtData.soil_moisture_50cm,
      soilMoisture70cm: droughtData.soil_moisture_70cm,
      soilMoisture100cm: droughtData.soil_moisture_100cm,
      soilTemperature: droughtData.soil_temperature,
      airTemperature: droughtData.air_temperature,
      precipitation: droughtData.precipitation,
      relativeHumidity: droughtData.relative_humidity,
      timestamp: droughtData.timestamp
    },
    location: {
      id: locationData.id,
      locationName: locationData.location_name,
      locationType: locationData.location_type,
      county: locationData.county,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      isActive: locationData.is_active
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
