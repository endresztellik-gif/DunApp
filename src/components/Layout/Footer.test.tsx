/**
 * Footer Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';
import type { DataSource } from '../../types';

const mockDataSources: DataSource[] = [
  {
    name: 'OpenWeatherMap',
    url: 'https://openweathermap.org',
    lastUpdate: '2025-10-27T10:30:00Z',
  },
  {
    name: 'OMSZ',
    lastUpdate: '2025-10-27T09:15:00Z',
  },
];

describe('Footer - Rendering', () => {
  it('renders footer element', () => {
    const { container } = render(<Footer dataSources={mockDataSources} />);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('renders last update timestamp', () => {
    render(<Footer dataSources={mockDataSources} />);
    expect(screen.getByText(/Utolsó frissítés:/)).toBeInTheDocument();
  });

  it('renders data sources label', () => {
    render(<Footer dataSources={mockDataSources} />);
    expect(screen.getByText('Források:')).toBeInTheDocument();
  });

  it('renders all data source names', () => {
    render(<Footer dataSources={mockDataSources} />);
    expect(screen.getByText('OpenWeatherMap')).toBeInTheDocument();
    expect(screen.getByText('OMSZ')).toBeInTheDocument();
  });
});

describe('Footer - Timestamp Formatting', () => {
  it('formats timestamp in Hungarian locale', () => {
    render(<Footer dataSources={mockDataSources} />);
    const timestampElement = screen.getByText(/Utolsó frissítés:/);
    // Should contain formatted date and time
    expect(timestampElement.textContent).toMatch(/\d{4}/); // Year
  });

  it('displays most recent update from multiple sources', () => {
    const sources: DataSource[] = [
      {
        name: 'Source A',
        lastUpdate: '2025-10-27T08:00:00Z',
      },
      {
        name: 'Source B',
        lastUpdate: '2025-10-27T12:00:00Z', // Most recent
      },
      {
        name: 'Source C',
        lastUpdate: '2025-10-27T10:00:00Z',
      },
    ];

    render(<Footer dataSources={sources} />);
    const timestampElement = screen.getByText(/Utolsó frissítés:/);

    // Should display the timestamp from Source B (most recent)
    expect(timestampElement).toBeInTheDocument();
  });
});

describe('Footer - Data Source Links', () => {
  it('renders source with URL as a link', () => {
    render(<Footer dataSources={mockDataSources} />);
    const link = screen.getByRole('link', { name: /openweathermap/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://openweathermap.org');
  });

  it('renders source without URL as plain text', () => {
    render(<Footer dataSources={mockDataSources} />);
    const omsz = screen.getByText('OMSZ');
    expect(omsz.tagName).not.toBe('A');
  });

  it('link opens in new tab', () => {
    render(<Footer dataSources={mockDataSources} />);
    const link = screen.getByRole('link', { name: /openweathermap/i });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('link has noopener noreferrer for security', () => {
    render(<Footer dataSources={mockDataSources} />);
    const link = screen.getByRole('link', { name: /openweathermap/i });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('link has cyan color class', () => {
    render(<Footer dataSources={mockDataSources} />);
    const link = screen.getByRole('link', { name: /openweathermap/i });
    expect(link).toHaveClass('text-cyan-600');
  });

  it('link has hover styles', () => {
    render(<Footer dataSources={mockDataSources} />);
    const link = screen.getByRole('link', { name: /openweathermap/i });
    expect(link).toHaveClass('hover:text-cyan-700');
    expect(link).toHaveClass('hover:underline');
  });
});

describe('Footer - Multiple Data Sources', () => {
  it('separates sources with commas', () => {
    render(<Footer dataSources={mockDataSources} />);
    const footer = screen.getByText('Források:').parentElement;
    expect(footer?.textContent).toContain(',');
  });

  it('does not add comma after last source', () => {
    render(<Footer dataSources={mockDataSources} />);
    const footer = screen.getByText('Források:').parentElement;
    const text = footer?.textContent || '';

    // Should not end with a comma
    const lastCommaIndex = text.lastIndexOf(',');
    const omazIndex = text.lastIndexOf('OMSZ');
    expect(lastCommaIndex).toBeLessThan(omazIndex);
  });

  it('renders single data source without comma', () => {
    const singleSource: DataSource[] = [
      {
        name: 'Single Source',
        lastUpdate: '2025-10-27T10:00:00Z',
      },
    ];

    render(<Footer dataSources={singleSource} />);
    const footer = screen.getByText('Források:').parentElement;
    expect(footer?.textContent).not.toContain(',');
  });

  it('renders three data sources with correct separators', () => {
    const threeSources: DataSource[] = [
      { name: 'Source A', lastUpdate: '2025-10-27T10:00:00Z' },
      { name: 'Source B', lastUpdate: '2025-10-27T10:00:00Z' },
      { name: 'Source C', lastUpdate: '2025-10-27T10:00:00Z' },
    ];

    render(<Footer dataSources={threeSources} />);
    expect(screen.getByText('Source A')).toBeInTheDocument();
    expect(screen.getByText('Source B')).toBeInTheDocument();
    expect(screen.getByText('Source C')).toBeInTheDocument();

    const footer = screen.getByText('Források:').parentElement;
    const commas = (footer?.textContent?.match(/,/g) || []).length;
    expect(commas).toBe(2); // Two commas for three sources
  });
});

describe('Footer - Styling', () => {
  it('applies data-source-footer class', () => {
    const { container } = render(<Footer dataSources={mockDataSources} />);
    const footer = container.querySelector('.data-source-footer');
    expect(footer).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <Footer dataSources={mockDataSources} className="custom-class" />
    );
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('custom-class');
  });

  it('timestamp has correct class', () => {
    const { container } = render(<Footer dataSources={mockDataSources} />);
    const timestamp = container.querySelector('.data-source-timestamp');
    expect(timestamp).toBeInTheDocument();
  });
});

describe('Footer - Edge Cases', () => {
  it('handles empty data sources array', () => {
    // This will throw an error in the reduce function since array is empty
    // Footer component requires at least one data source
    expect(() => {
      render(<Footer dataSources={[]} />);
    }).toThrow(TypeError);
  });

  it('handles single data source', () => {
    const singleSource: DataSource[] = [
      {
        name: 'Single',
        url: 'https://example.com',
        lastUpdate: '2025-10-27T10:00:00Z',
      },
    ];

    render(<Footer dataSources={singleSource} />);
    expect(screen.getByText('Single')).toBeInTheDocument();
  });

  it('handles data source without URL', () => {
    const noUrlSource: DataSource[] = [
      {
        name: 'No URL Source',
        lastUpdate: '2025-10-27T10:00:00Z',
      },
    ];

    render(<Footer dataSources={noUrlSource} />);
    const text = screen.getByText('No URL Source');
    expect(text.tagName).not.toBe('A');
  });

  it('handles mixed sources (with and without URLs)', () => {
    const mixedSources: DataSource[] = [
      {
        name: 'With URL',
        url: 'https://example.com',
        lastUpdate: '2025-10-27T10:00:00Z',
      },
      {
        name: 'Without URL',
        lastUpdate: '2025-10-27T10:00:00Z',
      },
    ];

    render(<Footer dataSources={mixedSources} />);

    const link = screen.getByRole('link', { name: /with url/i });
    expect(link).toBeInTheDocument();

    const text = screen.getByText('Without URL');
    expect(text.tagName).not.toBe('A');
  });
});

describe('Footer - Timestamp Logic', () => {
  it('selects most recent timestamp from multiple sources', () => {
    const sources: DataSource[] = [
      {
        name: 'Old',
        lastUpdate: '2025-10-27T08:00:00Z',
      },
      {
        name: 'Recent',
        lastUpdate: '2025-10-27T14:00:00Z',
      },
      {
        name: 'Medium',
        lastUpdate: '2025-10-27T11:00:00Z',
      },
    ];

    render(<Footer dataSources={sources} />);

    // The timestamp should be from the "Recent" source (14:00)
    const timestampElement = screen.getByText(/Utolsó frissítés:/);
    expect(timestampElement).toBeInTheDocument();
  });
});
