/**
 * Mock Data for Testing
 *
 * Placeholder data for all modules based on LOCATIONS_DATA.md
 * This will be replaced with real API calls by the Data Engineer
 */

import type {
  City,
  WaterLevelStation,
  DroughtLocation,
  GroundwaterWell,
} from '../types';

/**
 * METEOROLOGY MODULE - 4 Cities
 */
export const MOCK_CITIES: City[] = [
  {
    id: 'meteo-city-1',
    name: 'Szekszárd',
    county: 'Tolna',
    latitude: 46.3481,
    longitude: 18.7097,
    population: 32833,
    isActive: true,
  },
  {
    id: 'meteo-city-2',
    name: 'Baja',
    county: 'Bács-Kiskun',
    latitude: 46.1811,
    longitude: 18.9550,
    population: 35989,
    isActive: true,
  },
  {
    id: 'meteo-city-3',
    name: 'Dunaszekcső',
    county: 'Baranya',
    latitude: 46.0833,
    longitude: 18.7667,
    population: 2453,
    isActive: true,
  },
  {
    id: 'meteo-city-4',
    name: 'Mohács',
    county: 'Baranya',
    latitude: 45.9928,
    longitude: 18.6836,
    population: 18486,
    isActive: true,
  },
];

/**
 * WATER LEVEL MODULE - 3 Stations
 */
export const MOCK_STATIONS: WaterLevelStation[] = [
  {
    id: 'water-station-1',
    stationName: 'Baja',
    riverName: 'Duna',
    cityName: 'Baja',
    latitude: 46.1811,
    longitude: 18.9550,
    lnvLevel: 150,
    kkvLevel: 300,
    nvLevel: 750,
    isActive: true,
    displayInComparison: true,
  },
  {
    id: 'water-station-2',
    stationName: 'Mohács',
    riverName: 'Duna',
    cityName: 'Mohács',
    latitude: 45.9928,
    longitude: 18.6836,
    lnvLevel: 120,
    kkvLevel: 280,
    nvLevel: 700,
    isActive: true,
    displayInComparison: true,
  },
  {
    id: 'water-station-3',
    stationName: 'Nagybajcs',
    riverName: 'Duna',
    cityName: 'Nagybajcs',
    latitude: 47.9025,
    longitude: 17.9619,
    lnvLevel: 250,
    kkvLevel: 450,
    nvLevel: 900,
    isActive: true,
    displayInComparison: true,
  },
];

/**
 * DROUGHT MODULE - 5 Monitoring Locations
 */
export const MOCK_DROUGHT_LOCATIONS: DroughtLocation[] = [
  {
    id: 'drought-loc-1',
    locationName: 'Katymár',
    locationType: 'monitoring_station',
    county: 'Bács-Kiskun',
    latitude: 46.2167,
    longitude: 19.5667,
    isActive: true,
  },
  {
    id: 'drought-loc-2',
    locationName: 'Dávod',
    locationType: 'monitoring_station',
    county: 'Tolna',
    latitude: 46.4167,
    longitude: 18.7667,
    isActive: true,
  },
  {
    id: 'drought-loc-3',
    locationName: 'Szederkény',
    locationType: 'monitoring_station',
    county: 'Bács-Kiskun',
    latitude: 46.3833,
    longitude: 19.2500,
    isActive: true,
  },
  {
    id: 'drought-loc-4',
    locationName: 'Sükösd',
    locationType: 'monitoring_station',
    county: 'Bács-Kiskun',
    latitude: 46.2833,
    longitude: 19.0000,
    isActive: true,
  },
  {
    id: 'drought-loc-5',
    locationName: 'Csávoly',
    locationType: 'monitoring_station',
    county: 'Bács-Kiskun',
    latitude: 46.4500,
    longitude: 19.2833,
    isActive: true,
  },
];

/**
 * DROUGHT MODULE - 15 Groundwater Wells
 */
export const MOCK_GROUNDWATER_WELLS: GroundwaterWell[] = [
  {
    id: 'well-1',
    wellName: 'Sátorhely',
    wellCode: '4576',
    county: 'Bács-Kiskun',
    cityName: 'Sátorhely',
    latitude: 46.3333,
    longitude: 19.3667,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-2',
    wellName: 'Mohács',
    wellCode: '1460',
    county: 'Baranya',
    cityName: 'Mohács',
    latitude: 45.9928,
    longitude: 18.6836,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-3',
    wellName: 'Hercegszántó',
    wellCode: '1450',
    county: 'Bács-Kiskun',
    cityName: 'Hercegszántó',
    latitude: 46.1833,
    longitude: 19.0167,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-4',
    wellName: 'Alsónyék',
    wellCode: '662',
    county: 'Tolna',
    cityName: 'Alsónyék',
    latitude: 46.2667,
    longitude: 18.5667,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-5',
    wellName: 'Szekszárd-Borrév',
    wellCode: '656',
    county: 'Tolna',
    cityName: 'Szekszárd',
    latitude: 46.3481,
    longitude: 18.7097,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-6',
    wellName: 'Mohács II.',
    wellCode: '912',
    county: 'Baranya',
    cityName: 'Mohács',
    latitude: 45.9928,
    longitude: 18.6836,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-7',
    wellName: 'Mohács-Sárhát',
    wellCode: '4481',
    county: 'Baranya',
    cityName: 'Mohács',
    latitude: 45.9928,
    longitude: 18.6836,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-8',
    wellName: 'Nagybaracska',
    wellCode: '4479',
    county: 'Bács-Kiskun',
    cityName: 'Nagybaracska',
    latitude: 46.1333,
    longitude: 18.9833,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-9',
    wellName: 'Érsekcsanád',
    wellCode: '1426',
    county: 'Bács-Kiskun',
    cityName: 'Érsekcsanád',
    latitude: 46.2833,
    longitude: 19.4167,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-10',
    wellName: 'Őcsény',
    wellCode: '653',
    county: 'Tolna',
    cityName: 'Őcsény',
    latitude: 46.3167,
    longitude: 18.6667,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-11',
    wellName: 'Kölked',
    wellCode: '1461',
    county: 'Baranya',
    cityName: 'Kölked',
    latitude: 46.0167,
    longitude: 18.7500,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-12',
    wellName: 'Dávod',
    wellCode: '448',
    county: 'Tolna',
    cityName: 'Dávod',
    latitude: 46.4167,
    longitude: 18.7667,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-13',
    wellName: 'Szeremle',
    wellCode: '132042',
    county: 'Bács-Kiskun',
    cityName: 'Szeremle',
    latitude: 46.5500,
    longitude: 19.0333,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-14',
    wellName: 'Decs',
    wellCode: '658',
    county: 'Tolna',
    cityName: 'Decs',
    latitude: 46.3833,
    longitude: 18.7167,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
  {
    id: 'well-15',
    wellName: 'Báta',
    wellCode: '660',
    county: 'Tolna',
    cityName: 'Báta',
    latitude: 46.2000,
    longitude: 18.7833,
    depthMeters: null,
    wellType: 'monitoring',
    isActive: true,
  },
];

/**
 * Validation helper functions
 */
export const validateMockData = () => {
  const errors: string[] = [];

  // Validate counts
  if (MOCK_CITIES.length !== 4) {
    errors.push(`Expected 4 cities, got ${MOCK_CITIES.length}`);
  }

  if (MOCK_STATIONS.length !== 3) {
    errors.push(`Expected 3 stations, got ${MOCK_STATIONS.length}`);
  }

  if (MOCK_DROUGHT_LOCATIONS.length !== 5) {
    errors.push(`Expected 5 drought locations, got ${MOCK_DROUGHT_LOCATIONS.length}`);
  }

  if (MOCK_GROUNDWATER_WELLS.length !== 15) {
    errors.push(`Expected 15 wells, got ${MOCK_GROUNDWATER_WELLS.length}`);
  }

  if (errors.length > 0) {
    console.error('Mock data validation failed:', errors);
    throw new Error(`Mock data validation failed: ${errors.join(', ')}`);
  }

  console.log('✓ Mock data validation passed: 4 cities, 3 stations, 5 locations, 15 wells');
  return true;
};
