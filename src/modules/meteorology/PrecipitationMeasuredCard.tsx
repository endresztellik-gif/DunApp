/**
 * PrecipitationMeasuredCard Component
 *
 * Mért (HungaroMet mérőállomás) vagy interpolált csapadék-összesítés:
 * - Elmúlt 7 nap, elmúlt 30 nap
 * - Tárgyév – mindig az adott év január 1-jétől
 *
 * A meglévő PrecipitationSummaryCard (Open-Meteo modell) MELLETT jelenik meg.
 * Adatforrás: Meteorológiai Adattár, HungaroMet Nonprofit Zrt.
 */

import React, { useState } from 'react';
import { Gauge, Calendar, CalendarDays, CalendarRange, RefreshCw, Info } from 'lucide-react';
import { usePrecipitationMeasured } from '../../hooks/usePrecipitationMeasured';

interface PrecipitationMeasuredCardProps {
  cityId: string | null;
}

const TITLE = 'Csapadék – mért adat';

const formatMm = (value: number | null): string => (value === null ? '–' : value.toFixed(1));
const formatKm = (value: number): string => value.toFixed(1).replace('.', ',');

const formatDay = (isoDate: string): string => {
  try {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
};

export const PrecipitationMeasuredCard = React.memo<PrecipitationMeasuredCardProps>(
  ({ cityId }) => {
    const { precipitationData, isLoading, error, refetch } = usePrecipitationMeasured(cityId);
    const [showInfo, setShowInfo] = useState(false);

    if (isLoading) {
      return (
        <div
          className="p-6"
          style={{
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <Gauge className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {TITLE}
            </h3>
          </div>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            <span className="ml-2" style={{ color: 'var(--text-tertiary)' }}>
              Betöltés...
            </span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div
          className="p-6"
          style={{
            background: 'var(--status-alert-bg)',
            border: '0.5px solid var(--status-alert-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <Gauge className="h-6 w-6" style={{ color: 'var(--status-alert-text)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--status-alert-text)' }}>
              {TITLE}
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--status-alert-text)' }}>
            Nem sikerült betölteni az adatokat.
          </p>
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
        <div
          className="p-6"
          style={{
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <Gauge className="h-6 w-6" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              {TITLE}
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {cityId
              ? 'Ehhez a településhez jelenleg nincs elég közeli, naponta frissülő mérőállomás.'
              : 'Nincs elérhető adat'}
          </p>
        </div>
      );
    }

    const data = precipitationData;
    const station = data.stations[0];
    const methodLine =
      data.method === 'station'
        ? `Mért adat: ${station?.name ?? 'mérőállomás'}${
            data.nearestKm !== null ? `, ${formatKm(data.nearestKm)} km` : ''
          }`
        : `Interpolált adat: ${data.stations.length} környező mérőállomás` +
          (data.nearestKm !== null ? ` (legközelebbi: ${formatKm(data.nearestKm)} km)` : '');

    const measuredDays = data.daysMeasuredYtd;
    const coverageLine =
      `Tárgyév: ${measuredDays} nap mért` +
      (data.daysModeledYtd > 0 ? `, ${data.daysModeledYtd} nap becsült (Open-Meteo)` : '') +
      ` a ${data.daysExpectedYtd} napból`;

    const tiles = [
      {
        label: 'Elmúlt 7 nap',
        value: data.last7Days,
        Icon: Calendar,
        note: data.daysAvailable7 < 7 ? `${data.daysAvailable7}/7 nap adata` : null,
      },
      {
        label: 'Elmúlt 30 nap',
        value: data.last30Days,
        Icon: CalendarDays,
        note: data.daysAvailable30 < 30 ? `${data.daysAvailable30}/30 nap adata` : null,
      },
      {
        label: 'Tárgyév (jan. 1-től)',
        value: data.yearToDate,
        Icon: CalendarRange,
        note: null,
      },
    ];

    return (
      <div className="dun-card p-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2" style={{ background: 'var(--accent-muted)', borderRadius: '50%' }}>
              <Gauge className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {TITLE}
            </h3>
            <button
              onClick={() => setShowInfo((v) => !v)}
              className="rounded-full p-1"
              style={{ color: showInfo ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
              aria-label="Adatforrás információ"
              aria-expanded={showInfo}
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Info */}
        {showInfo && (
          <div
            className="mb-4 rounded p-3 text-xs"
            style={{
              background: 'var(--bg-surface-alt)',
              color: 'var(--text-secondary)',
              border: '0.5px solid var(--border-subtle)',
            }}
          >
            Valódi csapadékmérő állomások napi adata (HungaroMet). A napi érték az előző nap
            06:45-től az adott nap 06:45-ig tartó időszakra vonatkozik. Ha a településen nincs
            mérőállomás, a környező állomások értékét a távolságukkal súlyozva átlagoljuk
            (interpoláció). A hiányzó nap nem számít 0 mm-nek.
          </div>
        )}

        {/* Data Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {tiles.map(({ label, value, Icon, note }) => (
            <div
              key={label}
              className="p-2 text-center sm:p-3"
              style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-md)' }}
            >
              <div className="mb-2 flex items-center justify-center">
                <Icon className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div
                className="text-xl font-bold sm:text-2xl"
                style={{ fontFamily: 'var(--font-data)', color: 'var(--text-data)' }}
              >
                {formatMm(value)}
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                mm
              </div>
              <div className="mt-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </div>
              {note && (
                <div className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Method + coverage */}
        <div className="mt-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-xs">{methodLine}</p>
          <p className="text-xs">{coverageLine}</p>
          <p className="text-xs">Utolsó mérési nap: {formatDay(data.dataThrough)}</p>
        </div>

        {/* Footer */}
        <div
          className="mt-4 flex items-center justify-between border-t pt-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Adatbázis: Meteorológiai Adattár, HungaroMet Nonprofit Zrt.
          </span>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--accent-primary)' }}
          >
            <RefreshCw className="h-3 w-3" />
            Frissítés
          </button>
        </div>
      </div>
    );
  }
);

PrecipitationMeasuredCard.displayName = 'PrecipitationMeasuredCard';
