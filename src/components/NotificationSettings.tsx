/**
 * NotificationSettings Component
 *
 * Másodlagos állapotkártya a WaterLevelModule-ban.
 * Az elsődleges feliratkozás/leiratkozás kezelés a Header harang gombjában van.
 * Ez a komponens csak az állapotot mutatja + gyors elérést biztosít.
 *
 * Created: 2025-11-03 (Phase 4.6g)
 * Simplified: 2026-03-24 — Header kezeli a confirm dialogot
 */

import React from 'react';
import { Bell, BellOff, AlertCircle, Check, Loader2 } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const NotificationSettings: React.FC = () => {
  const { isSupported, permission, isSubscribed, subscribe, isLoading, error } =
    usePushNotifications();

  if (!isSupported) return null;

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

  // Feliratkozott — kompakt zöld sor
  if (isSubscribed && permission === 'granted') {
    return (
      <div className="rounded-lg border-2 border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
        <Bell className="h-4 w-4 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-green-800">Vízállás riasztás aktív</span>
          <p className="text-xs text-green-700">Értesítést kapsz, ha Mohács eléri a 400 cm-t</p>
        </div>
        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
      </div>
    );
  }

  // Nincs feliratkozva — kártya subscribe gombbal
  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-3">
        <BellOff className="h-6 w-6 text-gray-400" />
        <div>
          <h3 className="text-base font-semibold text-gray-900">Vízállás Riasztások</h3>
          <p className="text-xs text-gray-600">
            Értesítést kapsz, ha a Mohács vízállása eléri a 400 cm-t
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={subscribe}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Feliratkozás...
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" />
            Feliratkozás az értesítésekre
          </>
        )}
      </button>

      <p className="mt-3 text-xs text-gray-500">
        ℹ A leiratkozáshoz használd a harang ikont a fejlécben.
      </p>
    </div>
  );
};
