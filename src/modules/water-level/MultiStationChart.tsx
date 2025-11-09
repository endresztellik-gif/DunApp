/**
 * MultiStationChart Component
 *
 * Displays water level comparison for 3 stations using real forecast data.
 * Each station has its own color and shows critical level markers.
 *
 * Updated: 2025-11-03 (Phase 4.5d)
 * Uses real Supabase data via useWaterLevelForecast() for all 3 stations
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EmptyState } from '../../components/UI/EmptyState';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { TrendingUp } from 'lucide-react';
import { useWaterLevelForecast } from '../../hooks/useWaterLevelForecast';
import type { WaterLevelStation, WaterLevelForecast } from '../../types';

interface MultiStationChartProps {
  stations: WaterLevelStation[];
}

// Station colors - dynamically assigned
const STATION_COLORS = ['#00BCD4', '#FF6F00', '#9C27B0']; // cyan, orange, purple

/**
 * Aggregate forecast data from multiple stations into chart format
 * Now includes uncertainty bands (min/max) for each station
 */
const aggregateChartData = (
  forecasts: Array<{ stationName: string; forecasts: WaterLevelForecast[] }>
) => {
  if (forecasts.length === 0 || forecasts.every(f => f.forecasts.length === 0)) {
    return [];
  }

  // Get all unique dates
  const allDates = new Set<string>();
  forecasts.forEach(({ forecasts: stationForecasts }) => {
    stationForecasts.forEach(f => allDates.add(f.forecastDate));
  });

  const sortedDates = Array.from(allDates).sort();

  // Build chart data with uncertainty bands
  return sortedDates.map(date => {
    const dataPoint: any = {
      date: new Date(date).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
    };

    forecasts.forEach(({ stationName, forecasts: stationForecasts }) => {
      const forecast = stationForecasts.find(f => f.forecastDate === date);

      if (forecast) {
        const centerValue = forecast.forecastedLevelCm;
        const uncertainty = forecast.uncertaintyCm || 0;

        // Center line (main forecast)
        dataPoint[stationName] = centerValue;

        // Uncertainty bands
        dataPoint[`${stationName}_min`] = centerValue - uncertainty;
        dataPoint[`${stationName}_max`] = centerValue + uncertainty;
      } else {
        dataPoint[stationName] = null;
        dataPoint[`${stationName}_min`] = null;
        dataPoint[`${stationName}_max`] = null;
      }
    });

    return dataPoint;
  });
};

export const MultiStationChart: React.FC<MultiStationChartProps> = ({ stations }) => {
  // Fetch forecasts for all 3 stations
  const forecast1 = useWaterLevelForecast(stations[0]?.id || null);
  const forecast2 = useWaterLevelForecast(stations[1]?.id || null);
  const forecast3 = useWaterLevelForecast(stations[2]?.id || null);

  // Check loading states
  const isLoading = forecast1.isLoading || forecast2.isLoading || forecast3.isLoading;

  // Check errors
  const hasError = forecast1.error || forecast2.error || forecast3.error;

  if (stations.length !== 3) {
    return (
      <EmptyState
        icon={TrendingUp}
        message="Nincs összehasonlítási adat"
        description="3 állomás adatai szükségesek a grafikon megjelenítéséhez"
      />
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Előrejelzések betöltése..." />;
  }

  if (hasError) {
    return (
      <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">
          Az előrejelzési adatok betöltése sikertelen. Próbáld újra később.
        </p>
      </div>
    );
  }

  // Aggregate forecast data
  const aggregatedForecasts = [
    { stationName: stations[0].name, forecasts: forecast1.forecasts },
    { stationName: stations[1].name, forecasts: forecast2.forecasts },
    { stationName: stations[2].name, forecasts: forecast3.forecasts },
  ];

  const chartData = aggregateChartData(aggregatedForecasts);

  if (chartData.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        message="Nincs előrejelzési adat"
        description="Jelenleg nincs elérhető előrejelzés az állomásokhoz."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ed" />
            <XAxis
              dataKey="date"
              stroke="#607d8b"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#607d8b"
              style={{ fontSize: '12px' }}
              label={{ value: 'cm', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e0e7ed',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }}
              formatter={(value: any) =>
                value !== null && value !== undefined ? `${Number(value).toFixed(0)} cm` : 'N/A'
              }
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
            />

            {/* Station Lines - Dynamically generated with uncertainty bands */}
            {stations.map((station, index) => (
              <React.Fragment key={station.id}>
                {/* Min uncertainty line (lower bound) - dashed, thin */}
                <Line
                  type="monotone"
                  dataKey={`${station.name}_min`}
                  stroke={STATION_COLORS[index]}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={false}
                  connectNulls
                  name={`${station.name} (min)`}
                  legendType="none"
                />

                {/* Max uncertainty line (upper bound) - dashed, thin */}
                <Line
                  type="monotone"
                  dataKey={`${station.name}_max`}
                  stroke={STATION_COLORS[index]}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={false}
                  connectNulls
                  name={`${station.name} (max)`}
                  legendType="none"
                />

                {/* Center line (main forecast) - solid, thick, with dots */}
                <Line
                  type="monotone"
                  dataKey={station.name}
                  stroke={STATION_COLORS[index]}
                  strokeWidth={2}
                  dot={{ fill: STATION_COLORS[index], r: 5 }}
                  activeDot={{ r: 7 }}
                  connectNulls
                  name={station.name}
                />
              </React.Fragment>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with station details */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {stations.map((station, index) => (
          <div
            key={station.id}
            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: STATION_COLORS[index] }}
              />
              <span className="text-sm font-semibold text-gray-900">{station.name}</span>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              {station.riverKm && (
                <div>
                  <span className="font-medium">Fkm:</span> {station.riverKm}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
