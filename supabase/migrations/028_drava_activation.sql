-- Migration 028: Dráva activation (go-live flag-flip)
-- Date: 2026-06-24
--
-- Flips the Dráva rows seeded prod-safe (is_active/enabled=false) by migration 027
-- to ACTIVE, now that the region-aware frontend is live on main (PR #1 merged).
--
-- SAFE ORDER: this runs AFTER the region-aware build is in production. The legacy
-- (no-region) hook branch is used only in tests, not in the live app (verified:
-- App.tsx / WaterLevelModule always pass a region), so flipping these flags cannot
-- leak Dráva into a region-unaware view.
--
-- After this migration the hooks no longer need the temporary `drava` flag-skip
-- exception (removed in the same change set) — uniform is_active/enabled filtering
-- surfaces Dráva because its flags are now true.

-- Cities: Barcs, Őrtilos, Vízvár
UPDATE meteorology_cities
  SET is_active = true
  WHERE region = 'drava';

-- Water level stations: Őrtilos (446198), Barcs (446199)
UPDATE water_level_stations
  SET is_active = true
  WHERE river = 'Dráva';

-- Groundwater wells: 9 Somogy wells (seeded is_active=true, enabled=false)
UPDATE groundwater_wells
  SET enabled = true
  WHERE region = 'drava';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  cities_active   INTEGER;
  stations_active INTEGER;
  wells_enabled   INTEGER;
BEGIN
  SELECT COUNT(*) INTO cities_active   FROM meteorology_cities   WHERE region = 'drava' AND is_active = true;
  SELECT COUNT(*) INTO stations_active FROM water_level_stations WHERE river  = 'Dráva' AND is_active = true;
  SELECT COUNT(*) INTO wells_enabled   FROM groundwater_wells    WHERE region = 'drava' AND enabled   = true;

  RAISE NOTICE '===== DRÁVA ACTIVATION =====';
  RAISE NOTICE 'Active Dráva cities:    % (expected 3)', cities_active;
  RAISE NOTICE 'Active Dráva stations:  % (expected 2)', stations_active;
  RAISE NOTICE 'Enabled Dráva wells:    % (expected 9)', wells_enabled;
END $$;
