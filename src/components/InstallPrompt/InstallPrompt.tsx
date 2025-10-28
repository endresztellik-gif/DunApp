import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

/**
 * PWA Install Prompt Component
 *
 * Displays a prompt to install the DunApp PWA when the browser
 * fires the 'beforeinstallprompt' event.
 *
 * Features:
 * - Auto-shows when install is available
 * - Dismissible (stores preference in localStorage)
 * - Responsive design (mobile-first)
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * import { InstallPrompt } from './components/InstallPrompt';
 *
 * function App() {
 *   return (
 *     <>
 *       <InstallPrompt />
 *       {/* Rest of app *\/}
 *     </>
 *   );
 * }
 * ```
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      return;
    }

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show the install prompt
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    // Remember dismissal for this session
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleRemindLater = () => {
    setShowInstall(false);
    // Don't store in localStorage, so prompt shows again next session
  };

  if (!showInstall) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
    >
      <div className="relative rounded-lg bg-white p-4 shadow-xl ring-1 ring-gray-200">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Bezárás"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#00A8CC] to-[#0088AA]">
            <Download className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3
              id="install-prompt-title"
              className="text-lg font-semibold text-gray-900"
            >
              Telepítsd a DunApp-ot
            </h3>
          </div>
        </div>

        {/* Description */}
        <p
          id="install-prompt-description"
          className="mb-4 text-sm text-gray-600"
        >
          Telepítsd az alkalmazást az otthoni képernyődre a gyorsabb
          hozzáféréshez és offline használathoz!
        </p>

        {/* Benefits list */}
        <ul className="mb-4 space-y-1 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Offline hozzáférés
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Gyorsabb betöltés
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Teljes képernyős mód
          </li>
        </ul>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-lg bg-gradient-to-r from-[#00A8CC] to-[#0088AA] px-4 py-2 text-sm font-medium text-white hover:from-[#0088AA] hover:to-[#007799] focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:ring-offset-2"
          >
            Telepítés
          </button>
          <button
            onClick={handleRemindLater}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 sm:flex-initial sm:px-6"
          >
            Később
          </button>
        </div>

        {/* Dismiss link */}
        <button
          onClick={handleDismiss}
          className="mt-2 w-full text-center text-xs text-gray-500 underline hover:text-gray-700"
        >
          Ne mutasd újra
        </button>
      </div>
    </div>
  );
}
