/**
 * WaterDeficitCard Component
 *
 * Data card displaying water deficit index for the selected location.
 * No embedded selector - uses global location selector.
 */

import React from 'react';
import { TrendingDown } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import type { DroughtLocation } from '../../types';

interface WaterDeficitCardProps {
  selectedLocation: DroughtLocation | null;
}

export const WaterDeficitCard: React.FC<WaterDeficitCardProps> = ({
  selectedLocation,
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
    />
  );
};
