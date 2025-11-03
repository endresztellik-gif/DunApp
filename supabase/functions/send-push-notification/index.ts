/**
 * Supabase Edge Function: send-push-notification
 *
 * Purpose: Send Web Push notifications to subscribed users
 * Created: 2025-11-03 (Phase 4.6b)
 * Trigger: Called by check-water-level-alert or manually
 *
 * Environment Variables Required:
 * - VAPID_PUBLIC_KEY: VAPID public key (base64url)
 * - VAPID_PRIVATE_KEY: VAPID private key (base64url)
 * - VAPID_SUBJECT: Contact email (mailto:...)
 *
 * Request Body:
 * {
 *   "title": "Alert Title",
 *   "body": "Notification message",
 *   "icon": "/icons/icon-192x192.png" (optional),
 *   "badge": "/icons/badge-72x72.png" (optional),
 *   "tag": "water-level-alert" (optional),
 *   "data": { ... } (optional),
 *   "subscriptionIds": ["uuid1", "uuid2"] (optional - if not provided, sends to all active)
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// VAPID keys and subject from environment
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:contact@dunapp.hu';

/**
 * Convert base64url to Uint8Array
 */
function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * Generate VAPID authentication header
 */
async function generateVAPIDHeaders(
  endpoint: string
): Promise<{ Authorization: string; 'Crypto-Key': string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.hostname}`;

  // JWT header
  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };

  // JWT payload
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours
  const payload = {
    aud: audience,
    exp: exp,
    sub: VAPID_SUBJECT,
  };

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Import private key for signing
  const privateKeyBuffer = base64UrlToUint8Array(VAPID_PRIVATE_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the JWT
  const dataToSign = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    dataToSign
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

  return {
    Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
    'Crypto-Key': `p256ecdsa=${VAPID_PUBLIC_KEY}`,
  };
}

/**
 * Encrypt notification payload
 */
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ body: Uint8Array; headers: Record<string, string> }> {
  // For simplicity, we'll send unencrypted payload
  // In production, implement full Web Push encryption (RFC 8291)
  const body = new TextEncoder().encode(payload);

  return {
    body,
    headers: {
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
    },
  };
}

/**
 * Send push notification to a single subscription
 */
async function sendPushToSubscription(
  subscription: {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, unknown>;
  },
  supabase: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Prepare notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/badge-72x72.png',
      tag: notification.tag || 'dunapp-notification',
      data: notification.data || {},
      timestamp: Date.now(),
    });

    // Generate VAPID headers
    const vapidHeaders = await generateVAPIDHeaders(subscription.endpoint);

    // Encrypt payload
    const { body, headers: encryptHeaders } = await encryptPayload(
      payload,
      subscription.p256dh,
      subscription.auth
    );

    // Send push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        ...vapidHeaders,
        ...encryptHeaders,
        TTL: '86400', // 24 hours
      },
      body: body,
    });

    if (response.ok || response.status === 201) {
      // Mark as successful
      await supabase.rpc('mark_subscription_success', {
        subscription_id: subscription.id,
      });

      return { success: true };
    } else {
      // Handle errors
      const errorText = await response.text();
      console.error(
        `Push failed for subscription ${subscription.id}:`,
        response.status,
        errorText
      );

      // Mark as failed
      await supabase.rpc('mark_subscription_failure', {
        subscription_id: subscription.id,
        failure_reason: `HTTP ${response.status}: ${errorText}`,
      });

      // If subscription is expired (410 Gone), disable it
      if (response.status === 410) {
        await supabase
          .from('push_subscriptions')
          .update({ enabled: false })
          .eq('id', subscription.id);
      }

      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`Exception sending push to ${subscription.id}:`, error);

    // Mark as failed
    await supabase.rpc('mark_subscription_failure', {
      subscription_id: subscription.id,
      failure_reason: error instanceof Error ? error.message : String(error),
    });

    return { success: false, error: String(error) };
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { title, body, icon, badge, tag, data, subscriptionIds } = await req.json();

    // Validate required fields
    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check VAPID configuration
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch subscriptions
    let query = supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('enabled', true);

    if (subscriptionIds && subscriptionIds.length > 0) {
      query = query.in('id', subscriptionIds);
    } else {
      // Send to all active water level notification subscribers
      query = query.eq('notify_water_level', true);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscriptions found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications
    const results = await Promise.all(
      subscriptions.map((sub) =>
        sendPushToSubscription(sub, { title, body, icon, badge, tag, data }, supabase)
      )
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        message: 'Push notifications sent',
        total: subscriptions.length,
        sent: successCount,
        failed: failureCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
