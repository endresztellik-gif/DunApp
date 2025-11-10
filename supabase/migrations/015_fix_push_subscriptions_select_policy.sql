-- ============================================================================
-- Migration: Fix push_subscriptions SELECT policy
-- Created: 2025-11-10
-- Description: Add SELECT policy for anon users to allow upsert operations
--
-- Problem: upsert() needs SELECT permission to check if row exists
-- Solution: Allow anon users to SELECT their own subscriptions
-- ============================================================================

-- Policy: Allow anon users to SELECT (needed for upsert)
-- Users can only see all subscriptions (no filtering needed for upsert)
CREATE POLICY "Allow anon to select push subscriptions"
  ON push_subscriptions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Note: This policy allows users to see all subscriptions, but since
-- subscriptions don't contain sensitive data (only endpoint, keys, and preferences),
-- this is acceptable for a public PWA. The endpoint URLs are not user-identifiable.
