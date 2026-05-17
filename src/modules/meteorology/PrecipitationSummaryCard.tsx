/**
 * PrecipitationSummaryCard Component
 *
 * Displays aggregated precipitation data:
 * - Last 7 days
 * - Last 30 days
 * - Year-to-date (YTD)
 *
 * Data source: Open-Meteo Historical API
 */

import React, { useState } from 'react';
import { CloudRain, Calendar, CalendarDays, CalendarRange, RefreshCw, Info } from 'lucide-react';
import { usePrecipitationSummary } from '../../hooks/usePrecipitationSummary';

interface PrecipitationSummaryCardProps {
  cityId: string | null;
}

export const PrecipitationSummaryCard = React.memo<PrecipitationSummaryCardProps>(({ cityId }) => {
  const { precipitationData, isLoading, error, refetch } = usePrecipitationSummary(cityId);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6" style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
        <div className="flex items-center gap-3 mb-4">
          <CloudRain className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Csapadék összesítés</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
          <span className="ml-2" style={{ color: 'var(--text-tertiary)' }}>Betöltés...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" style={{ background: 'var(--status-alert-bg)', border: '0.5px solid var(--status-alert-border)', borderRadius: 'var(--radius-lg)' }}>
        <div className="flex items-center gap-3 mb-4">
          <CloudRain className="h-6 w-6" style={{ color: 'var(--status-alert-text)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--status-alert-text)' }}>Csapadék összesítés</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--status-alert-text)' }}>Nem sikerült betölteni az adatokat.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 text-sm underline"
          style={{ color: 'var(--status-alert-text)' }}
        >
          Újrapróbálás
        </button>
      </div>
    );
  }

  if (!precipitationData) {
    return (
      <div className="p-6" style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
        <div className="flex items-center gap-3 mb-4">
          <CloudRain className="h-6 w-6" style={{ color: 'var(--text-tertiary)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-tertiary)' }}>Csapadék összesítés</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Nincs elérhető adat</p>
      </div>
    );
  }

  const formatValue = (value: number): string => {
    return value.toFixed(1);
  };

  // Format update time
  const formatUpdateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('hu-HU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="dun-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2" style={{ background: 'var(--accent-muted)', borderRadius: '50%' }}>
            <CloudRain className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Csapadék összesítés</h3>
          <button
            onClick={() => setShowDisclaimer(v => !v)}
            className="p-1 rounded-full"
            style={{ color: showDisclaimer ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
            title="Adatforrás információ"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
        {precipitationData.updatedAt && (
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {formatUpdateTime(precipitationData.updatedAt)}
          </span>
        )}
      </div>

      {/* Disclaimer */}
      {showDisclaimer && (
        <div className="mb-4 p-3 text-xs rounded" style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)', border: '0.5px solid var(--border-subtle)' }}>
          Közelítő, modell-alapú adat (Open-Meteo rácsháló, ~5 km felbontás). Lokális záporoknál a valódi mérésektől ±50%-os eltérés is lehetséges.
        </div>
      )}

      {/* Data Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Last 7 Days */}
        <div className="text-center p-3" style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-md)' }}>
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-data)', color: 'var(--text-data)' }}>
            {formatValue(precipitationData.last7Days)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>mm</div>
          <div className="text-xs font-medium mt-2" style={{ color: 'var(--text-secondary)' }}>Elmúlt 7 nap</div>
        </div>

        {/* Last 30 Days */}
        <div className="text-center p-3" style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-md)' }}>
          <div className="flex items-center justify-center mb-2">
            <CalendarDays className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-data)', color: 'var(--text-data)' }}>
            {formatValue(precipitationData.last30Days)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>mm</div>
          <div className="text-xs font-medium mt-2" style={{ color: 'var(--text-secondary)' }}>Elmúlt 30 nap</div>
        </div>

        {/* Year-to-Date */}
        <div className="text-center p-3" style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-md)' }}>
          <div className="flex items-center justify-center mb-2">
            <CalendarRange className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-data)', color: 'var(--text-data)' }}>
            {formatValue(precipitationData.yearToDate)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>mm</div>
          <div className="text-xs font-medium mt-2" style={{ color: 'var(--text-secondary)' }}>Tárgyév (YTD)</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Forrás: Open-Meteo Historical API</span>
        <button
          onClick={() => refetch()}
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--accent-primary)' }}
        >
          <RefreshCw className="h-3 w-3" />
          Frissítés
        </button>
      </div>
    </div>
  );
});

PrecipitationSummaryCard.displayName = 'PrecipitationSummaryCard';
