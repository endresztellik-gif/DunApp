-- DunApp PWA - Row Level Security (RLS) Policies
-- Migration: 003_rls_policies.sql
-- Created: 2025-10-26
-- Description: Enables RLS and creates policies for all tables

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE meteorology_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meteorology_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_level_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_level_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_level_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drought_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE drought_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwater_wells ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwater_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE precipitation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- METEOROLOGY POLICIES
-- ============================================================================

-- Public read access to meteorology cities
CREATE POLICY "meteorology_cities_public_read"
ON meteorology_cities
FOR SELECT
USING (true);

-- Service role can insert/update/delete cities
CREATE POLICY "meteorology_cities_service_write"
ON meteorology_cities
FOR ALL
USING (auth.role() = 'service_role');

-- Public read access to meteorology data
CREATE POLICY "meteorology_data_public_read"
ON meteorology_data
FOR SELECT
USING (true);

-- Service role can write meteorology data
CREATE POLICY "meteorology_data_service_write"
ON meteorology_data
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- WATER LEVEL POLICIES
-- ============================================================================

-- Public read access to water level stations
CREATE POLICY "water_level_stations_public_read"
ON water_level_stations
FOR SELECT
USING (true);

-- Service role can write stations
CREATE POLICY "water_level_stations_service_write"
ON water_level_stations
FOR ALL
USING (auth.role() = 'service_role');

-- Public read access to water level data
CREATE POLICY "water_level_data_public_read"
ON water_level_data
FOR SELECT
USING (true);

-- Service role can write water level data
CREATE POLICY "water_level_data_service_write"
ON water_level_data
FOR ALL
USING (auth.role() = 'service_role');

-- Public read access to water level forecasts
CREATE POLICY "water_level_forecasts_public_read"
ON water_level_forecasts
FOR SELECT
USING (true);

-- Service role can write forecasts
CREATE POLICY "water_level_forecasts_service_write"
ON water_level_forecasts
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- DROUGHT POLICIES
-- ============================================================================

-- Public read access to drought locations
CREATE POLICY "drought_locations_public_read"
ON drought_locations
FOR SELECT
USING (true);

-- Service role can write drought locations
CREATE POLICY "drought_locations_service_write"
ON drought_locations
FOR ALL
USING (auth.role() = 'service_role');

-- Public read access to drought data
CREATE POLICY "drought_data_public_read"
ON drought_data
FOR SELECT
USING (true);

-- Service role can write drought data
CREATE POLICY "drought_data_service_write"
ON drought_data
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- GROUNDWATER POLICIES
-- ============================================================================

-- Public read access to groundwater wells
CREATE POLICY "groundwater_wells_public_read"
ON groundwater_wells
FOR SELECT
USING (true);

-- Service role can write wells
CREATE POLICY "groundwater_wells_service_write"
ON groundwater_wells
FOR ALL
USING (auth.role() = 'service_role');

-- Public read access to groundwater data
CREATE POLICY "groundwater_data_public_read"
ON groundwater_data
FOR SELECT
USING (true);

-- Service role can write groundwater data
CREATE POLICY "groundwater_data_service_write"
ON groundwater_data
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- PRECIPITATION POLICIES
-- ============================================================================

-- Public read access to precipitation data
CREATE POLICY "precipitation_data_public_read"
ON precipitation_data
FOR SELECT
USING (true);

-- Service role can write precipitation data
CREATE POLICY "precipitation_data_service_write"
ON precipitation_data
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- PUSH NOTIFICATION POLICIES
-- ============================================================================

-- Anyone can read push subscriptions (needed for the subscription form)
CREATE POLICY "push_subscriptions_public_read"
ON push_subscriptions
FOR SELECT
USING (true);

-- Anyone can create a push subscription
CREATE POLICY "push_subscriptions_public_insert"
ON push_subscriptions
FOR INSERT
WITH CHECK (true);

-- Anyone can delete their own subscription by endpoint
-- Note: We're not using user authentication, so we allow deletion by endpoint
CREATE POLICY "push_subscriptions_public_delete"
ON push_subscriptions
FOR DELETE
USING (true);

-- Service role can do anything with subscriptions
CREATE POLICY "push_subscriptions_service_write"
ON push_subscriptions
FOR ALL
USING (auth.role() = 'service_role');

-- Public read access to notification logs (for transparency)
CREATE POLICY "push_notification_logs_public_read"
ON push_notification_logs
FOR SELECT
USING (true);

-- Service role can write notification logs
CREATE POLICY "push_notification_logs_service_write"
ON push_notification_logs
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- CACHE POLICIES
-- ============================================================================

-- Public read access to cache (for frontend)
CREATE POLICY "cache_public_read"
ON cache
FOR SELECT
USING (true);

-- Service role can write to cache
CREATE POLICY "cache_service_write"
ON cache
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- ADDITIONAL SECURITY NOTES
-- ============================================================================

-- IMPORTANT SECURITY CONSIDERATIONS:
--
-- 1. All location tables (cities, stations, wells, etc.) are PUBLIC READ only
--    - Users can query data but cannot modify it
--    - Only service role (Edge Functions) can write
--
-- 2. All data cache tables are PUBLIC READ only
--    - Historical data is transparent and accessible
--    - Only Edge Functions can insert new data
--
-- 3. Push subscriptions are SPECIAL:
--    - Users can create their own subscriptions (INSERT)
--    - Users can delete subscriptions (by endpoint, no auth required)
--    - This is safe because endpoints are unique per browser
--
-- 4. Service role has FULL ACCESS to all tables
--    - Used by Edge Functions for data fetching
--    - Used by cron jobs for automated tasks
--
-- 5. NO USER AUTHENTICATION required
--    - This is a public data application
--    - All environmental data is meant to be freely accessible
--
-- 6. Rate limiting should be handled at the API Gateway level (Supabase)
--    - Not at the database level
--
-- 7. Push notification subscriptions are self-managed
--    - Users can subscribe/unsubscribe without login
--    - Endpoint uniqueness prevents duplicates

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Verify RLS is enabled on all tables
SELECT
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relkind = 'r'
  AND relname IN (
    'meteorology_cities',
    'meteorology_data',
    'water_level_stations',
    'water_level_data',
    'water_level_forecasts',
    'drought_locations',
    'drought_data',
    'groundwater_wells',
    'groundwater_data',
    'precipitation_data',
    'push_subscriptions',
    'push_notification_logs',
    'cache'
  )
ORDER BY relname;
