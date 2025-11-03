/**
 * Migration 011: Push Subscriptions Table
 *
 * Purpose: Store Web Push API subscriptions for sending notifications
 * Created: 2025-11-03 (Phase 4.6a)
 * Related: check-water-level-alert Edge Function
 *
 * Use Case: When Mohács water level >= 400cm, send push notification to all subscribed users
 */

-- ============================================================================
-- 0. DROP EXISTING TABLE (if exists)
-- ============================================================================

-- Drop existing table and all dependencies
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP FUNCTION IF EXISTS update_push_subscriptions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS cleanup_failed_subscriptions() CASCADE;
DROP FUNCTION IF EXISTS get_active_water_level_subscriptions() CASCADE;
DROP FUNCTION IF EXISTS mark_subscription_failure(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS mark_subscription_success(UUID) CASCADE;

-- ============================================================================
-- 1. CREATE TABLE: push_subscriptions
-- ============================================================================

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Subscription details (from PushSubscription API)
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL, -- Public key for encryption
  auth TEXT NOT NULL,   -- Auth secret for encryption

  -- User preferences
  user_agent TEXT,           -- Browser user agent string
  enabled BOOLEAN NOT NULL DEFAULT true,

  -- Notification preferences
  notify_water_level BOOLEAN NOT NULL DEFAULT true,  -- Mohács >= 400cm alerts
  notify_weather BOOLEAN NOT NULL DEFAULT false,     -- Severe weather alerts (future)
  notify_drought BOOLEAN NOT NULL DEFAULT false,     -- Drought alerts (future)

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ, -- Last time notification was sent

  -- Track failed deliveries
  failed_deliveries INTEGER NOT NULL DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  last_failure_reason TEXT
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- Index for finding enabled subscriptions
CREATE INDEX idx_push_subscriptions_enabled
  ON push_subscriptions(enabled)
  WHERE enabled = true;

-- Index for finding water level notification subscribers
CREATE INDEX idx_push_subscriptions_water_level
  ON push_subscriptions(notify_water_level, enabled)
  WHERE notify_water_level = true AND enabled = true;

-- Index for cleanup of failed subscriptions
CREATE INDEX idx_push_subscriptions_failed
  ON push_subscriptions(failed_deliveries, last_failure_at);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert their own subscription (unauthenticated users)
-- This is a public PWA, so we allow anonymous subscriptions
CREATE POLICY "Allow insert push subscriptions"
  ON push_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Users can update their own subscription by endpoint
CREATE POLICY "Allow update own push subscription"
  ON push_subscriptions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Users can delete their own subscription by endpoint
CREATE POLICY "Allow delete own push subscription"
  ON push_subscriptions
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Policy: Service role can read all subscriptions (for sending notifications)
CREATE POLICY "Allow service role to read all subscriptions"
  ON push_subscriptions
  FOR SELECT
  TO service_role
  USING (true);

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

/**
 * Function: update_updated_at_column()
 * Automatically update updated_at timestamp on row update
 */
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/**
 * Trigger: Automatically update updated_at on push_subscriptions UPDATE
 */
CREATE TRIGGER trigger_update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

/**
 * Function: cleanup_failed_subscriptions()
 * Mark subscriptions as disabled after 5 consecutive failed deliveries
 * Call this periodically to clean up dead subscriptions
 */
CREATE OR REPLACE FUNCTION cleanup_failed_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Disable subscriptions with 5+ failed deliveries
  UPDATE push_subscriptions
  SET enabled = false
  WHERE failed_deliveries >= 5
    AND enabled = true;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function: get_active_water_level_subscriptions()
 * Get all active subscriptions that want water level notifications
 * Used by check-water-level-alert Edge Function
 */
CREATE OR REPLACE FUNCTION get_active_water_level_subscriptions()
RETURNS TABLE (
  id UUID,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    push_subscriptions.id,
    push_subscriptions.endpoint,
    push_subscriptions.p256dh,
    push_subscriptions.auth
  FROM push_subscriptions
  WHERE enabled = true
    AND notify_water_level = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function: mark_subscription_failure()
 * Increment failed_deliveries counter and record failure details
 * Called when push notification delivery fails
 */
CREATE OR REPLACE FUNCTION mark_subscription_failure(
  subscription_id UUID,
  failure_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE push_subscriptions
  SET
    failed_deliveries = failed_deliveries + 1,
    last_failure_at = NOW(),
    last_failure_reason = COALESCE(failure_reason, last_failure_reason)
  WHERE id = subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function: mark_subscription_success()
 * Reset failed_deliveries counter and update last_notified_at
 * Called when push notification is successfully delivered
 */
CREATE OR REPLACE FUNCTION mark_subscription_success(
  subscription_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE push_subscriptions
  SET
    failed_deliveries = 0,
    last_notified_at = NOW(),
    last_failure_at = NULL,
    last_failure_reason = NULL
  WHERE id = subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE push_subscriptions IS 'Web Push API subscriptions for sending notifications';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Unique push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Public key for encryption (base64)';
COMMENT ON COLUMN push_subscriptions.auth IS 'Auth secret for encryption (base64)';
COMMENT ON COLUMN push_subscriptions.notify_water_level IS 'Enable Mohács >= 400cm alerts';
COMMENT ON COLUMN push_subscriptions.failed_deliveries IS 'Consecutive failed delivery count (auto-disable at 5)';

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on functions to anon and authenticated
GRANT EXECUTE ON FUNCTION update_push_subscriptions_updated_at() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_failed_subscriptions() TO service_role;
GRANT EXECUTE ON FUNCTION get_active_water_level_subscriptions() TO service_role;
GRANT EXECUTE ON FUNCTION mark_subscription_failure(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION mark_subscription_success(UUID) TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'Migration 011: Push Subscriptions Table - COMPLETE';
