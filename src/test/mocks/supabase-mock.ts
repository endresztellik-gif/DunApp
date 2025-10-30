/**
 * Mock Supabase Client for Testing
 *
 * Provides mock implementations of Supabase client methods
 * for use in unit and integration tests.
 */

import { vi } from 'vitest';

// Mock database data
export const mockDatabaseData = {
  meteorology_cities: [
    { id: 'city-1', name: 'Szekszárd', county: 'Tolna', latitude: 46.3481, longitude: 18.7097, population: 33000, is_active: true },
    { id: 'city-2', name: 'Baja', county: 'Bács-Kiskun', latitude: 46.1811, longitude: 18.9550, population: 36000, is_active: true },
    { id: 'city-3', name: 'Dunaszekcső', county: 'Baranya', latitude: 46.0833, longitude: 18.7667, population: 3500, is_active: true },
    { id: 'city-4', name: 'Mohács', county: 'Baranya', latitude: 45.9928, longitude: 18.6836, population: 18000, is_active: true }
  ],
  meteorology_data: [
    {
      id: 'weather-1',
      city_id: 'city-1',
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
    }
  ],
  water_level_stations: [
    { id: 'station-1', station_name: 'Baja', river_name: 'Duna', city_name: 'Baja', latitude: 46.1811, longitude: 18.9550, lnv_level: 150, kkv_level: 250, nv_level: 600, is_active: true, display_in_comparison: true },
    { id: 'station-2', station_name: 'Mohács', river_name: 'Duna', city_name: 'Mohács', latitude: 45.9928, longitude: 18.6836, lnv_level: 200, kkv_level: 300, nv_level: 650, is_active: true, display_in_comparison: true },
    { id: 'station-3', station_name: 'Nagybajcs', river_name: 'Duna', city_name: 'Nagybajcs', latitude: 46.1500, longitude: 18.8000, lnv_level: 180, kkv_level: 280, nv_level: 620, is_active: true, display_in_comparison: true }
  ],
  water_level_data: [
    {
      id: 'wl-1',
      station_id: 'station-1',
      water_level_cm: 420,
      flow_rate_m3s: 2500,
      water_temp_celsius: 18.5,
      timestamp: '2025-10-27T12:00:00Z'
    }
  ],
  water_level_forecasts: [
    { id: 'forecast-1', station_id: 'station-1', forecast_date: '2025-10-28', water_level_cm: 425, forecast_day: 1 },
    { id: 'forecast-2', station_id: 'station-1', forecast_date: '2025-10-29', water_level_cm: 430, forecast_day: 2 },
    { id: 'forecast-3', station_id: 'station-1', forecast_date: '2025-10-30', water_level_cm: 435, forecast_day: 3 },
    { id: 'forecast-4', station_id: 'station-1', forecast_date: '2025-10-31', water_level_cm: 440, forecast_day: 4 },
    { id: 'forecast-5', station_id: 'station-1', forecast_date: '2025-11-01', water_level_cm: 445, forecast_day: 5 }
  ],
  drought_locations: [
    { id: 'loc-1', location_name: 'Katymár', location_type: 'agricultural', county: 'Bács-Kiskun', latitude: 46.2167, longitude: 19.5667, is_active: true },
    { id: 'loc-2', location_name: 'Dávod', location_type: 'agricultural', county: 'Tolna', latitude: 46.4167, longitude: 18.7667, is_active: true }
  ],
  drought_data: [
    {
      id: 'drought-1',
      location_id: 'loc-1',
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
    }
  ],
  groundwater_wells: [
    { id: 'well-1', well_name: 'Baja K-17', well_code: 'K-17', county: 'Bács-Kiskun', city_name: 'Baja', latitude: 46.1811, longitude: 18.9550, depth_meters: 45.5, well_type: 'monitoring', is_active: true }
  ],
  groundwater_data: [
    {
      id: 'gw-1',
      well_id: 'well-1',
      water_level_meters: 12.5,
      water_level_masl: 95.3,
      water_temperature: 14.2,
      timestamp: '2025-10-27T12:00:00Z'
    }
  ],
  push_subscriptions: [
    {
      id: 'sub-1',
      station_id: 'station-2',
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      p256dh_key: 'BMxyz123',
      auth_key: 'auth123'
    }
  ],
  push_notification_logs: []
};

/**
 * Create a mock Supabase select query builder
 */
function createMockSelectBuilder(_table: string, data: any[]) {
  return {
    select: (_fields: string = '*') => ({
      eq: (field: string, value: any) => ({
        single: vi.fn().mockResolvedValue({
          data: data.find(item => item[field] === value) || null,
          error: data.find(item => item[field] === value) ? null : { message: 'Not found' }
        }),
        order: (_orderField: string, _options?: any) => ({
          limit: (_n: number) => ({
            single: vi.fn().mockResolvedValue({
              data: data.find(item => item[field] === value) || null,
              error: data.find(item => item[field] === value) ? null : { message: 'Not found' }
            })
          })
        }),
        limit: (n: number) => vi.fn().mockResolvedValue({
          data: data.filter(item => item[field] === value).slice(0, n),
          error: null
        }),
        gte: (gteField: string, gteValue: any) => ({
          limit: (n: number) => vi.fn().mockResolvedValue({
            data: data.filter(item => item[field] === value && item[gteField] >= gteValue).slice(0, n),
            error: null
          })
        })
      }),
      order: (_orderField: string, _options?: any) => ({
        limit: (n: number) => vi.fn().mockResolvedValue({
          data: data.slice(0, n),
          error: null
        })
      }),
      limit: (n: number) => vi.fn().mockResolvedValue({
        data: data.slice(0, n),
        error: null
      })
    })
  };
}

/**
 * Create a mock Supabase client
 */
export function createMockSupabaseClient(customData: Partial<typeof mockDatabaseData> = {}) {
  const data = { ...mockDatabaseData, ...customData };

  return {
    from: (table: string) => {
      const tableData = data[table as keyof typeof data] || [];

      return {
        ...createMockSelectBuilder(table, tableData as any[]),

        insert: vi.fn().mockImplementation((insertData: any) => {
          // Add inserted data to mock database
          if (Array.isArray(tableData)) {
            (tableData as any[]).push({
              id: `${table}-${Date.now()}`,
              ...insertData
            });
          }
          return Promise.resolve({ data: insertData, error: null });
        }),

        update: vi.fn().mockImplementation((updateData: any) => ({
          eq: (field: string, value: any) => {
            const item = (tableData as any[]).find(i => i[field] === value);
            if (item) {
              Object.assign(item, updateData);
              return Promise.resolve({ data: item, error: null });
            }
            return Promise.resolve({ data: null, error: { message: 'Not found' } });
          }
        })),

        upsert: vi.fn().mockImplementation((upsertData: any, _options?: any) => {
          // Simplified upsert - just adds to database
          if (Array.isArray(tableData)) {
            (tableData as any[]).push({
              id: `${table}-${Date.now()}`,
              ...upsertData
            });
          }
          return Promise.resolve({ data: upsertData, error: null });
        }),

        delete: vi.fn().mockImplementation(() => ({
          eq: (field: string, value: any) => {
            const index = (tableData as any[]).findIndex(i => i[field] === value);
            if (index !== -1) {
              (tableData as any[]).splice(index, 1);
              return Promise.resolve({ data: null, error: null });
            }
            return Promise.resolve({ data: null, error: { message: 'Not found' } });
          }
        }))
      };
    },

    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      signIn: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null
      })
    },

    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-path' },
          error: null
        }),
        download: vi.fn().mockResolvedValue({
          data: new Blob(),
          error: null
        })
      })
    }
  };
}

/**
 * Mock Supabase client with error responses
 */
export function createMockSupabaseClientWithErrors() {
  return {
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: 'PGRST116' }
          })
        })
      }),
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed', code: 'PGRST116' }
      }),
      update: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed', code: 'PGRST116' }
      }),
      delete: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed', code: 'PGRST116' }
      })
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'Auth error' }
      })
    }
  };
}

/**
 * Reset mock database to initial state
 */
export function resetMockDatabase() {
  // Reset each table to original data
  Object.keys(mockDatabaseData).forEach(key => {
    (mockDatabaseData as any)[key] = [];
  });
}
