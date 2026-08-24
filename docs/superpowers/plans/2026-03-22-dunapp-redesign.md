# DunApp Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lecserélni a DunApp PWA vizuális megjelenését a "Dunai tájkép" design rendszerre, nulla funkcionális változással.

**Architecture:** Rétegről rétegre haladunk: Réteg 1 (globális tokenek, fontok, icon sprite) szekvenciálisan, Réteg 2 (Layout, UI, Selectors) és Réteg 3 (modulok) párhuzamosan. A Tailwind layout utility-k megmaradnak (`flex`, `grid`, `gap-*`), a `dun-*` CSS osztályok váltják ki a Tailwind color/shape osztályokat. Auto + kézi dark mode (`prefers-color-scheme` + `data-theme`).

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS (layout utility-k) + CSS Custom Properties (design tokenek) + SVG sprite (ikonok)

> **Előfeltétel:** A `design/tokens.css` és `design/dunapp-icons.svg` fájlok megléte szükséges a Réteg 1 előtt. Ellenőrzés: `ls design/` — mindkét fájlnak ott kell lennie.

> **Megjegyzés:** A projekt jelenleg nem git repo. A commit lépések elvégezhetők miután `git init` + GitHub remote beállításra kerül. A fejlesztési ágra (`develop`) kell pusholni, nem a `main`-re.

> **Dev szerver:** `npm run dev` — minden task után ellenőrizd a böngészőben.

> **Tesztek futtatása:** `npm test` (vagy `npm run test:run`)

---

## Fájl struktúra áttekintés

| Módosítás | Fájl | Leírás |
|-----------|------|--------|
| Csere | `src/styles/design-tokens.css` | Új "Dunai tájkép" tokenek |
| Módosítás | `src/styles/components.css` | `dun-*` osztályok hozzáadása |
| Módosítás | `src/index.css` | Google Fonts import, body reset |
| Új | `public/icons/dunapp-icons.svg` | Custom SVG sprite |
| Új | `src/components/Icon.tsx` | SVG sprite wrapper komponens |
| Módosítás | `src/App.tsx` | Dark mode state + `data-theme` kezelés |
| Módosítás | `src/components/Layout/Header.tsx` | Sötét header, DM Serif Display |
| Módosítás | `src/components/Layout/ModuleTabs.tsx` | → BottomNav (`dun-nav`) |
| Módosítás | `src/components/Layout/Footer.tsx` | Új tokenek |
| Módosítás | `src/components/HomePage.tsx` | Új design, DM Serif Display branding |
| Módosítás | `src/components/UI/DataCard.tsx` | → `dun-card`, IBM Plex Mono értékek |
| Módosítás | `src/components/UI/LoadingSpinner.tsx` | Új akcentszín |
| Módosítás | `src/components/UI/EmptyState.tsx` | Új tokenek |
| Módosítás | `src/components/UI/ErrorBoundary.tsx` | Új tokenek |
| Módosítás | `src/components/selectors/CitySelector.tsx` | Meteo akcentszín tokenek |
| Módosítás | `src/components/selectors/StationSelector.tsx` | Víz akcentszín tokenek |
| Módosítás | `src/components/selectors/DroughtLocationSelector.tsx` | Amber akcentszín tokenek |
| Módosítás | `src/components/selectors/WellSelector.tsx` | Amber akcentszín tokenek |
| Módosítás | `src/modules/meteorology/*.tsx` | Meteo modul redesign |
| Módosítás | `src/modules/water-level/*.tsx` | Vízállás modul redesign |
| Módosítás | `src/modules/drought/*.tsx` | Aszály modul redesign |

---

## RÉTEG 1 — Globális alap (szekvenciális)

### Task 1: Design tokenek cseréje

**Files:**
- Modify: `src/styles/design-tokens.css`
- Modify: `src/index.css`

- [ ] **Step 1: Cseréld le a `src/styles/design-tokens.css` teljes tartalmát**

  Másold be a `design/tokens.css` teljes tartalmát. Ez a fájl tartalmazza az összes CSS custom property-t, a light/dark theme definíciókat, a tipográfiai tokeneket, és az alap `dun-*` segédosztályokat.

  ```bash
  cp "design/tokens.css" "src/styles/design-tokens.css"
  ```

- [ ] **Step 2: Add Google Fonts importot az `src/index.css` elejéhez**

  Az `src/index.css` elején, a `@import "tailwindcss"` sor UTÁN add hozzá:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
  ```
  (A `design/tokens.css`-ben lévő `@import url(...)` sor redundáns lesz, de nem árt — a böngésző cachelni fogja.)

- [ ] **Step 3: Frissítsd az `src/index.css` body stílusát**

  Az `src/index.css`-ben a `@layer base` blokkban módosítsd a body-t:

  ```css
  body {
    @apply min-h-screen;
    margin: 0;
    background-color: var(--bg-app);
    color: var(--text-primary);
    font-family: var(--font-ui);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ```

  A `h1`–`h6` hardkódolt hex színeket cseréld le:
  - `color: #111827` → `color: var(--text-primary)`
  - `color: #1f2937` → `color: var(--text-primary)`
  - `color: #374151` → `color: var(--text-secondary)`

  A link `color: #0891b2` → `color: var(--accent-primary)`, hover → `color: var(--accent-hover)`.

  A `:focus-visible` box-shadow maradhat, de a kék hex → `var(--accent-primary)`.

- [ ] **Step 3: Indítsd el a dev szervert és ellenőrizd**

  ```bash
  npm run dev
  ```

  Elvárt: az app betöltődik, a háttér `#f5f7f8` (volt: `#F0F4F8`), szöveg `#0d2b3e`. Nincs JS hiba a konzolban. A Google Fonts (DM Serif Display, IBM Plex Mono, Inter) betöltődnek a network tab-ban.

---

### Task 2: `dun-*` komponens osztályok hozzáadása

**Files:**
- Modify: `src/styles/components.css`

- [ ] **Step 1: Nyisd meg az `src/index.css`-t és aktiváld a components importot**

  Az `src/index.css`-ben:
  ```css
  /* Volt: */
  /* TEMPORARILY DISABLED - Tailwind 4.0 @apply circular references */
  /* @import './styles/components.css'; */

  /* Legyen: */
  @import './styles/components.css';
  ```

- [ ] **Step 2: Cseréld le az `src/styles/components.css` tartalmát**

  A meglévő `@layer components` blokkot tartsd meg, de a régi `.data-card`, `.module-tab` stb. osztályok mellé — NE töröld el őket, csak kommentezd ki a `@apply`-os sorokat amelyek cirkuláris hibát okoztak. Adj hozzá egy új `@layer components` blokkot a végéhez:

  ```css
  @layer components {
    /* dun-* wrapper osztályok — Tailwind-kompatibilis aliasok */

    .dun-card-tw {
      background: var(--bg-surface);
      border: var(--border-thin) solid var(--border-default);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .dun-badge-ok-tw {
      background: var(--status-ok-bg);
      color: var(--status-ok-text);
      border: var(--border-thin) solid var(--status-ok-border);
    }

    .dun-badge-warn-tw {
      background: var(--status-warn-bg);
      color: var(--status-warn-text);
      border: var(--border-thin) solid var(--status-warn-border);
    }

    .dun-badge-alert-tw {
      background: var(--status-alert-bg);
      color: var(--status-alert-text);
      border: var(--border-thin) solid var(--status-alert-border);
    }
  }
  ```

  Megjegyzés: A `design/tokens.css`-ből már bekerültek a `dun-card`, `dun-badge`, `dun-nav` stb. pure CSS osztályok a `src/styles/design-tokens.css`-be (a Task 1 másolásával). A fenti `@layer components` wrapperek a Tailwind specificity-kezeléséhez kellenek.

- [ ] **Step 3: Tesztek futtatása**

  ```bash
  npm test
  ```

  Elvárt: minden meglévő teszt zöld (a CSS változás nem töri a komponensteszteket).

---

### Task 3: SVG sprite és Icon komponens

**Files:**
- Create: `public/icons/dunapp-icons.svg`
- Create: `src/components/Icon.tsx`

- [ ] **Step 1: Másold az icon sprite-ot a public mappába**

  ```bash
  mkdir -p public/icons
  cp design/dunapp-icons.svg public/icons/dunapp-icons.svg
  ```

- [ ] **Step 2: Hozd létre az `src/components/Icon.tsx` fájlt**

  ```tsx
  /**
   * Icon Component
   * SVG sprite wrapper — dunapp-icons.svg
   *
   * Ikon azonosítók: icon-meteo, icon-meteo-fill, icon-water, icon-water-down,
   * icon-drought, icon-drought-severe, icon-groundwater, icon-alert-bell,
   * icon-station, icon-chart
   */

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
      focusable="false"
    >
      <use href={`/icons/dunapp-icons.svg#${id}`} />
    </svg>
  );
  ```

- [ ] **Step 3: Ellenőrzés a dev szerverrel**

  Indítsd el a dev szervert (`npm run dev`), nyisd meg a böngészőben. Ellenőrizd a konzolban, hogy nincs 404 hiba a `/icons/dunapp-icons.svg` betöltésekor.

---

### Task 4: Dark mode kezelés az `App.tsx`-ben

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Adj hozzá dark mode state-et és `useEffect`-et az `App.tsx`-hez**

  Az `useState` és `useEffect` importok már megvannak. Adj hozzá a meglévő `useState<ModuleType>` sor után:

  ```tsx
  // Dark mode: localStorage + prefers-color-scheme
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('dunapp-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('dunapp-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  ```

- [ ] **Step 2: Passzold le az `isDark` és `setIsDark` értékeket a Header-nek**

  A Header összes `<Header ... />` hívásban add hozzá:
  ```tsx
  <Header
    currentModule={activeModule}
    onModuleChange={setActiveModule}
    isDark={isDark}
    onToggleDark={() => setIsDark(d => !d)}
  />
  ```

- [ ] **Step 3: Tesztek futtatása**

  ```bash
  npm test
  ```

  Elvárt: minden meglévő teszt zöld.

---

## RÉTEG 2 — Layout és UI alap (párhuzamosan indítható a Réteg 1 után)

### Task 5: Header redesign

**Files:**
- Modify: `src/components/Layout/Header.tsx`
- Modify: `src/components/Layout/Header.test.tsx` (ha szükséges prop frissítés)

- [ ] **Step 1: Frissítsd a Header props interfészét**

  ```tsx
  interface HeaderProps {
    currentModule: ModuleType | null;
    onModuleChange: (module: ModuleType | null) => void;
    isDark: boolean;
    onToggleDark: () => void;
  }
  ```

- [ ] **Step 2: Írd át a Header JSX-et**

  Importok:
  ```tsx
  import { Bell, Sun, Moon } from 'lucide-react';
  import { Icon } from '../Icon';
  // Cloud, Droplet, Sprout importokat TÖRÖLD — már nem kellenek a header-ben
  ```

  Komponens törzse:
  ```tsx
  export const Header: React.FC<HeaderProps> = ({
    currentModule, onModuleChange, isDark, onToggleDark
  }) => {
    const today = new Date().toLocaleDateString('hu-HU', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
      <header
        style={{
          background: 'var(--color-dun-deep-800)',
          borderBottom: '0.5px solid rgba(126,207,199,.15)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-nav)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          {/* Logo */}
          <button
            onClick={() => onModuleChange(null)}
            className="flex flex-col hover:opacity-80 transition-opacity text-left"
            aria-label="DunApp főoldal"
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                color: 'var(--color-dun-ripple-200)',
                lineHeight: 1,
              }}
            >
              DunApp
            </span>
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '10px',
                color: 'rgba(255,255,255,.35)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              Déli Duna-völgy · {today}
            </span>
          </button>

          {/* Jobb oldal: toggle + értesítés */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              aria-label={isDark ? 'Váltás világos módra' : 'Váltás sötét módra'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-full)',
                border: '0.5px solid rgba(126,207,199,.25)',
                background: 'rgba(34,166,179,.15)',
                color: 'var(--color-dun-ripple-200)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              {isDark
                ? <Sun size={16} aria-hidden />
                : <Moon size={16} aria-hidden />
              }
            </button>

            {/* Értesítések gomb */}
            <button
              aria-label="Értesítések"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '0.5px solid rgba(126,207,199,.2)',
                background: 'transparent',
                color: 'var(--color-dun-ripple-200)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              <Icon id="icon-alert-bell" size={18} />
            </button>
          </div>
        </div>
      </header>
    );
  };
  ```

- [ ] **Step 3: Frissítsd a Header tesztet az új propokkal**

  A `src/components/Layout/Header.test.tsx`-ben add hozzá az `isDark` és `onToggleDark` propokat a render híváshoz:
  ```tsx
  render(<Header currentModule={null} onModuleChange={vi.fn()} isDark={false} onToggleDark={vi.fn()} />)
  ```

- [ ] **Step 4: Tesztek + dev szerver ellenőrzés**

  ```bash
  npm test
  npm run dev
  ```
  Elvárt: sötét header, türkiz "DunApp" felirat, dátum, toggle gomb, értesítés gomb.

---

### Task 6: Bottom Navigation (ModuleTabs → BottomNav)

**Files:**
- Modify: `src/components/Layout/ModuleTabs.tsx`
- Modify: `src/components/Layout/ModuleTabs.test.tsx`
- Modify: `src/App.tsx` (bottom nav megjelenítése, main content padding)

- [ ] **Step 1: Írd át a ModuleTabs-t bottom nav-vá**

  ```tsx
  import { Icon } from '../Icon';
  // Cloud, Droplet, Wind importokat TÖRÖLD

  export const ModuleTabs: React.FC<ModuleTabsProps> = ({ currentModule, onModuleChange }) => {
    const tabs = [
      { module: 'meteorology' as ModuleType, label: 'Időjárás', iconId: 'icon-meteo', ariaLabel: 'Meteorológiai modul' },
      { module: 'water-level' as ModuleType, label: 'Vízállás', iconId: 'icon-water', ariaLabel: 'Vízállás modul' },
      { module: 'drought' as ModuleType, label: 'Aszály', iconId: 'icon-drought', ariaLabel: 'Aszály modul' },
    ];

    return (
      <nav
        className="dun-nav"
        aria-label="Modul navigáció"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = currentModule === tab.module;
          return (
            <button
              key={tab.module}
              onClick={() => onModuleChange(tab.module)}
              className={`dun-nav-item${isActive ? ' active' : ''}`}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              role="tab"
              aria-selected={isActive}
            >
              <Icon id={tab.iconId} size={22} />
              <span className="dun-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    );
  };
  ```

- [ ] **Step 2: Adj hozzá bottom padding-et a main contentnek az `App.tsx`-ben**

  Az `App.tsx`-ben a `<main>` elem className-jébe add hozzá a bottom paddinget a nav miatt:
  ```tsx
  <main className="mx-auto max-w-7xl px-4 py-6 md:py-8 pb-24">
  ```

  (A `pb-24` = 96px, elegendő a fixed bottom nav fölé.)

- [ ] **Step 3: `ModuleTabs` megjelenítése az App-ban minden modulnál**

  Az `App.tsx`-ben a `<Header />` után a main content elé add hozzá a `ModuleTabs` importját (ha még nincs) és jelenítsd meg:
  ```tsx
  import { ModuleTabs } from './components/Layout/ModuleTabs';

  // A return-ben, aktív modul esetén:
  {activeModule && (
    <ModuleTabs currentModule={activeModule} onModuleChange={setActiveModule} />
  )}
  ```

- [ ] **Step 4: Tesztek + dev szerver**

  ```bash
  npm test && npm run dev
  ```
  Elvárt: bottom navban megjelennek az egyedi ikonok és feliratok, aktív állapot frosted glass háttérrel.

---

### Task 7: DataCard redesign

**Files:**
- Modify: `src/components/UI/DataCard.tsx`
- Modify: `src/components/UI/DataCard.test.tsx` (prop interface update)

- [ ] **Step 1: Írd át a DataCard-ot az új design rendszerre**

  Az `icon: LucideIcon` prop típusa változik: az icon most `iconId: string` (dunapp-icons ID) **VAGY** megtartjuk a `LucideIcon`-t és csak a stílusokat cseréljük.

  **Fontos:** Ha a modulokban sok helyen `icon={SomeLucideIcon}` hívás van, a `LucideIcon` prop megtartása kevesebb módosítással jár. A DataCard-ban csak a stílusok változnak, a prop interface NEM változik (visszafelé kompatibilitás).

  ```tsx
  export const DataCard = React.memo<DataCardProps>(({
    icon: IconComponent,
    label,
    value,
    unit,
    moduleColor = 'meteorology',
    className = '',
    children,
  }) => {
    const accentColorMap = {
      meteorology: 'var(--color-dun-wave-400)',
      water: 'var(--color-dun-current-600)',
      drought: 'var(--color-dun-amber-400)',
    };
    const accentColor = accentColorMap[moduleColor];
    const displayValue = value !== null && value !== undefined ? value : '–';

    return (
      <div
        className={`dun-card ${className}`}
        role="region"
        aria-labelledby={`card-${label}`}
      >
        {/* Header */}
        <div className="dun-card-header">
          <IconComponent
            size={20}
            aria-hidden
            style={{ color: accentColor, flexShrink: 0 }}
          />
          <span
            id={`card-${label}`}
            className="dun-module-label"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {label}
          </span>
        </div>

        {/* Body */}
        <div className="dun-card-body">
          {children && <div className="mb-3">{children}</div>}
          <div className="mt-auto">
            <p
              className="dun-value"
              style={{ color: 'var(--text-primary)' }}
              aria-live="polite"
            >
              {displayValue}
              <span className="dun-value-unit">{unit}</span>
            </p>
          </div>
        </div>
      </div>
    );
  });
  ```

- [ ] **Step 2: Tesztek futtatása**

  ```bash
  npm test
  ```
  Elvárt: a DataCard tesztek zöldek (a prop interface nem változott).

- [ ] **Step 3: Dev szerver ellenőrzés**

  Nyisd meg valamelyik modult, ellenőrizd a DataCard megjelenését.

---

### Task 8: LoadingSpinner, EmptyState, ErrorBoundary redesign

**Files:**
- Modify: `src/components/UI/LoadingSpinner.tsx`
- Modify: `src/components/UI/EmptyState.tsx`
- Modify: `src/components/UI/ErrorBoundary.tsx`

- [ ] **Step 1: LoadingSpinner — frissítsd a spinnerhez és szöveghez a színeket**

  A `border-cyan-600` class helyett inline style:
  ```tsx
  <div
    className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]}`}
    style={{
      borderColor: 'var(--accent-primary)',
      borderTopColor: 'transparent',
    }}
    aria-hidden="true"
  />
  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
    {message}
  </p>
  ```

- [ ] **Step 2: EmptyState — cseréld le a hardkódolt Tailwind color osztályokat**

  Az `EmptyState.tsx`-t nyisd meg és olvasd el, majd minden `text-gray-*`, `bg-gray-*` Tailwind color osztályt cseréld CSS variable inline style-ra:
  - `text-gray-400` → `style={{ color: 'var(--text-tertiary)' }}`
  - `bg-gray-50` → `style={{ background: 'var(--bg-surface-alt)' }}`
  - `border-gray-200` → `style={{ borderColor: 'var(--border-default)' }}`

- [ ] **Step 3: ErrorBoundary — ugyanez**

  `border-red-200 bg-red-50 text-red-900` → `dun-badge-alert` stílusú inline styles:
  ```tsx
  style={{
    background: 'var(--status-alert-bg)',
    color: 'var(--status-alert-text)',
    border: '0.5px solid var(--status-alert-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4)',
  }}
  ```

- [ ] **Step 4: Tesztek**

  ```bash
  npm test
  ```

---

### Task 9: Selectorok redesign

**Files:**
- Modify: `src/components/selectors/CitySelector.tsx`
- Modify: `src/components/selectors/StationSelector.tsx`
- Modify: `src/components/selectors/DroughtLocationSelector.tsx`
- Modify: `src/components/selectors/WellSelector.tsx`

- [ ] **Step 1: CitySelector — meteo akcentszín tokenek**

  A selector gomb `border-cyan-200 text-cyan-700 hover:bg-cyan-50 focus:ring-cyan-500` Tailwind class-okat cseréld inline style-ra:

  ```tsx
  // Gomb
  style={{
    border: '0.5px solid rgba(26,95,122,.18)',
    color: 'var(--text-primary)',
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-2) var(--space-4)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    transition: 'var(--transition-fast)',
    cursor: 'pointer',
  }}

  // Dropdown lista
  style={{
    background: 'var(--bg-surface)',
    border: '0.5px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
  }}

  // Dropdown item selected
  style={{ background: 'var(--bg-surface-alt)' }}

  // Dropdown item hover → CSS class megoldás (ne használj onMouseEnter/Leave):
  // Add a .dun-selector-item osztályt a components.css-hez:
  // .dun-selector-item:hover { background: var(--bg-surface-alt); }
  // Majd className="dun-selector-item w-full px-4 py-2 text-left ..."
  ```

- [ ] **Step 2: StationSelector — ugyanez, víz akcentszínnel**

  A `border-cyan-300` és kapcsolódó cyan osztályokat cseréld. Az akcentszín: `var(--color-dun-current-600)` (#1a5f7a).

- [ ] **Step 3: DroughtLocationSelector és WellSelector — amber akcentszín**

  A `border-orange-*` osztályokat cseréld, akcentszín: `var(--color-dun-amber-400)` (#d4851c).

- [ ] **Step 4: Tesztek**

  ```bash
  npm test
  ```

---

### Task 10: HomePage redesign

**Files:**
- Modify: `src/components/HomePage.tsx`

- [ ] **Step 1: Írd át a HomePage-et az új design rendszerre**

  ```tsx
  export const HomePage: React.FC<HomePageProps> = ({ onModuleSelect }) => {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ background: 'var(--bg-app)' }}
      >
        {/* Brand */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img src="/icons/icon-192x192.svg" alt="DunApp Logo" className="w-24 h-24 md:w-32 md:h-32" />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 8vw, 72px)',
              color: 'var(--color-dun-current-600)',
              lineHeight: 1,
              marginBottom: 'var(--space-2)',
            }}
          >
            DunApp
          </h1>
          <p className="dun-meta" style={{ marginBottom: 'var(--space-3)' }}>
            v 3.0
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
            Meteorológiai és Vízügyi Monitoring
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {[
            { module: 'meteorology' as ModuleType, label: 'Meteorológia', desc: 'Időjárás-előrejelzés és radar', iconId: 'icon-meteo', accent: 'var(--color-dun-wave-400)' },
            { module: 'water-level' as ModuleType, label: 'Vízállás', desc: 'Dunai vízszint monitoring', iconId: 'icon-water', accent: 'var(--color-dun-current-600)' },
            { module: 'drought' as ModuleType, label: 'Aszály', desc: 'HDI index és talajvíz', iconId: 'icon-drought', accent: 'var(--color-dun-amber-400)' },
          ].map(({ module, label, desc, iconId, accent }) => (
            <button
              key={module}
              onClick={() => onModuleSelect(module)}
              className="dun-card flex flex-col items-center text-center p-8 hover:shadow-lg transition-shadow"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <div
                className="flex items-center justify-center mb-4 rounded-full"
                style={{
                  width: '64px', height: '64px',
                  background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                  color: accent,
                }}
              >
                <Icon id={iconId} size={32} />
              </div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                {label}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                {desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  };
  ```

  Ne felejtsd el importálni: `import { Icon } from './Icon';`

- [ ] **Step 2: Dev szerver ellenőrzés**

  ```bash
  npm run dev
  ```
  Elvárt: a HomePage az új designnal jelenik meg, DM Serif Display branding, egyedi modul ikonok.

---

## RÉTEG 3 — Modulok (párhuzamosan, Réteg 2 után)

> **Közös elvek minden modulhoz:**
> - Minden `text-gray-*`, `bg-white`, `border-gray-*` Tailwind color osztályt cseréld CSS variable inline style-ra
> - Minden `text-cyan-*`, `text-orange-*` modul-szín osztályt a megfelelő token-re
> - Az IBM Plex Mono fontot minden számértéknél használd: `fontFamily: 'var(--font-data)'`
> - A Tailwind layout osztályok (`flex`, `grid`, `gap-4`, `p-4`, `w-full`) maradnak
> - Tesztek minden task után

---

### Task 11: Meteorológia modul redesign

**Files:**
- Modify: `src/modules/meteorology/MeteorologyModule.tsx`
- Modify: `src/modules/meteorology/ForecastChart.tsx`
- Modify: `src/modules/meteorology/SunTimesCards.tsx`
- Modify: `src/modules/meteorology/MoonTimesCards.tsx`
- Modify: `src/modules/meteorology/PrecipitationSummaryCard.tsx`
- **NE módosítsd:** `src/modules/meteorology/WeatherMapsWidget.tsx` (csak a legenda container!)
- **NE módosítsd:** `src/modules/meteorology/RadarMap.tsx` (Leaflet kritikus konfiguráció)

- [ ] **Step 1: `MeteorologyModule.tsx` — layout wrapper és szekció fejlécek**

  - Háttér: `var(--bg-app)` (volt: `bg-gray-50` vagy hasonló)
  - Szekció fejlécek: `fontFamily: 'var(--font-ui)'`, `color: 'var(--text-secondary)'`
  - A `CitySelector` wrapper div-jei: `var(--bg-surface)` háttér, `var(--border-default)` border

- [ ] **Step 2: `ForecastChart.tsx` — Recharts color frissítés**

  - `stroke="#00BCD4"` → `stroke="var(--color-dun-wave-400)"` (vagy `#22a6b3`)
  - `stroke="#FF9800"` → `stroke="var(--color-dun-amber-400)"`
  - Tooltip background: `var(--bg-surface)`, border: `var(--border-default)`, color: `var(--text-primary)`
  - CartesianGrid stroke: `var(--border-subtle)`
  - Axis tick fill: `var(--text-tertiary)`

- [ ] **Step 3: `SunTimesCards.tsx` és `MoonTimesCards.tsx`**

  - `bg-white border-*` → `dun-card` osztály
  - Időpontok megjelenítése: `fontFamily: 'var(--font-data)'`, `color: 'var(--text-data)'`
  - Feliratok: `dun-module-label` osztály vagy `color: 'var(--text-tertiary)'`

- [ ] **Step 4: `PrecipitationSummaryCard.tsx`**

  - `bg-white border-*` → `dun-card`
  - Csapadék értékek: `fontFamily: 'var(--font-data)'`
  - Trend nyilak: `dun-trend-up` / `dun-trend-down` osztály

- [ ] **Step 5: `WeatherMapsWidget.tsx` — CSAK a legenda container**

  Keresd meg a legenda container div-jét és ellenőrizd hogy **NEM** `flex items-center` (CLAUDE.md szabály). Ha igen, cseréld:
  ```tsx
  // TILOS: className="... flex items-center ..."
  // Helyes:
  <div className="px-3 py-2.5" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
  ```
  Más változtatás ebben a fájlban TILOS.

- [ ] **Step 6: Tesztek**

  ```bash
  npm test
  ```

---

### Task 12: Vízállás modul redesign

**Files:**
- Modify: `src/modules/water-level/WaterLevelModule.tsx`
- Modify: `src/modules/water-level/MultiStationChart.tsx`
- Modify: `src/modules/water-level/DataTable.tsx`
- Modify: `src/modules/water-level/ForecastDataTable.tsx`
- Modify: `src/modules/water-level/WaterBodiesTable.tsx`

- [ ] **Step 1: `WaterLevelModule.tsx`**

  - Wrapper háttér: `var(--bg-app)`
  - Állomás kártyák: `dun-card` + IBM Plex Mono értékek
  - Alert kártya (≥400cm): `dun-card-dark` osztály + `dun-badge-alert`
  - Trend nyilak: `dun-trend-up` (emelkedő = piros) / `dun-trend-down` (csökkenő = zöld)
  - `dun-meta` osztály a timestamp-eknél

- [ ] **Step 2: `MultiStationChart.tsx`**

  - Recharts `stroke` színek → `var(--color-dun-wave-400)`, `var(--color-dun-current-600)`, `var(--color-dun-ripple-200)` (állomásonként)
  - Tooltip, grid, axis: ugyanaz mint ForecastChart (Task 11 Step 2)

- [ ] **Step 3: `DataTable.tsx` és `ForecastDataTable.tsx`**

  - Táblázat fejléc: `background: 'var(--bg-surface-alt)'`, `color: 'var(--text-secondary)'`
  - Sorok: páratlan `var(--bg-surface)`, páros `var(--bg-surface-alt)` (vagy `var(--bg-surface)` mindkettő)
  - Elválasztók: `borderColor: 'var(--border-subtle)'`
  - Adatértékek: `fontFamily: 'var(--font-data)'`, `color: 'var(--text-data)'`

- [ ] **Step 4: `WaterBodiesTable.tsx`** — ugyanaz mint Step 3.

- [ ] **Step 5: Tesztek + dev szerver**

  ```bash
  npm test && npm run dev
  ```

---

### Task 13: Aszály modul redesign

**Files:**
- Modify: `src/modules/drought/DroughtModule.tsx`
- Modify: `src/modules/drought/DroughtIndexCard.tsx`
- Modify: `src/modules/drought/SoilMoistureCard.tsx`
- Modify: `src/modules/drought/WaterDeficitCard.tsx`
- Modify: `src/modules/drought/GroundwaterLevelCard.tsx`
- Modify: `src/modules/drought/GroundwaterChart.tsx`
- Modify: `src/modules/drought/GroundwaterTimestampTable.tsx`
- **KÜLÖNLEGES FIGYELEM:** `DroughtMapsWidget.tsx`, `DroughtMonitoringMap.tsx`, `WaterDeficitMap.tsx`, `GroundwaterMap.tsx` — CSAK legenda container!

- [ ] **Step 1: `DroughtIndexCard.tsx` — HDI hero kártya**

  - `dun-card-dark dun-ripple-deco` (sötét hero kártya)
  - HDI érték: `dun-value` vagy `dun-value-xl` + `color: 'var(--card-dark-text)'`
  - Badge: amber/alert állapot szerinti `dun-badge-*`
  - Label: `dun-card-dark-label` stílusban (rgba(255,255,255,.38), caps)

- [ ] **Step 2: `SoilMoistureCard.tsx`**

  - `dun-card` alap
  - 6 mélységi sáv: progress bar stílusban, amber (`var(--color-dun-amber-400)`) → alert-red (`var(--color-dun-alert-500)`) skálán
  - Értékek: IBM Plex Mono

- [ ] **Step 3: `WaterDeficitCard.tsx` és `GroundwaterLevelCard.tsx`**

  - `dun-card` + `icon-groundwater` vagy `icon-drought`
  - Értékek: `dun-value` + IBM Plex Mono
  - Negatív vízdeficit: `dun-trend-down` (zöld), pozitív: `dun-trend-up` (piros)

- [ ] **Step 4: `GroundwaterChart.tsx`**

  - Recharts stroke: `var(--color-dun-ok-500)` (talajvíz = zöld)
  - Reference line (átlag): `var(--color-dun-amber-400)` dashed
  - Tooltip, grid, axis: standard token-ek

- [ ] **Step 5: `GroundwaterTimestampTable.tsx`**

  - Ugyanaz mint DataTable (Task 12 Step 3)

- [ ] **Step 6: Térkép legenda containerek — KRITIKUS SZABÁLY**

  A `DroughtMapsWidget.tsx`, `DroughtMonitoringMap.tsx`, `WaterDeficitMap.tsx`, `GroundwaterMap.tsx` fájlokban:
  - Keress rá `flex items-center` kombinációra a legenda container-eken
  - Ha megtalálod: cseréld `className="px-3 py-2.5"` (block layout) -ra
  - Más változtatás TILOS ezekben a fájlokban (Leaflet konfiguráció érintetlen marad)
  - `preferCanvas` és `maxBounds` prop TILOS marad

- [ ] **Step 7: `DroughtModule.tsx`**

  - Wrapper: `var(--bg-app)` háttér
  - Szekciók elrendezése és spacingja marad, csak a color osztályok változnak
  - A két selector (DroughtLocationSelector + WellSelector) egymástól FÜGGETLEN, ne vond össze

- [ ] **Step 8: Tesztek + dev szerver**

  ```bash
  npm test && npm run dev
  ```
  Ellenőrizd az aszály térképeket: a legendák helyesen jelennek-e meg mobilon.

---

## RÉTEG ZÁRÁS — Végső ellenőrzés

### Task 14: Teljes vizuális review és siker kritériumok ellenőrzése

- [ ] **Step 1: Futtasd az összes tesztet**

  ```bash
  npm test
  ```
  Elvárt: minden teszt zöld, nulla regresszió.

- [ ] **Step 2: Dev szerver — minden modul átnézése**

  ```bash
  npm run dev
  ```

  Ellenőrzési lista:
  - [ ] HomePage: DM Serif Display "DunApp" felirat, egyedi modul ikonok
  - [ ] Header: sötét háttér, türkiz felirat, dark mode toggle működik
  - [ ] Dark mode: light ↔ dark váltás működik, minden szín vált
  - [ ] Bottom nav: mind a 3 modul ikonja megjelenik, aktív állapot látható
  - [ ] Meteorológia: IBM Plex Mono értékek, türkiz akcentszín
  - [ ] Vízállás: IBM Plex Mono értékek, kék akcentszín, trend nyilak
  - [ ] Aszály: sötét HDI hero kártya, amber akcentszín, térképek legendái helyesek
  - [ ] Mobilnézet (DevTools → iPhone): bottom nav nem takarja el a tartalmat

- [ ] **Step 3: TypeScript build ellenőrzés**

  ```bash
  npx tsc --noEmit
  ```
  Elvárt: nulla type error.

- [ ] **Step 4: Build teszt**

  ```bash
  npm run build
  ```
  Elvárt: sikeres build, nulla error.
