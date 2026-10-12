# Adat Struktúrák és Példák (Referencia Képekből)

## 📊 Meteorológiai Adatok

### Város Példa: Szekszárd

#### Aktuális Adatok (Meteorology Data)
```json
{
  "cityId": "uuid-szekszard",
  "cityName": "Szekszárd",
  "timestamp": "2025-10-24T14:31:21Z",
  "lastUpdate": "2025. 10. 24. 14:31:21",
  "source": "OMSZ (omsz.met.hu)",
  "current": {
    "temperature": 15.3,
    "temperatureUnit": "°C",
    "precipitation": 26.2,
    "precipitationUnit": "mm",
    "windSpeed": 4.1,
    "windSpeedUnit": "km/h",
    "pressure": 1013,
    "pressureUnit": "hPa",
    "humidity": 65,
    "humidityUnit": "%",
    "windDirection": {
      "degrees": 270,
      "cardinal": "Ny",
      "description": "Nyugat"
    }
  },
  "forecast3Day": {
    "available": false,
    "message": "Az előrejelzési adatok jelenleg nem érhetők el"
  },
  "forecast6Hour": {
    "available": false,
    "message": "Az előrejelzési grafikonok betöltése..."
  }
}
```

#### Város Lista (Meteorology Cities)
```json
[
  {
    "id": "uuid-1",
    "name": "Szekszárd",
    "county": "Tolna",
    "latitude": 46.3481,
    "longitude": 18.7097,
    "isActive": true
  },
  {
    "id": "uuid-2",
    "name": "Budapest",
    "county": "Budapest",
    "latitude": 47.4979,
    "longitude": 19.0402,
    "isActive": true
  }
  // További városok...
]
```

---

## 💧 Vízállás Adatok

### Állomás Példa: Szekszárd

#### Aktuális Adatok (Water Level Data)
```json
{
  "stationId": "uuid-szekszard-station",
  "stationName": "Szekszárd",
  "riverName": "Duna",
  "timestamp": "2025-10-24T14:31:52Z",
  "lastUpdate": "2025. 10. 24. 14:31:52",
  "source": "VízÜgy Data Portal",
  "current": {
    "waterLevel": 394,
    "waterLevelUnit": "cm",
    "discharge": 2416,
    "dischargeUnit": "m³/s",
    "waterTemperature": 23,
    "temperatureUnit": "°C",
    "trend": "stable"
  },
  "criticalLevels": {
    "lnv": 150,
    "kkv": 300,
    "nv": 700
  }
}
```

#### Előrejelzés Adatok (Forecast)
```json
{
  "stationId": "uuid-szekszard-station",
  "forecast": [
    {
      "date": "2025-10-24",
      "dateLabel": "okt. 24.",
      "waterLevel": 394,
      "stations": {
        "szekszard": 394,
        "passau": 378,
        "nagybajcs": 581
      }
    },
    {
      "date": "2025-10-25",
      "dateLabel": "okt. 25.",
      "waterLevel": 389,
      "stations": {
        "szekszard": 389,
        "passau": 389,
        "nagybajcs": 608
      }
    },
    {
      "date": "2025-10-26",
      "dateLabel": "okt. 26.",
      "waterLevel": 369,
      "stations": {
        "szekszard": 369,
        "passau": 389,
        "nagybajcs": 586
      }
    },
    {
      "date": "2025-10-27",
      "dateLabel": "okt. 27.",
      "waterLevel": 376,
      "stations": {
        "szekszard": 376,
        "passau": 376,
        "nagybajcs": 593
      }
    },
    {
      "date": "2025-10-28",
      "dateLabel": "okt. 28.",
      "waterLevel": 398,
      "stations": {
        "szekszard": 398,
        "passau": 398,
        "nagybajcs": 606
      }
    }
  ]
}
```

#### Állomások Lista (Water Level Stations)
```json
[
  {
    "id": "uuid-station-1",
    "stationName": "Szekszárd",
    "riverName": "Duna",
    "cityName": "Szekszárd",
    "latitude": 46.3481,
    "longitude": 18.7097,
    "lnvLevel": 150,
    "kkvLevel": 300,
    "nvLevel": 700,
    "isActive": true,
    "displayInComparison": true
  },
  {
    "id": "uuid-station-2",
    "stationName": "Passau",
    "riverName": "Duna",
    "cityName": "Passau",
    "country": "Németország",
    "latitude": 48.5734,
    "longitude": 13.4318,
    "lnvLevel": 200,
    "kkvLevel": 400,
    "nvLevel": 800,
    "isActive": true,
    "displayInComparison": true,
    "isUpstreamStation": true
  },
  {
    "id": "uuid-station-3",
    "stationName": "Nagybajcs",
    "riverName": "Duna",
    "cityName": "Nagybajcs",
    "latitude": 47.9025,
    "longitude": 17.9619,
    "lnvLevel": 250,
    "kkvLevel": 450,
    "nvLevel": 900,
    "isActive": true,
    "displayInComparison": true,
    "isUpstreamStation": true
  }
]
```

#### Kiegészítő Adatok (Supplementary Data)
```json
{
  "upstreamStations": [
    {
      "stationName": "Passau (Németország)",
      "currentLevel": 541,
      "unit": "cm",
      "description": "Felső vízgyűjtő adatok - hasznos információt nyújtanak a Duna felső szakaszának állapotáról, amely segíthet az árvíz előrejelzésében és a vízgazdálkodás tervezésében."
    },
    {
      "stationName": "Nagybajcs",
      "currentLevel": 487,
      "unit": "cm"
    }
  ]
}
```

---

## 🏜️ Aszály Adatok

### Helyszín Példa: Katymár

#### Aktuális Adatok (Drought Data)
```json
{
  "locationId": "uuid-katymar",
  "locationName": "Katymár",
  "date": "2025-10-24",
  "source": "OVF aszálymonitoring, VízÜgy",
  "data": {
    "droughtIndex": {
      "value": null,
      "unit": "/10",
      "available": false,
      "message": "N/A"
    },
    "soilMoisture": {
      "value": null,
      "unit": "%",
      "available": false,
      "message": "N/A"
    },
    "waterDeficit": {
      "value": null,
      "unit": "mm",
      "available": false,
      "message": "N/A"
    }
  }
}
```

#### Monitoring Helyszínek Lista (Drought Locations)
```json
[
  {
    "id": "uuid-loc-1",
    "locationName": "Katymár",
    "locationType": "monitoring_station",
    "county": "Bács-Kiskun",
    "latitude": 46.2167,
    "longitude": 19.5667,
    "isActive": true
  },
  {
    "id": "uuid-loc-2",
    "locationName": "Szeged",
    "locationType": "monitoring_station",
    "county": "Csongrád-Csanád",
    "latitude": 46.2530,
    "longitude": 20.1414,
    "isActive": true
  }
  // További helyszínek...
]
```

### Talajvízkutak

#### Talajvízszint Adat (Groundwater Data)
```json
{
  "wellId": "uuid-well-4576",
  "wellName": "Sátorhely",
  "wellCode": "#4576",
  "measurementDate": "2025-10-24",
  "source": "VízÜgy Data Portal",
  "data": {
    "waterLevelMeters": null,
    "waterLevelMasl": null,
    "available": false,
    "message": "Válassz egy kutat a 60 napos előzmények megtekintéséhez."
  },
  "historicalDataAvailable": true,
  "historicalDataDays": 60
}
```

#### Kutak Teljes Lista (Groundwater Wells)
```json
[
  {
    "id": "uuid-well-1",
    "wellName": "Sátorhely",
    "wellCode": "#4576",
    "county": "Bács-Kiskun",
    "cityName": "Sátorhely",
    "latitude": 46.3333,
    "longitude": 19.3667,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-2",
    "wellName": "Mohács",
    "wellCode": "#1460",
    "county": "Baranya",
    "cityName": "Mohács",
    "latitude": 45.9928,
    "longitude": 18.6836,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-3",
    "wellName": "Hercegszántó",
    "wellCode": "#1450",
    "county": "Bács-Kiskun",
    "cityName": "Hercegszántó",
    "latitude": 46.1833,
    "longitude": 19.0167,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-4",
    "wellName": "Alsónyék",
    "wellCode": "#662",
    "county": "Tolna",
    "cityName": "Alsónyék",
    "latitude": 46.2667,
    "longitude": 18.5667,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-5",
    "wellName": "Szekszárd-Borrév",
    "wellCode": "#656",
    "county": "Tolna",
    "cityName": "Szekszárd",
    "latitude": 46.3481,
    "longitude": 18.7097,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-6",
    "wellName": "Mohács II.",
    "wellCode": "#912",
    "county": "Baranya",
    "cityName": "Mohács",
    "latitude": 45.9928,
    "longitude": 18.6836,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-7",
    "wellName": "Mohács-Sárhát",
    "wellCode": "#4481",
    "county": "Baranya",
    "cityName": "Mohács",
    "latitude": 45.9928,
    "longitude": 18.6836,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-8",
    "wellName": "Nagybaracska",
    "wellCode": "#4479",
    "county": "Bács-Kiskun",
    "cityName": "Nagybaracska",
    "latitude": 46.1333,
    "longitude": 18.9833,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-9",
    "wellName": "Érsekcsanád",
    "wellCode": "#1426",
    "county": "Bács-Kiskun",
    "cityName": "Érsekcsanád",
    "latitude": 46.2833,
    "longitude": 19.4167,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-10",
    "wellName": "Öcsény",
    "wellCode": "#653",
    "county": "Tolna",
    "cityName": "Öcsény",
    "latitude": 46.3167,
    "longitude": 18.6667,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-11",
    "wellName": "Kölked",
    "wellCode": "#1461",
    "county": "Baranya",
    "cityName": "Kölked",
    "latitude": 46.0167,
    "longitude": 18.7500,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-12",
    "wellName": "Dávod",
    "wellCode": "#448",
    "county": "Tolna",
    "cityName": "Dávod",
    "latitude": 46.4167,
    "longitude": 18.7667,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-13",
    "wellName": "Szeremle",
    "wellCode": "#132042",
    "county": "Bács-Kiskun",
    "cityName": "Szeremle",
    "latitude": 46.5500,
    "longitude": 19.0333,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-14",
    "wellName": "Decs",
    "wellCode": "#658",
    "county": "Tolna",
    "cityName": "Decs",
    "latitude": 46.3833,
    "longitude": 18.7167,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "uuid-well-15",
    "wellName": "Báta",
    "wellCode": "#660",
    "county": "Tolna",
    "cityName": "Báta",
    "latitude": 46.2000,
    "longitude": 18.7833,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  }
]
```

### Térkép Adatok

#### Talajvízszint Térkép (HUGEO)
```json
{
  "mapType": "groundwater",
  "source": "HUGEO talajvíz",
  "timestamp": "2025-10-24",
  "wells": [
    {
      "wellId": "uuid-well-1",
      "wellCode": "#4576",
      "name": "Sátorhely",
      "latitude": 46.3333,
      "longitude": 19.3667,
      "waterLevel": null,
      "status": "unknown",
      "color": "#CCCCCC"
    }
    // További kutak...
  ]
}
```

#### Aszálymonitoring Térkép
```json
{
  "mapType": "drought_monitoring",
  "source": "OVF aszálymonitoring",
  "timestamp": "2025-10-24",
  "selectedParameter": "droughtIndex",
  "parameters": [
    {
      "id": "droughtIndex",
      "name": "Aszályindex (HDI)",
      "unit": "/10"
    },
    {
      "id": "soilMoisture",
      "name": "Talajnedvesség",
      "unit": "%"
    }
  ],
  "locations": [
    {
      "locationId": "uuid-loc-1",
      "name": "Katymár",
      "latitude": 46.2167,
      "longitude": 19.5667,
      "droughtIndex": null,
      "category": "unknown",
      "color": "#CCCCCC"
    }
    // További helyszínek...
  ],
  "legend": [
    { "category": "Alacsony aszály", "color": "#90EE90" },
    { "category": "Mérsékelt", "color": "#FFFFE0" },
    { "category": "Közepes", "color": "#FFD700" },
    { "category": "Magas", "color": "#FFA500" },
    { "category": "Extrém", "color": "#FF4500" }
  ]
}
```

#### Vízhiány Térkép (OVF)
```json
{
  "mapType": "water_deficit",
  "source": "OVF",
  "timestamp": "2025-10-24",
  "displayType": "heatmap",
  "data": [
    {
      "latitude": 46.2167,
      "longitude": 19.5667,
      "waterDeficit": null,
      "intensity": 0
    }
    // További pontok...
  ],
  "legend": [
    { "label": "Alacsony hiány", "color": "#90EE90", "range": "0-30 mm" },
    { "label": "Közepes", "color": "#FFFFE0", "range": "30-60 mm" },
    { "label": "Közepes", "color": "#FFD700", "range": "60-90 mm" },
    { "label": "Magas", "color": "#FFA500", "range": "90-120 mm" },
    { "label": "Nagyon magas", "color": "#FF4500", "range": "120+ mm" }
  ]
}
```

---

## 🔄 API Response Struktúrák

### Sikeres Response
```json
{
  "success": true,
  "timestamp": "2025-10-24T14:31:21Z",
  "data": {
    // Modul-specifikus adatok
  },
  "metadata": {
    "source": "OMSZ / VízÜgy / HUGEO / OVF",
    "cacheHit": false,
    "processingTime": 145
  }
}
```

### Hiba Response
```json
{
  "success": false,
  "timestamp": "2025-10-24T14:31:21Z",
  "error": {
    "code": "DATA_UNAVAILABLE",
    "message": "Az adatok jelenleg nem érhetők el",
    "details": "API timeout after 10 seconds"
  }
}
```

### N/A Adat (Üres Adat)
```json
{
  "value": null,
  "available": false,
  "message": "N/A",
  "reason": "Data not yet collected"
}
```

---

## 📝 Adatfrissítési Logika

### Meteorológia
```typescript
// Frissítési stratégia
const METEO_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 óra
const METEO_CACHE_TTL = 60 * 60; // 1 óra

// Edge Function trigger
// Cron: "0 * * * *" (óránként a 0. percben)
```

### Vízállás
```typescript
// Frissítési stratégia
const WATER_REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 óra
const WATER_CACHE_TTL = 6 * 60 * 60; // 6 óra

// Edge Function trigger
// Cron: "0 */6 * * *" (6 óránként)
```

### Aszály
```typescript
// Frissítési stratégia
const DROUGHT_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 óra
const DROUGHT_CACHE_TTL = 24 * 60 * 60; // 24 óra

// Edge Function trigger
// Cron: "0 2 * * *" (naponta 2:00-kor)
```

---

## 🎯 Frontend State Management (Example)

### Meteorológia State
```typescript
interface MeteorologyState {
  selectedCity: string | null;
  cities: City[];
  currentData: MeteorologyData | null;
  forecast3Day: Forecast3Day | null;
  forecast6Hour: Forecast6Hour | null;
  radarImage: string | null;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}
```

### Vízállás State
```typescript
interface WaterLevelState {
  selectedStation: string | null;
  stations: WaterStation[];
  currentData: WaterLevelData | null;
  forecastData: WaterForecast[];
  comparisonStations: string[]; // ["szekszard", "passau", "nagybajcs"]
  supplementaryData: SupplementaryStation[];
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}
```

### Aszály State
```typescript
interface DroughtState {
  // Monitoring adatok
  selectedLocation: string | null;
  locations: DroughtLocation[];
  
  // Talajvízkút adatok (KÜLÖN!)
  selectedWell: string | null;
  wells: GroundwaterWell[];
  
  // Adatok
  droughtData: DroughtData | null;
  groundwaterData: GroundwaterData | null;
  
  // Térképek
  groundwaterMapData: MapData | null;
  droughtMonitoringMapData: MapData | null;
  waterDeficitMapData: MapData | null;
  selectedMapParameter: string; // "droughtIndex" default
  
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}
```

---

*Adat Struktúra Dokumentáció v1.0 - 2025-10-24*
*Referencia: DunApp működő prototípus képek alapján*

---

## 🌧️ Mért csapadék-összesítés (`precipitation_measured_summary`)

```ts
interface PrecipitationMeasured {
  cityId: string;
  last7Days: number | null;      // null = az ablakban egy napra sincs adat (nem 0 mm)
  last30Days: number | null;
  yearToDate: number | null;     // mindig az adott év jan. 1-jétől
  daysAvailable7: number;
  daysAvailable30: number;
  daysMeasuredYtd: number;       // mért vagy interpolált napok
  daysModeledYtd: number;        // Open-Meteo-val pótolt napok (backfill rés)
  daysExpectedYtd: number;       // jan. 1-től dataThrough-ig
  dataThrough: string;           // YYYY-MM-DD, az utolsó mérési nap
  method: 'station' | 'idw';     // station: ≤10 km-es állomás; idw: 2–4 állomás ≤30 km
  stations: { id: string; name: string; km: number | null }[];
  nearestKm: number | null;
  updatedAt: string;
}
```
