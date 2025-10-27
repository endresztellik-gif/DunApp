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
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Footer } from '../../components/Layout/Footer';
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
  const [isLoading] = useState(false);

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
