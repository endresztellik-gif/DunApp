/**
 * CitySelector Component Tests
 *
 * CRITICAL: Tests for module-specific selector validation
 * This selector MUST have exactly 4 cities for the Meteorology module
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CitySelector } from './CitySelector';
import { MOCK_CITIES } from '../../data/mockData';
import type { City } from '../../types';

describe('CitySelector - Architecture Validation', () => {
  const mockOnChange = vi.fn();
  const validProps = {
    cities: MOCK_CITIES,
    selectedCity: MOCK_CITIES[0],
    onCityChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  // CRITICAL TEST: Architecture enforcement
  it('throws error if not exactly 4 cities', () => {
    const invalidCities: City[] = [MOCK_CITIES[0], MOCK_CITIES[1], MOCK_CITIES[2]]; // Only 3

    expect(() => {
      render(
        <CitySelector
          cities={invalidCities}
          selectedCity={null}
          onCityChange={mockOnChange}
        />
      );
    }).toThrow('Expected exactly 4 cities');
  });

  it('throws error with descriptive message for wrong count', () => {
    const twoCity: City[] = [MOCK_CITIES[0], MOCK_CITIES[1]]; // Only 2

    expect(() => {
      render(
        <CitySelector cities={twoCity} selectedCity={null} onCityChange={mockOnChange} />
      );
    }).toThrow(/Expected exactly 4 cities.*but received 2/);
  });

  it('accepts exactly 4 cities without error', () => {
    expect(() => {
      render(<CitySelector {...validProps} />);
    }).not.toThrow();
  });

  it('validates correct count in MOCK_CITIES', () => {
    expect(MOCK_CITIES).toHaveLength(4);
  });
});

describe('CitySelector - Rendering', () => {
  const mockOnChange = vi.fn();
  const props = {
    cities: MOCK_CITIES,
    selectedCity: MOCK_CITIES[0],
    onCityChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders the selector button', () => {
    render(<CitySelector {...props} />);
    const button = screen.getByRole('button', { name: /település kiválasztása/i });
    expect(button).toBeInTheDocument();
  });

  it('displays selected city name', () => {
    render(<CitySelector {...props} />);
    expect(screen.getByText('Szekszárd')).toBeInTheDocument();
  });

  it('displays placeholder when no city selected', () => {
    render(<CitySelector {...props} selectedCity={null} />);
    expect(screen.getByText('Válassz várost')).toBeInTheDocument();
  });

  it('renders all 4 city names when dropdown is open', async () => {
    render(<CitySelector {...props} />);

    const button = screen.getByRole('button', { name: /település kiválasztása/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Use getAllByText since city names appear multiple times
    expect(screen.getAllByText('Szekszárd').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Baja').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dunaszekcső').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mohács').length).toBeGreaterThan(0);
  });

  it('displays county information for each city', async () => {
    render(<CitySelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();

      // Check that county information is present
      const countyTexts = screen.getAllByText(/megye/);
      expect(countyTexts.length).toBeGreaterThanOrEqual(4);
    });
  });
});

describe('CitySelector - Interactions', () => {
  const mockOnChange = vi.fn();
  const props = {
    cities: MOCK_CITIES,
    selectedCity: MOCK_CITIES[0],
    onCityChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('opens dropdown when button is clicked', async () => {
    render(<CitySelector {...props} />);

    const button = screen.getByRole('button', { name: /település kiválasztása/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('closes dropdown when button is clicked again', async () => {
    render(<CitySelector {...props} />);

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

  it('calls onCityChange when city is selected', async () => {
    const user = userEvent.setup();
    render(<CitySelector {...props} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const bajaOption = screen.getByRole('option', { name: /baja/i });
    await user.click(bajaOption);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(MOCK_CITIES[1]);
  });

  it('closes dropdown after city selection', async () => {
    const user = userEvent.setup();
    render(<CitySelector {...props} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const bajaOption = screen.getByRole('option', { name: /baja/i });
    await user.click(bajaOption);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('highlights selected city in dropdown', async () => {
    render(<CitySelector {...props} selectedCity={MOCK_CITIES[1]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const selectedOption = screen.getByRole('option', { name: /baja/i });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });
  });
});

describe('CitySelector - Keyboard Navigation', () => {
  const mockOnChange = vi.fn();
  const props = {
    cities: MOCK_CITIES,
    selectedCity: MOCK_CITIES[0],
    onCityChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('closes dropdown on Escape key', async () => {
    render(<CitySelector {...props} />);

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
    render(<CitySelector {...props} />);

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});

describe('CitySelector - Accessibility', () => {
  const mockOnChange = vi.fn();
  const props = {
    cities: MOCK_CITIES,
    selectedCity: MOCK_CITIES[0],
    onCityChange: mockOnChange,
  };

  it('has correct ARIA label on button', () => {
    render(<CitySelector {...props} />);
    const button = screen.getByRole('button', { name: /település kiválasztása/i });
    expect(button).toHaveAttribute('aria-label', 'Település kiválasztása');
  });

  it('has aria-expanded attribute', () => {
    render(<CitySelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('updates aria-expanded when opened', async () => {
    render(<CitySelector {...props} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('has aria-haspopup attribute', () => {
    render(<CitySelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('dropdown has listbox role', async () => {
    render(<CitySelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveAttribute('aria-label', 'Települések listája');
    });
  });

  it('options have correct aria-selected attributes', async () => {
    render(<CitySelector {...props} selectedCity={MOCK_CITIES[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);

      // First option should be selected
      expect(options[0]).toHaveAttribute('aria-selected', 'true');

      // Others should not be selected
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
      expect(options[2]).toHaveAttribute('aria-selected', 'false');
      expect(options[3]).toHaveAttribute('aria-selected', 'false');
    });
  });
});

describe('CitySelector - Styling', () => {
  const mockOnChange = vi.fn();
  const props = {
    cities: MOCK_CITIES,
    selectedCity: MOCK_CITIES[0],
    onCityChange: mockOnChange,
  };

  it('applies meteorology color class to button', () => {
    render(<CitySelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('selector-button-meteorology');
  });

  it('applies selected style to selected option', async () => {
    render(<CitySelector {...props} selectedCity={MOCK_CITIES[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const selectedOption = screen.getByRole('option', { name: /szekszárd/i });
      expect(selectedOption).toHaveClass('selector-dropdown-item-selected');
    });
  });

  it('applies default style to unselected options', async () => {
    render(<CitySelector {...props} selectedCity={MOCK_CITIES[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const unselectedOption = screen.getByRole('option', { name: /baja/i });
      expect(unselectedOption).toHaveClass('selector-dropdown-item');
      expect(unselectedOption).not.toHaveClass('selector-dropdown-item-selected');
    });
  });

  it('accepts custom className prop', () => {
    const { container } = render(
      <CitySelector {...props} className="custom-test-class" />
    );
    const dropdown = container.querySelector('.selector-dropdown');
    expect(dropdown).toHaveClass('custom-test-class');
  });
});
