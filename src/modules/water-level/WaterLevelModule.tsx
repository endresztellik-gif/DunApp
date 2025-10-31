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
import { Waves, TrendingUp, Thermometer, AlertCircle } from 'lucide-react';
import { StationSelector } from '../../components/selectors/StationSelector';
import { DataCard } from '../../components/UI/DataCard';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Footer } from '../../components/Layout/Footer';
import { MultiStationChart } from './MultiStationChart';
import { DataTable } from './DataTable';
import { useWaterLevelData } from '../../hooks/useWaterLevelData';
import type { WaterLevelStation, DataSource } from '../../types';

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

  // Fetch real water level data from Supabase
  const { waterLevelData, isLoading, error: dataError } = useWaterLevelData(
    selectedStation?.id || null
  );

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

      {/* Error State */}
      {dataError && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-red-900 mb-1">
              Hiba az adatok betöltésekor
            </h3>
            <p className="text-sm text-red-700">
              {dataError.message || 'Nem sikerült betölteni a vízállási adatokat.'}
            </p>
          </div>
        </div>
      )}

      {/* No Station Selected State */}
      {!selectedStation && !dataError && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-start gap-3">
          <Waves className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              Válassz ki egy állomást a vízállási adatok megjelenítéséhez.
            </p>
          </div>
        </div>
      )}

      {/* No Data Available State */}
      {selectedStation && !waterLevelData && !isLoading && !dataError && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-start gap-3">
          <Waves className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              Jelenleg nincs elérhető vízállási adat: <strong>{selectedStation.stationName}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Water Level Data Cards - 1x3 Grid */}
      {waterLevelData && (
        <div className="grid-water-cards mb-6">
          <DataCard
            icon={Waves}
            label="Vízállás"
            value={waterLevelData.waterLevelCm}
            unit="cm"
            moduleColor="water"
          />
          <DataCard
            icon={TrendingUp}
            label="Vízhozam"
            value={waterLevelData.flowRateM3s}
            unit="m³/s"
            moduleColor="water"
          />
          <DataCard
            icon={Thermometer}
            label="Vízhőmérséklet"
            value={waterLevelData.waterTempCelsius}
            unit="°C"
            moduleColor="water"
          />
        </div>
      )}

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
