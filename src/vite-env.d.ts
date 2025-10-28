/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/**
 * TypeScript declarations for Vite and PWA
 *
 * This file provides type definitions for:
 * - Vite client-side features
 * - PWA (Progressive Web App) functionality
 * - Service Worker registration
 */

// Extend Window interface for PWA events
interface BeforeInstallPromptEvent extends Event {
  /**
   * Allows a developer to show the install prompt at a time of their own choosing.
   * This method returns a Promise.
   */
  prompt(): Promise<void>;

  /**
   * Returns a Promise that resolves when the user responds to the prompt.
   */
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}

// Extend ImportMeta for Vite environment variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OPENWEATHER_API_KEY: string;
  // Note: MODE, DEV, PROD, SSR are already defined in vite/client
}
