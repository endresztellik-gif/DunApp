-- Aszály Monitoring Helyszínek Beszúrása (5 db)
-- DunApp PWA Project

INSERT INTO drought_locations (
  location_name, 
  location_type, 
  county, 
  latitude, 
  longitude, 
  is_active, 
  created_at, 
  updated_at
) VALUES
('Katymár', 'monitoring_station', 'Bács-Kiskun', 46.2167, 19.5667, true, NOW(), NOW()),
('Dávod', 'monitoring_station', 'Tolna', 46.4167, 18.7667, true, NOW(), NOW()),
('Szederkény', 'monitoring_station', 'Bács-Kiskun', 46.3833, 19.2500, true, NOW(), NOW()),
('Sükösd', 'monitoring_station', 'Bács-Kiskun', 46.2833, 19.0000, true, NOW(), NOW()),
('Csávoly', 'monitoring_station', 'Bács-Kiskun', 46.4500, 19.2833, true, NOW(), NOW());

-- Ellenőrzés
SELECT * FROM drought_locations ORDER BY location_name;
