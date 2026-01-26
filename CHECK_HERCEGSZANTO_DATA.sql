-- ============================================================================
-- CHECK HERCEGSZÁNTÓ DATA
-- ============================================================================
-- Purpose: Verify if Hercegszántó has recent data (should be up to Jan 9, 2026)
-- Expected: last_measurement = 2026-01-09 (if Migration 021 ran successfully)
-- ============================================================================

-- Check Hercegszántó (#1450) data
SELECT
  gw.well_name AS "Kút",
  gw.well_code AS "Kód",
  gw.enabled AS "Enabled",
  COUNT(gd.id) AS "Összes Rekord",
  MIN(gd.timestamp) AS "Első Mérés",
  MAX(gd.timestamp) AS "Utolsó Mérés",
  MAX(gd.timestamp)::date - MIN(gd.timestamp)::date AS "Lefedettség (nap)"
FROM groundwater_wells gw
LEFT JOIN groundwater_data gd ON gw.id = gd.well_id
WHERE gw.well_code = '1450'
GROUP BY gw.id, gw.well_name, gw.well_code, gw.enabled;

-- ============================================================================
-- EXPECTED RESULT (if Migration 021 ran successfully):
-- ============================================================================
-- Kút: Hercegszántó
-- Kód: 1450
-- Enabled: true
-- Összes Rekord: ~1669 (from Migration 021 notes)
-- Első Mérés: ~2024-11-11
-- Utolsó Mérés: 2026-01-09 18:33:00+00
-- Lefedettség: ~400+ nap
-- ============================================================================

-- If "Utolsó Mérés" is October 2025 or earlier:
--   ❌ Migration 021 DID NOT RUN or FAILED
--   ❌ Cron job not working
--   ❌ Manual trigger needed: SELECT public.invoke_fetch_groundwater_vizugy()
-- ============================================================================
