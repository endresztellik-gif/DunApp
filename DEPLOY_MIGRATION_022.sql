-- ============================================================================
-- DEPLOYMENT SCRIPT: Migration 022 - Groundwater Last Timestamps
-- ============================================================================
-- Instructions:
-- 1. Copy this entire script
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste and execute
-- 4. Verify function created successfully
-- ============================================================================

-- Enable logging
DO $$
BEGIN
  RAISE NOTICE '🚀 Starting Migration 022 deployment...';
END $$;

-- ============================================================================
-- CREATE RPC FUNCTION: get_all_well_last_timestamps()
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

-- ============================================================================
-- VERIFICATION: Test the function
-- ============================================================================

DO $$
DECLARE
  well_count INTEGER;
BEGIN
  RAISE NOTICE '✅ Function created successfully!';
  RAISE NOTICE '🔍 Testing function...';

  SELECT COUNT(*) INTO well_count FROM get_all_well_last_timestamps();

  RAISE NOTICE '✅ Function test successful!';
  RAISE NOTICE '📊 Returned % wells', well_count;

  IF well_count = 10 THEN
    RAISE NOTICE '✅ Expected 10 enabled wells - CORRECT!';
  ELSE
    RAISE WARNING '⚠️ Expected 10 wells, got %', well_count;
  END IF;
END $$;

-- ============================================================================
-- DISPLAY RESULTS: Show all well timestamps
-- ============================================================================

SELECT
  well_name AS "Kút",
  well_code AS "Kód",
  city_name AS "Település",
  last_timestamp AS "Utolsó Mérés"
FROM get_all_well_last_timestamps()
ORDER BY well_name;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Migration 022 deployment complete!';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Verify 10 wells returned in result table';
  RAISE NOTICE '   2. Deploy frontend changes (npm run build + git push)';
  RAISE NOTICE '   3. Test GroundwaterTimestampTable component';
END $$;
