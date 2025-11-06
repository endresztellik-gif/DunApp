# 🚧 Mock Data Mode - Talajvízkút Monitoring

## ⚠️ FONTOS: JELENLEG SZIMULÁLT ADATOK HASZNÁLATA

A DunApp PWA **Talajvízkút Monitoring** modulja jelenleg **MOCK (szimulált) adatokat** használ, mert a `vizadat.hu` API nem elérhető.

---

## 📋 Mi működik jelenleg?

### ✅ Frontend (100% kész)
- **WellListGrid**: 15 talajvízkút listája (Sátorhelytől Bátáig)
- **GroundwaterChart**: 60 napos trend vizualizáció Recharts-tal
- **Mock Data Generator**: Realisztikus szimulált adatok (szezonális trend, napi variáció)
- **NAGY PIROS FIGYELMEZTETÉS**: Egyértelműen jelzi, hogy NEM valós adatok

### ✅ Backend (100% kész, API-ra vár)
- **Edge Function**: `fetch-groundwater` (optimalizált, párhuzamos fetch)
- **Cron Job**: Napi 05:00 UTC automatikus futtatás (pg_cron)
- **Database Schema**: `groundwater_wells` (15 kút) + `groundwater_data` (60 napos idősor)
- **Migration**: `013_groundwater_cron_job.sql` telepítve

---

## 🎯 Mock Data Jellemzők

A `src/utils/mockGroundwaterData.ts` által generált adatok:

### Realisztikus szimulációs paraméterek:
- **Base level**: Kút-specifikus (2.5m - 4.5m)
- **Szezonális trend**: -30cm csökkenés 60 nap alatt
- **Napi variáció**: ±15cm random ingadozás
- **Rainfall events**: 10% eséllyel +40cm "feltöltődés"
- **Hőmérséklet**: Szezonális 6-18°C (opcionális)
- **MASL (tBf)**: Balti-tenger feletti magasság (opcionális)

### Példa adat:
```json
{
  "timestamp": "2025-11-06T06:00:00.000Z",
  "waterLevelMeters": 3.42,
  "waterLevelMasl": 98.42,
  "waterTemperature": 11.3
}
```

---

## 🚀 Következő Lépések (Real API Integráció)

### 1. API Forrás Beszerzése

**Lehetséges források:**
- ✅ **geoportal.vizugy.hu** (Ajánlott - hivatalos VízÜgy portál)
- ⚠️ vizadat.hu API (Jelenleg nem elérhető)
- 🔍 Alternatív API kutatás

### 2. API Integráció (amikor elérhető)

**Lépések:**
1. API kulcs / hozzáférés beszerzése
2. Edge Function frissítése (`supabase/functions/fetch-groundwater/index.ts`)
3. Mock mode kikapcsolása: `isMockDataMode()` → `false`
4. Hook átállítása: `useGroundwaterTimeseries` használata mock helyett

**Fájlok frissítése:**
```typescript
// src/utils/mockGroundwaterData.ts
export function isMockDataMode(): boolean {
  return false; // ← API integrálás után false-ra
}

// src/modules/drought/GroundwaterChart.tsx
// Mock data helyett:
const { timeseriesData, isLoading, error } = useGroundwaterTimeseries(well.id);
```

### 3. Tesztelés Real Data-val

```bash
# Edge Function manuális futtatás
curl -X POST "https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-groundwater" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Ellenőrzés DB-ben
SELECT well_name, COUNT(*) as data_count
FROM groundwater_wells w
JOIN groundwater_data d ON w.id = d.well_id
GROUP BY well_name;
```

---

## 📁 Fájlstruktúra

```
src/
├── modules/drought/
│   ├── GroundwaterChart.tsx       # Chart komponens (mock mode figyelmeztetéssel)
│   ├── WellListGrid.tsx           # 15 kút listája
│   └── DroughtModule.tsx          # Főmodul integráció
├── hooks/
│   └── useGroundwaterTimeseries.ts # Real API hook (később használandó)
└── utils/
    └── mockGroundwaterData.ts      # MOCK data generátor (IDEIGLENES)

supabase/
├── functions/fetch-groundwater/
│   ├── index.ts                    # Edge Function (optimalizált, párhuzamos)
│   └── README.md                   # API timeout issue dokumentáció
└── migrations/
    └── 013_groundwater_cron_job.sql # Cron job setup
```

---

## 🛠️ Fejlesztői Jegyzetek

### Mock Mode Ellenőrzés

```typescript
import { isMockDataMode } from '@/utils/mockGroundwaterData';

if (isMockDataMode()) {
  console.warn('⚠️ MOCK DATA MODE ENABLED');
}
```

### Mock Data Testreszabás

Szerkeszd `src/utils/mockGroundwaterData.ts`:
```typescript
// Kút-specifikus base level változtatása
const wellBaseLevels: Record<string, number> = {
  '4576': 3.8,   // Sátorhely - módosítható
  // ...
};

// Szezonális trend erősítése/gyengítése
const seasonalDecline = 0.3; // -30cm → -50cm = 0.5
```

---

## 🔗 Kapcsolódó Dokumentumok

- **API Timeout Issue**: `supabase/functions/fetch-groundwater/README.md`
- **Edge Function Optimalizáció**: `supabase/functions/fetch-groundwater/index.ts` (line 7-12)
- **Database Schema**: `supabase/migrations/001_initial_schema.sql` (line 155-184)

---

## 📞 Support & Kérdések

Ha megvan a **hivatalos API hozzáférés** (geoportal.vizugy.hu vagy egyéb):
1. Frissítsd az Edge Function-t az új API URL-lel
2. Állítsd át `isMockDataMode()` → `false`
3. Teszteld az Edge Function-t manuálisan
4. Aktiváld a cron job-ot (már konfigurálva)

---

**Utolsó frissítés:** 2025-11-06
**Státusz:** MOCK DATA MODE AKTÍV
**Következő milestone:** Hivatalos API beszerzése és integráció
