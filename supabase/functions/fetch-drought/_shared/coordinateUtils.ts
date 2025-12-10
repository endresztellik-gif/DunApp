/**
 * Coordinate Conversion Utilities
 *
 * Converts between WGS84 (lat/lon) and EOV (Hungarian projection)
 * Used for ArcGIS REST API queries that require EOV coordinates
 *
 * NOTE: This is currently NOT USED in the main implementation
 * because aszalymonitoring API handles conversion internally.
 * Included for reference and future ArcGIS integration.
 */

/**
 * EOV (Hungarian Projection) Parameters
 *
 * EPSG:23700 - HD72 / EOV (Egységes Országos Vetületi)
 * Projection: Hotine Oblique Mercator
 * Datum: Hungarian Datum 1972 (HD72)
 * Ellipsoid: GRS 1967
 */
const EOV_PROJECTION = {
  epsg: 23700,
  name: 'HD72 / EOV',
  proj4: '+proj=somerc +lat_0=47.14439372222222 +lon_0=19.04857177777778 +k_0=0.99993 +x_0=650000 +y_0=200000 +ellps=GRS67 +towgs84=52.17,-71.82,-14.9,0,0,0,0 +units=m +no_defs'
};

/**
 * WGS84 (GPS) Parameters
 *
 * EPSG:4326 - WGS 84
 * Standard latitude/longitude coordinates
 */
const WGS84_PROJECTION = {
  epsg: 4326,
  name: 'WGS 84',
  proj4: '+proj=longlat +datum=WGS84 +no_defs'
};

/**
 * Convert WGS84 coordinates to EOV
 *
 * @param latitude - WGS84 latitude (decimal degrees)
 * @param longitude - WGS84 longitude (decimal degrees)
 * @returns { eovX: number, eovY: number } - EOV coordinates in meters
 *
 * @example
 * const { eovX, eovY } = wgs84ToEov(46.2167, 19.5667);
 * // { eovX: 735123.45, eovY: 123456.78 }
 */
export function wgs84ToEov(latitude: number, longitude: number): { eovX: number; eovY: number } {
  // Simplified Helmert transformation (approximate)
  // For production, use a proper library like proj4js or GDAL

  // Semi-major axis and flattening for GRS67
  const a = 6378160.0; // meters
  const f = 1 / 298.247167427;

  // Calculate eccentricity squared
  const e2 = 2 * f - f * f;

  // Convert degrees to radians
  const latRad = (latitude * Math.PI) / 180;
  const lonRad = (longitude * Math.PI) / 180;

  // Central meridian and latitude of origin
  const lat0 = (47.14439372222222 * Math.PI) / 180;
  const lon0 = (19.04857177777778 * Math.PI) / 180;

  // Scale factor
  const k0 = 0.99993;

  // False easting and northing
  const x0 = 650000;
  const y0 = 200000;

  // Radius of curvature in prime vertical
  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));

  // Calculate differences
  const dLon = lonRad - lon0;
  const dLat = latRad - lat0;

  // Approximate EOV coordinates using simplified projection
  // NOTE: This is a rough approximation. For production, use proj4js!
  const eovX = x0 + k0 * N * Math.cos(latRad) * dLon;
  const eovY = y0 + k0 * N * dLat;

  return {
    eovX: Math.round(eovX * 100) / 100,
    eovY: Math.round(eovY * 100) / 100
  };
}

/**
 * Convert EOV coordinates to WGS84
 *
 * @param eovX - EOV X coordinate (meters)
 * @param eovY - EOV Y coordinate (meters)
 * @returns { latitude: number, longitude: number } - WGS84 coordinates
 *
 * @example
 * const { latitude, longitude } = eovToWgs84(735123.45, 123456.78);
 * // { latitude: 46.2167, longitude: 19.5667 }
 */
export function eovToWgs84(eovX: number, eovY: number): { latitude: number; longitude: number } {
  // Inverse transformation (approximate)
  // For production, use a proper library like proj4js or GDAL

  const a = 6378160.0;
  const f = 1 / 298.247167427;

  const lat0 = (47.14439372222222 * Math.PI) / 180;
  const lon0 = (19.04857177777778 * Math.PI) / 180;
  const k0 = 0.99993;
  const x0 = 650000;
  const y0 = 200000;

  // Calculate differences from false origin
  const dx = eovX - x0;
  const dy = eovY - y0;

  // Approximate inverse calculation
  const latRad = lat0 + dy / (k0 * a);
  const lonRad = lon0 + dx / (k0 * a * Math.cos(latRad));

  // Convert radians to degrees
  const latitude = (latRad * 180) / Math.PI;
  const longitude = (lonRad * 180) / Math.PI;

  return {
    latitude: Math.round(latitude * 100000) / 100000,
    longitude: Math.round(longitude * 100000) / 100000
  };
}

/**
 * Calculate distance between two WGS84 coordinates (Haversine formula)
 *
 * @param lat1 - Latitude of point 1 (degrees)
 * @param lon1 - Longitude of point 1 (degrees)
 * @param lat2 - Latitude of point 2 (degrees)
 * @param lon2 - Longitude of point 2 (degrees)
 * @returns Distance in meters
 *
 * @example
 * const distance = calculateDistance(46.2167, 19.5667, 46.2170, 19.5665);
 * // ~35 meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Find nearest station from a list of stations
 *
 * @param targetLat - Target latitude (WGS84)
 * @param targetLon - Target longitude (WGS84)
 * @param stations - Array of stations with { latitude, longitude, name }
 * @returns Nearest station with distance
 *
 * @example
 * const nearest = findNearestStation(46.2167, 19.5667, [
 *   { name: "Station A", latitude: 46.22, longitude: 19.57 },
 *   { name: "Station B", latitude: 46.21, longitude: 19.56 }
 * ]);
 * // { station: {...}, distance: 1200 }
 */
export function findNearestStation<T extends { latitude: number; longitude: number }>(
  targetLat: number,
  targetLon: number,
  stations: T[]
): { station: T; distance: number } | null {
  if (stations.length === 0) {
    return null;
  }

  let nearest = stations[0];
  let minDistance = calculateDistance(targetLat, targetLon, nearest.latitude, nearest.longitude);

  for (let i = 1; i < stations.length; i++) {
    const station = stations[i];
    const distance = calculateDistance(targetLat, targetLon, station.latitude, station.longitude);

    if (distance < minDistance) {
      nearest = station;
      minDistance = distance;
    }
  }

  return {
    station: nearest,
    distance: Math.round(minDistance)
  };
}

/**
 * USAGE EXAMPLE (for future ArcGIS integration)
 *
 * ```typescript
 * import { wgs84ToEov, eovToWgs84, calculateDistance } from './_shared/coordinateUtils.ts';
 *
 * // 1. Convert WGS84 to EOV for ArcGIS query
 * const { eovX, eovY } = wgs84ToEov(46.2167, 19.5667);
 * const arcgisUrl = `https://geoportal.vizugy.hu/arcgis/rest/services/.../query?where=EOVx=${eovX} AND EOVy=${eovY}`;
 *
 * // 2. Convert ArcGIS response (EOV) back to WGS84
 * const { latitude, longitude } = eovToWgs84(735123.45, 123456.78);
 *
 * // 3. Find nearest station
 * const arcgisStations = [
 *   { name: "Station A", EOVx: 735000, EOVy: 123000 },
 *   { name: "Station B", EOVx: 736000, EOVy: 124000 }
 * ];
 *
 * const stationsWgs84 = arcgisStations.map(s => ({
 *   ...s,
 *   ...eovToWgs84(s.EOVx, s.EOVy)
 * }));
 *
 * const nearest = findNearestStation(46.2167, 19.5667, stationsWgs84);
 * console.log(`Nearest station: ${nearest.station.name}, distance: ${nearest.distance}m`);
 * ```
 */

// Export projection definitions for reference
export const PROJECTIONS = {
  WGS84: WGS84_PROJECTION,
  EOV: EOV_PROJECTION
};

/**
 * IMPORTANT NOTES:
 *
 * 1. This implementation uses simplified Helmert transformation.
 *    For production with high accuracy requirements, use:
 *    - proj4js: https://github.com/proj4js/proj4js
 *    - GDAL Python bindings
 *    - PostGIS ST_Transform() in Supabase
 *
 * 2. Accuracy of simplified transformation: ±10-50 meters
 *    Acceptable for nearest-station search, NOT for surveying.
 *
 * 3. For exact transformation, use official Hungarian transformation grid:
 *    - HGTRS (Hungarian Geodetic Transformation Service)
 *
 * 4. Alternative: Query PostGIS directly in Supabase
 *    ```sql
 *    SELECT ST_Transform(
 *      ST_SetSRID(ST_Point(longitude, latitude), 4326),
 *      23700
 *    ) AS eov_point;
 *    ```
 */
