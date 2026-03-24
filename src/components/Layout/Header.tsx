/**
 * Header Component — Redesign v2
 *
 * Sötét sticky header, DM Serif Display branding.
 * Dark mode toggle + értesítés gomb.
 * A modul navigáció a BottomNav-ban van (ModuleTabs komponens).
 */

import React, { useState } from 'react';
import { Sun, Moon, X } from 'lucide-react';
import { Icon } from '../Icon';
import { NotificationSettings } from '../NotificationSettings';
import type { ModuleType } from '../../types';

interface HeaderProps {
  currentModule: ModuleType | null;
  onModuleChange: (module: ModuleType | null) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule: _currentModule,
  onModuleChange,
  isDark,
  onToggleDark,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const today = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <header
      style={{
        background: 'var(--color-dun-deep-800)',
        borderBottom: '0.5px solid rgba(126,207,199,.15)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-nav)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {/* Logo */}
        <button
          onClick={() => onModuleChange(null)}
          className="flex flex-col hover:opacity-80 transition-opacity text-left"
          aria-label="DunApp főoldal"
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              color: 'var(--color-dun-ripple-200)',
              lineHeight: 1,
            }}
          >
            DunApp
          </span>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '10px',
              color: 'rgba(255,255,255,.35)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            Déli Duna-völgy · {today}
          </span>
        </button>

        {/* Jobb oldal: dark mode toggle + értesítés */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            aria-label={isDark ? 'Váltás világos módra' : 'Váltás sötét módra'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              border: '0.5px solid rgba(126,207,199,.25)',
              background: 'rgba(34,166,179,.15)',
              color: 'var(--color-dun-ripple-200)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            {isDark
              ? <Sun size={16} aria-hidden />
              : <Moon size={16} aria-hidden />
            }
          </button>

          {/* Értesítések gomb */}
          <button
            aria-label="Értesítések"
            onClick={() => setShowNotifications(true)}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: '0.5px solid rgba(126,207,199,.2)',
              background: 'transparent',
              color: 'var(--color-dun-ripple-200)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <Icon id="icon-alert-bell" size={18} />
          </button>
        </div>
      </div>

      {/* Notification modal overlay */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-sm font-semibold text-white">Értesítések</span>
              <button
                onClick={() => setShowNotifications(false)}
                aria-label="Bezárás"
                className="text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <NotificationSettings />
          </div>
        </div>
      )}
    </header>
  );
};
