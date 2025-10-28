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

import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { InstallPrompt } from './components/InstallPrompt';
import { MeteorologyModule } from './modules/meteorology/MeteorologyModule';
import { WaterLevelModule } from './modules/water-level/WaterLevelModule';
import { DroughtModule } from './modules/drought/DroughtModule';
import {
  MOCK_CITIES,
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

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Header with Module Navigation */}
      <Header currentModule={activeModule} onModuleChange={setActiveModule} />

      {/* Main Content - Render Active Module */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        {activeModule === 'meteorology' && (
          <MeteorologyModule cities={MOCK_CITIES} initialCity={MOCK_CITIES[0]} />
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
      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default App;
