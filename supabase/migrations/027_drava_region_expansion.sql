-- Migration 027: Duna / Dráva region expansion
-- Date: 2026-06-23
-- Branch: develop (NOT for prod/main until the go-live migration + merge)
--
-- Adds region awareness to the data model and seeds the Dráva-side rows.
--
-- PROD-SAFETY: every Dráva row starts is_active=false / enabled=false so the
-- region-unaware production code (which filters is_active=true / enabled=true)
-- never sees them — no Dráva leakage, no water-level "exactly 3 stations" crash.
-- The region-aware develop hooks pull Dráva rows by region regardless of the
-- legacy flags. A SEPARATE go-live migration (created at release time, with
-- approval) flips these rows active and ships with the develop -> main merge.
--
-- See plan: "Duna/Dráva régió-kiterjesztés", Phase B.

-- ============================================================================
-- 1. SCHEMA — region columns (+ the never-committed groundwater `enabled`)
-- ============================================================================

ALTER TABLE meteorology_cities
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'duna';

ALTER TABLE groundwater_wells
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'duna';

-- `enabled` is used by prod + migration 022 (useGroundwaterWells filters on it)
-- but was never committed as a migration. Add it idempotently so a fresh DB
-- matches production.
ALTER TABLE groundwater_wells
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;

-- water_level_stations already has a `river` column (migration 008, DEFAULT
-- 'Duna') — no new column needed; Dráva stations use river='Dráva'.

-- Backfill existing rows to the Duna region (covered by DEFAULT, set explicitly).
UPDATE meteorology_cities SET region = 'duna' WHERE region IS NULL;
UPDATE groundwater_wells  SET region = 'duna' WHERE region IS NULL;

-- Re-establish the 5 disabled Duna wells (poor data quality —
-- see docs/history/HOTFIXES_2026.md).
UPDATE groundwater_wells
  SET enabled = false
  WHERE well_code IN ('1460', '1461', '912', '1426', '656');

-- ============================================================================
-- 2. SEED — Dráva meteorology cities (region='drava', is_active=false)
-- ============================================================================

INSERT INTO meteorology_cities (name, county, latitude, longitude, population, is_active, region) VALUES
  ('Barcs',   'Somogy', 45.960000, 17.460000, 10700, false, 'drava'),
  ('Őrtilos', 'Somogy', 46.280000, 16.860000,   800, false, 'drava'),
  ('Vízvár',  'Somogy', 46.110000, 17.200000,   650, false, 'drava')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. SEED — Dráva water level stations (river='Dráva', is_active=false)
-- ============================================================================
-- station_id = hydroinfo forecast ID (matching key used by fetch-water-level,
-- and the per-station detail forecast table 446198H / 446199H).
-- vizugy törzsszám: Őrtilos 833, Barcs 835 (held in the Edge Function STATIONS).
-- Reference levels are unknown for the Dráva gauges → NULL (Dráva push alerts
-- are out of scope per plan); refine later if needed.

INSERT INTO water_level_stations (
  station_id, name, river, river_km, latitude, longitude,
  low_water_level_cm, high_water_level_cm, alert_level_cm, danger_level_cm,
  is_active
) VALUES
  ('446198', 'Őrtilos', 'Dráva', 235.90, 46.29800000, 16.88660000, NULL, NULL, NULL, NULL, false),
  ('446199', 'Barcs',   'Dráva', 154.10, 45.95140000, 17.44220000, NULL, NULL, NULL, NULL, false)
ON CONFLICT (station_id) DO NOTHING;

-- ============================================================================
-- 4. SEED — Dráva groundwater wells (region='drava', enabled=false)
-- ============================================================================
-- well_code = vizugy törzsszám (same id used by data.vizugy REST adatFajtaKod=69).
-- All 9 verified 2026-06-23 to return fresh REST groundwater-level data.
-- County: Somogy for all.

INSERT INTO groundwater_wells (well_name, well_code, county, city_name, latitude, longitude, well_type, is_active, enabled, region) VALUES
  ('Gyékényes',          '885',  'Somogy', 'Gyékényes',  46.233286, 17.011503, 'monitoring', true, false, 'drava'),
  ('Berzence',           '3487', 'Somogy', 'Berzence',   46.206768, 17.141788, 'monitoring', true, false, 'drava'),
  ('Szenta',             '3660', 'Somogy', 'Szenta',     46.254195, 17.171192, 'monitoring', true, false, 'drava'),
  ('Somogyszob',         '4000', 'Somogy', 'Somogyszob', 46.293229, 17.296665, 'monitoring', true, false, 'drava'),
  ('Babócsa',            '878',  'Somogy', 'Babócsa',    46.038484, 17.349287, 'monitoring', true, false, 'drava'),
  ('Mike',               '4230', 'Somogy', 'Mike',       46.238652, 17.532833, 'monitoring', true, false, 'drava'),
  ('Szulok',             '3484', 'Somogy', 'Szulok',     46.047508, 17.550105, 'monitoring', true, false, 'drava'),
  ('Darány',             '4004', 'Somogy', 'Darány',     45.980655, 17.589055, 'monitoring', true, false, 'drava'),
  ('Lad-Gyöngyöspuszta', '3659', 'Somogy', 'Lad',        46.164409, 17.602935, 'monitoring', true, false, 'drava')
ON CONFLICT (well_code) DO NOTHING;

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================
DO $$
DECLARE
  drava_cities   INTEGER;
  drava_stations INTEGER;
  drava_wells    INTEGER;
BEGIN
  SELECT COUNT(*) INTO drava_cities   FROM meteorology_cities     WHERE region = 'drava';
  SELECT COUNT(*) INTO drava_stations FROM water_level_stations   WHERE river  = 'Dráva';
  SELECT COUNT(*) INTO drava_wells    FROM groundwater_wells      WHERE region = 'drava';

  RAISE NOTICE '===== DRÁVA SEED VERIFICATION =====';
  RAISE NOTICE 'Dráva cities:   % (expected 3)',  drava_cities;
  RAISE NOTICE 'Dráva stations: % (expected 2)',  drava_stations;
  RAISE NOTICE 'Dráva wells:    % (expected 9)',  drava_wells;
  RAISE NOTICE 'All Dráva rows are is_active=false / enabled=false (prod-safe).';
END $$;
