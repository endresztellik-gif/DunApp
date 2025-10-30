-- DunApp PWA - Cron Jobs Setup
-- Migration: 004_setup_cron_jobs.sql
-- Created: 2025-10-30
-- Description: Sets up automated data fetching with pg_cron

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- CRON JOB 1: Fetch Meteorology Data (every 20 minutes)
-- ============================================================================
-- Fetches weather data for 4 cities from OpenWeatherMap/Meteoblue/Yr.no
-- API calls: 288/day (well within 1,000/day limit)

SELECT cron.schedule(
  'fetch-meteorology',
  '*/20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-meteorology',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- CRON JOB 2: Fetch Water Level Data (every hour)
-- ============================================================================
-- Scrapes water level data for 3 stations from vizugy.hu and hydroinfo.hu
-- Scrapes: 24/day

SELECT cron.schedule(
  'fetch-water-level',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-water-level',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- CRON JOB 3: Fetch Drought Data (daily at 6:00 AM)
-- ============================================================================
-- Fetches drought monitoring data for 5 locations from aszalymonitoring.vizugy.hu
-- API calls: 5/day

SELECT cron.schedule(
  'fetch-drought',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-drought',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- CRON JOB 4: Check Water Level Alert (every 6 hours)
-- ============================================================================
-- Checks if Mohács water level >= 400 cm and sends push notifications
-- Checks: 4/day

SELECT cron.schedule(
  'check-water-level-alert',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/check-water-level-alert',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- List all scheduled jobs
DO $$
DECLARE
  job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count FROM cron.job;
  RAISE NOTICE 'Total cron jobs scheduled: %', job_count;

  IF job_count >= 4 THEN
    RAISE NOTICE 'Cron jobs setup SUCCESSFUL!';
  ELSE
    RAISE WARNING 'Expected 4+ cron jobs, found only %', job_count;
  END IF;
END $$;
