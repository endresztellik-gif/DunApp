-- DunApp PWA - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Created: 2025-10-26
-- Description: Creates all core tables for meteorology, water level, drought, and push notifications

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- METEOROLOGY TABLES
-- ============================================================================

-- Meteorology Cities (4 cities: Szekszárd, Baja, Dunaszekcső, Mohács)
CREATE TABLE meteorology_cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  county TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  population INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meteorology Data Cache
CREATE TABLE meteorology_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES meteorology_cities(id) ON DELETE CASCADE,
  temperature DECIMAL(4,1),
  feels_like DECIMAL(4,1),
  temp_min DECIMAL(4,1),
  temp_max DECIMAL(4,1),
  pressure DECIMAL(6,2),
  humidity INTEGER,
  wind_speed DECIMAL(5,2),
  wind_direction INTEGER,
  clouds_percent INTEGER,
  weather_main TEXT,
  weather_description TEXT,
  weather_icon TEXT,
  rain_1h DECIMAL(5,2),
  rain_3h DECIMAL(5,2),
  snow_1h DECIMAL(5,2),
  snow_3h DECIMAL(5,2),
  visibility INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_city FOREIGN KEY (city_id) REFERENCES meteorology_cities(id)
);

-- Index for faster queries
CREATE INDEX idx_meteorology_data_city_timestamp ON meteorology_data(city_id, timestamp DESC);
CREATE INDEX idx_meteorology_data_timestamp ON meteorology_data(timestamp DESC);

-- ============================================================================
-- WATER LEVEL TABLES
-- ============================================================================

-- Water Level Stations (3 stations: Baja, Mohács, Nagybajcs)
CREATE TABLE water_level_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_name TEXT NOT NULL UNIQUE,
  river_name TEXT NOT NULL,
  city_name TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  lnv_level INTEGER NOT NULL, -- Legkisebb Navigációs Vízállás (cm)
  kkv_level INTEGER NOT NULL, -- Közepes Kisvíz (cm)
  nv_level INTEGER NOT NULL,  -- Nagyvíz (cm)
  is_active BOOLEAN DEFAULT true,
  display_in_comparison BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water Level Data Cache
CREATE TABLE water_level_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID NOT NULL REFERENCES water_level_stations(id) ON DELETE CASCADE,
  water_level_cm INTEGER NOT NULL,
  flow_rate_m3s DECIMAL(7,2),
  water_temp_celsius DECIMAL(4,1),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_station FOREIGN KEY (station_id) REFERENCES water_level_stations(id)
);

-- Index for faster queries
CREATE INDEX idx_water_level_data_station_timestamp ON water_level_data(station_id, timestamp DESC);
CREATE INDEX idx_water_level_data_timestamp ON water_level_data(timestamp DESC);

-- Water Level Forecast Data
CREATE TABLE water_level_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID NOT NULL REFERENCES water_level_stations(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  water_level_cm INTEGER NOT NULL,
  forecast_day INTEGER NOT NULL, -- 1-5 (days ahead)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_forecast_station FOREIGN KEY (station_id) REFERENCES water_level_stations(id),
  UNIQUE(station_id, forecast_date)
);

-- Index for forecasts
CREATE INDEX idx_water_level_forecasts_station ON water_level_forecasts(station_id, forecast_date);

-- ============================================================================
-- DROUGHT MONITORING TABLES
-- ============================================================================

-- Drought Monitoring Locations (5 locations)
CREATE TABLE drought_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_name TEXT NOT NULL UNIQUE,
  location_type TEXT NOT NULL DEFAULT 'monitoring_station',
  county TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drought Data Cache
CREATE TABLE drought_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES drought_locations(id) ON DELETE CASCADE,
  drought_index DECIMAL(5,2), -- HDI (Hungarian Drought Index)
  water_deficit_index DECIMAL(5,2), -- HDIS
  soil_moisture_10cm DECIMAL(5,2),
  soil_moisture_20cm DECIMAL(5,2),
  soil_moisture_30cm DECIMAL(5,2),
  soil_moisture_50cm DECIMAL(5,2),
  soil_moisture_70cm DECIMAL(5,2),
  soil_moisture_100cm DECIMAL(5,2),
  soil_temperature DECIMAL(4,1),
  air_temperature DECIMAL(4,1),
  precipitation DECIMAL(6,2),
  relative_humidity DECIMAL(5,2),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_drought_location FOREIGN KEY (location_id) REFERENCES drought_locations(id)
);

-- Index for drought data
CREATE INDEX idx_drought_data_location_timestamp ON drought_data(location_id, timestamp DESC);
CREATE INDEX idx_drought_data_timestamp ON drought_data(timestamp DESC);

-- ============================================================================
-- GROUNDWATER WELLS TABLES
-- ============================================================================

-- Groundwater Wells (15 wells)
CREATE TABLE groundwater_wells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  well_name TEXT NOT NULL,
  well_code TEXT NOT NULL UNIQUE,
  county TEXT NOT NULL,
  city_name TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  depth_meters DECIMAL(5,2),
  well_type TEXT DEFAULT 'monitoring',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groundwater Data Cache
CREATE TABLE groundwater_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  well_id UUID NOT NULL REFERENCES groundwater_wells(id) ON DELETE CASCADE,
  water_level_meters DECIMAL(6,2), -- Depth below ground
  water_level_masl DECIMAL(6,2), -- Meters above sea level (mBf)
  water_temperature DECIMAL(4,1),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_groundwater_well FOREIGN KEY (well_id) REFERENCES groundwater_wells(id)
);

-- Index for groundwater data
CREATE INDEX idx_groundwater_data_well_timestamp ON groundwater_data(well_id, timestamp DESC);
CREATE INDEX idx_groundwater_data_timestamp ON groundwater_data(timestamp DESC);

-- ============================================================================
-- PRECIPITATION DATA TABLE
-- ============================================================================

CREATE TABLE precipitation_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES meteorology_cities(id) ON DELETE CASCADE,
  daily_mm DECIMAL(6,2),
  weekly_mm DECIMAL(6,2),
  yearly_mm DECIMAL(6,2),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_precipitation_city FOREIGN KEY (city_id) REFERENCES meteorology_cities(id),
  UNIQUE(city_id, date)
);

-- Index for precipitation
CREATE INDEX idx_precipitation_data_city_date ON precipitation_data(city_id, date DESC);

-- ============================================================================
-- PUSH NOTIFICATIONS TABLES
-- ============================================================================

-- Push Subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  station_id UUID REFERENCES water_level_stations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_subscription_station FOREIGN KEY (station_id) REFERENCES water_level_stations(id)
);

-- Push Notification Logs
CREATE TABLE push_notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  station_id UUID REFERENCES water_level_stations(id) ON DELETE CASCADE,
  water_level_cm INTEGER NOT NULL,
  notification_title TEXT NOT NULL,
  notification_body TEXT NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'failed', 'expired'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_log_subscription FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id),
  CONSTRAINT fk_log_station FOREIGN KEY (station_id) REFERENCES water_level_stations(id)
);

-- Index for logs
CREATE INDEX idx_push_logs_subscription ON push_notification_logs(subscription_id, created_at DESC);
CREATE INDEX idx_push_logs_station ON push_notification_logs(station_id, created_at DESC);

-- ============================================================================
-- CACHE TABLE (Generic)
-- ============================================================================

CREATE TABLE cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cache expiration cleanup
CREATE INDEX idx_cache_expires_at ON cache(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_meteorology_cities_updated_at BEFORE UPDATE ON meteorology_cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_level_stations_updated_at BEFORE UPDATE ON water_level_stations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drought_locations_updated_at BEFORE UPDATE ON drought_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groundwater_wells_updated_at BEFORE UPDATE ON groundwater_wells
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_updated_at BEFORE UPDATE ON cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE meteorology_cities IS 'Cities for meteorology data (4 cities in southern Hungary)';
COMMENT ON TABLE meteorology_data IS 'Cached meteorology data from OpenWeatherMap and other sources';
COMMENT ON TABLE water_level_stations IS 'Danube river water level monitoring stations (3 stations)';
COMMENT ON TABLE water_level_data IS 'Historical water level measurements';
COMMENT ON TABLE water_level_forecasts IS '5-day water level forecasts from hydroinfo.hu';
COMMENT ON TABLE drought_locations IS 'Drought monitoring locations (5 stations)';
COMMENT ON TABLE drought_data IS 'Drought index and soil moisture data';
COMMENT ON TABLE groundwater_wells IS 'Groundwater monitoring wells (15 wells)';
COMMENT ON TABLE groundwater_data IS 'Groundwater level measurements';
COMMENT ON TABLE precipitation_data IS 'Daily, weekly, and yearly precipitation data';
COMMENT ON TABLE push_subscriptions IS 'Web Push notification subscriptions';
COMMENT ON TABLE push_notification_logs IS 'History of sent push notifications';
COMMENT ON TABLE cache IS 'Generic key-value cache for API responses';
