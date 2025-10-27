/**
 * SoilMoistureCard Component
 *
 * Data card with embedded DroughtLocationSelector.
 * Displays soil moisture percentage for the selected location.
 */

import React from 'react';
import { Droplet } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import { DroughtLocationSelector } from '../../components/selectors/DroughtLocationSelector';
import type { DroughtLocation } from '../../types';

interface SoilMoistureCardProps {
  locations: DroughtLocation[];
  selectedLocation: DroughtLocation | null;
  onLocationChange: (location: DroughtLocation) => void;
}

export const SoilMoistureCard: React.FC<SoilMoistureCardProps> = ({
  locations,
  selectedLocation,
  onLocationChange,
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
      {/* Embedded Selector */}
      <DroughtLocationSelector
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationChange={onLocationChange}
        className="w-full"
      />

      {/* Additional info */}
      {soilMoisture !== null && (
        <p className="text-xs text-gray-500 mt-2">Átlag (10-100 cm)</p>
      )}
    </DataCard>
  );
};
