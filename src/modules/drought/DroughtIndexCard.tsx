/**
 * DroughtIndexCard Component
 *
 * Data card with embedded DroughtLocationSelector.
 * Displays drought index value for the selected location.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import { DroughtLocationSelector } from '../../components/selectors/DroughtLocationSelector';
import type { DroughtLocation, DroughtCategory } from '../../types';

interface DroughtIndexCardProps {
  locations: DroughtLocation[];
  selectedLocation: DroughtLocation | null;
  onLocationChange: (location: DroughtLocation) => void;
}

// Helper to get drought category
const getDroughtCategory = (index: number | null): DroughtCategory => {
  if (index === null) return 'none';
  if (index <= 2) return 'none';
  if (index <= 4) return 'mild';
  if (index <= 6) return 'moderate';
  if (index <= 8) return 'severe';
  return 'extreme';
};

// Helper to get category label
const getCategoryLabel = (category: DroughtCategory): string => {
  const labels = {
    none: 'Nincs aszály',
    mild: 'Mérsékelt aszály',
    moderate: 'Közepes aszály',
    severe: 'Magas aszály',
    extreme: 'Extrém aszály',
  };
  return labels[category];
};

export const DroughtIndexCard: React.FC<DroughtIndexCardProps> = ({
  locations,
  selectedLocation,
  onLocationChange,
}) => {
  // Placeholder data (will be replaced with real data)
  const droughtIndex: number | null = selectedLocation ? 2.3 : null;
  const category = getDroughtCategory(droughtIndex);
  const categoryLabel = getCategoryLabel(category);

  return (
    <DataCard
      icon={AlertTriangle}
      label="Aszályindex"
      value={droughtIndex !== null ? droughtIndex.toFixed(1) : null}
      unit="/10"
      moduleColor="drought"
    >
      {/* Embedded Selector */}
      <DroughtLocationSelector
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationChange={onLocationChange}
        className="w-full"
      />

      {/* Category Status */}
      {droughtIndex !== null && (
        <p className="text-sm text-orange-600 font-medium mt-2">({categoryLabel})</p>
      )}
    </DataCard>
  );
};
