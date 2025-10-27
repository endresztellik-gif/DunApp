/**
 * DunApp PWA - Check Water Level Alert Edge Function
 *
 * PURPOSE:
 * - Checks water level at Mohács station
 * - Sends push notifications when level >= 400 cm
 * - Called by cron job every 6 hours
 *
 * TODO (Data Engineer):
 * 1. Implement water level checking logic
 * 2. Implement Web Push notification sending
 * 3. Add VAPID authentication
 * 4. Log notification sends to push_notification_logs table
 * 5. Handle expired subscriptions
 * 6. Add rate limiting to prevent spam
 *
 * Environment variables needed:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_SUBJECT (email or URL)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT'); // mailto:your-email@example.com

// Alert threshold for Mohács
const WATER_LEVEL_THRESHOLD = 400; // cm

serve(async (req) => {
  try {
    console.log('🚨 Check Water Level Alert Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      throw new Error('Missing VAPID credentials for push notifications');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // TODO: Implement actual water level checking and push notification logic
    // For now, return placeholder response

    console.log('✅ Check Water Level Alert Edge Function - Completed (placeholder)');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        threshold: WATER_LEVEL_THRESHOLD,
        status: 'placeholder',
        message: 'Data Engineer: Implement water level checking and push notification logic here',
        todo: [
          'Query latest water level for Mohács station',
          'Check if water level >= 400 cm',
          'If threshold met, get all push subscriptions for Mohács',
          'Send web push notifications using Web Push API',
          'Log each notification send to push_notification_logs',
          'Handle expired/invalid subscriptions',
          'Add rate limiting (max 1 notification per 6 hours per subscription)',
          'Implement retry logic for failed notifications'
        ]
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Check Water Level Alert Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * IMPLEMENTATION GUIDE (for Data Engineer):
 *
 * 1. Get Mohács station ID:
 *    const { data: mohacsStation } = await supabase
 *      .from('water_level_stations')
 *      .select('id')
 *      .eq('station_name', 'Mohács')
 *      .single();
 *
 * 2. Get latest water level:
 *    const { data: latestLevel } = await supabase
 *      .from('water_level_data')
 *      .select('water_level_cm, timestamp')
 *      .eq('station_id', mohacsStation.id)
 *      .order('timestamp', { ascending: false })
 *      .limit(1)
 *      .single();
 *
 * 3. Check threshold:
 *    if (latestLevel.water_level_cm >= WATER_LEVEL_THRESHOLD) {
 *      // Proceed with notifications
 *    } else {
 *      return { success: true, thresholdNotMet: true };
 *    }
 *
 * 4. Get all push subscriptions for Mohács:
 *    const { data: subscriptions } = await supabase
 *      .from('push_subscriptions')
 *      .select('*')
 *      .eq('station_id', mohacsStation.id);
 *
 * 5. Send push notification using Web Push API:
 *    import webpush from 'web-push';
 *
 *    webpush.setVapidDetails(
 *      VAPID_SUBJECT,
 *      VAPID_PUBLIC_KEY,
 *      VAPID_PRIVATE_KEY
 *    );
 *
 *    const payload = JSON.stringify({
 *      title: 'Vízállás Figyelmeztetés - Mohács',
 *      body: `A mai vízállás ${latestLevel.water_level_cm} cm. Lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!`,
 *      icon: '/icon-192x192.png',
 *      badge: '/badge-72x72.png',
 *      data: {
 *        station: 'Mohács',
 *        waterLevel: latestLevel.water_level_cm,
 *        timestamp: latestLevel.timestamp,
 *        url: '/water-level?station=mohacs'
 *      }
 *    });
 *
 *    for (const subscription of subscriptions) {
 *      try {
 *        await webpush.sendNotification(
 *          {
 *            endpoint: subscription.endpoint,
 *            keys: {
 *              p256dh: subscription.p256dh_key,
 *              auth: subscription.auth_key
 *            }
 *          },
 *          payload
 *        );
 *
 *        // Log successful send
 *        await supabase.from('push_notification_logs').insert({
 *          subscription_id: subscription.id,
 *          station_id: mohacsStation.id,
 *          water_level_cm: latestLevel.water_level_cm,
 *          notification_title: 'Vízállás Figyelmeztetés - Mohács',
 *          notification_body: payload.body,
 *          status: 'sent'
 *        });
 *
 *      } catch (error) {
 *        console.error('Push notification failed:', error);
 *
 *        // Log failed send
 *        await supabase.from('push_notification_logs').insert({
 *          subscription_id: subscription.id,
 *          station_id: mohacsStation.id,
 *          water_level_cm: latestLevel.water_level_cm,
 *          notification_title: 'Vízállás Figyelmeztetés - Mohács',
 *          notification_body: payload.body,
 *          status: 'failed',
 *          error_message: error.message
 *        });
 *
 *        // If subscription expired (410 Gone), delete it
 *        if (error.statusCode === 410) {
 *          await supabase
 *            .from('push_subscriptions')
 *            .delete()
 *            .eq('id', subscription.id);
 *        }
 *      }
 *    }
 *
 * 6. Rate limiting (optional):
 *    - Check push_notification_logs for recent sends
 *    - Only send if no notification sent in last 6 hours for this subscription
 *    - Prevents spam if water level stays above threshold
 *
 * 7. Return summary:
 *    return {
 *      success: true,
 *      notificationsSent: successCount,
 *      notificationsFailed: failureCount,
 *      waterLevel: latestLevel.water_level_cm,
 *      timestamp: new Date().toISOString()
 *    };
 */
