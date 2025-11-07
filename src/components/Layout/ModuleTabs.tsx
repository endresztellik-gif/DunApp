/**
 * ModuleTabs Component
 *
 * Navigation tabs for switching between the three main modules:
 * - Meteorology (cyan)
 * - Water Level (light cyan)
 * - Drought (orange)
 *
 * CRITICAL: Each module has its own specific color scheme.
 */

import React from 'react';
import { Cloud, Droplet, Wind } from 'lucide-react';
import type { ModuleType } from '../../types';

interface ModuleTabsProps {
  currentModule: ModuleType;
  onModuleChange: (module: ModuleType | null) => void;
}

interface TabConfig {
  module: ModuleType;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  inactiveClass: string;
  ariaLabel: string;
}

export const ModuleTabs: React.FC<ModuleTabsProps> = ({
  currentModule,
  onModuleChange,
}) => {
  const tabs: TabConfig[] = [
    {
      module: 'meteorology',
      label: 'Meteorológia',
      icon: <Cloud className="h-5 w-5" aria-hidden="true" />,
      activeClass: 'module-tab-meteorology-active',
      inactiveClass: 'module-tab-meteorology',
      ariaLabel: 'Meteorológiai modul',
    },
    {
      module: 'water-level',
      label: 'Vízállás',
      icon: <Droplet className="h-5 w-5" aria-hidden="true" />,
      activeClass: 'module-tab-water-active',
      inactiveClass: 'module-tab-water',
      ariaLabel: 'Vízállás modul',
    },
    {
      module: 'drought',
      label: 'Aszály',
      icon: <Wind className="h-5 w-5" aria-hidden="true" />,
      activeClass: 'module-tab-drought-active',
      inactiveClass: 'module-tab-drought',
      ariaLabel: 'Aszály modul',
    },
  ];

  return (
    <div className="flex items-center gap-2 md:gap-3" role="tablist">
      {tabs.map((tab) => {
        const isActive = currentModule === tab.module;
        const buttonClass = isActive ? tab.activeClass : tab.inactiveClass;

        return (
          <button
            key={tab.module}
            onClick={() => onModuleChange(tab.module)}
            className={buttonClass}
            aria-label={tab.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
            role="tab"
            aria-selected={isActive}
          >
            {/* Icon only on mobile */}
            <span className="md:hidden">{tab.icon}</span>

            {/* Icon + Text on desktop */}
            <span className="hidden md:flex md:items-center md:gap-2">
              {tab.icon}
              <span>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
