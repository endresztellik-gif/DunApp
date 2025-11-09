/**
 * WaterDeficitDashboard Component
 *
 * Displays met.hu soil water deficit maps with:
 * - 3 depth layers (0-20cm, 0-50cm, 0-100cm)
 * - Optional overlay layers (NDVI, precipitation)
 * - Zoom modal with smooth animations
 * - Daily auto-refresh from met.hu
 *
 * Data source: https://www.met.hu/idojaras/agrometeorologia/talaj/
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, X } from 'lucide-react';

type Layer = 'vh50' | 'vh100';

export const WaterDeficitDashboard: React.FC = () => {
  const [layer, setLayer] = useState<Layer>('vh50'); // Default: 0-50 cm
  const [zoomed, setZoomed] = useState(false);

  const layerNames: Record<Layer, string> = {
    vh50: '0–50 cm',
    vh100: '0–100 cm',
  };

  // Layer prefixes for met.hu images
  const layerPrefixes: Record<Layer, string> = {
    vh50: 'msEe', // 0-50 cm water deficit
    vh100: 'msEf', // 0-100 cm water deficit
  };

  // Get yesterday's date in YYYYMMDD format (images are uploaded with 1-day delay)
  const getDateString = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // Start with yesterday
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const dateStr = getDateString();
  const prefix = layerPrefixes[layer];

  // Use Vite proxy in development to avoid CORS issues
  const IS_DEV = import.meta.env.DEV;
  const imageUrl = IS_DEV
    ? `/met-img/${prefix}/${prefix}${dateStr}_0000.png`
    : `https://www.met.hu/img/${prefix}/${prefix}${dateStr}_0000.png`;

  const today = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-orange-50 p-6 rounded-2xl">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-2 text-center text-gray-800">
          Talaj vízhiány – napi frissítés
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Frissítve: {today} • Forrás:{' '}
          <a
            href="https://met.hu"
            className="underline hover:text-orange-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            met.hu
          </a>
        </p>

      {/* Rétegválasztó */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {(Object.entries(layerNames) as [Layer, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setLayer(key)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              layer === key
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Térkép + nagyítás */}
      <div
        className="relative cursor-zoom-in w-full max-w-3xl rounded-2xl shadow-lg overflow-hidden bg-gray-100"
        onClick={() => setZoomed(true)}
      >
        <img
          src={imageUrl}
          alt={`Talaj vízhiány – ${layerNames[layer]}`}
          className="w-full h-auto"
          loading="lazy"
          crossOrigin="anonymous"
          onError={(e) => {
            // Fallback for missing image (try 2 days ago)
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const year = twoDaysAgo.getFullYear();
            const month = String(twoDaysAgo.getMonth() + 1).padStart(2, '0');
            const day = String(twoDaysAgo.getDate()).padStart(2, '0');
            const fallbackDateStr = `${year}${month}${day}`;
            const fallbackUrl = IS_DEV
              ? `/met-img/${prefix}/${prefix}${fallbackDateStr}_0000.png`
              : `https://www.met.hu/img/${prefix}/${prefix}${fallbackDateStr}_0000.png`;
            e.currentTarget.src = fallbackUrl;
          }}
        />
        <ZoomIn className="absolute top-3 right-3 text-white bg-black/50 p-1 rounded-full" />
      </div>

      {/* Nagyított nézet */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(false)}
          >
            <motion.div
              className="relative max-w-5xl w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <img
                src={imageUrl}
                alt="Nagyított térkép"
                className="w-full h-auto rounded-lg"
                crossOrigin="anonymous"
              />
              <button
                className="absolute top-2 right-2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed(false);
                }}
              >
                <X className="text-gray-800" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jelmagyarázat */}
      <div className="mt-6 max-w-3xl w-full bg-gray-50 p-4 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Jelmagyarázat</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <span className="font-semibold">Talaj vízhiány:</span> A talaj vízháztartási
            hiánya mm-ben mérve.
          </p>
          <p className="text-xs text-gray-600">
            Minél sötétebb a barna szín, annál nagyobb a vízhiány a talajban. A világosabb
            területeken jobban ellátott a talaj vízzel.
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-gray-300">
            <div className="text-xs text-gray-500">
              <strong>Rétegek:</strong> vh50 = 0-50 cm, vh100 = 0-100 cm mélységig
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
