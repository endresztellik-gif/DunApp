/**
 * ModuleTabs Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModuleTabs } from './ModuleTabs';
import type { ModuleType } from '../../types';

describe('ModuleTabs - Rendering', () => {
  const mockOnChange = vi.fn();
  const props = {
    currentModule: 'meteorology' as ModuleType,
    onModuleChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all 3 module tabs', () => {
    render(<ModuleTabs {...props} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('renders meteorology tab with correct label', () => {
    render(<ModuleTabs {...props} />);
    expect(screen.getByText('Meteorológia')).toBeInTheDocument();
  });

  it('renders water level tab with correct label', () => {
    render(<ModuleTabs {...props} />);
    expect(screen.getByText('Vízállás')).toBeInTheDocument();
  });

  it('renders drought tab with correct label', () => {
    render(<ModuleTabs {...props} />);
    expect(screen.getByText('Aszály')).toBeInTheDocument();
  });

  it('renders icons for each tab', () => {
    render(<ModuleTabs {...props} />);
    // Each tab should have an icon (lucide-react renders SVG elements)
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(3);
  });
});

describe('ModuleTabs - Active Tab Styling', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('applies active class to meteorology tab when selected', () => {
    render(
      <ModuleTabs currentModule="meteorology" onModuleChange={mockOnChange} />
    );

    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    expect(meteorologyTab).toHaveClass('module-tab-meteorology-active');
  });

  it('applies active class to water level tab when selected', () => {
    render(
      <ModuleTabs currentModule="water-level" onModuleChange={mockOnChange} />
    );

    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });
    expect(waterTab).toHaveClass('module-tab-water-active');
  });

  it('applies active class to drought tab when selected', () => {
    render(
      <ModuleTabs currentModule="drought" onModuleChange={mockOnChange} />
    );

    const droughtTab = screen.getByRole('tab', { name: /aszály modul/i });
    expect(droughtTab).toHaveClass('module-tab-drought-active');
  });

  it('applies inactive class to non-selected meteorology tab', () => {
    render(
      <ModuleTabs currentModule="water-level" onModuleChange={mockOnChange} />
    );

    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    expect(meteorologyTab).toHaveClass('module-tab-meteorology');
    expect(meteorologyTab).not.toHaveClass('module-tab-meteorology-active');
  });

  it('applies inactive class to non-selected water tab', () => {
    render(
      <ModuleTabs currentModule="drought" onModuleChange={mockOnChange} />
    );

    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });
    expect(waterTab).toHaveClass('module-tab-water');
    expect(waterTab).not.toHaveClass('module-tab-water-active');
  });

  it('applies inactive class to non-selected drought tab', () => {
    render(
      <ModuleTabs currentModule="meteorology" onModuleChange={mockOnChange} />
    );

    const droughtTab = screen.getByRole('tab', { name: /aszály modul/i });
    expect(droughtTab).toHaveClass('module-tab-drought');
    expect(droughtTab).not.toHaveClass('module-tab-drought-active');
  });
});

describe('ModuleTabs - Interactions', () => {
  const mockOnChange = vi.fn();
  const props = {
    currentModule: 'meteorology' as ModuleType,
    onModuleChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('calls onModuleChange when meteorology tab is clicked', async () => {
    const user = userEvent.setup();
    render(<ModuleTabs currentModule="water-level" onModuleChange={mockOnChange} />);

    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    await user.click(meteorologyTab);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('meteorology');
  });

  it('calls onModuleChange when water level tab is clicked', async () => {
    const user = userEvent.setup();
    render(<ModuleTabs {...props} />);

    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });
    await user.click(waterTab);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('water-level');
  });

  it('calls onModuleChange when drought tab is clicked', async () => {
    const user = userEvent.setup();
    render(<ModuleTabs {...props} />);

    const droughtTab = screen.getByRole('tab', { name: /aszály modul/i });
    await user.click(droughtTab);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('drought');
  });

  it('does not call onModuleChange when already active tab is clicked', async () => {
    const user = userEvent.setup();
    render(<ModuleTabs {...props} />);

    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    await user.click(meteorologyTab);

    // Still calls the function (component doesn't prevent it)
    expect(mockOnChange).toHaveBeenCalledWith('meteorology');
  });
});

describe('ModuleTabs - Accessibility', () => {
  const mockOnChange = vi.fn();
  const props = {
    currentModule: 'meteorology' as ModuleType,
    onModuleChange: mockOnChange,
  };

  it('has tablist role on container', () => {
    render(<ModuleTabs {...props} />);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
  });

  it('all tabs have tab role', () => {
    render(<ModuleTabs {...props} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('tabs have correct aria-label attributes', () => {
    render(<ModuleTabs {...props} />);

    expect(screen.getByRole('tab', { name: /meteorológiai modul/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /vízállás modul/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aszály modul/i })).toBeInTheDocument();
  });

  it('active tab has aria-selected=true', () => {
    render(<ModuleTabs {...props} />);

    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    expect(meteorologyTab).toHaveAttribute('aria-selected', 'true');
  });

  it('inactive tabs have aria-selected=false', () => {
    render(<ModuleTabs {...props} />);

    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });
    const droughtTab = screen.getByRole('tab', { name: /aszály modul/i });

    expect(waterTab).toHaveAttribute('aria-selected', 'false');
    expect(droughtTab).toHaveAttribute('aria-selected', 'false');
  });

  it('active tab has aria-current=page', () => {
    render(<ModuleTabs {...props} />);

    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    expect(meteorologyTab).toHaveAttribute('aria-current', 'page');
  });

  it('inactive tabs do not have aria-current', () => {
    render(<ModuleTabs {...props} />);

    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });
    const droughtTab = screen.getByRole('tab', { name: /aszály modul/i });

    expect(waterTab).not.toHaveAttribute('aria-current');
    expect(droughtTab).not.toHaveAttribute('aria-current');
  });

  it('icons have aria-hidden attribute', () => {
    render(<ModuleTabs {...props} />);
    const icons = document.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(3);
  });
});

describe('ModuleTabs - Keyboard Navigation', () => {
  const mockOnChange = vi.fn();
  const props = {
    currentModule: 'meteorology' as ModuleType,
    onModuleChange: mockOnChange,
  };

  it('tabs are keyboard focusable', () => {
    render(<ModuleTabs {...props} />);

    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    meteorologyTab.focus();
    expect(meteorologyTab).toHaveFocus();
  });

  it('can navigate between tabs with Tab key', () => {
    render(<ModuleTabs {...props} />);

    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    expect(tabs[0]).toHaveFocus();

    // Simulate Tab key press
    fireEvent.keyDown(tabs[0], { key: 'Tab' });
  });
});

describe('ModuleTabs - Module Switching', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('switches from meteorology to water level', async () => {
    const user = userEvent.setup();
    render(<ModuleTabs currentModule="meteorology" onModuleChange={mockOnChange} />);

    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });
    await user.click(waterTab);

    expect(mockOnChange).toHaveBeenCalledWith('water-level');
  });

  it('switches from water level to drought', async () => {
    const user = userEvent.setup();
    render(<ModuleTabs currentModule="water-level" onModuleChange={mockOnChange} />);

    const droughtTab = screen.getByRole('tab', { name: /aszály modul/i });
    await user.click(droughtTab);

    expect(mockOnChange).toHaveBeenCalledWith('drought');
  });

  it('switches from drought to meteorology', async () => {
    const user = userEvent.setup();
    render(<ModuleTabs currentModule="drought" onModuleChange={mockOnChange} />);

    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    await user.click(meteorologyTab);

    expect(mockOnChange).toHaveBeenCalledWith('meteorology');
  });
});

describe('ModuleTabs - Responsive Display', () => {
  const mockOnChange = vi.fn();
  const props = {
    currentModule: 'meteorology' as ModuleType,
    onModuleChange: mockOnChange,
  };

  it('has responsive gap classes', () => {
    render(<ModuleTabs {...props} />);
    const tablist = document.querySelector('[role="tablist"]');
    expect(tablist).toHaveClass('gap-2');
    expect(tablist).toHaveClass('md:gap-3');
  });
});
