/**
 * PrecipitationSummaryCard Component
 *
 * Displays aggregated precipitation data:
 * - Last 7 days
 * - Last 30 days
 * - Year-to-date (YTD)
 *
 * Data source: Open-Meteo Historical API
 */

import React from 'react';
import { CloudRain, Calendar, CalendarDays, CalendarRange, RefreshCw } from 'lucide-react';
import { usePrecipitationSummary } from '../../hooks/usePrecipitationSummary';

interface PrecipitationSummaryCardProps {
  cityId: string | null;
}

export const PrecipitationSummaryCard = React.memo<PrecipitationSummaryCardProps>(({ cityId }) => {
  const { precipitationData, isLoading, error, refetch } = usePrecipitationSummary(cityId);

  if (isLoading) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <CloudRain className="h-6 w-6 text-cyan-600" />
          <h3 className="text-lg font-semibold text-gray-900">Csapadék összesítés</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-500">Betöltés...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <CloudRain className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Csapadék összesítés</h3>
        </div>
        <p className="text-sm text-red-700">Nem sikerült betölteni az adatokat.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Újrapróbálás
        </button>
      </div>
    );
  }

  if (!precipitationData) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <CloudRain className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-500">Csapadék összesítés</h3>
        </div>
        <p className="text-sm text-gray-500">Nincs elérhető adat</p>
      </div>
    );
  }

  const formatValue = (value: number): string => {
    return value.toFixed(1);
  };

  // Format update time
  const formatUpdateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('hu-HU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="rounded-lg border-2 border-cyan-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-cyan-100 p-2">
            <CloudRain className="h-6 w-6 text-cyan-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Csapadék összesítés</h3>
        </div>
        {precipitationData.updatedAt && (
          <span className="text-xs text-gray-400">
            {formatUpdateTime(precipitationData.updatedAt)}
          </span>
        )}
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Last 7 Days */}
        <div className="text-center p-3 rounded-lg bg-cyan-50">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-5 w-5 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-cyan-700">
            {formatValue(precipitationData.last7Days)}
          </div>
          <div className="text-xs text-gray-500 mt-1">mm</div>
          <div className="text-xs font-medium text-gray-600 mt-2">Elmúlt 7 nap</div>
        </div>

        {/* Last 30 Days */}
        <div className="text-center p-3 rounded-lg bg-cyan-50">
          <div className="flex items-center justify-center mb-2">
            <CalendarDays className="h-5 w-5 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-cyan-700">
            {formatValue(precipitationData.last30Days)}
          </div>
          <div className="text-xs text-gray-500 mt-1">mm</div>
          <div className="text-xs font-medium text-gray-600 mt-2">Elmúlt 30 nap</div>
        </div>

        {/* Year-to-Date */}
        <div className="text-center p-3 rounded-lg bg-cyan-50">
          <div className="flex items-center justify-center mb-2">
            <CalendarRange className="h-5 w-5 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-cyan-700">
            {formatValue(precipitationData.yearToDate)}
          </div>
          <div className="text-xs text-gray-500 mt-1">mm</div>
          <div className="text-xs font-medium text-gray-600 mt-2">Tárgyév (YTD)</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">Forrás: Open-Meteo Historical API</span>
        <button
          onClick={() => refetch()}
          className="text-xs text-cyan-600 hover:text-cyan-800 flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Frissítés
        </button>
      </div>
    </div>
  );
});

PrecipitationSummaryCard.displayName = 'PrecipitationSummaryCard';
