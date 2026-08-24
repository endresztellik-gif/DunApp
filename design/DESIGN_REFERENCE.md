# DunApp Design System — Gyors referencia

## Fájlstruktúra

```
src/
├── styles/
│   └── tokens.css          ← design tokenek (ide importáld)
└── assets/
    └── icons/
        └── dunapp-icons.svg ← SVG sprite (public/ mappába is kell!)
```

## Beillesztés

### 1. CSS tokenek — `main.tsx` vagy `index.css`
```css
@import './styles/tokens.css';
```

### 2. SVG sprite — `index.html` body elejére (Vite/React)
```html
<!-- Vite esetén public/icons/dunapp-icons.svg -->
<!-- A sprite inline is beilleszthető a #root előtt -->
```

### 3. Icon komponens — `src/components/Icon.tsx`
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

---

## Ikon azonosítók

| Modul             | Ikon ID                | Variáns            |
|-------------------|------------------------|--------------------|
| Meteorológia      | `icon-meteo`           | `icon-meteo-fill`  |
| Vízállás          | `icon-water`           | `icon-water-down`  |
| Aszályindikátor   | `icon-drought`         | `icon-drought-severe` |
| Talajvíz          | `icon-groundwater`     | —                  |
| Értesítés (push)  | `icon-alert-bell`      | —                  |
| Állomás / helyszín| `icon-station`         | —                  |
| Vonaldiagram      | `icon-chart`           | —                  |

---

## Szín tokenek — leggyakrabban használtak

```css
/* Háttér */
var(--bg-app)           /* oldal háttere */
var(--bg-surface)       /* kártyák */
var(--bg-surface-alt)   /* mélyebb felület */

/* Szöveg */
var(--text-primary)     /* fő szöveg */
var(--text-secondary)   /* másodlagos */
var(--text-tertiary)    /* feliratok, meta */
var(--text-data)        /* mért értékek (monospace-nál) */

/* Akcentszín */
var(--accent-primary)   /* gomb, aktív nav, link */
var(--accent-hover)     /* hover állapot */

/* Keretek */
var(--border-subtle)    /* nagyon halvány */
var(--border-default)   /* normál keret */
var(--border-strong)    /* hangsúlyos keret */

/* Állapotszínek */
var(--status-ok-bg)     / var(--status-ok-text)
var(--status-warn-bg)   / var(--status-warn-text)
var(--status-alert-bg)  / var(--status-alert-text)
```

---

## Tipográfia

```css
font-family: var(--font-display);  /* DM Serif Display — app neve, hero */
font-family: var(--font-ui);       /* Inter — UI szöveg */
font-family: var(--font-data);     /* IBM Plex Mono — mért adatok */

font-size: var(--text-data-xl);    /* 44px — hero érték */
font-size: var(--text-data-lg);    /* 32px — fő érték */
font-size: var(--text-data-sm);    /* 20px — kisebb adat */
font-size: var(--text-xl);         /* 22px — heading */
font-size: var(--text-lg);         /* 18px — alcím */
font-size: var(--text-base);       /* 15px — törzs */
font-size: var(--text-sm);         /* 13px — meta */
font-size: var(--text-xs);         /* 11px — label, badge */
```

---

## Kész komponens osztályok

```html
<!-- Adatérték -->
<span class="dun-value">428</span>
<span class="dun-value-unit">cm</span>

<!-- Kártya -->
<div class="dun-card">
  <div class="dun-card-header">...</div>
  <div class="dun-card-body">...</div>
</div>

<!-- Sötét kártya -->
<div class="dun-card-dark dun-ripple-deco">...</div>

<!-- Badge / állapot -->
<span class="dun-badge dun-badge-ok">Normál</span>
<span class="dun-badge dun-badge-warn">Emelkedő</span>
<span class="dun-badge dun-badge-alert">Árvízveszély</span>

<!-- Modul felirat -->
<div class="dun-module-label">Vízállás</div>

<!-- Időbélyeg / meta -->
<div class="dun-meta">2026-03-21 · 14:30 · Mohács</div>

<!-- Bottom nav -->
<nav class="dun-nav">
  <a class="dun-nav-item active" href="/weather">
    <Icon id="icon-meteo" size={22} />
    <span class="dun-nav-label">Időjárás</span>
  </a>
</nav>

<!-- Trend jelzők -->
<span class="dun-trend-up">↑ 12 cm</span>
<span class="dun-trend-down">↓ 5 cm</span>
<span class="dun-trend-flat">→ stabil</span>
```

---

## Manuális témakapcsoló (opcionális)

```tsx
// Ha szeretnél kézi kapcsolót a rendszer-auto mellé:
const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute(
    'data-theme',
    current === 'dark' ? 'light' : 'dark'
  );
};
```

---

## Spacing / radius referencia

```
--space-1: 4px   --space-2: 8px   --space-3: 12px
--space-4: 16px  --space-5: 20px  --space-6: 24px
--space-8: 32px  --space-10: 40px

--radius-sm: 6px   --radius-md: 10px
--radius-lg: 14px  --radius-xl: 20px
--radius-full: 9999px
```
