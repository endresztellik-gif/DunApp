/**
 * WellSelector Component
 *
 * DROUGHT MODULE ONLY - Selector for 15 groundwater wells
 *
 * CRITICAL ARCHITECTURE RULE:
 * This selector is ONLY for the Drought module groundwater wells.
 * It MUST have exactly 15 wells.
 * DO NOT use this as a generic location selector!
 * This is SEPARATE from DroughtLocationSelector (which is for 5 monitoring locations).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Droplet, ChevronDown } from 'lucide-react';
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
  // VALIDATION: MUST have exactly 15 wells for Drought module
  if (wells.length !== 15) {
    throw new Error(
      `WellSelector: Expected exactly 15 wells for Drought module, but received ${wells.length}. ` +
      'This selector is module-specific and cannot be used as a generic selector. ' +
      'For drought monitoring locations, use DroughtLocationSelector instead.'
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
        <Droplet className="h-5 w-5" aria-hidden="true" />
        <span className="text-base font-medium">
          {selectedWell
            ? `${selectedWell.wellName} (#${selectedWell.wellCode})`
            : 'Válassz kutat'}
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
          className="selector-dropdown-menu"
          role="listbox"
          aria-label="Talajvízkutak listája"
        >
          {wells.map((well) => {
            const isSelected = selectedWell?.id === well.id;

            return (
              <button
                key={well.id}
                onClick={() => handleWellSelect(well)}
                className={
                  isSelected
                    ? 'selector-dropdown-item-selected'
                    : 'selector-dropdown-item'
                }
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {well.wellName}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-mono font-semibold text-orange-600">
                      #{well.wellCode}
                    </span>
                    <span>•</span>
                    <span>{well.cityName}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
