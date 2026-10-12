-- DunApp PWA - Mért csapadék napi cron
-- Migration: 031_precipitation_measured_cron.sql
-- Created: 2026-10-12
-- Description: Naponta 07:30 UTC-kor meghívja a fetch-precipitation-measured Edge Function-t.
--
-- Miért 07:30: a HungaroMet napi csapadékmérő fájlja (HABP_1RD_YYYYMMDD) az előző nap
-- adatait tartalmazza, a mérés 06:45-kor van. A függvény mindig az összes elérhető
-- (9 napos) fájlt feldolgozza, ezért egy késve érkező vagy kiesett nap a következő
-- futásnál magától pótlódik.
--
-- FIGYELEM (dunapp-cron-fix.md, halott 5/6-os jobok): az Authorization fejléc kötelező,
-- különben a függvény 401-et ad, a cron mégis "sikeresnek" látszik. Alkalmazás után:
--   SELECT * FROM cron.job WHERE jobname = 'fetch-precipitation-measured-daily';
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
--   SELECT id, status_code, content FROM net._http_response ORDER BY created DESC LIMIT 5;

CREATE OR REPLACE FUNCTION invoke_fetch_precipitation_measured()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  project_url text := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0';
BEGIN
  SELECT net.http_post(
    url := project_url || '/functions/v1/fetch-precipitation-measured',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'Measured precipitation refresh triggered: request_id=%', request_id;
END;
$$;

COMMENT ON FUNCTION invoke_fetch_precipitation_measured() IS
  'Triggers fetch-precipitation-measured (HungaroMet station data). Daily at 07:30 UTC.';

SELECT cron.unschedule('fetch-precipitation-measured-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fetch-precipitation-measured-daily');

SELECT cron.schedule(
  'fetch-precipitation-measured-daily',
  '30 7 * * *',
  $$SELECT invoke_fetch_precipitation_measured()$$
);

SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'fetch-precipitation-measured-daily';
