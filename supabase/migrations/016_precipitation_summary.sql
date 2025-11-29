-- ============================================================================
-- MIGRATION 016: Precipitation Summary Table
-- ============================================================================
-- Purpose: Store aggregated precipitation data from Open-Meteo Historical API
-- - Last 7 days
-- - Last 30 days
-- - Year-to-date (YTD)
--
-- Data source: Open-Meteo Historical Weather API
-- URL: https://archive-api.open-meteo.com/v1/archive
-- ============================================================================

-- Create precipitation_summary table
CREATE TABLE IF NOT EXISTS precipitation_summary (
  id SERIAL PRIMARY KEY,
  city_id UUID REFERENCES meteorology_cities(id) ON DELETE CASCADE,
  last_7_days DECIMAL(6,2),      -- mm (max 999.99 mm)
  last_30_days DECIMAL(7,2),     -- mm (max 9999.99 mm)
  year_to_date DECIMAL(8,2),     -- mm (max 99999.99 mm)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(city_id)  -- Only one record per city (upsert pattern)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_precipitation_summary_city_id
  ON precipitation_summary(city_id);

-- Enable Row Level Security
ALTER TABLE precipitation_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow anonymous read access
CREATE POLICY "Allow anonymous read access to precipitation_summary"
  ON precipitation_summary
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policy: Allow service role full access
CREATE POLICY "Allow service role full access to precipitation_summary"
  ON precipitation_summary
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE precipitation_summary IS 'Aggregated precipitation data per city (7-day, 30-day, YTD totals from Open-Meteo)';
COMMENT ON COLUMN precipitation_summary.last_7_days IS 'Total precipitation in last 7 days (mm)';
COMMENT ON COLUMN precipitation_summary.last_30_days IS 'Total precipitation in last 30 days (mm)';
COMMENT ON COLUMN precipitation_summary.year_to_date IS 'Total precipitation from Jan 1 to today (mm)';

-- ============================================================================
-- INITIAL DATA (Optional - Edge Function will populate)
-- ============================================================================
-- Insert placeholder rows for all cities (will be updated by Edge Function)
INSERT INTO precipitation_summary (city_id, last_7_days, last_30_days, year_to_date)
SELECT id, 0, 0, 0 FROM meteorology_cities
ON CONFLICT (city_id) DO NOTHING;
