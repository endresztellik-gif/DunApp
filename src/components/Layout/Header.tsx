/**
 * Header Component
 *
 * Modern centered header with logo and module navigation.
 * Features:
 * - Centered layout with DunApp logo and 3 module buttons
 * - Clean, minimal design
 * - Sticky positioning
 */

import React from 'react';
import { Cloud, Droplet, Sprout } from 'lucide-react';
import type { ModuleType } from '../../types';

interface HeaderProps {
  currentModule: ModuleType | null;
  onModuleChange: (module: ModuleType | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  onModuleChange,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Centered layout */}
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <button
            onClick={() => onModuleChange(null)}
            className="flex flex-col items-center hover:opacity-80 transition-opacity"
          >
            <span className="text-3xl font-bold">
              <span className="text-cyan-600">Dun</span>
              <span className="text-gray-900">App</span>
            </span>
            <span className="text-xs text-gray-400">v 2.0</span>
          </button>

          {/* Module Tabs - Always visible */}
          <nav className="flex items-center gap-3" aria-label="Modul navigáció">
            <button
              onClick={() => onModuleChange('meteorology')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                currentModule === 'meteorology'
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Cloud className="w-5 h-5" />
              <span className="hidden sm:inline">Meteorológia</span>
            </button>

            <button
              onClick={() => onModuleChange('water-level')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                currentModule === 'water-level'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Droplet className="w-5 h-5" />
              <span className="hidden sm:inline">Vízállás</span>
            </button>

            <button
              onClick={() => onModuleChange('drought')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                currentModule === 'drought'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Sprout className="w-5 h-5" />
              <span className="hidden sm:inline">Aszály</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
