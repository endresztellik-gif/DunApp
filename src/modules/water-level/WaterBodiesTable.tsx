/**
 * WaterBodiesTable Component
 *
 * Displays 3-day water level data for water bodies (Kadia, FTCS, Belső-Béda).
 * Shows value + change from previous day in parentheses (e.g., "234 cm (+2)").
 *
 * Created: 2026-01-30
 * Purpose: Daily water level tracking for lake/wetland water bodies
 */

import React from 'react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { AlertCircle, Droplets } from 'lucide-react';
import { useWaterBodiesThreeDayData } from '../../hooks/useWaterBodiesThreeDayData';

export const WaterBodiesTable: React.FC = () => {
  const { waterBodiesData, isLoading, error } = useWaterBodiesThreeDayData();

  if (isLoading) {
    return <LoadingSpinner message="Víztest adatok betöltése..." />;
  }

  if (error) {
    return (
      <div
        className="flex items-start gap-3 p-4"
        style={{
          background: 'var(--status-alert-bg)',
          border: '0.5px solid var(--status-alert-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <AlertCircle
          className="mt-0.5 h-5 w-5 flex-shrink-0"
          style={{ color: 'var(--status-alert-text)' }}
        />
        <div>
          <h3
            className="mb-1 text-base font-semibold"
            style={{ color: 'var(--status-alert-text)' }}
          >
            Hiba a víztest adatok betöltésekor
          </h3>
          <p className="text-sm" style={{ color: 'var(--status-alert-text)' }}>
            {error.message || 'Nem sikerült betölteni a víztest adatokat.'}
          </p>
        </div>
      </div>
    );
  }

  if (waterBodiesData.length === 0) {
    return (
      <div
        className="flex items-center gap-3 p-6"
        style={{
          background: 'var(--bg-surface)',
          border: '0.5px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <Droplets className="h-8 w-8" style={{ color: 'var(--accent-primary)' }} />
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Nincs elérhető adat
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Jelenleg nincs víztest adat az adatbázisban.
          </p>
        </div>
      </div>
    );
  }

  // Station dot colors matching STATION_COLORS from MultiStationChart
  const stationDotColors = ['#22a6b3', '#d4851c', '#1a5f7a'];

  // Helper to format cell value with change
  const formatCellValue = (measurement: any) => {
    if (!measurement) {
      return (
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          N/A
        </span>
      );
    }

    const value = measurement.value;
    const change = measurement.change;

    return (
      <div className="flex flex-col">
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}
        >
          {value} cm
        </span>
        {change !== null && (
          <span
            className="mt-0.5 text-xs"
            style={{
              color:
                change > 0
                  ? 'var(--color-dun-ok-500)'
                  : change < 0
                    ? 'var(--status-alert-text)'
                    : 'var(--text-tertiary)',
            }}
          >
            ({change > 0 ? '+' : ''}
            {change} cm)
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '0.5px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full">
          <thead
            style={{
              background: 'var(--bg-surface-alt)',
              borderBottom: '0.5px solid var(--border-subtle)',
            }}
          >
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                Víztest neve
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                Tegnapelőtt
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                Tegnap
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                Ma
              </th>
            </tr>
          </thead>
          <tbody style={{ background: 'var(--bg-surface)' }}>
            {waterBodiesData.map((waterBody, index) => {
              return (
                <tr
                  key={waterBody.waterBodyId}
                  className="transition-colors hover:bg-gray-50"
                  style={{ borderTop: '0.5px solid var(--border-subtle)' }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="mr-3 h-3 w-3 rounded-full"
                        style={{ background: stationDotColors[index] || stationDotColors[2] }}
                      ></div>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {waterBody.waterBodyName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {formatCellValue(waterBody.dayBeforeYesterday)}
                  </td>
                  <td className="px-4 py-4 text-center">{formatCellValue(waterBody.yesterday)}</td>
                  <td className="px-4 py-4 text-center">{formatCellValue(waterBody.today)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked View */}
      <div className="space-y-4 p-4 md:hidden">
        {waterBodiesData.map((waterBody, index) => {
          return (
            <div
              key={waterBody.waterBodyId}
              className="p-4"
              style={{
                border: '0.5px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                className="mb-3 flex items-center pb-3"
                style={{ borderBottom: '0.5px solid var(--border-default)' }}
              >
                <div
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{ background: stationDotColors[index] || stationDotColors[2] }}
                ></div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {waterBody.waterBodyName}
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Tegnapelőtt
                  </span>
                  {formatCellValue(waterBody.dayBeforeYesterday)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Tegnap
                  </span>
                  {formatCellValue(waterBody.yesterday)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Ma
                  </span>
                  {formatCellValue(waterBody.today)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
