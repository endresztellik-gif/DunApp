/**
 * HomePage Component
 *
 * Modern landing page with centered layout.
 * Features:
 * - Large DunApp branding
 * - 3 module selection cards (Meteorológia, Vízállás, Aszály)
 * - Clean, minimal design with icons
 * - Responsive grid layout
 */

import React from 'react';
import { Cloud, Droplet, Sprout } from 'lucide-react';
import type { ModuleType } from '../types';

interface HomePageProps {
  onModuleSelect: (module: ModuleType) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onModuleSelect }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="text-center mb-12">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/icons/icon-192x192.svg"
            alt="DunApp Logo"
            className="w-24 h-24 md:w-32 md:h-32"
          />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-1">
          <span className="text-cyan-600">Dun</span>
          <span className="text-gray-900">App</span>
        </h1>
        <p className="text-sm text-gray-400 mb-3">v 1.5</p>
        <p className="text-gray-600 text-lg">
          Meteorológiai és Vízügyi Monitoring
        </p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {/* Meteorológia */}
        <button
          onClick={() => onModuleSelect('meteorology')}
          className="group bg-white hover:bg-cyan-50 border-2 border-gray-200 hover:border-cyan-500 rounded-2xl p-8 transition-all duration-200 hover:shadow-xl hover:scale-105"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-cyan-500 transition-colors">
              <Cloud className="w-8 h-8 text-cyan-600 group-hover:text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Meteorológia
            </h2>
            <p className="text-gray-600 text-sm">
              Időjárás-előrejelzés és radar
            </p>
          </div>
        </button>

        {/* Vízállás */}
        <button
          onClick={() => onModuleSelect('water-level')}
          className="group bg-white hover:bg-sky-50 border-2 border-gray-200 hover:border-sky-500 rounded-2xl p-8 transition-all duration-200 hover:shadow-xl hover:scale-105"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-sky-500 transition-colors">
              <Droplet className="w-8 h-8 text-sky-600 group-hover:text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Vízállás
            </h2>
            <p className="text-gray-600 text-sm">
              Dunai mérőállomások adatai
            </p>
          </div>
        </button>

        {/* Aszály */}
        <button
          onClick={() => onModuleSelect('drought')}
          className="group bg-white hover:bg-orange-50 border-2 border-gray-200 hover:border-orange-500 rounded-2xl p-8 transition-all duration-200 hover:shadow-xl hover:scale-105"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors">
              <Sprout className="w-8 h-8 text-orange-600 group-hover:text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Aszály
            </h2>
            <p className="text-gray-600 text-sm">
              Talajvíz és vízhiány monitoring
            </p>
          </div>
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-16 text-center text-gray-500 text-sm">
        <p>DunApp PWA - terepi embereknek</p>
      </div>
    </div>
  );
};
