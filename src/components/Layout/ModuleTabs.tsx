/**
 * ModuleTabs Component — BottomNav redesign
 *
 * Fix bottom navigation bar egyedi SVG ikonokkal.
 * CSS: dun-nav, dun-nav-item, dun-nav-label (design-tokens.css-ből)
 */

import React from 'react';
import { Icon } from '../Icon';
import type { ModuleType } from '../../types';

interface ModuleTabsProps {
  currentModule: ModuleType;
  onModuleChange: (module: ModuleType | null) => void;
}

export const ModuleTabs: React.FC<ModuleTabsProps> = ({
  currentModule,
  onModuleChange,
}) => {
  const tabs = [
    { module: 'meteorology' as ModuleType, label: 'Időjárás', iconId: 'icon-meteo', ariaLabel: 'Meteorológiai modul' },
    { module: 'water-level' as ModuleType, label: 'Vízállás', iconId: 'icon-water', ariaLabel: 'Vízállás modul' },
    { module: 'drought' as ModuleType, label: 'Aszály', iconId: 'icon-drought', ariaLabel: 'Aszály modul' },
  ];

  return (
    <nav
      className="dun-nav"
      aria-label="Modul navigáció"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = currentModule === tab.module;
        return (
          <button
            key={tab.module}
            onClick={() => onModuleChange(tab.module)}
            className={`dun-nav-item${isActive ? ' active' : ''}`}
            aria-label={tab.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
            role="tab"
            aria-selected={isActive}
          >
            <Icon id={tab.iconId} size={22} />
            <span className="dun-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
