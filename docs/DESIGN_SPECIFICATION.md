# Design Specifikáció - DunApp PWA

## 🎨 Színséma (Referencia képekről)

### Alapszínek
```css
/* Primary Colors */
--primary-cyan: #00A8CC;        /* Meteorológia */
--primary-light-cyan: #00BCD4;  /* Vízállás */
--primary-orange: #FF9800;      /* Aszály */

/* Background Colors */
--bg-main: #F0F4F8;             /* App háttér */
--bg-card: #FFFFFF;             /* Kártya háttér */
--bg-hover: #E8F4F8;            /* Hover állapot */

/* Text Colors */
--text-primary: #2C3E50;        /* Fő szöveg */
--text-secondary: #607D8B;      /* Másodlagos szöveg */
--text-light: #90A4AE;          /* Világos szöveg */

/* Border & Shadow */
--border-light: #E0E7ED;
--shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
--shadow-md: 0 4px 8px rgba(0,0,0,0.1);
--shadow-lg: 0 8px 16px rgba(0,0,0,0.12);

/* Chart Colors */
--chart-cyan: #00BCD4;
--chart-teal: #00897B;
--chart-green: #43A047;
--chart-blue: #1E88E5;
```

### Modul Specifikus Színek
```css
/* Meteorológia */
--meteo-primary: #00A8CC;
--meteo-light: #E0F7FA;
--meteo-dark: #006064;

/* Vízállás */
--water-primary: #00BCD4;
--water-light: #B2EBF2;
--water-dark: #00838F;

/* Aszály */
--drought-primary: #FF9800;
--drought-light: #FFE0B2;
--drought-dark: #E65100;
--drought-beige: #FFF8DC; /* Aszály modul háttér */

/* Aszály térkép legendák */
--drought-none: #90EE90;        /* Alacsony/nincs aszály */
--drought-mild: #FFFFE0;        /* Mérsékelt */
--drought-moderate: #FFD700;    /* Közepes */
--drought-severe: #FFA500;      /* Magas */
--drought-extreme: #FF4500;     /* Extrém */
```

---

## 📐 Layout & Spacing

### Container Sizes
```css
--container-max: 1280px;
--container-padding: 24px;
--module-spacing: 24px;
--card-padding: 20px;
--card-gap: 16px;
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

### Typography
```css
/* Font Family */
--font-main: 'Inter', 'Segoe UI', system-ui, sans-serif;

/* Font Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 24px;
--text-2xl: 32px;
--text-3xl: 48px;

/* Font Weights */
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

---

## 🏗️ Komponens Specifikációk

### Header
```
┌─────────────────────────────────────────────────────┐
│ [DunApp Logo]              [🌤️ Meteorológia]       │
│                            [💧 Vízállás]           │
│                            [🏜️ Aszály]             │
└─────────────────────────────────────────────────────┘

Jellemzők:
- Háttér: Fehér (#FFFFFF)
- Árnyék: shadow-sm
- Padding: 16px 24px
- Sticky pozíció (mindig látható görgetve is)
- Logo: "DunApp" - weight-bold, 24px
- Gombok: 
  - Border radius: 8px
  - Padding: 10px 20px
  - Aktív: színes háttér + fehér szöveg
  - Inaktív: fehér háttér + színes border
```

### Település/Állomás Választó
```
┌────────────────────────────────┐
│ 📍 [Szekszárd         ▼]      │
└────────────────────────────────┘

Jellemzők:
- Pozíció: Jobb felső sarok (modul tartalom alatt)
- Border: 2px solid modul színe
- Border radius: 8px
- Padding: 10px 16px
- Icon: Location marker
- Dropdown: Teljes lista, kereshető (később)
- Hover: árnyék megjelenés
```

### Adatkártya (Standard)
```
┌─────────────────────────────┐
│ [Icon] Címke                │
│                             │
│       Érték                 │
│       egység                │
└─────────────────────────────┘

Példa:
┌─────────────────────────────┐
│ 🌡️ Hőmérséklet              │
│                             │
│       15.3                  │
│       °C                    │
└─────────────────────────────┘

Jellemzők:
- Háttér: Fehér
- Border: 1px solid border-light
- Border radius: 12px
- Padding: 20px
- Árnyék: shadow-sm, hover-re shadow-md
- Icon: 24px, modul színe
- Címke: 14px, text-secondary
- Érték: 32px, weight-bold, text-primary
- Egység: 16px, text-light
```

### Adatkártya (Aszály - Dropdown-os)
```
┌─────────────────────────────────────┐
│ 🏜️ Aszályindex                      │
│                                     │
│ [Helyszín választó ▼]              │
│                                     │
│       2.3                           │
│       (Közepes aszály)              │
└─────────────────────────────────────┘

Jellemzők:
- Mint standard, DE:
- Dropdown: Beépítve a kártyába
- Dropdown border: 1px solid orange
- Státusz szöveg: Színkódolt kategória szerint
```

---

## 📊 Grafikon Specifikációk

### Vonaldiagram (Vízállás példa)
```
Jellemzők:
- Library: Recharts
- Vonal stílus: Szaggatott (strokeDasharray: "5 5")
- Pont méret: 6px
- Pont színek: 
  - Szekszárd: #00BCD4 (cyan)
  - Passau: #00897B (teal)
  - Nagybajcs: #43A047 (green)
- Tengelyek:
  - X: Dátum (okt. 24., okt. 25., stb.)
  - Y: Érték (cm-ben)
- Grid: Halványszürke vízszintes vonalak
- Tooltip: Fehér háttér, árnyék, konkrét értékek
- Legend: Fent, jobbra, színes körök + nevek
```

### Térképek (Aszály modul)
```
Általános:
- Library: Leaflet / React-Leaflet
- Alaptérkép: OpenStreetMap vagy MapBox
- Zoom kontroll: Bal felső
- Min zoom: 7 (Magyarország)
- Max zoom: 12
- Default center: [47.1625, 19.5033] (Magyarország közepe)
- Border radius: 8px
- Magasság: 400px

1. Talajvízszint Térkép:
   - Markerek: Kör alakú, színkódolt
   - Színek: Zöld (magas) → Narancs (közepes) → Piros (alacsony)
   - Popup: Kút neve, kód, aktuális szint
   - Cluster: Ha túl közel vannak

2. Aszálymonitoring Térkép:
   - Markerek: Monitoring állomások
   - Paraméter választó: Dropdown a térkép fölött
   - Színkódolás: Aszály kategória szerint
   - Legend: Jobb alsó sarokban

3. Vízhiány Térkép:
   - Heatmap vagy choropleth (területi színezés)
   - Színskála: Zöld → Sárga → Narancs → Piros
   - Overlay: Átlátszóság 0.6
   - Legend: Jobb alsó sarokban
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */

/* Mobile (default) */
@media (max-width: 640px) {
  - Kártyák: 1 oszlop
  - Térképek: Stack (egymás alatt)
  - Header gombok: Icon only
  - Font sizes: 90%
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  - Kártyák: 2 oszlop
  - Térképek: 2 oszlop (3. alatta)
  - Header: Normál
}

/* Desktop */
@media (min-width: 1025px) {
  - Kártyák: 3 oszlop (meteorológia: 2x3)
  - Térképek: 3 oszlop (egymás mellett)
  - Max width: 1280px, centered
}

/* Large Desktop */
@media (min-width: 1441px) {
  - Max width: 1440px
  - Nagyobb padding
}
```

---

## 🎯 Modul Specifikus Layouts

### 1. Meteorológia Modul

```
┌─────────────────────────────────────────────────────┐
│                  [📍 Szekszárd ▼]                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│  │ Hőmérséklet│  │ Csapadék │  │Szélsebesség│     │
│  │   15.3°C  │  │  26.2 mm │  │  4.1 km/h │      │
│  └───────────┘  └───────────┘  └───────────┘      │
│                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│  │Légnyomás  │  │Páratartalom│  │ Szélirány │     │
│  │ 1013 hPa │  │    65%    │  │ Ny (270°) │      │
│  └───────────┘  └───────────┘  └───────────┘      │
│                                                     │
├─────────────────────────────────────────────────────┤
│  📅 3 napos előrejelzés                            │
│  [Jelenleg üres / Később grafikonnal]              │
├─────────────────────────────────────────────────────┤
│  🌦️ Időjárás előrejelzés (6 órás bontás)          │
│  [Grafikon: Hőmérséklet + Csapadék kombináció]     │
├─────────────────────────────────────────────────────┤
│  🗺️ Radarkép                                       │
│  [Élő radarkép - Magyarország (RainViewer)]        │
└─────────────────────────────────────────────────────┘

Adatforrás jelzés (lábléc):
"Utolsó frissítés: 2025. 10. 24. 14:31:21
Forrás: OMSZ (omsz.met.hu)"
```

### 2. Vízállás Modul

```
┌─────────────────────────────────────────────────────┐
│                  [📍 Szekszárd ▼]                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  💧 Vízállás │  │ 🌊 Vízhozam  │  │🌡️Vízhőm. │ │
│  │    394 cm    │  │  2416 m³/s  │  │  23 °C   │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│  "Utolsó frissítés: 2025. 10. 24. 14:31:52"       │
│  "Forrás: VízÜgy Data Portal"                      │
├─────────────────────────────────────────────────────┤
│  📊 Vízállás Előrejelzés                           │
│  ┌───────────────────────────────────────────────┐ │
│  │  [Vonaldiagram - 3 állomás összehasonlítás]   │ │
│  │  - Szekszárd (cyan, szaggatott)               │ │
│  │  - Passau (teal, szaggatott)                  │ │
│  │  - Nagybajcs (green, szaggatott)              │ │
│  │                                                │ │
│  │  Legend: Színes körök + állomás nevek (jobb)  │ │
│  │  X tengely: okt. 24. - okt. 28.               │ │
│  │  Y tengely: 369 cm - 608 cm                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  📋 Adattábla (választott állomásokra):            │
│  ┌───────────┬──────────┬──────────┬──────────┐   │
│  │  Dátum    │ Szekszárd│  Passau  │ Nagybajcs│   │
│  ├───────────┼──────────┼──────────┼──────────┤   │
│  │ okt. 24.  │  394 cm  │  378 cm  │  581 cm  │   │
│  │ okt. 25.  │  389 cm  │  389 cm  │  608 cm  │   │
│  │ okt. 26.  │  369 cm  │  389 cm  │  586 cm  │   │
│  │ ...       │  ...     │  ...     │  ...     │   │
│  └───────────┴──────────┴──────────┴──────────┘   │
├─────────────────────────────────────────────────────┤
│  🔍 Kiegészítő adatok                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ Passau (Németország):         541 cm        │   │
│  │ Nagybajcs:                    487 cm        │   │
│  └─────────────────────────────────────────────┘   │
│  "Felső vízgyűjtő adatok - haszn...előrejelzéshez"│
└─────────────────────────────────────────────────────┘
```

### 3. Aszály Modul

```
┌─────────────────────────────────────────────────────┐
│                  [📍 Katymár ▼]                     │
├─────────────────────────────────────────────────────┤
│  📊 ADATKÁRTYÁK (Dropdown-os választással)         │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐       │
│  │🏜️ Aszályindex    │  │💧 Talajnedvesség │       │
│  │ [Helyszín ▼]     │  │ [Helyszín ▼]     │       │
│  │                  │  │                  │       │
│  │    N/A /10       │  │      N/A %       │       │
│  └──────────────────┘  └──────────────────┘       │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐       │
│  │🌡️ Vízhiány       │  │🚰 Talajvízszint  │       │
│  │ [Helyszín ▼]     │  │ [Kút választó ▼] │ ⭐    │
│  │                  │  │                  │       │
│  │    N/A mm        │  │    N/A m         │       │
│  └──────────────────┘  └──────────────────┘       │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🗺️ ASZÁLY ÉS TALAJVÍZ TÉRKÉPEK                   │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Aktuális    │ │ Aszály-     │ │ Vízhiány    │  │
│  │ talajvíz-   │ │ monitoring  │ │ térkép      │  │
│  │ szint (HUGEO│ │             │ │ (OVF)       │  │
│  │             │ │ [Paraméter: │ │             │  │
│  │ [Térkép     │ │ Aszályindex │ │ [Heatmap/   │  │
│  │  kutak      │ │  választó]  │ │  Choropleth]│  │
│  │  marker-    │ │             │ │             │  │
│  │  ekkel]     │ │ [Térkép     │ │ [Térkép     │  │
│  │             │ │  állomások- │ │  területi   │  │
│  │ Legend:     │ │  kal]       │ │  színezés]  │  │
│  │ [Színskála] │ │             │ │             │  │
│  │             │ │ Legend:     │ │ Legend:     │  │
│  │             │ │ □ Alacsony  │ │ [Színskála] │  │
│  │             │ │ □ Mérsékelt │ │             │  │
│  │             │ │ □ Közepes   │ │             │  │
│  │             │ │ □ Magas     │ │             │  │
│  │             │ │ □ Extrém    │ │             │  │
│  └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                     │
│  "Források: HUGEO talajvíz, OVF aszálymonitoring,  │
│   VízÜgy"                                           │
├─────────────────────────────────────────────────────┤
│  🚰 Talajvízkút Monitoring (15 kút)                │
│  ┌───────────────────────────────────────────────┐ │
│  │ Választható kutak 60 napos előzmények         │ │
│  │ megtekintéséhez. Forrás: VízÜgy Data Portal   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  📋 Kutak listája (3 oszlopos grid):               │
│  ┌──────────────┬──────────────┬──────────────┐   │
│  │ Sátorhely    │ Mohács II.   │ Kölked       │   │
│  │ #4576        │ #912         │ #1461        │   │
│  ├──────────────┼──────────────┼──────────────┤   │
│  │ Mohács       │ Mohács-Sárhát│ Dávod        │   │
│  │ #1460        │ #4481        │ #448         │   │
│  ├──────────────┼──────────────┼──────────────┤   │
│  │ Hercegszántó │ Nagybaracska │ Szeremle     │   │
│  │ #1450        │ #4479        │ #132042      │   │
│  ├──────────────┼──────────────┼──────────────┤   │
│  │ Alsónyék     │ Érsekcsanád  │ Decs         │   │
│  │ #662         │ #1426        │ #658         │   │
│  ├──────────────┼──────────────┼──────────────┤   │
│  │Szekszárd-    │ Öcsény       │ Báta         │   │
│  │ Borrév       │ #653         │ #660         │   │
│  │ #656         │              │              │   │
│  └──────────────┴──────────────┴──────────────┘   │
│                                                     │
│  [Kattintásra: Kút részletes adatai + grafikon]   │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Interakciók & Állapotok

### Hover Állapotok
- **Gombok**: Színárnyalat sötétedés + árnyék növelés
- **Kártyák**: shadow-sm → shadow-md
- **Dropdown**: Border színének kiemelése
- **Térképi markerek**: Felnagyítás + tooltip megjelenés

### Loading Állapotok
- **Adatok betöltése**: Skeleton loader (pulsing grey boxes)
- **Térképek**: Spinner középen, "Térkép betöltése..." szöveg
- **Grafikonok**: Placeholder box + loading szöveg

### Error Állapotok
- **API hiba**: Piros border a kártyán + "Adat nem elérhető" szöveg
- **Térkép hiba**: "Térkép nem tölthető be" szöveg + retry gomb
- **Nincs adat (N/A)**: Szürke szöveg, világos háttér, "Adat jelenleg nem elérhető"

### Empty States
- **Nincs előrejelzés**: "Az előrejelzési adatok jelenleg nem érhetők el"
- **Nincs grafikon adat**: "Válasszon helyszínt/állomást az adatok megtekintéséhez"

---

## 🎭 Ikonok

### Használt Icon Library
**Lucide React** vagy **React Icons** (Font Awesome)

### Modul Ikonok
- 🌤️ Meteorológia: `Cloud` / `CloudSun`
- 💧 Vízállás: `Droplet` / `Waves`
- 🏜️ Aszály: `Wind` / `Leaf`

### Adatkártya Ikonok
**Meteorológia:**
- Hőmérséklet: `Thermometer`
- Csapadék: `CloudRain`
- Szélsebesség: `Wind`
- Légnyomás: `Gauge`
- Páratartalom: `Droplets`
- Szélirány: `Navigation`

**Vízállás:**
- Vízállás: `Waves`
- Vízhozam: `TrendingUp`
- Vízhőmérséklet: `Thermometer`

**Aszály:**
- Aszályindex: `AlertTriangle`
- Talajnedvesség: `Droplet`
- Vízhiány: `TrendingDown`
- Talajvízszint: `ArrowDown`

### Utility Ikonok
- Helyszín választó: `MapPin`
- Dropdown: `ChevronDown`
- Frissítés: `RefreshCw`
- Információ: `Info`
- Bezárás: `X`

---

## 📏 Komponens Méretek

### Kártyák
```
Standard kártya: 
  Width: 100% (grid alapján)
  Min-height: 140px
  Padding: 20px

Térkép kártya:
  Width: 100%
  Height: 400px (desktop), 300px (mobile)
  Padding: 0
```

### Grafikon Konténerek
```
Standard grafikon:
  Width: 100%
  Height: 350px (desktop), 250px (mobile)
  Padding: 16px

Összehasonlító grafikon (multi-line):
  Height: 400px
```

### Térképek
```
Térképi nézet:
  Width: 100% (max 1280px container-ben)
  Height: 400px (desktop), 300px (mobile)
  Aspect ratio: 16:9 (ajánlott)
```

---

## ♿ Accessibility

### Szükséges Elemek
- **ARIA Labels**: Minden interaktív elemre
- **Alt Text**: Ikonok és képek számára
- **Focus States**: Látható outline interaktív elemeknél
- **Keyboard Navigation**: Tab, Enter, Escape támogatás
- **Color Contrast**: WCAG AA minimum (4.5:1)
- **Screen Reader**: Megfelelő szemantikus HTML

### Példák
```html
<!-- Település választó -->
<select 
  aria-label="Település kiválasztása"
  aria-describedby="city-selector-help"
>
  <option value="szekszard">Szekszárd</option>
</select>

<!-- Adatkártya -->
<div 
  role="region" 
  aria-labelledby="temperature-heading"
>
  <h3 id="temperature-heading">Hőmérséklet</h3>
  <p aria-live="polite">15.3 fok celsius</p>
</div>

<!-- Térkép -->
<div 
  role="img" 
  aria-label="Aszálymonitoring térkép Magyarország"
>
  [Leaflet térkép]
</div>
```

---

*Design Specifikáció v1.0 - 2025-10-24*
*Referencia: DunApp Bolt.new prototípus*
