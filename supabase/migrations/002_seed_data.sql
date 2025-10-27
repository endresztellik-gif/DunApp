-- DunApp PWA - Seed Data
-- Migration: 002_seed_data.sql
-- Created: 2025-10-26
-- Description: Seeds all 27 locations (4 cities + 3 stations + 5 drought locations + 15 wells)

-- ============================================================================
-- METEOROLOGY CITIES (4 cities)
-- ============================================================================

INSERT INTO meteorology_cities (name, county, latitude, longitude, population, is_active) VALUES
('Szekszárd', 'Tolna', 46.3481, 18.7097, 32833, true),
('Baja', 'Bács-Kiskun', 46.1811, 18.9550, 35989, true),
('Dunaszekcső', 'Baranya', 46.0833, 18.7667, 2453, true),
('Mohács', 'Baranya', 45.9928, 18.6836, 18486, true);

-- ============================================================================
-- WATER LEVEL STATIONS (3 stations)
-- ============================================================================

INSERT INTO water_level_stations (station_name, river_name, city_name, latitude, longitude, lnv_level, kkv_level, nv_level, is_active, display_in_comparison) VALUES
('Baja', 'Duna', 'Baja', 46.1811, 18.9550, 150, 300, 750, true, true),
('Mohács', 'Duna', 'Mohács', 45.9928, 18.6836, 120, 280, 700, true, true),
('Nagybajcs', 'Duna', 'Nagybajcs', 47.9025, 17.9619, 250, 450, 900, true, true);

-- ============================================================================
-- DROUGHT MONITORING LOCATIONS (5 locations)
-- ============================================================================

INSERT INTO drought_locations (location_name, location_type, county, latitude, longitude, is_active) VALUES
('Katymár', 'monitoring_station', 'Bács-Kiskun', 46.2167, 19.5667, true),
('Dávod', 'monitoring_station', 'Tolna', 46.4167, 18.7667, true),
('Szederkény', 'monitoring_station', 'Bács-Kiskun', 46.3833, 19.2500, true),
('Sükösd', 'monitoring_station', 'Bács-Kiskun', 46.2833, 19.0000, true),
('Csávoly', 'monitoring_station', 'Bács-Kiskun', 46.4500, 19.2833, true);

-- ============================================================================
-- GROUNDWATER WELLS (15 wells)
-- ============================================================================

INSERT INTO groundwater_wells (well_name, well_code, county, city_name, latitude, longitude, well_type, is_active) VALUES
('Sátorhely', '4576', 'Bács-Kiskun', 'Sátorhely', 46.3333, 19.3667, 'monitoring', true),
('Mohács', '1460', 'Baranya', 'Mohács', 45.9928, 18.6836, 'monitoring', true),
('Hercegszántó', '1450', 'Bács-Kiskun', 'Hercegszántó', 46.1833, 19.0167, 'monitoring', true),
('Alsónyék', '662', 'Tolna', 'Alsónyék', 46.2667, 18.5667, 'monitoring', true),
('Szekszárd-Borrév', '656', 'Tolna', 'Szekszárd', 46.3481, 18.7097, 'monitoring', true),
('Mohács II.', '912', 'Baranya', 'Mohács', 45.9928, 18.6836, 'monitoring', true),
('Mohács-Sárhát', '4481', 'Baranya', 'Mohács', 45.9928, 18.6836, 'monitoring', true),
('Nagybaracska', '4479', 'Bács-Kiskun', 'Nagybaracska', 46.1333, 18.9833, 'monitoring', true),
('Érsekcsanád', '1426', 'Bács-Kiskun', 'Érsekcsanád', 46.2833, 19.4167, 'monitoring', true),
('Őcsény', '653', 'Tolna', 'Őcsény', 46.3167, 18.6667, 'monitoring', true),
('Kölked', '1461', 'Baranya', 'Kölked', 46.0167, 18.7500, 'monitoring', true),
('Dávod', '448', 'Tolna', 'Dávod', 46.4167, 18.7667, 'monitoring', true),
('Szeremle', '132042', 'Bács-Kiskun', 'Szeremle', 46.5500, 19.0333, 'monitoring', true),
('Decs', '658', 'Tolna', 'Decs', 46.3833, 18.7167, 'monitoring', true),
('Báta', '660', 'Tolna', 'Báta', 46.2000, 18.7833, 'monitoring', true);

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Verify all locations are inserted
DO $$
DECLARE
  city_count INTEGER;
  station_count INTEGER;
  drought_count INTEGER;
  well_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO city_count FROM meteorology_cities;
  SELECT COUNT(*) INTO station_count FROM water_level_stations;
  SELECT COUNT(*) INTO drought_count FROM drought_locations;
  SELECT COUNT(*) INTO well_count FROM groundwater_wells;

  total_count := city_count + station_count + drought_count + well_count;

  RAISE NOTICE '===== SEED DATA VERIFICATION =====';
  RAISE NOTICE 'Meteorology Cities: % (expected: 4)', city_count;
  RAISE NOTICE 'Water Level Stations: % (expected: 3)', station_count;
  RAISE NOTICE 'Drought Locations: % (expected: 5)', drought_count;
  RAISE NOTICE 'Groundwater Wells: % (expected: 15)', well_count;
  RAISE NOTICE 'TOTAL LOCATIONS: % (expected: 27)', total_count;
  RAISE NOTICE '==================================';

  IF total_count != 27 THEN
    RAISE EXCEPTION 'Seed data verification failed: expected 27 locations, got %', total_count;
  END IF;

  RAISE NOTICE 'Seed data verification PASSED!';
END $$;

-- Display location summary
SELECT
  'Meteorology Cities' AS category,
  COUNT(*) AS count,
  STRING_AGG(name, ', ' ORDER BY name) AS locations
FROM meteorology_cities
UNION ALL
SELECT
  'Water Level Stations' AS category,
  COUNT(*) AS count,
  STRING_AGG(station_name, ', ' ORDER BY station_name) AS locations
FROM water_level_stations
UNION ALL
SELECT
  'Drought Locations' AS category,
  COUNT(*) AS count,
  STRING_AGG(location_name, ', ' ORDER BY location_name) AS locations
FROM drought_locations
UNION ALL
SELECT
  'Groundwater Wells' AS category,
  COUNT(*) AS count,
  STRING_AGG(well_name, ', ' ORDER BY well_name) AS locations
FROM groundwater_wells;

-- ============================================================================
-- CRITICAL WATER LEVELS VERIFICATION
-- ============================================================================

-- Verify critical water levels for Mohács (important for push notifications)
SELECT
  station_name,
  lnv_level AS "LNV (cm)",
  kkv_level AS "KKV (cm)",
  nv_level AS "NV (cm)"
FROM water_level_stations
WHERE station_name = 'Mohács';

-- Expected result for Mohács:
-- LNV: 120 cm (Legkisebb Navigációs Vízállás)
-- KKV: 280 cm (Közepes Kisvíz)
-- NV: 700 cm (Nagyvíz)
