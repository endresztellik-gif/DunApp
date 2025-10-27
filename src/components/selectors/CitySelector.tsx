/**
 * CitySelector Component
 *
 * METEOROLOGY MODULE ONLY - Selector for 4 cities
 *
 * CRITICAL ARCHITECTURE RULE:
 * This selector is ONLY for the Meteorology module.
 * It MUST have exactly 4 cities.
 * DO NOT use this as a generic location selector!
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import type { City } from '../../types';

interface CitySelectorProps {
  cities: City[];
  selectedCity: City | null;
  onCityChange: (city: City) => void;
  className?: string;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  cities,
  selectedCity,
  onCityChange,
  className = '',
}) => {
  // VALIDATION: MUST have exactly 4 cities for Meteorology module
  if (cities.length !== 4) {
    throw new Error(
      `CitySelector: Expected exactly 4 cities for Meteorology module, but received ${cities.length}. ` +
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

  const handleCitySelect = (city: City) => {
    onCityChange(city);
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
        className="selector-button-meteorology"
        aria-label="Település kiválasztása"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <MapPin className="h-5 w-5" aria-hidden="true" />
        <span className="text-base font-medium">
          {selectedCity?.name || 'Válassz várost'}
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
          aria-label="Települések listája"
        >
          {cities.map((city) => {
            const isSelected = selectedCity?.id === city.id;

            return (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city)}
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
                    {city.name}
                  </span>
                  <span className="text-xs text-gray-600">{city.county} megye</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
