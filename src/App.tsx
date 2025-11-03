/**
 * App Component
 *
 * Main application entry point with module routing.
 * Integrates all three modules:
 * - Meteorology Module (4 cities)
 * - Water Level Module (3 stations)
 * - Drought Module (5 locations + 15 wells)
 *
 * CRITICAL: Each module has its own selector - NO global selectors!
 */

import { useState, lazy, Suspense } from 'react';
import { Header } from './components/Layout/Header';
import { InstallPrompt } from './components/InstallPrompt';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { useCities } from './hooks/useCities';

// Lazy load modules for better initial load performance
const MeteorologyModule = lazy(() =>
  import('./modules/meteorology/MeteorologyModule').then(module => ({
    default: module.MeteorologyModule
  }))
);
const WaterLevelModule = lazy(() =>
  import('./modules/water-level/WaterLevelModule').then(module => ({
    default: module.WaterLevelModule
  }))
);
const DroughtModule = lazy(() =>
  import('./modules/drought/DroughtModule').then(module => ({
    default: module.DroughtModule
  }))
);
import {
  MOCK_STATIONS,
  MOCK_DROUGHT_LOCATIONS,
  MOCK_GROUNDWATER_WELLS,
  validateMockData,
} from './data/mockData';
import type { ModuleType } from './types';

function App() {
  // Validate mock data on mount (development only)
  if (import.meta.env.DEV) {
    try {
      validateMockData();
    } catch (error) {
      console.error('Mock data validation error:', error);
    }
  }

  const [activeModule, setActiveModule] = useState<ModuleType>('meteorology');

  // Fetch real cities from Supabase
  const { cities, isLoading: citiesLoading, error: citiesError } = useCities();

  // Show loading spinner while cities are loading (only for meteorology module)
  if (activeModule === 'meteorology' && citiesLoading) {
    return (
      <div className="min-h-screen bg-bg-main">
        <Header currentModule={activeModule} onModuleChange={setActiveModule} />
        <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <LoadingSpinner message="Városok betöltése..." />
        </main>
      </div>
    );
  }

  // Show error if cities failed to load
  if (activeModule === 'meteorology' && citiesError) {
    return (
      <div className="min-h-screen bg-bg-main">
        <Header currentModule={activeModule} onModuleChange={setActiveModule} />
        <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-900">
            <h3 className="font-semibold">Hiba a városok betöltésekor</h3>
            <p className="text-sm">{citiesError.message}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Header with Module Navigation */}
      <Header currentModule={activeModule} onModuleChange={setActiveModule} />

      {/* Main Content - Render Active Module with Suspense */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <Suspense fallback={<LoadingSpinner message="Modul betöltése..." />}>
          {activeModule === 'meteorology' && cities.length > 0 && (
            <MeteorologyModule cities={cities} initialCity={cities[0]} />
          )}
          {activeModule === 'water-level' && (
            <WaterLevelModule stations={MOCK_STATIONS} initialStation={MOCK_STATIONS[0]} />
          )}
          {activeModule === 'drought' && (
            <DroughtModule
              locations={MOCK_DROUGHT_LOCATIONS}
              wells={MOCK_GROUNDWATER_WELLS}
              initialLocation={MOCK_DROUGHT_LOCATIONS[0]}
              initialWell={MOCK_GROUNDWATER_WELLS[0]}
            />
          )}
        </Suspense>
      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default App;
