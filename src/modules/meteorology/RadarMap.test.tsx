/**
 * RadarMap Component Tests
 *
 * Tests for the radar map component (Leaflet).
 *
 * MEGJEGYZÉS (2026-09-07): a korábbi 'Radar Data Fetching', 'Animation
 * Controls' és 'RainViewer overlay' blokkok TÖRÖLVE lettek. Azok a
 * RainViewer JSON API-t mockolták (api.rainviewer.com/public/weather-maps.json),
 * a komponenst viszont azóta met.hu ODP radarra írták át, ami nem is hív
 * JSON-indexet — a képkocka-URL-eket időbélyegből számolja. Törölt kód
 * tesztjei voltak, nem hibás tesztek működő kódra.
 *
 * Ami maradt: megjelenítési állapotok, várostérkép-középpont, marker + popup,
 * és az OSM alapréteg — ezek a jelenlegi komponenst mérik.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadarMap } from './RadarMap';
import type { City } from '../../types';

// A komponens nem hív JSON API-t, de a képelőtöltés miatt legyen fetch.
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
  // A RadarMap időközben radar-képréteget kapott (ImageOverlay) és egy
  // InvalidateMapSize segédkomponenst (useMap) — a mock ezekkel nem bővült,
  // ezért mind a 15 teszt "No export is defined on the react-leaflet mock"
  // hibával halt el, mielőtt bármit is állított volna.
  ImageOverlay: ({ url, opacity }: { url: string; bounds: unknown; opacity?: number }) => (
    <div data-testid="image-overlay" data-url={url} data-opacity={opacity} />
  ),
  // A komponens csak a map.invalidateSize()-t hívja; elég ennyit adni.
  useMap: () => ({ invalidateSize: vi.fn() }),
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
    // A popup a koordinátákat már nem jeleníti meg (csak név + megye).
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

});
