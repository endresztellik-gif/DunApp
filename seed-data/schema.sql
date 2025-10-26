-- DunApp PWA - Complete Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- LOCATION TABLES (4 separate tables for each module)
-- =============================================================================

-- 1. Meteorology Cities (4 cities)
CREATE TABLE IF NOT EXISTS meteorology_cities (
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

-- 2. Water Level Stations (3 stations)
CREATE TABLE IF NOT EXISTS water_level_stations (
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

-- 3. Drought Monitoring Locations (5 locations)
CREATE TABLE IF NOT EXISTS drought_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_name VARCHAR(100) NOT NULL UNIQUE,
  location_type VARCHAR(50), -- 'monitoring_station'
  county VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Groundwater Wells (15 wells)
CREATE TABLE IF NOT EXISTS groundwater_wells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  well_name VARCHAR(100) NOT NULL,
  well_code VARCHAR(50) UNIQUE NOT NULL,
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

-- =============================================================================
-- DATA TABLES (Time-series data for each module)
-- =============================================================================

-- Meteorology Data
CREATE TABLE IF NOT EXISTS meteorology_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES meteorology_cities(id) ON DELETE CASCADE,
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

-- Water Level Data
CREATE TABLE IF NOT EXISTS water_level_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID REFERENCES water_level_stations(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  water_level INTEGER, -- cm-ben
  trend VARCHAR(20), -- 'rising', 'falling', 'stable'
  discharge DECIMAL(8, 2), -- m³/s-ben
  water_temperature DECIMAL(4, 2), -- °C-ban
  forecast_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(station_id, timestamp)
);

-- Drought Data
CREATE TABLE IF NOT EXISTS drought_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES drought_locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  drought_index DECIMAL(5, 2),
  drought_category VARCHAR(30), -- 'enyhe', 'közepes', 'súlyos', 'extrém'
  soil_moisture DECIMAL(5, 2),
  water_deficit DECIMAL(6, 2), -- vízhiány mm-ben
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(location_id, date)
);

-- Groundwater Data
CREATE TABLE IF NOT EXISTS groundwater_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  well_id UUID REFERENCES groundwater_wells(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  water_level_meters DECIMAL(6, 3), -- talajfelszín alatti mélység méterben
  water_level_masl DECIMAL(8, 3), -- tengerszint feletti vízszint
  temperature DECIMAL(4, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(well_id, measurement_date)
);

-- =============================================================================
-- METADATA TABLES
-- =============================================================================

-- Data Sources (API/Scraping configuration)
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_type VARCHAR(30) NOT NULL, -- 'meteorology', 'water_level', 'drought'
  source_name VARCHAR(100),
  source_type VARCHAR(20), -- 'api' or 'scraping'
  endpoint_url TEXT,
  api_key_required BOOLEAN DEFAULT false,
  last_fetch TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fetch Logs (API call history)
CREATE TABLE IF NOT EXISTS fetch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
  status VARCHAR(20), -- 'success', 'error'
  records_fetched INTEGER,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- INDEXES for Performance
-- =============================================================================

-- Location table indexes
CREATE INDEX idx_meteorology_cities_name ON meteorology_cities(name);
CREATE INDEX idx_water_stations_name ON water_level_stations(station_name);
CREATE INDEX idx_drought_locations_name ON drought_locations(location_name);
CREATE INDEX idx_groundwater_wells_code ON groundwater_wells(well_code);

-- Data table indexes (for fast time-series queries)
CREATE INDEX idx_meteorology_city_timestamp ON meteorology_data(city_id, timestamp DESC);
CREATE INDEX idx_water_level_station_timestamp ON water_level_data(station_id, timestamp DESC);
CREATE INDEX idx_drought_location_date ON drought_data(location_id, date DESC);
CREATE INDEX idx_groundwater_well_date ON groundwater_data(well_id, measurement_date DESC);

-- Spatial indexes (for map queries)
CREATE INDEX idx_meteorology_cities_location ON meteorology_cities 
  USING GIST (point(longitude, latitude));
CREATE INDEX idx_water_stations_location ON water_level_stations 
  USING GIST (point(longitude, latitude));
CREATE INDEX idx_drought_locations_location ON drought_locations 
  USING GIST (point(longitude, latitude));
CREATE INDEX idx_groundwater_wells_location ON groundwater_wells 
  USING GIST (point(longitude, latitude));

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =============================================================================

-- Enable RLS on data tables
ALTER TABLE meteorology_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_level_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE drought_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwater_data ENABLE ROW LEVEL SECURITY;

-- Public read access (no authentication required)
CREATE POLICY "Enable read access for all users" ON meteorology_data
  FOR SELECT USING (true);
  
CREATE POLICY "Enable read access for all users" ON water_level_data
  FOR SELECT USING (true);
  
CREATE POLICY "Enable read access for all users" ON drought_data
  FOR SELECT USING (true);
  
CREATE POLICY "Enable read access for all users" ON groundwater_data
  FOR SELECT USING (true);

-- Location tables are public (no RLS needed, but enable if needed later)
-- ALTER TABLE meteorology_cities ENABLE ROW LEVEL SECURITY;
-- ... etc

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to location tables
CREATE TRIGGER update_meteorology_cities_updated_at BEFORE UPDATE ON meteorology_cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_water_stations_updated_at BEFORE UPDATE ON water_level_stations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_drought_locations_updated_at BEFORE UPDATE ON drought_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_groundwater_wells_updated_at BEFORE UPDATE ON groundwater_wells
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS (Useful aggregations)
-- =============================================================================

-- Latest meteorology data per city
CREATE OR REPLACE VIEW latest_meteorology_data AS
SELECT DISTINCT ON (city_id) 
  md.*,
  mc.name as city_name,
  mc.county
FROM meteorology_data md
JOIN meteorology_cities mc ON md.city_id = mc.id
WHERE mc.is_active = true
ORDER BY city_id, timestamp DESC;

-- Latest water level per station
CREATE OR REPLACE VIEW latest_water_level_data AS
SELECT DISTINCT ON (station_id)
  wld.*,
  wls.station_name,
  wls.river_name,
  wls.lnv_level,
  wls.kkv_level,
  wls.nv_level
FROM water_level_data wld
JOIN water_level_stations wls ON wld.station_id = wls.id
WHERE wls.is_active = true
ORDER BY station_id, timestamp DESC;

-- Latest drought data per location
CREATE OR REPLACE VIEW latest_drought_data AS
SELECT DISTINCT ON (location_id)
  dd.*,
  dl.location_name,
  dl.county
FROM drought_data dd
JOIN drought_locations dl ON dd.location_id = dl.id
WHERE dl.is_active = true
ORDER BY location_id, date DESC;

-- Latest groundwater data per well
CREATE OR REPLACE VIEW latest_groundwater_data AS
SELECT DISTINCT ON (well_id)
  gd.*,
  gw.well_name,
  gw.well_code,
  gw.county,
  gw.city_name
FROM groundwater_data gd
JOIN groundwater_wells gw ON gd.well_id = gw.id
WHERE gw.is_active = true
ORDER BY well_id, measurement_date DESC;

-- =============================================================================
-- INITIAL COMMENT
-- =============================================================================

COMMENT ON TABLE meteorology_cities IS 'Meteorológiai adatok városai (4 db)';
COMMENT ON TABLE water_level_stations IS 'Vízállás mérőállomások (3 db)';
COMMENT ON TABLE drought_locations IS 'Aszály monitoring helyszínek (5 db)';
COMMENT ON TABLE groundwater_wells IS 'Talajvízkutak (15 db)';

-- =============================================================================
-- SCHEMA CREATION COMPLETE
-- =============================================================================
-- Next steps:
-- 1. Run seed-data/*.sql files to populate location tables
-- 2. Configure data_sources table with API endpoints
-- 3. Implement Edge Functions for data fetching
-- =============================================================================
