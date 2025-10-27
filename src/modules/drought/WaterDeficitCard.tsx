/**
 * WaterDeficitCard Component
 *
 * Data card with embedded DroughtLocationSelector.
 * Displays water deficit index for the selected location.
 */

import React from 'react';
import { TrendingDown } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import { DroughtLocationSelector } from '../../components/selectors/DroughtLocationSelector';
import type { DroughtLocation } from '../../types';

interface WaterDeficitCardProps {
  locations: DroughtLocation[];
  selectedLocation: DroughtLocation | null;
  onLocationChange: (location: DroughtLocation) => void;
}

export const WaterDeficitCard: React.FC<WaterDeficitCardProps> = ({
  locations,
  selectedLocation,
  onLocationChange,
}) => {
  // Placeholder data (will be replaced with real data)
  const waterDeficit: number | null = selectedLocation ? 45.8 : null;

  return (
    <DataCard
      icon={TrendingDown}
      label="Vízhiány"
      value={waterDeficit !== null ? waterDeficit.toFixed(1) : null}
      unit="mm"
      moduleColor="drought"
    >
      {/* Embedded Selector */}
      <DroughtLocationSelector
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationChange={onLocationChange}
        className="w-full"
      />
    </DataCard>
  );
};
