/**
 * StationSelector Component Tests
 *
 * CRITICAL: Tests for module-specific selector validation
 * This selector MUST have exactly 3 stations for the Water Level module
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StationSelector } from './StationSelector';
import { MOCK_STATIONS } from '../../data/mockData';
import type { WaterLevelStation } from '../../types';

describe('StationSelector - Architecture Validation', () => {
  const mockOnChange = vi.fn();
  const validProps = {
    stations: MOCK_STATIONS,
    selectedStation: MOCK_STATIONS[0],
    onStationChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  // CRITICAL TEST: Architecture enforcement
  it('throws error if not exactly 3 stations', () => {
    const invalidStations: WaterLevelStation[] = [MOCK_STATIONS[0], MOCK_STATIONS[1]]; // Only 2

    expect(() => {
      render(
        <StationSelector
          stations={invalidStations}
          selectedStation={null}
          onStationChange={mockOnChange}
        />
      );
    }).toThrow('Expected exactly 3 stations');
  });

  it('throws error with descriptive message for wrong count', () => {
    const oneStation: WaterLevelStation[] = [MOCK_STATIONS[0]]; // Only 1

    expect(() => {
      render(
        <StationSelector
          stations={oneStation}
          selectedStation={null}
          onStationChange={mockOnChange}
        />
      );
    }).toThrow(/Expected exactly 3 stations.*but received 1/);
  });

  it('accepts exactly 3 stations without error', () => {
    expect(() => {
      render(<StationSelector {...validProps} />);
    }).not.toThrow();
  });

  it('validates correct count in MOCK_STATIONS', () => {
    expect(MOCK_STATIONS).toHaveLength(3);
  });
});

describe('StationSelector - Rendering', () => {
  const mockOnChange = vi.fn();
  const props = {
    stations: MOCK_STATIONS,
    selectedStation: MOCK_STATIONS[0],
    onStationChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders the selector button', () => {
    render(<StationSelector {...props} />);
    const button = screen.getByRole('button', { name: /állomás kiválasztása/i });
    expect(button).toBeInTheDocument();
  });

  it('displays selected station name', () => {
    render(<StationSelector {...props} />);
    expect(screen.getByText('Baja')).toBeInTheDocument();
  });

  it('displays placeholder when no station selected', () => {
    render(<StationSelector {...props} selectedStation={null} />);
    expect(screen.getByText('Válassz állomást')).toBeInTheDocument();
  });

  it('renders all 3 station names when dropdown is open', async () => {
    render(<StationSelector {...props} />);

    const button = screen.getByRole('button', { name: /állomás kiválasztása/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Baja')).toHaveLength(2); // Once in button, once in dropdown
    expect(screen.getByText('Mohács')).toBeInTheDocument();
    expect(screen.getByText('Nagybajcs')).toBeInTheDocument();
  });

  it('displays river and city information for each station', async () => {
    render(<StationSelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getAllByText(/Duna/)).toHaveLength(3);
    });
  });

  it('displays critical water levels (LNV, KKV, NV) for each station', async () => {
    render(<StationSelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      // Check for Baja's levels: LNV: 150, KKV: 300, NV: 750
      expect(screen.getByText(/LNV: 150cm/)).toBeInTheDocument();
      expect(screen.getByText(/KKV: 300cm/)).toBeInTheDocument();
      expect(screen.getByText(/NV: 750cm/)).toBeInTheDocument();
    });
  });
});

describe('StationSelector - Interactions', () => {
  const mockOnChange = vi.fn();
  const props = {
    stations: MOCK_STATIONS,
    selectedStation: MOCK_STATIONS[0],
    onStationChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('opens dropdown when button is clicked', async () => {
    render(<StationSelector {...props} />);

    const button = screen.getByRole('button', { name: /állomás kiválasztása/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('closes dropdown when button is clicked again', async () => {
    render(<StationSelector {...props} />);

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

  it('calls onStationChange when station is selected', async () => {
    const user = userEvent.setup();
    render(<StationSelector {...props} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const mohacsOption = screen.getByRole('option', { name: /mohács/i });
    await user.click(mohacsOption);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(MOCK_STATIONS[1]);
  });

  it('closes dropdown after station selection', async () => {
    const user = userEvent.setup();
    render(<StationSelector {...props} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const mohacsOption = screen.getByRole('option', { name: /mohács/i });
    await user.click(mohacsOption);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('highlights selected station in dropdown', async () => {
    render(<StationSelector {...props} selectedStation={MOCK_STATIONS[1]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const selectedOption = screen.getByRole('option', { name: /mohács/i });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });
  });
});

describe('StationSelector - Keyboard Navigation', () => {
  const mockOnChange = vi.fn();
  const props = {
    stations: MOCK_STATIONS,
    selectedStation: MOCK_STATIONS[0],
    onStationChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('closes dropdown on Escape key', async () => {
    render(<StationSelector {...props} />);

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
    render(<StationSelector {...props} />);

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});

describe('StationSelector - Accessibility', () => {
  const mockOnChange = vi.fn();
  const props = {
    stations: MOCK_STATIONS,
    selectedStation: MOCK_STATIONS[0],
    onStationChange: mockOnChange,
  };

  it('has correct ARIA label on button', () => {
    render(<StationSelector {...props} />);
    const button = screen.getByRole('button', { name: /állomás kiválasztása/i });
    expect(button).toHaveAttribute('aria-label', 'Állomás kiválasztása');
  });

  it('has aria-expanded attribute', () => {
    render(<StationSelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('updates aria-expanded when opened', async () => {
    render(<StationSelector {...props} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('has aria-haspopup attribute', () => {
    render(<StationSelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('dropdown has listbox role', async () => {
    render(<StationSelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveAttribute('aria-label', 'Állomások listája');
    });
  });

  it('options have correct aria-selected attributes', async () => {
    render(<StationSelector {...props} selectedStation={MOCK_STATIONS[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);

      // First option should be selected
      expect(options[0]).toHaveAttribute('aria-selected', 'true');

      // Others should not be selected
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
      expect(options[2]).toHaveAttribute('aria-selected', 'false');
    });
  });
});

describe('StationSelector - Styling', () => {
  const mockOnChange = vi.fn();
  const props = {
    stations: MOCK_STATIONS,
    selectedStation: MOCK_STATIONS[0],
    onStationChange: mockOnChange,
  };

  it('applies water module color class to button', () => {
    render(<StationSelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('selector-button-water');
  });

  it('applies selected style to selected option', async () => {
    render(<StationSelector {...props} selectedStation={MOCK_STATIONS[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const selectedOption = screen.getByRole('option', { name: /baja/i });
      expect(selectedOption).toHaveClass('selector-dropdown-item-selected');
    });
  });

  it('applies default style to unselected options', async () => {
    render(<StationSelector {...props} selectedStation={MOCK_STATIONS[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const unselectedOption = screen.getByRole('option', { name: /mohács/i });
      expect(unselectedOption).toHaveClass('selector-dropdown-item');
      expect(unselectedOption).not.toHaveClass('selector-dropdown-item-selected');
    });
  });

  it('accepts custom className prop', () => {
    const { container } = render(
      <StationSelector {...props} className="custom-test-class" />
    );
    const dropdown = container.querySelector('.selector-dropdown');
    expect(dropdown).toHaveClass('custom-test-class');
  });
});
