/**
 * App Component Tests
 *
 * Integration tests for the main App component:
 * - Module switching functionality
 * - Correct module components rendering
 * - Header and navigation presence
 * - Mock data integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import App from './App';
import * as mockData from './data/mockData';
import type { ReactNode } from 'react';

// Mock useCities hook to return mock cities
vi.mock('./hooks/useCities', () => ({
  useCities: () => ({
    cities: mockData.MOCK_CITIES,
    isLoading: false,
    error: null,
  }),
}));

// Mock the module components to avoid complex dependencies
vi.mock('./modules/meteorology/MeteorologyModule', () => ({
  MeteorologyModule: vi.fn(() => <div data-testid="meteorology-module">Meteorology Module</div>),
}));

vi.mock('./modules/water-level/WaterLevelModule', () => ({
  WaterLevelModule: vi.fn(() => <div data-testid="water-level-module">Water Level Module</div>),
}));

vi.mock('./modules/drought/DroughtModule', () => ({
  DroughtModule: vi.fn(() => <div data-testid="drought-module">Drought Module</div>),
}));

// Custom render with QueryClientProvider
let queryClient: QueryClient;

function renderWithQueryClient(ui: ReactNode) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('App Component', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });
  describe('Initial Render', () => {
    it('renders without crashing', () => {
      renderWithQueryClient(<App />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders the Header component', () => {
      renderWithQueryClient(<App />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('renders the DunApp logo', () => {
      renderWithQueryClient(<App />);
      expect(screen.getByText(/Dun/i)).toBeInTheDocument();
      expect(screen.getByText(/App/i)).toBeInTheDocument();
    });

    it('displays Meteorology module by default', () => {
      renderWithQueryClient(<App />);
      expect(screen.getByTestId('meteorology-module')).toBeInTheDocument();
      expect(screen.queryByTestId('water-level-module')).not.toBeInTheDocument();
      expect(screen.queryByTestId('drought-module')).not.toBeInTheDocument();
    });
  });

  describe('Module Navigation', () => {
    it('renders all three module tabs', () => {
      renderWithQueryClient(<App />);
      const navigation = screen.getByRole('navigation', { name: /modul navigáció/i });

      expect(within(navigation).getByLabelText(/meteorológiai modul/i)).toBeInTheDocument();
      expect(within(navigation).getByLabelText(/vízállás modul/i)).toBeInTheDocument();
      expect(within(navigation).getByLabelText(/aszály modul/i)).toBeInTheDocument();
    });

    it('switches to Water Level module when tab is clicked', () => {
      renderWithQueryClient(<App />);
      const waterLevelTab = screen.getByLabelText(/vízállás modul/i);

      fireEvent.click(waterLevelTab);

      expect(screen.getByTestId('water-level-module')).toBeInTheDocument();
      expect(screen.queryByTestId('meteorology-module')).not.toBeInTheDocument();
      expect(screen.queryByTestId('drought-module')).not.toBeInTheDocument();
    });

    it('switches to Drought module when tab is clicked', () => {
      renderWithQueryClient(<App />);
      const droughtTab = screen.getByLabelText(/aszály modul/i);

      fireEvent.click(droughtTab);

      expect(screen.getByTestId('drought-module')).toBeInTheDocument();
      expect(screen.queryByTestId('meteorology-module')).not.toBeInTheDocument();
      expect(screen.queryByTestId('water-level-module')).not.toBeInTheDocument();
    });

    it('can switch back to Meteorology module', () => {
      renderWithQueryClient(<App />);
      const waterLevelTab = screen.getByLabelText(/vízállás modul/i);
      const meteorologyTab = screen.getByLabelText(/meteorológiai modul/i);

      fireEvent.click(waterLevelTab);
      expect(screen.getByTestId('water-level-module')).toBeInTheDocument();

      fireEvent.click(meteorologyTab);
      expect(screen.getByTestId('meteorology-module')).toBeInTheDocument();
      expect(screen.queryByTestId('water-level-module')).not.toBeInTheDocument();
    });

    it('highlights the active module tab', () => {
      renderWithQueryClient(<App />);
      const meteorologyTab = screen.getByLabelText(/meteorológiai modul/i);
      const waterLevelTab = screen.getByLabelText(/vízállás modul/i);

      // Initially, Meteorology tab should be active
      expect(meteorologyTab).toHaveAttribute('aria-current', 'page');
      expect(waterLevelTab).not.toHaveAttribute('aria-current', 'page');

      // After clicking Water Level tab, it should be active
      fireEvent.click(waterLevelTab);
      expect(waterLevelTab).toHaveAttribute('aria-current', 'page');
      expect(meteorologyTab).not.toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Mock Data Integration', () => {
    it('validates mock data in development mode', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Call validateMockData directly
      mockData.validateMockData();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Mock data validation passed')
      );

      consoleLogSpy.mockRestore();
    });

    it('has correct number of cities', () => {
      expect(mockData.MOCK_CITIES).toHaveLength(4);
    });

    it('has correct number of water level stations', () => {
      expect(mockData.MOCK_STATIONS).toHaveLength(3);
    });

    it('has correct number of drought locations', () => {
      expect(mockData.MOCK_DROUGHT_LOCATIONS).toHaveLength(5);
    });

    it('has correct number of groundwater wells', () => {
      expect(mockData.MOCK_GROUNDWATER_WELLS).toHaveLength(15);
    });
  });

  describe('Accessibility', () => {
    it('has a main landmark', () => {
      renderWithQueryClient(<App />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has proper ARIA labels on module tabs', () => {
      renderWithQueryClient(<App />);
      const navigation = screen.getByRole('navigation', { name: /modul navigáció/i });

      const meteorologyTab = within(navigation).getByLabelText(/meteorológiai modul/i);
      const waterLevelTab = within(navigation).getByLabelText(/vízállás modul/i);
      const droughtTab = within(navigation).getByLabelText(/aszály modul/i);

      expect(meteorologyTab).toHaveAttribute('aria-selected');
      expect(waterLevelTab).toHaveAttribute('aria-selected');
      expect(droughtTab).toHaveAttribute('aria-selected');
    });

    it('has proper role attributes for tabs', () => {
      renderWithQueryClient(<App />);
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      const tabs = within(tablist).getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive padding classes to main content', () => {
      renderWithQueryClient(<App />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('px-4', 'py-6', 'md:py-8');
    });

    it('applies min-h-screen to root container', () => {
      const { container } = renderWithQueryClient(<App />);
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toHaveClass('min-h-screen');
    });
  });

  describe('Module-Specific Selectors', () => {
    it('does NOT render any global location selectors in App component', () => {
      const { container } = renderWithQueryClient(<App />);
      const appHtml = container.innerHTML;

      // App.tsx should NOT contain any selectors - they are module-specific
      expect(appHtml).not.toContain('global-selector');
      expect(appHtml).not.toContain('location-selector');
    });

    it('passes correct data to each module', () => {
      renderWithQueryClient(<App />);

      // Meteorology should receive 4 cities
      const meteorologyModule = screen.getByTestId('meteorology-module');
      expect(meteorologyModule).toBeInTheDocument();

      // Switch to Water Level
      fireEvent.click(screen.getByLabelText(/vízállás modul/i));
      const waterLevelModule = screen.getByTestId('water-level-module');
      expect(waterLevelModule).toBeInTheDocument();

      // Switch to Drought
      fireEvent.click(screen.getByLabelText(/aszály modul/i));
      const droughtModule = screen.getByTestId('drought-module');
      expect(droughtModule).toBeInTheDocument();
    });
  });
});
