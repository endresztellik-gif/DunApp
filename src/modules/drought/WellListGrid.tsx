/**
 * WellListGrid Component
 *
 * Displays all 15 groundwater wells in a 3-column grid.
 * Clicking a well card selects that well.
 */

import React from 'react';
import { EmptyState } from '../../components/UI/EmptyState';
import { Grid } from 'lucide-react';
import type { GroundwaterWell } from '../../types';

interface WellListGridProps {
  wells: GroundwaterWell[];
  selectedWell: GroundwaterWell | null;
  onWellSelect: (well: GroundwaterWell) => void;
}

export const WellListGrid: React.FC<WellListGridProps> = ({
  wells,
  selectedWell,
  onWellSelect,
}) => {
  if (wells.length === 0) {
    return (
      <EmptyState
        icon={Grid}
        message="Nincs talajvízkút adat"
        description="15 talajvízkút adatai szükségesek a lista megjelenítéséhez"
      />
    );
  }

  return (
    <div className="grid-well-list">
      {wells.map((well) => {
        const isSelected = selectedWell?.id === well.id;

        return (
          <button
            key={well.id}
            onClick={() => onWellSelect(well)}
            className={`well-card ${
              isSelected ? 'border-orange-500 bg-orange-50' : ''
            }`}
            aria-label={`${well.wellName} kút kiválasztása`}
            aria-pressed={isSelected}
          >
            <h4 className="well-card-name">{well.wellName}</h4>
            <p className="well-card-code">#{well.wellCode}</p>
            <p className="text-xs text-gray-600 mt-1">{well.cityName}</p>
            {well.county && (
              <p className="text-xs text-gray-500">{well.county} megye</p>
            )}
          </button>
        );
      })}
    </div>
  );
};
