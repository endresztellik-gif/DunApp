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
import { useDroughtLocations } from './hooks/useDroughtLocations';
import { useGroundwaterWells } from './hooks/useGroundwaterWells';

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
import { validateMockData } from './data/mockData';
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

  // Fetch real data from Supabase
  const { cities, isLoading: citiesLoading, error: citiesError } = useCities();
  const { locations: droughtLocations, isLoading: locationsLoading, error: locationsError } = useDroughtLocations();
  const { wells: groundwaterWells, isLoading: wellsLoading, error: wellsError } = useGroundwaterWells();

  // Show loading spinner while data is loading
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

  if (activeModule === 'drought' && (locationsLoading || wellsLoading)) {
    return (
      <div className="min-h-screen bg-bg-main">
        <Header currentModule={activeModule} onModuleChange={setActiveModule} />
        <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <LoadingSpinner message="Aszály adatok betöltése..." />
        </main>
      </div>
    );
  }

  // Show error if data failed to load
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

  if (activeModule === 'drought' && (locationsError || wellsError)) {
    return (
      <div className="min-h-screen bg-bg-main">
        <Header currentModule={activeModule} onModuleChange={setActiveModule} />
        <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-900">
            <h3 className="font-semibold">Hiba az aszály adatok betöltésekor</h3>
            <p className="text-sm">{locationsError?.message || wellsError?.message}</p>
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
            <WaterLevelModule />
          )}
          {activeModule === 'drought' && droughtLocations.length > 0 && groundwaterWells.length > 0 && (
            <DroughtModule
              locations={droughtLocations}
              wells={groundwaterWells}
              initialLocation={droughtLocations[0]}
              initialWell={groundwaterWells[0]}
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
