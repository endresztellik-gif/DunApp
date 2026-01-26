# Talajvízkút Adatforrások - DunApp PWA

**Dokumentum célja:** A talajvízkút monitoring adatok beszerzési forrásainak dokumentációja
**Projekt:** DunApp PWA - Aszály Modul
**Verzió:** 2.0
**Utolsó frissítés:** 2026-01-24

---

## 📊 Összefoglaló

A DunApp PWA Aszály modulja **15 talajvízkút** vízszintjét monitorozza Tolna és Bács-Kiskun megyékben. Az adatbeszerzési rendszer **2026 januárjában jelentős fejlesztésen** esett át a megbízhatóság és sebesség javítása érdekében.

### Jelenlegi Állapot (2026-01-24)
- ✅ **10 aktív kút** (minőségi adatokkal)
- ✅ **5 letiltott kút** (elégtelen adatok)
- ✅ **Automata frissítés:** 5 naponta egyszer
- ✅ **Adatmennyiség:** 17,173 mérési rekord (14+ hónap)

---

## 🔄 Adatforrás Változások

### ❌ RÉGI RENDSZER (2026-01-09 előtt)

**Adatforrás:** vizadat.hu API
**Verzió:** Migration 020 és korábbiak
**Státusz:** ❌ **Megszűnt** (lassú, megbízhatatlan)

**Jellemzők:**
- 🐌 **Rendkívül lassú:** 60+ másodperc timeout 60 napos lekérdezésre
- ❌ **100% timeout arány:** Mind a 15 kút időtúllépéssel végződött
- 📉 **Kevés adat:** Csak 30-60 mérés kútonként (összesen ~450-900 mérés)
- ⚠️ **Adatvesztés:** Automata frissítések hónapokig nem működtek

**Technikai Implementáció:**
```typescript
// Régi Edge Function: fetch-groundwater (vizadat.hu)
const response = await fetch(
  `https://vizadat.hu/api/groundwater?well_id=${wellCode}&days=60`
);
// ❌ Problem: 60+ second timeout → 100% failure
```

**Adatbázis Státusz (2026-01-09):**
- Összes rekord: **3,288 db** (korábbi sikeres futásokból)
- Átlag/kút: **219 mérés**
- Időszak: ~8-9 hónap archív adat

---

### ✅ ÚJ RENDSZER (2026-01-09 óta)

**Adatforrás:** vizugy.hu PHP endpoint
**Verzió:** Migration 021 - **fetch-groundwater-vizugy**
**Státusz:** ✅ **MŰKÖDIK** (gyors, megbízható)

**Jellemzők:**
- ⚡ **Rendkívül gyors:** 4.4 másodperc mind a 15 kútra
- ✅ **100% sikeresség:** Mind a 15 kút adatot szolgáltat
- 📈 **Sok adat:** 926 átlag mérés kútonként (max. 2,038 mérés)
- 📅 **Hosszú időtartam:** 365+ nap visszamenőleg elérhető

**Technikai Implementáció:**
```typescript
// Új Edge Function: fetch-groundwater-vizugy
const url = `https://www.vizugy.hu/talajvizkut_grafikon/index.php?torzsszam=${wellCode}`;
const html = await fetch(url).then(r => r.text());

// Parse JavaScript chartView() function:
const pattern = /chartView\s*\(\s*(\[.*?\])\s*,\s*(\[.*?\])\s*,\s*\[.*?\]\s*,\s*\[.*?\]\s*\)/s;
const match = html.match(pattern);
const values = JSON.parse(match[1]);      // Water levels (cm)
const timestamps = JSON.parse(match[2]);  // Timestamps (ms)
// ✅ Result: 4.4 seconds → 13,885 records
```

**Adatbázis Státusz (2026-01-24):**
- Összes rekord: **17,173 db** (3,288 régi + 13,885 új)
- Átlag/kút: **1,145 mérés**
- Időszak: **14+ hónap** (2024-11-11 → 2026-01-09)

---

## 📈 Összehasonlítás

| Metrika | Régi (vizadat.hu) | Új (vizugy.hu) | Javulás |
|---------|-------------------|----------------|---------|
| **Mérés/kút** | 30-60 | 926 | **15× TÖBB** |
| **Legjobb kút** | 60 | 2,038 | **34× TÖBB** |
| **Összes mérés** | 450-900 | 13,885 | **15-30× TÖBB** |
| **Sikeresség** | 0% | 100% | **∞** |
| **Lekérdezési idő** | 60+ mp | 4.4 mp | **13× GYORSABB** |
| **Időszak** | 30-60 nap | 365 nap | **6-12× HOSSZABB** |

---

## 🗂️ Kutak Adatminősége

### ✅ Kiváló Adatminőség (7 kút)
1. **Sátorhely** (#4576) - 2,038 mérés
2. **Szeremle** (#132042) - 1,888 mérés
3. **Nagybaracska** (#4479) - 1,674 mérés
4. **Hercegszántó** (#1450) - 1,669 mérés
5. **Mohács-Sárhát** (#4481) - 1,400 mérés
6. **Decs** (#658) - 751 mérés
7. **Báta** (#660) - 669 mérés

### ✅ Megfelelő Adatminőség (3 kút)
8. **Alsónyék** (#662) - 622 mérés
9. **Őcsény** (#653) - 99 mérés
10. **Dávod** (#448) - 43 mérés

### ❌ Elégtelen Adatminőség (5 kút - LETILTVA)
11. **Érsekcsanád** (#1426) - 58 mérés → `enabled=false`
12. **Mohács II.** (#912) - 85 mérés → `enabled=false`
13. **Mohács** (#1460) - 118 mérés → `enabled=false`
14. **Kölked** (#1461) - 118 mérés → `enabled=false`
15. **Szekszárd-Borrév** (#656) - 1 mérés → `enabled=false`

**Megjegyzés:** Az 5 letiltott kút továbbra is szerepel az adatbázisban, de nem jelenik meg a felhasználói felületen az `enabled=false` szűrő miatt.

---

## 🔧 Migrációs Folyamat

### 1️⃣ Migration 020 (2026-01-09)
**Cél:** UNIQUE constraint hozzáadása a duplikált rekordok megelőzésére

```sql
-- Duplikált rekordok eltávolítása (keep newest)
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY well_id, timestamp
    ORDER BY created_at DESC, id DESC
  ) AS rn
  FROM groundwater_data
)
DELETE FROM groundwater_data
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- UNIQUE constraint hozzáadása
ALTER TABLE groundwater_data
ADD CONSTRAINT unique_well_timestamp UNIQUE (well_id, timestamp);
```

**Eredmény:** 3,288 egyedi rekord megőrizve

---

### 2️⃣ Migration 021 (2026-01-23)
**Cél:** Váltás vizugy.hu API-ra + 5 napos ütemezés + minőségi szűrés

#### A) Új Edge Function Létrehozása
```typescript
// supabase/functions/fetch-groundwater-vizugy/index.ts
// - Fetch from vizugy.hu PHP endpoint
// - Parse chartView() JavaScript function
// - Process all 15 wells in parallel
// - Convert cm → meters, depth as negative values
```

#### B) Új PostgreSQL Helper Function
```sql
CREATE OR REPLACE FUNCTION public.invoke_fetch_groundwater_vizugy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  project_url TEXT := 'https://zpwoicpajmvbtmtumsah.supabase.co';
  anon_key TEXT := 'eyJhbGci...';  -- Anon key használata
  request_id BIGINT;
BEGIN
  -- Trigger Edge Function via pg_net
  SELECT net.http_post(
    url := project_url || '/functions/v1/fetch-groundwater-vizugy',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) INTO request_id;

  RAISE NOTICE '✅ Groundwater fetch invoked, request_id=%', request_id;
END;
$function$;
```

#### C) Cron Job Frissítése
```sql
-- Régi job törlése (naponta)
SELECT cron.unschedule('fetch-groundwater-daily');

-- Új job létrehozása (5 naponta egyszer)
SELECT cron.schedule(
  'fetch-groundwater-daily',
  '0 5 */5 * *',  -- Minden 5. nap, 05:00 AM UTC
  'SELECT public.invoke_fetch_groundwater_vizugy()'
);
```

#### D) Minőségi Szűrés (enabled mező)
```sql
-- Enabled mező hozzáadása
ALTER TABLE groundwater_wells
ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true;

-- 5 kút letiltása (elégtelen adatok)
UPDATE groundwater_wells
SET enabled = false
WHERE well_code IN ('1460', '1461', '912', '1426', '656');
```

**Eredmény:**
- ✅ 13,885 új rekord beszúrva (4.4 mp alatt)
- ✅ 10 aktív kút (enabled=true)
- ✅ Automata 5 napos frissítés beállítva

---

## 🔄 Automata Frissítési Folyamat

### Ütemezés
- **Gyakoriság:** Minden 5. nap, 05:00 AM UTC (06:00 CET, 07:00 CEST)
- **Következő futás:** 2026-01-28 05:00 UTC

### Inkrementális Adatgyűjtés
```
┌────────────────────────────────────────────────────────┐
│ INKREMENTÁLIS ADATGYŰJTÉS (365 NAPOS ABLAK)           │
├────────────────────────────────────────────────────────┤
│ Nap 1:  Lekérés 365 nap → Beszúrás [2025-01-24→2026-01-24] │
│ Nap 6:  Lekérés 365 nap → Beszúrás [2025-01-29→2026-01-29] │
│         (Duplikátumok figyelmen kívül hagyva)               │
│ Nap 11: Lekérés 365 nap → Beszúrás [2025-02-03→2026-02-03] │
│ ...                                                          │
│ Nap 365: Adatbázis tartalmaz 365+ nap adatot! 🎉          │
└────────────────────────────────────────────────────────┘
```

**Kulcsfontosságú Tulajdonságok:**
- ✅ **UNIQUE constraint** megakadályozza a duplikátumokat
- ✅ **upsert + ignoreDuplicates** = biztonságos gyűjtés
- ✅ **Átfedő lekérdezések** fokozatosan feltöltik a hiányokat
- ✅ **365 napos ablak** = hosszú történelmi adatok

---

## 📊 Frontend Integráció

### Adatok Lekérdezése
```typescript
// src/hooks/useGroundwaterWells.ts
const { data, error } = await supabase
  .from('groundwater_wells')
  .select('*')
  .eq('is_active', true)
  .eq('enabled', true)  // ← Minőségi szűrés
  .order('well_name');
```

### Cache Stratégia
```typescript
export function useGroundwaterWells() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['groundwaterWells'],
    queryFn: fetchGroundwaterWells,
    staleTime: 24 * 60 * 60 * 1000, // 24 óra (statikus adat)
    gcTime: 24 * 60 * 60 * 1000,
    retry: 3,
  });
}
```

---

## 🔍 Adatellenőrzés

### SQL Lekérdezések

#### 1. Összes Rekord Ellenőrzése
```sql
SELECT
  COUNT(*) as total_records,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM groundwater_data;
```

**Várt Eredmény:** 17,173 rekord, 2024-11-11 → 2026-01-09

#### 2. Kutak Adatminőségének Ellenőrzése
```sql
SELECT
  gw.well_name,
  gw.well_code,
  gw.enabled,
  COUNT(gd.id) as total_records,
  MAX(gd.timestamp) as last_measurement,
  MIN(gd.timestamp) as first_measurement
FROM groundwater_wells gw
LEFT JOIN groundwater_data gd ON gw.id = gd.well_id
GROUP BY gw.id, gw.well_name, gw.well_code, gw.enabled
ORDER BY total_records DESC;
```

#### 3. Cron Job Státusz
```sql
SELECT
  jobname,
  schedule,
  active,
  jobid
FROM cron.job
WHERE jobname = 'fetch-groundwater-daily';
```

**Várt Eredmény:**
- `jobname`: fetch-groundwater-daily
- `schedule`: 0 5 */5 * *
- `active`: true

#### 4. Cron Job Futási Előzmények
```sql
SELECT
  start_time,
  status,
  return_message,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-groundwater-daily')
ORDER BY start_time DESC
LIMIT 10;
```

---

## ⚠️ Ismert Korlátozások

### 1. Adatforrás-specifikus Problémák
**Egyes kutak adatai megálltak 2025-ben:**
- **Alsónyék (#662):** Utolsó mérés 2025-12-18
- **Báta (#660):** Utolsó mérés 2025-12-18
- **Decs (#658):** Utolsó mérés 2025-12-18
- **Őcsény (#653):** Utolsó mérés 2025-12-18
- **Dávod (#448):** Utolsó mérés 2025-10-09

**Ok:** vizugy.hu adatforrás nem frissül ezekhez a kutakhoz
**Megoldás:** Nincs (külső adatforrás hibája)

### 2. 5 Napos Frissítési Ciklus
**Következmény:** Új adatok max. 5 naponta frissülnek
**Indoklás:**
- 365 napos ablak → nincs szükség gyakori frissítésre
- Szerver terhelés csökkentése
- Adatforrás túlterhelésének elkerülése

### 3. Manuális Trigger Lehetőség
**Ha azonnali frissítés szükséges:**
```sql
SELECT public.invoke_fetch_groundwater_vizugy();
```

**Figyelem:** Ne futtassuk túl gyakran (rate limiting)

---

## 📚 Kapcsolódó Dokumentáció

### Projektfájlok
- **Migration 020:** `supabase/migrations/020_add_groundwater_unique_constraint.sql`
- **Migration 021:** `supabase/migrations/021_update_groundwater_cron_vizugy.sql`
- **Edge Function:** `supabase/functions/fetch-groundwater-vizugy/index.ts`
- **Frontend Hook:** `src/hooks/useGroundwaterWells.ts`
- **UI Komponens:** `src/modules/drought/DroughtModule.tsx`

### Vizugy.hu API Dokumentáció
- **Endpoint:** `https://www.vizugy.hu/talajvizkut_grafikon/index.php`
- **Paraméter:** `torzsszam` (kút kódja, pl. 4576)
- **Válasz formátum:** HTML oldal JavaScript `chartView()` függvénnyel
- **Adat struktúra:** `chartView([values_cm], [timestamps_ms], [], [metadata])`

---

## ✅ Státusz Összefoglaló

| Komponens | Állapot | Frissítve |
|-----------|---------|-----------|
| **Adatbázis Séma** | ✅ Kész | 2026-01-09 |
| **UNIQUE Constraint** | ✅ Aktív | 2026-01-09 |
| **Edge Function (vizugy.hu)** | ✅ Működik | 2026-01-23 |
| **Cron Job (5 napos)** | ✅ Aktív | 2026-01-23 |
| **Minőségi Szűrés (enabled)** | ✅ Aktív | 2026-01-23 |
| **Frontend Integráció** | ✅ Működik | 2026-01-23 |
| **Dokumentáció** | ✅ Naprakész | 2026-01-24 |

---

## 📞 Kapcsolat és Hibakezelés

**Projekt:** DunApp PWA
**Repository:** [endresztellik-gif/DunApp](https://github.com/endresztellik-gif/DunApp)
**Deployment:** [dunapp.netlify.app](https://dunapp.netlify.app)

**Hibajelentés:**
1. Ellenőrizd a cron job státuszt (SQL fent)
2. Ellenőrizd az Edge Function logs-okat (Supabase Dashboard)
3. Futtasd manuálisan: `SELECT public.invoke_fetch_groundwater_vizugy()`
4. GitHub Issues: Hozz létre hibajegyet részletes leírással

---

*Dokumentáció készítve: 2026-01-24*
*Verzió: 2.0*
*Utolsó adatfrissítés: 2026-01-09*
