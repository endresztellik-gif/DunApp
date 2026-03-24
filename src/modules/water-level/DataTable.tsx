/**
 * DataTable Component
 *
 * Displays 5-day water level forecast for a selected station in a table format.
 * Updated: 2025-11-03 (Phase 4.5c)
 * Uses real forecast data from useWaterLevelForecast() hook
 *
 * Responsive: stacks on mobile, side-by-side on desktop.
 */

import React from 'react';
import { EmptyState } from '../../components/UI/EmptyState';
import { Table, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { WaterLevelStation, WaterLevelForecast } from '../../types';

interface DataTableProps {
  forecasts: WaterLevelForecast[];
  station: WaterLevelStation | null;
}

/**
 * Get trend icon based on level change
 */
const getTrendIcon = (current: number, previous: number | null) => {
  if (previous === null) return <Minus className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />;
  const diff = current - previous;
  if (diff > 10) return <TrendingUp className="h-4 w-4" style={{ color: 'var(--status-alert-text)' }} />;
  if (diff < -10) return <TrendingDown className="h-4 w-4" style={{ color: 'var(--color-dun-ok-500)' }} />;
  return <Minus className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />;
};

/**
 * Get level color based on station thresholds
 */
const getLevelColor = (level: number, station: WaterLevelStation | null): React.CSSProperties => {
  if (!station) return { color: 'var(--text-data)', fontFamily: 'var(--font-data)' };
  if (station.dangerLevelCm && level >= station.dangerLevelCm) return { color: 'var(--status-alert-text)', fontFamily: 'var(--font-data)' };
  if (station.alertLevelCm && level >= station.alertLevelCm) return { color: 'var(--color-dun-amber-400)', fontFamily: 'var(--font-data)' };
  if (station.highWaterLevelCm && level >= station.highWaterLevelCm) return { color: 'var(--color-dun-amber-200)', fontFamily: 'var(--font-data)' };
  return { color: 'var(--text-data)', fontFamily: 'var(--font-data)' };
};

export const DataTable: React.FC<DataTableProps> = ({ forecasts, station }) => {
  if (forecasts.length === 0 || !station) {
    return (
      <EmptyState
        icon={Table}
        message="Nincs előrejelzési adat"
        description="Jelenleg nincs elérhető 5 napos előrejelzés ehhez az állomáshoz."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div
        className="hidden md:block overflow-x-auto"
        style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}
      >
        <table className="min-w-full">
          <thead style={{ background: 'var(--bg-surface-alt)', borderBottom: '0.5px solid var(--border-subtle)' }}>
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Dátum
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Előrejelzett Vízállás
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Trend
              </th>
            </tr>
          </thead>
          <tbody style={{ background: 'var(--bg-surface)' }}>
            {forecasts.map((forecast, index) => {
              const previousLevel = index > 0 ? forecasts[index - 1].forecastedLevelCm : null;
              const levelColor = getLevelColor(forecast.forecastedLevelCm, station);

              return (
                <tr key={forecast.id} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '0.5px solid var(--border-subtle)' }}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {new Date(forecast.forecastDate).toLocaleDateString('hu-HU', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold" style={levelColor}>
                      {forecast.forecastedLevelCm} cm
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getTrendIcon(forecast.forecastedLevelCm, previousLevel)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked View */}
      <div className="md:hidden space-y-3">
        {forecasts.map((forecast, index) => {
          const previousLevel = index > 0 ? forecasts[index - 1].forecastedLevelCm : null;
          const levelColor = getLevelColor(forecast.forecastedLevelCm, station);

          return (
            <div
              key={forecast.id}
              className="p-4"
              style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {new Date(forecast.forecastDate).toLocaleDateString('hu-HU', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </h4>
                {getTrendIcon(forecast.forecastedLevelCm, previousLevel)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Vízállás:</span>
                <span className="text-lg font-bold" style={levelColor}>
                  {forecast.forecastedLevelCm} cm
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
