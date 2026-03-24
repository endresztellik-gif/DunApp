/**
 * SunTimesCards Component
 *
 * Displays sunrise and sunset times for Budapest in a 2-column grid.
 * Data calculated client-side using SunCalc (no API calls).
 * Refreshes daily at midnight with 24-hour cache.
 *
 * Features:
 * - 24-hour time format (HH:MM)
 * - Hungarian labels ("Napkelte", "Napnyugta")
 * - Responsive layout (1 column mobile, 2 columns desktop)
 * - Loading state with skeleton loaders
 * - Reuses DataCard component for consistency
 */

import React from 'react';
import { Sunrise, Sunset } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import { useSunTimes } from '../../hooks/useSunTimes';

export const SunTimesCards = React.memo(() => {
  const { sunTimes, isLoading } = useSunTimes();

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

  // Show loading state during first render
  if (isLoading && !sunTimes) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Sunrise skeleton */}
        <div className="p-6 animate-pulse" style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11" style={{ background: 'var(--bg-surface-alt)', borderRadius: '50%' }}></div>
            <div className="h-4 w-20" style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)' }}></div>
          </div>
          <div className="h-10 w-16 mb-2" style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)' }}></div>
          <div className="h-4 w-24" style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)' }}></div>
        </div>

        {/* Sunset skeleton */}
        <div className="p-6 animate-pulse" style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11" style={{ background: 'var(--bg-surface-alt)', borderRadius: '50%' }}></div>
            <div className="h-4 w-20" style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)' }}></div>
          </div>
          <div className="h-10 w-16 mb-2" style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)' }}></div>
          <div className="h-4 w-24" style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)' }}></div>
        </div>
      </div>
    );
  }

  const sunriseTime = formatTime(sunTimes?.sunrise || null);
  const sunsetTime = formatTime(sunTimes?.sunset || null);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Sunrise Card */}
      <DataCard
        icon={Sunrise}
        label="Napkelte"
        value={sunriseTime}
        unit="Budapest"
        moduleColor="meteorology"
      />

      {/* Sunset Card */}
      <DataCard
        icon={Sunset}
        label="Napnyugta"
        value={sunsetTime}
        unit="Budapest"
        moduleColor="meteorology"
      />
    </div>
  );
});

SunTimesCards.displayName = 'SunTimesCards';
