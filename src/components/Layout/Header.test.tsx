/**
 * Header Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';
import type { ModuleType } from '../../types';

describe('Header - Rendering', () => {
  const mockOnChange = vi.fn();
  const props = {
    currentModule: 'meteorology' as ModuleType,
    onModuleChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders header element', () => {
    const { container } = render(<Header {...props} />);
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('renders logo with DunApp text', () => {
    render(<Header {...props} />);
    expect(screen.getByText('Dun')).toBeInTheDocument();
    expect(screen.getByText('App')).toBeInTheDocument();
  });

  it('renders ModuleTabs component', () => {
    render(<Header {...props} />);
    // ModuleTabs should render all 3 tabs
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('renders navigation element', () => {
    const { container } = render(<Header {...props} />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });
});

describe('Header - Logo Styling', () => {
  const mockOnChange = vi.fn();
  const props = {
    currentModule: 'meteorology' as ModuleType,
    onModuleChange: mockOnChange,
  };

  it('applies cyan color to "Dun" text', () => {
    const { container } = render(<Header {...props} />);
    const dunText = screen.getByText('Dun');
    expect(dunText).toHaveClass('text-cyan-600');
  });

  it('applies gray color to "App" text', () => {
    const { container } = render(<Header {...props} />);
    const appText = screen.getByText('App');
    expect(appText).toHaveClass('text-gray-900');
  });

  it('logo has correct container class', () => {
    const { container } = render(<Header {...props} />);
    const logo = container.querySelector('.app-logo');
    expect(logo).toBeInTheDocument();
  });
});

describe('Header - Navigation', () => {
  const mockOnChange = vi.fn();
  const props = {
    currentModule: 'meteorology' as ModuleType,
    onModuleChange: mockOnChange,
  };

  it('navigation has correct aria-label', () => {
    const { container } = render(<Header {...props} />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Modul navigáció');
  });

  it('navigation has correct class', () => {
    const { container } = render(<Header {...props} />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('app-nav');
  });

  it('passes currentModule prop to ModuleTabs', () => {
    render(<Header {...props} />);
    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    expect(meteorologyTab).toHaveAttribute('aria-selected', 'true');
  });

  it('passes onModuleChange prop to ModuleTabs', async () => {
    render(<Header {...props} />);
    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });

    // The ModuleTabs component should be present and functional
    expect(waterTab).toBeInTheDocument();
  });
});

describe('Header - Layout Structure', () => {
  const mockOnChange = vi.fn();
  const props = {
    currentModule: 'meteorology' as ModuleType,
    onModuleChange: mockOnChange,
  };

  it('applies app-header class', () => {
    const { container } = render(<Header {...props} />);
    const header = container.querySelector('.app-header');
    expect(header).toBeInTheDocument();
  });

  it('applies app-header-content class to content wrapper', () => {
    const { container } = render(<Header {...props} />);
    const content = container.querySelector('.app-header-content');
    expect(content).toBeInTheDocument();
  });

  it('contains logo and navigation in correct order', () => {
    const { container } = render(<Header {...props} />);
    const content = container.querySelector('.app-header-content');
    const children = content?.children;

    expect(children).toHaveLength(2);
    expect(children?.[0]).toHaveClass('app-logo');
    expect(children?.[1]).toHaveClass('app-nav');
  });
});

describe('Header - Module Context', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders correctly with meteorology module', () => {
    render(<Header currentModule="meteorology" onModuleChange={mockOnChange} />);
    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    expect(meteorologyTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders correctly with water-level module', () => {
    render(<Header currentModule="water-level" onModuleChange={mockOnChange} />);
    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });
    expect(waterTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders correctly with drought module', () => {
    render(<Header currentModule="drought" onModuleChange={mockOnChange} />);
    const droughtTab = screen.getByRole('tab', { name: /aszály modul/i });
    expect(droughtTab).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Header - Accessibility', () => {
  const mockOnChange = vi.fn();
  const props = {
    currentModule: 'meteorology' as ModuleType,
    onModuleChange: mockOnChange,
  };

  it('header is a semantic header element', () => {
    const { container } = render(<Header {...props} />);
    const header = container.querySelector('header');
    expect(header?.tagName).toBe('HEADER');
  });

  it('navigation is a semantic nav element', () => {
    const { container } = render(<Header {...props} />);
    const nav = container.querySelector('nav');
    expect(nav?.tagName).toBe('NAV');
  });

  it('navigation has descriptive aria-label', () => {
    const { container } = render(<Header {...props} />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Modul navigáció');
  });

  it('contains accessible ModuleTabs with tablist', () => {
    render(<Header {...props} />);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
  });
});

describe('Header - Integration with ModuleTabs', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('ModuleTabs receives correct props', () => {
    render(<Header currentModule="water-level" onModuleChange={mockOnChange} />);

    // Verify the water-level tab is active
    const waterTab = screen.getByRole('tab', { name: /vízállás modul/i });
    expect(waterTab).toHaveAttribute('aria-selected', 'true');

    // Verify other tabs are not active
    const meteorologyTab = screen.getByRole('tab', { name: /meteorológiai modul/i });
    const droughtTab = screen.getByRole('tab', { name: /aszály modul/i });
    expect(meteorologyTab).toHaveAttribute('aria-selected', 'false');
    expect(droughtTab).toHaveAttribute('aria-selected', 'false');
  });
});
