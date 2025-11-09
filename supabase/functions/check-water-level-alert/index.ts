/**
 * Supabase Edge Function: check-water-level-alert
 *
 * Purpose: Check Mohács water level and trigger push notifications if >= 400cm
 * Created: 2025-11-03 (Phase 4.6c)
 * Trigger: Called by fetch-water-level Edge Function after data update
 *
 * Logic:
 * 1. Query latest Mohács water level
 * 2. Check if level >= 400cm threshold
 * 3. Check cooldown period (6 hours) to prevent spam
 * 4. If conditions met, call send-push-notification Edge Function
 * 5. Return summary of action taken
 *
 * Environment Variables Required:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for database access
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Configuration
const MOHACS_ALERT_THRESHOLD_CM = 400; // Alert if Mohács >= 400cm
const COOLDOWN_HOURS = 6; // Don't spam - wait 6 hours between alerts
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

/**
 * Main handler
 */
serve(async (req) => {
  // Allowed origins for CORS (SECURITY: No wildcard allowed)
  const allowedOrigins = [
    'https://dunapp.netlify.app',
    'https://dunapp-pwa.netlify.app',
    'http://localhost:5173',
    'http://localhost:5174',
  ];

  // Validate origin
  const origin = req.headers.get('origin');
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // Reject requests from unauthorized origins
  if (!isAllowedOrigin && req.method !== 'OPTIONS') {
    return new Response(
      JSON.stringify({ error: 'Forbidden - Invalid origin' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // CORS headers (using validated origin)
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚨 check-water-level-alert - Starting');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    // Check environment
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Get Mohács station UUID
    const { data: mohacsStation, error: stationError } = await supabase
      .from('water_level_stations')
      .select('id, name, station_id, alert_level_cm')
      .eq('name', 'Mohács')
      .single();

    if (stationError || !mohacsStation) {
      console.error('❌ Mohács station not found in database');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Mohács station not found',
          alert_sent: false,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📍 Mohács station: ${mohacsStation.id}`);
    console.log(`   Alert threshold: ${MOHACS_ALERT_THRESHOLD_CM} cm`);

    // Step 2: Get latest water level for Mohács
    const { data: latestData, error: dataError } = await supabase
      .from('water_level_data')
      .select('water_level_cm, measured_at')
      .eq('station_id', mohacsStation.id)
      .order('measured_at', { ascending: false })
      .limit(1)
      .single();

    if (dataError || !latestData) {
      console.error('❌ No water level data found for Mohács');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No water level data available',
          alert_sent: false,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentLevel = latestData.water_level_cm;
    console.log(`💧 Current Mohács level: ${currentLevel} cm (measured: ${latestData.measured_at})`);

    // Step 3: Check if level exceeds threshold
    if (currentLevel < MOHACS_ALERT_THRESHOLD_CM) {
      console.log(`✅ Level below threshold (${currentLevel} < ${MOHACS_ALERT_THRESHOLD_CM}), no alert needed`);
      return new Response(
        JSON.stringify({
          success: true,
          alert_sent: false,
          reason: 'Level below threshold',
          current_level: currentLevel,
          threshold: MOHACS_ALERT_THRESHOLD_CM,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`⚠️  Level EXCEEDS threshold (${currentLevel} >= ${MOHACS_ALERT_THRESHOLD_CM})`);

    // Step 4: Check cooldown period (last notification time)
    const { data: lastNotification, error: notificationError } = await supabase
      .from('push_subscriptions')
      .select('last_notified_at')
      .eq('notify_water_level', true)
      .eq('enabled', true)
      .order('last_notified_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    let shouldSendAlert = true;

    if (lastNotification?.last_notified_at) {
      const lastNotifiedAt = new Date(lastNotification.last_notified_at);
      const hoursSinceLastAlert = (now.getTime() - lastNotifiedAt.getTime()) / (1000 * 60 * 60);

      console.log(`⏱️  Last alert sent: ${lastNotifiedAt.toISOString()} (${hoursSinceLastAlert.toFixed(1)}h ago)`);

      if (hoursSinceLastAlert < COOLDOWN_HOURS) {
        shouldSendAlert = false;
        console.log(`❌ Cooldown active - skipping alert (need to wait ${(COOLDOWN_HOURS - hoursSinceLastAlert).toFixed(1)}h more)`);
      }
    } else {
      console.log('✅ No previous alerts found - first time notification');
    }

    // Step 5: Send alert if conditions are met
    if (!shouldSendAlert) {
      return new Response(
        JSON.stringify({
          success: true,
          alert_sent: false,
          reason: 'Cooldown active',
          current_level: currentLevel,
          threshold: MOHACS_ALERT_THRESHOLD_CM,
          cooldown_hours: COOLDOWN_HOURS,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call send-push-notification Edge Function
    console.log('📢 Calling send-push-notification...');

    const notificationPayload = {
      title: '💧 Vízutánpótlás Lehetséges',
      body: `A Belső-Béda vízrendszerbe ma lehetséges a vízutánpótlás`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'water-level-alert',
      data: {
        type: 'water-level-alert',
        station: 'Mohács',
        level: currentLevel,
        threshold: MOHACS_ALERT_THRESHOLD_CM,
        measured_at: latestData.measured_at,
      },
    };

    const pushResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const pushResult = await pushResponse.json();

    if (!pushResponse.ok) {
      console.error('❌ Failed to send push notifications:', pushResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send push notifications',
          details: pushResult,
          alert_sent: false,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Push notifications sent successfully');
    console.log(`   Total: ${pushResult.total || 0}, Sent: ${pushResult.sent || 0}, Failed: ${pushResult.failed || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        alert_sent: true,
        current_level: currentLevel,
        threshold: MOHACS_ALERT_THRESHOLD_CM,
        measured_at: latestData.measured_at,
        notification_result: {
          total: pushResult.total || 0,
          sent: pushResult.sent || 0,
          failed: pushResult.failed || 0,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ check-water-level-alert Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        alert_sent: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
