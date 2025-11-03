/**
 * RadarMap Component Tests
 *
 * Tests for the radar map component with Leaflet and RainViewer integration.
 * Tests map rendering, radar data fetching, animation controls, and empty states.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RadarMap } from './RadarMap';
import type { City } from '../../types';

// Mock fetch for RainViewer API
global.fetch = vi.fn();

// Mock Leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center }: { children: React.ReactNode; center: [number, number] }) => (
    <div data-testid="map-container" data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution }: { url: string; attribution?: string }) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
  ),
  Marker: ({ position, children }: { position: [number, number]; children: React.ReactNode }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
}));

// Mock Leaflet icon
vi.mock('leaflet', () => ({
  icon: vi.fn(() => ({ iconUrl: 'marker.png' })),
}));

describe('RadarMap - Rendering States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no city is selected', () => {
    render(<RadarMap city={null} />);

    expect(screen.getByText('Nincs kiválasztott város')).toBeInTheDocument();
    expect(screen.getByText('Válasszon várost a radarkép megtekintéséhez')).toBeInTheDocument();
  });

  it('should render map when city is provided', () => {
    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('should center map on city coordinates', () => {
    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    const mapContainer = screen.getByTestId('map-container');
    const center = JSON.parse(mapContainer.getAttribute('data-center') || '[]');

    expect(center[0]).toBe(46.3475);
    expect(center[1]).toBe(18.7067);
  });
});

describe('RadarMap - City Marker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render marker at city position', () => {
    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    const marker = screen.getByTestId('marker');
    const position = JSON.parse(marker.getAttribute('data-position') || '[]');

    expect(position[0]).toBe(46.3475);
    expect(position[1]).toBe(18.7067);
  });

  it('should display city information in popup', () => {
    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    expect(screen.getByText('Szekszárd')).toBeInTheDocument();
    expect(screen.getByText('Tolna megye')).toBeInTheDocument();
    expect(screen.getByText(/46.3475°, 18.7067°/)).toBeInTheDocument();
  });
});

describe('RadarMap - Radar Data Fetching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch radar frames on mount', async () => {
    const mockRadarResponse = {
      radar: {
        past: [
          { path: '/v2/radar/1698417600/256' },
          { path: '/v2/radar/1698421200/256' },
          { path: '/v2/radar/1698424800/256' },
        ],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRadarResponse,
    } as Response);

    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('https://api.rainviewer.com/public/weather-maps.json');
    }, { timeout: 5000 });
  });

  it('should display loading state initially', () => {
    const mockRadarResponse = {
      radar: {
        past: [],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRadarResponse,
    } as Response);

    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    expect(screen.getByText('⏳ Radarkép betöltése...')).toBeInTheDocument();
  });

  it('should show success status when radar frames loaded', async () => {
    const mockRadarResponse = {
      radar: {
        past: [
          { path: '/v2/radar/1698417600/256' },
          { path: '/v2/radar/1698421200/256' },
        ],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRadarResponse,
    } as Response);

    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    await waitFor(() => {
      expect(screen.getByText('✅ Radar: 2 frame')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should show error status when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    await waitFor(() => {
      expect(screen.getByText('❌ Radarkép nem elérhető')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should handle empty radar data', async () => {
    const mockRadarResponse = {
      radar: {
        past: [],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRadarResponse,
    } as Response);

    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    await waitFor(() => {
      expect(screen.getByText('❌ Radarkép nem elérhető')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

describe('RadarMap - Animation Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show play/pause button when radar frames available', async () => {
    const mockRadarResponse = {
      radar: {
        past: [
          { path: '/v2/radar/1698417600/256' },
          { path: '/v2/radar/1698421200/256' },
        ],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRadarResponse,
    } as Response);

    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Pause animation')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should toggle between play and pause on button click', async () => {
    const mockRadarResponse = {
      radar: {
        past: [
          { path: '/v2/radar/1698417600/256' },
          { path: '/v2/radar/1698421200/256' },
        ],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRadarResponse,
    } as Response);

    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Pause animation')).toBeInTheDocument();
    }, { timeout: 5000 });

    const button = screen.getByLabelText('Pause animation');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByLabelText('Play animation')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should display frame counter', async () => {
    const mockRadarResponse = {
      radar: {
        past: [
          { path: '/v2/radar/1698417600/256' },
          { path: '/v2/radar/1698421200/256' },
          { path: '/v2/radar/1698424800/256' },
        ],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRadarResponse,
    } as Response);

    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    await waitFor(() => {
      // Should start with last frame (latest)
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should not show controls when only one frame', async () => {
    const mockRadarResponse = {
      radar: {
        past: [{ path: '/v2/radar/1698417600/256' }],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRadarResponse,
    } as Response);

    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    await waitFor(() => {
      expect(screen.queryByLabelText('Pause animation')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Play animation')).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

describe('RadarMap - Map Layers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render OpenStreetMap base layer', () => {
    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    const tileLayers = screen.getAllByTestId('tile-layer');
    const osmLayer = tileLayers.find((layer) =>
      layer.getAttribute('data-url')?.includes('openstreetmap')
    );

    expect(osmLayer).toBeDefined();
  });

  it('should render RainViewer radar overlay when frames available', async () => {
    const mockRadarResponse = {
      radar: {
        past: [{ path: '/v2/radar/1698417600/256' }],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRadarResponse,
    } as Response);

    const mockCity: City = {
      id: 'city-1',
      name: 'Szekszárd',
      county: 'Tolna',
      latitude: 46.3475,
      longitude: 18.7067,
      population: 33000,
      isActive: true,
    };

    render(<RadarMap city={mockCity} />);

    await waitFor(() => {
      const tileLayers = screen.getAllByTestId('tile-layer');
      const radarLayer = tileLayers.find((layer) =>
        layer.getAttribute('data-url')?.includes('rainviewer')
      );
      expect(radarLayer).toBeDefined();
    }, { timeout: 5000 });
  });
});
