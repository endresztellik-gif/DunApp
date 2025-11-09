/**
 * DroughtIndexCard Component
 *
 * Data card displaying drought index value for the selected location.
 * No embedded selector - uses global location selector.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { DataCard } from '../../components/UI/DataCard';
import type { DroughtLocation, DroughtCategory, DroughtData } from '../../types';

interface DroughtIndexCardProps {
  selectedLocation: DroughtLocation | null;
  droughtData: DroughtData | null;
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
  selectedLocation: _selectedLocation,
  droughtData,
}) => {
  // Use real data from Supabase
  const droughtIndex: number | null = droughtData?.droughtIndex ?? null;
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
      {/* Category Status */}
      {droughtIndex !== null && (
        <p className="text-sm text-orange-600 font-medium">({categoryLabel})</p>
      )}
    </DataCard>
  );
};
