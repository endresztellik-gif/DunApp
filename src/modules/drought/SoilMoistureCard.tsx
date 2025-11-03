/**
 * SoilMoistureCard Component
 *
 * Data card displaying soil moisture percentage for the selected location.
 * No embedded selector - uses global location selector.
 */

import React from 'react';
import { Droplet } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import type { DroughtLocation } from '../../types';

interface SoilMoistureCardProps {
  selectedLocation: DroughtLocation | null;
}

export const SoilMoistureCard: React.FC<SoilMoistureCardProps> = ({
  selectedLocation,
}) => {
  // Placeholder data (will be replaced with real data)
  // Average of multiple soil depths (10cm, 20cm, 30cm, etc.)
  const soilMoisture: number | null = selectedLocation ? 32.5 : null;

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
