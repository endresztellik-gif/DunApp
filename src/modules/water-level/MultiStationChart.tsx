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
import { useQueries } from '@tanstack/react-query';
import { EmptyState } from '../../components/UI/EmptyState';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { TrendingUp } from 'lucide-react';
import { fetchWaterLevelForecast } from '../../hooks/useWaterLevelForecast';
import type { WaterLevelStation, WaterLevelForecast } from '../../types';

interface MultiStationChartProps {
  stations: WaterLevelStation[];
}

// Station colors - design system values (cycled if there are more stations than colors)
const STATION_COLORS = ['#22a6b3', '#d4851c', '#1a5f7a']; // dun-wave-400, dun-amber-400, dun-current-600
const colorFor = (index: number) => STATION_COLORS[index % STATION_COLORS.length];

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
  // Fetch forecasts for any number of stations (Duna: 3, Dráva: 2 …) via useQueries,
  // since hook rules forbid calling useWaterLevelForecast in a loop.
  const forecastQueries = useQueries({
    queries: stations.map((station) => ({
      queryKey: ['waterLevelForecast', station.id],
      queryFn: () => fetchWaterLevelForecast(station.id),
      enabled: !!station.id,
      staleTime: 60 * 60 * 1000,
      refetchInterval: 60 * 60 * 1000,
      retry: 3,
    })),
  });

  const isLoading = forecastQueries.some((q) => q.isLoading);
  const hasError = forecastQueries.some((q) => q.error);

  if (stations.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        message="Nincs összehasonlítási adat"
        description="Legalább egy állomás adatai szükségesek a grafikon megjelenítéséhez"
      />
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Előrejelzések betöltése..." />;
  }

  if (hasError) {
    return (
      <div
        className="p-4"
        style={{ background: 'var(--status-warn-bg)', border: '0.5px solid var(--status-warn-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-warn-text)' }}
      >
        <p className="text-sm">
          Az előrejelzési adatok betöltése sikertelen. Próbáld újra később.
        </p>
      </div>
    );
  }

  // Aggregate forecast data (one entry per station, in order)
  const aggregatedForecasts = stations.map((station, index) => ({
    stationName: station.name,
    forecasts: forecastQueries[index].data ?? [],
  }));

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
      <div
        className="w-full p-4 h-[400px]"
        style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,95,122,.10)" />
            <XAxis
              dataKey="date"
              stroke="#7a9eaa"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#7a9eaa"
              style={{ fontSize: '12px' }}
              label={{ value: 'cm', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                border: '0.5px solid var(--border-default)',
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
                  stroke={colorFor(index)}
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
                  stroke={colorFor(index)}
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
                  stroke={colorFor(index)}
                  strokeWidth={2}
                  dot={{ fill: colorFor(index), r: 5 }}
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
            className="p-3"
            style={{ background: 'var(--bg-surface-alt)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colorFor(index) }}
              />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{station.name}</span>
            </div>
            <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
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
