/**
 * RegionContext — app-level Duna / Dráva region selection.
 *
 * The region is app-global (not a module-specific selector), so it lives in a
 * context rather than a module. It does NOT violate the "every module has its own
 * location selector" rule — this is a region, not a location/station selector.
 *
 * Persistence follows the `isDark` pattern: lazy-init from localStorage +
 * useEffect write-back. `null` means no region chosen yet → the HomePage forces a
 * mandatory first-launch choice; the Header lets the user switch any time.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Region } from '../types';

export type { Region };

interface RegionContextValue {
  region: Region | null;
  setRegion: (region: Region) => void;
}

const STORAGE_KEY = 'dunapp-region';

const RegionContext = createContext<RegionContextValue | undefined>(undefined);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'duna' || saved === 'drava' ? saved : null;
  });

  useEffect(() => {
    if (region) localStorage.setItem(STORAGE_KEY, region);
  }, [region]);

  return (
    <RegionContext.Provider value={{ region, setRegion: setRegionState }}>
      {children}
    </RegionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion must be used within a RegionProvider');
  return ctx;
}
