/**
 * Header Component
 *
 * Main application header with logo and module navigation tabs.
 * Sticky positioned at the top of the viewport.
 */

import React from 'react';
import { ModuleTabs } from './ModuleTabs';
import type { ModuleType } from '../../types';

interface HeaderProps {
  currentModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  onModuleChange,
}) => {
  return (
    <header className="app-header">
      <div className="app-header-content">
        {/* Logo */}
        <div className="app-logo">
          <span className="text-cyan-600">Dun</span>
          <span className="text-gray-900">App</span>
        </div>

        {/* Module Navigation */}
        <nav className="app-nav" aria-label="Modul navigáció">
          <ModuleTabs
            currentModule={currentModule}
            onModuleChange={onModuleChange}
          />
        </nav>
      </div>
    </header>
  );
};
