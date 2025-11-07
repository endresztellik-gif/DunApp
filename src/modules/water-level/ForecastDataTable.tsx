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
import type { WaterLevelStation } from '../../types';

interface ForecastDataTableProps {
  stations: WaterLevelStation[];
}

export const ForecastDataTable: React.FC<ForecastDataTableProps> = ({ stations }) => {
  // Fetch forecasts for all 3 stations
  const forecast1 = useWaterLevelForecast(stations[0]?.id || null);
  const forecast2 = useWaterLevelForecast(stations[1]?.id || null);
  const forecast3 = useWaterLevelForecast(stations[2]?.id || null);

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
      <div className="flex items-start gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div>
          <h3 className="mb-1 text-base font-semibold text-red-900">
            Hiba az előrejelzések betöltésekor
          </h3>
          <p className="text-sm text-red-700">
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

  // Helper to get forecast value for a station on a specific date
  const getForecastValue = (forecasts: any[], dateString: string): number | null => {
    const forecast = forecasts.find(f => f.forecastDate === dateString);
    return forecast ? forecast.forecastedLevelCm : null;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-cyan-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-cyan-900 uppercase tracking-wider"
              >
                Állomás
              </th>
              {forecastDates.map((fd, index) => (
                <th
                  key={fd.dateString}
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-semibold text-cyan-900 uppercase tracking-wider"
                >
                  {index === 0 ? 'Holnap' :
                   index === 1 ? 'Holnapután' :
                   fd.date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Nagybajcs */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-cyan-500 mr-3"></div>
                  <span className="text-sm font-semibold text-gray-900">
                    {stations[0].name}
                  </span>
                </div>
              </td>
              {forecastDates.map(fd => {
                const value = getForecastValue(forecast1.forecasts, fd.dateString);
                return (
                  <td key={fd.dateString} className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-cyan-600">
                      {value !== null ? `${value} cm` : 'N/A'}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Baja */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-teal-600 mr-3"></div>
                  <span className="text-sm font-semibold text-gray-900">
                    {stations[1].name}
                  </span>
                </div>
              </td>
              {forecastDates.map(fd => {
                const value = getForecastValue(forecast2.forecasts, fd.dateString);
                return (
                  <td key={fd.dateString} className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-cyan-600">
                      {value !== null ? `${value} cm` : 'N/A'}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Mohács */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-600 mr-3"></div>
                  <span className="text-sm font-semibold text-gray-900">
                    {stations[2].name}
                  </span>
                </div>
              </td>
              {forecastDates.map(fd => {
                const value = getForecastValue(forecast3.forecasts, fd.dateString);
                return (
                  <td key={fd.dateString} className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-cyan-600">
                      {value !== null ? `${value} cm` : 'N/A'}
                    </span>
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
          const color = stationIndex === 0 ? 'bg-cyan-500' :
                       stationIndex === 1 ? 'bg-teal-600' :
                       'bg-green-600';

          return (
            <div key={station.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3 pb-3 border-b border-gray-200">
                <div className={`h-3 w-3 rounded-full ${color} mr-2`}></div>
                <h4 className="text-sm font-semibold text-gray-900">{station.name}</h4>
              </div>
              <div className="space-y-2">
                {forecastDates.map((fd, index) => {
                  const value = getForecastValue(stationForecasts, fd.dateString);
                  return (
                    <div key={fd.dateString} className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        {index === 0 ? 'Holnap' :
                         index === 1 ? 'Holnapután' :
                         fd.date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-sm font-semibold text-cyan-600">
                        {value !== null ? `${value} cm` : 'N/A'}
                      </span>
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
