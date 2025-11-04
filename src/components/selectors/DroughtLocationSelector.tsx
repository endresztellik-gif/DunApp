/**
 * DroughtLocationSelector Component
 *
 * DROUGHT MODULE ONLY - Selector for 5 monitoring locations
 *
 * CRITICAL ARCHITECTURE RULE:
 * This selector is ONLY for the Drought module monitoring locations.
 * It MUST have exactly 5 locations.
 * DO NOT use this as a generic location selector!
 * This is SEPARATE from WellSelector (which is for 15 groundwater wells).
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import type { DroughtLocation } from '../../types';

interface DroughtLocationSelectorProps {
  locations: DroughtLocation[];
  selectedLocation: DroughtLocation | null;
  onLocationChange: (location: DroughtLocation) => void;
  className?: string;
}

export const DroughtLocationSelector: React.FC<DroughtLocationSelectorProps> = ({
  locations,
  selectedLocation,
  onLocationChange,
  className = '',
}) => {
  // VALIDATION: MUST have exactly 5 locations for Drought module
  if (locations.length !== 5) {
    throw new Error(
      `DroughtLocationSelector: Expected exactly 5 locations for Drought module, but received ${locations.length}. ` +
      'This selector is module-specific and cannot be used as a generic selector. ' +
      'For groundwater wells, use WellSelector instead.'
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

  const handleLocationSelect = (location: DroughtLocation) => {
    onLocationChange(location);
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
        aria-label="Monitoring helyszín kiválasztása"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <MapPin className="h-5 w-5" aria-hidden="true" />
        <span className="text-base font-medium">
          {selectedLocation?.locationName || 'Válassz helyszínt'}
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
          aria-label="Monitoring helyszínek listája"
        >
          {locations.map((location) => {
            const isSelected = selectedLocation?.id === location.id;

            return (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location)}
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
                    {location.locationName}
                  </span>
                  <span className="text-xs text-gray-600">
                    {location.county} megye
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
