/**
 * EmptyState Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Inbox, Search, AlertCircle } from 'lucide-react';
import { EmptyState } from './EmptyState';

describe('EmptyState - Rendering', () => {
  it('renders message', () => {
    render(<EmptyState message="Nincs elérhető adat" />);
    expect(screen.getByText('Nincs elérhető adat')).toBeInTheDocument();
  });

  it('renders default Inbox icon when no icon provided', () => {
    const { container } = render(<EmptyState message="Test" />);
    const icon = container.querySelector('.empty-state-icon');
    expect(icon).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(<EmptyState icon={Search} message="No results" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        message="No data"
        description="Try adjusting your filters"
      />
    );
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState message="No data" />);
    const description = container.querySelector('.empty-state-text');
    expect(description).not.toBeInTheDocument();
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
    const { container } = render(<EmptyState message="Test" />);
    const icon = container.querySelector('.empty-state-icon');
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
  it('applies empty-state class', () => {
    const { container } = render(<EmptyState message="Test" />);
    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <EmptyState message="Test" className="custom-class" />
    );
    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toHaveClass('custom-class');
  });

  it('applies empty-state-icon class to icon', () => {
    const { container } = render(<EmptyState message="Test" />);
    const icon = container.querySelector('.empty-state-icon');
    expect(icon).toBeInTheDocument();
  });

  it('applies empty-state-text class to description', () => {
    const { container } = render(
      <EmptyState message="Test" description="Description" />
    );
    const description = container.querySelector('.empty-state-text');
    expect(description).toBeInTheDocument();
  });

  it('action button has cyan background color', () => {
    const action = {
      label: 'Action',
      onClick: vi.fn(),
    };

    const { container } = render(<EmptyState message="Test" action={action} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-cyan-600');
  });

  it('action button has hover effect', () => {
    const action = {
      label: 'Action',
      onClick: vi.fn(),
    };

    render(<EmptyState message="Test" action={action} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-cyan-700');
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
    render(
      <EmptyState
        message="No data available"
        description="Please try again later"
      />
    );
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.getByText('Please try again later')).toBeInTheDocument();
  });

  it('renders with message, description, and action', () => {
    const action = {
      label: 'Retry',
      onClick: vi.fn(),
    };

    render(
      <EmptyState
        message="Error loading data"
        description="An error occurred"
        action={action}
      />
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
