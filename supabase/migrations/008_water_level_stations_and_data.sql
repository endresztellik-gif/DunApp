-- Migration 008: Water Level Stations and Data Tables
-- Purpose: Store water level monitoring data for 3 Danube stations
-- Phase: 4.1 - Database Schema
-- Date: 2025-11-03
-- Stations: Nagybajcs, Mohács, Baja

-- =============================================================================
-- 1. WATER LEVEL STATIONS TABLE
-- =============================================================================
-- Stores static information about the 3 monitoring stations

CREATE TABLE IF NOT EXISTS water_level_stations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Station identification
  station_id TEXT NOT NULL UNIQUE, -- External station ID (e.g., "442051" for Nagybajcs)
  name TEXT NOT NULL UNIQUE, -- Station name (Nagybajcs, Mohács, Baja)

  -- Location data
  river TEXT NOT NULL DEFAULT 'Duna', -- River name
  river_km NUMERIC(6, 2), -- River kilometer marker (e.g., 1806.00 for Baja)
  latitude NUMERIC(10, 8) NOT NULL, -- Latitude coordinate
  longitude NUMERIC(11, 8) NOT NULL, -- Longitude coordinate

  -- Reference levels (for visualization and alerts)
  low_water_level_cm INTEGER, -- Low water reference (LNV)
  high_water_level_cm INTEGER, -- High water reference (KKV)
  alert_level_cm INTEGER, -- Alert level (e.g., 400cm for Mohács)
  danger_level_cm INTEGER, -- Danger level (e.g., 650cm for flooding)

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_coordinates CHECK (
    latitude BETWEEN 45.0 AND 49.0 AND -- Hungary's latitude range
    longitude BETWEEN 16.0 AND 23.0 -- Hungary's longitude range
  ),
  CONSTRAINT valid_station_id CHECK (length(station_id) > 0),
  CONSTRAINT valid_name CHECK (length(name) > 0)
);

-- Indexes for performance
CREATE INDEX idx_water_level_stations_station_id ON water_level_stations(station_id);
CREATE INDEX idx_water_level_stations_is_active ON water_level_stations(is_active);

-- Updated_at trigger
CREATE TRIGGER update_water_level_stations_updated_at
  BEFORE UPDATE ON water_level_stations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE water_level_stations IS 'Water level monitoring stations on the Danube river';
COMMENT ON COLUMN water_level_stations.station_id IS 'External station ID used by vizugy.hu and hydroinfo.hu';
COMMENT ON COLUMN water_level_stations.river_km IS 'River kilometer marker (distance from river source)';
COMMENT ON COLUMN water_level_stations.alert_level_cm IS 'Water level that triggers push notifications';

-- =============================================================================
-- 2. WATER LEVEL DATA TABLE
-- =============================================================================
-- Stores time-series water level measurements

CREATE TABLE IF NOT EXISTS water_level_data (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to station
  station_id UUID NOT NULL REFERENCES water_level_stations(id) ON DELETE CASCADE,

  -- Timestamp
  measured_at TIMESTAMPTZ NOT NULL, -- Measurement timestamp

  -- Water level measurements
  water_level_cm INTEGER NOT NULL, -- Water level in centimeters
  flow_rate_m3s NUMERIC(8, 2), -- Flow rate in cubic meters per second (m³/s)
  water_temp_celsius NUMERIC(4, 1), -- Water temperature in Celsius

  -- Data source metadata
  source TEXT NOT NULL DEFAULT 'vizugy.hu', -- Data source (vizugy.hu, hydroinfo.hu, manual)

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_water_level CHECK (water_level_cm BETWEEN -500 AND 1500), -- Reasonable range
  CONSTRAINT valid_flow_rate CHECK (flow_rate_m3s IS NULL OR flow_rate_m3s >= 0),
  CONSTRAINT valid_water_temp CHECK (water_temp_celsius IS NULL OR water_temp_celsius BETWEEN -5 AND 40),
  CONSTRAINT valid_source CHECK (source IN ('vizugy.hu', 'hydroinfo.hu', 'manual', 'other')),

  -- Unique constraint: one measurement per station per timestamp
  CONSTRAINT unique_station_measurement UNIQUE (station_id, measured_at)
);

-- Indexes for performance
CREATE INDEX idx_water_level_data_station_id ON water_level_data(station_id);
CREATE INDEX idx_water_level_data_measured_at ON water_level_data(measured_at DESC); -- DESC for latest first
CREATE INDEX idx_water_level_data_station_measured ON water_level_data(station_id, measured_at DESC);
CREATE INDEX idx_water_level_data_source ON water_level_data(source);

-- Composite index for time-range queries
CREATE INDEX idx_water_level_data_range_query
  ON water_level_data(station_id, measured_at DESC, water_level_cm);

-- Comment
COMMENT ON TABLE water_level_data IS 'Time-series water level measurements from monitoring stations';
COMMENT ON COLUMN water_level_data.water_level_cm IS 'Water level in centimeters relative to reference point';
COMMENT ON COLUMN water_level_data.flow_rate_m3s IS 'Water flow rate in cubic meters per second';
COMMENT ON COLUMN water_level_data.source IS 'Data source website or system';

-- =============================================================================
-- 3. SEED DATA FOR STATIONS
-- =============================================================================
-- Insert the 3 Danube monitoring stations

INSERT INTO water_level_stations (
  station_id,
  name,
  river,
  river_km,
  latitude,
  longitude,
  low_water_level_cm,
  high_water_level_cm,
  alert_level_cm,
  danger_level_cm
) VALUES
  (
    '442051', -- External station ID from vizugy.hu/hydroinfo.hu
    'Nagybajcs',
    'Duna',
    1811.00, -- River km
    46.2000, -- Approximate latitude
    18.9500, -- Approximate longitude
    100, -- Low water reference (LNV)
    500, -- High water reference (KKV)
    550, -- Alert level
    700  -- Danger level
  ),
  (
    '442027', -- External station ID
    'Baja',
    'Duna',
    1480.00, -- River km (1806.00 in some sources)
    46.1811,
    18.9525,
    50, -- Low water reference
    400, -- High water reference
    500, -- Alert level
    700  -- Danger level
  ),
  (
    '442010', -- External station ID
    'Mohács',
    'Duna',
    1447.00, -- River km
    45.9939,
    18.6858,
    50, -- Low water reference
    300, -- High water reference
    400, -- Alert level (push notification trigger)
    650  -- Danger level (flooding risk)
  )
ON CONFLICT (station_id) DO NOTHING;

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Allow public read access, restrict write access

-- Enable RLS
ALTER TABLE water_level_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_level_data ENABLE ROW LEVEL SECURITY;

-- Public read access for stations
CREATE POLICY "Public read access to water level stations"
  ON water_level_stations
  FOR SELECT
  USING (true);

-- Public read access for data
CREATE POLICY "Public read access to water level data"
  ON water_level_data
  FOR SELECT
  USING (true);

-- Service role can insert/update stations (for admin tasks)
CREATE POLICY "Service role can manage water level stations"
  ON water_level_stations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Service role can insert/update data (for Edge Functions)
CREATE POLICY "Service role can manage water level data"
  ON water_level_data
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- 5. HELPER FUNCTIONS
-- =============================================================================

-- Function: Get latest water level for a station
CREATE OR REPLACE FUNCTION get_latest_water_level(p_station_id UUID)
RETURNS TABLE (
  water_level_cm INTEGER,
  flow_rate_m3s NUMERIC,
  water_temp_celsius NUMERIC,
  measured_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wd.water_level_cm,
    wd.flow_rate_m3s,
    wd.water_temp_celsius,
    wd.measured_at
  FROM water_level_data wd
  WHERE wd.station_id = p_station_id
  ORDER BY wd.measured_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_latest_water_level IS 'Get the most recent water level measurement for a station';

-- Function: Get water level trend (24 hours)
CREATE OR REPLACE FUNCTION get_water_level_trend(p_station_id UUID)
RETURNS TABLE (
  current_level_cm INTEGER,
  level_24h_ago_cm INTEGER,
  change_cm INTEGER,
  change_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH current AS (
    SELECT water_level_cm
    FROM water_level_data
    WHERE station_id = p_station_id
    ORDER BY measured_at DESC
    LIMIT 1
  ),
  past AS (
    SELECT water_level_cm
    FROM water_level_data
    WHERE station_id = p_station_id
      AND measured_at <= NOW() - INTERVAL '24 hours'
    ORDER BY measured_at DESC
    LIMIT 1
  )
  SELECT
    c.water_level_cm AS current_level_cm,
    p.water_level_cm AS level_24h_ago_cm,
    (c.water_level_cm - p.water_level_cm) AS change_cm,
    CASE
      WHEN p.water_level_cm = 0 THEN NULL
      ELSE ROUND(((c.water_level_cm - p.water_level_cm)::NUMERIC / p.water_level_cm::NUMERIC * 100), 2)
    END AS change_percentage
  FROM current c, past p;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_water_level_trend IS 'Calculate 24-hour water level trend for a station';

-- Function: Check if water level exceeds alert threshold
CREATE OR REPLACE FUNCTION check_alert_level(p_station_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_level INTEGER;
  v_alert_level INTEGER;
BEGIN
  -- Get current water level
  SELECT water_level_cm INTO v_current_level
  FROM water_level_data
  WHERE station_id = p_station_id
  ORDER BY measured_at DESC
  LIMIT 1;

  -- Get alert threshold
  SELECT alert_level_cm INTO v_alert_level
  FROM water_level_stations
  WHERE id = p_station_id;

  -- Return true if current level exceeds alert level
  RETURN (v_current_level >= v_alert_level);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_alert_level IS 'Check if current water level exceeds alert threshold for a station';

-- =============================================================================
-- 6. GRANTS
-- =============================================================================

-- Grant access to anon role (public API)
GRANT SELECT ON water_level_stations TO anon;
GRANT SELECT ON water_level_data TO anon;

-- Grant access to authenticated users
GRANT SELECT ON water_level_stations TO authenticated;
GRANT SELECT ON water_level_data TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_latest_water_level TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_water_level_trend TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_alert_level TO anon, authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Tables created: water_level_stations, water_level_data
-- Indexes: 8 total
-- RLS Policies: 4 total
-- Helper Functions: 3 total
-- Seed Data: 3 stations (Nagybajcs, Baja, Mohács)
