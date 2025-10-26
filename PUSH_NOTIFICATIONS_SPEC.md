# Push Értesítések Specifikáció - Vízállás Modul

## 🔔 Áttekintés

PWA push notification rendszer a mohácsi vízállás monitoringhoz. Amikor a vízállás eléri vagy meghaladja a 400 cm-t, automatikus értesítést küld a felhasználóknak.

---

## 📋 Funkcionális Követelmények

### Trigger Feltétel
```typescript
if (mohacs_water_level >= 400) {
  sendNotification();
}
```

### Értesítés Tartalma
```
Cím: "Vízállás Figyelmeztetés - Mohács"
Szöveg: "A mai vízállás lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!"
Icon: 💧 vagy custom ikon
Badge: Számláló (ha több értesítés van)
```

### Felhasználói Élmény
1. **Első látogatáskor**: Kérés értesítési engedélyre
2. **Engedélyezés után**: Automatikus értesítések
3. **Értesítés kattintáskor**: Navigáció a Vízállás modulhoz (Mohács állomás)
4. **Beállítások**: Ki/be kapcsolható a Settings-ben

---

## 🏗️ Architektúra

### Komponensek

```
┌─────────────────────────────────────────┐
│         Frontend (PWA)                  │
│  ┌───────────────────────────────────┐  │
│  │  NotificationManager               │  │
│  │  - requestPermission()             │  │
│  │  - subscribe()                     │  │
│  │  - unsubscribe()                   │  │
│  └───────────────────────────────────┘  │
│                   ↓                      │
│  ┌───────────────────────────────────┐  │
│  │  Service Worker                    │  │
│  │  - push event listener             │  │
│  │  - notificationclick handler       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   Supabase Edge Function                │
│  ┌───────────────────────────────────┐  │
│  │  check-water-level (CRON)         │  │
│  │  - Fetch Mohács water level        │  │
│  │  - Check threshold (>= 400 cm)     │  │
│  │  - Send push to subscribers        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   Push Service (Web Push Protocol)      │
│   - Firebase Cloud Messaging (FCM)      │
│   - or OneSignal                         │
│   - or native Web Push API              │
└─────────────────────────────────────────┘
```

---

## 🔧 Implementáció

### 1. Supabase Táblák Módosítása

```sql
-- Új tábla: push_subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Új tábla: notification_logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type VARCHAR(50) NOT NULL, -- 'water_level_alert'
  station_name VARCHAR(100), -- 'Mohács'
  water_level INTEGER, -- 400+
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  recipients_count INTEGER,
  success_count INTEGER,
  error_count INTEGER
);

-- Új tábla: user_notification_preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  water_level_alerts BOOLEAN DEFAULT true,
  threshold_cm INTEGER DEFAULT 400, -- Testreszabható küszöb
  stations TEXT[], -- ['Mohács'] vagy több állomás
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Frontend: Notification Manager Service

```typescript
// src/services/notifications/NotificationManager.ts

import { supabase } from '../supabase/client';

export class NotificationManager {
  private static instance: NotificationManager;
  private swRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Ellenőrzi, hogy a böngésző támogatja-e a push értesítéseket
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Lekéri az aktuális értesítési engedély státuszát
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Kéri az értesítési engedélyt a felhasználótól
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Feliratkozás push értesítésekre
   */
  async subscribe(): Promise<boolean> {
    try {
      // 1. Service Worker regisztrálása (ha még nincs)
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.register(
          '/service-worker.js'
        );
      }

      // 2. Várakozás amíg a SW aktív lesz
      await navigator.serviceWorker.ready;

      // 3. Engedély kérése
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return false;
      }

      // 4. VAPID public key (környezeti változóból)
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // 5. Push subscription létrehozása
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 6. Subscription mentése Supabase-be
      const subscriptionData = JSON.parse(JSON.stringify(subscription));
      
      const { error } = await supabase.from('push_subscriptions').upsert({
        endpoint: subscriptionData.endpoint,
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth,
        user_agent: navigator.userAgent,
        is_active: true,
      });

      if (error) {
        console.error('Error saving subscription:', error);
        return false;
      }

      // 7. Alapértelmezett preferenciák mentése
      await this.savePreferences({
        water_level_alerts: true,
        threshold_cm: 400,
        stations: ['Mohács'],
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }

  /**
   * Leiratkozás push értesítésekről
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.getRegistration();
      }

      if (!this.swRegistration) return false;

      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        // Leiratkozás
        await subscription.unsubscribe();

        // Törlés Supabase-ből
        const subscriptionData = JSON.parse(JSON.stringify(subscription));
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('endpoint', subscriptionData.endpoint);
      }

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Preferenciák mentése
   */
  async savePreferences(preferences: {
    water_level_alerts: boolean;
    threshold_cm: number;
    stations: string[];
  }): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      if (!subscription) return false;

      const subscriptionData = JSON.parse(JSON.stringify(subscription));

      // Subscription ID lekérése
      const { data: subData } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', subscriptionData.endpoint)
        .single();

      if (!subData) return false;

      // Preferenciák mentése/frissítése
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          subscription_id: subData.id,
          water_level_alerts: preferences.water_level_alerts,
          threshold_cm: preferences.threshold_cm,
          stations: preferences.stations,
        });

      return !error;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  }

  /**
   * Aktuális subscription lekérése
   */
  private async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.getRegistration();
      }

      if (!this.swRegistration) return null;

      return await this.swRegistration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  /**
   * VAPID key konvertálás
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Teszt értesítés küldése
   */
  async sendTestNotification(): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      throw new Error('Notifications not permitted');
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Teszt Értesítés', {
      body: 'A push értesítések sikeresen működnek!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'test-notification',
    });
  }
}

// Singleton export
export const notificationManager = NotificationManager.getInstance();
```

### 3. Service Worker (Push Event Handler)

```javascript
// public/service-worker.js

// Push notification fogadása
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received:', event);

  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'DunApp Értesítés',
        body: event.data.text(),
      };
    }
  }

  const title = data.title || 'Vízállás Figyelmeztetés - Mohács';
  const options = {
    body: data.body || 'A mai vízállás lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'water-level-alert',
    requireInteraction: true, // Nem tűnik el automatikusan
    data: {
      url: data.url || '/water-level?station=mohacs',
      station: 'Mohács',
      waterLevel: data.waterLevel || 400,
    },
    actions: [
      {
        action: 'view',
        title: 'Részletek',
        icon: '/icons/view-icon.png',
      },
      {
        action: 'close',
        title: 'Bezárás',
        icon: '/icons/close-icon.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification kattintás kezelése
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // 'view' action vagy notification body kattintás
  const urlToOpen = event.notification.data.url || '/water-level';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Ha már van nyitott ablak, használd azt
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Ha nincs, nyiss újat
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

### 4. Supabase Edge Function (Cron Job)

```typescript
// supabase/functions/check-water-level/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.5.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
const vapidSubject = Deno.env.get('VAPID_SUBJECT')!; // mailto:your-email@example.com

const supabase = createClient(supabaseUrl, supabaseKey);

// Web Push konfiguráció
webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

serve(async (req) => {
  try {
    console.log('[check-water-level] Starting water level check...');

    // 1. Mohács vízállás lekérése
    const { data: waterData, error: waterError } = await supabase
      .from('latest_water_level_data')
      .select('water_level, station_name, timestamp')
      .eq('station_name', 'Mohács')
      .single();

    if (waterError || !waterData) {
      throw new Error('Failed to fetch Mohács water level');
    }

    const currentLevel = waterData.water_level;
    console.log(`[check-water-level] Mohács current level: ${currentLevel} cm`);

    // 2. Ellenőrzés: >= 400 cm?
    if (currentLevel < 400) {
      console.log('[check-water-level] Water level below threshold. No notification sent.');
      return new Response(
        JSON.stringify({ 
          message: 'Water level below threshold', 
          level: currentLevel 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Aktív subscriptions lekérése (preferenciákkal)
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select(`
        id,
        endpoint,
        p256dh,
        auth,
        user_notification_preferences (
          water_level_alerts,
          threshold_cm,
          stations
        )
      `)
      .eq('is_active', true);

    if (subError || !subscriptions) {
      throw new Error('Failed to fetch subscriptions');
    }

    // 4. Szűrés: csak azok akik engedélyezték és Mohács-ot választották
    const filteredSubs = subscriptions.filter(sub => {
      const prefs = sub.user_notification_preferences[0];
      if (!prefs) return true; // Ha nincs preferencia, alapértelmezett: küldés
      
      return (
        prefs.water_level_alerts &&
        currentLevel >= prefs.threshold_cm &&
        prefs.stations.includes('Mohács')
      );
    });

    console.log(`[check-water-level] Sending to ${filteredSubs.length} subscribers`);

    // 5. Push notification payload
    const notificationPayload = JSON.stringify({
      title: 'Vízállás Figyelmeztetés - Mohács',
      body: 'A mai vízállás lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      url: '/water-level?station=mohacs',
      tag: 'water-level-alert-mohacs',
      waterLevel: currentLevel,
    });

    // 6. Küldés minden feliratkozónak
    const results = await Promise.allSettled(
      filteredSubs.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        return webpush.sendNotification(pushSubscription, notificationPayload);
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;

    // 7. Log mentése
    await supabase.from('notification_logs').insert({
      notification_type: 'water_level_alert',
      station_name: 'Mohács',
      water_level: currentLevel,
      message: 'A mai vízállás lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!',
      recipients_count: filteredSubs.length,
      success_count: successCount,
      error_count: errorCount,
    });

    console.log(`[check-water-level] Sent: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        waterLevel: currentLevel,
        notificationsSent: successCount,
        errors: errorCount,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[check-water-level] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 5. Cron Job Schedule (Supabase)

```sql
-- supabase/migrations/add_cron_job.sql

-- pg_cron extension engedélyezése
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cron job: 6 óránként ellenőrzés
SELECT cron.schedule(
  'check-mohacs-water-level',
  '0 */6 * * *', -- 0:00, 6:00, 12:00, 18:00
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/check-water-level',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

---

## 🎨 UI Komponensek

### Notification Settings Component

```typescript
// src/modules/water-level/components/NotificationSettings.tsx

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings } from 'lucide-react';
import { notificationManager } from '@/services/notifications/NotificationManager';

export const NotificationSettings: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = notificationManager.isSupported();
    setIsSupported(supported);
    
    if (supported) {
      const perm = notificationManager.getPermissionStatus();
      setPermission(perm);
      setIsEnabled(perm === 'granted');
    }
  }, []);

  const handleToggle = async () => {
    if (!isSupported) {
      alert('A böngésző nem támogatja a push értesítéseket.');
      return;
    }

    setLoading(true);

    try {
      if (isEnabled) {
        // Leiratkozás
        const success = await notificationManager.unsubscribe();
        if (success) {
          setIsEnabled(false);
          setPermission('default');
        }
      } else {
        // Feliratkozás
        const success = await notificationManager.subscribe();
        if (success) {
          setIsEnabled(true);
          setPermission('granted');
        } else {
          alert('Nem sikerült engedélyezni az értesítéseket.');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Hiba történt az értesítések beállítása során.');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      await notificationManager.sendTestNotification();
    } catch (error) {
      alert('Teszt értesítés küldése sikertelen.');
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          A böngésző nem támogatja a push értesítéseket.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <Bell className="w-6 h-6 text-water-primary" />
          ) : (
            <BellOff className="w-6 h-6 text-gray-400" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Vízállás Értesítések
            </h3>
            <p className="text-sm text-text-secondary">
              Mohács állomás - 400 cm küszöb
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${isEnabled 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-water-primary text-white hover:bg-water-primary/90'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {loading ? 'Feldolgozás...' : isEnabled ? 'Kikapcsolás' : 'Bekapcsolás'}
        </button>
      </div>

      {isEnabled && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              ✓ Értesítések engedélyezve. Értesítést kapsz, amikor a mohácsi 
              vízállás eléri vagy meghaladja a 400 cm-t.
            </p>
          </div>

          <button
            onClick={handleTest}
            className="text-sm text-water-primary hover:underline flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Teszt értesítés küldése
          </button>
        </>
      )}

      {permission === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-red-800">
            ❌ Az értesítések le vannak tiltva a böngésző beállításaiban. 
            Engedélyezd őket a böngésző beállításokban.
          </p>
        </div>
      )}
    </div>
  );
};
```

---

## 🔐 Biztonsági Megfontolások

### 1. VAPID Keys Generálása

```bash
# web-push CLI telepítése
npm install -g web-push

# VAPID keys generálása
web-push generate-vapid-keys

# Output:
# Public Key: BEl62iU...
# Private Key: XXXXXX...
```

### 2. Environment Variables

```env
# .env
VITE_VAPID_PUBLIC_KEY=BEl62iU...

# Supabase Edge Functions secrets
VAPID_PRIVATE_KEY=XXXXXX...
VAPID_SUBJECT=mailto:your-email@dunapp.hu
```

### 3. Rate Limiting

```typescript
// Edge Function-ben
const RATE_LIMIT = {
  maxNotificationsPerDay: 10,
  maxNotificationsPerHour: 3,
};

// Implementáció...
```

---

## 📱 Manifest.json Módosítás

```json
{
  "name": "DunApp PWA",
  "short_name": "DunApp",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F0F4F8",
  "theme_color": "#00BCD4",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/badge-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "badge"
    }
  ],
  "gcm_sender_id": "103953800507"
}
```

---

## 🧪 Tesztelés

### 1. Lokális Tesztelés

```typescript
// Test script
import { notificationManager } from './NotificationManager';

async function testNotifications() {
  console.log('1. Checking support...');
  const supported = notificationManager.isSupported();
  console.log('Supported:', supported);

  if (!supported) return;

  console.log('2. Requesting permission...');
  const permission = await notificationManager.requestPermission();
  console.log('Permission:', permission);

  if (permission !== 'granted') return;

  console.log('3. Subscribing...');
  const subscribed = await notificationManager.subscribe();
  console.log('Subscribed:', subscribed);

  console.log('4. Sending test notification...');
  await notificationManager.sendTestNotification();
}

testNotifications();
```

### 2. Edge Function Manuális Trigger

```bash
# Supabase CLI-vel
supabase functions invoke check-water-level

# Vagy curl-lal
curl -X POST 'https://your-project.supabase.co/functions/v1/check-water-level' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## 📊 Monitoring & Analytics

### Notification Logs Query

```sql
-- Utolsó 10 értesítés
SELECT 
  notification_type,
  station_name,
  water_level,
  recipients_count,
  success_count,
  error_count,
  sent_at
FROM notification_logs
ORDER BY sent_at DESC
LIMIT 10;

-- Napi statisztika
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as total_notifications,
  SUM(recipients_count) as total_recipients,
  SUM(success_count) as total_success,
  SUM(error_count) as total_errors
FROM notification_logs
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

---

## 🚀 Deployment Checklist

- [ ] VAPID keys generálva és biztonságosan tárolva
- [ ] Supabase táblák létrehozva (push_subscriptions, notification_logs, user_notification_preferences)
- [ ] Edge Function deployolva
- [ ] Cron job beállítva (6 óránként)
- [ ] Service Worker regisztrálva
- [ ] NotificationManager service implementálva
- [ ] UI komponens hozzáadva a Vízállás modulhoz
- [ ] Manifest.json frissítve
- [ ] Ikonok (72x72, 192x192, 512x512, badge) elkészítve
- [ ] Teszt értesítés sikeresen elküldve
- [ ] Production environment variables beállítva

---

## 📝 Felhasználói Dokumentáció

### Hogyan Engedélyezzem az Értesítéseket?

1. Navigálj a **Vízállás** modulhoz
2. Kattints az **"Értesítések Beállítása"** gombra
3. Kattints a **"Bekapcsolás"** gombra
4. Engedélyezd az értesítéseket a böngésző felugró ablakában
5. ✅ Kész! Mostantól értesítést kapsz, ha a mohácsi vízállás eléri a 400 cm-t

### Mit Tegyünk, Ha Nem Működik?

- Ellenőrizd, hogy a böngésző támogatja-e a push értesítéseket
- Győződj meg róla, hogy nem tiltottad le az értesítéseket a böngésző beállításaiban
- Próbáld ki a "Teszt értesítés" funkciót
- Töröld a cache-t és próbáld újra

---

*Push Notification Specifikáció v1.0*  
*DunApp PWA - Vízállás Modul*  
*Létrehozva: 2025-10-24*
