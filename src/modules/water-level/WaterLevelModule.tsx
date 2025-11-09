/**
 * WaterLevelModule Component
 *
 * Main component for the Water Level module.
 * Displays water level data for 3 stations with:
 * - Station selector (module-specific)
 * - 3 data cards (water level, flow rate, water temperature)
 * - Multi-station comparison chart
 * - Data table with 5-day forecast
 *
 * Updated: 2025-11-03 (Phase 4.5c)
 * Uses real Supabase data via useStations(), useWaterLevelData(), useWaterLevelForecast()
 */

import React, { useState } from 'react';
import { Waves, TrendingUp, Thermometer, AlertCircle } from 'lucide-react';
import { StationSelector } from '../../components/selectors/StationSelector';
import { DataCard } from '../../components/UI/DataCard';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Footer } from '../../components/Layout/Footer';
import { NotificationSettings } from '../../components/NotificationSettings';
import { MultiStationChart } from './MultiStationChart';
import { ForecastDataTable } from './ForecastDataTable';
import { useStations } from '../../hooks/useStations';
import { useWaterLevelData } from '../../hooks/useWaterLevelData';
import type { DataSource } from '../../types';

export const WaterLevelModule: React.FC = () => {
  // Fetch all stations from Supabase
  const { stations, isLoading: stationsLoading, error: stationsError } = useStations();

  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  // Auto-select first station when stations load
  React.useEffect(() => {
    if (stations.length > 0 && !selectedStation) {
      setSelectedStation(stations[0].id);
    }
  }, [stations, selectedStation]);

  // Fetch water level data for selected station
  const { waterLevelData, station, isLoading: dataLoading, error: dataError } = useWaterLevelData(
    selectedStation
  );

  // Data sources for footer
  const dataSources: DataSource[] = [
    {
      name: 'VízÜgy Data Portal',
      url: 'https://www.vizugy.hu',
      lastUpdate: waterLevelData?.measuredAt || new Date().toISOString(),
    },
    {
      name: 'HydroInfo.hu',
      url: 'http://www.hydroinfo.hu',
      lastUpdate: new Date().toISOString(),
    },
  ];

  // Loading state - stations are loading
  if (stationsLoading) {
    return (
      <div className="main-container">
        <LoadingSpinner message="Állomások betöltése..." />
      </div>
    );
  }

  // Error state - failed to load stations
  if (stationsError) {
    return (
      <div className="main-container">
        <div className="mb-6 flex items-start gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h3 className="mb-1 text-base font-semibold text-red-900">
              Hiba az állomások betöltésekor
            </h3>
            <p className="text-sm text-red-700">
              {stationsError.message || 'Nem sikerült betölteni az állomásokat.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No stations available
  if (stations.length === 0) {
    return (
      <div className="main-container">
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-8 text-center">
          <Waves className="mx-auto mb-3 h-12 w-12 text-blue-600" />
          <h3 className="mb-2 text-lg font-semibold text-blue-900">Nincs elérhető állomás</h3>
          <p className="text-sm text-blue-700">
            Jelenleg nincs aktív vízállás mérőállomás az adatbázisban.
          </p>
        </div>
      </div>
    );
  }

  // Find selected station object for selector
  const selectedStationObj = stations.find(s => s.id === selectedStation) || null;

  return (
    <div className="main-container">
      {/* Station Selector */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Állomás kiválasztása</h3>
        <StationSelector
          stations={stations}
          selectedStation={selectedStationObj}
          onStationChange={(station) => setSelectedStation(station.id)}
        />
      </div>

      {/* Push Notification Settings */}
      <div className="mb-6">
        <NotificationSettings />
      </div>

      {/* Error State - Data Loading Error */}
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

      {/* Loading state for water level data */}
      {dataLoading && (
        <div className="mb-6">
          <LoadingSpinner message="Vízállási adatok betöltése..." />
        </div>
      )}

      {/* No Station Selected State */}
      {!selectedStation && !dataError && !dataLoading && (
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-8 text-center">
          <Waves className="mx-auto mb-3 h-12 w-12 text-blue-600" />
          <h3 className="mb-2 text-lg font-semibold text-blue-900">Válassz állomást</h3>
          <p className="text-sm text-blue-700">
            Válassz egy állomást a fenti listából a vízállási adatok megtekintéséhez.
          </p>
        </div>
      )}

      {/* No Data Available State */}
      {selectedStation && !waterLevelData && !dataLoading && !dataError && (
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-8 text-center">
          <Waves className="mx-auto mb-3 h-12 w-12 text-blue-600" />
          <h3 className="mb-2 text-lg font-semibold text-blue-900">Nincs elérhető adat</h3>
          <p className="text-sm text-blue-700">
            Jelenleg nincs vízállási adat ehhez az állomáshoz:{' '}
            <strong>{station?.name || 'N/A'}</strong>
          </p>
        </div>
      )}

      {/* Water Level Data Cards - 1x3 Grid */}
      {waterLevelData && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* 5-Day Forecast Section */}
      <div className="mb-6">
        <h2 className="section-title mb-4">5 Napos Előrejelzés</h2>
        <p className="section-subtitle mb-4">
          Nagybajcs, Baja, Mohács - vízállás előrejelzés
        </p>

        {/* Forecast Chart */}
        <div className="mb-6">
          <MultiStationChart stations={stations} />
        </div>

        {/* Forecast Data Table */}
        <ForecastDataTable stations={stations} />
      </div>

      {/* Footer with data source */}
      <Footer dataSources={dataSources} />
    </div>
  );
};
