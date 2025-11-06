/**
 * Mock Groundwater Data Generator
 *
 * ⚠️ TEMPORARY SOLUTION - NOT REAL DATA ⚠️
 *
 * Generates realistic-looking but FAKE 60-day groundwater level data
 * for 15 monitoring wells. Used until official API access is obtained.
 *
 * Real data source (pending): geoportal.vizugy.hu or official API
 */

export interface MockGroundwaterDataPoint {
  timestamp: string;
  waterLevelMeters: number;
  waterLevelMasl: number | null;
  waterTemperature: number | null;
}

/**
 * Generate 60 days of mock groundwater data for a specific well
 *
 * Pattern: Seasonal trend with daily variations
 * - Base level varies by well (2.5m - 4.5m)
 * - Gradual seasonal decline (-0.3m over 60 days)
 * - Daily random variation (±0.15m)
 * - Occasional "recharge events" (rainfall simulation)
 */
export function generateMockGroundwaterData(
  wellCode: string,
  wellName: string
): MockGroundwaterDataPoint[] {
  const data: MockGroundwaterDataPoint[] = [];
  const now = new Date();

  // Base water level varies by well location
  const baseLevel = getBaseWaterLevel(wellCode);

  // Seasonal trend: gradual decline over 60 days
  const seasonalDecline = 0.3; // -30cm over period

  for (let daysAgo = 60; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(6, 0, 0, 0); // Fixed 6:00 AM measurement time

    // Calculate water level
    const seasonalFactor = (60 - daysAgo) / 60; // 0 to 1
    const seasonalEffect = -seasonalDecline * seasonalFactor;

    // Daily random variation
    const dailyVariation = (Math.random() - 0.5) * 0.3; // ±15cm

    // Occasional recharge events (simulate rainfall)
    const isRainfallEvent = Math.random() < 0.1; // 10% chance
    const rainfallBoost = isRainfallEvent ? Math.random() * 0.4 : 0; // up to +40cm

    const waterLevel = baseLevel + seasonalEffect + dailyVariation + rainfallBoost;

    // Round to 2 decimal places
    const waterLevelMeters = Math.round(waterLevel * 100) / 100;

    // MASL (meters above sea level) - optional, only for some wells
    const waterLevelMasl = Math.random() < 0.7
      ? Math.round((95 + waterLevelMeters) * 100) / 100
      : null;

    // Water temperature - optional, seasonal variation
    const monthIndex = date.getMonth();
    const baseTemp = 12 + Math.sin((monthIndex / 12) * Math.PI * 2) * 6; // 6-18°C seasonal
    const waterTemperature = Math.random() < 0.6
      ? Math.round((baseTemp + (Math.random() - 0.5) * 2) * 10) / 10
      : null;

    data.push({
      timestamp: date.toISOString(),
      waterLevelMeters,
      waterLevelMasl,
      waterTemperature
    });
  }

  return data;
}

/**
 * Get base water level for each well (location-specific)
 */
function getBaseWaterLevel(wellCode: string): number {
  const wellBaseLevels: Record<string, number> = {
    '4576': 3.8,   // Sátorhely
    '912': 3.2,    // Mohács II.
    '1461': 2.9,   // Kölked
    '1460': 3.5,   // Mohács
    '4481': 3.1,   // Mohács-Sárhát
    '448': 4.2,    // Dávod
    '1450': 3.6,   // Hercegszántó
    '4479': 3.4,   // Nagybaracska
    '132042': 2.8, // Szeremle
    '662': 4.0,    // Alsónyék
    '1426': 3.3,   // Érsekcsanád
    '658': 3.7,    // Decs
    '656': 3.9,    // Szekszárd-Borrév
    '653': 4.1,    // Őcsény
    '660': 3.5     // Báta
  };

  return wellBaseLevels[wellCode] || 3.5; // Default 3.5m
}

/**
 * Check if mock data mode is enabled
 * This can be controlled via environment variable or feature flag
 */
export function isMockDataMode(): boolean {
  // ✅ REAL DATA NOW AVAILABLE - Mock mode disabled (2025-11-06)
  // 13,618 measurements from 15 wells scraped from vizugy.hu
  return false;
}
