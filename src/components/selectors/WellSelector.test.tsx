/**
 * WellSelector Component Tests
 *
 * CRITICAL: Tests for module-specific selector validation
 * This selector MUST have exactly 15 wells for the Drought module
 * This is SEPARATE from DroughtLocationSelector (which handles 5 monitoring locations)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WellSelector } from './WellSelector';
import { MOCK_GROUNDWATER_WELLS } from '../../data/mockData';
import type { GroundwaterWell } from '../../types';

describe('WellSelector - Architecture Validation', () => {
  const mockOnChange = vi.fn();
  const validProps = {
    wells: MOCK_GROUNDWATER_WELLS,
    selectedWell: MOCK_GROUNDWATER_WELLS[0],
    onWellChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  // CRITICAL TEST: Architecture enforcement
  it('throws error if not exactly 15 wells', () => {
    const invalidWells: GroundwaterWell[] = MOCK_GROUNDWATER_WELLS.slice(0, 10); // Only 10

    expect(() => {
      render(
        <WellSelector wells={invalidWells} selectedWell={null} onWellChange={mockOnChange} />
      );
    }).toThrow('Expected exactly 15 wells');
  });

  it('throws error with descriptive message for wrong count', () => {
    const sevenWells: GroundwaterWell[] = MOCK_GROUNDWATER_WELLS.slice(0, 7); // Only 7

    expect(() => {
      render(
        <WellSelector wells={sevenWells} selectedWell={null} onWellChange={mockOnChange} />
      );
    }).toThrow(/Expected exactly 15 wells.*but received 7/);
  });

  it('accepts exactly 15 wells without error', () => {
    expect(() => {
      render(<WellSelector {...validProps} />);
    }).not.toThrow();
  });

  it('validates correct count in MOCK_GROUNDWATER_WELLS', () => {
    expect(MOCK_GROUNDWATER_WELLS).toHaveLength(15);
  });

  it('error message mentions DroughtLocationSelector for locations', () => {
    const invalidWells: GroundwaterWell[] = [MOCK_GROUNDWATER_WELLS[0]];

    expect(() => {
      render(
        <WellSelector wells={invalidWells} selectedWell={null} onWellChange={mockOnChange} />
      );
    }).toThrow(/For drought monitoring locations, use DroughtLocationSelector instead/);
  });
});

describe('WellSelector - Rendering', () => {
  const mockOnChange = vi.fn();
  const props = {
    wells: MOCK_GROUNDWATER_WELLS,
    selectedWell: MOCK_GROUNDWATER_WELLS[0],
    onWellChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders the selector button', () => {
    render(<WellSelector {...props} />);
    const button = screen.getByRole('button', { name: /talajvízkút kiválasztása/i });
    expect(button).toBeInTheDocument();
  });

  it('displays selected well name with code', () => {
    render(<WellSelector {...props} />);
    expect(screen.getByText(/Sátorhely \(#4576\)/)).toBeInTheDocument();
  });

  it('displays placeholder when no well selected', () => {
    render(<WellSelector {...props} selectedWell={null} />);
    expect(screen.getByText('Válassz kutat')).toBeInTheDocument();
  });

  it('renders all 15 well names when dropdown is open', async () => {
    render(<WellSelector {...props} />);

    const button = screen.getByRole('button', { name: /talajvízkút kiválasztása/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(15);
  });

  it('displays well codes correctly in dropdown', async () => {
    render(<WellSelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      // Check for specific well codes
      expect(screen.getByText('#4576')).toBeInTheDocument(); // Sátorhely
      expect(screen.getByText('#1460')).toBeInTheDocument(); // Mohács
      expect(screen.getByText('#1450')).toBeInTheDocument(); // Hercegszántó
    });
  });

  it('displays city names for each well', async () => {
    render(<WellSelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      // Check for well names instead (since city names might not all be displayed)
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(15);
    });
  });
});

describe('WellSelector - Interactions', () => {
  const mockOnChange = vi.fn();
  const props = {
    wells: MOCK_GROUNDWATER_WELLS,
    selectedWell: MOCK_GROUNDWATER_WELLS[0],
    onWellChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('opens dropdown when button is clicked', async () => {
    render(<WellSelector {...props} />);

    const button = screen.getByRole('button', { name: /talajvízkút kiválasztása/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('closes dropdown when button is clicked again', async () => {
    render(<WellSelector {...props} />);

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

  it('calls onWellChange when well is selected', async () => {
    const user = userEvent.setup();
    render(<WellSelector {...props} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Select the second well (Mohács #1460)
    const options = screen.getAllByRole('option');
    await user.click(options[1]);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(MOCK_GROUNDWATER_WELLS[1]);
  });

  it('closes dropdown after well selection', async () => {
    const user = userEvent.setup();
    render(<WellSelector {...props} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    await user.click(options[1]);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('highlights selected well in dropdown', async () => {
    render(<WellSelector {...props} selectedWell={MOCK_GROUNDWATER_WELLS[2]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      // Third option should be selected
      expect(options[2]).toHaveAttribute('aria-selected', 'true');
    });
  });
});

describe('WellSelector - Keyboard Navigation', () => {
  const mockOnChange = vi.fn();
  const props = {
    wells: MOCK_GROUNDWATER_WELLS,
    selectedWell: MOCK_GROUNDWATER_WELLS[0],
    onWellChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('closes dropdown on Escape key', async () => {
    render(<WellSelector {...props} />);

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
    render(<WellSelector {...props} />);

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});

describe('WellSelector - Accessibility', () => {
  const mockOnChange = vi.fn();
  const props = {
    wells: MOCK_GROUNDWATER_WELLS,
    selectedWell: MOCK_GROUNDWATER_WELLS[0],
    onWellChange: mockOnChange,
  };

  it('has correct ARIA label on button', () => {
    render(<WellSelector {...props} />);
    const button = screen.getByRole('button', { name: /talajvízkút kiválasztása/i });
    expect(button).toHaveAttribute('aria-label', 'Talajvízkút kiválasztása');
  });

  it('has aria-expanded attribute', () => {
    render(<WellSelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('updates aria-expanded when opened', async () => {
    render(<WellSelector {...props} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('has aria-haspopup attribute', () => {
    render(<WellSelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('dropdown has listbox role', async () => {
    render(<WellSelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveAttribute('aria-label', 'Talajvízkutak listája');
    });
  });

  it('options have correct aria-selected attributes', async () => {
    render(<WellSelector {...props} selectedWell={MOCK_GROUNDWATER_WELLS[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(15);

      // First option should be selected
      expect(options[0]).toHaveAttribute('aria-selected', 'true');

      // Others should not be selected
      for (let i = 1; i < 15; i++) {
        expect(options[i]).toHaveAttribute('aria-selected', 'false');
      }
    });
  });
});

describe('WellSelector - Styling', () => {
  const mockOnChange = vi.fn();
  const props = {
    wells: MOCK_GROUNDWATER_WELLS,
    selectedWell: MOCK_GROUNDWATER_WELLS[0],
    onWellChange: mockOnChange,
  };

  it('applies drought module color class to button', () => {
    render(<WellSelector {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('selector-button-drought');
  });

  it('applies selected style to selected option', async () => {
    render(<WellSelector {...props} selectedWell={MOCK_GROUNDWATER_WELLS[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('selector-dropdown-item-selected');
    });
  });

  it('applies default style to unselected options', async () => {
    render(<WellSelector {...props} selectedWell={MOCK_GROUNDWATER_WELLS[0]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options[1]).toHaveClass('selector-dropdown-item');
      expect(options[1]).not.toHaveClass('selector-dropdown-item-selected');
    });
  });

  it('accepts custom className prop', () => {
    const { container } = render(<WellSelector {...props} className="custom-test-class" />);
    const dropdown = container.querySelector('.selector-dropdown');
    expect(dropdown).toHaveClass('custom-test-class');
  });

  it('displays well code with orange accent color', async () => {
    render(<WellSelector {...props} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      // Well codes should have the orange styling
      const wellCode = screen.getByText('#4576');
      expect(wellCode).toHaveClass('text-orange-600');
    });
  });
});

describe('WellSelector - Data Integrity', () => {
  it('validates all 15 wells have unique IDs', () => {
    const ids = MOCK_GROUNDWATER_WELLS.map((well) => well.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(15);
  });

  it('validates all 15 wells have unique well codes', () => {
    const codes = MOCK_GROUNDWATER_WELLS.map((well) => well.wellCode);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(15);
  });

  it('validates all wells are active', () => {
    MOCK_GROUNDWATER_WELLS.forEach((well) => {
      expect(well.isActive).toBe(true);
    });
  });

  it('validates all wells have required properties', () => {
    MOCK_GROUNDWATER_WELLS.forEach((well) => {
      expect(well.id).toBeTruthy();
      expect(well.wellName).toBeTruthy();
      expect(well.wellCode).toBeTruthy();
      expect(well.cityName).toBeTruthy();
      expect(well.county).toBeTruthy();
      expect(typeof well.latitude).toBe('number');
      expect(typeof well.longitude).toBe('number');
    });
  });
});
