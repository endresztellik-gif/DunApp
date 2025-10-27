# Design System Usage Guide - DunApp PWA

**Version:** 1.0
**Last Updated:** 2025-10-27
**Purpose:** Practical examples and usage patterns for the DunApp design system

---

## Table of Contents

1. [Component Class Examples](#component-class-examples)
2. [Color Usage Patterns](#color-usage-patterns)
3. [Layout Patterns](#layout-patterns)
4. [Common Use Cases](#common-use-cases)
5. [Design Token Reference](#design-token-reference)

---

## Component Class Examples

### Data Card - Standard

```tsx
import { Thermometer } from 'lucide-react';

function TemperatureCard() {
  return (
    <div className="data-card">
      <div className="data-card-header">
        <Thermometer className="data-card-icon text-meteorology" aria-hidden="true" />
        <span className="data-card-label">Hőmérséklet</span>
      </div>
      <p className="data-card-value">15.3</p>
      <p className="data-card-unit">°C</p>
    </div>
  );
}
```

**Visual Output:**
```
┌─────────────────────────────┐
│ 🌡️ Hőmérséklet              │
│                             │
│       15.3                  │
│       °C                    │
└─────────────────────────────┘
```

### Data Card - With Dropdown (Drought Module)

```tsx
import { Droplet } from 'lucide-react';

function SoilMoistureCard() {
  const [location, setLocation] = useState('Katymár');
  const locations = ['Katymár', 'Baja', 'Szeged', 'Mórahalom', 'Kiskunmajsa'];

  return (
    <div className="data-card-dropdown">
      <div className="data-card-header">
        <Droplet className="data-card-icon text-drought" aria-hidden="true" />
        <span className="data-card-label">Talajnedvesség</span>
      </div>

      <select
        className="data-card-dropdown-selector"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        aria-label="Helyszín kiválasztása"
      >
        {locations.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>

      <p className="data-card-value mt-3">32.5</p>
      <p className="data-card-unit">%</p>
    </div>
  );
}
```

### Module Tab Buttons

```tsx
import { Cloud, Droplets, Wind } from 'lucide-react';

function ModuleNavigation() {
  const [active, setActive] = useState<'meteo' | 'water' | 'drought'>('meteo');

  return (
    <nav className="app-nav" aria-label="Fő navigáció">
      <button
        onClick={() => setActive('meteo')}
        className={active === 'meteo'
          ? 'module-tab-meteorology-active'
          : 'module-tab-meteorology'
        }
        aria-current={active === 'meteo' ? 'page' : undefined}
      >
        <Cloud className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Meteorológia</span>
      </button>

      <button
        onClick={() => setActive('water')}
        className={active === 'water'
          ? 'module-tab-water-active'
          : 'module-tab-water'
        }
        aria-current={active === 'water' ? 'page' : undefined}
      >
        <Droplets className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Vízállás</span>
      </button>

      <button
        onClick={() => setActive('drought')}
        className={active === 'drought'
          ? 'module-tab-drought-active'
          : 'module-tab-drought'
        }
        aria-current={active === 'drought' ? 'page' : undefined}
      >
        <Wind className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Aszály</span>
      </button>
    </nav>
  );
}
```

### Location Selector Dropdown

```tsx
import { MapPin, ChevronDown } from 'lucide-react';

function CitySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('Szekszárd');
  const cities = ['Szekszárd', 'Baja', 'Kalocsa', 'Mohács'];

  return (
    <div className="selector-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="selector-button-meteorology"
        aria-label="Település kiválasztása"
        aria-expanded={isOpen}
        aria-controls="city-menu"
      >
        <MapPin className="h-5 w-5" aria-hidden="true" />
        <span>{selected}</span>
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <ul
          id="city-menu"
          role="listbox"
          className="selector-dropdown-menu"
          aria-label="Települések listája"
        >
          {cities.map((city) => (
            <li
              key={city}
              role="option"
              aria-selected={city === selected}
              className={
                city === selected
                  ? 'selector-dropdown-item-selected'
                  : 'selector-dropdown-item'
              }
              onClick={() => {
                setSelected(city);
                setIsOpen(false);
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Chart Container

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

function WaterLevelChart() {
  const data = [
    { date: 'okt. 24.', szekszard: 394, passau: 378, nagybajcs: 581 },
    { date: 'okt. 25.', szekszard: 389, passau: 389, nagybajcs: 608 },
    { date: 'okt. 26.', szekszard: 369, passau: 389, nagybajcs: 586 },
  ];

  return (
    <div className="chart-container-comparison">
      <div className="chart-header">
        <TrendingUp className="h-6 w-6 text-water" aria-hidden="true" />
        <h3 className="chart-title">Vízállás Előrejelzés</h3>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: 'cm', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="szekszard"
            stroke="var(--chart-cyan)"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={{ fill: 'var(--chart-cyan)', r: 4 }}
            name="Szekszárd"
          />
          <Line
            type="monotone"
            dataKey="passau"
            stroke="var(--chart-teal)"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={{ fill: 'var(--chart-teal)', r: 4 }}
            name="Passau"
          />
          <Line
            type="monotone"
            dataKey="nagybajcs"
            stroke="var(--chart-green)"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={{ fill: 'var(--chart-green)', r: 4 }}
            name="Nagybajcs"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Map Container (Leaflet)

```tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

function DroughtMap() {
  const center = [46.35, 18.95] as [number, number]; // Baja

  return (
    <div className="map-container-standard">
      <div className="map-header">
        <h3 className="map-title">Aktuális Talajvízszint</h3>
      </div>

      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        aria-label="Talajvíz monitoring térkép"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={center}>
          <Popup>
            <strong>Baja</strong><br />
            Vízszint: 4.2 m
          </Popup>
        </Marker>
      </MapContainer>

      {/* Map Legend */}
      <div className="map-legend">
        <div className="map-legend-item">
          <div className="map-legend-color bg-green-500" />
          <span>Magas szint</span>
        </div>
        <div className="map-legend-item">
          <div className="map-legend-color bg-yellow-500" />
          <span>Közepes</span>
        </div>
        <div className="map-legend-item">
          <div className="map-legend-color bg-red-500" />
          <span>Alacsony</span>
        </div>
      </div>
    </div>
  );
}
```

---

## Color Usage Patterns

### Module-Specific Colors

```tsx
// Meteorology Module (Cyan)
<div className="border-2 border-meteorology">
  <MapPin className="h-5 w-5 text-meteorology" />
  <button className="bg-meteorology text-white hover:bg-meteorology-dark">
    Részletek
  </button>
</div>

// Water Level Module (Light Cyan)
<div className="border-2 border-water">
  <Droplets className="h-5 w-5 text-water" />
  <button className="bg-water text-white hover:bg-water-dark">
    Részletek
  </button>
</div>

// Drought Module (Orange)
<div className="border-2 border-drought">
  <Wind className="h-5 w-5 text-drought" />
  <button className="bg-drought text-white hover:bg-drought-dark">
    Részletek
  </button>
</div>
```

### Text Colors (WCAG AA Compliant)

```tsx
// Primary text - Highest contrast (12.6:1)
<p className="text-[#2C3E50]">
  Primary content text
</p>

// Secondary text - Good contrast (5.1:1)
<p className="text-[#607D8B]">
  Secondary or metadata text
</p>

// Light text - Large text only (3.0:1)
<p className="text-lg text-[#90A4AE]">
  Large helper text
</p>

// Module text colors (use dark variants for body text)
<p className="text-[#006064]">Meteorology content (7.5:1)</p>
<p className="text-[#00838F]">Water level content (4.8:1)</p>
<p className="text-[#E65100]">Drought content (4.6:1)</p>
```

### Chart Colors

```tsx
// Use CSS custom properties for consistency with design tokens
<Line stroke="var(--chart-cyan)" />
<Line stroke="var(--chart-teal)" />
<Line stroke="var(--chart-green)" />
<Line stroke="var(--chart-blue)" />
<Line stroke="var(--chart-orange)" />
<Line stroke="var(--chart-red)" />
```

---

## Layout Patterns

### Full Page Layout

```tsx
function ModulePage() {
  return (
    <div className="bg-bg-main min-h-screen">
      <header className="app-header">
        <div className="app-header-content">
          <h1 className="app-logo">DunApp</h1>
          <nav className="app-nav">
            {/* Module tabs */}
          </nav>
        </div>
      </header>

      <main className="main-container">
        {/* Module content */}
      </main>
    </div>
  );
}
```

### Meteorology Module Layout

```tsx
function MeteorologyModule() {
  return (
    <div className="space-y-6">
      {/* City Selector */}
      <div className="flex justify-end">
        <CitySelector />
      </div>

      {/* Data Cards Grid */}
      <section aria-labelledby="current-weather">
        <h2 id="current-weather" className="section-title">
          Aktuális Időjárás
        </h2>
        <div className="grid-meteorology-cards">
          <TemperatureCard />
          <PrecipitationCard />
          <WindSpeedCard />
          <PressureCard />
          <HumidityCard />
          <WindDirectionCard />
        </div>
      </section>

      {/* Forecast Chart */}
      <section aria-labelledby="forecast">
        <h2 id="forecast" className="section-title">
          Időjárás Előrejelzés
        </h2>
        <ForecastChart />
      </section>

      {/* Data Source Footer */}
      <div className="data-source-footer">
        <p>
          <span className="data-source-timestamp">
            Utolsó frissítés: 2025. 10. 24. 14:31:21
          </span>
        </p>
        <p>Forrás: OMSZ (omsz.met.hu)</p>
      </div>
    </div>
  );
}
```

### Drought Module Layout (3 Maps)

```tsx
function DroughtModule() {
  return (
    <div className="space-y-6">
      {/* Location Selector */}
      <div className="flex justify-end">
        <LocationSelector />
      </div>

      {/* Data Cards with Dropdowns */}
      <section aria-labelledby="drought-indicators">
        <h2 id="drought-indicators" className="section-title">
          Aszály Indikátorok
        </h2>
        <div className="grid-drought-cards">
          <DroughtIndexCard />
          <SoilMoistureCard />
          <WaterDeficitCard />
          <GroundwaterCard />
        </div>
      </section>

      {/* Maps Grid */}
      <section aria-labelledby="drought-maps">
        <h2 id="drought-maps" className="section-title">
          Aszály és Talajvíz Térképek
        </h2>
        <div className="grid-drought-maps">
          <GroundwaterMap />
          <DroughtMonitoringMap />
          <WaterDeficitMap />
        </div>
      </section>

      {/* Well List */}
      <section aria-labelledby="well-monitoring">
        <h2 id="well-monitoring" className="section-title">
          Talajvízkút Monitoring
        </h2>
        <p className="section-subtitle">
          15 kút adatai 60 napos előzményekkel
        </p>
        <div className="grid-well-list mt-4">
          {wells.map((well) => (
            <WellCard key={well.id} well={well} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

## Common Use Cases

### Loading State

```tsx
function LoadingCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-text w-1/3 mb-4" />
      <div className="skeleton-text w-2/3 h-8 mb-2" />
      <div className="skeleton-text w-1/4" />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="spinner border-meteorology" role="status">
        <span className="sr-only">Betöltés...</span>
      </div>
    </div>
  );
}
```

### Error State

```tsx
import { AlertTriangle } from 'lucide-react';

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-card">
      <AlertTriangle className="h-6 w-6 text-red-600 mb-2" aria-hidden="true" />
      <p className="error-message">{message}</p>
      <button onClick={onRetry} className="error-retry-button">
        Újra próbál
      </button>
    </div>
  );
}
```

### Empty State

```tsx
import { Inbox } from 'lucide-react';

function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <Inbox className="empty-state-icon" aria-hidden="true" />
      <p className="empty-state-text">{message}</p>
    </div>
  );
}
```

### Well Card (Clickable)

```tsx
function WellCard({ well, onClick }: { well: Well; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="well-card text-left"
      aria-label={`${well.name} kút részletes adatai`}
    >
      <h4 className="well-card-name">{well.name}</h4>
      <p className="well-card-code">#{well.code}</p>
      <div className="mt-2 text-xs text-gray-500">
        Vízszint: {well.level} m
      </div>
    </button>
  );
}
```

---

## Design Token Reference

### Using CSS Custom Properties

```tsx
// In components
<div style={{ backgroundColor: 'var(--bg-main)' }}>

// In styled components or inline styles
const cardStyle = {
  padding: 'var(--card-padding)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
  transition: 'var(--transition-base)',
};

// For charts (Recharts)
<Line
  stroke="var(--chart-cyan)"
  strokeWidth={2}
  dot={{ fill: 'var(--chart-cyan)' }}
/>
```

### Available Design Tokens

```css
/* Colors */
var(--primary-cyan)
var(--primary-light-cyan)
var(--primary-orange)
var(--bg-main)
var(--bg-card)
var(--bg-hover)
var(--text-primary)
var(--text-secondary)
var(--text-light)

/* Module Colors */
var(--meteo-primary)
var(--meteo-light)
var(--meteo-dark)
var(--water-primary)
var(--water-light)
var(--water-dark)
var(--drought-primary)
var(--drought-light)
var(--drought-dark)

/* Chart Colors */
var(--chart-cyan)
var(--chart-teal)
var(--chart-green)
var(--chart-blue)
var(--chart-orange)
var(--chart-red)

/* Layout */
var(--container-max)
var(--container-padding)
var(--card-padding)
var(--card-gap)

/* Border Radius */
var(--radius-sm)
var(--radius-md)
var(--radius-lg)
var(--radius-xl)

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)

/* Transitions */
var(--transition-fast)
var(--transition-base)
var(--transition-slow)
```

---

## Best Practices

### ✅ DO

- Use predefined component classes for consistency
- Apply responsive modifiers for mobile-first design
- Use ARIA labels on all interactive elements
- Use design tokens (CSS custom properties) for colors
- Test keyboard navigation (Tab, Enter, Escape)
- Verify color contrast with WCAG AA standards
- Use semantic HTML elements
- Provide loading and error states

### ❌ DON'T

- Don't use inline styles for colors (use Tailwind classes or design tokens)
- Don't create custom components without following the design system
- Don't use `<div>` with `onClick` (use `<button>`)
- Don't remove focus outlines without replacement
- Don't use module primary colors for body text (use dark variants)
- Don't hardcode sizes (use Tailwind spacing scale)
- Don't skip accessibility attributes
- Don't forget responsive modifiers (sm:, md:, lg:)

---

## Quick Copy-Paste Templates

### Basic Data Card

```tsx
<div className="data-card">
  <div className="data-card-header">
    <IconComponent className="data-card-icon text-MODULE_COLOR" aria-hidden="true" />
    <span className="data-card-label">Label Text</span>
  </div>
  <p className="data-card-value">{value}</p>
  <p className="data-card-unit">{unit}</p>
</div>
```

### Basic Chart

```tsx
<div className="chart-container-standard">
  <div className="chart-header">
    <IconComponent className="h-6 w-6 text-MODULE_COLOR" aria-hidden="true" />
    <h3 className="chart-title">Chart Title</h3>
  </div>
  <ResponsiveContainer width="100%" height="90%">
    {/* Chart component */}
  </ResponsiveContainer>
</div>
```

### Basic Map

```tsx
<div className="map-container-standard">
  <div className="map-header">
    <h3 className="map-title">Map Title</h3>
  </div>
  <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {/* Markers */}
  </MapContainer>
</div>
```

---

**For More Information:**
- [DESIGN_SPECIFICATION.md](./DESIGN_SPECIFICATION.md) - Complete design specifications
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) - Accessibility guidelines
- [RESPONSIVE_BREAKPOINTS.md](./RESPONSIVE_BREAKPOINTS.md) - Responsive design patterns

---

*Document Version 1.0 - Created 2025-10-27*
