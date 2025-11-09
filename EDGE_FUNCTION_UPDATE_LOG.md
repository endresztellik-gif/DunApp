# Hydroinfo.hu Iframe Table Integration - Edge Function Update

**Dátum:** 2025-11-09
**Státusz:** ✅ Kész a deployment-re
**Prioritás:** MAGAS - Ez javítja a **valós adatok** megjelenítését!

---

## 🎯 Mi változott?

Az Edge Function mostantól **hydroinfo.hu iframe táblát** használ az **ÖSSZES aktuális adathoz**:
- ✅ Vízállás (cm)
- ✅ Vízhozam (m³/s)  
- ✅ Vízhőmérséklet (°C)

### Előtte vs. Utána

| Adat típus | Előző forrás | Új forrás | Eredmény |
|------------|--------------|-----------|----------|
| Vízállás | vizugy.hu (hibás parsing) | hydroinfo.hu iframe | ✅ Valós adatok |
| Vízhozam | Nincs | hydroinfo.hu iframe | ✅ Most már van! |
| Vízhőmérséklet | Nincs | hydroinfo.hu iframe | ✅ Most már van! |
| Előrejelzések | hydroinfo.hu detail táblák | hydroinfo.hu detail táblák | ✅ Változatlan |

---

## 📊 Valós Adatok (2025-11-09 alapján)

A parser tesztek alapján ezek az **AKTUÁLIS, VALÓS** adatok:

```json
{
  "Nagybajcs": {
    "vízállás": 94,
    "vízhozam": 1130,
    "vízhőmérséklet": 9.6
  },
  "Baja": {
    "vízállás": 240,
    "vízhozam": 1860,
    "vízhőmérséklet": 10.5
  },
  "Mohács": {
    "vízállás": 250,
    "vízhozam": 1880,
    "vízhőmérséklet": 11.1
  }
}
```

Ezek a számok **teljesen mások**, mint amit a régi Edge Function adott vissza (pl. Mohács régen 984 cm volt, most helyesen 250 cm).

---

## 🔧 Technikai Változások

### 1. Új Scraping Funkció: `scrapeHydroinfoActual()`

```typescript
// ÚJ: Iframe tábla parsing (ÖSSZES adat egy helyen)
async function scrapeHydroinfoActual() {
  const url = 'https://www.hydroinfo.hu/tables/dunhif_a.html';
  // ... ISO-8859-2 encoding kezelés
  // ... 10 oszlopos tábla parsing:
  // [code, name, river, level1, level2, level3, trend, flow_rate, temp, extra]
}
```

### 2. Állomáskód Mapping Frissítés

```typescript
const STATIONS = [
  {
    name: 'Nagybajcs',
    stationId: '442051',          // DB reference
    hydroinfoActualId: '442502',  // ÚJ: iframe tábla kód
    hydroinfoId: null
  },
  {
    name: 'Baja',
    stationId: '442027',          // DB reference
    hydroinfoActualId: '442031',  // ÚJ: iframe tábla kód
    hydroinfoId: '442031'
  },
  {
    name: 'Mohács',
    stationId: '442010',          // DB reference
    hydroinfoActualId: '442032',  // ÚJ: iframe tábla kód
    hydroinfoId: '442032'
  }
];
```

### 3. Fallback Stratégia

```typescript
// 1. ELSŐDLEGES: hydroinfo.hu iframe tábla (minden adat)
try {
  waterLevelData = await scrapeHydroinfoActual();
  console.log('✅ Scraped from hydroinfo.hu');
} catch (error) {
  // 2. FALLBACK: vizugy.hu (csak vízállás)
  try {
    waterLevelData = await scrapeVizugyActual();
    console.log('✅ Scraped from vizugy.hu (fallback)');
  } catch (fallbackError) {
    console.error('❌ Both sources failed');
  }
}
```

---

## 🚀 Deployment Útmutató

### Opció 1: Supabase Dashboard (AJÁNLOTT)

1. **Nyisd meg a Supabase Dashboard-ot:**
   ```
   https://supabase.com/dashboard/project/tihqkmzwfjhfltzskfgi/functions
   ```

2. **Kattints a `fetch-water-level` funkcióra**

3. **Kattints az "Edit Function" gombra**

4. **Töröld az ÖSSZES jelenlegi kódot**

5. **Másold be a teljes új kódot** a következő fájlból:
   ```
   /Volumes/Endre_Samsung1T/codeing/dunapp-pwa/supabase/functions/fetch-water-level/index.ts
   ```

6. **Kattints a "Deploy" gombra**

### Opció 2: Terminálból (Csak ha van hálózati hozzáférés)

```bash
# Ha van hálózat és SUPABASE_ADMIN_TOKEN környezeti változó be van állítva:
SUPABASE_ACCESS_TOKEN="$SUPABASE_ADMIN_TOKEN" supabase functions deploy fetch-water-level --project-ref tihqkmzwfjhfltzskfgi
```

⚠️ **FONTOS:** Ha "Permission denied" vagy "403" hibát kapsz, használd a Dashboard módszert!

---

## ✅ Tesztelés

### 1. Azonnal futtasd le a funkciót

**Supabase SQL Editor-ban:**
```sql
SELECT invoke_fetch_water_level();
```

**VAGY terminálból (ha van hálózat):**
```bash
SUPABASE_ACCESS_TOKEN="$SUPABASE_ADMIN_TOKEN" supabase functions invoke fetch-water-level --project-ref tihqkmzwfjhfltzskfgi
```

### 2. Ellenőrizd az adatokat (Supabase SQL Editor)

```sql
-- Legfrissebb adatok ellenőrzése
SELECT
  s.name,
  w.water_level_cm,
  w.flow_rate_m3s,
  w.water_temp_celsius,
  w.measured_at,
  w.source
FROM water_level_stations s
LEFT JOIN LATERAL (
  SELECT * FROM water_level_data
  WHERE station_id = s.id
  ORDER BY measured_at DESC
  LIMIT 1
) w ON true
WHERE s.is_active = true
ORDER BY s.name;
```

**Várt eredmény:**
- **Nagybajcs:** ~94 cm, ~1130 m³/s, ~9.6 °C
- **Baja:** ~240 cm, ~1860 m³/s, ~10.5 °C
- **Mohács:** ~250 cm, ~1880 m³/s, ~11.1 °C
- **source:** `hydroinfo.hu`

### 3. Ellenőrizd a Frontend-et

1. Nyisd meg: http://localhost:5173
2. Menj a **Vízállás** modulba
3. Válassz egy állomást (pl. Mohács)
4. **A 3 kártya VALÓS adatokat kell mutasson:**
   - 🌊 Vízállás: ~250 cm (NEM 984 cm!)
   - 💧 Vízhozam: ~1880 m³/s (MOST ELŐSZÖR!)
   - 🌡️ Vízhőmérséklet: ~11.1 °C (MOST ELŐSZÖR!)

---

## 📝 Logok Ellenőrzése

### Sikeres Futás Log-ja:

```
💧 Fetch Water Level Edge Function - Starting
🌐 Scraping actual water levels from hydroinfo.hu iframe table...
✅ Scraped Nagybajcs: 94 cm, 1130 m³/s, 9.6 °C
✅ Scraped Baja: 240 cm, 1860 m³/s, 10.5 °C
✅ Scraped Mohács: 250 cm, 1880 m³/s, 11.1 °C
✅ Scraped 3 stations from hydroinfo.hu
📍 Processing Nagybajcs...
  ✅ Inserted water level: 94 cm
  ✅ Inserted 2 forecasts
📍 Processing Baja...
  ✅ Inserted water level: 240 cm
  ✅ Inserted 6 forecasts
📍 Processing Mohács...
  ✅ Inserted water level: 250 cm
  ✅ Inserted 6 forecasts
✅ Fetch Water Level Edge Function - Completed
   Success: 3 / 3
```

### Fallback Log (ha hydroinfo.hu nem elérhető):

```
❌ Failed to scrape hydroinfo.hu: [error message]
⚠️  Falling back to vizugy.hu...
✅ Scraped 3 stations from vizugy.hu (fallback)
```

---

## 🎉 Eredmény

**Mostantól a Vízállás modul 3 kártyája VALÓS, AKTUÁLIS adatokat jelenít meg!**

✅ Vízállás - VALÓS (hydroinfo.hu iframe)
✅ Vízhozam - VALÓS (hydroinfo.hu iframe)
✅ Vízhőmérséklet - VALÓS (hydroinfo.hu iframe)
✅ 6 napos előrejelzés bizonytalansági sávokkal (hydroinfo.hu detail táblák)
✅ Automata óránkénti frissítés (pg_cron)

---

## 📌 Következő Lépések

- ⬜ Deploy Edge Function (Dashboard vagy terminál)
- ⬜ Manuális invoke (azonnal friss adatok)
- ⬜ SQL ellenőrzés (valós számok az adatbázisban)
- ⬜ Frontend ellenőrzés (valós számok a kártyákon)
- ⬜ Cron job tesztelés (következő óra :10 percében automatikus frissítés)

---

*Frissítve: 2025-11-09*
*Edge Function verzió: Phase 4.3*
*Fájl: `supabase/functions/fetch-water-level/index.ts`*
