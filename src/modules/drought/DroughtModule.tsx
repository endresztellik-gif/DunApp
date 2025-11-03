/**
 * DroughtModule Component
 *
 * Main component for the Drought module - the most complex module.
 * Features:
 * - TWO separate state management (selectedLocation AND selectedWell)
 * - 4 data cards with embedded selectors
 * - 3 maps (groundwater, monitoring, water deficit)
 * - Well list grid with 15 wells
 *
 * CRITICAL: Uses TWO separate selectors - DO NOT merge them!
 */

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Footer } from '../../components/Layout/Footer';
import { useDroughtData } from '../../hooks/useDroughtData';
import { useGroundwaterData } from '../../hooks/useGroundwaterData';
import { DroughtIndexCard } from './DroughtIndexCard';
import { SoilMoistureCard } from './SoilMoistureCard';
import { WaterDeficitCard } from './WaterDeficitCard';
import { GroundwaterLevelCard } from './GroundwaterLevelCard';
import { GroundwaterMap } from './GroundwaterMap';
import { DroughtMonitoringMap } from './DroughtMonitoringMap';
import { WaterDeficitMap } from './WaterDeficitMap';
import { WellListGrid } from './WellListGrid';
import type { DroughtLocation, GroundwaterWell, DataSource } from '../../types';

interface DroughtModuleProps {
  locations: DroughtLocation[]; // 5 monitoring locations
  wells: GroundwaterWell[]; // 15 groundwater wells
  initialLocation?: DroughtLocation;
  initialWell?: GroundwaterWell;
}

export const DroughtModule: React.FC<DroughtModuleProps> = ({
  locations,
  wells,
  initialLocation,
  initialWell,
}) => {
  // TWO SEPARATE STATES - CRITICAL!
  const [selectedLocation, setSelectedLocation] = useState<DroughtLocation | null>(
    initialLocation || locations[0] || null
  );
  const [selectedWell, setSelectedWell] = useState<GroundwaterWell | null>(
    initialWell || wells[0] || null
  );

  // Fetch real drought and groundwater data from Supabase
  const {
    droughtData,
    isLoading: isDroughtLoading,
    error: droughtError
  } = useDroughtData(selectedLocation?.id || null);

  const {
    groundwaterData,
    isLoading: isGroundwaterLoading,
    error: groundwaterError
  } = useGroundwaterData(selectedWell?.id || null);

  const isLoading = isDroughtLoading || isGroundwaterLoading;

  // Data sources for footer
  const dataSources: DataSource[] = [
    {
      name: 'HUGEO talajvíz',
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'OVF aszálymonitoring',
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'VízÜgy',
      url: 'https://www.vizugy.hu',
      lastUpdate: new Date().toISOString(),
    },
  ];

  if (isLoading) {
    return (
      <div className="main-container">
        <LoadingSpinner message="Aszálymonitoring adatok betöltése..." />
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* API Unavailability Disclaimer Banner */}
      <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-6 w-6 text-yellow-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-yellow-900 mb-1">
            ⚠️ Aszály adatok átmenetileg nem elérhetők
          </h3>
          <p className="text-sm text-yellow-800 leading-relaxed">
            A <strong>aszalymonitoring.vizugy.hu</strong> API jelenleg nem működik (404 hiba).
            Dolgozunk a probléma megoldásán és alternatív adatforrások integrálásán.
            A helyszínválasztók és térképek továbbra is használhatók, de valós adatok jelenleg nem érhetők el.
          </p>
        </div>
      </div>

      {/* Drought Data Error State */}
      {droughtError && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-red-900 mb-1">
              Hiba az aszálymonitoring adatok betöltésekor
            </h3>
            <p className="text-sm text-red-700">
              {droughtError.message || 'Nem sikerült betölteni az aszály adatokat.'}
            </p>
          </div>
        </div>
      )}

      {/* Groundwater Data Error State */}
      {groundwaterError && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-red-900 mb-1">
              Hiba a talajvíz adatok betöltésekor
            </h3>
            <p className="text-sm text-red-700">
              {groundwaterError.message || 'Nem sikerült betölteni a talajvíz adatokat.'}
            </p>
          </div>
        </div>
      )}

      {/* No Location Selected State */}
      {!selectedLocation && !droughtError && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              Válassz ki egy helyszínt az aszálymonitoring adatok megjelenítéséhez.
            </p>
          </div>
        </div>
      )}

      {/* No Well Selected State */}
      {!selectedWell && !groundwaterError && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              Válassz ki egy kutat a talajvíz adatok megjelenítéséhez.
            </p>
          </div>
        </div>
      )}

      {/* No Data Available States */}
      {selectedLocation && !droughtData && !isDroughtLoading && !droughtError && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              Jelenleg nincs elérhető aszály adat: <strong>{selectedLocation.locationName}</strong>
            </p>
          </div>
        </div>
      )}

      {selectedWell && !groundwaterData && !isGroundwaterLoading && !groundwaterError && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              Jelenleg nincs elérhető talajvíz adat: <strong>{selectedWell.wellName}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Data Cards with Embedded Selectors - 2x2 Grid */}
      <div className="grid-drought-cards mb-6">
        <DroughtIndexCard
          locations={locations}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
        />
        <SoilMoistureCard
          locations={locations}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
        />
        <WaterDeficitCard
          locations={locations}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
        />
        <GroundwaterLevelCard
          wells={wells}
          selectedWell={selectedWell}
          onWellChange={setSelectedWell}
        />
      </div>

      {/* Maps Section - 3 Maps */}
      <div className="mb-6">
        <h2 className="section-title mb-4">Aszály és Talajvíz Térképek</h2>
        <div className="grid-drought-maps">
          <GroundwaterMap
            wells={wells}
            selectedWell={selectedWell}
            onWellSelect={setSelectedWell}
          />
          <DroughtMonitoringMap
            locations={locations}
            selectedLocation={selectedLocation}
            onLocationSelect={setSelectedLocation}
          />
          <WaterDeficitMap />
        </div>
      </div>

      {/* Well Monitoring Grid */}
      <div className="mb-6">
        <h2 className="section-title mb-4">Talajvízkút Monitoring (15 kút)</h2>
        <p className="section-subtitle mb-4">
          Választható kutak 60 napos előzmények megtekintéséhez. Forrás: VízÜgy Data Portal
        </p>
        <WellListGrid
          wells={wells}
          selectedWell={selectedWell}
          onWellSelect={setSelectedWell}
        />
      </div>

      {/* Footer with data sources */}
      <Footer dataSources={dataSources} />
    </div>
  );
};
