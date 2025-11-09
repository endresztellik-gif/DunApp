# HydroInfo URL Fix - 2025-11-07

## 🐛 Probléma Leírása

**Felhasználói Report:**
> "Az adatok biztosan nem valódiak ennek nézz utána, holnapután nemlehet Mohácson 2 cm-es a vízállás!"

**Tünet:**
- Baja/Mohács/Nagybajcs előrejelzések lehetetlen értékeket mutatnak (pl. 2 cm)
- Nov 10-én mindhárom állomásnál irreálisan alacsony értékek (2-11 cm)
- Duplikált bejegyzések az adatbázisban

## 🔍 Gyökér Ok Elemzése

### 1. Vizsgálat - Database

```sql
SELECT station.name, forecast_date, forecasted_level_cm
FROM water_level_forecasts
WHERE source = 'hydroinfo.hu'
ORDER BY forecast_date;
```

**Eredmény:**
```
Nagybajcs | 2025-11-10 | 11 cm   ← IRREÁLIS!
Baja      | 2025-11-10 | 2 cm    ← IRREÁLIS!
Mohács    | 2025-11-10 | 2 cm    ← IRREÁLIS!
```

### 2. Vizsgálat - HTML Scraping

**Jelenlegi URL:** `https://www.hydroinfo.hu/tables/dunelotH.html`

**Felfedezés:**
A `dunelotH.html` táblázatban Baja/Mohács/Nagybajcs sorai **CSONKÁK**:

```html
<!-- Baja sor -->
<tr>
  <td>Duna<br><b>Baja</b></td>
  <td><b>221</b></td>  <!-- Ma reggel -->
  <td><b>243</b></td>  <!-- Nov 08 -->
  <!-- 🚨 Nov 09-13 HIÁNYZIK! -->
</tr>
```

**Következmény:**
Az Edge Function a `dunelotH.html` táblázat HEADER sorából vagy más állomások értékeiből parsol, ami rossz értékeket eredményez.

### 3. Vizsgálat - Hidroinfo Struktúra

**Felfedezés:** Léteznek **állomás-specifikus detail táblázatok**!

#### URL Pattern Discovery:

```
https://www.hydroinfo.hu/Html/hidelo/dunall.html
└─ iframe src="../../tables/442502H.html"
                            ^^^^^^^^
                            Station-specific ID!
```

#### Helyes Station ID Mapping:

| Állomás | DB `station_id` | Hidroinfo Detail ID | Detail URL | Status |
|---------|-----------------|---------------------|------------|--------|
| **Nagybajcs** | `442051` | ❌ NINCS | - | CSONKA (dunelotH.html) |
| **Baja** | `442027` | ✅ `442031` | `tables/442031H.html` | ✅ TELJES 6 NAP |
| **Mohács** | `442010` | ✅ `442032` | `tables/442032H.html` | ✅ TELJES 6 NAP |

## ✅ Megoldás

### Station ID Frissítés

**Frissíteni kell az Edge Function station konfigurációját:**

```typescript
// ❌ RÉGI (rossz):
const STATIONS = [
  { name: 'Nagybajcs', stationId: '442051', hydroinfoCode: 'nagybajcs' },
  { name: 'Baja', stationId: '442027', hydroinfoCode: 'baja' },
  { name: 'Mohács', stationId: '442010', hydroinfoCode: 'mohacs' }
];

// ✅ ÚJ (helyes):
const STATIONS = [
  {
    name: 'Nagybajcs',
    stationId: '442051',  // DB reference (vizugy.hu)
    hydroinfoId: null,    // Nincs detail táblázat
    useConsolidatedTable: true
  },
  {
    name: 'Baja',
    stationId: '442027',  // DB reference (vizugy.hu)
    hydroinfoId: '442031', // Detail táblázat ID
    useConsolidatedTable: false
  },
  {
    name: 'Mohács',
    stationId: '442010',  // DB reference (vizugy.hu)
    hydroinfoId: '442032', // Detail táblázat ID
    useConsolidatedTable: false
  }
];
```

### Új Scraping Stratégia

**Baja & Mohács:**
```
URL: https://www.hydroinfo.hu/tables/{hydroinfoId}H.html
Formátum: 6-órás időlépcső, 6 napos előrejelzés
Bontás: 24 órás time-slotok (07:00 értékek kiválasztása)
```

**Nagybajcs:**
```
URL: https://www.hydroinfo.hu/tables/dunelotH.html
Figyelmeztetés: Csak 1-2 napos előrejelzés elérhető
Következmény: Limitált előrejelzési tartomány
```

## 📊 Verifikáció

### Baja Detail Table (442031H.html)

```
Ma reggel:    221 cm
Nov 08 07:00: 243 cm
Nov 09 07:00: 235 cm
Nov 10 07:00: 224 cm ← REÁLIS!
Nov 11 07:00: 214 cm
Nov 12 07:00: 208 cm
Nov 13 07:00: 205 cm
```

### Mohács Detail Table (442032H.html)

```
Ma reggel:    225 cm
Nov 08 07:00: 256 cm
Nov 09 07:00: 254 cm
Nov 10 07:00: 246 cm ← REÁLIS!
Nov 11 07:00: 237 cm
Nov 12 07:00: 230 cm
Nov 13 07:00: 226 cm
```

## 🚀 Implementáció

**Fájl:** `supabase/functions/fetch-water-level/index.ts`

**Változtatások:**
1. ✅ Station konfiguráció frissítése (hydroinfoId hozzáadása)
2. ✅ Új scraping függvény: `scrapeHydroinfoDetailTable(hydroinfoId)`
3. ✅ 6-órás időlépcső → 24-órás konverzió (07:00 értékek)
4. ✅ Fallback a consolidated table-re (Nagybajcs)

## 📝 Következmények

### Pozitív:
- ✅ **Baja/Mohács:** Teljes 6 napos előrejelzés valós értékekkel
- ✅ Reális vízállás értékek (200-260 cm tartomány)
- ✅ Pontos időpontok (07:00-kor érvényes értékek)

### Negatív:
- ⚠️ **Nagybajcs:** Továbbra is csak 1-2 napos előrejelzés
- ⚠️ Alternatív megoldás szükséges Nagybajcs hosszútávú előrejelzéséhez

### Potenciális Megoldás Nagybajcs-ra:
1. **Manuális keresés:** További hidroinfo URL-ek kutatása
2. **Interpoláció:** Budapest + Baja értékekből becsülni
3. **VízÜgy API:** Hivatalos API endpoint keresése

## 🔗 Kapcsolódó Fájlok

- Edge Function: `supabase/functions/fetch-water-level/index.ts`
- Database: `water_level_forecasts` tábla
- Frontend: `src/modules/water-level/ForecastDataTable.tsx`

## 📅 Időbélyeg

- **Felfedezés:** 2025-11-07
- **Implementáció:** 2025-11-07
- **Status:** ✅ MEGOLDVA (Baja/Mohács), ⚠️ PARTIAL (Nagybajcs)
