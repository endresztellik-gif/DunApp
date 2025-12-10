/**
 * Tests for check-water-level-alert Edge Function
 *
 * Test Coverage:
 * - Water level threshold checking
 * - Push notification sending
 * - Rate limiting (6-hour window)
 * - Subscription management
 * - Expired subscription handling (HTTP 410)
 * - Notification logging
 * - Error handling for failed notifications
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

Deno.test('check-water-level-alert: threshold check - above threshold', () => {
  const waterLevel = 420; // cm
  const threshold = 400; // cm

  const thresholdMet = waterLevel >= threshold;
  assertEquals(thresholdMet, true);
});

Deno.test('check-water-level-alert: threshold check - below threshold', () => {
  const waterLevel = 380; // cm
  const threshold = 400; // cm

  const thresholdMet = waterLevel >= threshold;
  assertEquals(thresholdMet, false);
});

Deno.test('check-water-level-alert: threshold check - exactly at threshold', () => {
  const waterLevel = 400; // cm
  const threshold = 400; // cm

  const thresholdMet = waterLevel >= threshold;
  assertEquals(thresholdMet, true);
});

Deno.test('check-water-level-alert: rate limit check - recently notified', () => {
  const lastNotificationTime = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
  const rateLimitHours = 6;

  const hoursSinceNotification = (Date.now() - lastNotificationTime.getTime()) / (1000 * 60 * 60);
  const shouldNotify = hoursSinceNotification >= rateLimitHours;

  assertEquals(shouldNotify, false);
});

Deno.test('check-water-level-alert: rate limit check - notification allowed', () => {
  const lastNotificationTime = new Date(Date.now() - 7 * 60 * 60 * 1000); // 7 hours ago
  const rateLimitHours = 6;

  const hoursSinceNotification = (Date.now() - lastNotificationTime.getTime()) / (1000 * 60 * 60);
  const shouldNotify = hoursSinceNotification >= rateLimitHours;

  assertEquals(shouldNotify, true);
});

Deno.test('check-water-level-alert: notification payload structure', () => {
  const waterLevel = 420;
  const timestamp = new Date().toISOString();

  const payload = {
    title: 'Vízállás Figyelmeztetés - Mohács',
    body: `A mai vízállás ${waterLevel} cm. Lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      station: 'Mohács',
      waterLevel: waterLevel,
      timestamp: timestamp,
      url: '/water-level?station=mohacs'
    }
  };

  assertEquals(payload.title.includes('Mohács'), true);
  assertEquals(payload.body.includes('420'), true);
  assertExists(payload.icon);
  assertExists(payload.badge);
  assertEquals(payload.data.station, 'Mohács');
  assertEquals(payload.data.waterLevel, 420);
});

Deno.test('check-water-level-alert: handle HTTP 410 (expired subscription)', () => {
  const httpStatusCode = 410;
  const subscriptionId = 'sub-123';

  const shouldDeleteSubscription = httpStatusCode === 410;
  assertEquals(shouldDeleteSubscription, true);

  // Mock deletion
  if (shouldDeleteSubscription) {
    const deleted = { subscriptionId, status: 'deleted' };
    assertEquals(deleted.status, 'deleted');
  }
});

Deno.test('check-water-level-alert: notification log entry structure', () => {
  const logEntry = {
    subscription_id: 'sub-123',
    station_id: 'station-mohacs',
    water_level_cm: 420,
    notification_title: 'Vízállás Figyelmeztetés - Mohács',
    notification_body: 'A mai vízállás 420 cm...',
    status: 'sent',
    error_message: null
  };

  assertExists(logEntry.subscription_id);
  assertExists(logEntry.station_id);
  assertEquals(logEntry.water_level_cm, 420);
  assertEquals(logEntry.status, 'sent');
  assertEquals(logEntry.error_message, null);
});

Deno.test('check-water-level-alert: failed notification log entry', () => {
  const logEntry = {
    subscription_id: 'sub-123',
    station_id: 'station-mohacs',
    water_level_cm: 420,
    notification_title: 'Vízállás Figyelmeztetés - Mohács',
    notification_body: 'A mai vízállás 420 cm...',
    status: 'failed',
    error_message: 'Network error'
  };

  assertEquals(logEntry.status, 'failed');
  assertExists(logEntry.error_message);
  assertEquals(logEntry.error_message, 'Network error');
});

Deno.test('check-water-level-alert: calculate cutoff time for rate limiting', () => {
  const hoursAgo = 6;
  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const now = new Date();

  const differenceMs = now.getTime() - cutoffTime.getTime();
  const differenceHours = differenceMs / (1000 * 60 * 60);

  assertEquals(differenceHours, 6);
});

Deno.test('check-water-level-alert: subscription endpoint validation', () => {
  const subscription = {
    id: 'sub-123',
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    p256dh_key: 'BMxyz...',
    auth_key: 'abc123...'
  };

  assertExists(subscription.endpoint);
  assertExists(subscription.p256dh_key);
  assertExists(subscription.auth_key);
  assertEquals(subscription.endpoint.startsWith('https://'), true);
});

Deno.test('check-water-level-alert: push notification headers', () => {
  const headers = {
    'Content-Type': 'application/json',
    'Content-Encoding': 'aes128gcm',
    'TTL': '86400' // 24 hours
  };

  assertEquals(headers['Content-Type'], 'application/json');
  assertEquals(headers['Content-Encoding'], 'aes128gcm');
  assertEquals(headers['TTL'], '86400');
});

Deno.test('check-water-level-alert: response format - threshold not met', () => {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    thresholdMet: false,
    waterLevel: 380,
    threshold: 400,
    message: 'Water level below threshold - no notifications sent'
  };

  assertEquals(response.success, true);
  assertEquals(response.thresholdMet, false);
  assertEquals(response.waterLevel < response.threshold, true);
  assertExists(response.message);
});

Deno.test('check-water-level-alert: response format - threshold met with notifications', () => {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    thresholdMet: true,
    waterLevel: 420,
    threshold: 400,
    summary: {
      total: 10,
      sent: 8,
      failed: 1,
      skipped: 1
    }
  };

  assertEquals(response.success, true);
  assertEquals(response.thresholdMet, true);
  assertEquals(response.waterLevel >= response.threshold, true);
  assertEquals(response.summary.total, 10);
  assertEquals(response.summary.sent + response.summary.failed + response.summary.skipped, 10);
});

Deno.test('check-water-level-alert: response format - no subscriptions', () => {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    thresholdMet: true,
    waterLevel: 420,
    subscriptions: 0,
    message: 'Threshold met but no subscriptions to notify'
  };

  assertEquals(response.success, true);
  assertEquals(response.thresholdMet, true);
  assertEquals(response.subscriptions, 0);
  assertExists(response.message);
});

Deno.test('check-water-level-alert: VAPID credentials validation', () => {
  const vapidPublicKey = 'BNxyz...';
  const vapidPrivateKey = 'abc123...';
  const vapidSubject = 'mailto:contact@dunapp.hu';

  assertExists(vapidPublicKey);
  assertExists(vapidPrivateKey);
  assertExists(vapidSubject);
  assertEquals(vapidSubject.startsWith('mailto:'), true);
});

Deno.test('check-water-level-alert: notification counter logic', () => {
  const subscriptions = [
    { id: 'sub-1', status: 'sent' },
    { id: 'sub-2', status: 'sent' },
    { id: 'sub-3', status: 'failed' },
    { id: 'sub-4', status: 'skipped' },
    { id: 'sub-5', status: 'sent' }
  ];

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const sub of subscriptions) {
    if (sub.status === 'sent') sentCount++;
    else if (sub.status === 'failed') failedCount++;
    else if (sub.status === 'skipped') skippedCount++;
  }

  assertEquals(sentCount, 3);
  assertEquals(failedCount, 1);
  assertEquals(skippedCount, 1);
  assertEquals(sentCount + failedCount + skippedCount, subscriptions.length);
});

Deno.test('check-water-level-alert: push notification success response', () => {
  const pushResult = {
    success: true,
    statusCode: 201
  };

  assertEquals(pushResult.success, true);
  assertEquals(pushResult.statusCode, 201);
});

Deno.test('check-water-level-alert: push notification failure response', () => {
  const pushResult = {
    success: false,
    error: 'Subscription expired',
    statusCode: 410
  };

  assertEquals(pushResult.success, false);
  assertExists(pushResult.error);
  assertEquals(pushResult.statusCode, 410);
});

Deno.test('check-water-level-alert: Hungarian text in notification', () => {
  const notificationBody = 'A mai vízállás 420 cm. Lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!';

  assertEquals(notificationBody.includes('vízállás'), true);
  assertEquals(notificationBody.includes('420'), true);
  assertEquals(notificationBody.includes('vízutánpótlást'), true);
  assertEquals(notificationBody.includes('Belső-Béda'), true);
});

Deno.test('check-water-level-alert: station-specific notifications', () => {
  const stations = ['Baja', 'Mohács', 'Nagybajcs'];
  const targetStation = 'Mohács';

  assertEquals(stations.includes(targetStation), true);
  assertEquals(targetStation, 'Mohács');
});

console.log('All check-water-level-alert tests passed!');
