# DunApp Redesign — Design Spec

**Dátum:** 2026-03-22
**Státusz:** Jóváhagyva
**Scope:** Csak design változás — nulla funkcionális módosítás

---

## Összefoglalás

A DunApp PWA vizuális megújítása a "Dunai tájkép" design rendszerre (`design/tokens.css`, `design/DESIGN_REFERENCE.md`). Az app minden modulját érintő, rétegekre bontott redesign, amely megtartja az összes meglévő funkcionalitást.

---

## Döntések

| Döntés | Választás | Indok |
|--------|-----------|-------|
| Megközelítés | Rétegről rétegre (B) | Tiszta rétegek, minden lépés önállóan tesztelhető |
| Tailwind coexistence | Fokozatos kiváltás | `dun-*` osztályok az elsődlegesek; Tailwind layout utility-k megmaradnak (`flex`, `grid`, `gap-*`) |
| Ikonok | Egyedi `dunapp-icons` SVG sprite | Domain-specifikus ikonok (mérőléc, repedező talaj, kút) |
| Dark mode | Auto + kézi kapcsoló | `prefers-color-scheme` + `data-theme` attribútum + localStorage |
| Header stílus | Sötét (A variáns) | Erős brand jelenlét, éjszaka is jól néz ki |

---

## Architektúra

### Réteg 1 — Globális alap (szekvenciális)

Minden más előtt kell elvégezni — ez az alap, amire a többi épül.

| Fájl | Változás |
|------|----------|
| `src/styles/design-tokens.css` | Teljes csere → `design/tokens.css` tartalmával |
| `src/styles/components.css` | `dun-*` osztályok hozzáadva; régi `@apply` blokkok fokozatosan lecserélve |
| `src/index.css` | Google Fonts import: DM Serif Display, IBM Plex Mono, Inter |
| `public/icons/dunapp-icons.svg` | Új fájl — `design/dunapp-icons.svg` másolata |
| `src/components/Icon.tsx` | Új komponens — SVG sprite `<use>` wrapper |

**Icon komponens:**
```tsx
interface IconProps {
  id: string;
  size?: number;
  className?: string;
  label?: string;
}

export const Icon = ({ id, size = 24, className = '', label }: IconProps) => (
  <svg
    width={size}
    height={size}
    aria-label={label}
    aria-hidden={!label}
    className={className}
  >
    <use href={`/icons/dunapp-icons.svg#${id}`} />
  </svg>
);
```

**Dark mode kezelés (App.tsx):**
- `useState` + `localStorage` + `useEffect` a `<html data-theme>` attribútum kezelésére
- Inicializáláskor: localStorage → ha nincs, `prefers-color-scheme` az alap
- Toggle gomb a Headerben

### Réteg 2 — Layout és UI alap (párhuzamosan)

**Agent A — `src/components/Layout/`**
- Header, Footer, ModuleTabs (→ bottom nav)

**Agent B — `src/components/UI/`**
- DataCard, Badge, LoadingSpinner, EmptyState, ErrorBoundary

**Agent C — `src/components/selectors/`**
- CitySelector, StationSelector, DroughtLocationSelector, WellSelector

### Réteg 3 — Modulok (párhuzamosan, Réteg 2 után)

**Agent D — `src/modules/meteorology/`**
**Agent E — `src/modules/water-level/`**
**Agent F — `src/modules/drought/`**

---

## Komponens specifikációk

### Header

```
Háttér:    #0d2b3e (--color-dun-deep-800)
Border:    border-bottom: 0.5px solid rgba(126,207,199,.15)
Padding:   14px 16px 12px

Bal oldal:
  - "DunApp" — DM Serif Display 22px, color: #7ecfc7 (--color-dun-ripple-200)
  - Alcím: "Déli Duna-völgy · 2026-03-22" — Inter 10px, rgba(255,255,255,.35), uppercase, letter-spacing .1em

Jobb oldal:
  - Dark mode toggle pill (32×18px), bg: rgba(34,166,179,.25)
  - icon-alert-bell gomb: 32px kerek, border: 0.5px rgba(126,207,199,.2), color: #7ecfc7
```

### Bottom Navigation (lecseréli a ModuleTabs-t)

```
Osztály:   dun-nav (fixed bottom, frosted glass, safe-area-inset-bottom)
Elemek:
  - icon-meteo   + "Időjárás"
  - icon-water   + "Vízállás"
  - icon-drought + "Aszály"

Aktív állapot:
  background: rgba(34,166,179,.10)
  border:     0.5px solid rgba(34,166,179,.25)
  color:      #22a6b3 (--color-dun-wave-400)

Idle állapot:
  color: #7a9eaa (--nav-icon-idle)
```

### DataCard

**Fehér kártya (`dun-card`):**
```
├── dun-card-header
│     ├── Icon (22px) — modul akcentszínnel
│     ├── dun-module-label (11px caps) — helyszín/modul neve
│     └── dun-badge (jobbra igazítva) — állapot
└── dun-card-body
      ├── dun-value (IBM Plex Mono 32px, --text-primary)
      └── dun-value-unit (Inter 13px, --text-tertiary)
```

**Sötét hero kártya (`dun-card-dark dun-ripple-deco`):**
```
Kiemelt adat megjelenítése (pl. napi max temp, aktív árvíz-alert)
├── dun-card-dark-label (10px caps, rgba(255,255,255,.38))
└── dun-value-xl (44px) vagy dun-value (32px)
```

### Badge-ek

```
dun-badge-ok    → #e8f5ee bg / #2d8a5e szöveg  (Normál, OK)
dun-badge-warn  → #fef6e7 bg / #8a5500 szöveg  (Emelkedő, Figyelem)
dun-badge-alert → #fdeaea bg / #b94040 szöveg  (Árvízveszély, Kritikus)
```

### Selectorok

```
Border:     0.5px solid rgba(26,95,122,.18)
Focus ring: --accent-primary (#22a6b3) — meteo/víz; --color-dun-amber-400 — drought
Font:       Inter 14px, --text-primary
Background: --bg-surface; hover: --bg-surface-alt
Border-radius: --radius-md (10px)
```

### Közös UI állapotok

```
Loading:    spinner color → --accent-primary
Empty:      --text-tertiary szöveg, --bg-surface-alt háttér
Error:      dun-badge-alert stílusú sáv
Timestamp:  dun-meta osztály (IBM Plex Mono 11px, --text-tertiary, letter-spacing .06em)
Trend:      dun-trend-up (--color-dun-alert-500) / dun-trend-down (--color-dun-ok-500)
```

---

## Modul-specifikus változások

### Meteorológia

- **Akcentszín:** `--color-dun-wave-400` (#22a6b3)
- Hőmérséklet hero: `dun-card-dark` + `dun-value-xl` (44px)
- 6 órás forecast: `dun-card` sorban, kis méret
- Nap/Hold kártyák: `dun-card` + `dun-meta` időpontokhoz
- RadarMap: változatlan (Leaflet), legenda container → block layout (nem flex!)
- WeatherMapsWidget kritikus szabályok: `preferCanvas` és `maxBounds` TILOS (CLAUDE.md)

### Vízállás

- **Akcentszín:** `--color-dun-current-600` (#1a5f7a)
- Állomás kártyák: `dun-card` + `dun-value` + `dun-trend-up/down`
- Alert állapot (≥400cm): `dun-card-dark` + `dun-badge-alert`
- Táblázat: `--bg-surface-alt` sorok, `--border-subtle` elválasztók
- MultiStationChart: Recharts stroke → `--color-dun-wave-400`

### Aszály

- **Akcentszín:** `--color-dun-amber-400` (#d4851c)
- HDI index hero: `dun-card-dark` + nagy szám + `dun-badge` állapot
- Talajnedvesség (6 mélység): `dun-card`, mélységi sáv amber→red skálán
- Talajvízkút kártyák: `dun-card` + `icon-groundwater` + `dun-value`
- Drought térkép legenda: **block layout** (`px-3 py-2.5`), SOHA nem `flex items-center`

---

## Nem változik

- Összes hook (`useGroundwaterWells`, `useWaterLevel`, stb.)
- Supabase kliens és Edge Function hívások
- TypeScript interfészek és típusok
- Service worker (Workbox) logika
- Push notification logika
- Leaflet térkép funkcionális konfigurációja
- Recharts adatkötések
- `enabled=true` szűrő a kutaknál

---

## Technikai korlátok (CLAUDE.md alapján)

- `WeatherMapsWidget`: `preferCanvas={true}` és `maxBounds` TILOS
- Drought legenda container: SOHA nem `flex items-center`
- Minden modulnak saját selector — SOHA nem globális
- Drought modulban 2 KÜLÖN selector (locations + wells)

---

## Siker kritériumok

- [ ] Az app vizuálisan az új "Dunai tájkép" design rendszert tükrözi
- [ ] Dark/light mode kézi toggle + auto (`prefers-color-scheme`) működik
- [ ] Minden modul egyedi akcentszínnel rendelkezik
- [ ] Az egyedi `dunapp-icons` sprite használatos a navigációban és modul fejlécekben
- [ ] IBM Plex Mono jelenik meg minden mért adatnál
- [ ] DM Serif Display jelenik meg a Header "DunApp" feliratban
- [ ] Nulla funkcionális regresszió
- [ ] Leaflet térképek és Recharts grafikonok helyesen jelennek meg
