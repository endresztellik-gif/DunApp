/**
 * DroughtLocationSelector Component
 *
 * DROUGHT MODULE ONLY - Selector for the region's monitoring locations
 *
 * CRITICAL ARCHITECTURE RULE:
 * This selector is ONLY for the Drought module monitoring locations.
 * The number of locations is region-dependent (e.g. Duna: 5, Dráva: 3),
 * so it only requires at least 1 location.
 * DO NOT use this as a generic location selector!
 * This is SEPARATE from WellSelector (which is for the groundwater wells).
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
  // VALIDATION: Must have at least 1 location (count is region-dependent, e.g. Duna: 5, Dráva: 3)
  if (locations.length < 1) {
    throw new Error(
      `DroughtLocationSelector: Expected at least 1 location for Drought module, but received ${locations.length}. ` +
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
      className={`selector-dropdown relative w-full md:w-auto ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="selector-button-drought flex items-center gap-2 px-4 py-2 w-full md:w-auto"
        style={{ border: '0.5px solid rgba(212,133,28,.20)', color: 'var(--text-primary)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'var(--transition-fast)' }}
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
          className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto flex flex-col"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}
          role="listbox"
          aria-label="Monitoring helyszínek listája"
        >
          {locations.map((location) => {
            const isSelected = selectedLocation?.id === location.id;

            return (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className={`dun-selector-item${isSelected ? ' selector-dropdown-item-selected font-medium' : ' selector-dropdown-item'}`}
                style={isSelected ? { background: 'var(--bg-surface-alt)' } : {}}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex flex-col">
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {location.locationName}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
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
