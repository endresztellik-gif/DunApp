-- Migration: Add forecast_uncertainty_cm column to water_level_forecasts
-- Date: 2025-11-08
-- Purpose: Store ± uncertainty values from hydroinfo.hu forecasts

-- Add forecast_uncertainty_cm column (nullable for backwards compatibility)
ALTER TABLE water_level_forecasts
ADD COLUMN IF NOT EXISTS forecast_uncertainty_cm INTEGER;

COMMENT ON COLUMN water_level_forecasts.forecast_uncertainty_cm IS
'Forecast uncertainty in centimeters (± value from hydroinfo.hu).
Increases over time: ~2 cm for 1-day forecast, ~24 cm for 6-day forecast.';

-- Index for queries filtering by uncertainty level
CREATE INDEX IF NOT EXISTS idx_water_level_forecasts_uncertainty
ON water_level_forecasts(forecast_uncertainty_cm);
