# 🔔 Push Értesítések - Gyors Áttekintés

## Funkció Összefoglalója

**Cél:** Automatikus értesítés küldése a felhasználóknak, amikor a mohácsi vízállás eléri vagy meghaladja a 400 cm-t.

**Üzenet:**
```
Cím: "Vízállás Figyelmeztetés - Mohács"
Szöveg: "A mai vízállás lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!"
```

---

## 🏗️ Architektúra (3 fő komponens)

### 1️⃣ Frontend (PWA)
```typescript
NotificationManager Service
├── Engedély kérése (Notification.requestPermission)
├── Feliratkozás (pushManager.subscribe)
├── Leiratkozás (subscription.unsubscribe)
└── Beállítások mentése (Supabase)
```

**Fájlok:**
- `src/services/notifications/NotificationManager.ts` - Notification service
- `src/modules/water-level/components/NotificationSettings.tsx` - UI komponens
- `public/service-worker.js` - Push event handler

### 2️⃣ Backend (Supabase)
```sql
3 új tábla:
├── push_subscriptions (feliratkozások)
├── notification_logs (küldési napló)
└── user_notification_preferences (beállítások)
```

**Edge Function:**
- `supabase/functions/check-water-level/index.ts`
- Cron: 6 óránként (0:00, 6:00, 12:00, 18:00)
- Ellenőrzi a mohácsi vízállást
- Ha >= 400 cm → push notification mindenkinek

### 3️⃣ Web Push Service
- VAPID protokoll (Web Push API standard)
- Vagy Firebase Cloud Messaging (FCM)
- Vagy OneSignal (third-party)

---

## 📋 Implementációs Lépések

### Fázis 1: Alapok (1 nap)

1. **VAPID Keys generálása**
```bash
npm install -g web-push
web-push generate-vapid-keys
```

2. **Environment változók**
```env
# Frontend (.env)
VITE_VAPID_PUBLIC_KEY=BEl62iU...

# Supabase secrets
VAPID_PRIVATE_KEY=XXXXXX...
VAPID_SUBJECT=mailto:your-email@dunapp.hu
```

3. **Supabase táblák létrehozása**
```bash
# SQL fájl futtatása
supabase/migrations/push_notifications_schema.sql
```

### Fázis 2: Frontend (1-2 nap)

4. **NotificationManager service**
```typescript
// src/services/notifications/NotificationManager.ts
- isSupported()
- requestPermission()
- subscribe()
- unsubscribe()
- savePreferences()
```

5. **Service Worker**
```javascript
// public/service-worker.js
- addEventListener('push', ...)
- addEventListener('notificationclick', ...)
```

6. **UI komponens**
```typescript
// NotificationSettings.tsx
- Toggle kapcsoló (be/ki)
- Státusz megjelenítés
- Teszt értesítés gomb
```

### Fázis 3: Backend (1 nap)

7. **Edge Function fejlesztés**
```typescript
// check-water-level/index.ts
- Vízállás lekérése (Mohács)
- Threshold ellenőrzés (>= 400 cm)
- Push küldése (web-push library)
- Log mentése
```

8. **Cron job beállítása**
```sql
-- pg_cron schedule
SELECT cron.schedule(...);
```

### Fázis 4: Tesztelés (0.5 nap)

9. **Lokális tesztelés**
- Engedély kérése tesztelése
- Feliratkozás tesztelése
- Teszt értesítés küldése

10. **Edge Function tesztelés**
```bash
supabase functions invoke check-water-level
```

### Fázis 5: Production (0.5 nap)

11. **Deployment**
- Environment variables beállítása
- Edge Function deploy
- Cron job aktiválása

**Összesen: 3-4 nap fejlesztés**

---

## 🎨 UI/UX Flow

### Felhasználói Élmény

```
1. Felhasználó megnyitja a Vízállás modult
   └─> "Értesítések Beállítása" gomb látható

2. Kattint a gombra
   └─> NotificationSettings komponens megjelenik

3. Kattint "Bekapcsolás" gombra
   └─> Böngésző engedély kérés popup
   └─> Ha "Engedélyez": ✓ Feliratkozás sikeres
   └─> Ha "Letilt": ❌ Hibaüzenet

4. Feliratkozott állapotban:
   └─> "Értesítések engedélyezve" üzenet
   └─> "Teszt értesítés" gomb elérhető
   └─> "Kikapcsolás" gomb elérhető

5. Amikor vízállás >= 400 cm:
   └─> 📱 Push notification érkezik
   └─> Kattintáskor: Navigáció → Vízállás modul (Mohács)
```

---

## 🔧 Konfiguráció

### NotificationSettings Komponens Elhelyezése

**Opció A: Vízállás modul főoldalán**
```tsx
// WaterLevelModule.tsx
<div>
  <StationSelector />
  <NotificationSettings /> {/* Itt */}
  <DataCards />
  <Charts />
</div>
```

**Opció B: Settings/Beállítások oldalon**
```tsx
// SettingsPage.tsx
<div>
  <h1>Beállítások</h1>
  <NotificationSettings />
  {/* Egyéb beállítások */}
</div>
```

**Ajánlás:** Opció A - Vízállás modulban, hogy közvetlenül elérhető legyen

---

## 📊 Adatbázis Séma (Egyszerűsített)

```sql
-- 1. Feliratkozások tárolása
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY,
  endpoint TEXT UNIQUE,
  p256dh TEXT,
  auth TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 2. Értesítési napló
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY,
  station_name VARCHAR(100),
  water_level INTEGER,
  message TEXT,
  sent_at TIMESTAMP,
  recipients_count INTEGER,
  success_count INTEGER
);

-- 3. Felhasználói preferenciák
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY,
  subscription_id UUID REFERENCES push_subscriptions(id),
  water_level_alerts BOOLEAN DEFAULT true,
  threshold_cm INTEGER DEFAULT 400,
  stations TEXT[] DEFAULT ARRAY['Mohács']
);
```

---

## 🧪 Tesztelési Forgatókönyv

### 1. Engedély Kérés Tesztelése

```typescript
// Console-ban:
notificationManager.requestPermission();
// Várt eredmény: Böngésző popup megjelenik
```

### 2. Feliratkozás Tesztelése

```typescript
notificationManager.subscribe();
// Ellenőrzés Supabase-ben:
// SELECT * FROM push_subscriptions WHERE endpoint = '...'
```

### 3. Teszt Értesítés

```typescript
notificationManager.sendTestNotification();
// Várt: Notification megjelenik 📱
```

### 4. Edge Function Manuális Trigger

```bash
# Supabase CLI
supabase functions invoke check-water-level \
  --env-file ./supabase/.env.local

# Ellenőrzés: notification_logs táblában új rekord
```

### 5. Cron Job Szimuláció

```sql
-- Állítsd be a mohácsi vízállást 400+ cm-re
UPDATE water_level_data 
SET water_level = 405 
WHERE station_id = (SELECT id FROM water_level_stations WHERE station_name = 'Mohács')
ORDER BY timestamp DESC LIMIT 1;

-- Futtasd manuálisan az Edge Function-t
-- Várj értesítést 📱
```

---

## 🔐 Biztonsági Checklist

- [ ] VAPID private key **SOHA** ne kerüljön a frontend kódba
- [ ] Environment variables biztonságosan tárolva (Supabase secrets)
- [ ] Push subscriptions endpoint-jei titkosítva tárolva
- [ ] Rate limiting implementálva (max. 10 értesítés/nap)
- [ ] User consent megfelelően kezelve (GDPR compliant)
- [ ] Unsubscribe funkció mindig elérhető

---

## 📱 Böngésző Kompatibilitás

| Böngésző | Push Notifications | Service Worker |
|----------|-------------------|----------------|
| Chrome 90+ | ✅ | ✅ |
| Firefox 88+ | ✅ | ✅ |
| Safari 16+ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ |
| Opera 76+ | ✅ | ✅ |
| Mobile Chrome | ✅ | ✅ |
| Mobile Safari (iOS 16+) | ✅ | ✅ |

**Megjegyzés:** Safari iOS-en csak iOS 16.4+ támogatja!

---

## 🚀 Production Checklist

**Deployment előtt:**
- [ ] VAPID keys biztonságosan tárolva
- [ ] Supabase táblák létrehozva
- [ ] Edge Function deployolva
- [ ] Cron job konfigurálva (6 óránként)
- [ ] Service Worker regisztrálva
- [ ] Manifest.json frissítve (gcm_sender_id)
- [ ] Ikonok (192x192, 512x512, badge) elkészítve
- [ ] NotificationSettings komponens integrálva
- [ ] Teszt értesítés sikeresen küldve
- [ ] HTTPS működik (kötelező push notifications-höz!)

**Production környezet:**
- [ ] VITE_VAPID_PUBLIC_KEY beállítva
- [ ] Supabase secrets (VAPID_PRIVATE_KEY, VAPID_SUBJECT) beállítva
- [ ] Netlify környezeti változók konfigurálva
- [ ] SSL certificate aktív

---

## 💡 Továbbfejlesztési Lehetőségek

1. **Több állomás támogatása**
   - Baja, Nagybajcs értesítések
   - Testreszabható küszöbértékek állomásonként

2. **Értesítési típusok**
   - Magas vízállás (árvíz veszély)
   - Alacsony vízállás
   - Vízállás változás trendje

3. **Gyakoriság testreszabás**
   - Napi egyszer
   - Csak munkanapokon
   - Csak megadott időpontokban

4. **Több nyelv támogatás**
   - Magyar (default)
   - Angol
   - Német

5. **Rich Notifications**
   - Képek csatolása (grafikon screenshotok)
   - Action buttons (Részletek, Térkép)
   - Progress indicators

---

## 📞 Troubleshooting

### "Notifications not supported"
- Ellenőrizd: HTTPS működik-e (HTTP nem támogatott!)
- Böngésző verzió elég új? (lásd kompatibilitási táblázat)

### "Permission denied"
- Felhasználó letiltotta → Böngésző beállításokban engedélyezni kell

### "Subscription failed"
- VAPID public key helyes?
- Service Worker sikeresen regisztrálva?
- Console hibák ellenőrzése

### "No notification received"
- Edge Function sikeresen futott?
- `notification_logs` táblában van bejegyzés?
- Push subscription még aktív?
- Böngésző beállításokban engedélyezve van?

---

## 📚 Dokumentáció Hivatkozások

**Teljes specifikáció:**
- `docs/PUSH_NOTIFICATIONS_SPEC.md` - Részletes implementációs útmutató

**Kapcsolódó dokumentumok:**
- `docs/PROJECT_SUMMARY.md` - Projekt architektúra
- `docs/DATA_STRUCTURES.md` - API struktúrák
- `.claude/instructions.md` - Fejlesztési útmutató

**External Resources:**
- MDN Web Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- web-push library: https://github.com/web-push-libs/web-push
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

---

*Push Értesítések Gyors Áttekintő v1.0*  
*DunApp PWA - 2025-10-24*
