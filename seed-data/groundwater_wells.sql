-- Talajvízkutak Beszúrása (15 db)
-- DunApp PWA Project

INSERT INTO groundwater_wells (
  well_name, 
  well_code, 
  county, 
  city_name, 
  latitude, 
  longitude, 
  depth_meters, 
  well_type, 
  is_active, 
  created_at, 
  updated_at
) VALUES
('Sátorhely', '4576', 'Bács-Kiskun', 'Sátorhely', 46.3333, 19.3667, NULL, 'monitoring', true, NOW(), NOW()),
('Mohács', '1460', 'Baranya', 'Mohács', 45.9928, 18.6836, NULL, 'monitoring', true, NOW(), NOW()),
('Hercegszántó', '1450', 'Bács-Kiskun', 'Hercegszántó', 46.1833, 19.0167, NULL, 'monitoring', true, NOW(), NOW()),
('Alsónyék', '662', 'Tolna', 'Alsónyék', 46.2667, 18.5667, NULL, 'monitoring', true, NOW(), NOW()),
('Szekszárd-Borrév', '656', 'Tolna', 'Szekszárd', 46.3481, 18.7097, NULL, 'monitoring', true, NOW(), NOW()),
('Mohács II.', '912', 'Baranya', 'Mohács', 45.9928, 18.6836, NULL, 'monitoring', true, NOW(), NOW()),
('Mohács-Sárhát', '4481', 'Baranya', 'Mohács', 45.9928, 18.6836, NULL, 'monitoring', true, NOW(), NOW()),
('Nagybaracska', '4479', 'Bács-Kiskun', 'Nagybaracska', 46.1333, 18.9833, NULL, 'monitoring', true, NOW(), NOW()),
('Érsekcsanád', '1426', 'Bács-Kiskun', 'Érsekcsanád', 46.2833, 19.4167, NULL, 'monitoring', true, NOW(), NOW()),
('Őcsény', '653', 'Tolna', 'Őcsény', 46.3167, 18.6667, NULL, 'monitoring', true, NOW(), NOW()),
('Kölked', '1461', 'Baranya', 'Kölked', 46.0167, 18.7500, NULL, 'monitoring', true, NOW(), NOW()),
('Dávod', '448', 'Tolna', 'Dávod', 46.4167, 18.7667, NULL, 'monitoring', true, NOW(), NOW()),
('Szeremle', '132042', 'Bács-Kiskun', 'Szeremle', 46.5500, 19.0333, NULL, 'monitoring', true, NOW(), NOW()),
('Decs', '658', 'Tolna', 'Decs', 46.3833, 18.7167, NULL, 'monitoring', true, NOW(), NOW()),
('Báta', '660', 'Tolna', 'Báta', 46.2000, 18.7833, NULL, 'monitoring', true, NOW(), NOW());

-- Megjegyzés: depth_meters NULL, mert ezek az adatok később töltendők fel
-- az API/scraping során

-- Ellenőrzés
SELECT well_name, well_code, county, city_name FROM groundwater_wells ORDER BY well_name;

-- Kutak száma megyénként
SELECT county, COUNT(*) as well_count FROM groundwater_wells GROUP BY county ORDER BY county;
