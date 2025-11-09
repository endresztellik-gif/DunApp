/**
 * DataCard Component
 *
 * Reusable card component for displaying data values with icon, label, value, and unit.
 * Supports module-specific color schemes.
 *
 * PERFORMANCE: Memoized to prevent unnecessary re-renders.
 * Used 9+ times across modules - high optimization impact.
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

export const DataCard = React.memo<DataCardProps>(({
  icon: Icon,
  label,
  value,
  unit,
  moduleColor = 'meteorology',
  className = '',
  children,
}) => {
  // Module-specific colors for icon background and border
  const colorMap = {
    meteorology: {
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      borderColor: 'border-cyan-200',
      accentColor: 'text-cyan-600',
    },
    water: {
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-500',
      borderColor: 'border-cyan-200',
      accentColor: 'text-cyan-500',
    },
    drought: {
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      accentColor: 'text-orange-600',
    },
  };

  const colors = colorMap[moduleColor];

  // Format value for display
  const displayValue = value !== null && value !== undefined ? value : 'N/A';

  return (
    <div
      className={`
        bg-white rounded-xl shadow-md border-2 ${colors.borderColor}
        p-6 min-h-[160px] transition-all duration-200
        hover:shadow-lg hover:scale-[1.02] flex flex-col
        ${className}
      `}
      role="region"
      aria-labelledby={`card-${label}`}
    >
      {/* Header with icon and label */}
      <div className="flex items-center gap-3 mb-4">
        {/* Icon with circular background */}
        <div className={`${colors.iconBg} rounded-full p-2.5 flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${colors.iconColor}`} aria-hidden="true" />
        </div>
        <h3 id={`card-${label}`} className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {label}
        </h3>
      </div>

      {/* Optional children (e.g., dropdown selector) */}
      {children && <div className="mb-3">{children}</div>}

      {/* Value and unit */}
      <div className="mt-auto">
        <p className={`text-4xl font-bold ${colors.accentColor} leading-none`} aria-live="polite">
          {displayValue}
        </p>
        <p className="text-base text-gray-500 font-medium mt-2">{unit}</p>
      </div>
    </div>
  );
});

DataCard.displayName = 'DataCard';
