/**
 * DataTable Component
 *
 * Displays 5-day water level forecast for all 3 stations in a table format.
 * Responsive: stacks on mobile, side-by-side on desktop.
 */

import React from 'react';
import { EmptyState } from '../../components/UI/EmptyState';
import { Table } from 'lucide-react';
import type { WaterLevelStation } from '../../types';

interface DataTableProps {
  stations: WaterLevelStation[];
}

// Placeholder forecast data (will be replaced with real data)
const generateMockTableData = () => {
  const data = [];
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
      Szekszárd: Math.round(394 - i * 5),
      Passau: Math.round(378 + i * 11),
      Nagybajcs: Math.round(581 + i * 7),
    });
  }

  return data;
};

export const DataTable: React.FC<DataTableProps> = ({ stations }) => {
  const tableData = stations.length === 3 ? generateMockTableData() : [];

  if (stations.length !== 3 || tableData.length === 0) {
    return (
      <EmptyState
        icon={Table}
        message="Nincs táblázati adat"
        description="3 állomás adatai szükségesek a táblázat megjelenítéséhez"
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
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
              Szekszárd
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Passau
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Nagybajcs
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tableData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {row.date}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                <span className="font-semibold text-cyan-600">{row.Szekszárd} cm</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                <span className="font-semibold text-teal-600">{row.Passau} cm</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                <span className="font-semibold text-green-600">{row.Nagybajcs} cm</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile stacked view */}
      <div className="md:hidden p-4 space-y-4">
        {tableData.map((row, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">{row.date}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Szekszárd:</span>
                <span className="font-semibold text-cyan-600">{row.Szekszárd} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passau:</span>
                <span className="font-semibold text-teal-600">{row.Passau} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nagybajcs:</span>
                <span className="font-semibold text-green-600">{row.Nagybajcs} cm</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
