-- DunApp PWA - Add Temperature Range to Forecasts
-- Migration: 006_add_forecast_temperature_range.sql
-- Created: 2025-11-02
-- Description: Adds temperature_min and temperature_max columns to meteorology_forecasts

-- ============================================================================
-- ADD COLUMNS
-- ============================================================================

-- Add minimum temperature for the forecast period (6h or 12h interval)
ALTER TABLE meteorology_forecasts
ADD COLUMN temperature_min DECIMAL(4,1);

-- Add maximum temperature for the forecast period (6h or 12h interval)
ALTER TABLE meteorology_forecasts
ADD COLUMN temperature_max DECIMAL(4,1);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN meteorology_forecasts.temperature_min IS 'Minimum temperature in Celsius for the forecast period (from Yr.no next_6_hours or next_12_hours)';
COMMENT ON COLUMN meteorology_forecasts.temperature_max IS 'Maximum temperature in Celsius for the forecast period (from Yr.no next_6_hours or next_12_hours)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify new columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meteorology_forecasts'
  AND column_name IN ('temperature_min', 'temperature_max')
ORDER BY column_name;
