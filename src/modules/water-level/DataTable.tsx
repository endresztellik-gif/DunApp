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
import { Table, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import type { WaterLevelStation, WaterLevelForecast } from '../../types';

interface DataTableProps {
  forecasts: WaterLevelForecast[];
  station: WaterLevelStation | null;
}

/**
 * Get trend icon based on level change
 */
const getTrendIcon = (current: number, previous: number | null) => {
  if (previous === null) return <Minus className="h-4 w-4 text-gray-400" />;
  const diff = current - previous;
  if (diff > 10) return <TrendingUp className="h-4 w-4 text-red-500" />;
  if (diff < -10) return <TrendingDown className="h-4 w-4 text-green-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
};

/**
 * Get level color based on station thresholds
 */
const getLevelColor = (level: number, station: WaterLevelStation | null): string => {
  if (!station) return 'text-gray-700';
  if (station.dangerLevelCm && level >= station.dangerLevelCm) return 'text-red-600';
  if (station.alertLevelCm && level >= station.alertLevelCm) return 'text-orange-600';
  if (station.highWaterLevelCm && level >= station.highWaterLevelCm) return 'text-yellow-600';
  return 'text-cyan-600';
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

  // Show alert if any forecast exceeds alert level
  const hasAlert = forecasts.some(
    f => station.alertLevelCm && f.forecastedLevelCm >= station.alertLevelCm
  );

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {hasAlert && station.alertLevelCm && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
          <div>
            <h4 className="text-sm font-semibold text-orange-900">Riasztási szint várható</h4>
            <p className="text-xs text-orange-700">
              Az előrejelzés szerint a vízállás eléri vagy meghaladja a{' '}
              {station.alertLevelCm} cm-es riasztási szintet.
            </p>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Dátum
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Előrejelzett Vízállás
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {forecasts.map((forecast, index) => {
              const previousLevel = index > 0 ? forecasts[index - 1].forecastedLevelCm : null;
              const levelColor = getLevelColor(forecast.forecastedLevelCm, station);

              return (
                <tr key={forecast.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(forecast.forecastDate).toLocaleDateString('hu-HU', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-sm font-semibold ${levelColor}`}>
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
            <div key={forecast.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  {new Date(forecast.forecastDate).toLocaleDateString('hu-HU', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </h4>
                {getTrendIcon(forecast.forecastedLevelCm, previousLevel)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Vízállás:</span>
                <span className={`text-lg font-bold ${levelColor}`}>
                  {forecast.forecastedLevelCm} cm
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reference Levels Footer */}
      {station && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Referenciaszintek
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {station.lowWaterLevelCm && (
              <div>
                <span className="text-gray-600">LNV:</span>{' '}
                <span className="font-semibold text-gray-900">{station.lowWaterLevelCm} cm</span>
              </div>
            )}
            {station.highWaterLevelCm && (
              <div>
                <span className="text-gray-600">KKV:</span>{' '}
                <span className="font-semibold text-gray-900">{station.highWaterLevelCm} cm</span>
              </div>
            )}
            {station.alertLevelCm && (
              <div>
                <span className="text-gray-600">Riasztási:</span>{' '}
                <span className="font-semibold text-orange-600">{station.alertLevelCm} cm</span>
              </div>
            )}
            {station.dangerLevelCm && (
              <div>
                <span className="text-gray-600">Veszély:</span>{' '}
                <span className="font-semibold text-red-600">{station.dangerLevelCm} cm</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
