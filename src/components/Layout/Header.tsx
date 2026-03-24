/**
 * Header Component — Redesign v2
 *
 * Sötét sticky header, DM Serif Display branding.
 * Dark mode toggle + értesítés gomb.
 * A harang ikon cián színű ha feliratkozott, halványszürke ha nem.
 * Kattintásra confirm dialog nyílik fel (feliratkozás / leiratkozás megerősítés).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, X, Bell, BellOff, Loader2 } from 'lucide-react';
import { Icon } from '../Icon';
import { usePushNotifications } from '../../hooks/usePushNotifications';
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
  const { isSupported, permission, isSubscribed, subscribe, unsubscribe, isLoading, error } =
    usePushNotifications();

  // Track whether the user triggered an action (to distinguish loading from initial open)
  const wasActingRef = useRef(false);

  // Close modal after successful action (isLoading goes false + no error)
  useEffect(() => {
    if (!isLoading && wasActingRef.current) {
      wasActingRef.current = false;
      if (!error) {
        setShowNotifications(false);
      }
    }
  }, [isLoading, error]);

  const handleAction = () => {
    wasActingRef.current = true;
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  const today = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const bellSubscribedStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: '0.5px solid var(--color-dun-wave-400)',
    background: 'rgba(34,166,179,.18)',
    color: 'var(--color-dun-wave-400)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  };

  const bellDefaultStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: '0.5px solid rgba(126,207,199,.2)',
    background: 'transparent',
    color: 'rgba(255,255,255,.45)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  };

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

          {/* Értesítések gomb — cián ha feliratkozott, halvány ha nem */}
          {isSupported && permission !== 'denied' && (
            <button
              aria-label={isSubscribed ? 'Értesítések kezelése (aktív)' : 'Feliratkozás értesítésekre'}
              onClick={() => setShowNotifications(true)}
              style={isSubscribed ? bellSubscribedStyle : bellDefaultStyle}
            >
              <Icon id="icon-alert-bell" size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Notification confirm modal */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => !isLoading && setShowNotifications(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl overflow-hidden shadow-xl"
            style={{ background: 'var(--bg-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog fejléc */}
            <div
              className="flex items-center justify-between px-4 pt-4 pb-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2.5">
                {isSubscribed
                  ? <Bell className="h-4 w-4" style={{ color: 'var(--color-dun-wave-400)' }} />
                  : <BellOff className="h-4 w-4 text-gray-400" />
                }
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Vízállás riasztás
                </span>
              </div>
              <button
                onClick={() => !isLoading && setShowNotifications(false)}
                aria-label="Bezárás"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <X size={16} />
              </button>
            </div>

            {/* Dialog törzs */}
            <div className="px-4 py-4">
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {isSubscribed
                  ? 'Az értesítések aktívak. Riasztást kapsz, ha Mohácsnál a vízállás eléri a 400 cm-t.'
                  : 'Szeretnél értesítést kapni, ha a mohácsi vízállás eléri a 400 cm-t?'
                }
              </p>

              {error && (
                <p className="text-xs text-red-600 mb-3 rounded-md bg-red-50 px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2">
                {isSubscribed ? (
                  <>
                    <button
                      onClick={handleAction}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                      style={{ background: '#dc2626' }}
                    >
                      {isLoading
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Leiratkozás...</>
                        : 'Leiratkozás'
                      }
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      disabled={isLoading}
                      className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                      style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-primary)' }}
                    >
                      Mégsem
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleAction}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                      style={{ background: 'var(--color-dun-wave-400)' }}
                    >
                      {isLoading
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Feliratkozás...</>
                        : 'Feliratkozás'
                      }
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      disabled={isLoading}
                      className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                      style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-primary)' }}
                    >
                      Mégsem
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
