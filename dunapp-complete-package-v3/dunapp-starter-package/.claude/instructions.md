# DunApp PWA - Claude Code Development Instructions

## 🎯 Project Context

You are developing **DunApp PWA**, a Progressive Web Application for monitoring meteorological, water level, and drought data in southern Hungary.

**Critical**: This is a **module-specific architecture**. Each of the 3 modules has its own location selector and data management.

---

## 📚 Documentation Hierarchy

### **MUST READ FIRST** (Before Any Development)

1. **docs/PROJECT_SUMMARY.md** - Complete project architecture, database schema, module details
2. **docs/LOCATIONS_DATA.md** - All cities, stations, locations, and wells with coordinates
3. **docs/DESIGN_SPECIFICATION.md** - UI/UX design system, colors, layouts, components

### Reference Documentation

4. **docs/DATA_STRUCTURES.md** - API structures, state management examples
5. **docs/KEY_CHANGES_SUMMARY.md** - Visual summary of architecture decisions

---

## 🏗️ Architecture Principles

### 1. Module Independence

Each module operates independently:

```
📊 Meteorology Module
   └── Own city selector (4 cities)
   └── Own data fetching
   └── Own state management

💧 Water Level Module
   └── Own station selector (3 stations)
   └── Own data fetching
   └── Own state management

🏜️ Drought Module
   ├── Location selector (5 locations) ← for monitoring data
   └── Well selector (15 wells) ← for groundwater data ⚠️ SEPARATE!
```

**CRITICAL**: NEVER create a global location selector. Each module manages its own locations.

### 2. Drought Module Special Case

The Drought module has **TWO SEPARATE** selector systems:

1. **Drought Monitoring Locations** (5 locations)
   - Used for: Drought Index, Soil Moisture, Water Deficit cards
   - Dropdown in each data card

2. **Groundwater Wells** (15 wells)
   - Used for: Groundwater Level card
   - DIFFERENT dropdown, DIFFERENT data source
   - Includes well codes (e.g., #4576)

**Never mix these two!**

---

## 💻 Development Standards

### TypeScript

```typescript
// ✅ GOOD - Explicit types, interfaces
interface CityData {
  id: string;
  name: string;
  temperature: number;
}

const fetchCityData = async (cityId: string): Promise<CityData> => {
  // Implementation
};

// ❌ BAD - No 'any' types
const fetchData = async (id: any): Promise<any> => {
  // Never do this
};
```

### React Components

```typescript
// ✅ GOOD - Functional component with proper types
interface Props {
  cityName: string;
  temperature: number;
  onSelect: (cityId: string) => void;
}

export const WeatherCard: React.FC<Props> = ({ cityName, temperature, onSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      {/* Component content */}
    </div>
  );
};

// ❌ BAD - Class components
class WeatherCard extends React.Component {
  // Don't use class components
}
```

### Styling with Tailwind

```tsx
// ✅ GOOD - Utility classes from design system
<div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
  <h3 className="text-text-primary text-lg font-semibold">Hőmérséklet</h3>
  <p className="text-3xl font-bold text-meteo-primary">15.3°C</p>
</div>

// ❌ BAD - Inline styles
<div style={{ backgroundColor: 'white', padding: '20px' }}>
  {/* Don't use inline styles */}
</div>
```

### File Structure

```
✅ GOOD
src/modules/meteorology/components/CitySelector/CitySelector.tsx
src/modules/meteorology/components/CitySelector/index.ts

❌ BAD
src/components/CitySelector.tsx  // Wrong location
src/Meteorology/cityselector.tsx // Wrong naming
```

---

## 🎨 Design System Compliance

### Colors (From DESIGN_SPECIFICATION.md)

```typescript
// Always use these Tailwind classes:

// Module colors
'text-meteo-primary' // #00A8CC - Meteorology
'text-water-primary' // #00BCD4 - Water Level
'text-drought-primary' // #FF9800 - Drought

// Backgrounds
'bg-main' // #F0F4F8 - App background
'bg-card' // #FFFFFF - Card background

// Text
'text-primary' // #2C3E50 - Primary text
'text-secondary' // #607D8B - Secondary text
```

### Component Sizes

```typescript
// Data cards
className="min-h-[140px] p-5 rounded-lg"

// Map containers
className="h-[400px] w-full rounded-lg"

// Charts
className="h-[350px] w-full"
```

---

## 📊 Module-Specific Guidelines

### Meteorology Module

```typescript
// Cities: 4 total
const METEOROLOGY_CITIES = [
  'Szekszárd',
  'Baja',
  'Dunaszekcső',
  'Mohács'
];

// Data cards: 6 total
// 1. Temperature (Hőmérséklet)
// 2. Precipitation (Csapadék)
// 3. Wind Speed (Szélsebesség)
// 4. Pressure (Légnyomás)
// 5. Humidity (Páratartalom)
// 6. Wind Direction (Szélirány)

// Additional features:
// - 3-day forecast
// - 6-hour forecast chart
// - Radar map (RainViewer)
```

### Water Level Module

```typescript
// Stations: 3 total
const WATER_STATIONS = [
  'Baja',
  'Mohács',
  'Nagybajcs'
];

// Data cards: 3 total
// 1. Water Level (Vízállás) - cm
// 2. Discharge (Vízhozam) - m³/s
// 3. Water Temperature (Vízhőmérséklet) - °C

// Features:
// - Multi-station comparison chart
// - 5-day forecast
// - Data table with values per station
// - NO historical data display
// - NO critical levels visualization on charts (only numeric values)
```

### Drought Module

```typescript
// Monitoring locations: 5 total
const DROUGHT_LOCATIONS = [
  'Katymár',
  'Dávod',
  'Szederkény',
  'Sükösd',
  'Csávoly'
];

// Groundwater wells: 15 total (see LOCATIONS_DATA.md for full list)
const GROUNDWATER_WELLS = [
  { name: 'Sátorhely', code: '4576' },
  { name: 'Mohács', code: '1460' },
  // ... 13 more
];

// Data cards: 4 total
// 1. Drought Index (dropdown: location selector)
// 2. Soil Moisture (dropdown: location selector)
// 3. Water Deficit (dropdown: location selector)
// 4. Groundwater Level (dropdown: WELL selector) ⚠️ DIFFERENT!

// Maps: 3 total
// 1. Groundwater Map (HUGEO) - well markers
// 2. Drought Monitoring Map - monitoring stations with parameter selector
// 3. Water Deficit Map (OVF) - heatmap

// Well list: 15 wells in 3-column grid, clickable
```

---

## 🗄️ Database & Supabase

### Table Structure

```typescript
// Four separate tables for locations
'meteorology_cities'      // 4 cities
'water_level_stations'    // 3 stations
'drought_locations'       // 5 locations
'groundwater_wells'       // 15 wells

// Data tables
'meteorology_data'
'water_level_data'
'drought_data'
'groundwater_data'
```

### Supabase Client Usage

```typescript
// ✅ GOOD - Proper error handling
const { data, error } = await supabase
  .from('meteorology_cities')
  .select('*')
  .eq('is_active', true);

if (error) {
  console.error('Error fetching cities:', error);
  return null;
}

return data;

// ❌ BAD - No error handling
const { data } = await supabase
  .from('meteorology_cities')
  .select('*');

return data; // What if there's an error?
```

---

## 📱 Responsive Design

### Breakpoints (Mobile-First)

```typescript
// Tailwind breakpoints
sm: '640px'   // Small devices
md: '768px'   // Tablets
lg: '1024px'  // Desktops
xl: '1280px'  // Large desktops

// Usage
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

### Component Responsiveness

```typescript
// Data cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  
// Maps (drought module)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  
// Charts
<div className="h-[250px] md:h-[350px] w-full">
```

---

## ♿ Accessibility Requirements

### ARIA Labels

```typescript
// ✅ GOOD - Proper accessibility
<select
  aria-label="Város kiválasztása"
  aria-describedby="city-help-text"
>
  <option value="szekszard">Szekszárd</option>
</select>

// Data card
<div role="region" aria-labelledby="temp-heading">
  <h3 id="temp-heading">Hőmérséklet</h3>
  <p aria-live="polite">15.3 fok celsius</p>
</div>
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Proper tab order
- Focus visible states

---

## 🧪 Testing Approach

### Component Testing

```typescript
// Example test structure
import { render, screen } from '@testing-library/react';
import { WeatherCard } from './WeatherCard';

describe('WeatherCard', () => {
  it('renders temperature correctly', () => {
    render(<WeatherCard cityName="Szekszárd" temperature={15.3} />);
    expect(screen.getByText('15.3°C')).toBeInTheDocument();
  });
});
```

---

## 🚀 Development Workflow

### When Starting a New Task:

1. **Read Documentation**
   ```
   "Before creating X component, let me read the relevant documentation..."
   → Read docs/PROJECT_SUMMARY.md
   → Read docs/DESIGN_SPECIFICATION.md
   → Read docs/LOCATIONS_DATA.md if location-related
   ```

2. **Understand Context**
   ```
   "I need to understand which module this belongs to and how it fits..."
   → Check module structure
   → Identify dependencies
   → Plan component hierarchy
   ```

3. **Follow Standards**
   ```
   "I'll create this following TypeScript strict mode and Tailwind styling..."
   → Use proper TypeScript types
   → Apply Tailwind classes from design system
   → Ensure accessibility
   ```

4. **Test & Validate**
   ```
   "Let me verify this works correctly..."
   → Visual check
   → TypeScript compilation
   → Responsive behavior
   ```

---

## 🐛 Common Pitfalls to Avoid

### ❌ DON'T:

1. **Create a global city selector**
   ```typescript
   // WRONG - This breaks module independence
   const GlobalCitySelector = () => {
     // Don't create this
   }
   ```

2. **Mix drought location types**
   ```typescript
   // WRONG - Wells and locations are separate!
   const allDroughtLocations = [...locations, ...wells]; // Don't mix!
   ```

3. **Use 'any' type**
   ```typescript
   // WRONG
   const data: any = fetchData();
   ```

4. **Ignore responsive design**
   ```typescript
   // WRONG - Not responsive
   <div className="w-[800px]">
   
   // RIGHT - Responsive
   <div className="w-full max-w-7xl mx-auto px-4">
   ```

5. **Skip documentation**
   ```
   // WRONG approach:
   "I'll just start coding without reading the docs..."
   
   // RIGHT approach:
   "Let me read PROJECT_SUMMARY.md first to understand the architecture..."
   ```

---

## 📦 Dependencies & Libraries

### Core Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "@supabase/supabase-js": "^2.38.0",
  "recharts": "^2.10.0",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "lucide-react": "^0.294.0"
}
```

### When to Use Each:

- **Recharts**: All charts (line charts, bar charts)
- **Leaflet**: All maps (groundwater, drought monitoring, water deficit)
- **Lucide React**: All icons
- **Supabase**: All data fetching and database operations

---

## 🎯 Success Criteria

### A task is complete when:

- ✅ TypeScript compiles without errors
- ✅ Component follows design specification exactly
- ✅ Responsive on mobile, tablet, desktop
- ✅ Accessible (proper ARIA labels)
- ✅ Handles loading and error states
- ✅ Follows module-specific architecture
- ✅ No console errors or warnings

---

## 💬 Example Prompts for Development

### Starting a New Module

```
"I need to develop the Meteorology module. Let me first read the 
docs/PROJECT_SUMMARY.md to understand the complete architecture and 
requirements. Then I'll create the module structure with:
- CitySelector component (4 cities)
- 6 data cards
- Weather charts
- Radar integration"
```

### Creating a Component

```
"Create the BaseSelector component following these requirements:
- Read docs/DESIGN_SPECIFICATION.md for exact styling
- TypeScript interfaces for props
- Tailwind CSS utility classes only
- Accessible with proper ARIA labels
- Dropdown with search functionality (later)
- Location icon from lucide-react"
```

### Implementing a Feature

```
"Implement the drought module's dual selector system:
1. Location selector for monitoring data (5 locations)
2. Well selector for groundwater data (15 wells)
These are SEPARATE selectors used in different data cards.
Reference docs/LOCATIONS_DATA.md for the complete lists."
```

---

## 📞 Questions? Always Check Documentation First!

Before asking "How should I do X?", check:
1. docs/PROJECT_SUMMARY.md - Architecture decisions
2. docs/DESIGN_SPECIFICATION.md - Visual design
3. docs/LOCATIONS_DATA.md - Data and locations
4. docs/DATA_STRUCTURES.md - Data formats

---

## 🎓 Remember

1. **Documentation is your friend** - Always read before coding
2. **Module independence** - Each module manages its own state
3. **Drought has two selectors** - Never forget this!
4. **TypeScript strict** - No 'any' types
5. **Mobile-first** - Always responsive
6. **Accessibility** - ARIA labels on everything

---

*Happy Coding with Claude Code! 🚀*

*For questions, always reference the docs/ folder first!*
