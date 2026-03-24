/**
 * DataCard Component — Redesign v2
 *
 * Reusable card with dun-card + IBM Plex Mono értékek.
 * LucideIcon prop interface VÁLTOZATLAN (visszafelé kompatibilitás).
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DataCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number | null;
  unit: string;
  moduleColor?: 'meteorology' | 'water' | 'drought';
  className?: string;
  children?: React.ReactNode;
}

export const DataCard = React.memo<DataCardProps>(({
  icon: IconComponent,
  label,
  value,
  unit,
  moduleColor = 'meteorology',
  className = '',
  children,
}) => {
  const accentColorMap = {
    meteorology: 'var(--color-dun-wave-400)',
    water: 'var(--color-dun-current-600)',
    drought: 'var(--color-dun-amber-400)',
  };
  const accentColor = accentColorMap[moduleColor];
  const displayValue = value !== null && value !== undefined ? value : '–';

  return (
    <div
      className={`dun-card ${className}`}
      role="region"
      aria-labelledby={`card-${label}`}
    >
      {/* Header */}
      <div className="dun-card-header">
        <IconComponent
          size={20}
          aria-hidden
          style={{ color: accentColor, flexShrink: 0 }}
        />
        <span
          id={`card-${label}`}
          className="dun-module-label"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {label}
        </span>
      </div>

      {/* Body */}
      <div className="dun-card-body">
        {children && <div className="mb-3">{children}</div>}
        <div className="mt-auto">
          <p
            className="dun-value"
            style={{ color: 'var(--text-primary)' }}
            aria-live="polite"
          >
            {displayValue}
            <span className="dun-value-unit">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
});

DataCard.displayName = 'DataCard';
