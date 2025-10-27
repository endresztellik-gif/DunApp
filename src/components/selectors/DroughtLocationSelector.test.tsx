/**
 * DroughtLocationSelector Component Tests
 *
 * CRITICAL: Tests for module-specific selector validation
 * This selector MUST have exactly 5 locations for the Drought module
 * This is SEPARATE from WellSelector (which handles 15 wells)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DroughtLocationSelector } from './DroughtLocationSelector';
import { MOCK_DROUGHT_LOCATIONS } from '../../data/mockData';
import type { DroughtLocation } from '../../types';

describe('DroughtLocationSelector - Architecture Validation', () => {
  const mockOnChange = vi.fn();
  const validProps = {
    locations: MOCK_DROUGHT_LOCATIONS,
    selectedLocation: MOCK_DROUGHT_LOCATIONS[0],
    onLocationChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  // CRITICAL TEST: Architecture enforcement
  it('throws error if not exactly 5 locations', () => {
    const invalidLocations: DroughtLocation[] = [
      MOCK_DROUGHT_LOCATIONS[0],
      MOCK_DROUGHT_LOCATIONS[1],
      MOCK_DROUGHT_LOCATIONS[2],
    ]; // Only 3

    expect(() => {
      render(
        <DroughtLocationSelector
          locations={invalidLocations}
          selectedLocation={null}
          onLocationChange={mockOnChange}
        />
      );
    }).toThrow('Expected exactly 5 locations');
  });

  it('throws error with descriptive message for wrong count', () => {
    const fourLocations: DroughtLocation[] = [
      MOCK_DROUGHT_LOCATIONS[0],
      MOCK_DROUGHT_LOCATIONS[1],
      MOCK_DROUGHT_LOCATIONS[2],
      MOCK_DROUGHT_LOCATIONS[3],
    ]; // Only 4

    expect(() => {
      render(
        <DroughtLocationSelector
          locations={fourLocations}
          selectedLocation={null}
          onLocationChange={mockOnChange}
        />
      );
    }).toThrow(/Expected exactly 5 locations.*but received 4/);
  });

  it('accepts exactly 5 locations without error', () => {
    expect(() => {
      render(<DroughtLocationSelector {...validProps} />);
    }).not.toThrow();
  });

  it('validates correct count in MOCK_DROUGHT_LOCATIONS', () => {
    expect(MOCK_DROUGHT_LOCATIONS).toHaveLength(5);
  });

  it('error message mentions WellSelector for wells', () => {
    const invalidLocations: DroughtLocation[] = [MOCK_DROUGHT_LOCATIONS[0]];

    expect(() => {
      render(
        <DroughtLocationSelector
          locations={invalidLocations}
          selectedLocation={null}
          onLocationChange={mockOnChange}
        />
      );
    }).toThrow(/For groundwater wells, use WellSelector instead/);
  });
});

describe('DroughtLocationSelector - Rendering', () => {
  const mockOnChange = vi.fn();
  const props = {
    locations: MOCK_DROUGHT_LOCATIONS,
    selectedLocation: MOCK_DROUGHT_LOCATIONS[0],
    onLocationChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders the selector button', () => {
    render(<DroughtLocationSelector {...props} />);
    const button = screen.getByRole('button', { name: /monitoring helyszín kiválasztása/i });
    expect(button).toBeInTheDocument();
  });

  it('displays selected location name', () => {
    render(<DroughtLocationSelector {...props} />);
    expect(screen.getByText('Katymár')).toBeInTheDocument();
  });

  it('displays placeholder when no location selected', () => {
    render(<DroughtLocationSelector {...props} selectedLocation={null} />);
    expect(screen.getByText('Válassz helyszínt')).toBeInTheDocument();
  });

  it('renders all 5 location names when dropdown is open', async () => {
    render(<DroughtLocationSelector {...props} />);

    const button = screen.getByRole('button', { name: /monitoring helyszín kiválasztása/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Katymár')).toHaveLength(2); // Once in button, once in dropdown
    expect(screen.getByText('Dávod')).toBeInTheDocument();
    expect(screen.getByText('Szederkény')).toBeInTheDocument();
    expect(screen.getByText('Sükösd')).toBeInTheDocument();
    expect(screen.getByText('Csávoly')).toBeInTheDocument();
  });

  it('displays county information for each location', async () => {
    render(<DroughtLocationSelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getAllByText(/Bács-Kiskun megye/)).toHaveLength(4);
      expect(screen.getByText('Tolna megye')).toBeInTheDocument();
    });
  });
});

describe('DroughtLocationSelector - Interactions', () => {
  const mockOnChange = vi.fn();
  const props = {
    locations: MOCK_DROUGHT_LOCATIONS,
    selectedLocation: MOCK_DROUGHT_LOCATIONS[0],
    onLocationChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('opens dropdown when button is clicked', async () => {
    render(<DroughtLocationSelector {...props} />);

    const button = screen.getByRole('button', { name: /monitoring helyszín kiválasztása/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('closes dropdown when button is clicked again', async () => {
    render(<DroughtLocationSelector {...props} />);

    const button = screen.getByRole('button');

    // Open
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Close
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('calls onLocationChange when location is selected', async () => {
    const user = userEvent.setup();
    render(<DroughtLocationSelector {...props} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const davodOption = screen.getByRole('option', { name: /dávod/i });
    await user.click(davodOption);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(MOCK_DROUGHT_LOCATIONS[1]);
  });

  it('closes dropdown after location selection', async () => {
    const user = userEvent.setup();
    render(<DroughtLocationSelector {...props} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const davodOption = screen.getByRole('option', { name: /dávod/i });
    await user.click(davodOption);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('highlights selected location in dropdown', async () => {
    render(<DroughtLocationSelector {...props} selectedLocation={MOCK_DROUGHT_LOCATIONS[1]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const selectedOption = screen.getByRole('option', { name: /dávod/i });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });
  });
});

describe('DroughtLocationSelector - Keyboard Navigation', () => {
  const mockOnChange = vi.fn();
  const props = {
    locations: MOCK_DROUGHT_LOCATIONS,
    selectedLocation: MOCK_DROUGHT_LOCATIONS[0],
    onLocationChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('closes dropdown on Escape key', async () => {
    render(<DroughtLocationSelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    fireEvent.keyDown(button, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('button is keyboard focusable', () => {
    render(<DroughtLocationSelector {...props} />);

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});

describe('DroughtLocationSelector - Accessibility', () => {
  const mockOnChange = vi.fn();
  const props = {
    locations: MOCK_DROUGHT_LOCATIONS,
    selectedLocation: MOCK_DROUGHT_LOCATIONS[0],
    onLocationChange: mockOnChange,
  };

  it('has correct ARIA label on button', () => {
    render(<DroughtLocationSelector {...props} />);
    const button = screen.getByRole('button', { name: /monitoring helyszín kiválasztása/i });
    expect(button).toHaveAttribute('aria-label', 'Monitoring helyszín kiválasztása');
  });

  it('has aria-expanded attribute', () => {
    render(<DroughtLocationSelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('updates aria-expanded when opened', async () => {
    render(<DroughtLocationSelector {...props} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('has aria-haspopup attribute', () => {
    render(<DroughtLocationSelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('dropdown has listbox role', async () => {
    render(<DroughtLocationSelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveAttribute('aria-label', 'Monitoring helyszínek listája');
    });
  });

  it('options have correct aria-selected attributes', async () => {
    render(<DroughtLocationSelector {...props} selectedLocation={MOCK_DROUGHT_LOCATIONS[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(5);

      // First option should be selected
      expect(options[0]).toHaveAttribute('aria-selected', 'true');

      // Others should not be selected
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
      expect(options[2]).toHaveAttribute('aria-selected', 'false');
      expect(options[3]).toHaveAttribute('aria-selected', 'false');
      expect(options[4]).toHaveAttribute('aria-selected', 'false');
    });
  });
});

describe('DroughtLocationSelector - Styling', () => {
  const mockOnChange = vi.fn();
  const props = {
    locations: MOCK_DROUGHT_LOCATIONS,
    selectedLocation: MOCK_DROUGHT_LOCATIONS[0],
    onLocationChange: mockOnChange,
  };

  it('applies drought module color class to button', () => {
    render(<DroughtLocationSelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('selector-button-drought');
  });

  it('applies selected style to selected option', async () => {
    render(<DroughtLocationSelector {...props} selectedLocation={MOCK_DROUGHT_LOCATIONS[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const selectedOption = screen.getByRole('option', { name: /katymár/i });
      expect(selectedOption).toHaveClass('selector-dropdown-item-selected');
    });
  });

  it('applies default style to unselected options', async () => {
    render(<DroughtLocationSelector {...props} selectedLocation={MOCK_DROUGHT_LOCATIONS[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const unselectedOption = screen.getByRole('option', { name: /dávod/i });
      expect(unselectedOption).toHaveClass('selector-dropdown-item');
      expect(unselectedOption).not.toHaveClass('selector-dropdown-item-selected');
    });
  });

  it('accepts custom className prop', () => {
    const { container } = render(
      <DroughtLocationSelector {...props} className="custom-test-class" />
    );
    const dropdown = container.querySelector('.selector-dropdown');
    expect(dropdown).toHaveClass('custom-test-class');
  });
});
