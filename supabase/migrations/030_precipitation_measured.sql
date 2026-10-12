-- DunApp PWA - Mért csapadék (HungaroMet) párhuzamos rendszer
-- Migration: 030_precipitation_measured.sql
-- Created: 2026-10-12
-- Description: Mérőállomásos / IDW-interpolált csapadék-összesítés, a meglévő
--              Open-Meteo alapú `precipitation_summary` MELLETT (azt nem módosítja).
--
-- Adatfolyam: fetch-precipitation-measured Edge Function
--   HungaroMet napi csapadékmérők  ->  precipitation_station_daily   (nyers állomásmérés)
--                                  ->  precipitation_city_daily      (városonkénti napi érték)
--                                  ->  precipitation_measured_summary (amit a frontend olvas)
--   + precipitation_compare_log: a régi és az új rendszer napi értékei 2027-es összevetéshez.
--
-- A tárgyév mindig az adott év január 1-jétől számolódik (lásd Edge Function).
-- Forrás: Meteorológiai Adattár, HungaroMet Nonprofit Zrt.

-- ============================================================================
-- 1. Nyers állomásmérések (csak a városok 30 km-es körzetébe eső állomások)
-- ============================================================================
CREATE TABLE IF NOT EXISTS precipitation_station_daily (
  station_id   TEXT NOT NULL,
  obs_date     DATE NOT NULL,           -- a mérés napja (06:45-től másnap 06:45-ig tartó időszak)
  mm           NUMERIC(6,1) NOT NULL,   -- napi csapadékösszeg
  station_name TEXT NOT NULL,
  lat          NUMERIC(8,4) NOT NULL,
  lon          NUMERIC(8,4) NOT NULL,
  elevation    NUMERIC(6,1),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (station_id, obs_date)
);

COMMENT ON TABLE precipitation_station_daily IS
  'HungaroMet napi csapadékmérők nyers adata (HABP_1RD). A hiányzó nap (-999) nincs eltárolva, sosem 0 mm.';

-- ============================================================================
-- 2. Városonkénti napi érték
-- ============================================================================
CREATE TABLE IF NOT EXISTS precipitation_city_daily (
  city_id    UUID NOT NULL REFERENCES meteorology_cities(id) ON DELETE CASCADE,
  obs_date   DATE NOT NULL,
  mm         NUMERIC(6,1) NOT NULL,
  method     TEXT NOT NULL CHECK (method IN ('station', 'idw', 'model')),
  n_stations INTEGER NOT NULL DEFAULT 0,   -- 'model' esetén 0
  nearest_km NUMERIC(6,1),                 -- a legközelebbi felhasznált állomás távolsága
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (city_id, obs_date)
);

COMMENT ON COLUMN precipitation_city_daily.method IS
  'station = ≤10 km-es állomás közvetlen értéke; idw = távolsággal súlyozott átlag (≤30 km, 2–4 állomás); model = Open-Meteo Archive (csak visszatöltés résének pótlására)';

-- ============================================================================
-- 3. Összesítés – ezt olvassa a frontend (a precipitation_summary mintájára)
-- ============================================================================
CREATE TABLE IF NOT EXISTS precipitation_measured_summary (
  city_id            UUID PRIMARY KEY REFERENCES meteorology_cities(id) ON DELETE CASCADE,
  last_7_days        NUMERIC(7,1),
  last_30_days       NUMERIC(8,1),
  year_to_date       NUMERIC(9,1),
  days_available_7   INTEGER NOT NULL DEFAULT 0,
  days_available_30  INTEGER NOT NULL DEFAULT 0,
  days_measured_ytd  INTEGER NOT NULL DEFAULT 0,   -- mért / interpolált napok
  days_modeled_ytd   INTEGER NOT NULL DEFAULT 0,   -- Open-Meteo-val pótolt napok
  days_expected_ytd  INTEGER NOT NULL DEFAULT 0,   -- január 1-től data_through-ig
  data_through       DATE NOT NULL,                -- az utolsó feldolgozott mérési nap
  method             TEXT NOT NULL CHECK (method IN ('station', 'idw')),
  stations           JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{id, name, km}]
  nearest_km         NUMERIC(6,1),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE precipitation_measured_summary IS
  'Városonkénti 7 / 30 napos és tárgyévi (adott év jan. 1-től) csapadék mért vagy interpolált állomásadatból. Nincs sor = nincs elég közeli mérőállomás.';

-- ============================================================================
-- 4. Összevetési napló: régi (Open-Meteo) vs új (mért) – 2027-es értékeléshez
-- ============================================================================
CREATE TABLE IF NOT EXISTS precipitation_compare_log (
  city_id    UUID NOT NULL REFERENCES meteorology_cities(id) ON DELETE CASCADE,
  log_date   DATE NOT NULL,
  old_7      NUMERIC(7,1),
  old_30     NUMERIC(8,1),
  old_ytd    NUMERIC(9,1),
  new_7      NUMERIC(7,1),
  new_30     NUMERIC(8,1),
  new_ytd    NUMERIC(9,1),
  method     TEXT,
  PRIMARY KEY (city_id, log_date)
);

-- ============================================================================
-- RLS: anon csak olvashat az összesítést; a többi tábla csak service_role
-- ============================================================================
ALTER TABLE precipitation_station_daily    ENABLE ROW LEVEL SECURITY;
ALTER TABLE precipitation_city_daily       ENABLE ROW LEVEL SECURITY;
ALTER TABLE precipitation_measured_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE precipitation_compare_log      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to precipitation_measured_summary"
  ON precipitation_measured_summary FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read access to precipitation_city_daily"
  ON precipitation_city_daily FOR SELECT TO anon USING (true);

CREATE POLICY "Allow service role full access to precipitation_station_daily"
  ON precipitation_station_daily FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to precipitation_city_daily"
  ON precipitation_city_daily FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to precipitation_measured_summary"
  ON precipitation_measured_summary FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to precipitation_compare_log"
  ON precipitation_compare_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'precipitation_%'
ORDER BY table_name;
