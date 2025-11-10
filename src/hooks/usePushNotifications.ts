/**
 * usePushNotifications Hook
 *
 * Manages Web Push Notification subscriptions for water level alerts.
 * Handles permission requests, subscription creation, and database sync.
 *
 * Created: 2025-11-03 (Phase 4.6f)
 *
 * Usage:
 * ```tsx
 * const { isSupported, permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// VAPID public key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Convert base64 VAPID key to Uint8Array for PushManager API
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface UsePushNotificationsReturn {
  /** Is push notification API supported in this browser */
  isSupported: boolean;
  /** Current notification permission state */
  permission: NotificationPermission | null;
  /** Is user currently subscribed to push notifications */
  isSubscribed: boolean;
  /** Subscribe to push notifications (requests permission if needed) */
  subscribe: () => Promise<void>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
  /** Loading state during subscribe/unsubscribe */
  isLoading: boolean;
  /** Error message if operation failed */
  error: string | null;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if push notifications are supported
   */
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  /**
   * Check current subscription status
   */
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Failed to check subscription:', err);
      }
    };

    checkSubscription();
  }, [isSupported]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      setError('VAPID public key not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Request notification permission
      let currentPermission = Notification.permission;

      if (currentPermission === 'default') {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
      }

      if (currentPermission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Step 2: Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Step 3: Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // Step 4: Extract subscription details
      const subscriptionJSON = subscription.toJSON();
      const endpoint = subscription.endpoint;
      const p256dh = subscriptionJSON.keys?.p256dh || '';
      const auth = subscriptionJSON.keys?.auth || '';

      if (!endpoint || !p256dh || !auth) {
        throw new Error('Invalid subscription data');
      }

      // Step 5: Save subscription to Supabase
      const { error: insertError } = await supabase.from('push_subscriptions').upsert(
        {
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          enabled: true,
          notify_water_level: true, // Enable water level notifications by default
        } as any,
        {
          onConflict: 'endpoint',
        }
      );

      if (insertError) {
        console.error('Failed to save subscription to database:', insertError);
        throw new Error(`Failed to save subscription: ${insertError.message || insertError.toString()}`);
      }

      setIsSubscribed(true);
      if (import.meta.env.DEV) {
        console.log('✅ Push notification subscription successful');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      console.error('Push notification subscription error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get current subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      // Step 2: Unsubscribe from push manager
      const success = await subscription.unsubscribe();

      if (!success) {
        throw new Error('Failed to unsubscribe from push manager');
      }

      // Step 3: Delete subscription from Supabase
      const endpoint = subscription.endpoint;
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

      if (deleteError) {
        console.error('Failed to delete subscription from database:', deleteError);
        // Don't throw - subscription is already unsubscribed locally
      }

      setIsSubscribed(false);
      if (import.meta.env.DEV) {
        console.log('✅ Push notification unsubscription successful');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(errorMessage);
      console.error('Push notification unsubscription error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading,
    error,
  };
}
