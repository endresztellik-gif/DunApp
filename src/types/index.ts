/**
 * DunApp PWA - Core TypeScript Types
 *
 * Application-level types for the frontend components.
 * These types extend and complement database.types.ts with UI-specific types.
 */

/**
 * Module Type
 * Represents the three main modules in the application
 */
export type ModuleType = 'meteorology' | 'water-level' | 'drought';

// ============================================================================
// METEOROLOGY MODULE TYPES
// ============================================================================

/**
 * City
 * Represents a meteorological city location
 */
export interface City {
  id: string;
  name: string;
  county: string;
  latitude: number;
  longitude: number;
  population: number | null;
  isActive: boolean;
}

/**
 * WeatherData
 * Current weather data for a city
 */
export interface WeatherData {
  cityId: string;
  temperature: number | null;
  feelsLike: number | null;
  tempMin: number | null;
  tempMax: number | null;
  pressure: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  cloudsPercent: number | null;
  weatherMain: string | null;
  weatherDescription: string | null;
  weatherIcon: string | null;
  rain1h: number | null;
  rain3h: number | null;
  snow1h: number | null;
  snow3h: number | null;
  visibility: number | null;
  timestamp: string;
}

/**
 * ForecastData
 * Weather forecast data for a specific date
 */
export interface ForecastData {
  date: string;
  temperature: number;
  tempMin: number;
  tempMax: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  weatherDescription: string;
  weatherIcon: string;
}

// ============================================================================
// WATER LEVEL MODULE TYPES
// ============================================================================
// Updated: 2025-11-03 (Phase 4.5)
// Compatible with Migration 008 + 009

/**
 * WaterLevelStation
 * Represents a water level monitoring station on the Danube river
 */
export interface WaterLevelStation {
  id: string; // UUID
  stationId: string; // External station ID (e.g., "442051" for Nagybajcs)
  name: string; // Station name (Nagybajcs, Baja, Mohács)
  river: string; // River name (default: "Duna")
  riverKm: number | null; // River kilometer marker
  latitude: number;
  longitude: number;
  lowWaterLevelCm: number | null; // LNV - Legalacsonyabb Navigálható Vízállás
  highWaterLevelCm: number | null; // KKV - Közepes Kisvíz
  alertLevelCm: number | null; // Alert level (triggers notifications)
  dangerLevelCm: number | null; // Danger level (flooding risk)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * WaterLevelData
 * Current water level measurement for a station
 */
export interface WaterLevelData {
  id: string; // UUID
  stationId: string; // UUID reference to station
  measuredAt: string; // TIMESTAMPTZ
  waterLevelCm: number; // Water level in centimeters
  flowRateM3s: number | null; // Flow rate in cubic meters per second
  waterTempCelsius: number | null; // Water temperature in Celsius
  source: string; // Data source (vizugy.hu, hydroinfo.hu, manual)
  createdAt: string;
}

/**
 * WaterLevelForecast
 * Water level forecast data (5-day prediction)
 */
export interface WaterLevelForecast {
  id: string; // UUID
  stationId: string; // UUID reference to station
  forecastDate: string; // DATE (YYYY-MM-DD)
  issuedAt: string; // TIMESTAMPTZ when forecast was issued
  forecastedLevelCm: number; // Predicted water level in centimeters
  uncertaintyCm?: number | null; // Forecast uncertainty (± value in cm, grows over time)
  source: string; // Data source (hydroinfo.hu, manual)
  createdAt: string;
}

// ============================================================================
// DROUGHT MODULE TYPES
// ============================================================================

/**
 * DroughtLocation
 * Represents a drought monitoring location
 */
export interface DroughtLocation {
  id: string;
  locationName: string;
  locationType: string;
  county: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

/**
 * GroundwaterWell
 * Represents a groundwater monitoring well
 */
export interface GroundwaterWell {
  id: string;
  wellName: string;
  wellCode: string;
  county: string;
  cityName: string;
  latitude: number;
  longitude: number;
  depthMeters: number | null;
  wellType: string;
  isActive: boolean;
  enabled?: boolean; // Data quality-based visibility (added 2026-01-23)
}

/**
 * DroughtData
 * Drought monitoring data for a location
 */
export interface DroughtData {
  locationId: string;
  droughtIndex: number | null;
  waterDeficitIndex: number | null;
  soilMoisture10cm: number | null;
  soilMoisture20cm: number | null;
  soilMoisture30cm: number | null;
  soilMoisture50cm: number | null;
  soilMoisture70cm: number | null;
  soilMoisture100cm: number | null;
  soilTemperature: number | null;
  airTemperature: number | null;
  precipitation: number | null;
  relativeHumidity: number | null;
  timestamp: string;
}

/**
 * GroundwaterData
 * Groundwater level data for a well
 */
export interface GroundwaterData {
  wellId: string;
  waterLevelMeters: number | null;
  waterLevelMasl: number | null;  // Meters Above Sea Level
  waterTemperature: number | null;
  timestamp: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * LoadingState
 * Represents the loading state of data
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * ApiError
 * Standard error object for API failures
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * DroughtCategory
 * Drought severity categories
 */
export type DroughtCategory =
  | 'none'        // No drought (green)
  | 'mild'        // Mild drought (light yellow)
  | 'moderate'    // Moderate drought (yellow)
  | 'severe'      // Severe drought (orange)
  | 'extreme';    // Extreme drought (red)

/**
 * DroughtParameterType
 * Parameters that can be displayed on the drought monitoring map
 */
export type DroughtParameterType =
  | 'droughtIndex'
  | 'soilMoisture'
  | 'waterDeficit'
  | 'precipitation';

// ============================================================================
// MAP TYPES
// ============================================================================

/**
 * MapBounds
 * Geographic bounds for map views
 */
export interface MapBounds {
  north: number;
  south: number;
  west: number;
  east: number;
}

/**
 * MapCenter
 * Center coordinates for map
 */
export interface MapCenter {
  latitude: number;
  longitude: number;
}

/**
 * MarkerData
 * Generic marker data for maps
 */
export interface MarkerData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  value?: number | null;
  category?: DroughtCategory;
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

/**
 * ChartDataPoint
 * Generic data point for charts
 */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * MultiLineChartData
 * Data for multi-line charts (e.g., water level comparison)
 */
export interface MultiLineChartData {
  date: string;
  [key: string]: string | number;  // Dynamic keys for station names
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * SelectOption
 * Generic option for dropdown selectors
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * DataSource
 * Information about data source and last update
 */
export interface DataSource {
  name: string;
  url?: string;
  lastUpdate: string;
}
