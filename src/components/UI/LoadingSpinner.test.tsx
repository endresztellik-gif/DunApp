/**
 * LoadingSpinner Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner - Rendering', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);
    const messages = screen.getAllByText('Betöltés...');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Adatok betöltése..." />);
    const messages = screen.getAllByText('Adatok betöltése...');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('renders spinner element', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('does not render message when empty string provided', () => {
    render(<LoadingSpinner message="" />);
    expect(screen.queryByText('Betöltés...')).not.toBeInTheDocument();
  });
});

describe('LoadingSpinner - Sizes', () => {
  it('applies small size classes', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveClass('h-6');
    expect(spinner).toHaveClass('w-6');
    expect(spinner).toHaveClass('border-2');
  });

  it('applies medium size classes by default', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveClass('h-8');
    expect(spinner).toHaveClass('w-8');
    expect(spinner).toHaveClass('border-4');
  });

  it('applies medium size classes when specified', () => {
    render(<LoadingSpinner size="md" />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveClass('h-8');
    expect(spinner).toHaveClass('w-8');
    expect(spinner).toHaveClass('border-4');
  });

  it('applies large size classes', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveClass('h-12');
    expect(spinner).toHaveClass('w-12');
    expect(spinner).toHaveClass('border-4');
  });
});

describe('LoadingSpinner - Accessibility', () => {
  it('has status role', () => {
    render(<LoadingSpinner />);
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
  });

  it('has aria-live attribute', () => {
    render(<LoadingSpinner />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('has screen reader text', () => {
    render(<LoadingSpinner message="Loading data" />);
    const srText = screen.getByText((content, element): boolean => {
      return Boolean(element?.classList.contains('sr-only') && content === 'Loading data');
    });
    expect(srText).toBeInTheDocument();
  });

  it('spinner has aria-hidden attribute', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('LoadingSpinner - Styling', () => {
  it('applies cyan color to spinner', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveClass('border-cyan-600');
  });

  it('applies default flex layout', () => {
    const { container } = render(<LoadingSpinner />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('flex-col');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });

  it('accepts custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });
});

describe('LoadingSpinner - Message Display', () => {
  it('displays message text', () => {
    render(<LoadingSpinner message="Please wait..." />);
    const messages = screen.getAllByText('Please wait...');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('message has correct text color', () => {
    render(<LoadingSpinner message="Wait" />);
    const message = document.querySelector('p.text-sm');
    expect(message).toHaveClass('text-gray-600');
  });

  it('message has correct text size', () => {
    render(<LoadingSpinner message="Wait" />);
    const message = document.querySelector('p.text-sm');
    expect(message).toHaveClass('text-sm');
  });
});
