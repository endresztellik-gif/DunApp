/**
 * WaterDeficitCard Component
 *
 * Data card displaying water deficit index for the selected location.
 * No embedded selector - uses global location selector.
 */

import React from 'react';
import { TrendingDown } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import type { DroughtLocation, DroughtData } from '../../types';

interface WaterDeficitCardProps {
  selectedLocation: DroughtLocation | null;
  droughtData: DroughtData | null;
}

export const WaterDeficitCard: React.FC<WaterDeficitCardProps> = ({
  selectedLocation: _selectedLocation,
  droughtData,
}) => {
  // Water deficit from pattern endpoint (Dataset 6, 35cm depth)
  const waterDeficit: number | null = droughtData?.waterDeficitIndex ?? null;

  return (
    <DataCard
      icon={TrendingDown}
      label="Vízhiány"
      value={waterDeficit !== null ? waterDeficit.toFixed(1) : null}
      unit="mm"
      moduleColor="drought"
    >
      {/* Additional info */}
      {waterDeficit !== null && (
        <p className="text-xs text-gray-500">35 cm mélység</p>
      )}
    </DataCard>
  );
};
