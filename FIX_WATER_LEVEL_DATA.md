# Vízállás Adatok Javítása - Útmutató

## Probléma
A vízállás modul **nem valós/aktuális adatokat** jelenít meg, mert a cron job **rossz Supabase projekt URL-t** használ.

## Javítás Lépései

### 1. Supabase Dashboard Megnyitása
Nyisd meg: https://supabase.com/dashboard/project/tihqkmzwfjhfltzskfgi/editor

### 2. SQL Editor Megnyitása
- Kattints a bal oldali menüben a **"SQL Editor"** gombra

### 3. Migration Futtatása
Másold be a következő SQL kódot és futtasd le (Run gomb):

```sql
-- Fix Water Level Cron Job URLs
-- This updates the function with the correct project URL

CREATE OR REPLACE FUNCTION invoke_fetch_water_level()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  -- CORRECT project URL and anon key
  project_url text := 'https://tihqkmzwfjhfltzskfgi.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpaHFrbXp3ZmpoZmx0enNrZmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzNzI2NjQsImV4cCI6MjA0NTk0ODY2NH0.r3o4lwda33Z6SOW6oazJIdQkLVKs2d4PLtm8TjjxqvA';
BEGIN
  SELECT net.http_post(
    url := project_url || '/functions/v1/fetch-water-level',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'Water level data refresh triggered: request_id=%', request_id;
END;
$$;
```

### 4. Friss Adatok Lekérése
A function létrehozása után futtasd le ezt is, hogy azonnal friss adatokat kapj:

```sql
-- Invoke the function to fetch fresh water level data NOW
SELECT invoke_fetch_water_level();
```

### 5. Ellenőrzés
Futtasd le ezt az SQL-t, hogy lásd a friss adatokat:

```sql
-- Check for fresh water level data
SELECT
  s.name,
  w.water_level_cm,
  w.flow_rate_m3s,
  w.water_temp_celsius,
  w.measured_at,
  w.source
FROM water_level_stations s
LEFT JOIN LATERAL (
  SELECT * FROM water_level_data
  WHERE station_id = s.id
  ORDER BY measured_at DESC
  LIMIT 1
) w ON true
WHERE s.is_active = true
ORDER BY s.name;
```

### 6. Cron Job Ellenőrzése
Ellenőrizd, hogy a cron job aktív-e:

```sql
-- Verify cron job is active
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'fetch-water-level-hourly';
```

## Eredmény
- ✅ A function most már a **helyes projekt URL-t** használja
- ✅ Friss vízállási adatok betöltve az adatbázisba
- ✅ A cron job **óránként automatikusan** frissíti az adatokat (minden óra :10-kor)
- ✅ A frontend most már **valós, aktuális adatokat** fog megjeleníteni

## Alternatív Módszer (Terminál)
Ha mégis terminálból szeretnéd:

```bash
# 1. Alkalmazd a migration-t
git add supabase/migrations/015_fix_water_level_cron_urls.sql
git commit -m "fix: Update water level cron job with correct project URL"

# 2. Push to Supabase (ha van hálózat)
# supabase db push --project-ref tihqkmzwfjhfltzskfgi
```

## Ellenőrzés a Böngészőben
Miután futott az SQL:
1. Nyisd meg az alkalmazást: http://localhost:5173
2. Menj a **Vízállás** modulba
3. Válassz egy állomást (Nagybajcs, Baja vagy Mohács)
4. A 3 kártyán **valós, aktuális adatoknak** kell megjelenniük!

---

**Következő automatikus frissítés:** A cron job minden óra 10. percében frissíti az adatokat.
