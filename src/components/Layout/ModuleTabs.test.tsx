/**
 * ModuleTabs Component Tests — BottomNav redesign
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModuleTabs } from './ModuleTabs';
import type { ModuleType } from '../../types';

const defaultProps = {
  currentModule: 'meteorology' as ModuleType,
  onModuleChange: vi.fn(),
};

describe('ModuleTabs - Rendering', () => {
  it('renders all 3 module tabs', () => {
    render(<ModuleTabs {...defaultProps} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('renders nav with tablist role', () => {
    render(<ModuleTabs {...defaultProps} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders tab labels', () => {
    render(<ModuleTabs {...defaultProps} />);
    expect(screen.getByText('Időjárás')).toBeInTheDocument();
    expect(screen.getByText('Vízállás')).toBeInTheDocument();
    expect(screen.getByText('Aszály')).toBeInTheDocument();
  });

  it('nav has dun-nav class', () => {
    render(<ModuleTabs {...defaultProps} />);
    const nav = screen.getByRole('tablist');
    expect(nav).toHaveClass('dun-nav');
  });
});

describe('ModuleTabs - Active Tab', () => {
  beforeEach(() => {
    defaultProps.onModuleChange.mockClear?.();
  });

  it('active tab has "active" class', () => {
    render(<ModuleTabs currentModule="meteorology" onModuleChange={vi.fn()} />);
    const tab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    expect(tab).toHaveClass('active');
  });

  it('inactive tabs do not have "active" class', () => {
    render(<ModuleTabs currentModule="meteorology" onModuleChange={vi.fn()} />);
    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });
    expect(waterTab).not.toHaveClass('active');
  });

  it('active tab has aria-selected=true', () => {
    render(<ModuleTabs currentModule="water-level" onModuleChange={vi.fn()} />);
    const tab = screen.getByRole('tab', { name: /vízállás modul/i });
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  it('inactive tabs have aria-selected=false', () => {
    render(<ModuleTabs currentModule="meteorology" onModuleChange={vi.fn()} />);
    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });
    expect(waterTab).toHaveAttribute('aria-selected', 'false');
  });

  it('active tab has aria-current=page', () => {
    render(<ModuleTabs currentModule="drought" onModuleChange={vi.fn()} />);
    const tab = screen.getByRole('tab', { name: /aszály modul/i });
    expect(tab).toHaveAttribute('aria-current', 'page');
  });
});

describe('ModuleTabs - Interactions', () => {
  it('calls onModuleChange with correct module', async () => {
    const onModuleChange = vi.fn();
    render(<ModuleTabs currentModule="meteorology" onModuleChange={onModuleChange} />);
    await userEvent.click(screen.getByRole('tab', { name: /vízállás modul/i }));
    expect(onModuleChange).toHaveBeenCalledWith('water-level');
  });

  it('calls onModuleChange when drought tab clicked', async () => {
    const onModuleChange = vi.fn();
    render(<ModuleTabs currentModule="meteorology" onModuleChange={onModuleChange} />);
    await userEvent.click(screen.getByRole('tab', { name: /aszály modul/i }));
    expect(onModuleChange).toHaveBeenCalledWith('drought');
  });
});

describe('ModuleTabs - Accessibility', () => {
  it('all tabs have aria-label', () => {
    render(<ModuleTabs {...defaultProps} />);
    expect(screen.getByRole('tab', { name: /meteorológiai modul/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /vízállás modul/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aszály modul/i })).toBeInTheDocument();
  });

  it('nav has correct aria-label', () => {
    render(<ModuleTabs {...defaultProps} />);
    const nav = screen.getByRole('tablist');
    expect(nav).toHaveAttribute('aria-label', 'Modul navigáció');
  });
});
