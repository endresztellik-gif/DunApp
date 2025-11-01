-- DunApp PWA - Meteorology Forecasts Table
-- Migration: 005_meteorology_forecasts.sql
-- Created: 2025-11-01
-- Description: Creates meteorology_forecasts table for 3-day weather forecast data from Yr.no API

-- ============================================================================
-- METEOROLOGY FORECASTS TABLE
-- ============================================================================

-- Meteorology Forecasts (3-day forecast with 6-hour intervals from Yr.no)
CREATE TABLE meteorology_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES meteorology_cities(id) ON DELETE CASCADE,
  forecast_time TIMESTAMPTZ NOT NULL,
  temperature DECIMAL(4,1),
  precipitation_amount DECIMAL(5,2),
  wind_speed DECIMAL(5,2),
  wind_direction INTEGER,
  humidity INTEGER,
  pressure DECIMAL(6,2),
  clouds_percent INTEGER,
  weather_symbol TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_forecast_city FOREIGN KEY (city_id) REFERENCES meteorology_cities(id),
  UNIQUE(city_id, forecast_time)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for faster queries by city and forecast time
CREATE INDEX idx_meteorology_forecasts_city_time
ON meteorology_forecasts(city_id, forecast_time DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on meteorology_forecasts
ALTER TABLE meteorology_forecasts ENABLE ROW LEVEL SECURITY;

-- Public read access to meteorology forecasts
CREATE POLICY "meteorology_forecasts_public_read"
ON meteorology_forecasts
FOR SELECT
USING (true);

-- Service role can write meteorology forecasts
CREATE POLICY "meteorology_forecasts_service_write"
ON meteorology_forecasts
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE meteorology_forecasts IS '3-day weather forecast data from Yr.no API (6-hour intervals)';
COMMENT ON COLUMN meteorology_forecasts.city_id IS 'Reference to meteorology_cities table';
COMMENT ON COLUMN meteorology_forecasts.forecast_time IS 'Timestamp for which this forecast is valid';
COMMENT ON COLUMN meteorology_forecasts.temperature IS 'Temperature in Celsius';
COMMENT ON COLUMN meteorology_forecasts.precipitation_amount IS 'Precipitation amount in mm (6h or 12h interval)';
COMMENT ON COLUMN meteorology_forecasts.wind_speed IS 'Wind speed in m/s';
COMMENT ON COLUMN meteorology_forecasts.wind_direction IS 'Wind direction in degrees (0-360)';
COMMENT ON COLUMN meteorology_forecasts.humidity IS 'Relative humidity percentage';
COMMENT ON COLUMN meteorology_forecasts.pressure IS 'Atmospheric pressure in hPa';
COMMENT ON COLUMN meteorology_forecasts.clouds_percent IS 'Cloud coverage percentage';
COMMENT ON COLUMN meteorology_forecasts.weather_symbol IS 'Yr.no weather symbol code (e.g., clearsky_day, rain, etc.)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table structure
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meteorology_forecasts'
ORDER BY ordinal_position;

-- Verify indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'meteorology_forecasts'
ORDER BY indexname;

-- Verify foreign key constraints
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'meteorology_forecasts'::regclass
ORDER BY conname;

-- Verify RLS policies
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'meteorology_forecasts'
ORDER BY policyname;
