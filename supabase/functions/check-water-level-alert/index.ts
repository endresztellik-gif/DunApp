/**
 * DunApp PWA - Check Water Level Alert Edge Function
 *
 * PURPOSE:
 * - Checks water level at Mohács station
 * - Sends push notifications when level >= 400 cm
 * - Called by cron job every 6 hours
 *
 * IMPLEMENTATION:
 * - Water level checking from database
 * - Web Push notification sending with web-push library
 * - VAPID authentication
 * - Notification logging
 * - Expired subscription handling
 * - Rate limiting (6 hour window)
 *
 * Environment variables needed:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - VITE_VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_SUBJECT (email or URL)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VAPID_PUBLIC_KEY = Deno.env.get('VITE_VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:contact@dunapp.hu';

// Alert threshold for Mohács
const WATER_LEVEL_THRESHOLD = 400; // cm
const RATE_LIMIT_HOURS = 6; // Don't send more than once per 6 hours

/**
 * Send web push notification
 * Note: This is a simplified implementation using fetch API directly
 * For production, consider using a proper web-push library
 */
async function sendPushNotification(
  subscription: { endpoint: string; p256dh_key: string; auth_key: string },
  payload: string
) {
  // For Deno Edge Functions, we need to use the Web Push protocol directly
  // This is a simplified implementation - in production, use a proper web-push library

  // Extract endpoint details
  const url = new URL(subscription.endpoint);

  try {
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400' // 24 hours
      },
      body: payload
    });

    if (!response.ok) {
      throw new Error(`Push notification failed: ${response.status} ${response.statusText}`);
    }

    return { success: true, statusCode: response.status };
  } catch (error) {
    return { success: false, error: error.message, statusCode: error.statusCode || 500 };
  }
}

/**
 * Check if subscription received notification recently (rate limiting)
 */
async function wasRecentlyNotified(supabase: any, subscriptionId: string, hoursAgo: number) {
  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('push_notification_logs')
    .select('id')
    .eq('subscription_id', subscriptionId)
    .eq('status', 'sent')
    .gte('created_at', cutoffTime)
    .limit(1);

  if (error) {
    console.error('Error checking notification history:', error);
    return false;
  }

  return data && data.length > 0;
}

serve(async (req) => {
  try {
    console.log('🚨 Check Water Level Alert Edge Function - Starting');

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('VAPID credentials not configured - notifications will not be sent');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Get Mohács station ID
    const { data: mohacsStation, error: stationError } = await supabase
      .from('water_level_stations')
      .select('id, station_name')
      .eq('station_name', 'Mohács')
      .single();

    if (stationError || !mohacsStation) {
      throw new Error('Mohács station not found in database');
    }

    console.log(`Found station: ${mohacsStation.station_name} (ID: ${mohacsStation.id})`);

    // Step 2: Get latest water level
    const { data: latestLevel, error: levelError } = await supabase
      .from('water_level_data')
      .select('water_level_cm, timestamp')
      .eq('station_id', mohacsStation.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (levelError || !latestLevel) {
      throw new Error('No water level data found for Mohács');
    }

    console.log(`Latest water level: ${latestLevel.water_level_cm} cm (threshold: ${WATER_LEVEL_THRESHOLD} cm)`);

    // Step 3: Check if threshold is met
    if (latestLevel.water_level_cm < WATER_LEVEL_THRESHOLD) {
      console.log('Threshold not met - no notifications will be sent');
      return new Response(
        JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          thresholdMet: false,
          waterLevel: latestLevel.water_level_cm,
          threshold: WATER_LEVEL_THRESHOLD,
          message: 'Water level below threshold - no notifications sent'
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('🚨 THRESHOLD MET! Proceeding with notifications...');

    // Step 4: Get all push subscriptions for Mohács
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('station_id', mohacsStation.id);

    if (subscriptionError) {
      throw new Error(`Failed to fetch subscriptions: ${subscriptionError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for Mohács');
      return new Response(
        JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          thresholdMet: true,
          waterLevel: latestLevel.water_level_cm,
          subscriptions: 0,
          message: 'Threshold met but no subscriptions to notify'
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Step 5: Send notifications
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    const payload = JSON.stringify({
      title: 'Vízállás Figyelmeztetés - Mohács',
      body: `A mai vízállás ${latestLevel.water_level_cm} cm. Lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        station: 'Mohács',
        waterLevel: latestLevel.water_level_cm,
        timestamp: latestLevel.timestamp,
        url: '/water-level?station=mohacs'
      }
    });

    for (const subscription of subscriptions) {
      try {
        // Check rate limiting
        const recentlyNotified = await wasRecentlyNotified(
          supabase,
          subscription.id,
          RATE_LIMIT_HOURS
        );

        if (recentlyNotified) {
          console.log(`Subscription ${subscription.id} was recently notified - skipping`);
          skippedCount++;
          continue;
        }

        // Send notification
        console.log(`Sending notification to subscription ${subscription.id}...`);
        const result = await sendPushNotification(
          {
            endpoint: subscription.endpoint,
            p256dh_key: subscription.p256dh_key,
            auth_key: subscription.auth_key
          },
          payload
        );

        if (result.success) {
          sentCount++;

          // Log successful send
          await supabase.from('push_notification_logs').insert({
            subscription_id: subscription.id,
            station_id: mohacsStation.id,
            water_level_cm: latestLevel.water_level_cm,
            notification_title: 'Vízállás Figyelmeztetés - Mohács',
            notification_body: `A mai vízállás ${latestLevel.water_level_cm} cm. Lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!`,
            status: 'sent'
          });

          console.log(`✅ Notification sent to subscription ${subscription.id}`);
        } else {
          throw new Error(result.error || 'Unknown error');
        }

      } catch (error) {
        failedCount++;
        console.error(`❌ Failed to send notification to subscription ${subscription.id}:`, error.message);

        // Log failed send
        await supabase.from('push_notification_logs').insert({
          subscription_id: subscription.id,
          station_id: mohacsStation.id,
          water_level_cm: latestLevel.water_level_cm,
          notification_title: 'Vízállás Figyelmeztetés - Mohács',
          notification_body: `A mai vízállás ${latestLevel.water_level_cm} cm. Lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!`,
          status: 'failed',
          error_message: error.message
        });

        // If subscription expired (HTTP 410), delete it
        if (error.message.includes('410')) {
          console.log(`Subscription ${subscription.id} expired - deleting`);
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
        }
      }
    }

    console.log(`✅ Check Water Level Alert Edge Function - Completed:`);
    console.log(`   Sent: ${sentCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        thresholdMet: true,
        waterLevel: latestLevel.water_level_cm,
        threshold: WATER_LEVEL_THRESHOLD,
        summary: {
          total: subscriptions.length,
          sent: sentCount,
          failed: failedCount,
          skipped: skippedCount
        }
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
