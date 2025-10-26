-- Meteorológiai Városok Beszúrása (4 db)
-- DunApp PWA Project

INSERT INTO meteorology_cities (name, county, latitude, longitude, population, is_active, created_at, updated_at) VALUES
('Szekszárd', 'Tolna', 46.3481, 18.7097, 32833, true, NOW(), NOW()),
('Baja', 'Bács-Kiskun', 46.1811, 18.9550, 35989, true, NOW(), NOW()),
('Dunaszekcső', 'Baranya', 46.0833, 18.7667, 2453, true, NOW(), NOW()),
('Mohács', 'Baranya', 45.9928, 18.6836, 18486, true, NOW(), NOW());

-- Ellenőrzés
SELECT * FROM meteorology_cities ORDER BY name;
