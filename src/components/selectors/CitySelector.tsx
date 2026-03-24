/**
 * CitySelector Component
 *
 * METEOROLOGY MODULE ONLY - Selector for meteorology cities
 *
 * CRITICAL ARCHITECTURE RULE:
 * This selector is ONLY for the Meteorology module.
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
  // VALIDATION: MUST have at least 1 city for Meteorology module
  if (cities.length < 1) {
    throw new Error(
      `CitySelector: Expected at least 1 city for Meteorology module, but received ${cities.length}. ` +
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
        className="selector-button-meteorology flex items-center gap-2 px-4 py-2 w-full md:w-auto"
        style={{ border: '0.5px solid rgba(26,95,122,.18)', color: 'var(--text-primary)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'var(--transition-fast)' }}
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
          className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto flex flex-col"
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}
          role="listbox"
          aria-label="Települések listája"
        >
          {cities.map((city) => {
            const isSelected = selectedCity?.id === city.id;

            return (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city)}
                className={`dun-selector-item${isSelected ? ' selector-dropdown-item-selected font-medium' : ' selector-dropdown-item'}`}
                style={isSelected ? { background: 'var(--bg-surface-alt)' } : {}}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex flex-col">
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {city.name}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{city.county} megye</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
