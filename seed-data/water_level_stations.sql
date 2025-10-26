-- Vízállás Állomások Beszúrása (3 db)
-- DunApp PWA Project

INSERT INTO water_level_stations (
  station_name, 
  river_name, 
  city_name, 
  latitude, 
  longitude, 
  lnv_level, 
  kkv_level, 
  nv_level, 
  is_active, 
  created_at, 
  updated_at
) VALUES
('Baja', 'Duna', 'Baja', 46.1811, 18.9550, 150, 300, 750, true, NOW(), NOW()),
('Mohács', 'Duna', 'Mohács', 45.9928, 18.6836, 120, 280, 700, true, NOW(), NOW()),
('Nagybajcs', 'Duna', 'Nagybajcs', 47.9025, 17.9619, 250, 450, 900, true, NOW(), NOW());

-- Megjegyzés: LNV, KKV, NV értékek példa értékek
-- Valós kritikus szinteket az API/scraping során kell frissíteni

-- Ellenőrzés
SELECT * FROM water_level_stations ORDER BY station_name;
