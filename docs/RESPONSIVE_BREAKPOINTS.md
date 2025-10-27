# Responsive Design Breakpoints - DunApp PWA

**Version:** 1.0
**Last Updated:** 2025-10-24
**Approach:** Mobile-First

---

## Table of Contents

1. [Overview](#overview)
2. [Breakpoint Definitions](#breakpoint-definitions)
3. [Mobile-First Philosophy](#mobile-first-philosophy)
4. [Component Behavior Per Breakpoint](#component-behavior-per-breakpoint)
5. [Grid Layout Examples](#grid-layout-examples)
6. [Typography Scaling](#typography-scaling)
7. [Testing Responsive Design](#testing-responsive-design)

---

## Overview

DunApp PWA uses a **mobile-first** responsive design approach, meaning styles are written for mobile devices first, then progressively enhanced for larger screens using Tailwind's responsive modifiers.

### Why Mobile-First?

1. **Better Performance** - Mobile devices load only necessary styles
2. **Progressive Enhancement** - Features added as screen size increases
3. **Accessibility** - Ensures core functionality works on all devices
4. **Modern Best Practice** - Aligns with current web standards

---

## Breakpoint Definitions

DunApp uses Tailwind CSS's default breakpoints, explicitly configured in `tailwind.config.js`:

```javascript
screens: {
  sm: '640px',   // Mobile landscape / Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Desktops
  xl: '1280px',  // Large desktops
  '2xl': '1536px', // Extra large desktops
}
```

### Breakpoint Ranges

| Breakpoint | Min Width | Max Width | Devices | Layout |
|------------|-----------|-----------|---------|--------|
| **Default (mobile)** | 0px | 639px | Phones (portrait) | Single column |
| **sm** | 640px | 767px | Phones (landscape), Small tablets | 1-2 columns |
| **md** | 768px | 1023px | Tablets (portrait), Large phones (landscape) | 2 columns |
| **lg** | 1024px | 1279px | Tablets (landscape), Small desktops | 2-3 columns |
| **xl** | 1280px | 1535px | Desktops, Large displays | 3-4 columns |
| **2xl** | 1536px | ∞ | Extra large displays | 4+ columns |

### Typical Device Widths

```
iPhone SE:           375px  (default)
iPhone 12/13:        390px  (default)
iPhone 14 Pro Max:   430px  (default)
iPad (portrait):     768px  (md)
iPad (landscape):   1024px  (lg)
Desktop 1080p:      1920px  (2xl)
Desktop 1440p:      2560px  (2xl)
```

---

## Mobile-First Philosophy

### Writing Mobile-First CSS

```tsx
// ❌ DESKTOP-FIRST (Wrong approach)
<div className="grid-cols-4 md:grid-cols-2 sm:grid-cols-1">
  {/* This is backwards! */}
</div>

// ✅ MOBILE-FIRST (Correct approach)
<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  {/* Starts with mobile (1 column), adds complexity for larger screens */}
</div>
```

### Responsive Modifier Syntax

```tsx
// Base style applies to all screen sizes
// Add responsive modifiers to override at larger breakpoints

<div className="
  text-sm           // Mobile: 14px (base)
  sm:text-base      // 640px+: 16px
  lg:text-lg        // 1024px+: 18px
">
  Responsive text
</div>

<div className="
  w-full            // Mobile: 100% width
  md:w-auto         // 768px+: auto width
  lg:w-64           // 1024px+: 256px (16rem)
">
  Responsive width
</div>
```

---

## Component Behavior Per Breakpoint

### Header (Module Navigation)

```tsx
<header className="app-header">
  <div className="app-header-content">
    {/* Logo */}
    <h1 className="
      text-xl          // Mobile: 24px
      md:text-2xl      // Tablet+: 32px
    ">
      DunApp
    </h1>

    {/* Module tabs */}
    <nav className="
      flex
      flex-col         // Mobile: Stack vertically
      sm:flex-row      // 640px+: Horizontal layout
      gap-2            // 8px gap
      sm:gap-3         // 640px+: 12px gap
    ">
      <button className="module-tab-meteorology-active">
        <span className="hidden sm:inline">Meteorológia</span>
        <span className="sm:hidden">🌤️</span>
      </button>
      {/* ... other tabs */}
    </nav>
  </div>
</header>
```

**Behavior:**
- **Mobile:** Logo + Icon-only tabs stacked vertically
- **Tablet (640px+):** Logo + Full-text tabs horizontally
- **Desktop:** Same as tablet with more spacing

---

### Location/Station Selector

```tsx
<div className="
  selector-dropdown
  w-full             // Mobile: Full width
  md:w-auto          // 768px+: Auto width (content-based)
">
  <button className="
    selector-button-meteorology
    w-full             // Mobile: Full width button
    md:w-auto          // 768px+: Auto width
    px-4 py-2          // Base padding
    text-sm            // Mobile: 14px text
    md:text-base       // 768px+: 16px text
  ">
    <MapPin className="h-4 w-4 md:h-5 md:w-5" />
    <span>Szekszárd</span>
  </button>
</div>
```

**Behavior:**
- **Mobile:** Full-width selector, smaller icon/text
- **Tablet+:** Auto-width (floating right), normal icon/text

---

### Data Cards (Meteorology Module)

```tsx
<div className="
  grid
  grid-cols-1        // Mobile: 1 column
  sm:grid-cols-2     // 640px+: 2 columns
  lg:grid-cols-3     // 1024px+: 3 columns
  gap-4              // 16px gap
">
  <div className="data-card">
    <div className="data-card-header">
      <Thermometer className="
        h-5 w-5        // Mobile: 20px icon
        md:h-6 md:w-6  // 768px+: 24px icon
        text-meteorology
      " />
      <span className="data-card-label">Hőmérséklet</span>
    </div>
    <p className="
      text-2xl         // Mobile: 32px
      md:text-3xl      // 768px+: 48px
      font-bold
    ">
      15.3
    </p>
    <p className="data-card-unit">°C</p>
  </div>
  {/* ... 5 more cards */}
</div>
```

**Layout:**
- **Mobile (< 640px):** 1 column (6 cards stacked)
- **Tablet (640-1023px):** 2 columns (3 rows)
- **Desktop (1024px+):** 3 columns (2 rows)

---

### Charts

```tsx
<div className="
  chart-container
  h-[250px]          // Mobile: 250px height
  md:h-[350px]       // 768px+: 350px height
  lg:h-[400px]       // 1024px+: 400px height
  p-3                // Mobile: 12px padding
  md:p-4             // 768px+: 16px padding
">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      {/* Recharts automatically responsive */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

**Behavior:**
- **Mobile:** Smaller height (250px), touch-friendly
- **Tablet:** Medium height (350px)
- **Desktop:** Full height (400px), more data visible

---

### Maps (Drought Module)

```tsx
<div className="
  grid
  grid-cols-1        // Mobile: Stack maps
  lg:grid-cols-3     // 1024px+: 3 maps side-by-side
  gap-4
">
  <div className="
    map-container
    h-[300px]        // Mobile: 300px height
    md:h-[400px]     // 768px+: 400px height
  ">
    <MapContainer>
      {/* Leaflet map */}
    </MapContainer>
  </div>
  {/* ... 2 more maps */}
</div>
```

**Layout:**
- **Mobile/Tablet (< 1024px):** Maps stacked vertically, 300-400px each
- **Desktop (1024px+):** 3 maps side-by-side, 400px tall

---

### Well List (Drought Module)

```tsx
<div className="
  grid
  grid-cols-1        // Mobile: 1 column
  sm:grid-cols-2     // 640px+: 2 columns
  lg:grid-cols-3     // 1024px+: 3 columns
  gap-3
">
  {wells.map(well => (
    <div key={well.id} className="well-card">
      <h4 className="
        text-sm        // Mobile: 14px
        md:text-base   // 768px+: 16px
        font-semibold
      ">
        {well.name}
      </h4>
      <p className="text-xs text-gray-600">
        #{well.code}
      </p>
    </div>
  ))}
</div>
```

**Layout:**
- **Mobile (< 640px):** 1 column (15 wells stacked)
- **Tablet (640-1023px):** 2 columns
- **Desktop (1024px+):** 3 columns

---

## Grid Layout Examples

### Predefined Grid Classes

These classes are available in `src/styles/components.css`:

```css
/* Meteorology cards (2x3 grid) */
.grid-meteorology-cards {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}

/* Water level cards (1x3 grid) */
.grid-water-cards {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}

/* Drought data cards (2x2 grid) */
.grid-drought-cards {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4;
}

/* Drought maps (3 side-by-side) */
.grid-drought-maps {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-4;
}

/* Well monitoring list (3 columns) */
.grid-well-list {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3;
}
```

### Usage

```tsx
// ✅ GOOD: Use predefined grid class
<div className="grid-meteorology-cards">
  {/* 6 weather data cards */}
</div>

// ✅ GOOD: Custom grid with explicit breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
  {/* Custom layout */}
</div>
```

---

## Typography Scaling

### Heading Sizes

```tsx
// h1 - Main page title
<h1 className="
  text-3xl         // Mobile: 48px
  md:text-4xl      // 768px+: larger
  lg:text-5xl      // 1024px+: even larger
  font-bold
">
  DunApp
</h1>

// h2 - Section title
<h2 className="
  text-2xl         // Mobile: 32px
  md:text-3xl      // 768px+: 48px
  font-bold
">
  Meteorológia
</h2>

// h3 - Card/component title
<h3 className="
  text-xl          // Mobile: 24px
  md:text-2xl      // 768px+: 32px
  font-semibold
">
  Vízállás előrejelzés
</h3>
```

### Body Text

```tsx
// Normal body text
<p className="
  text-sm          // Mobile: 14px
  md:text-base     // 768px+: 16px
">
  Utolsó frissítés: 2025-10-24
</p>

// Small text (metadata, captions)
<span className="
  text-xs          // Mobile: 12px
  md:text-sm       // 768px+: 14px
  text-gray-600
">
  Forrás: OMSZ
</span>
```

---

## Testing Responsive Design

### Browser DevTools

#### Chrome DevTools
1. Open DevTools (F12 or Cmd+Option+I)
2. Click device toolbar icon (Cmd+Shift+M)
3. Select preset devices or custom dimensions
4. Test at key breakpoints: 375px, 640px, 768px, 1024px, 1280px

#### Firefox Responsive Design Mode
1. Open DevTools (F12)
2. Click responsive design mode icon (Cmd+Option+M)
3. Test rotation (portrait/landscape)

### Manual Testing Checklist

#### Mobile (< 640px)
- [ ] All content readable without horizontal scroll
- [ ] Touch targets minimum 44x44px
- [ ] Navigation accessible (hamburger menu or visible tabs)
- [ ] Forms full-width and easy to tap
- [ ] Images scale properly
- [ ] Data cards stack vertically
- [ ] Maps functional with touch gestures

#### Tablet (640px - 1023px)
- [ ] Layout uses 2-column grid where appropriate
- [ ] Typography scales up slightly
- [ ] Navigation horizontal (if space permits)
- [ ] Touch targets still comfortable
- [ ] Charts readable at medium size

#### Desktop (1024px+)
- [ ] Full 3-column grid layout visible
- [ ] All content fits within max-width container (1280px)
- [ ] Typography at optimal size
- [ ] Hover states functional
- [ ] Mouse interactions smooth
- [ ] No excessive whitespace

### Common Responsive Issues

❌ **Problems to Avoid:**

```tsx
// ❌ Fixed widths (breaks on small screens)
<div className="w-[800px]">

// ❌ Desktop-first approach
<div className="text-xl md:text-base sm:text-sm">

// ❌ No responsive modifiers
<div className="grid-cols-4">

// ❌ Tiny touch targets on mobile
<button className="p-1">
```

✅ **Correct Approach:**

```tsx
// ✅ Flexible widths
<div className="w-full max-w-container mx-auto">

// ✅ Mobile-first
<div className="text-sm md:text-base lg:text-xl">

// ✅ Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// ✅ Comfortable touch targets
<button className="p-4 min-h-[44px] min-w-[44px]">
```

---

## Best Practices

### 1. Container Width

```tsx
// ✅ Always constrain max width
<div className="
  w-full
  max-w-7xl        // 1280px max (matches design spec)
  mx-auto          // Center horizontally
  px-6             // Horizontal padding
  py-6             // Vertical padding
">
  {/* Content */}
</div>
```

### 2. Spacing Consistency

```tsx
// ✅ Use consistent spacing scale
gap-2    // 8px
gap-3    // 12px
gap-4    // 16px
gap-6    // 24px
gap-8    // 32px

// ✅ Responsive spacing
<div className="
  gap-4            // Mobile: 16px
  md:gap-6         // 768px+: 24px
  lg:gap-8         // 1024px+: 32px
">
```

### 3. Hide/Show Content

```tsx
// Show only on mobile
<span className="md:hidden">📱 Mobile view</span>

// Hide on mobile, show on desktop
<span className="hidden md:inline">💻 Desktop view</span>

// Show on tablet and up
<div className="hidden sm:block">Tablet+ content</div>
```

### 4. Flexbox vs Grid

```tsx
// ✅ Use Flexbox for alignment/spacing
<div className="flex items-center justify-between gap-4">

// ✅ Use Grid for structured layouts
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## Quick Reference

### Breakpoint Order (Mobile-First)

```
1. Base styles (mobile)          → No prefix
2. Small devices (640px+)        → sm:
3. Medium devices (768px+)       → md:
4. Large devices (1024px+)       → lg:
5. Extra large (1280px+)         → xl:
6. 2X Extra large (1536px+)      → 2xl:
```

### Common Responsive Patterns

| Pattern | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| **Main grid** | 1 col | 2 cols | 3 cols |
| **Card padding** | p-4 | p-5 | p-6 |
| **Font size** | text-sm | text-base | text-lg |
| **Icon size** | h-4 w-4 | h-5 w-5 | h-6 w-6 |
| **Gap** | gap-3 | gap-4 | gap-6 |
| **Container padding** | px-4 | px-6 | px-8 |

---

**For Questions:**
Contact UI/UX Designer Agent or refer to:
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

---

*Document Version 1.0 - Last Updated 2025-10-24*
