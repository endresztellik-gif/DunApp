/**
 * HomePage Component — Redesign v2
 *
 * DM Serif Display branding, egyedi SVG ikonok, dun-card modul kártyák.
 */

import React from 'react';
import { Icon } from './Icon';
import { useRegion, type Region } from '../contexts/RegionContext';
import type { ModuleType } from '../types';

interface HomePageProps {
  onModuleSelect: (module: ModuleType) => void;
}

const REGION_CARDS: { region: Region; label: string; desc: string }[] = [
  { region: 'duna', label: 'Duna', desc: 'Déli Duna-völgy · Szekszárd, Baja, Mohács' },
  { region: 'drava', label: 'Dráva', desc: 'Dráva-mente · Barcs, Őrtilos, Vízvár' },
];

export const HomePage: React.FC<HomePageProps> = ({ onModuleSelect }) => {
  const { region, setRegion } = useRegion();

  // First launch (or no stored region): mandatory region choice before the modules.
  if (!region) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ background: 'var(--bg-app)' }}
      >
        {/* Brand */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img src="/icons/icon-192x192.svg" alt="DunApp Logo" className="w-24 h-24 md:w-32 md:h-32" />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 8vw, 72px)',
              color: 'var(--color-dun-current-600)',
              lineHeight: 1,
              marginBottom: 'var(--space-3)',
              fontWeight: 400,
            }}
          >
            DunApp
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
            Válassz régiót
          </p>
        </div>

        {/* Region cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
          {REGION_CARDS.map(({ region: r, label, desc }) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className="dun-card flex flex-col items-center text-center p-8"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <div
                className="flex items-center justify-center mb-4 rounded-full"
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'color-mix(in srgb, var(--color-dun-current-600) 12%, transparent)',
                  color: 'var(--color-dun-current-600)',
                }}
              >
                <Icon id="icon-water" size={32} />
              </div>
              <h2
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {label}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                {desc}
              </p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="dun-meta">A régió a fejlécben bármikor módosítható</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-app)' }}
    >
      {/* Brand */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <img src="/icons/icon-192x192.svg" alt="DunApp Logo" className="w-24 h-24 md:w-32 md:h-32" />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 8vw, 72px)',
            color: 'var(--color-dun-current-600)',
            lineHeight: 1,
            marginBottom: 'var(--space-2)',
            fontWeight: 400,
          }}
        >
          DunApp
        </h1>
        <p className="dun-meta" style={{ marginBottom: 'var(--space-3)' }}>
          v 4.5
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
          Meteorológiai és Vízügyi Monitoring
        </p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {[
          {
            module: 'meteorology' as ModuleType,
            label: 'Meteorológia',
            desc: 'Időjárás-előrejelzés és radar',
            iconId: 'icon-meteo',
            accent: 'var(--color-dun-wave-400)',
          },
          {
            module: 'water-level' as ModuleType,
            label: 'Vízállás',
            desc: 'Dunai vízszint monitoring',
            iconId: 'icon-water',
            accent: 'var(--color-dun-current-600)',
          },
          {
            module: 'drought' as ModuleType,
            label: 'Aszály',
            desc: 'HDI index és talajvíz',
            iconId: 'icon-drought',
            accent: 'var(--color-dun-amber-400)',
          },
        ].map(({ module, label, desc, iconId, accent }) => (
          <button
            key={module}
            onClick={() => onModuleSelect(module)}
            className="dun-card flex flex-col items-center text-center p-8"
            style={{ cursor: 'pointer', border: 'none' }}
          >
            <div
              className="flex items-center justify-center mb-4 rounded-full"
              style={{
                width: '64px',
                height: '64px',
                background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                color: accent,
              }}
            >
              <Icon id={iconId} size={32} />
            </div>
            <h2
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              {label}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              {desc}
            </p>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <p className="dun-meta">DunApp PWA · terepi embereknek</p>
      </div>
    </div>
  );
};
