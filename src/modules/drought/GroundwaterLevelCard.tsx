/**
 * GroundwaterLevelCard Component
 *
 * Data card with embedded WellSelector (SEPARATE from location selector!).
 * Displays groundwater level for the selected well.
 *
 * CRITICAL: This uses WellSelector, NOT DroughtLocationSelector!
 *
 * NOTE: Currently uses placeholder data due to lack of VízÜgy API.
 * TODO: Implement fetch-groundwater Edge Function when API available.
 */

import React from 'react';
import { ArrowDown } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import { WellSelector } from '../../components/selectors/WellSelector';
import { useGroundwaterData } from '../../hooks/useGroundwaterData';
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
  // Fetch groundwater data using hook (currently no data in DB)
  const { groundwaterData } = useGroundwaterData(selectedWell?.id || null);

  // Use real data if available, otherwise placeholder
  const waterLevel: number | null =
    groundwaterData?.waterLevelMeters ??
    (selectedWell ? 3.45 : null); // Placeholder until VízÜgy API available

  // Display as NEGATIVE value (deeper water = more negative)
  // This makes it intuitive: -5m means 5 meters below ground surface
  const displayValue: string | null =
    waterLevel !== null ? (-waterLevel).toFixed(2) : null;

  return (
    <DataCard
      icon={ArrowDown}
      label="Talajvízszint"
      value={displayValue}
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
