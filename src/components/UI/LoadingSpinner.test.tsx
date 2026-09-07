/**
 * LoadingSpinner Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * A forgó elemnek soha nem volt `.spinner` osztálya a redesign óta — a
 * tesztek a régi osztálynevet keresték, ezért 9 teszt bukott. A forgó div-et
 * az `aria-hidden="true"` azonosítja: ez akadálymentességi szerződés
 * (a képernyőolvasó a `role="status"` szövegét olvassa, a grafikát nem),
 * tehát stabilabb horgony, mint bármelyik Tailwind utility-osztály.
 */
function getSpinner(): HTMLElement {
  const el = document.querySelector('[role="status"] [aria-hidden="true"]');
  if (!el) throw new Error('A spinner elem nem található');
  return el as HTMLElement;
}

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
    const spinner = getSpinner();
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
    const spinner = getSpinner();
    expect(spinner).toHaveClass('h-6');
    expect(spinner).toHaveClass('w-6');
    expect(spinner).toHaveClass('border-2');
  });

  it('applies medium size classes by default', () => {
    render(<LoadingSpinner />);
    const spinner = getSpinner();
    expect(spinner).toHaveClass('h-8');
    expect(spinner).toHaveClass('w-8');
    expect(spinner).toHaveClass('border-4');
  });

  it('applies medium size classes when specified', () => {
    render(<LoadingSpinner size="md" />);
    const spinner = getSpinner();
    expect(spinner).toHaveClass('h-8');
    expect(spinner).toHaveClass('w-8');
    expect(spinner).toHaveClass('border-4');
  });

  it('applies large size classes', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = getSpinner();
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
    const spinner = getSpinner();
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('LoadingSpinner - Styling', () => {
  // A `border-cyan-600` Tailwind-osztály helyett a komponens azóta design
  // tokent használ (`var(--accent-primary)`). A token neve a szerződés — arra
  // állítunk, nem egy konkrét színosztályra.
  it('uses the accent design token for the spinner colour', () => {
    render(<LoadingSpinner />);
    const spinner = getSpinner();
    // A jsdom a két beállítást egyetlen shorthanddé vonja össze
    // ("transparent var(--accent-primary) var(--accent-primary)") és a
    // longhandeket nem bontja ki `var()` érték mellett — a borderBottomColor
    // üres sztringet adna. Ezért a shorthandben keressük a tokent, a
    // felső oldalt viszont önállóan is meg tudjuk kérdezni.
    expect(spinner.style.borderColor).toContain('var(--accent-primary)');
    expect(spinner.style.borderTopColor).toBe('transparent');
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

  // Ugyanez az üzenetnél: a `p` már nem visel Tailwind-osztályt, a
  // tipográfiát design tokenek adják.
  it('message uses the secondary text and small size tokens', () => {
    const { container } = render(<LoadingSpinner message="Wait" />);
    const message = container.querySelector('p') as HTMLElement;
    expect(message).toBeInTheDocument();
    expect(message.style.color).toBe('var(--text-secondary)');
    expect(message.style.fontSize).toBe('var(--text-sm)');
  });
});
