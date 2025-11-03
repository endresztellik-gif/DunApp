/**
 * StationSelector Component
 *
 * WATER LEVEL MODULE ONLY - Selector for 3 stations
 *
 * CRITICAL ARCHITECTURE RULE:
 * This selector is ONLY for the Water Level module.
 * It MUST have exactly 3 stations.
 * DO NOT use this as a generic location selector!
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Info } from 'lucide-react';
import type { WaterLevelStation } from '../../types';

interface StationSelectorProps {
  stations: WaterLevelStation[];
  selectedStation: WaterLevelStation | null;
  onStationChange: (station: WaterLevelStation) => void;
  className?: string;
}

export const StationSelector: React.FC<StationSelectorProps> = ({
  stations,
  selectedStation,
  onStationChange,
  className = '',
}) => {
  // VALIDATION: MUST have exactly 3 stations for Water Level module
  if (stations.length !== 3) {
    throw new Error(
      `StationSelector: Expected exactly 3 stations for Water Level module, but received ${stations.length}. ` +
      'This selector is module-specific and cannot be used as a generic selector.'
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

  const handleStationSelect = (station: WaterLevelStation) => {
    onStationChange(station);
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
        className="selector-button-water"
        aria-label="Állomás kiválasztása"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <MapPin className="h-5 w-5" aria-hidden="true" />
        <span className="text-base font-medium">
          {selectedStation?.name || 'Válassz állomást'}
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
          aria-label="Állomások listája"
        >
          {stations.map((station) => {
            const isSelected = selectedStation?.id === station.id;

            return (
              <button
                key={station.id}
                onClick={() => handleStationSelect(station)}
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
                    {station.name}
                  </span>
                  <span className="text-xs text-gray-600">
                    {station.river} ({station.riverKm ? `${station.riverKm} fkm` : 'N/A'})
                  </span>
                  {/* Critical levels tooltip */}
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Info className="h-3 w-3" aria-hidden="true" />
                    <span>
                      LNV: {station.lowWaterLevelCm ?? 'N/A'}cm | KKV: {station.highWaterLevelCm ?? 'N/A'}cm
                    </span>
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
