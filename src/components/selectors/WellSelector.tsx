/**
 * WellSelector Component
 *
 * DROUGHT MODULE ONLY - Dropdown selector for groundwater wells (10-15 wells)
 *
 * CRITICAL ARCHITECTURE RULE:
 * This selector is ONLY for the Drought module groundwater wells.
 * Supports 10-15 wells (after enabled=true filtering).
 * DO NOT use this as a generic selector!
 * This is SEPARATE from DroughtLocationSelector (which is for 5 monitoring locations).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Droplets, ChevronDown } from 'lucide-react';
import type { GroundwaterWell } from '../../types';

interface WellSelectorProps {
  wells: GroundwaterWell[];
  selectedWell: GroundwaterWell | null;
  onWellChange: (well: GroundwaterWell) => void;
  className?: string;
}

export const WellSelector: React.FC<WellSelectorProps> = ({
  wells,
  selectedWell,
  onWellChange,
  className = '',
}) => {
  // VALIDATION: Must have at least 1 well (10-15 wells expected after enabled filter)
  if (wells.length < 1) {
    throw new Error(
      `WellSelector: Expected at least 1 groundwater well for Drought module, but received ${wells.length}. ` +
      'This selector is module-specific and cannot be used as a generic selector. ' +
      'For monitoring locations, use DroughtLocationSelector instead.'
    );
  }

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleWellSelect = (well: GroundwaterWell) => {
    onWellChange(well);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`selector-dropdown ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="selector-button-drought"
        aria-label="Talajvízkút kiválasztása"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Droplets className="h-5 w-5" aria-hidden="true" />
        <span className="text-base font-medium">
          {selectedWell?.wellName || 'Válassz kutat'} {selectedWell && `(#${selectedWell.wellCode})`}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto flex flex-col"
          role="listbox"
          aria-label="Talajvízkutak listája"
        >
          {wells.map((well) => {
            const isSelected = selectedWell?.id === well.id;

            return (
              <button
                key={well.id}
                onClick={() => handleWellSelect(well)}
                className={`w-full px-4 py-2 cursor-pointer transition-colors duration-150 text-left ${
                  isSelected
                    ? 'bg-gray-100 font-medium hover:bg-gray-100'
                    : 'hover:bg-gray-100 active:bg-gray-200'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {well.wellName} <span className="text-orange-600">#{well.wellCode}</span>
                  </span>
                  <span className="text-xs text-gray-600">
                    {well.cityName}, {well.county} megye
                    {well.depthMeters && ` • ${well.depthMeters}m mély`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
