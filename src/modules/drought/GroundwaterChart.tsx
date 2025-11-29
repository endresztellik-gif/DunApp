/**
 * GroundwaterChart Component - REAL DATA MODE ✅
 *
 * Displays 365-day water level trend for a selected groundwater well.
 * Uses 5-day sampling to show ~73 data points for optimal trend visualization.
 * Uses Recharts for visualization with responsive design.
 *
 * ✅ NOW USING REAL DATA FROM SUPABASE (2025-11-06)
 * Data scraped daily from vizugy.hu (3,288+ measurements from 15 wells)
 *
 * Features:
 * - 365-day historical trend with 5-day sampling
 * - Line chart showing water level over time
 * - Tooltip with formatted dates and values
 * - Loading state with spinner
 * - Empty state when no data available
 * - Well metadata display (name, code, location)
 * - Real-time data from Supabase (hourly cache)
 * - ~73 data points for optimal performance and readability
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

  // Transform data for Recharts with 5-day sampling
  // This reduces ~365 data points to ~73 points for better visualization
  // IMPORTANT: Display values as NEGATIVE because higher value = deeper water
  // This makes the chart intuitive: deeper water appears lower on the chart
  const allData = timeseriesData.map((point) => ({
    timestamp: point.timestamp,
    dateLabel: formatDate(point.timestamp),
    waterLevelMeters: point.waterLevelMeters,
    displayLevel: point.waterLevelMeters !== null ? -point.waterLevelMeters : null, // NEGATIVE for display
    waterLevelMasl: point.waterLevelMasl,
    waterTemperature: point.waterTemperature
  }));

  // Sample every 5th day for optimal trend visualization
  const chartData = allData.filter((_, index) => index % 5 === 0);

  // Calculate Y-axis domain for NEGATIVE values
  // Deeper water (larger positive value) = more negative display value = lower on chart
  const displayLevels = chartData.map((d) => d.displayLevel).filter((v): v is number => v !== null);
  const minDisplayLevel = Math.min(...displayLevels); // Most negative (deepest)
  const maxDisplayLevel = Math.max(...displayLevels); // Least negative (shallowest)
  const range = maxDisplayLevel - minDisplayLevel;

  // Add padding: 30% of range or minimum 0.5m (50cm)
  const padding = Math.max(range * 0.3, 0.5);
  const yDomain = [
    Math.floor((minDisplayLevel - padding) * 10) / 10, // Most negative (bottom)
    Math.ceil((maxDisplayLevel + padding) * 10) / 10   // Least negative (top)
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
            Mélység: {data.displayLevel?.toFixed(2)} m
          </p>
          <p className="text-xs text-gray-500">
            ({Math.abs(data.displayLevel || 0).toFixed(2)} m a felszín alatt)
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

  // Show only every 10th date label to avoid crowding (since we already sample every 5 days)
  // ~73 points / 10 = ~7-8 labels on X-axis
  const tickFormatter = (value: string, index: number) => {
    return index % 10 === 0 ? formatDate(value) : '';
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

      {/* Loading State - same min-height as chart to prevent layout shift */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="ml-4 text-gray-600">Adatok betöltése...</p>
        </div>
      )}

      {/* Error State - same min-height as chart to prevent layout shift */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center min-h-[500px] flex flex-col justify-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-semibold text-lg">Hiba az adatok betöltésekor</p>
          <p className="text-sm text-red-600 mt-2">{error.message}</p>
          <p className="text-xs text-gray-500 mt-4">
            Próbáld újra később vagy ellenőrizd az internetkapcsolatot.
          </p>
        </div>
      )}

      {/* Empty State - same min-height as chart to prevent layout shift */}
      {!isLoading && !error && chartData.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center min-h-[500px] flex flex-col justify-center">
          <p className="text-yellow-700 font-semibold text-lg">Nincs elérhető adat</p>
          <p className="text-sm text-yellow-600 mt-2">
            Az elmúlt 365 napból nem áll rendelkezésre talajvízszint mérés ehhez a kúthoz.
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
            Talajvízszint alakulása (elmúlt 365 nap, 5 napos mintavétel)
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
                  value: 'Mélység a felszíntől (m)',
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
                dataKey="displayLevel"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }}
                activeDot={{ r: 6 }}
                name="Mélység (m)"
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
              {chartData.length} adatpont (5 napos mintavétel, ~{Math.round(chartData.length * 5)} nap lefedve)
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
