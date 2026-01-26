-- ============================================================================
-- GROUNDWATER WELL LAST TIMESTAMPS - RPC FUNCTION
-- ============================================================================
-- Purpose: Return last measurement timestamp for all enabled wells
-- Used by: GroundwaterTimestampTable component
-- Performance: Fast query with LEFT JOIN + MAX aggregation
-- Created: 2026-01-24
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_all_well_last_timestamps()
RETURNS TABLE (
  well_id UUID,
  well_name TEXT,
  well_code TEXT,
  city_name TEXT,
  last_timestamp TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    gw.id AS well_id,
    gw.well_name,
    gw.well_code,
    gw.city_name,
    MAX(gd.timestamp) AS last_timestamp
  FROM groundwater_wells gw
  LEFT JOIN groundwater_data gd ON gw.id = gd.well_id
  WHERE gw.is_active = true
    AND gw.enabled = true
  GROUP BY gw.id, gw.well_name, gw.well_code, gw.city_name
  ORDER BY gw.well_name;
$$;

-- Grant execute permission to public roles
GRANT EXECUTE ON FUNCTION public.get_all_well_last_timestamps() TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_all_well_last_timestamps() IS
'Returns last measurement timestamp for all enabled groundwater wells. Used by GroundwaterTimestampTable component to display data freshness. Performance: ~10ms with 10 wells and 17K records.';
