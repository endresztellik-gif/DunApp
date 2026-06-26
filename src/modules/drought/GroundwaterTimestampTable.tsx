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
import type { GroundwaterWell } from '../../types';

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

interface GroundwaterTimestampTableProps {
  onWellSelect?: (wellId: string) => void;
  selectedWellId?: string | null;
  /**
   * Region-filtered wells to show. The underlying RPC returns ALL enabled wells
   * (both regions), so we restrict the table to the current region's wells by
   * well code. When omitted, all wells are shown (backwards-compatible).
   */
  wells?: GroundwaterWell[];
}

export const GroundwaterTimestampTable: React.FC<GroundwaterTimestampTableProps> = ({
  onWellSelect,
  selectedWellId,
  wells,
}) => {
  const { timestamps, isLoading, error } = useAllGroundwaterLastTimestamps();

  // Restrict to the current region's wells (RPC returns Duna + Dráva together).
  const visibleTimestamps = wells
    ? (() => {
        const allowed = new Set(wells.map((w) => w.wellCode));
        return timestamps.filter((t) => allowed.has(t.wellCode));
      })()
    : timestamps;

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-6 p-6" style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
        <LoadingSpinner message="Utolsó mérési időpontok betöltése..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-6 p-4 flex items-start gap-3" style={{ background: 'var(--status-alert-bg)', border: '1.5px solid var(--status-alert-border)', borderRadius: 'var(--radius-md)' }}>
        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-alert-text)' }} />
        <div>
          <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--status-alert-text)' }}>
            Hiba az időpontok betöltésekor
          </h3>
          <p className="text-sm" style={{ color: 'var(--status-alert-text)' }}>
            {error.message || 'Nem sikerült betölteni az utolsó mérési időpontokat.'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (visibleTimestamps.length === 0) {
    return (
      <div className="mt-6 p-6 text-center" style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
        <Clock className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>
          Jelenleg nincs elérhető talajvízkút adat.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Section Title */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Utolsó Mérési Időpontok
        </h3>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block overflow-x-auto rounded-lg" style={{ border: '0.5px solid var(--border-default)' }}>
        <table className="min-w-full">
          <thead style={{ background: 'var(--bg-surface-alt)', borderBottom: '0.5px solid var(--border-subtle)' }}>
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Kút neve
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Kód
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Település
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Utolsó mérés
              </th>
            </tr>
          </thead>
          <tbody style={{ background: 'var(--bg-surface)' }}>
            {visibleTimestamps.map((timestamp) => {
              const isSelected = selectedWellId === timestamp.wellId;
              return (
              <tr
                key={timestamp.wellId}
                className="transition-colors"
                style={{
                  borderTop: '0.5px solid var(--border-subtle)',
                  background: isSelected ? 'var(--accent-muted)' : undefined,
                }}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  {onWellSelect ? (
                    <button
                      onClick={() => onWellSelect(timestamp.wellId)}
                      style={{
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontWeight: isSelected ? 700 : undefined,
                        textDecoration: 'underline',
                        textDecorationColor: 'transparent',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.textDecorationColor = 'var(--accent-primary)')}
                      onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
                    >
                      {timestamp.wellName}
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-primary)' }}>{timestamp.wellName}</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--color-dun-amber-400)', fontFamily: 'var(--font-data)' }}>
                  #{timestamp.wellCode}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {timestamp.cityName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formatHungarianDateTime(timestamp.lastTimestamp)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {visibleTimestamps.map((timestamp) => {
          const isSelected = selectedWellId === timestamp.wellId;
          return (
          <div
            key={timestamp.wellId}
            className="dun-card p-4 transition-shadow"
            style={{
              background: isSelected ? 'var(--accent-muted)' : undefined,
              cursor: onWellSelect ? 'pointer' : undefined,
            }}
            onClick={onWellSelect ? () => onWellSelect(timestamp.wellId) : undefined}
            role={onWellSelect ? 'button' : undefined}
            tabIndex={onWellSelect ? 0 : undefined}
            onKeyDown={onWellSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') onWellSelect(timestamp.wellId); } : undefined}
          >
            {/* Well Name + Code */}
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-base font-semibold"
                style={{
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 700 : undefined,
                }}
              >
                {timestamp.wellName}
              </span>
              <span className="text-sm" style={{ color: 'var(--color-dun-amber-400)', fontFamily: 'var(--font-data)' }}>
                #{timestamp.wellCode}
              </span>
            </div>

            {/* City Name */}
            <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              {timestamp.cityName}
            </div>

            {/* Last Measurement */}
            <div className="flex items-center gap-2 text-sm px-3 py-2" style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
              <Clock className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              <span className="font-medium">Utolsó mérés:</span>
              <span>{formatHungarianDateTime(timestamp.lastTimestamp)}</span>
            </div>
          </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="mt-3 text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
        Az adatok 5 naponta automatikusan frissülnek. Egyes kutak adatai elavultak lehetnek a vizugy.hu adatforrás korlátozásai miatt.
      </div>
    </div>
  );
};
