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
import { CollapsibleLegend } from './UI/CollapsibleLegend';

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

  // Get date 2 days ago in YYYYMMDD format (met.hu has 2-day upload delay)
  const getDateString = () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2); // Met.hu has 2-day delay
    const year = twoDaysAgo.getFullYear();
    const month = String(twoDaysAgo.getMonth() + 1).padStart(2, '0');
    const day = String(twoDaysAgo.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const dateStr = getDateString();
  const prefix = layerPrefixes[layer];

  // Use Netlify proxy to avoid CORS issues (both dev and production)
  const imageUrl = `/met-img/${prefix}/${prefix}${dateStr}_0000.png`;

  const today = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Legend content — reused below the map (normal view) and inside the
  // semi-transparent CollapsibleLegend overlay on the zoomed/fullscreen view.
  const legendBody = (
    <div className="space-y-2 text-sm text-gray-700">
      <p>
        <span className="font-semibold">Talaj vízhiány:</span> A talaj vízháztartási hiánya mm-ben
        mérve.
      </p>
      <p className="text-xs text-gray-600">
        Minél sötétebb a barna szín, annál nagyobb a vízhiány a talajban. A világosabb területeken
        jobban ellátott a talaj vízzel.
      </p>
      <div className="flex items-center gap-2 border-t border-gray-300 pt-2">
        <div className="text-xs text-gray-500">
          <strong>Rétegek:</strong> vh50 = 0-50 cm, vh100 = 0-100 cm mélységig
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl bg-orange-50 p-6">
      <div className="flex flex-col items-center">
        <h2 className="mb-2 text-center text-2xl font-semibold text-gray-800">
          Talaj vízhiány – napi frissítés
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Frissítve: {today} • Forrás:{' '}
          <a
            href="https://met.hu"
            className="underline transition-colors hover:text-orange-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            met.hu
          </a>
        </p>

        {/* Rétegválasztó */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {(Object.entries(layerNames) as [Layer, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setLayer(key)}
              className={`rounded-xl px-4 py-2 font-medium transition-all ${
                layer === key
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Térkép + nagyítás */}
        <div
          className="relative w-full max-w-3xl cursor-zoom-in overflow-hidden rounded-2xl bg-gray-100 shadow-lg"
          onClick={() => setZoomed(true)}
        >
          <img
            src={imageUrl}
            alt={`Talaj vízhiány – ${layerNames[layer]}`}
            className="h-auto w-full"
            loading="lazy"
            crossOrigin="anonymous"
            onError={(e) => {
              // Fallback for missing image (try 3 days ago via proxy)
              const threeDaysAgo = new Date();
              threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
              const year = threeDaysAgo.getFullYear();
              const month = String(threeDaysAgo.getMonth() + 1).padStart(2, '0');
              const day = String(threeDaysAgo.getDate()).padStart(2, '0');
              const fallbackDateStr = `${year}${month}${day}`;
              const fallbackUrl = `/met-img/${prefix}/${prefix}${fallbackDateStr}_0000.png`;
              e.currentTarget.src = fallbackUrl;
            }}
          />
          <ZoomIn className="absolute top-3 right-3 rounded-full bg-black/50 p-1 text-white" />
        </div>

        {/* Nagyított nézet */}
        <AnimatePresence>
          {zoomed && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomed(false)}
            >
              <motion.div
                className="relative w-full max-w-5xl"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <img
                  src={imageUrl}
                  alt="Nagyított térkép"
                  className="h-auto w-full rounded-lg"
                  crossOrigin="anonymous"
                />
                <button
                  className="absolute top-2 right-2 rounded-full bg-white/80 p-2 transition-colors hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomed(false);
                  }}
                >
                  <X className="text-gray-800" />
                </button>

                {/* Semi-transparent legend overlay (tap to expand) — does not close the modal */}
                <div onClick={(e) => e.stopPropagation()}>
                  <CollapsibleLegend className="bottom-4 left-4">
                    <div className="max-w-xs">
                      <h4 className="mb-2 text-xs font-semibold text-gray-900">
                        Talaj vízhiány – {layerNames[layer]}
                      </h4>
                      {legendBody}
                    </div>
                  </CollapsibleLegend>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Jelmagyarázat */}
        <div className="mt-6 w-full max-w-3xl rounded-xl bg-gray-50 p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold text-gray-800">Jelmagyarázat</h3>
          {legendBody}
        </div>
      </div>
    </div>
  );
};
