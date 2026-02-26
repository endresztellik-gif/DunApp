-- Migration 026: Add Bátaapáti to meteorology_cities
-- Date: 2026-02-26
-- Purpose: Add Bátaapáti (Tolna county) as the 5th city in the Meteorology module

INSERT INTO meteorology_cities (name, county, latitude, longitude, population, is_active)
VALUES ('Bátaapáti', 'Tolna', 46.1900, 18.5700, 700, true);
