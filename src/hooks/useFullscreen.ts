/**
 * useFullscreen Hook
 *
 * Lightweight, app-level "fullscreen overlay" state for map widgets (NOT the
 * native Fullscreen API — we keep React in control so Leaflet stays mounted and
 * we just toggle CSS to fixed inset-0). Handles Escape-to-exit and body
 * scroll-lock while active.
 *
 * Created: 2026-06-26
 */

import { useCallback, useEffect, useState } from 'react';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  enter: () => void;
  exit: () => void;
  toggle: () => void;
}

export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enter = useCallback(() => setIsFullscreen(true), []);
  const exit = useCallback(() => setIsFullscreen(false), []);
  const toggle = useCallback(() => setIsFullscreen((v) => !v), []);

  useEffect(() => {
    if (!isFullscreen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  return { isFullscreen, enter, exit, toggle };
}
