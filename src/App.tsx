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

import { useState, lazy, Suspense, useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { ModuleTabs } from './components/Layout/ModuleTabs';
import { HomePage } from './components/HomePage';
import { InstallPrompt } from './components/InstallPrompt';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { useCities } from './hooks/useCities';
import { useDroughtLocations } from './hooks/useDroughtLocations';
import { useGroundwaterWells } from './hooks/useGroundwaterWells';
import { supabase } from './lib/supabase';

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

  const [activeModule, setActiveModule] = useState<ModuleType | null>(null);

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

  // Fetch real data from Supabase
  const { cities, isLoading: citiesLoading, error: citiesError } = useCities();
  const { locations: droughtLocations, isLoading: locationsLoading, error: locationsError } = useDroughtLocations();
  const { wells: groundwaterWells, isLoading: wellsLoading, error: wellsError } = useGroundwaterWells();

  // Check water level alert when app loads (user request)
  useEffect(() => {
    const checkWaterLevelAlert = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-water-level-alert', {
          method: 'POST',
        });

        if (error) {
          console.error('Water level alert check failed:', error);
        } else if (import.meta.env.DEV) {
          console.log('Water level alert check:', data);
        }
      } catch (err) {
        console.error('Failed to check water level alert:', err);
      }
    };

    // Run alert check on app load
    checkWaterLevelAlert();
  }, []); // Empty dependency array - only run once on mount

  // Show HomePage if no module selected
  if (!activeModule) {
    return (
      <div className="min-h-screen">
        <HomePage onModuleSelect={setActiveModule} />
        <InstallPrompt />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      {/* Header with Module Navigation */}
      <Header
        currentModule={activeModule}
        onModuleChange={setActiveModule}
        isDark={isDark}
        onToggleDark={() => setIsDark(d => !d)}
      />

      {activeModule && (
        <ModuleTabs currentModule={activeModule} onModuleChange={setActiveModule} />
      )}

      {/* Main Content - Render Active Module with Suspense */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8 pb-24">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Modul betöltése..." />}>
            {activeModule === 'meteorology' && (
              citiesLoading ? (
                <LoadingSpinner message="Városok betöltése..." />
              ) : citiesError ? (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-900">
                  <h3 className="font-semibold">Hiba a városok betöltésekor</h3>
                  <p className="text-sm">{citiesError.message}</p>
                </div>
              ) : cities.length === 0 ? (
                <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
                  <h3 className="font-semibold">Nincsenek elérhető városok</h3>
                  <p className="text-sm">Nem sikerült betölteni a városlistát. Kérjük, töltse újra az oldalt.</p>
                </div>
              ) : (
                <MeteorologyModule cities={cities} initialCity={cities[0]} />
              )
            )}
            {activeModule === 'water-level' && (
              <WaterLevelModule />
            )}
            {activeModule === 'drought' && (
              (locationsLoading || wellsLoading) ? (
                <LoadingSpinner message="Aszály adatok betöltése..." />
              ) : (locationsError || wellsError) ? (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-900">
                  <h3 className="font-semibold">Hiba az aszály adatok betöltésekor</h3>
                  <p className="text-sm">{locationsError?.message || wellsError?.message}</p>
                </div>
              ) : droughtLocations.length > 0 && groundwaterWells.length > 0 ? (
                <DroughtModule
                  locations={droughtLocations}
                  wells={groundwaterWells}
                  initialLocation={droughtLocations[0]}
                  initialWell={groundwaterWells[0]}
                />
              ) : (
                <LoadingSpinner message="Adatok betöltése..." />
              )
            )}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default App;
