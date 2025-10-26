# Települések és Helyszínek - Teljes Lista

## 🌤️ Meteorológiai Városok (4 db)

| Sorszám | Név | Megye | Latitude | Longitude |
|---------|-----|-------|----------|-----------|
| 1 | Szekszárd | Tolna | 46.3481 | 18.7097 |
| 2 | Baja | Bács-Kiskun | 46.1811 | 18.9550 |
| 3 | Dunaszekcső | Baranya | 46.0833 | 18.7667 |
| 4 | Mohács | Baranya | 45.9928 | 18.6836 |

### JSON Formátum (meteorology_cities)
```json
[
  {
    "id": "meteo-city-1",
    "name": "Szekszárd",
    "county": "Tolna",
    "latitude": 46.3481,
    "longitude": 18.7097,
    "population": 32833,
    "isActive": true
  },
  {
    "id": "meteo-city-2",
    "name": "Baja",
    "county": "Bács-Kiskun",
    "latitude": 46.1811,
    "longitude": 18.9550,
    "population": 35989,
    "isActive": true
  },
  {
    "id": "meteo-city-3",
    "name": "Dunaszekcső",
    "county": "Baranya",
    "latitude": 46.0833,
    "longitude": 18.7667,
    "population": 2453,
    "isActive": true
  },
  {
    "id": "meteo-city-4",
    "name": "Mohács",
    "county": "Baranya",
    "latitude": 45.9928,
    "longitude": 18.6836,
    "population": 18486,
    "isActive": true
  }
]
```

---

## 💧 Vízállás Állomások (3 db)

| Sorszám | Állomás Név | Folyó | Város | Latitude | Longitude | LNV | KKV | NV |
|---------|-------------|-------|-------|----------|-----------|-----|-----|-----|
| 1 | Baja | Duna | Baja | 46.1811 | 18.9550 | 150 | 300 | 750 |
| 2 | Mohács | Duna | Mohács | 45.9928 | 18.6836 | 120 | 280 | 700 |
| 3 | Nagybajcs | Duna | Nagybajcs | 47.9025 | 17.9619 | 250 | 450 | 900 |

**Megjegyzés:** LNV, KKV, NV értékek becsült/példa értékek. Valós adatokra cserélendő az API/scraping során.

### JSON Formátum (water_level_stations)
```json
[
  {
    "id": "water-station-1",
    "stationName": "Baja",
    "riverName": "Duna",
    "cityName": "Baja",
    "latitude": 46.1811,
    "longitude": 18.9550,
    "lnvLevel": 150,
    "kkvLevel": 300,
    "nvLevel": 750,
    "isActive": true,
    "displayInComparison": true
  },
  {
    "id": "water-station-2",
    "stationName": "Mohács",
    "riverName": "Duna",
    "cityName": "Mohács",
    "latitude": 45.9928,
    "longitude": 18.6836,
    "lnvLevel": 120,
    "kkvLevel": 280,
    "nvLevel": 700,
    "isActive": true,
    "displayInComparison": true
  },
  {
    "id": "water-station-3",
    "stationName": "Nagybajcs",
    "riverName": "Duna",
    "cityName": "Nagybajcs",
    "latitude": 47.9025,
    "longitude": 17.9619,
    "lnvLevel": 250,
    "kkvLevel": 450,
    "nvLevel": 900,
    "isActive": true,
    "displayInComparison": true
  }
]
```

---

## 🏜️ Aszály Monitoring Helyszínek (5 db)

| Sorszám | Helyszín Név | Megye | Latitude | Longitude | Típus |
|---------|--------------|-------|----------|-----------|-------|
| 1 | Katymár | Bács-Kiskun | 46.2167 | 19.5667 | monitoring_station |
| 2 | Dávod | Tolna | 46.4167 | 18.7667 | monitoring_station |
| 3 | Szederkény | Bács-Kiskun | 46.3833 | 19.2500 | monitoring_station |
| 4 | Sükösd | Bács-Kiskun | 46.2833 | 19.0000 | monitoring_station |
| 5 | Csávoly | Bács-Kiskun | 46.4500 | 19.2833 | monitoring_station |

### JSON Formátum (drought_locations)
```json
[
  {
    "id": "drought-loc-1",
    "locationName": "Katymár",
    "locationType": "monitoring_station",
    "county": "Bács-Kiskun",
    "latitude": 46.2167,
    "longitude": 19.5667,
    "isActive": true
  },
  {
    "id": "drought-loc-2",
    "locationName": "Dávod",
    "locationType": "monitoring_station",
    "county": "Tolna",
    "latitude": 46.4167,
    "longitude": 18.7667,
    "isActive": true
  },
  {
    "id": "drought-loc-3",
    "locationName": "Szederkény",
    "locationType": "monitoring_station",
    "county": "Bács-Kiskun",
    "latitude": 46.3833,
    "longitude": 19.2500,
    "isActive": true
  },
  {
    "id": "drought-loc-4",
    "locationName": "Sükösd",
    "locationType": "monitoring_station",
    "county": "Bács-Kiskun",
    "latitude": 46.2833,
    "longitude": 19.0000,
    "isActive": true
  },
  {
    "id": "drought-loc-5",
    "locationName": "Csávoly",
    "locationType": "monitoring_station",
    "county": "Bács-Kiskun",
    "latitude": 46.4500,
    "longitude": 19.2833,
    "isActive": true
  }
]
```

---

## 🚰 Talajvízkutak (15 db)

| Sorszám | Kút Név | Kód | Megye | Város | Latitude | Longitude |
|---------|---------|-----|-------|-------|----------|-----------|
| 1 | Sátorhely | 4576 | Bács-Kiskun | Sátorhely | 46.3333 | 19.3667 |
| 2 | Mohács | 1460 | Baranya | Mohács | 45.9928 | 18.6836 |
| 3 | Hercegszántó | 1450 | Bács-Kiskun | Hercegszántó | 46.1833 | 19.0167 |
| 4 | Alsónyék | 662 | Tolna | Alsónyék | 46.2667 | 18.5667 |
| 5 | Szekszárd-Borrév | 656 | Tolna | Szekszárd | 46.3481 | 18.7097 |
| 6 | Mohács II. | 912 | Baranya | Mohács | 45.9928 | 18.6836 |
| 7 | Mohács-Sárhát | 4481 | Baranya | Mohács | 45.9928 | 18.6836 |
| 8 | Nagybaracska | 4479 | Bács-Kiskun | Nagybaracska | 46.1333 | 18.9833 |
| 9 | Érsekcsanád | 1426 | Bács-Kiskun | Érsekcsanád | 46.2833 | 19.4167 |
| 10 | Őcsény | 653 | Tolna | Őcsény | 46.3167 | 18.6667 |
| 11 | Kölked | 1461 | Baranya | Kölked | 46.0167 | 18.7500 |
| 12 | Dávod | 448 | Tolna | Dávod | 46.4167 | 18.7667 |
| 13 | Szeremle | 132042 | Bács-Kiskun | Szeremle | 46.5500 | 19.0333 |
| 14 | Decs | 658 | Tolna | Decs | 46.3833 | 18.7167 |
| 15 | Báta | 660 | Tolna | Báta | 46.2000 | 18.7833 |

### JSON Formátum (groundwater_wells)
```json
[
  {
    "id": "well-1",
    "wellName": "Sátorhely",
    "wellCode": "4576",
    "county": "Bács-Kiskun",
    "cityName": "Sátorhely",
    "latitude": 46.3333,
    "longitude": 19.3667,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-2",
    "wellName": "Mohács",
    "wellCode": "1460",
    "county": "Baranya",
    "cityName": "Mohács",
    "latitude": 45.9928,
    "longitude": 18.6836,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-3",
    "wellName": "Hercegszántó",
    "wellCode": "1450",
    "county": "Bács-Kiskun",
    "cityName": "Hercegszántó",
    "latitude": 46.1833,
    "longitude": 19.0167,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-4",
    "wellName": "Alsónyék",
    "wellCode": "662",
    "county": "Tolna",
    "cityName": "Alsónyék",
    "latitude": 46.2667,
    "longitude": 18.5667,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-5",
    "wellName": "Szekszárd-Borrév",
    "wellCode": "656",
    "county": "Tolna",
    "cityName": "Szekszárd",
    "latitude": 46.3481,
    "longitude": 18.7097,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-6",
    "wellName": "Mohács II.",
    "wellCode": "912",
    "county": "Baranya",
    "cityName": "Mohács",
    "latitude": 45.9928,
    "longitude": 18.6836,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-7",
    "wellName": "Mohács-Sárhát",
    "wellCode": "4481",
    "county": "Baranya",
    "cityName": "Mohács",
    "latitude": 45.9928,
    "longitude": 18.6836,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-8",
    "wellName": "Nagybaracska",
    "wellCode": "4479",
    "county": "Bács-Kiskun",
    "cityName": "Nagybaracska",
    "latitude": 46.1333,
    "longitude": 18.9833,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-9",
    "wellName": "Érsekcsanád",
    "wellCode": "1426",
    "county": "Bács-Kiskun",
    "cityName": "Érsekcsanád",
    "latitude": 46.2833,
    "longitude": 19.4167,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-10",
    "wellName": "Őcsény",
    "wellCode": "653",
    "county": "Tolna",
    "cityName": "Őcsény",
    "latitude": 46.3167,
    "longitude": 18.6667,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-11",
    "wellName": "Kölked",
    "wellCode": "1461",
    "county": "Baranya",
    "cityName": "Kölked",
    "latitude": 46.0167,
    "longitude": 18.7500,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-12",
    "wellName": "Dávod",
    "wellCode": "448",
    "county": "Tolna",
    "cityName": "Dávod",
    "latitude": 46.4167,
    "longitude": 18.7667,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-13",
    "wellName": "Szeremle",
    "wellCode": "132042",
    "county": "Bács-Kiskun",
    "cityName": "Szeremle",
    "latitude": 46.5500,
    "longitude": 19.0333,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-14",
    "wellName": "Decs",
    "wellCode": "658",
    "county": "Tolna",
    "cityName": "Decs",
    "latitude": 46.3833,
    "longitude": 18.7167,
    "depthMeters": null,
    "wellType": "monitoring",
    "isActive": true
  },
  {
    "id": "well-15",
    "wellName": "Báta",
    "wellCode": "660",
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

---

## 📊 Összesítés

| Modul | Típus | Darabszám | Megjegyzés |
|-------|-------|-----------|------------|
| Meteorológia | Városok | 4 | Szekszárd, Baja, Dunaszekcső, Mohács |
| Vízállás | Állomások | 3 | Baja, Mohács, Nagybajcs |
| Aszály | Monitoring helyszínek | 5 | Katymár, Dávod, Szederkény, Sükösd, Csávoly |
| Aszály | Talajvízkutak | 15 | Különböző településeken |
| **ÖSSZESEN** | | **27 helyszín** | |

---

## 🗺️ Térkép Nézet - Bounding Box

Magyarország déli része (Duna menti települések):

```javascript
const MAP_BOUNDS = {
  north: 47.95,  // Nagybajcs környéke
  south: 45.95,  // Mohács környéke
  west: 17.90,   // Nyugati határ
  east: 19.60    // Keleti határ
};

const MAP_CENTER = {
  latitude: 46.45,
  longitude: 18.85
};

const DEFAULT_ZOOM = 9;
```

---

## 🔄 SQL Insert Scriptek

### Meteorológiai városok beszúrása
```sql
INSERT INTO meteorology_cities (name, county, latitude, longitude, population, is_active) VALUES
('Szekszárd', 'Tolna', 46.3481, 18.7097, 32833, true),
('Baja', 'Bács-Kiskun', 46.1811, 18.9550, 35989, true),
('Dunaszekcső', 'Baranya', 46.0833, 18.7667, 2453, true),
('Mohács', 'Baranya', 45.9928, 18.6836, 18486, true);
```

### Vízállás állomások beszúrása
```sql
INSERT INTO water_level_stations (station_name, river_name, city_name, latitude, longitude, lnv_level, kkv_level, nv_level, is_active) VALUES
('Baja', 'Duna', 'Baja', 46.1811, 18.9550, 150, 300, 750, true),
('Mohács', 'Duna', 'Mohács', 45.9928, 18.6836, 120, 280, 700, true),
('Nagybajcs', 'Duna', 'Nagybajcs', 47.9025, 17.9619, 250, 450, 900, true);
```

### Aszály helyszínek beszúrása
```sql
INSERT INTO drought_locations (location_name, location_type, county, latitude, longitude, is_active) VALUES
('Katymár', 'monitoring_station', 'Bács-Kiskun', 46.2167, 19.5667, true),
('Dávod', 'monitoring_station', 'Tolna', 46.4167, 18.7667, true),
('Szederkény', 'monitoring_station', 'Bács-Kiskun', 46.3833, 19.2500, true),
('Sükösd', 'monitoring_station', 'Bács-Kiskun', 46.2833, 19.0000, true),
('Csávoly', 'monitoring_station', 'Bács-Kiskun', 46.4500, 19.2833, true);
```

### Talajvízkutak beszúrása
```sql
INSERT INTO groundwater_wells (well_name, well_code, county, city_name, latitude, longitude, well_type, is_active) VALUES
('Sátorhely', '4576', 'Bács-Kiskun', 'Sátorhely', 46.3333, 19.3667, 'monitoring', true),
('Mohács', '1460', 'Baranya', 'Mohács', 45.9928, 18.6836, 'monitoring', true),
('Hercegszántó', '1450', 'Bács-Kiskun', 'Hercegszántó', 46.1833, 19.0167, 'monitoring', true),
('Alsónyék', '662', 'Tolna', 'Alsónyék', 46.2667, 18.5667, 'monitoring', true),
('Szekszárd-Borrév', '656', 'Tolna', 'Szekszárd', 46.3481, 18.7097, 'monitoring', true),
('Mohács II.', '912', 'Baranya', 'Mohács', 45.9928, 18.6836, 'monitoring', true),
('Mohács-Sárhát', '4481', 'Baranya', 'Mohács', 45.9928, 18.6836, 'monitoring', true),
('Nagybaracska', '4479', 'Bács-Kiskun', 'Nagybaracska', 46.1333, 18.9833, 'monitoring', true),
('Érsekcsanád', '1426', 'Bács-Kiskun', 'Érsekcsanád', 46.2833, 19.4167, 'monitoring', true),
('Őcsény', '653', 'Tolna', 'Őcsény', 46.3167, 18.6667, 'monitoring', true),
('Kölked', '1461', 'Baranya', 'Kölked', 46.0167, 18.7500, 'monitoring', true),
('Dávod', '448', 'Tolna', 'Dávod', 46.4167, 18.7667, 'monitoring', true),
('Szeremle', '132042', 'Bács-Kiskun', 'Szeremle', 46.5500, 19.0333, 'monitoring', true),
('Decs', '658', 'Tolna', 'Decs', 46.3833, 18.7167, 'monitoring', true),
('Báta', '660', 'Tolna', 'Báta', 46.2000, 18.7833, 'monitoring', true);
```

---

*Települések és Helyszínek Dokumentáció v1.0 - 2025-10-24*
*Forrás: Projekt specifikáció - végleges lista*
