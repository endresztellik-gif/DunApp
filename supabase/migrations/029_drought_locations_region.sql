-- Migration 029: Drought monitoring locations — Duna / Dráva region split
-- Date: 2026-06-26
--
-- Adds region awareness to drought_locations (mirrors migration 027 for
-- groundwater_wells / meteorology_cities) and seeds the 3 Dráva-side
-- aszálymonitoring stations so the Drought module's "Aszály Adatok" selector
-- separates by region — Dráva region shows ONLY Dráva locations, Duna ONLY Duna.
--
-- The 3 Dráva stations are live OVF aszálymonitoring stations; their pattern API
-- (voa UUID) returns the full 7 datasets (verified 2026-06-26). The matching
-- UUIDs are added to supabase/functions/fetch-drought/index.ts so the daily cron
-- populates drought_data for them. Until the first fetch runs, the cards show the
-- existing "nincs elérhető adat" state (DroughtModule handles null droughtData).

-- ============================================================================
-- 1. SCHEMA — region column
-- ============================================================================

ALTER TABLE drought_locations
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'duna';

-- Backfill existing 5 rows to Duna (covered by DEFAULT, set explicitly).
UPDATE drought_locations SET region = 'duna' WHERE region IS NULL;

-- ============================================================================
-- 2. SEED — Dráva drought monitoring stations (region='drava', is_active=true)
-- ============================================================================
-- location_name MUST match the `name` field in fetch-drought DROUGHT_LOCATIONS
-- (the edge function joins drought_data to drought_locations by location_name).
-- Coordinates are approximate settlement centroids (Berzence = its groundwater
-- well coordinate); only the currently-unused DroughtMonitoringMap reads lat/lon.

INSERT INTO drought_locations (location_name, location_type, county, latitude, longitude, is_active, region) VALUES
  ('Felsőszentmárton', 'monitoring_station', 'Baranya', 45.855300, 17.699700, true, 'drava'),
  ('Berzence',         'monitoring_station', 'Somogy',  46.206800, 17.141800, true, 'drava'),
  ('Kálmáncsa',        'monitoring_station', 'Somogy',  46.044700, 17.556400, true, 'drava')
ON CONFLICT (location_name) DO NOTHING;

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================
DO $$
DECLARE
  duna_locations  INTEGER;
  drava_locations INTEGER;
BEGIN
  SELECT COUNT(*) INTO duna_locations  FROM drought_locations WHERE region = 'duna';
  SELECT COUNT(*) INTO drava_locations FROM drought_locations WHERE region = 'drava';

  RAISE NOTICE '===== DROUGHT LOCATIONS REGION SPLIT =====';
  RAISE NOTICE 'Duna locations:  % (expected 5)', duna_locations;
  RAISE NOTICE 'Dráva locations: % (expected 3)', drava_locations;
END $$;
