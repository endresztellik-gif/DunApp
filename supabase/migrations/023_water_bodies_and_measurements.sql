-- Migration 023: Water Bodies and Measurements Tables
-- Purpose: Store water level data for other water bodies (lakes, reservoirs)
-- Date: 2026-01-30
-- Water Bodies: Kadia, FTCS (Karapancsa), Belső-Béda
--
-- NOTE: This is separate from water_level_stations (Danube river stations)
--       because these are different types of water bodies

-- =============================================================================
-- 1. WATER BODIES TABLE
-- =============================================================================
-- Stores static information about monitored water bodies (lakes, reservoirs)

CREATE TABLE IF NOT EXISTS water_bodies (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Water body identification
  name TEXT NOT NULL UNIQUE, -- Water body name (e.g., "Kadia", "FTCS (Karapancsa)")
  type TEXT NOT NULL DEFAULT 'lake', -- Type: lake, reservoir, wetland, etc.

  -- Location data
  region TEXT, -- Region/county (e.g., "Bács-Kiskun")
  latitude NUMERIC(10, 8), -- Latitude coordinate
  longitude NUMERIC(11, 8), -- Longitude coordinate

  -- External data source
  vizugy_url TEXT, -- URL to vizugy.hu page for scraping
  vizugy_station_id TEXT, -- Station ID from vizugy.hu (if applicable)

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_name CHECK (length(name) > 0),
  CONSTRAINT valid_type CHECK (type IN ('lake', 'reservoir', 'wetland', 'river', 'other'))
);

-- Indexes for performance
CREATE INDEX idx_water_bodies_is_active ON water_bodies(is_active);
CREATE INDEX idx_water_bodies_name ON water_bodies(name);

-- Updated_at trigger
CREATE TRIGGER update_water_bodies_updated_at
  BEFORE UPDATE ON water_bodies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE water_bodies IS 'Water bodies (lakes, reservoirs) monitored for water levels - separate from Danube river stations';
COMMENT ON COLUMN water_bodies.vizugy_url IS 'URL to vizugy.hu page for automated scraping';

-- =============================================================================
-- 2. WATER BODY MEASUREMENTS TABLE
-- =============================================================================
-- Stores time-series water level measurements for water bodies

CREATE TABLE IF NOT EXISTS water_body_measurements (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to water body
  water_body_id UUID NOT NULL REFERENCES water_bodies(id) ON DELETE CASCADE,

  -- Timestamp
  measured_at TIMESTAMPTZ NOT NULL, -- Measurement timestamp

  -- Water level measurement
  water_level_cm INTEGER NOT NULL, -- Water level in centimeters

  -- Optional data
  water_temp_celsius NUMERIC(4, 1), -- Water temperature in Celsius (if available)

  -- Data source metadata
  source TEXT NOT NULL DEFAULT 'vizugy.hu', -- Data source (vizugy.hu, manual, other)

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_water_level CHECK (water_level_cm BETWEEN 0 AND 1000), -- Reasonable range for lakes/reservoirs
  CONSTRAINT valid_water_temp CHECK (water_temp_celsius IS NULL OR water_temp_celsius BETWEEN -5 AND 40),
  CONSTRAINT valid_source CHECK (source IN ('vizugy.hu', 'manual', 'other')),

  -- Unique constraint: one measurement per water body per timestamp
  CONSTRAINT unique_water_body_measurement UNIQUE (water_body_id, measured_at)
);

-- Indexes for performance
CREATE INDEX idx_water_body_measurements_water_body_id ON water_body_measurements(water_body_id);
CREATE INDEX idx_water_body_measurements_measured_at ON water_body_measurements(measured_at DESC);
CREATE INDEX idx_water_body_measurements_water_body_date ON water_body_measurements(water_body_id, measured_at DESC);

-- Comment
COMMENT ON TABLE water_body_measurements IS 'Time-series water level measurements for water bodies (lakes, reservoirs)';
COMMENT ON COLUMN water_body_measurements.water_level_cm IS 'Water level in centimeters (absolute level, not relative to reference)';

-- =============================================================================
-- 3. INSERT INITIAL WATER BODIES
-- =============================================================================
-- Add the 3 monitored water bodies

INSERT INTO water_bodies (name, type, region, vizugy_url) VALUES
  ('Kadia', 'lake', 'Bács-Kiskun', 'https://www.vizugy.hu/?mapModule=OpFeGrafikon&AllomasVOA=164960F7-97AB-11D4-BB62-00508BA24287&mapData=OrasIdosor'),
  ('FTCS (Karapancsa)', 'wetland', 'Bács-Kiskun', 'https://www.vizugy.hu/?mapModule=OpGrafikon&AllomasVOA=164960F8-97AB-11D4-BB62-00508BA24287&mapData=OrasIdosor'),
  ('Belső-Béda', 'wetland', 'Bács-Kiskun', NULL)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 4. RLS POLICIES (Row Level Security)
-- =============================================================================
-- Enable RLS on both tables

ALTER TABLE water_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_body_measurements ENABLE ROW LEVEL SECURITY;

-- Allow public read access to water bodies
CREATE POLICY "Allow public read access to water bodies"
  ON water_bodies FOR SELECT
  USING (true);

-- Allow public read access to measurements
CREATE POLICY "Allow public read access to water body measurements"
  ON water_body_measurements FOR SELECT
  USING (true);

-- Allow service role full access to water bodies
CREATE POLICY "Allow service role full access to water bodies"
  ON water_bodies FOR ALL
  USING (auth.role() = 'service_role');

-- Allow service role full access to measurements
CREATE POLICY "Allow service role full access to water body measurements"
  ON water_body_measurements FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
