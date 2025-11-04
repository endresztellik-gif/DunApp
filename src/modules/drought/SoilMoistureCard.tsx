/**
 * SoilMoistureCard Component
 *
 * Data card displaying soil moisture percentage for the selected location.
 * No embedded selector - uses global location selector.
 */

import React from 'react';
import { Droplet } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import type { DroughtLocation, DroughtData } from '../../types';

interface SoilMoistureCardProps {
  selectedLocation: DroughtLocation | null;
  droughtData: DroughtData | null;
}

export const SoilMoistureCard: React.FC<SoilMoistureCardProps> = ({
  selectedLocation,
  droughtData,
}) => {
  // Calculate average of all 6 soil moisture depths (10-100cm)
  const soilMoisture: number | null = React.useMemo(() => {
    if (!droughtData) return null;

    const values = [
      droughtData.soilMoisture10cm,
      droughtData.soilMoisture20cm,
      droughtData.soilMoisture30cm,
      droughtData.soilMoisture50cm,
      droughtData.soilMoisture70cm,
      droughtData.soilMoisture100cm,
    ].filter((val): val is number => val !== null);

    if (values.length === 0) return null;

    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }, [droughtData]);

  return (
    <DataCard
      icon={Droplet}
      label="Talajnedvesség"
      value={soilMoisture !== null ? soilMoisture.toFixed(1) : null}
      unit="%"
      moduleColor="drought"
    >
      {/* Additional info */}
      {soilMoisture !== null && (
        <p className="text-xs text-gray-500">Átlag (10-100 cm)</p>
      )}
    </DataCard>
  );
};
