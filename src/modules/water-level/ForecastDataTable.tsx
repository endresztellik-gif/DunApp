/**
 * ForecastDataTable Component
 *
 * Displays the 5-day forecast for the region's stations (Duna: 3, Dráva: 2, …) in a
 * consolidated table. Stations are listed vertically, forecast values horizontally.
 *
 * Created: 2025-11-07
 * Updated: 2026-06-23 — dynamic station count (useQueries) for the Dráva expansion.
 */

import React from 'react';
import { useQueries } from '@tanstack/react-query';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { fetchWaterLevelForecast } from '../../hooks/useWaterLevelForecast';
import { fetchWaterLevelData } from '../../hooks/useWaterLevelData';
import type { WaterLevelStation, WaterLevelForecast, WaterLevelData } from '../../types';

interface ForecastDataTableProps {
  stations: WaterLevelStation[];
}

// Station dot colors matching STATION_COLORS from MultiStationChart (cycled).
const STATION_DOT_COLORS = ['#22a6b3', '#d4851c', '#1a5f7a'];
const dotColor = (index: number) => STATION_DOT_COLORS[index % STATION_DOT_COLORS.length];

interface ForecastCell {
  level: number;
  uncertainty: number;
  min: number;
  max: number;
  hasUncertainty: boolean;
}

function getForecastData(forecasts: WaterLevelForecast[], dateString: string): ForecastCell | null {
  const forecast = forecasts.find((f) => f.forecastDate === dateString);
  if (!forecast) return null;
  const level = forecast.forecastedLevelCm;
  const uncertainty = forecast.uncertaintyCm || 0;
  return { level, uncertainty, min: level - uncertainty, max: level + uncertainty, hasUncertainty: uncertainty > 0 };
}

const columnLabel = (index: number, date: Date) =>
  index === 0 ? 'Holnap'
  : index === 1 ? 'Holnapután'
  : date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });

export const ForecastDataTable: React.FC<ForecastDataTableProps> = ({ stations }) => {
  // One forecast + one current-data query per station (hook-safe for a dynamic list).
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

  const currentQueries = useQueries({
    queries: stations.map((station) => ({
      queryKey: ['waterLevel', station.id],
      queryFn: () => fetchWaterLevelData(station.id),
      enabled: !!station.id,
      staleTime: 20 * 60 * 1000,
      refetchInterval: 20 * 60 * 1000,
      retry: 3,
    })),
  });

  const isLoading = forecastQueries.some((q) => q.isLoading);
  const hasError = forecastQueries.some((q) => q.error);

  if (stations.length === 0) {
    return null;
  }

  if (isLoading) {
    return <LoadingSpinner message="Előrejelzések betöltése..." />;
  }

  if (hasError) {
    return (
      <div
        className="flex items-start gap-3 p-4"
        style={{ background: 'var(--status-alert-bg)', border: '0.5px solid var(--status-alert-border)', borderRadius: 'var(--radius-md)' }}
      >
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: 'var(--status-alert-text)' }} />
        <div>
          <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--status-alert-text)' }}>
            Hiba az előrejelzések betöltésekor
          </h3>
          <p className="text-sm" style={{ color: 'var(--status-alert-text)' }}>
            Nem sikerült betölteni az előrejelzési adatokat.
          </p>
        </div>
      </div>
    );
  }

  const forecastsFor = (index: number): WaterLevelForecast[] => forecastQueries[index].data ?? [];
  const currentFor = (index: number): WaterLevelData | null =>
    currentQueries[index].data?.waterLevelData ?? null;

  // Forecast dates from the first station that has any forecast (stations can differ).
  const baseForecasts = stations.map((_, i) => forecastsFor(i)).find((f) => f.length > 0) ?? [];
  const forecastDates = baseForecasts.map((f) => ({ date: new Date(f.forecastDate), dateString: f.forecastDate }));

  const renderCell = (cell: ForecastCell | null) =>
    cell ? (
      <div className="flex flex-col">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
          {cell.level} cm
        </span>
        {cell.hasUncertainty && (
          <span className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {cell.min}-{cell.max} cm
          </span>
        )}
      </div>
    ) : (
      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
    );

  return (
    <div
      className="w-full overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}
    >
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead style={{ background: 'var(--bg-surface-alt)', borderBottom: '0.5px solid var(--border-subtle)' }}>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Állomás
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Ma
              </th>
              {forecastDates.map((fd, index) => (
                <th key={fd.dateString} scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  {columnLabel(index, fd.date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'var(--bg-surface)' }}>
            {stations.map((station, stationIndex) => {
              const stationForecasts = forecastsFor(stationIndex);
              const currentData = currentFor(stationIndex);
              return (
                <tr key={station.id} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '0.5px solid var(--border-subtle)' }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full mr-3" style={{ background: dotColor(stationIndex) }}></div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {station.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {currentData?.waterLevelCm != null ? (
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
                        {currentData.waterLevelCm} cm
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                    )}
                  </td>
                  {forecastDates.map((fd) => (
                    <td key={fd.dateString} className="px-4 py-4 text-center">
                      {renderCell(getForecastData(stationForecasts, fd.dateString))}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked View */}
      <div className="md:hidden space-y-4 p-4">
        {stations.map((station, stationIndex) => {
          const stationForecasts = forecastsFor(stationIndex);
          const currentData = currentFor(stationIndex);
          return (
            <div key={station.id} className="p-4" style={{ border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
              <div className="flex items-center mb-3 pb-3" style={{ borderBottom: '0.5px solid var(--border-default)' }}>
                <div className="h-3 w-3 rounded-full mr-2" style={{ background: dotColor(stationIndex) }}></div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{station.name}</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ma</span>
                  {currentData?.waterLevelCm != null ? (
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
                      {currentData.waterLevelCm} cm
                    </span>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                  )}
                </div>
                {forecastDates.map((fd, index) => (
                  <div key={fd.dateString} className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {columnLabel(index, fd.date)}
                    </span>
                    <div className="flex flex-col items-end">
                      {renderCell(getForecastData(stationForecasts, fd.dateString))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
