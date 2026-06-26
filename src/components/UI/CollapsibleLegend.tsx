/**
 * CollapsibleLegend Component
 *
 * Floating "ⓘ Jelmagyarázat" toggle used inside fullscreen map overlays. The map
 * stays unobstructed by default; tapping the button reveals the legend panel.
 * Caller positions it via `className` (e.g. "bottom-4 left-4").
 *
 * Created: 2026-06-26
 */

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';

interface CollapsibleLegendProps {
  children: ReactNode;
  /** Positioning utilities, e.g. "bottom-4 left-4". The component adds absolute + z-index. */
  className?: string;
}

export function CollapsibleLegend({ children, className = '' }: CollapsibleLegendProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`absolute z-[10000] ${className}`}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="mb-2 max-w-[85vw] max-h-[60vh] overflow-auto rounded-lg px-3 py-2.5 backdrop-blur"
            style={{ background: 'rgba(255,255,255,0.96)', border: '0.5px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">{children}</div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Jelmagyarázat bezárása"
                className="-mt-1 -mr-1 shrink-0 rounded p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-gray-700 shadow-md backdrop-blur transition-colors hover:bg-white"
      >
        <Info className="h-4 w-4 text-cyan-600" />
        Jelmagyarázat
      </button>
    </div>
  );
}
