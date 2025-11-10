/**
 * NotificationSettings Component
 *
 * UI for managing push notification subscriptions.
 * Displays permission status and allows users to subscribe/unsubscribe.
 *
 * Created: 2025-11-03 (Phase 4.6g)
 *
 * Usage:
 * ```tsx
 * <NotificationSettings />
 * ```
 */

import React from 'react';
import { Bell, BellOff, AlertCircle, Check, Loader2 } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const NotificationSettings: React.FC = () => {
  const { isSupported, permission, isSubscribed, subscribe, unsubscribe, isLoading, error } =
    usePushNotifications();

  // Not supported - don't render anything (silent)
  if (!isSupported) {
    return null;
  }

  // Already subscribed - hide component after first subscription
  if (isSubscribed && permission === 'granted') {
    return null;
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h4 className="text-sm font-semibold text-red-900">Értesítések letiltva</h4>
            <p className="mt-1 text-xs text-red-700">
              Az értesítések engedélyezéséhez nyisd meg a böngésző beállításait és engedélyezd az
              értesítéseket erre az oldalra.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="h-6 w-6 text-cyan-600" />
        ) : (
          <BellOff className="h-6 w-6 text-gray-400" />
        )}
        <div>
          <h3 className="text-base font-semibold text-gray-900">Vízállás Riasztások</h3>
          <p className="text-xs text-gray-600">
            Értesítést kapsz, ha a Mohács vízállása eléri a 400 cm-t
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4 rounded-md bg-gray-50 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">Státusz:</span>
          {isSubscribed ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
              <Check className="h-4 w-4" />
              Feliratkozva
            </span>
          ) : (
            <span className="text-xs font-semibold text-gray-500">Nincs feliratkozva</span>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Action button */}
      <div className="flex gap-2">
        {isSubscribed ? (
          <button
            onClick={unsubscribe}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Leiratkozás...
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                Leiratkozás
              </>
            )}
          </button>
        ) : (
          <button
            onClick={subscribe}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Feliratkozás...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Feliratkozás
              </>
            )}
          </button>
        )}
      </div>

      {/* Info text */}
      <p className="mt-3 text-xs text-gray-500">
        ℹ Az értesítéseket bármikor kikapcsolhatod a leiratkozás gombra kattintva.
      </p>
    </div>
  );
};
