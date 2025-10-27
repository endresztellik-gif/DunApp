/**
 * DataCard Component
 *
 * Reusable card component for displaying data values with icon, label, value, and unit.
 * Supports module-specific color schemes.
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
  children?: React.ReactNode; // For embedded dropdowns in drought module
}

export const DataCard: React.FC<DataCardProps> = ({
  icon: Icon,
  label,
  value,
  unit,
  moduleColor = 'meteorology',
  className = '',
  children,
}) => {
  // Module-specific icon colors
  const iconColorMap = {
    meteorology: 'text-cyan-600',
    water: 'text-cyan-500',
    drought: 'text-orange-600',
  };

  const iconColor = iconColorMap[moduleColor];

  // Format value for display
  const displayValue = value !== null && value !== undefined ? value : 'N/A';

  return (
    <div className={`data-card ${className}`} role="region" aria-labelledby={`card-${label}`}>
      {/* Header with icon and label */}
      <div className="data-card-header">
        <Icon className={`data-card-icon ${iconColor}`} aria-hidden="true" />
        <h3 id={`card-${label}`} className="data-card-label">
          {label}
        </h3>
      </div>

      {/* Optional children (e.g., dropdown selector) */}
      {children && <div className="mt-2">{children}</div>}

      {/* Value and unit */}
      <div className="mt-auto">
        <p className="data-card-value" aria-live="polite">
          {displayValue}
        </p>
        <p className="data-card-unit">{unit}</p>
      </div>
    </div>
  );
};
