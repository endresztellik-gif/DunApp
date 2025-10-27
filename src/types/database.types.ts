/**
 * DunApp PWA - Database TypeScript Types
 *
 * This file contains TypeScript interfaces that match the Supabase database schema.
 * These types provide type safety when querying the database.
 *
 * IMPORTANT: Keep this file in sync with the database schema!
 * When you modify the database schema, update these types accordingly.
 *
 * To auto-generate types from your Supabase schema:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      meteorology_cities: {
        Row: {
          id: string;
          name: string;
          county: string;
          latitude: number;
          longitude: number;
          population: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          county: string;
          latitude: number;
          longitude: number;
          population?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          county?: string;
          latitude?: number;
          longitude?: number;
          population?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      meteorology_data: {
        Row: {
          id: string;
          city_id: string;
          temperature: number | null;
          feels_like: number | null;
          temp_min: number | null;
          temp_max: number | null;
          pressure: number | null;
          humidity: number | null;
          wind_speed: number | null;
          wind_direction: number | null;
          clouds_percent: number | null;
          weather_main: string | null;
          weather_description: string | null;
          weather_icon: string | null;
          rain_1h: number | null;
          rain_3h: number | null;
          snow_1h: number | null;
          snow_3h: number | null;
          visibility: number | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          city_id: string;
          temperature?: number | null;
          feels_like?: number | null;
          temp_min?: number | null;
          temp_max?: number | null;
          pressure?: number | null;
          humidity?: number | null;
          wind_speed?: number | null;
          wind_direction?: number | null;
          clouds_percent?: number | null;
          weather_main?: string | null;
          weather_description?: string | null;
          weather_icon?: string | null;
          rain_1h?: number | null;
          rain_3h?: number | null;
          snow_1h?: number | null;
          snow_3h?: number | null;
          visibility?: number | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          city_id?: string;
          temperature?: number | null;
          feels_like?: number | null;
          temp_min?: number | null;
          temp_max?: number | null;
          pressure?: number | null;
          humidity?: number | null;
          wind_speed?: number | null;
          wind_direction?: number | null;
          clouds_percent?: number | null;
          weather_main?: string | null;
          weather_description?: string | null;
          weather_icon?: string | null;
          rain_1h?: number | null;
          rain_3h?: number | null;
          snow_1h?: number | null;
          snow_3h?: number | null;
          visibility?: number | null;
          timestamp?: string;
          created_at?: string;
        };
      };
      water_level_stations: {
        Row: {
          id: string;
          station_name: string;
          river_name: string;
          city_name: string;
          latitude: number;
          longitude: number;
          lnv_level: number;
          kkv_level: number;
          nv_level: number;
          is_active: boolean;
          display_in_comparison: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          station_name: string;
          river_name: string;
          city_name: string;
          latitude: number;
          longitude: number;
          lnv_level: number;
          kkv_level: number;
          nv_level: number;
          is_active?: boolean;
          display_in_comparison?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          station_name?: string;
          river_name?: string;
          city_name?: string;
          latitude?: number;
          longitude?: number;
          lnv_level?: number;
          kkv_level?: number;
          nv_level?: number;
          is_active?: boolean;
          display_in_comparison?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      water_level_data: {
        Row: {
          id: string;
          station_id: string;
          water_level_cm: number;
          flow_rate_m3s: number | null;
          water_temp_celsius: number | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          station_id: string;
          water_level_cm: number;
          flow_rate_m3s?: number | null;
          water_temp_celsius?: number | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          station_id?: string;
          water_level_cm?: number;
          flow_rate_m3s?: number | null;
          water_temp_celsius?: number | null;
          timestamp?: string;
          created_at?: string;
        };
      };
      water_level_forecasts: {
        Row: {
          id: string;
          station_id: string;
          forecast_date: string;
          water_level_cm: number;
          forecast_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          station_id: string;
          forecast_date: string;
          water_level_cm: number;
          forecast_day: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          station_id?: string;
          forecast_date?: string;
          water_level_cm?: number;
          forecast_day?: number;
          created_at?: string;
        };
      };
      drought_locations: {
        Row: {
          id: string;
          location_name: string;
          location_type: string;
          county: string;
          latitude: number;
          longitude: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location_name: string;
          location_type?: string;
          county: string;
          latitude: number;
          longitude: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location_name?: string;
          location_type?: string;
          county?: string;
          latitude?: number;
          longitude?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      drought_data: {
        Row: {
          id: string;
          location_id: string;
          drought_index: number | null;
          water_deficit_index: number | null;
          soil_moisture_10cm: number | null;
          soil_moisture_20cm: number | null;
          soil_moisture_30cm: number | null;
          soil_moisture_50cm: number | null;
          soil_moisture_70cm: number | null;
          soil_moisture_100cm: number | null;
          soil_temperature: number | null;
          air_temperature: number | null;
          precipitation: number | null;
          relative_humidity: number | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          drought_index?: number | null;
          water_deficit_index?: number | null;
          soil_moisture_10cm?: number | null;
          soil_moisture_20cm?: number | null;
          soil_moisture_30cm?: number | null;
          soil_moisture_50cm?: number | null;
          soil_moisture_70cm?: number | null;
          soil_moisture_100cm?: number | null;
          soil_temperature?: number | null;
          air_temperature?: number | null;
          precipitation?: number | null;
          relative_humidity?: number | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          drought_index?: number | null;
          water_deficit_index?: number | null;
          soil_moisture_10cm?: number | null;
          soil_moisture_20cm?: number | null;
          soil_moisture_30cm?: number | null;
          soil_moisture_50cm?: number | null;
          soil_moisture_70cm?: number | null;
          soil_moisture_100cm?: number | null;
          soil_temperature?: number | null;
          air_temperature?: number | null;
          precipitation?: number | null;
          relative_humidity?: number | null;
          timestamp?: string;
          created_at?: string;
        };
      };
      groundwater_wells: {
        Row: {
          id: string;
          well_name: string;
          well_code: string;
          county: string;
          city_name: string;
          latitude: number;
          longitude: number;
          depth_meters: number | null;
          well_type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          well_name: string;
          well_code: string;
          county: string;
          city_name: string;
          latitude: number;
          longitude: number;
          depth_meters?: number | null;
          well_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          well_name?: string;
          well_code?: string;
          county?: string;
          city_name?: string;
          latitude?: number;
          longitude?: number;
          depth_meters?: number | null;
          well_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      groundwater_data: {
        Row: {
          id: string;
          well_id: string;
          water_level_meters: number | null;
          water_level_masl: number | null;
          water_temperature: number | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          well_id: string;
          water_level_meters?: number | null;
          water_level_masl?: number | null;
          water_temperature?: number | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          well_id?: string;
          water_level_meters?: number | null;
          water_level_masl?: number | null;
          water_temperature?: number | null;
          timestamp?: string;
          created_at?: string;
        };
      };
      precipitation_data: {
        Row: {
          id: string;
          city_id: string;
          daily_mm: number | null;
          weekly_mm: number | null;
          yearly_mm: number | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          city_id: string;
          daily_mm?: number | null;
          weekly_mm?: number | null;
          yearly_mm?: number | null;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          city_id?: string;
          daily_mm?: number | null;
          weekly_mm?: number | null;
          yearly_mm?: number | null;
          date?: string;
          created_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
          station_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
          station_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          endpoint?: string;
          p256dh_key?: string;
          auth_key?: string;
          station_id?: string | null;
          created_at?: string;
        };
      };
      push_notification_logs: {
        Row: {
          id: string;
          subscription_id: string | null;
          station_id: string | null;
          water_level_cm: number;
          notification_title: string;
          notification_body: string;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id?: string | null;
          station_id?: string | null;
          water_level_cm: number;
          notification_title: string;
          notification_body: string;
          status: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string | null;
          station_id?: string | null;
          water_level_cm?: number;
          notification_title?: string;
          notification_body?: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
      };
      cache: {
        Row: {
          key: string;
          value: Json;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Utility type to get a table's Row type
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

// Utility type to get a table's Insert type
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

// Utility type to get a table's Update type
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Specific type exports for convenience
export type MeteorologyCity = Tables<'meteorology_cities'>;
export type MeteorologyData = Tables<'meteorology_data'>;
export type WaterLevelStation = Tables<'water_level_stations'>;
export type WaterLevelData = Tables<'water_level_data'>;
export type WaterLevelForecast = Tables<'water_level_forecasts'>;
export type DroughtLocation = Tables<'drought_locations'>;
export type DroughtData = Tables<'drought_data'>;
export type GroundwaterWell = Tables<'groundwater_wells'>;
export type GroundwaterData = Tables<'groundwater_data'>;
export type PrecipitationData = Tables<'precipitation_data'>;
export type PushSubscription = Tables<'push_subscriptions'>;
export type PushNotificationLog = Tables<'push_notification_logs'>;
export type Cache = Tables<'cache'>;
