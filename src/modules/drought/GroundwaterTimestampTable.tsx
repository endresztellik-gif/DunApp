/**
 * GroundwaterTimestampTable Component
 *
 * Displays last measurement timestamp for all enabled groundwater wells.
 * Shows data freshness to help users understand when wells were last updated.
 *
 * Features:
 * - Desktop: Full table layout (4 columns)
 * - Mobile: Card view (stacked layout)
 * - Loading/Error/Empty states
 * - Hungarian date formatting
 * - Clock icon for timestamps
 *
 * Created: 2026-01-24
 */

import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useAllGroundwaterLastTimestamps } from '../../hooks/useAllGroundwaterLastTimestamps';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

/**
 * Format timestamp to Hungarian date/time format
 * Example: "2026. jan. 9. 18:33"
 */
function formatHungarianDateTime(timestamp: string | null): string {
  if (!timestamp) return 'Nincs adat';

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const months = ['jan.', 'feb.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}. ${month} ${day}. ${hours}:${minutes}`;
}

export const GroundwaterTimestampTable: React.FC = () => {
  const { timestamps, isLoading, error } = useAllGroundwaterLastTimestamps();

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg">
        <LoadingSpinner message="Utolsó mérési időpontok betöltése..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-semibold text-red-900 mb-1">
            Hiba az időpontok betöltésekor
          </h3>
          <p className="text-sm text-red-700">
            {error.message || 'Nem sikerült betölteni az utolsó mérési időpontokat.'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (timestamps.length === 0) {
    return (
      <div className="mt-6 p-6 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">
          Jelenleg nincs elérhető talajvízkút adat.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Section Title */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">
          Utolsó Mérési Időpontok
        </h3>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Kút neve
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Kód
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Település
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Utolsó mérés
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timestamps.map((timestamp) => (
              <tr key={timestamp.wellId} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {timestamp.wellName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-mono">
                  #{timestamp.wellCode}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {timestamp.cityName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {formatHungarianDateTime(timestamp.lastTimestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {timestamps.map((timestamp) => (
          <div
            key={timestamp.wellId}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Well Name + Code */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-gray-900">
                {timestamp.wellName}
              </span>
              <span className="text-sm text-orange-600 font-mono">
                #{timestamp.wellCode}
              </span>
            </div>

            {/* City Name */}
            <div className="text-sm text-gray-600 mb-2">
              {timestamp.cityName}
            </div>

            {/* Last Measurement */}
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Utolsó mérés:</span>
              <span>{formatHungarianDateTime(timestamp.lastTimestamp)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="mt-3 text-xs text-gray-500 italic">
        Az adatok 5 naponta automatikusan frissülnek. Egyes kutak adatai elavultak lehetnek a vizugy.hu adatforrás korlátozásai miatt.
      </div>
    </div>
  );
};
