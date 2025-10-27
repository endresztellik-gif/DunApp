/**
 * WaterLevelModule Component
 *
 * Main component for the Water Level module.
 * Displays water level data for 3 stations with:
 * - Station selector (module-specific)
 * - 3 data cards (water level, flow rate, water temperature)
 * - Multi-station comparison chart
 * - Data table with 5-day forecast
 */

import React, { useState } from 'react';
import { Waves, TrendingUp, Thermometer } from 'lucide-react';
import { StationSelector } from '../../components/selectors/StationSelector';
import { DataCard } from '../../components/UI/DataCard';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Footer } from '../../components/Layout/Footer';
import { MultiStationChart } from './MultiStationChart';
import { DataTable } from './DataTable';
import type { WaterLevelStation, WaterLevelData, DataSource } from '../../types';

interface WaterLevelModuleProps {
  stations: WaterLevelStation[];
  initialStation?: WaterLevelStation;
}

export const WaterLevelModule: React.FC<WaterLevelModuleProps> = ({
  stations,
  initialStation,
}) => {
  const [selectedStation, setSelectedStation] = useState<WaterLevelStation | null>(
    initialStation || stations[0] || null
  );
  const [isLoading] = useState(false);

  // Placeholder water level data (will be replaced with real data by Data Engineer)
  const waterLevelData: WaterLevelData | null = selectedStation
    ? {
        stationId: selectedStation.id,
        waterLevelCm: 394,
        flowRateM3s: 2416,
        waterTempCelsius: 23,
        timestamp: new Date().toISOString(),
      }
    : null;

  // Data sources for footer
  const dataSources: DataSource[] = [
    {
      name: 'VízÜgy Data Portal',
      url: 'https://www.vizugy.hu',
      lastUpdate: new Date().toISOString(),
    },
  ];

  if (isLoading) {
    return (
      <div className="main-container">
        <LoadingSpinner message="Vízállási adatok betöltése..." />
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Station Selector */}
      <div className="flex justify-end mb-6">
        <StationSelector
          stations={stations}
          selectedStation={selectedStation}
          onStationChange={setSelectedStation}
        />
      </div>

      {/* Water Level Data Cards - 1x3 Grid */}
      <div className="grid-water-cards mb-6">
        <DataCard
          icon={Waves}
          label="Vízállás"
          value={waterLevelData?.waterLevelCm ?? null}
          unit="cm"
          moduleColor="water"
        />
        <DataCard
          icon={TrendingUp}
          label="Vízhozam"
          value={waterLevelData?.flowRateM3s ?? null}
          unit="m³/s"
          moduleColor="water"
        />
        <DataCard
          icon={Thermometer}
          label="Vízhőmérséklet"
          value={waterLevelData?.waterTempCelsius ?? null}
          unit="°C"
          moduleColor="water"
        />
      </div>

      {/* Multi-Station Comparison Chart */}
      <div className="mb-6">
        <h2 className="section-title mb-4">Vízállás Előrejelzés</h2>
        <p className="section-subtitle mb-4">
          3 állomás összehasonlítása (Szekszárd, Passau, Nagybajcs)
        </p>
        <MultiStationChart stations={stations} />
      </div>

      {/* Data Table */}
      <div className="mb-6">
        <h2 className="section-title mb-4">5 napos előrejelzés</h2>
        <DataTable stations={stations} />
      </div>

      {/* Additional upstream data */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Kiegészítő adatok (felső vízgyűjtő)
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">Passau (Németország):</span> 541 cm
          </p>
          <p>
            <span className="font-medium">Nagybajcs:</span> 487 cm
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          A felső vízgyűjtő adatok felhasználhatók a helyi előrejelzések pontosításához.
        </p>
      </div>

      {/* Footer with data source */}
      <Footer dataSources={dataSources} />
    </div>
  );
};
