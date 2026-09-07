/**
 * EmptyState Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Inbox, Search, AlertCircle } from 'lucide-react';
import { EmptyState } from './EmptyState';

/**
 * A redesign óta nincsenek `.empty-state*` osztályok — a komponens a
 * `dun-card` osztályt és inline design tokeneket használ. A tesztek a régi
 * neveket keresték, ezért 8 teszt bukott.
 *
 * Stabil horgonyok helyettük: a gyökér a `role="status"`, az ikon pedig az
 * azon belüli `aria-hidden="true"` elem. Mindkettő akadálymentességi
 * szerződés, nem stílus — nem törik el a következő restyle-tól.
 */
function getRoot(): HTMLElement {
  return screen.getByRole('status');
}

function getIcon(): HTMLElement {
  const el = getRoot().querySelector('[aria-hidden="true"]');
  if (!el) throw new Error('Az ikon nem található');
  return el as HTMLElement;
}

describe('EmptyState - Rendering', () => {
  it('renders message', () => {
    render(<EmptyState message="Nincs elérhető adat" />);
    expect(screen.getByText('Nincs elérhető adat')).toBeInTheDocument();
  });

  it('renders default Inbox icon when no icon provided', () => {
    render(<EmptyState message="Test" />);
    const icon = getIcon();
    expect(icon).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(<EmptyState icon={Search} message="No results" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState message="No data" description="Try adjusting your filters" />);
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState message="No data" />);
    // Negatív teszt → queryByText (a getByText dobna). Eredetileg
    // `.empty-state-text`-et keresett, ami sosem létezett: mindig `null` jött,
    // így a teszt akkor is zöld lett volna, ha a leírás MEGJELENIK.
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });
});

describe('EmptyState - Action Button', () => {
  it('renders action button when provided', () => {
    const action = {
      label: 'Reload',
      onClick: vi.fn(),
    };

    render(<EmptyState message="Error" action={action} />);
    const button = screen.getByRole('button', { name: /reload/i });
    expect(button).toBeInTheDocument();
  });

  it('does not render action button when not provided', () => {
    render(<EmptyState message="No data" />);
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('calls onClick handler when action button is clicked', () => {
    const onClick = vi.fn();
    const action = {
      label: 'Reload',
      onClick,
    };

    render(<EmptyState message="Error" action={action} />);
    const button = screen.getByRole('button', { name: /reload/i });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('action button has correct label', () => {
    const action = {
      label: 'Custom Action',
      onClick: vi.fn(),
    };

    render(<EmptyState message="Test" action={action} />);
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });
});

describe('EmptyState - Accessibility', () => {
  it('has status role', () => {
    render(<EmptyState message="No data" />);
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
  });

  it('has aria-live attribute', () => {
    render(<EmptyState message="No data" />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('icon has aria-hidden attribute', () => {
    render(<EmptyState message="Test" />);
    const icon = getIcon();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('action button has aria-label', () => {
    const action = {
      label: 'Reload Data',
      onClick: vi.fn(),
    };

    render(<EmptyState message="Error" action={action} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Reload Data');
  });
});

describe('EmptyState - Styling', () => {
  it('renders on the shared card surface', () => {
    render(<EmptyState message="Test" />);
    expect(getRoot()).toHaveClass('dun-card');
  });

  it('accepts custom className', () => {
    render(<EmptyState message="Test" className="custom-class" />);
    expect(getRoot()).toHaveClass('custom-class');
  });

  it('renders an icon that is hidden from assistive technology', () => {
    render(<EmptyState message="Test" />);
    expect(getIcon()).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<EmptyState message="Test" description="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  // A `bg-cyan-600` / `hover:bg-cyan-700` Tailwind-osztályok helyett a gomb
  // azóta design tokent használ. A token neve a szerződés.
  it('action button uses the accent design token', () => {
    render(<EmptyState message="Test" action={{ label: 'Action', onClick: vi.fn() }} />);
    const button = screen.getByRole('button');
    expect(button.style.background).toBe('var(--accent-primary)');
    expect(button.style.color).toBe('var(--text-inverse)');
  });
});

describe('EmptyState - Different Icons', () => {
  it('renders with Inbox icon', () => {
    render(<EmptyState icon={Inbox} message="Empty" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('renders with Search icon', () => {
    render(<EmptyState icon={Search} message="No results" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders with AlertCircle icon', () => {
    render(<EmptyState icon={AlertCircle} message="Alert" />);
    expect(screen.getByText('Alert')).toBeInTheDocument();
  });
});

describe('EmptyState - Content Variations', () => {
  it('renders with only message', () => {
    render(<EmptyState message="Simple message" />);
    expect(screen.getByText('Simple message')).toBeInTheDocument();
  });

  it('renders with message and description', () => {
    render(<EmptyState message="No data available" description="Please try again later" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.getByText('Please try again later')).toBeInTheDocument();
  });

  it('renders with message, description, and action', () => {
    const action = {
      label: 'Retry',
      onClick: vi.fn(),
    };

    render(
      <EmptyState message="Error loading data" description="An error occurred" action={action} />
    );

    expect(screen.getByText('Error loading data')).toBeInTheDocument();
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders with all props including custom icon', () => {
    const action = {
      label: 'Reset',
      onClick: vi.fn(),
    };

    render(
      <EmptyState
        icon={AlertCircle}
        message="Warning"
        description="Something went wrong"
        action={action}
        className="custom"
      />
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });
});
