/**
 * MoonTimesCards Component
 *
 * Displays moon rise, set times, and phase for Budapest in a 3-column grid.
 * Data calculated client-side using SunCalc (no API calls).
 * Refreshes daily at midnight with 24-hour cache.
 *
 * Features:
 * - 24-hour time format (HH:MM)
 * - Hungarian labels ("Holdkelte", "Holdnyugta", "Holdfázis")
 * - Moon phase percentage and name
 * - Responsive layout (1 column mobile, 3 columns desktop)
 * - Loading state with skeleton loaders
 * - Reuses DataCard component for consistency
 */

import React from 'react';
import { Moon, MoonStar } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import { useMoonData } from '../../hooks/useMoonData';

export const MoonTimesCards = React.memo(() => {
  const { moonData, isLoading } = useMoonData();

  /**
   * Format time as HH:MM (24-hour format)
   *
   * Examples: "06:42", "16:30"
   * Locale: 'hu-HU' (Hungarian)
   * Returns: "N/A" if date is null or formatting fails
   */
  const formatTime = (date: Date | null): string => {
    if (!date) return 'N/A';
    try {
      return date.toLocaleTimeString('hu-HU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // 24-hour format (no AM/PM)
      });
    } catch {
      return 'N/A';
    }
  };

  /**
   * Format moon illumination as percentage
   *
   * Examples: "45%", "100%", "0%"
   * Returns: "N/A" if value is invalid
   */
  const formatIllumination = (fraction: number | null): string => {
    if (fraction === null || fraction === undefined) return 'N/A';
    return `${Math.round(fraction * 100)}%`;
  };

  // Show loading state during first render
  if (isLoading && !moonData) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Moonrise skeleton */}
        <div className="rounded-lg border-2 border-cyan-200 bg-white p-6 shadow-sm animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-cyan-100 rounded-full w-11 h-11"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>

        {/* Moonset skeleton */}
        <div className="rounded-lg border-2 border-cyan-200 bg-white p-6 shadow-sm animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-cyan-100 rounded-full w-11 h-11"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>

        {/* Moon phase skeleton */}
        <div className="rounded-lg border-2 border-cyan-200 bg-white p-6 shadow-sm animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-cyan-100 rounded-full w-11 h-11"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const moonriseTime = formatTime(moonData?.moonrise || null);
  const moonsetTime = formatTime(moonData?.moonset || null);
  const illumination = formatIllumination(moonData?.illumination || null);
  const phaseName = moonData?.phaseName || 'N/A';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Moonrise Card */}
      <DataCard
        icon={Moon}
        label="Holdkelte"
        value={moonriseTime}
        unit="Budapest"
        moduleColor="meteorology"
      />

      {/* Moonset Card */}
      <DataCard
        icon={Moon}
        label="Holdnyugta"
        value={moonsetTime}
        unit="Budapest"
        moduleColor="meteorology"
      />

      {/* Moon Phase Card */}
      <DataCard
        icon={MoonStar}
        label="Holdfázis"
        value={illumination}
        unit={phaseName}
        moduleColor="meteorology"
      />
    </div>
  );
});

MoonTimesCards.displayName = 'MoonTimesCards';
