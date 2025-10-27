/**
 * Mock API Responses for Testing
 *
 * Contains mock data for all external APIs used in DunApp PWA:
 * - OpenWeatherMap API
 * - Meteoblue API
 * - Yr.no API
 * - aszalymonitoring.vizugy.hu API
 * - vizugy.hu (HTML responses)
 * - hydroinfo.hu (HTML responses)
 */

// ============================================================================
// METEOROLOGY MODULE - OpenWeatherMap API
// ============================================================================

export const mockOpenWeatherMapResponse = {
  coord: { lon: 18.7097, lat: 46.3481 },
  weather: [
    {
      id: 802,
      main: 'Clouds',
      description: 'scattered clouds',
      icon: '03d'
    }
  ],
  base: 'stations',
  main: {
    temp: 22.5,
    feels_like: 21.0,
    temp_min: 20,
    temp_max: 25,
    pressure: 1013,
    humidity: 65
  },
  visibility: 10000,
  wind: {
    speed: 3.5,
    deg: 180
  },
  clouds: {
    all: 40
  },
  dt: 1698412800,
  sys: {
    type: 1,
    id: 6906,
    country: 'HU',
    sunrise: 1698383400,
    sunset: 1698421200
  },
  timezone: 3600,
  id: 3044760,
  name: 'Szekszárd',
  cod: 200
};

export const mockOpenWeatherMapWithRain = {
  ...mockOpenWeatherMapResponse,
  rain: {
    '1h': 2.5,
    '3h': 5.0
  }
};

export const mockOpenWeatherMapWithSnow = {
  ...mockOpenWeatherMapResponse,
  snow: {
    '1h': 1.5,
    '3h': 3.0
  },
  weather: [
    {
      id: 600,
      main: 'Snow',
      description: 'light snow',
      icon: '13d'
    }
  ]
};

// ============================================================================
// METEOROLOGY MODULE - Meteoblue API
// ============================================================================

export const mockMeteoblueResponse = {
  metadata: {
    name: 'Szekszárd',
    latitude: 46.3481,
    longitude: 18.7097,
    height: 95,
    timezone: 'Europe/Budapest',
    modelrun_utc: '2025-10-27T00:00:00Z'
  },
  units: {
    time: 'ISO8601',
    temperature: 'C',
    windspeed: 'km/h',
    precipitation: 'mm'
  },
  data_1h: {
    time: ['2025-10-27T12:00:00Z', '2025-10-27T13:00:00Z'],
    temperature: [22.5, 23.0],
    relativehumidity: [65, 63],
    windspeed: [12.6, 14.4], // km/h
    winddirection: [180, 185],
    precipitation: [0.0, 0.5],
    totalcloudcover: [40, 45]
  }
};

// ============================================================================
// METEOROLOGY MODULE - Yr.no API
// ============================================================================

export const mockYrNoResponse = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [18.7097, 46.3481, 95]
  },
  properties: {
    meta: {
      updated_at: '2025-10-27T10:00:00Z',
      units: {
        air_pressure_at_sea_level: 'hPa',
        air_temperature: 'celsius',
        cloud_area_fraction: '%',
        precipitation_amount: 'mm',
        relative_humidity: '%',
        wind_from_direction: 'degrees',
        wind_speed: 'm/s'
      }
    },
    timeseries: [
      {
        time: '2025-10-27T12:00:00Z',
        data: {
          instant: {
            details: {
              air_pressure_at_sea_level: 1013,
              air_temperature: 22.5,
              cloud_area_fraction: 40,
              relative_humidity: 65,
              wind_from_direction: 180,
              wind_speed: 3.5
            }
          },
          next_1_hours: {
            summary: {
              symbol_code: 'partlycloudy_day'
            },
            details: {
              precipitation_amount: 0.0
            }
          }
        }
      }
    ]
  }
};

// ============================================================================
// WATER LEVEL MODULE - vizugy.hu HTML
// ============================================================================

export const mockVizugyHuHTML = `
<!DOCTYPE html>
<html>
<head><title>Vízállás adatok</title></head>
<body>
  <h1>Vízállás mérések</h1>
  <table border="1">
    <thead>
      <tr>
        <th>Állomás</th>
        <th>LNV</th>
        <th>Vízállás (cm)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Baja</td>
        <td>150</td>
        <td>420</td>
      </tr>
      <tr>
        <td>Mohács</td>
        <td>200</td>
        <td>395</td>
      </tr>
      <tr>
        <td>Nagybajcs</td>
        <td>180</td>
        <td>410</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

// ============================================================================
// WATER LEVEL MODULE - hydroinfo.hu HTML (ISO-8859-2 encoded)
// ============================================================================

export const mockHydroinfoHuHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="ISO-8859-2">
  <title>Duna előrejelzés</title>
</head>
<body>
  <h1>Duna vízállás előrejelzés</h1>
  <table border="1">
    <thead>
      <tr>
        <th>Állomás</th>
        <th>1. nap</th>
        <th>2. nap</th>
        <th>3. nap</th>
        <th>4. nap</th>
        <th>5. nap</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Baja</td>
        <td>425</td>
        <td>430</td>
        <td>435</td>
        <td>440</td>
        <td>445</td>
      </tr>
      <tr>
        <td>Mohács</td>
        <td>400</td>
        <td>405</td>
        <td>410</td>
        <td>415</td>
        <td>420</td>
      </tr>
      <tr>
        <td>Nagybajcs</td>
        <td>415</td>
        <td>420</td>
        <td>425</td>
        <td>430</td>
        <td>435</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

// ============================================================================
// DROUGHT MODULE - aszalymonitoring.vizugy.hu API
// ============================================================================

export const mockDroughtSearchResponse = {
  nearestStation: {
    id: 'station-katymar-123',
    name: 'Katymár Állomás',
    distance: 250,
    latitude: 46.2200,
    longitude: 19.5700
  },
  allStations: [
    {
      id: 'station-katymar-123',
      name: 'Katymár Állomás',
      distance: 250
    },
    {
      id: 'station-other-456',
      name: 'Másik Állomás',
      distance: 5000
    }
  ]
};

export const mockDroughtStationDataResponse = [
  {
    date: '2025-10-27',
    HDI: 0.65,
    HDIS: 0.45,
    soilMoisture_10cm: 28.5,
    soilMoisture_20cm: 30.2,
    soilMoisture_30cm: 32.1,
    soilMoisture_50cm: 34.5,
    soilMoisture_70cm: 36.8,
    soilMoisture_100cm: 38.2,
    soilTemp: 18.5,
    airTemp: 22.3,
    precipitation: 0.0,
    relativeHumidity: 65
  },
  {
    date: '2025-10-26',
    HDI: 0.62,
    HDIS: 0.42,
    soilMoisture_10cm: 27.8,
    soilMoisture_20cm: 29.5,
    soilMoisture_30cm: 31.2,
    soilMoisture_50cm: 33.8,
    soilMoisture_70cm: 35.9,
    soilMoisture_100cm: 37.5,
    soilTemp: 17.8,
    airTemp: 21.5,
    precipitation: 2.5,
    relativeHumidity: 72
  },
  {
    date: '2025-10-25',
    HDI: 0.60,
    HDIS: 0.40,
    soilMoisture_10cm: 27.0,
    soilMoisture_20cm: 28.8,
    soilMoisture_30cm: 30.5,
    soilMoisture_50cm: 33.0,
    soilMoisture_70cm: 35.0,
    soilMoisture_100cm: 36.8,
    soilTemp: 17.2,
    airTemp: 20.8,
    precipitation: 0.0,
    relativeHumidity: 68
  }
];

export const mockDroughtStationDataEmpty = [];

export const mockDroughtStationDataIncomplete = [
  {
    date: '2025-10-27',
    HDI: 0.65,
    HDIS: null,
    soilMoisture_10cm: 28.5,
    soilMoisture_20cm: null,
    soilMoisture_30cm: null,
    soilMoisture_50cm: null,
    soilMoisture_70cm: null,
    soilMoisture_100cm: null,
    soilTemp: 18.5,
    airTemp: 22.3,
    precipitation: null,
    relativeHumidity: 65
  }
];

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export const mockApiErrorResponses = {
  notFound: {
    error: 'Not Found',
    message: 'Resource not found',
    code: 404
  },
  unauthorized: {
    error: 'Unauthorized',
    message: 'Invalid API key',
    code: 401
  },
  rateLimit: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded',
    code: 429
  },
  serverError: {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    code: 500
  },
  timeout: {
    error: 'Request Timeout',
    message: 'Request took too long to complete',
    code: 408
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate mock weather data for multiple cities
 */
export function generateMockWeatherDataForCities(cities: string[]) {
  return cities.map((city, index) => ({
    ...mockOpenWeatherMapResponse,
    name: city,
    main: {
      ...mockOpenWeatherMapResponse.main,
      temp: 20 + index * 2
    }
  }));
}

/**
 * Generate mock drought data for date range
 */
export function generateMockDroughtDataRange(startDate: Date, days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      HDI: 0.6 + (Math.random() * 0.2),
      HDIS: 0.4 + (Math.random() * 0.2),
      soilMoisture_10cm: 25 + (Math.random() * 10),
      soilMoisture_20cm: 27 + (Math.random() * 10),
      soilMoisture_30cm: 29 + (Math.random() * 10),
      soilMoisture_50cm: 32 + (Math.random() * 10),
      soilMoisture_70cm: 35 + (Math.random() * 10),
      soilMoisture_100cm: 37 + (Math.random() * 10),
      soilTemp: 15 + (Math.random() * 10),
      airTemp: 18 + (Math.random() * 10),
      precipitation: Math.random() * 5,
      relativeHumidity: 60 + (Math.random() * 20)
    });
  }
  return data;
}

/**
 * Generate mock water level forecast
 */
export function generateMockWaterLevelForecast(startLevel: number, days: number) {
  const forecast = [];
  let level = startLevel;
  for (let i = 1; i <= days; i++) {
    level += Math.floor(Math.random() * 10) - 3; // Random change -3 to +7 cm
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecast.push({
      day: i,
      waterLevel: level,
      date: date.toISOString().split('T')[0]
    });
  }
  return forecast;
}
