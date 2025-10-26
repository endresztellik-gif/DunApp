# Főbb Változások és Modul-specifikus Architektúra

## 🎯 Kulcs Módosítások

### 1. ✅ Modul-specifikus Településválasztás

**Előtte:** Egy globális településválasztó minden modulhoz
**Utána:** Minden modul saját helyszínválasztóval

```
📊 Meteorológia Modul
   └── 🏙️ Város választó (meteorológiai városok)

🌊 Vízállás Modul  
   └── 🌊 Állomás választó (vízállomások)

🏜️ Aszály Modul
   ├── 📍 Helyszín választó (monitoring pontok)
   └── 🚰 Kút választó (talajvízkutak) ← KÜLÖN!
```

---

## 🗄️ Adatbázis Struktúra Változások

### Új Táblák Rendszer

| Régi (1 tábla) | Új (4 külön tábla) |
|----------------|---------------------|
| `cities` (minden típusú helyszín) | `meteorology_cities` |
| | `water_level_stations` |
| | `drought_locations` |
| | `groundwater_wells` ⭐ |

**Előny:** 
- Minden modul önálló helyszínkezelése
- Eltérő attribútumok (pl. kutak mélysége, állomások kritikus szintjei)
- Jobb skálázhatóság

---

## 🏜️ Aszály Modul Részletes Felépítés

### A) Adatkártyák (4 db, dropdown-os választással)

```
┌─────────────────────────────────────┐
│ 🏜️ ASZÁLYINDEX                     │
│    [Helyszín választó ▼]           │  ← Aszály monitoring helyszínek
│    Érték: 2.3 (Közepes aszály)     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💧 TALAJNEDVESSÉG                   │
│    [Helyszín választó ▼]           │  ← Aszály monitoring helyszínek
│    Érték: 45% (Átlag alatti)       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🌡️ VÍZHIÁNY                         │
│    [Helyszín választó ▼]           │  ← Aszály monitoring helyszínek
│    Érték: 120mm (Jelentős hiány)   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🚰 TALAJVÍZSZINT                    │
│    [Kút választó ▼]                │  ← Talajvízkutak (KÜLÖN LISTA!)
│    Szint: -8.5m (Átlag alatti)     │
└─────────────────────────────────────┘
```

### B) Térképek (3 db)

#### 1️⃣ Talajvízszint Térkép
- **Adatforrás:** `groundwater_wells` + `groundwater_data`
- **Megjelenítés:** Marker minden kútnál
- **Színkódolás:** Vízszint szerint
- **Interakció:** Klikk → kút részletek + grafikon

#### 2️⃣ Aszálymonitoring Térkép
- **Adatforrás:** `drought_locations` + `drought_data`
- **Megjelenítés:** Marker minden monitoring ponton
- **Színkódolás:** Aszály kategória szerint
- **Interakció:** Klikk → helyszín részletek

#### 3️⃣ Vízhiány Térkép
- **Adatforrás:** `drought_locations` + `drought_data`
- **Megjelenítés:** Heatmap vagy choropleth
- **Színkódolás:** Vízhiány mértéke (mm)
- **Interakció:** Hover → érték megjelenítés

---

## 🌊 Vízállás Modul Egyszerűsítések

### ❌ Eltávolított Funkciók:
- ~~Történelmi adatok megjelenítés~~
- ~~Kritikus szintek vizualizációja grafikonon~~

### ✅ Megtartott Funkciók:
- Aktuális vízállás
- Változás trendje
- Kritikus szintek **numerikus** megjelenítése (LNV, KKV, NV)
- Előrejelzés
- Idősor grafikonok (aktuális + közeli múlt)
- Átlagok
- Állomások összehasonlítása

---

## 🎨 UI/UX Referencia

**Minta oldal:** https://dunaapp-weather-wate-86h9.bolt.host/

### Elvárt stílus jellemzők:
- Modern, tiszta design
- Kártyák alapú elrendezés
- Responsive layout
- Könnyen navigálható modulok
- Világos színvilág
- Interaktív grafikonok és térképek

---

## 📦 Komponens Hierarchia

### Közös Alap
```
BaseSelector (abstract)
├── használja: MeteorologyCitySelector
├── használja: WaterLevelStationSelector
├── használja: DroughtLocationSelector
└── használja: GroundwaterWellSelector
```

### Aszály Modul Specifikus
```
Aszály Modul
├── Data Cards Szekció
│   ├── DroughtIndexCard
│   │   └── DroughtLocationSelector
│   ├── SoilMoistureCard
│   │   └── DroughtLocationSelector
│   ├── WaterDeficitCard
│   │   └── DroughtLocationSelector
│   └── GroundwaterLevelCard
│       └── GroundwaterWellSelector ⭐
│
├── Maps Szekció
│   ├── GroundwaterMap
│   ├── DroughtMonitoringMap
│   └── WaterDeficitMap
│
└── Charts Szekció
    └── DroughtChart (választott helyszín/kút alapján)
```

---

## 🔄 Adatáramlás

### Meteorológia & Vízállás (egyszerű)
```
User Select City/Station
    ↓
Fetch Data for Selected Location
    ↓
Display Cards & Charts
```

### Aszály (komplex - 2 párhuzamos rendszer)

#### Monitoring Adatok Áramlás:
```
User selects location from dropdown (in card)
    ↓
Fetch drought/soil/deficit data
    ↓
Display in selected card
    ↓
Update relevant chart
```

#### Talajvízkút Adatok Áramlás:
```
User selects well from dropdown (in groundwater card)
    ↓
Fetch groundwater level data
    ↓
Display in groundwater card
    ↓
Update groundwater chart
```

#### Térkép Adatok (független):
```
Load all locations/wells on map init
    ↓
Display all markers/heatmap
    ↓
User clicks marker
    ↓
Show popup with data + option to select in card
```

---

## 🚀 Fejlesztési Sorrend Javaslat

1. **Alapok** (1-2 hét)
   - Project setup
   - Supabase konfiguráció
   - Alap komponensek

2. **Helyszín Modulok** (1-2 hét)
   - Mind a 4 helyszín típus adatbázis
   - BaseSelector és specifikus selectorok

3. **Meteorológia** (2 hét) ⭐ START HERE
   - Legegyszerűbb modul
   - Validálja az architektúrát

4. **Vízállás** (2 hét)
   - Közepes komplexitás
   - Teszteli az állomáskezelést

5. **Aszály** (2-3 hét) 🎯 LEGKOMPLEXEBB
   - 2 helyszín típus
   - 3 térkép
   - 4 adatkártya
   - Integrált rendszer

6. **PWA & Optimalizáció** (1-2 hét)
   - Service Worker
   - Offline support
   - Performance tuning

---

## 📋 Ellenőrző Lista Indulás Előtt

### Adatok & API-k
- [ ] Meteorológia: API dokumentáció + települések
- [ ] Vízállás: API/scraping + állomások listája
- [ ] Aszály monitoring: API + helyszínek listája
- [ ] Talajvízkutak: API/scraping + kutak listája (KÜLÖN!)

### Design
- [ ] Színséma (hex kódok)
- [ ] Logo fájl
- [ ] Referencia oldal részletes átnézése

### Infrastruktúra
- [ ] Supabase account
- [ ] GitHub repo
- [ ] Netlify account
- [ ] API kulcsok beszerzése

### Prioritások
- [ ] Melyik modullal kezdjünk?
- [ ] Vannak-e határidők?
- [ ] Vannak-e további specifikus követelmények?

---

## 💡 Következő Lépések

1. **Adj meg minden szükséges adatot** (lásd fenti lista)
2. **Erősíts meg/Pontosíts** bármit a tervben
3. **Indítsd el a Claude Code-ot** és kezdjük a fejlesztést!

---

*Dokumentum verzió: 2.0 - Modul-specifikus architektúra*
*Utolsó frissítés: 2025-10-24*
