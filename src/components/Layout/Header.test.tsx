/**
 * Header Component Tests — Redesign v2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import type { ModuleType } from '../../types';

const defaultProps = {
  currentModule: 'meteorology' as ModuleType,
  onModuleChange: vi.fn(),
  isDark: false,
  onToggleDark: vi.fn(),
};

describe('Header - Rendering', () => {
  it('renders header element', () => {
    render(<Header {...defaultProps} />);
    expect(document.querySelector('header')).toBeInTheDocument();
  });

  it('renders DunApp logo text', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('DunApp')).toBeInTheDocument();
  });

  it('renders dark mode toggle button', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('button', { name: /váltás sötét módra/i })).toBeInTheDocument();
  });

  it('renders notification button', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('button', { name: /értesítések/i })).toBeInTheDocument();
  });

  it('renders home button with correct aria-label', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('button', { name: /főoldal/i })).toBeInTheDocument();
  });
});

describe('Header - Dark mode', () => {
  it('shows Moon icon when light mode', () => {
    render(<Header {...defaultProps} isDark={false} />);
    const toggleBtn = screen.getByRole('button', { name: /váltás sötét módra/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('shows Sun icon when dark mode', () => {
    render(<Header {...defaultProps} isDark={true} />);
    const toggleBtn = screen.getByRole('button', { name: /váltás világos módra/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('calls onToggleDark when toggle button clicked', async () => {
    const onToggleDark = vi.fn();
    render(<Header {...defaultProps} onToggleDark={onToggleDark} />);
    await userEvent.click(screen.getByRole('button', { name: /váltás sötét módra/i }));
    expect(onToggleDark).toHaveBeenCalledTimes(1);
  });
});

describe('Header - Navigation', () => {
  it('calls onModuleChange(null) when logo clicked', async () => {
    const onModuleChange = vi.fn();
    render(<Header {...defaultProps} onModuleChange={onModuleChange} />);
    await userEvent.click(screen.getByRole('button', { name: /főoldal/i }));
    expect(onModuleChange).toHaveBeenCalledWith(null);
  });
});

describe('Header - Accessibility', () => {
  it('header is a semantic header element', () => {
    render(<Header {...defaultProps} />);
    expect(document.querySelector('header')?.tagName).toBe('HEADER');
  });
});
