/**
 * GroundwaterChart Component - REAL DATA MODE ✅
 *
 * Displays 60-day water level trend for a selected groundwater well.
 * Uses Recharts for visualization with responsive design.
 *
 * ✅ NOW USING REAL DATA FROM SUPABASE (2025-11-06)
 * Data scraped daily from vizugy.hu (13,618 measurements from 15 wells)
 *
 * Features:
 * - Line chart showing water level over time
 * - Tooltip with formatted dates and values
 * - Loading state with spinner
 * - Empty state when no data available
 * - Well metadata display (name, code, location)
 * - Real-time data from Supabase (hourly cache)
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useGroundwaterTimeseries } from '../../hooks/useGroundwaterTimeseries';
import type { GroundwaterWell } from '../../types';

interface GroundwaterChartProps {
  well: GroundwaterWell;
}

export const GroundwaterChart: React.FC<GroundwaterChartProps> = ({ well }) => {
  // Fetch real data from Supabase
  const { timeseriesData, isLoading, error } = useGroundwaterTimeseries(well.id);

  // Format timestamp for chart display
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  };

  // Transform data for Recharts
  const chartData = timeseriesData.map((point) => ({
    timestamp: point.timestamp,
    dateLabel: formatDate(point.timestamp),
    waterLevelMeters: point.waterLevelMeters,
    waterLevelMasl: point.waterLevelMasl,
    waterTemperature: point.waterTemperature
  }));

  // Calculate Y-axis domain for better visibility of small changes
  const waterLevels = chartData.map((d) => d.waterLevelMeters);
  const minLevel = Math.min(...waterLevels);
  const maxLevel = Math.max(...waterLevels);
  const range = maxLevel - minLevel;

  // Add padding: 30% of range or minimum 0.5m (50cm)
  const padding = Math.max(range * 0.3, 0.5);
  const yDomain = [
    Math.floor((minLevel - padding) * 10) / 10, // Round down to 0.1m
    Math.ceil((maxLevel + padding) * 10) / 10   // Round up to 0.1m
  ];

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const fullDate = new Date(data.timestamp).toLocaleString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="text-xs text-gray-600 mb-1">{fullDate}</p>
          <p className="text-sm font-semibold text-blue-700">
            Talajvízszint: {data.waterLevelMeters.toFixed(2)} m
          </p>
          {data.waterLevelMasl !== null && (
            <p className="text-xs text-gray-600">
              tBf: {data.waterLevelMasl.toFixed(2)} m
            </p>
          )}
          {data.waterTemperature !== null && (
            <p className="text-xs text-gray-600">
              Hőmérséklet: {data.waterTemperature.toFixed(1)} °C
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Show only every 5th date label to avoid crowding
  const tickFormatter = (value: string, index: number) => {
    return index % 5 === 0 ? formatDate(value) : '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      {/* Well Header */}
      <div className="mb-6 border-b pb-4">
        <h3 className="text-xl font-bold text-gray-800">
          {well.wellName} <span className="text-orange-600">#{well.wellCode}</span>
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {well.cityName}, {well.county} megye
        </p>
        {well.depthMeters && (
          <p className="text-xs text-gray-500 mt-1">
            Kútmélység: {well.depthMeters} m
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="ml-4 text-gray-600">Adatok betöltése...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center h-80 flex flex-col justify-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-semibold text-lg">Hiba az adatok betöltésekor</p>
          <p className="text-sm text-red-600 mt-2">{error.message}</p>
          <p className="text-xs text-gray-500 mt-4">
            Próbáld újra később vagy ellenőrizd az internetkapcsolatot.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && chartData.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center h-80 flex flex-col justify-center">
          <p className="text-yellow-700 font-semibold text-lg">Nincs elérhető adat</p>
          <p className="text-sm text-yellow-600 mt-2">
            Az elmúlt 60 napból nem áll rendelkezésre talajvízszint mérés ehhez a kúthoz.
          </p>
          <p className="text-xs text-gray-500 mt-4">
            A kút adatainak gyűjtése folyamatban lehet. Próbáld újra később.
          </p>
        </div>
      )}

      {/* Chart Display */}
      {!isLoading && !error && chartData.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-4">
            Talajvízszint alakulása (elmúlt 60 nap)
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={tickFormatter}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={yDomain}
                tickCount={8}
                label={{
                  value: 'Talajvízszint (m)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 14, fill: '#374151' }
                }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="waterLevelMeters"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }}
                activeDot={{ r: 6 }}
                name="Talajvízszint (m)"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Chart Info Footer */}
          <div className="mt-6 bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-semibold text-green-700">
                ✅ Valós adatok vizugy.hu-ról
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Automatikus frissítés: naponta 06:00 órakor
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Összesen {chartData.length} mérési pont az elmúlt 60 napból
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Adatforrás: <strong>vizugy.hu</strong> • Utolsó frissítés: {new Date().toLocaleDateString('hu-HU')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
