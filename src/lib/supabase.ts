/**
 * DunApp PWA - Supabase Client Configuration
 *
 * This file initializes the Supabase client for use throughout the application.
 * The client is used to:
 * - Query location data (cities, stations, wells)
 * - Fetch meteorology, water level, and drought data
 * - Subscribe to real-time updates
 * - Manage push notification subscriptions
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(
    `Invalid VITE_SUPABASE_URL: ${supabaseUrl}. ` +
    'Please ensure it is a valid URL (e.g., https://your-project.supabase.co)'
  );
}

/**
 * Supabase client instance
 *
 * This client is configured with:
 * - TypeScript types from database schema
 * - Anonymous key for public data access
 * - RLS policies for security
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // No authentication required for this app (all data is public)
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'dunapp-pwa/1.0.0',
    },
  },
});

/**
 * Helper function to check Supabase connection
 * Useful for debugging and health checks
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Try to query a simple table (meteorology_cities)
    const { data, error } = await supabase
      .from('meteorology_cities')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

/**
 * Helper function to get all meteorology cities
 */
export async function getMeteorologyCities() {
  const { data, error } = await supabase
    .from('meteorology_cities')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching meteorology cities:', error);
    throw error;
  }

  return data;
}

/**
 * Helper function to get all water level stations
 */
export async function getWaterLevelStations() {
  const { data, error } = await supabase
    .from('water_level_stations')
    .select('*')
    .eq('is_active', true)
    .order('station_name');

  if (error) {
    console.error('Error fetching water level stations:', error);
    throw error;
  }

  return data;
}

/**
 * Helper function to get all drought locations
 */
export async function getDroughtLocations() {
  const { data, error } = await supabase
    .from('drought_locations')
    .select('*')
    .eq('is_active', true)
    .order('location_name');

  if (error) {
    console.error('Error fetching drought locations:', error);
    throw error;
  }

  return data;
}

/**
 * Helper function to get all groundwater wells
 */
export async function getGroundwaterWells() {
  const { data, error } = await supabase
    .from('groundwater_wells')
    .select('*')
    .eq('is_active', true)
    .order('well_name');

  if (error) {
    console.error('Error fetching groundwater wells:', error);
    throw error;
  }

  return data;
}

/**
 * Helper function to get latest meteorology data for a city
 */
export async function getLatestMeteorologyData(cityId: string) {
  const { data, error } = await supabase
    .from('meteorology_data')
    .select('*')
    .eq('city_id', cityId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching meteorology data:', error);
    throw error;
  }

  return data;
}

/**
 * Helper function to get latest water level data for a station
 */
export async function getLatestWaterLevelData(stationId: string) {
  const { data, error } = await supabase
    .from('water_level_data')
    .select('*')
    .eq('station_id', stationId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching water level data:', error);
    throw error;
  }

  return data;
}

/**
 * Helper function to create a push notification subscription
 */
export async function createPushSubscription(
  endpoint: string,
  p256dhKey: string,
  authKey: string,
  stationId: string
) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert({
      endpoint,
      p256dh_key: p256dhKey,
      auth_key: authKey,
      station_id: stationId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating push subscription:', error);
    throw error;
  }

  return data;
}

/**
 * Helper function to delete a push notification subscription
 */
export async function deletePushSubscription(endpoint: string) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Error deleting push subscription:', error);
    throw error;
  }
}

// Export the Database type for use in other files
export type { Database };
