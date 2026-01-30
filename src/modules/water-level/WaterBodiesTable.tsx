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
      <div className="flex items-start gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div>
          <h3 className="mb-1 text-base font-semibold text-red-900">
            Hiba a víztest adatok betöltésekor
          </h3>
          <p className="text-sm text-red-700">
            {error.message || 'Nem sikerült betölteni a víztest adatokat.'}
          </p>
        </div>
      </div>
    );
  }

  if (waterBodiesData.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
        <Droplets className="h-8 w-8 text-blue-600" />
        <div>
          <h3 className="text-base font-semibold text-blue-900">Nincs elérhető adat</h3>
          <p className="text-sm text-blue-700">
            Jelenleg nincs víztest adat az adatbázisban.
          </p>
        </div>
      </div>
    );
  }

  // Helper to format cell value with change
  const formatCellValue = (measurement: any) => {
    if (!measurement) {
      return <span className="text-sm text-gray-400">N/A</span>;
    }

    const value = measurement.value;
    const change = measurement.change;

    return (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-cyan-600">
          {value} cm
        </span>
        {change !== null && (
          <span className={`text-xs mt-0.5 ${
            change > 0 ? 'text-green-600' :
            change < 0 ? 'text-red-600' :
            'text-gray-500'
          }`}>
            ({change > 0 ? '+' : ''}{change} cm)
          </span>
        )}
      </div>
    );
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
                Víztest neve
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold text-cyan-900 uppercase tracking-wider"
              >
                Tegnapelőtt
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold text-cyan-900 uppercase tracking-wider"
              >
                Tegnap
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold text-cyan-900 uppercase tracking-wider"
              >
                Ma
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {waterBodiesData.map((waterBody, index) => {
              const color = index === 0 ? 'bg-cyan-500' :
                           index === 1 ? 'bg-teal-600' :
                           'bg-green-600';

              return (
                <tr key={waterBody.waterBodyId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full ${color} mr-3`}></div>
                      <span className="text-sm font-semibold text-gray-900">
                        {waterBody.waterBodyName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {formatCellValue(waterBody.dayBeforeYesterday)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {formatCellValue(waterBody.yesterday)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {formatCellValue(waterBody.today)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked View */}
      <div className="md:hidden space-y-4 p-4">
        {waterBodiesData.map((waterBody, index) => {
          const color = index === 0 ? 'bg-cyan-500' :
                       index === 1 ? 'bg-teal-600' :
                       'bg-green-600';

          return (
            <div key={waterBody.waterBodyId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3 pb-3 border-b border-gray-200">
                <div className={`h-3 w-3 rounded-full ${color} mr-2`}></div>
                <h4 className="text-sm font-semibold text-gray-900">
                  {waterBody.waterBodyName}
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Tegnapelőtt</span>
                  {formatCellValue(waterBody.dayBeforeYesterday)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Tegnap</span>
                  {formatCellValue(waterBody.yesterday)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Ma</span>
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
