/**
 * ForecastDataTable Component
 *
 * Displays 5-day forecast for all 3 stations in a consolidated table format.
 * Shows stations vertically with forecast values horizontally.
 *
 * Created: 2025-11-07
 * Purpose: Tabular view of forecast data below the comparison chart
 */

import React from 'react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { useWaterLevelForecast } from '../../hooks/useWaterLevelForecast';
import { useWaterLevelData } from '../../hooks/useWaterLevelData';
import type { WaterLevelStation } from '../../types';

interface ForecastDataTableProps {
  stations: WaterLevelStation[];
}

export const ForecastDataTable: React.FC<ForecastDataTableProps> = ({ stations }) => {
  // Fetch forecasts for all 3 stations
  const forecast1 = useWaterLevelForecast(stations[0]?.id || null);
  const forecast2 = useWaterLevelForecast(stations[1]?.id || null);
  const forecast3 = useWaterLevelForecast(stations[2]?.id || null);

  // Fetch current (today) water level for all 3 stations
  const current1 = useWaterLevelData(stations[0]?.id || null);
  const current2 = useWaterLevelData(stations[1]?.id || null);
  const current3 = useWaterLevelData(stations[2]?.id || null);

  // Check loading states
  const isLoading = forecast1.isLoading || forecast2.isLoading || forecast3.isLoading;

  // Check errors
  const hasError = forecast1.error || forecast2.error || forecast3.error;

  if (stations.length !== 3) {
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

  // Get forecast dates from first station
  const forecastDates = forecast1.forecasts.map(f => ({
    date: new Date(f.forecastDate),
    dateString: f.forecastDate
  }));

  // Helper to get forecast data for a station on a specific date
  const getForecastData = (forecasts: any[], dateString: string) => {
    const forecast = forecasts.find(f => f.forecastDate === dateString);
    if (!forecast) return null;

    const level = forecast.forecastedLevelCm;
    const uncertainty = forecast.uncertaintyCm || 0;

    return {
      level,
      uncertainty,
      min: level - uncertainty,
      max: level + uncertainty,
      hasUncertainty: uncertainty > 0
    };
  };

  // Station dot colors matching STATION_COLORS from MultiStationChart
  const stationDotColors = ['#22a6b3', '#d4851c', '#1a5f7a'];

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
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Állomás
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Ma
              </th>
              {forecastDates.map((fd, index) => (
                <th
                  key={fd.dateString}
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {index === 0 ? 'Holnap' :
                   index === 1 ? 'Holnapután' :
                   fd.date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'var(--bg-surface)' }}>
            {/* Nagybajcs */}
            <tr className="hover:bg-gray-50 transition-colors" style={{ borderTop: '0.5px solid var(--border-subtle)' }}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full mr-3" style={{ background: stationDotColors[0] }}></div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {stations[0].name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                {current1.waterLevelData?.waterLevelCm != null ? (
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
                    {current1.waterLevelData.waterLevelCm} cm
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                )}
              </td>
              {forecastDates.map(fd => {
                const data = getForecastData(forecast1.forecasts, fd.dateString);
                return (
                  <td key={fd.dateString} className="px-4 py-4 text-center">
                    {data ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
                          {data.level} cm
                        </span>
                        {data.hasUncertainty && (
                          <span className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {data.min}-{data.max} cm
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Baja */}
            <tr className="hover:bg-gray-50 transition-colors" style={{ borderTop: '0.5px solid var(--border-subtle)' }}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full mr-3" style={{ background: stationDotColors[1] }}></div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {stations[1].name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                {current2.waterLevelData?.waterLevelCm != null ? (
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
                    {current2.waterLevelData.waterLevelCm} cm
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                )}
              </td>
              {forecastDates.map(fd => {
                const data = getForecastData(forecast2.forecasts, fd.dateString);
                return (
                  <td key={fd.dateString} className="px-4 py-4 text-center">
                    {data ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
                          {data.level} cm
                        </span>
                        {data.hasUncertainty && (
                          <span className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {data.min}-{data.max} cm
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Mohács */}
            <tr className="hover:bg-gray-50 transition-colors" style={{ borderTop: '0.5px solid var(--border-subtle)' }}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full mr-3" style={{ background: stationDotColors[2] }}></div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {stations[2].name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                {current3.waterLevelData?.waterLevelCm != null ? (
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
                    {current3.waterLevelData.waterLevelCm} cm
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                )}
              </td>
              {forecastDates.map(fd => {
                const data = getForecastData(forecast3.forecasts, fd.dateString);
                return (
                  <td key={fd.dateString} className="px-4 py-4 text-center">
                    {data ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
                          {data.level} cm
                        </span>
                        {data.hasUncertainty && (
                          <span className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {data.min}-{data.max} cm
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked View */}
      <div className="md:hidden space-y-4 p-4">
        {stations.map((station, stationIndex) => {
          const stationForecasts = stationIndex === 0 ? forecast1.forecasts :
                                   stationIndex === 1 ? forecast2.forecasts :
                                   forecast3.forecasts;
          const currentData = stationIndex === 0 ? current1.waterLevelData :
                              stationIndex === 1 ? current2.waterLevelData :
                              current3.waterLevelData;

          return (
            <div
              key={station.id}
              className="p-4"
              style={{ border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
            >
              <div
                className="flex items-center mb-3 pb-3"
                style={{ borderBottom: '0.5px solid var(--border-default)' }}
              >
                <div className="h-3 w-3 rounded-full mr-2" style={{ background: stationDotColors[stationIndex] }}></div>
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
                {forecastDates.map((fd, index) => {
                  const data = getForecastData(stationForecasts, fd.dateString);
                  return (
                    <div key={fd.dateString} className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {index === 0 ? 'Holnap' :
                         index === 1 ? 'Holnapután' :
                         fd.date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                      </span>
                      {data ? (
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
                            {data.level} cm
                          </span>
                          {data.hasUncertainty && (
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {data.min}-{data.max} cm
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
