/**
 * GroundwaterLevelCard Component
 *
 * Data card with embedded WellSelector (SEPARATE from location selector!).
 * Displays groundwater level for the selected well.
 *
 * CRITICAL: This uses WellSelector, NOT DroughtLocationSelector!
 */

import React from 'react';
import { ArrowDown } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import { WellSelector } from '../../components/selectors/WellSelector';
import type { GroundwaterWell } from '../../types';

interface GroundwaterLevelCardProps {
  wells: GroundwaterWell[];
  selectedWell: GroundwaterWell | null;
  onWellChange: (well: GroundwaterWell) => void;
}

export const GroundwaterLevelCard: React.FC<GroundwaterLevelCardProps> = ({
  wells,
  selectedWell,
  onWellChange,
}) => {
  // Placeholder data (will be replaced with real data)
  const waterLevel: number | null = selectedWell ? 3.45 : null;

  return (
    <DataCard
      icon={ArrowDown}
      label="Talajvízszint"
      value={waterLevel !== null ? waterLevel.toFixed(2) : null}
      unit="m"
      moduleColor="drought"
    >
      {/* Embedded Well Selector - SEPARATE FROM LOCATION SELECTOR! */}
      <WellSelector
        wells={wells}
        selectedWell={selectedWell}
        onWellChange={onWellChange}
        className="w-full"
      />

      {/* Additional info */}
      {selectedWell && (
        <p className="text-xs text-gray-500 mt-2">
          Kút: {selectedWell.wellName} (#{selectedWell.wellCode})
        </p>
      )}
    </DataCard>
  );
};
