# 🔧 Groundwater Data Hotfix - 2026-01-09

## 📊 Probléma Összefoglalás

**Tünet:** A talajvízszint adatok nem frissülnek, pedig 8-9 hónapnyi történeti adat van az adatbázisban.

**Felvetett kérdés:**
> "Mi lenne, ha a most megszerezhető 60 napos adatokat hozzáadnánk a korábbi már meglévő adatainkhoz és akkor csak viszonylag kevés adathiányunk lenne. Ha be tudtuk szerezni a korábbi adatokat, akkor ez a későbbiekben miért nem ment?"

## 🔍 Root Cause Analysis

### Timeline
- **8-9 hónappal ezelőtt:** ✅ API gyors, 60 napos fetch sikeres
- **Most (2026-01-09):** ❌ API extrém lassú, mind a 15 kút timeout

### Tesztelés Eredménye (60 nap)
```
⏱️  Válaszidő: 61.4 másodperc
📊 Státusz: 500 Internal Server Error
❌ Sikertelen: 15/15 kút (100% timeout)
```

### Miért Működött Korábban?

**Az inkrementális adatgyűjtés ELVILEG működnie kellett volna:**

```
┌────────────────────────────────────────────────┐
│ ELMÉLET: Inkrementális Adatgyűjtés            │
├────────────────────────────────────────────────┤
│ Nap 1:  Fetch 60 nap → [Nov 1 - Dec 31]      │
│ Nap 2:  Fetch 60 nap → [Nov 2 - Jan 1]       │
│         upsert → Duplikátumok kihagyva        │
│ Nap 30: Fetch 60 nap → [Dec 1 - Jan 30]      │
│                                                │
│ Eredmény: 90 nap adat (60 + 30 új)           │
│ 365 nap után: Teljes éves adatbázis! 🎉      │
└────────────────────────────────────────────────┘
```

**DE: 2 kritikus probléma:**
1. ❌ **Hiányzó UNIQUE constraint** → upsert nem működött helyesen
2. ❌ **API lassulás** → 60 napos fetch-ek timeoutolnak

## ✅ Alkalmazott Megoldások

### 1️⃣ Hozzáadtuk a Hiányzó UNIQUE Constraint

**Probléma:** Az Edge Function `upsert(onConflict: 'well_id,timestamp')` használ, de az adatbázisban **NINCS ilyen constraint!**

```sql
-- Migration 020: supabase/migrations/020_add_groundwater_unique_constraint.sql
ALTER TABLE groundwater_data
ADD CONSTRAINT unique_well_timestamp UNIQUE (well_id, timestamp);
```

**Hatás:**
- ✅ Megelőzi a duplikált rekordokat
- ✅ Lehetővé teszi a helyes `upsert` működést
- ✅ Biztosítja az inkrementális adatgyűjtést

### 2️⃣ Csökkentettük az API Kérést: 60 → 30 Nap

**Indoklás:** Kisebb kérések = nagyobb esély a sikerre

**Változások:**
- `DAYS = 60` → `DAYS = 30`
- `API_TIMEOUT_MS = 60000` → `API_TIMEOUT_MS = 90000` (60s → 90s)

**Fájlok módosítva:**
- ✅ `supabase/functions/fetch-groundwater/index.ts`
- ✅ `supabase/migrations/013_groundwater_cron_job.sql` (dokumentáció)

### 3️⃣ Frontend: 60 → 365 Napos Megjelenítés

**Indoklás:** Az adatbázis már most is tartalmaz 8-9 hónapnyi adatot!

**Változások:**
- Chart cím: "elmúlt 60 nap" → "elmúlt 365 nap"
- Hook: Lekérdezi az elmúlt 365 napot (az adatbázis ezt már most is tudja)

**Fájlok módosítva:**
- ✅ `src/hooks/useGroundwaterTimeseries.ts`
- ✅ `src/modules/drought/GroundwaterChart.tsx`

## 📈 Hogyan Működik az Inkrementális Gyűjtés?

```
┌──────────────────────────────────────────────────────────┐
│ 30 NAPOS INKREMENTÁLIS ADATGYŰJTÉS                       │
├──────────────────────────────────────────────────────────┤
│ Nap 1:  Fetch 30 nap → [Dec 10 - Jan 9]  ✅             │
│ Nap 2:  Fetch 30 nap → [Dec 11 - Jan 10] ✅             │
│         UNIQUE constraint → Duplikátumok eldobva         │
│ Nap 3:  Fetch 30 nap → [Dec 12 - Jan 11] ✅             │
│ ...                                                       │
│ Nap 30: Fetch 30 nap → [Jan 8 - Feb 7]   ✅             │
│                                                           │
│ ✨ EREDMÉNY: 60 nap adat (30 + 30 akkumulált)           │
│                                                           │
│ Nap 60:  → 90 nap adat                                   │
│ Nap 90:  → 120 nap adat                                  │
│ Nap 365: → 365 nap TELJES éves adatbázis! 🎉           │
└──────────────────────────────────────────────────────────┘
```

**Kulcs pontok:**
- ✅ **30 napos daily fetch** átfedésekkel tölt fel adatokat
- ✅ **UNIQUE constraint** megelőzi a duplikációt
- ✅ **upsert + ignoreDuplicates** = biztonságos akkumuláció
- ✅ **8-9 hónap már meg van** a korábbi futásokból
- ✅ **Új adatok hozzáadódnak** (nem felülírják)

## 🎯 Várható Eredmények

### Rövid Távon (1-7 nap)
- ✅ 30 napos fetch-ek sikeresek lesznek (gyorsabbak mint 60 nap)
- ✅ Új adatok hozzáadódnak a meglévő 8-9 hónaphoz
- ✅ Adathiányok elkezdnek betöltődni

### Közép Távon (30-60 nap)
- ✅ Adatlefedettség 10-11 hónapra nő
- ✅ Folyamatos napi frissítések
- ✅ Grafikon teljesebb történeti trendet mutat

### Hosszú Távon (365 nap)
- ✅ **TELJES 365 napos dataset elérve!** 🎉
- ✅ Év-év összehasonlítás lehetséges
- ✅ Szezonális trendek láthatók

## 📦 Módosított Fájlok

| Fájl | Változás | Típus |
|------|----------|-------|
| `020_add_groundwater_unique_constraint.sql` | Létrehozva | NEW |
| `fetch-groundwater/index.ts` | 60→30 nap, 60s→90s timeout | MODIFIED |
| `013_groundwater_cron_job.sql` | Dokumentáció frissítve | MODIFIED |
| `useGroundwaterTimeseries.ts` | Dokumentáció frissítve | MODIFIED |
| `GroundwaterChart.tsx` | 60→365 nap UI + docs | MODIFIED |
| `RadarMap.tsx` | TypeScript fix (unused var) | MODIFIED |
| `test-groundwater-30days.js` | Tesztelési script | NEW |
| `test-groundwater-fetch.js` | Diagnosztikai script | NEW |
| `CLAUDE.md` | Hotfix dokumentáció | MODIFIED |

**Összesen:** 9 fájl (3 új, 6 módosított), ~200 sor változás

## 🚀 Deployment Lépések

### 1. Adatbázis Migráció (UNIQUE Constraint)

**Opció A: Supabase CLI (ajánlott)**
```bash
SUPABASE_ACCESS_TOKEN="$SUPABASE_ADMIN_TOKEN" supabase db push
```

**Opció B: Supabase Dashboard**
1. Navigálj a SQL Editor-hoz
2. Másold be `020_add_groundwater_unique_constraint.sql` tartalmát
3. Futtasd le az SQL-t

### 2. Edge Function Deploy

```bash
SUPABASE_ACCESS_TOKEN="$SUPABASE_ADMIN_TOKEN" \
  supabase functions deploy fetch-groundwater
```

### 3. Frontend Build & Deploy

```bash
# Build (már tesztelve ✅)
npm run build

# Netlify deploy automatikus (GitHub push után)
git add .
git commit -m "fix(groundwater): 30-day fetch + UNIQUE constraint for incremental data building"
git push origin main
```

### 4. Tesztelés

**4.1 Edge Function Teszt**
```bash
node test-groundwater-30days.js
```

**Sikeres eredmény:**
- ✅ Response < 90 másodperc
- ✅ Legalább 8-10/15 kút sikeres
- ✅ Kevesebb timeout mint 60 napos verzió

**4.2 Adatbázis Ellenőrzés**
```sql
-- UNIQUE constraint létezik?
SELECT conname, contype, conrelid::regclass
FROM pg_constraint
WHERE conname = 'unique_well_timestamp';

-- Új adatok bekerültek?
SELECT
  gw.name,
  COUNT(gd.id) as total_records,
  MAX(gd.timestamp) as latest_data
FROM groundwater_wells gw
LEFT JOIN groundwater_data gd ON gw.id = gd.well_id
GROUP BY gw.id, gw.name
ORDER BY total_records DESC;
```

**4.3 Cron Job Monitoring**
```sql
-- Legutóbbi cron futások
SELECT
  start_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid
  FROM cron.job
  WHERE jobname = 'fetch-groundwater-daily'
)
ORDER BY start_time DESC
LIMIT 10;
```

**4.4 Frontend Ellenőrzés**
1. Navigálj: `http://localhost:5173/` → Aszály modul
2. Válassz egy kutat (pl. "Dávod")
3. Ellenőrizd:
   - ✅ Grafikon cím: "Talajvízszint alakulása (elmúlt 365 nap, 5 napos mintavétel)"
   - ✅ Adatok megjelennek (8-9 hónap)
   - ✅ Nincs error

## ✅ Sikerkritériumok

- [ ] UNIQUE constraint létrejött az adatbázisban
- [ ] 30 napos fetch < 90 másodperc alatt lefut
- [ ] Legalább 50% (8+/15) kút sikeresen fetch-el
- [ ] Új adatok megjelennek az adatbázisban (7 napon belül)
- [ ] Frontend grafikon 8-9 hónap adatot mutat
- [ ] Cron job sikeresen fut napi 5:00 UTC-kor

## 📝 Monitoring Terv

**Első 7 nap:**
- Napi ellenőrzés: cron job sikeres futás
- Új adatok megjelenése az adatbázisban

**30 nap után:**
- Adatlefedettség növekedés (9→10 hónap)
- Kevesebb data gap a grafikonon

**365 nap után:**
- Teljes éves dataset
- Összes 15 kút 365 napos adattal

## 🎓 Tanulságok

1. ⚠️ **MINDIG ellenőrizd a UNIQUE constraint-eket** amikor `upsert`-et használsz
2. ⚠️ **API teljesítmény változhat** idővel (60 nap működött → most nem)
3. ✅ **Inkrementális gyűjtés hatékony** ha a constraint-ek helyesek
4. ✅ **Kisebb batch-ek megbízhatóbbak** mint nagyok (30 < 60)
5. ✅ **Meglévő adatok értékesek** (8-9 hónap már megvan!)

## 📞 Következő Lépések

**MOST (2026-01-09):**
1. Deploy Migration 020 (UNIQUE constraint)
2. Deploy frissített Edge Function (30 nap)
3. Teszt futtatás: `node test-groundwater-30days.js`

**1 hét múlva:**
4. Ellenőrizd új adatok beérkezését
5. Monitorozd cron job futásokat

**1 hónap múlva:**
6. Ellenőrizd 10 hónapos adatlefedettséget
7. Grafikon megjelenítés ellenőrzése

**Kérdés esetén:**
- CLAUDE.md - Teljes dokumentáció
- SESSION_PROGRESS_2025-11-03.md - Phase 5 részletek
- API_DOCS.md - Edge Function referencia

---

**Készítette:** Claude Code
**Dátum:** 2026-01-09
**Verzió:** 1.0
**Státusz:** ✅ Kész deployment-re
