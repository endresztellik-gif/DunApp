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
 * HKDF-SHA-256 extract step
 */
async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    salt,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const prk = await crypto.subtle.sign('HMAC', key, ikm);
  return new Uint8Array(prk);
}

/**
 * HKDF-SHA-256 expand step
 */
async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    prk,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const output = new Uint8Array(length);
  let t = new Uint8Array(0);
  let offset = 0;
  let counter = 1;

  while (offset < length) {
    const input = new Uint8Array(t.length + info.length + 1);
    input.set(t);
    input.set(info, t.length);
    input[t.length + info.length] = counter;

    t = new Uint8Array(await crypto.subtle.sign('HMAC', key, input));
    const copyLength = Math.min(t.length, length - offset);
    output.set(t.subarray(0, copyLength), offset);
    offset += copyLength;
    counter++;
  }

  return output;
}

/**
 * Encrypt notification payload using RFC 8291 (Web Push Encryption)
 * Implements aes128gcm content encoding with ECDH P-256 key exchange
 */
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ body: Uint8Array; headers: Record<string, string> }> {
  try {
    // Step 1: Decode subscriber keys
    const userPublicKey = base64UrlToUint8Array(p256dh);
    const userAuthSecret = base64UrlToUint8Array(auth);

    // Step 2: Generate ephemeral ECDH key pair
    const serverKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );

    // Step 3: Export server public key (uncompressed format)
    const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
    const serverPublicKey = new Uint8Array(serverPublicKeyRaw);

    // Step 4: Import subscriber's public key
    const userKey = await crypto.subtle.importKey(
      'raw',
      userPublicKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    // Step 5: Perform ECDH to derive shared secret
    const sharedSecret = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: userKey },
      serverKeyPair.privateKey,
      256
    );

    // Step 6: Derive encryption keys using HKDF
    const ikm = new Uint8Array(sharedSecret);

    // PRK = HKDF-Extract(auth_secret, shared_secret)
    const prk = await hkdfExtract(userAuthSecret, ikm);

    // Build info for key derivation: "WebPush: info" || ua_public || as_public
    const infoPrefix = new TextEncoder().encode('WebPush: info\x00');
    const keyInfo = new Uint8Array(infoPrefix.length + userPublicKey.length + serverPublicKey.length);
    keyInfo.set(infoPrefix);
    keyInfo.set(userPublicKey, infoPrefix.length);
    keyInfo.set(serverPublicKey, infoPrefix.length + userPublicKey.length);

    // Derive IKM for content encryption
    const contentIkm = await hkdfExpand(prk, keyInfo, 32);

    // Step 7: Generate random salt (16 bytes)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Step 8: Derive Content Encryption Key (CEK) and Nonce
    const prkContent = await hkdfExtract(salt, contentIkm);

    const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\x00');
    const cek = await hkdfExpand(prkContent, cekInfo, 16);

    const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\x00');
    const nonce = await hkdfExpand(prkContent, nonceInfo, 12);

    // Step 9: Pad payload (RFC 8188 padding: data + 0x02 + padding)
    const paddingLength = 0; // No extra padding needed for small notifications
    const paddedPayload = new Uint8Array(payload.length + 1 + paddingLength);
    const payloadBytes = new TextEncoder().encode(payload);
    paddedPayload.set(payloadBytes);
    paddedPayload[payloadBytes.length] = 0x02; // Padding delimiter

    // Step 10: Encrypt with AES-128-GCM
    const contentKey = await crypto.subtle.importKey(
      'raw',
      cek,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, tagLength: 128 },
      contentKey,
      paddedPayload
    );

    // Step 11: Build the encrypted record (aes128gcm format)
    // Format: salt (16) + rs (4) + idlen (1) + public_key (65) + ciphertext
    const recordSize = 4096; // Standard record size
    const encryptedRecord = new Uint8Array(16 + 4 + 1 + serverPublicKey.length + ciphertext.byteLength);

    let offset = 0;
    encryptedRecord.set(salt, offset);
    offset += 16;

    // Record size (4 bytes, big-endian)
    const rsBytes = new Uint8Array(4);
    new DataView(rsBytes.buffer).setUint32(0, recordSize, false);
    encryptedRecord.set(rsBytes, offset);
    offset += 4;

    // Public key length (1 byte)
    encryptedRecord[offset++] = serverPublicKey.length;

    // Server public key
    encryptedRecord.set(serverPublicKey, offset);
    offset += serverPublicKey.length;

    // Ciphertext
    encryptedRecord.set(new Uint8Array(ciphertext), offset);

    return {
      body: encryptedRecord,
      headers: {
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
      },
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(`Payload encryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate notification payload (SECURITY: Input validation)
 */
function validateNotificationPayload(payload: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Title validation
  if (!payload.title || typeof payload.title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (payload.title.length === 0) {
    errors.push('Title cannot be empty');
  } else if (payload.title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }

  // Body validation
  if (!payload.body || typeof payload.body !== 'string') {
    errors.push('Body is required and must be a string');
  } else if (payload.body.length === 0) {
    errors.push('Body cannot be empty');
  } else if (payload.body.length > 500) {
    errors.push('Body must be 500 characters or less');
  }

  // Icon validation (optional)
  if (payload.icon !== undefined) {
    if (typeof payload.icon !== 'string') {
      errors.push('Icon must be a string');
    } else if (payload.icon.length > 500) {
      errors.push('Icon URL must be 500 characters or less');
    }
  }

  // Badge validation (optional)
  if (payload.badge !== undefined) {
    if (typeof payload.badge !== 'string') {
      errors.push('Badge must be a string');
    } else if (payload.badge.length > 500) {
      errors.push('Badge URL must be 500 characters or less');
    }
  }

  // Tag validation (optional)
  if (payload.tag !== undefined) {
    if (typeof payload.tag !== 'string') {
      errors.push('Tag must be a string');
    } else if (payload.tag.length > 100) {
      errors.push('Tag must be 100 characters or less');
    }
  }

  // Data validation (optional)
  if (payload.data !== undefined) {
    if (typeof payload.data !== 'object' || payload.data === null || Array.isArray(payload.data)) {
      errors.push('Data must be an object');
    } else {
      // Check data size (prevent DoS attacks)
      const dataSize = JSON.stringify(payload.data).length;
      if (dataSize > 2000) {
        errors.push('Data payload must be 2000 characters or less');
      }
    }
  }

  // subscriptionIds validation (optional)
  if (payload.subscriptionIds !== undefined) {
    if (!Array.isArray(payload.subscriptionIds)) {
      errors.push('subscriptionIds must be an array');
    } else if (payload.subscriptionIds.length > 100) {
      errors.push('Cannot send to more than 100 subscriptions at once');
    } else {
      // Validate each ID is a string
      const invalidIds = payload.subscriptionIds.filter((id: any) => typeof id !== 'string');
      if (invalidIds.length > 0) {
        errors.push('All subscriptionIds must be strings');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
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
    // Parse request body (SECURITY: Input validation)
    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate request payload
    const validation = validateNotificationPayload(requestBody);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title, body, icon, badge, tag, data, subscriptionIds } = requestBody;

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
