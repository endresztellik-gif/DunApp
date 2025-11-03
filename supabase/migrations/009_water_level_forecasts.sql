-- Migration 009: Water Level Forecasts Table
-- Purpose: Store water level forecast data from hydroinfo.hu
-- Phase: 4.1 - Database Schema
-- Date: 2025-11-03
-- Data Source: hydroinfo.hu (5-day forecasts)

-- =============================================================================
-- 1. WATER LEVEL FORECASTS TABLE
-- =============================================================================
-- Stores forecasted water levels for the 3 stations

CREATE TABLE IF NOT EXISTS water_level_forecasts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to station
  station_id UUID NOT NULL REFERENCES water_level_stations(id) ON DELETE CASCADE,

  -- Forecast metadata
  forecast_date DATE NOT NULL, -- Date of the forecast (YYYY-MM-DD)
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When the forecast was issued/fetched

  -- Forecasted values
  forecasted_level_cm INTEGER NOT NULL, -- Forecasted water level in centimeters

  -- Data source
  source TEXT NOT NULL DEFAULT 'hydroinfo.hu',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_forecasted_level CHECK (forecasted_level_cm BETWEEN -500 AND 1500),
  CONSTRAINT valid_forecast_source CHECK (source IN ('hydroinfo.hu', 'manual', 'other')),

  -- Unique constraint: one forecast per station per date per issue time
  -- (Allow multiple forecasts for same date if issued at different times)
  CONSTRAINT unique_station_forecast UNIQUE (station_id, forecast_date, issued_at)
);

-- Indexes for performance
CREATE INDEX idx_water_level_forecasts_station_id ON water_level_forecasts(station_id);
CREATE INDEX idx_water_level_forecasts_forecast_date ON water_level_forecasts(forecast_date ASC);
CREATE INDEX idx_water_level_forecasts_issued_at ON water_level_forecasts(issued_at DESC);

-- Composite index for time-range queries
CREATE INDEX idx_water_level_forecasts_range_query
  ON water_level_forecasts(station_id, forecast_date ASC, issued_at DESC);

-- Composite index for getting latest forecast
CREATE INDEX idx_water_level_forecasts_latest
  ON water_level_forecasts(station_id, issued_at DESC, forecast_date ASC);

-- Comment
COMMENT ON TABLE water_level_forecasts IS 'Water level forecasts for monitoring stations (5-day predictions)';
COMMENT ON COLUMN water_level_forecasts.forecast_date IS 'Date for which the forecast applies';
COMMENT ON COLUMN water_level_forecasts.issued_at IS 'Timestamp when the forecast was issued/fetched';
COMMENT ON COLUMN water_level_forecasts.forecasted_level_cm IS 'Predicted water level in centimeters';

-- =============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE water_level_forecasts ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access to water level forecasts"
  ON water_level_forecasts
  FOR SELECT
  USING (true);

-- Service role can insert/update/delete
CREATE POLICY "Service role can manage water level forecasts"
  ON water_level_forecasts
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- 3. HELPER FUNCTIONS
-- =============================================================================

-- Function: Get latest forecast for a station (next 5 days)
CREATE OR REPLACE FUNCTION get_latest_forecast(p_station_id UUID)
RETURNS TABLE (
  forecast_date DATE,
  forecasted_level_cm INTEGER,
  issued_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_issue AS (
    SELECT MAX(issued_at) AS max_issued_at
    FROM water_level_forecasts
    WHERE station_id = p_station_id
  )
  SELECT
    f.forecast_date,
    f.forecasted_level_cm,
    f.issued_at
  FROM water_level_forecasts f
  INNER JOIN latest_issue li ON f.issued_at = li.max_issued_at
  WHERE f.station_id = p_station_id
    AND f.forecast_date >= CURRENT_DATE
  ORDER BY f.forecast_date ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_latest_forecast IS 'Get the most recent forecast for a station (next 5 days)';

-- Function: Get forecast trend (compare today vs tomorrow)
CREATE OR REPLACE FUNCTION get_forecast_trend(p_station_id UUID)
RETURNS TABLE (
  today_forecast_cm INTEGER,
  tomorrow_forecast_cm INTEGER,
  change_cm INTEGER,
  trend TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_issue AS (
    SELECT MAX(issued_at) AS max_issued_at
    FROM water_level_forecasts
    WHERE station_id = p_station_id
  ),
  today AS (
    SELECT forecasted_level_cm
    FROM water_level_forecasts f
    INNER JOIN latest_issue li ON f.issued_at = li.max_issued_at
    WHERE f.station_id = p_station_id
      AND f.forecast_date = CURRENT_DATE
    LIMIT 1
  ),
  tomorrow AS (
    SELECT forecasted_level_cm
    FROM water_level_forecasts f
    INNER JOIN latest_issue li ON f.issued_at = li.max_issued_at
    WHERE f.station_id = p_station_id
      AND f.forecast_date = CURRENT_DATE + INTERVAL '1 day'
    LIMIT 1
  )
  SELECT
    t.forecasted_level_cm AS today_forecast_cm,
    tm.forecasted_level_cm AS tomorrow_forecast_cm,
    (tm.forecasted_level_cm - t.forecasted_level_cm) AS change_cm,
    CASE
      WHEN (tm.forecasted_level_cm - t.forecasted_level_cm) > 10 THEN 'rising'
      WHEN (tm.forecasted_level_cm - t.forecasted_level_cm) < -10 THEN 'falling'
      ELSE 'stable'
    END AS trend
  FROM today t, tomorrow tm;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_forecast_trend IS 'Get forecast trend comparing today vs tomorrow';

-- Function: Clean old forecasts (keep last 30 days)
CREATE OR REPLACE FUNCTION clean_old_forecasts()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete forecasts older than 30 days
  WITH deleted AS (
    DELETE FROM water_level_forecasts
    WHERE issued_at < NOW() - INTERVAL '30 days'
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION clean_old_forecasts IS 'Delete water level forecasts older than 30 days';

-- Function: Get forecast accuracy (compare past forecasts with actual measurements)
CREATE OR REPLACE FUNCTION get_forecast_accuracy(
  p_station_id UUID,
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  forecast_date DATE,
  forecasted_level_cm INTEGER,
  actual_level_cm INTEGER,
  error_cm INTEGER,
  error_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH forecast_issued_day_before AS (
    -- Get forecasts that were issued the day before the forecast date
    SELECT
      f.forecast_date,
      f.forecasted_level_cm,
      f.issued_at
    FROM water_level_forecasts f
    WHERE f.station_id = p_station_id
      AND f.forecast_date >= CURRENT_DATE - p_days_back
      AND f.forecast_date < CURRENT_DATE
      AND DATE(f.issued_at) = f.forecast_date - INTERVAL '1 day'
  ),
  actual_measurements AS (
    -- Get actual measurements for those dates
    SELECT
      DATE(d.measured_at) AS measurement_date,
      AVG(d.water_level_cm)::INTEGER AS avg_level_cm
    FROM water_level_data d
    WHERE d.station_id = p_station_id
      AND DATE(d.measured_at) >= CURRENT_DATE - p_days_back
      AND DATE(d.measured_at) < CURRENT_DATE
    GROUP BY DATE(d.measured_at)
  )
  SELECT
    f.forecast_date,
    f.forecasted_level_cm,
    a.avg_level_cm AS actual_level_cm,
    (a.avg_level_cm - f.forecasted_level_cm) AS error_cm,
    CASE
      WHEN f.forecasted_level_cm = 0 THEN NULL
      ELSE ROUND(
        ABS((a.avg_level_cm - f.forecasted_level_cm)::NUMERIC / f.forecasted_level_cm::NUMERIC * 100),
        2
      )
    END AS error_percentage
  FROM forecast_issued_day_before f
  INNER JOIN actual_measurements a ON f.forecast_date = a.measurement_date
  ORDER BY f.forecast_date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_forecast_accuracy IS 'Compare forecasts with actual measurements to calculate accuracy';

-- =============================================================================
-- 4. GRANTS
-- =============================================================================

-- Grant access to anon role
GRANT SELECT ON water_level_forecasts TO anon;

-- Grant access to authenticated users
GRANT SELECT ON water_level_forecasts TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_latest_forecast TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_forecast_trend TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_forecast_accuracy TO anon, authenticated;

-- Service role can execute cleanup function
GRANT EXECUTE ON FUNCTION clean_old_forecasts TO service_role;

-- =============================================================================
-- 5. AUTOMATIC CLEANUP TRIGGER (Optional)
-- =============================================================================
-- Note: This will be scheduled via cron in Migration 010
-- For now, just define the cleanup function above

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Tables created: water_level_forecasts
-- Indexes: 5 total
-- RLS Policies: 2 total
-- Helper Functions: 4 total (get_latest_forecast, get_forecast_trend, clean_old_forecasts, get_forecast_accuracy)
