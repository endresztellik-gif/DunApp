# Meteorológiai PWA Project - Részletes Project Summary

## 📋 Projekt Áttekintés

### Cél
Egy Progressive Web Application (PWA) fejlesztése, amely három fő modulon keresztül jeleníti meg időjárási, vízállási és aszály-monitoring adatokat magyar települések számára.

### Technológiai Stack
- **Frontend**: React 18+ with TypeScript
- **State Management**: React Context API / Zustand
- **Styling**: Tailwind CSS
- **Charts**: Recharts / Chart.js
- **Maps**: Leaflet / React-Leaflet (térképes megjelenítéshez)
- **PWA**: Workbox
- **Database**: Supabase (PostgreSQL)
- **Backend Logic**: Supabase Edge Functions (Deno)
- **Deployment**: Netlify
- **Version Control**: GitHub
- **Package Manager**: npm/pnpm

---

## 🏗️ Projekt Architektúra

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (PWA)                       │
│  ┌──────────────┬──────────────┬──────────────┐       │
│  │ Meteorológia │   Vízállás   │    Aszály    │       │
│  │    Modul     │    Modul     │    Modul     │       │
│  │      │       │      │       │      │       │       │
│  │  [🏙️ Város]  │  [🌊 Állomás] │  [📍 Hely]  │       │
│  └──────┬───────┴──────┬───────┴──────┬───────┘       │
│         │              │              │                 │
│         └──────────────┴──────────────┘                 │
│                         │                                │
└───────────────────────────┼──────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │   API Layer           │
                │  ┌──────┬──────────┐  │
                │  │ REST │ GraphQL  │  │
                │  └──────┴──────────┘  │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  Supabase DB   │  │  External   │  │  Web Scraping   │
│  (PostgreSQL)  │  │    APIs     │  │    Service      │
└────────────────┘  └─────────────┘  └─────────────────┘
```

### Modul Struktúra

```
src/
├── modules/
│   ├── meteorology/
│   │   ├── components/
│   │   │   ├── CitySelector/
│   │   │   ├── DataCards/
│   │   │   └── Charts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── data/
│   │       └── cities.ts (meteorológiai városok)
│   ├── water-level/
│   │   ├── components/
│   │   │   ├── StationSelector/
│   │   │   ├── DataCards/
│   │   │   └── Charts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── data/
│   │       └── stations.ts (vízállomások)
│   └── drought/
│       ├── components/
│       │   ├── LocationSelector/
│       │   ├── DataCards/
│       │   ├── Maps/
│       │   │   ├── GroundwaterMap/
│       │   │   ├── DroughtMonitoringMap/
│       │   │   └── WaterDeficitMap/
│       │   └── Charts/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── data/
│           ├── locations.ts (aszály monitoring helyszínek)
│           └── groundwater-wells.ts (talajvízkutak)
├── shared/
│   ├── components/
│   │   ├── Layout/
│   │   ├── BaseSelector/ (közös select komponens alap)
│   │   ├── Chart/
│   │   ├── Map/
│   │   └── Loading/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── constants/
├── services/
│   ├── supabase/
│   ├── api/
│   └── cache/
├── store/
├── styles/
└── App.tsx
```

---

## 📦 Modulok Részletes Leírása

### 1. Meteorológiai Modul
**Megjelenítendő adatok:**
- Hőmérséklet (aktuális) - pl. 15.3°C
- Csapadék (mennyiség) - pl. 26.2 mm
- Szélsebesség - pl. 4.1 km/h
- Légnyomás - pl. 1013 hPa
- Páratartalom - pl. 65%
- Szélirány - pl. Ny (270°)
- 3 napos előrejelzés
- Időjárás előrejelzés (6 órás bontás)
- Élő radarkép (RainViewer)

**Grafikonok:**
- Hőmérséklet trend (vonaldiagram)
- Csapadék előrejelzés
- Kombinált grafikon (hőmérséklet + csapadék, 6 órás bontás)

**Adatforrások:**
- API: OMSZ (Országos Meteorológiai Szolgálat)
- Radarkép: RainViewer API
- Frissítési gyakoriság: óránként
- Cache stratégia: 1 óra

**Település kezelés:**
- Modul-specifikus városválasztó
- **Városok (4 db):**
  - Szekszárd
  - Baja
  - Dunaszekcső
  - Mohács
- Dropdown jobb felső sarokban
- **Radarkép**: Magyarországi radarkép (RainViewer API)

### 2. Vízállás Modul
**Megjelenítendő adatok:**
- Aktuális vízállás (cm) - pl. 394 cm
- Vízhozam (m³/s) - pl. 2416 m³/s
- Vízhőmérséklet (°C) - pl. 23°C
- Vízállás változás trendje
- Előrejelzés (5 nap)
- Több állomás összehasonlítása

**Push Értesítések (Mohács állomás):**
- **Trigger**: Amikor Mohács vízállása >= 400 cm
- **Üzenet**: "A mai vízállás lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!"
- **Gyakoriság**: 6 óránként ellenőrzés (cron job)
- **Beállítások**: Felhasználó be/ki kapcsolhatja az értesítéseket
- **PWA funkció**: Service Worker + Web Push API

**Példa állomások:**
- Baja
- Mohács (értesítések itt)
- Nagybajcs

**Megjegyzés**: A három állomás előrejelzési adatai és grafikonjai szerepelnek összehasonlító nézetben.

**Grafikonok:**
- Vízállás idősor (vonaldiagram) - 5 napos
- Több állomás összehasonlító grafikon (szaggatott vonalak)
- Adattábla konkrét értékekkel állomásonként

**Kiegészítő adatok szekció:**
- Felső vízgyűjtő állomások adatai
- Segít az árvíz előrejelzésben és vízgazdálkodás tervezésében

**Adatforrások:**
- API/Scraping: VízÜgy Data Portal
- Frissítési gyakoriság: naponta 4x (6 óránként)
- Cache stratégia: 6 óra

**Település/Állomás kezelés:**
- Modul-specifikus állomásválasztó
- Állomások földrajzi adatokkal
- Kritikus szintek (LNV, KKV, NV) csak numerikus megjelenítése

### 3. Aszály Modul
**Megjelenítendő adatok:**
- Aszály index (pl. PDSI, SPI)
- Talajnedvesség (%)
- Vízhiány értékek (mm)
- Talajvízszint adatok (külön részmodul)

**Adatkártyák (választható legördülő menüvel):**
1. **Aszályindex kártya** - Helyszín választó dropdown
2. **Talajnedvesség kártya** - Helyszín választó dropdown  
3. **Vízhiány kártya** - Helyszín választó dropdown
4. **Talajvízszint kártya** - Kút választó dropdown (eltérő helyszínek!)

**Térképek (3 db):**
1. **Aktuális talajvízszint térkép (HUGEO)**
   - Kutak földrajzi elhelyezkedése
   - Színkódolt markerek vízszint szerint
   - Klikkeléskor részletes kút adatok

2. **Aszálymonitoring térkép**
   - Monitoring állomások
   - Paraméter választó dropdown (Aszályindex választható)
   - Aszályindex vizualizáció
   - Kategória szerinti színkódolás:
     - Alacsony aszály
     - Mérsékelt
     - Közepes
     - Magas
     - Extrém

3. **Vízhiány térkép (OVF)**
   - Vízhiány monitoring pontok
   - Heatmap vagy choropleth megjelenítés
   - Területi eloszlás vizualizáció
   - Színskála: Zöld → Sárga → Narancs → Piros

**Talajvízkutak Monitoring (15 kút példa):**
Választható kutak 60 napos előzmények megtekintéséhez.

Kutak listája:
- Sátorhely (#4576)
- Mohács (#1460)
- Hercegszántó (#1450)
- Alsónyék (#662)
- Szekszárd-Borrév (#656)
- Mohács II. (#912)
- Mohács-Sárhát (#4481)
- Nagybaracska (#4479)
- Érsekcsanád (#1426)
- Öcsény (#653)
- Kölked (#1461)
- Dávod (#448)
- Szeremle (#132042)
- Decs (#658)
- Báta (#660)

**Grafikonok:**
- Aszály index idősor (választott helyszínre)
- Talajnedvesség trend
- Vízhiány kumulatív grafikon
- Talajvízszint idősor (választott kútra, 60 napos)
- Összehasonlító grafikonok (több helyszín/kút)

**Adatforrások:**
- HUGEO (talajvíz adatok)
- OVF (aszálymonitoring, vízhiány)
- VízÜgy Data Portal (kutak)
- Frissítési gyakoriság: hetente
- Cache stratégia: 24 óra

**Helyszín kezelés (2 külön típus):**
1. **Aszály monitoring helyszínek (5 db)** (aszályindex, talajnedvesség, vízhiány)
   - Katymár
   - Dávod
   - Szederkény
   - Sükösd
   - Csávoly
   - Saját helyszínlista
   - Legördülő választó minden adatkártyán
   
2. **Talajvízkutak (15 db)** (talajvízszint)
   - Sátorhely (#4576)
   - Mohács (#1460)
   - Hercegszántó (#1450)
   - Alsónyék (#662)
   - Szekszárd-Borrév (#656)
   - Mohács II. (#912)
   - Mohács-Sárhát (#4481)
   - Nagybaracska (#4479)
   - Érsekcsanád (#1426)
   - Őcsény (#653)
   - Kölked (#1461)
   - Dávod (#448)
   - Szeremle (#132042)
   - Decs (#658)
   - Báta (#660)
   - Külön kutlista
   - Saját legördülő választó
   - Kút-specifikus adatok (mélység, típus, kód)
   - 60 napos előzmények

---

## 🗄️ Adatbázis Terv (Supabase)

### Táblák

#### 1. `meteorology_cities`
```sql
CREATE TABLE meteorology_cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  county VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `water_level_stations`
```sql
CREATE TABLE water_level_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_name VARCHAR(100) NOT NULL UNIQUE,
  river_name VARCHAR(100),
  city_name VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  lnv_level INTEGER, -- Legkisebb Napi Vízállás
  kkv_level INTEGER, -- Kisvízi Középvízállás
  nv_level INTEGER,  -- Nagyvízi Vízállás
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `drought_locations`
```sql
CREATE TABLE drought_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_name VARCHAR(100) NOT NULL UNIQUE,
  location_type VARCHAR(50), -- 'monitoring_station', 'measurement_point'
  county VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `groundwater_wells`
```sql
CREATE TABLE groundwater_wells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  well_name VARCHAR(100) NOT NULL,
  well_code VARCHAR(50) UNIQUE,
  county VARCHAR(50),
  city_name VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  depth_meters DECIMAL(6, 2),
  well_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. `meteorology_data`
```sql
CREATE TABLE meteorology_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES meteorology_cities(id),
  timestamp TIMESTAMP NOT NULL,
  temperature DECIMAL(4, 2),
  temperature_min DECIMAL(4, 2),
  temperature_max DECIMAL(4, 2),
  precipitation DECIMAL(5, 2),
  humidity INTEGER,
  pressure DECIMAL(6, 2),
  wind_speed DECIMAL(4, 2),
  wind_direction INTEGER,
  uv_index INTEGER,
  forecast_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(city_id, timestamp)
);
```

#### 6. `water_level_data`
```sql
CREATE TABLE water_level_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID REFERENCES water_level_stations(id),
  timestamp TIMESTAMP NOT NULL,
  water_level INTEGER, -- cm-ben
  trend VARCHAR(20), -- 'rising', 'falling', 'stable'
  forecast_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(station_id, timestamp)
);
```

#### 7. `drought_data`
```sql
CREATE TABLE drought_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES drought_locations(id),
  date DATE NOT NULL,
  drought_index DECIMAL(5, 2),
  drought_category VARCHAR(30), -- 'enyhe', 'közepes', 'súlyos', 'extrém'
  soil_moisture DECIMAL(5, 2),
  water_deficit DECIMAL(6, 2), -- vízhiány mm-ben
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(location_id, date)
);
```

#### 8. `groundwater_data`
```sql
CREATE TABLE groundwater_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  well_id UUID REFERENCES groundwater_wells(id),
  measurement_date DATE NOT NULL,
  water_level_meters DECIMAL(6, 3), -- talajfelszín alatti mélység méterben
  water_level_masl DECIMAL(8, 3), -- tengerszint feletti vízszint
  temperature DECIMAL(4, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(well_id, measurement_date)
);
```

#### 9. `data_sources`
```sql
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_type VARCHAR(30) NOT NULL,
  source_name VARCHAR(100),
  source_type VARCHAR(20), -- 'api' or 'scraping'
  endpoint_url TEXT,
  api_key_required BOOLEAN DEFAULT false,
  last_fetch TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 10. `fetch_logs`
```sql
CREATE TABLE fetch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES data_sources(id),
  status VARCHAR(20),
  records_fetched INTEGER,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexek és Optimalizáció
```sql
-- Indexek a gyorsabb kereséshez
CREATE INDEX idx_meteorology_cities_name ON meteorology_cities(name);
CREATE INDEX idx_water_stations_name ON water_level_stations(station_name);
CREATE INDEX idx_drought_locations_name ON drought_locations(location_name);
CREATE INDEX idx_groundwater_wells_code ON groundwater_wells(well_code);

CREATE INDEX idx_meteorology_city_timestamp ON meteorology_data(city_id, timestamp DESC);
CREATE INDEX idx_water_level_station_timestamp ON water_level_data(station_id, timestamp DESC);
CREATE INDEX idx_drought_location_date ON drought_data(location_id, date DESC);
CREATE INDEX idx_groundwater_well_date ON groundwater_data(well_id, measurement_date DESC);

-- Spatial indexek térképes megjelenítéshez
CREATE INDEX idx_meteorology_cities_location ON meteorology_cities USING GIST (
  point(longitude, latitude)
);
CREATE INDEX idx_water_stations_location ON water_level_stations USING GIST (
  point(longitude, latitude)
);
CREATE INDEX idx_drought_locations_location ON drought_locations USING GIST (
  point(longitude, latitude)
);
CREATE INDEX idx_groundwater_wells_location ON groundwater_wells USING GIST (
  point(longitude, latitude)
);

-- Row Level Security (RLS) policies
ALTER TABLE meteorology_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_level_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE drought_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwater_data ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Enable read access for all users" ON meteorology_data
  FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON water_level_data
  FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON drought_data
  FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON groundwater_data
  FOR SELECT USING (true);
```

---

## 🔌 API Integráció és Data Fetching

### Stratégia

#### 1. Supabase Edge Functions
Minden adatforráshoz egy dedikált Edge Function:

**`/functions/fetch-meteorology/`**
```typescript
// Cron job: óránként
// Felelősség: API hívás + adatok mentése
```

**`/functions/fetch-water-level/`**
```typescript
// Cron job: 6 óránként
// Felelősség: Scraping/API + adatok mentése
```

**`/functions/fetch-drought/`**
```typescript
// Cron job: naponta
// Felelősség: API hívás + adatok mentése
```

#### 2. Frontend API Service
```typescript
// services/api/meteorology.service.ts
export class MeteorologyService {
  async getCities() {
    // Meteorológiai városok listája
  }
  
  async getCityData(cityId: string, range: DateRange) {
    // Supabase query
  }
  
  async getLatestForecast(cityId: string) {
    // Cached response
  }
}

// services/api/water-level.service.ts
export class WaterLevelService {
  async getStations() {
    // Vízállomások listája
  }
  
  async getStationData(stationId: string, range: DateRange) {
    // Supabase query
  }
}

// services/api/drought.service.ts
export class DroughtService {
  async getLocations() {
    // Aszály monitoring helyszínek
  }
  
  async getGroundwaterWells() {
    // Talajvízkutak listája (külön!)
  }
  
  async getLocationData(locationId: string, range: DateRange) {
    // Aszály adatok
  }
  
  async getGroundwaterData(wellId: string, range: DateRange) {
    // Talajvíz adatok
  }
  
  async getMapData(mapType: 'groundwater' | 'drought' | 'deficit') {
    // Térkép adatok összes pontra
  }
}
```

### Caching Stratégia
- **Browser Cache**: Service Worker + IndexedDB
- **Server Cache**: Supabase functions result caching
- **CDN**: Netlify edge caching for static assets

---

## 🎨 UI/UX Tervezés

### Layout Structure

**Általános elrendezés (minden modul):**
```
┌─────────────────────────────────────────┐
│           Header (App Title)            │
├─────────────────────────────────────────┤
│  📊 Meteorológia | 🌊 Vízállás | 🏜️ Aszály │
├─────────────────────────────────────────┤
│                                         │
│         Aktív Modul Tartalma            │
│                                         │
└─────────────────────────────────────────┘
```

**Meteorológia modul:**
```
┌─────────────────────────────────────────┐
│  🏙️ [Város választó dropdown]          │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │   Aktuális Adatok Kártyák       │   │
│  │  (hőm, csapadék, szél, stb.)    │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │      Interaktív Grafikonok      │   │
│  │  (hőm trend, csapadék, stb.)    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Vízállás modul:**
```
┌─────────────────────────────────────────┐
│  🌊 [Állomás választó dropdown]         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │   Aktuális Vízállás Kártyák     │   │
│  │  (szintek, trend, figyelmeztetés)│  │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │      Vízállás Grafikonok        │   │
│  │  (idősor, átlagok, előrejelzés) │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Aszály modul (speciális elrendezés):**
```
┌─────────────────────────────────────────┐
│  📊 ADATKÁRTYÁK SZEKCIÓ                 │
│  ┌─────────────────────────────────┐   │
│  │ 🏜️ Aszályindex                  │   │
│  │    [Helyszín választó ▼]        │   │
│  │    Érték: 2.3 (Közepes aszály)  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 💧 Talajnedvesség               │   │
│  │    [Helyszín választó ▼]        │   │
│  │    Érték: 45% (Átlag alatti)    │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🌡️ Vízhiány                     │   │
│  │    [Helyszín választó ▼]        │   │
│  │    Érték: 120mm (Jelentős hiány)│   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🚰 Talajvízszint                │   │
│  │    [Kút választó ▼]             │   │
│  │    Szint: -8.5m (Átlag alatti)  │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  🗺️ TÉRKÉPEK SZEKCIÓ                   │
│  ┌─────────────────────────────────┐   │
│  │  Aktuális talajvízszint térkép  │   │
│  │  [Interaktív térkép kutak]      │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Aszálymonitoring térkép        │   │
│  │  [Monitoring állomások térképe]  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Vízhiány térkép                │   │
│  │  [Heatmap vagy choropleth]       │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  📈 GRAFIKONOK SZEKCIÓ                  │
│  ┌─────────────────────────────────┐   │
│  │  Választott helyszín/kút grafikonjai│
│  │  (idősorok, trendek, összehasonlító)│
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Komponens Könyvtár

**Közös Komponensek:**
- `BaseSelector`: Alap dropdown komponens (alapja a modul-specifikus választóknak)
- `ModuleTabs`: Tab navigáció a modulok között
- `DataCard`: Unified kártya komponens adatok megjelenítéséhez
- `ChartContainer`: Wrapper grafikonokhoz (responsive)
- `MapContainer`: Wrapper térképekhez (Leaflet/Mapbox)
- `LoadingSpinner`: Loading state
- `ErrorBoundary`: Hibakezelés
- `OfflineIndicator`: PWA offline státusz

**Meteorológia Modul Komponensek:**
- `MeteorologyCitySelector`: Város választó dropdown
- `WeatherCard`: Időjárás adat kártya
- `TemperatureChart`: Hőmérséklet grafikon
- `PrecipitationChart`: Csapadék grafikon
- `WindChart`: Szél adatok vizualizáció

**Vízállás Modul Komponensek:**
- `WaterLevelStationSelector`: Állomás választó dropdown
- `WaterLevelCard`: Vízállás kártya
- `WaterLevelChart`: Vízállás idősor grafikon
- `WaterLevelTrend`: Trend indikátor

**Aszály Modul Komponensek:**
- `DroughtLocationSelector`: Helyszín választó (aszály adatokhoz)
- `GroundwaterWellSelector`: Kút választó (talajvíz adatokhoz)
- `DroughtIndexCard`: Aszályindex kártya dropdown-nal
- `SoilMoistureCard`: Talajnedvesség kártya dropdown-nal
- `WaterDeficitCard`: Vízhiány kártya dropdown-nal
- `GroundwaterLevelCard`: Talajvízszint kártya dropdown-nal
- `GroundwaterMap`: Talajvízszint térkép (kutak)
- `DroughtMonitoringMap`: Aszálymonitoring térkép
- `WaterDeficitMap`: Vízhiány térkép (heatmap)
- `DroughtChart`: Aszály idősor grafikonok

---

## 📱 PWA Funkciók

### Service Worker
- **Cache Strategy**: Network First with Cache Fallback
- **Offline Support**: Legutolsó letöltött adatok elérhetőek offline
- **Background Sync**: Adatok automatikus frissítése háttérben

### Manifest.json
```json
{
  "name": "Meteorológiai Dashboard",
  "short_name": "MeteoDash",
  "description": "Időjárás, vízállás és aszály monitoring",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "icons": [...]
}
```

### Push Notifications (opcionális)
- Kritikus vízállás figyelmeztetések
- Időjárási riasztások

---

## 🚀 Deployment és CI/CD

### GitHub Workflow

**`.github/workflows/deploy.yml`**
```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './dist'
          production-branch: main
```

### Environment Variables
```env
# .env.example
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
VITE_API_CACHE_DURATION=3600000
```

---

## 📝 Fejlesztési Fázisok

### Phase 1: Alapok (1-2 hét)
- [ ] Project scaffolding
- [ ] Supabase projekt setup
- [ ] Alap komponens könyvtár
- [ ] Routing setup
- [ ] CI/CD pipeline

### Phase 2: Helyszín/Település Modulok (1-2 hét)
- [ ] Meteorológiai városok adatbázis és API
- [ ] Vízállomások adatbázis és API
- [ ] Aszály monitoring helyszínek adatbázis és API
- [ ] Talajvízkutak adatbázis és API (külön!)
- [ ] BaseSelector közös komponens
- [ ] Modul-specifikus selector komponensek

### Phase 3: Meteorológiai Modul (2 hét)
- [ ] Adatforrás integráció
- [ ] Edge function fejlesztés
- [ ] UI komponensek
- [ ] Grafikonok
- [ ] Cache stratégia

### Phase 4: Vízállás Modul (2 hét)
- [ ] Adatforrás integráció (API/Scraping)
- [ ] Edge function fejlesztés
- [ ] UI komponensek
- [ ] Grafikonok
- [ ] Riasztási rendszer (opcionális)

### Phase 5: Aszály Modul (2-3 hét)
- [ ] Adatforrás integráció (aszály, talajvíz)
- [ ] Edge functions fejlesztés (2 külön típus)
- [ ] Adatkártyák dropdown-nal (4 típus)
  - [ ] Aszályindex kártya
  - [ ] Talajnedvesség kártya
  - [ ] Vízhiány kártya
  - [ ] Talajvízszint kártya (külön kút választó!)
- [ ] Térképek implementálása (3 db)
  - [ ] Talajvízszint térkép (kutak markerekkel)
  - [ ] Aszálymonitoring térkép
  - [ ] Vízhiány térkép (heatmap)
- [ ] Grafikonok
- [ ] Helyszín és kút kezelés (2 külön rendszer)

### Phase 6: PWA Features (1 hét)
- [ ] Service Worker implementáció
- [ ] Offline support
- [ ] Manifest.json
- [ ] Install prompt
- [ ] Push notifications setup

### Phase 7: Optimalizáció és Testing (1-2 hét)
- [ ] Performance optimization
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Accessibility audit
- [ ] SEO optimization

### Phase 8: Deployment és Monitoring (1 hét)
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Analytics integration
- [ ] Error tracking (Sentry)
- [ ] Documentation

---

## 🧪 Testing Stratégia

### Unit Tests
- **Framework**: Vitest
- **Coverage**: >80%
- **Focus**: Utils, hooks, services

### Integration Tests
- **Framework**: React Testing Library
- **Focus**: Komponens interakciók, adatáramlás

### E2E Tests
- **Framework**: Playwright
- **Scenarios**:
  - Város választás
  - Modul navigáció
  - Grafikon interakciók
  - Offline mode

---

## 📊 Monitoring és Analytics

### Performance Monitoring
- Lighthouse CI integration
- Web Vitals tracking
- Bundle size monitoring

### Error Tracking
- Sentry integration
- Error boundaries
- User feedback collection

### Analytics
- Usage statistics
- Popular cities tracking
- Feature adoption
- User retention

---

## 🔐 Biztonsági Szempontok

1. **API Keys**: Environment variables, soha ne kerüljön be a kódba
2. **RLS Policies**: Supabase-ben megfelelő policies
3. **Rate Limiting**: Edge functions rate limiting
4. **CORS**: Megfelelő CORS beállítások
5. **Data Validation**: Input validáció minden szinten
6. **XSS Protection**: DOMPurify használata user input-nál

---

## 📚 Dokumentáció Követelmények

1. **README.md**: Setup instrukciók
2. **API.md**: API dokumentáció
3. **CONTRIBUTING.md**: Fejlesztői guidelines
4. **DEPLOYMENT.md**: Deployment guide
5. **JSDoc**: Inline kód dokumentáció
6. **Storybook**: Komponens dokumentáció (opcionális)

---

## 🎯 Success Metrics

- **Performance**: Lighthouse score > 90
- **Accessibility**: WCAG 2.1 AA compliance
- **Test Coverage**: > 80%
- **Bundle Size**: < 500KB (gzipped)
- **Load Time**: < 3s (first contentful paint)
- **PWA Score**: 100

---

## 🔄 Jövőbeli Fejlesztési Lehetőségek

1. **Felhasználói Fiókok**: Kedvenc városok mentése
2. **Összehasonlító Nézet**: Több város egyidejű megjelenítése
3. **Export Funkció**: Adatok letöltése CSV/PDF formátumban
4. **Alert System**: Testreszabható értesítések
5. **Historical Analysis**: Mélyebb történelmi adatelemzés
6. **Mobile App**: Native iOS/Android app
7. **Admin Panel**: Adatforrások kezelése
8. **Multi-language**: i18n support

---

## 📞 Következő Lépések Claude Code-al

1. **Initial Setup**
   - Project inicializálás (Vite + React + TypeScript)
   - Tailwind CSS setup
   - Supabase client setup

2. **Adatforrások Specifikálása**
   - Adj meg konkrét API endpoint-okat
   - Scraping célpontok URL-jei
   - Adatstruktúrák dokumentálása

3. **Település Lista**
   - Melyik településekre kell az adatok?
   - Van-e prioritási sorrend?

4. **Design Preferenciák**
   - Színséma
   - Specifikus chart típusok preferenciái

---

## 🛠️ Szükséges Információk a Fejlesztés Indításához

Kérlek, add meg a következőket **modulonként**:

### 1. **Meteorológiai adatok**:
   - API név/dokumentáció URL
   - Authentikáció módja (API key, OAuth, stb.)
   - Példa API response (JSON)
   - **Települések listája** (név, koordináták)
   - Frissítési gyakoriság

### 2. **Vízállás adatok**:
   - Forrás URL/API vagy scraping céloldal
   - Authentikáció (ha szükséges)
   - **Vízállomások listája** (név, folyó, koordináták, kritikus szintek)
   - Példa adat struktúra
   - Frissítési gyakoriság

### 3. **Aszály adatok**:
   - **A) Aszály monitoring adatok:**
     - Forrás URL/API
     - **Helyszínek listája** (név, koordináták)
     - Melyik index-eket használjuk? (PDSI, SPI, egyéb)
     - Példa response
   
   - **B) Talajvízkút adatok (KÜLÖN!):**
     - Forrás URL/API vagy scraping céloldal
     - **Kutak listája** (kód, név, mélység, koordináták)
     - Példa adat struktúra
     - Mérési gyakoriság

### 4. **Térkép adatok**:
   - Preferált térkép szolgáltató (OpenStreetMap, Mapbox, Google Maps)
   - Térképi stílus preferencia
   - Marker ikonok elérhetősége

### 5. **Design Assets**:
   - Logo (ha van)
   - Színséma preferenciák (hex kódok)
   - Referencia oldal (https://dunaapp-weather-wate-86h9.bolt.host/) stílus követése
   - Ikonok stílusa

### 6. **Prioritások**:
   - Mely modullal kezdjünk?
   - Vannak-e kritikus határidők?

---

*Ez a dokumentum élő dokumentum, amely a projekt előrehaladtával folyamatosan frissül.*
