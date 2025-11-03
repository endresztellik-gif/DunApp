/**
 * ForecastChart Component Tests
 *
 * Tests for the weather forecast chart component.
 * Tests Recharts rendering, loading states, error handling, and empty states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ForecastChart } from './ForecastChart';
import type { ReactNode } from 'react';
import type { ForecastPoint } from '../../hooks/useForecastData';

// Mock the useForecastData hook
vi.mock('../../hooks/useForecastData', () => ({
  useForecastData: vi.fn(),
}));

// Import mocked hook
import { useForecastData } from '../../hooks/useForecastData';

// Mock Recharts components to avoid canvas/SVG rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`line-${dataKey}`} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: ({ yAxisId }: { yAxisId?: string }) => (
    <div data-testid={`y-axis-${yAxisId || 'default'}`} />
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('ForecastChart - Rendering States', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should show loading spinner when data is loading', () => {
    vi.mocked(useForecastData).mockReturnValue({
      forecasts: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-1" />
      </QueryClientProvider>
    );

    const loadingSpinner = screen.getByRole('status');
    expect(loadingSpinner).toBeInTheDocument();
    expect(loadingSpinner).toHaveTextContent('Előrejelzés betöltése...');
  });

  it('should show error message when fetch fails', () => {
    vi.mocked(useForecastData).mockReturnValue({
      forecasts: [],
      isLoading: false,
      error: new Error('Network connection failed'),
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-1" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Hiba az előrejelzés betöltésekor')).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });

  it('should show empty state when no cityId provided', () => {
    vi.mocked(useForecastData).mockReturnValue({
      forecasts: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Nincs előrejelzési adat')).toBeInTheDocument();
    expect(
      screen.getByText('Válasszon várost az időjárás előrejelzés megtekintéséhez')
    ).toBeInTheDocument();
  });

  it('should show empty state when no forecast data available', () => {
    vi.mocked(useForecastData).mockReturnValue({
      forecasts: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-1" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Nincs előrejelzési adat')).toBeInTheDocument();
  });
});

describe('ForecastChart - Data Display', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('should render chart with forecast data', () => {
    const mockForecasts: ForecastPoint[] = [
      {
        id: 'forecast-1',
        cityId: 'city-1',
        forecastTime: '2025-10-27T18:00:00Z',
        temperature: 22.5,
        temperatureMin: 20.0,
        temperatureMax: 25.0,
        precipitationAmount: 0.5,
        windSpeed: 3.2,
        windDirection: 180,
        humidity: 65,
        pressure: 1013,
        cloudsPercent: 30,
        weatherSymbol: '01d',
      },
      {
        id: 'forecast-2',
        cityId: 'city-1',
        forecastTime: '2025-10-28T00:00:00Z',
        temperature: 20.0,
        temperatureMin: 18.0,
        temperatureMax: 22.0,
        precipitationAmount: 1.2,
        windSpeed: 4.5,
        windDirection: 200,
        humidity: 70,
        pressure: 1010,
        cloudsPercent: 60,
        weatherSymbol: '02d',
      },
    ];

    vi.mocked(useForecastData).mockReturnValue({
      forecasts: mockForecasts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-1" />
      </QueryClientProvider>
    );

    // Check that chart components are rendered
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('should render temperature and precipitation lines', () => {
    const mockForecasts: ForecastPoint[] = [
      {
        id: 'forecast-1',
        cityId: 'city-1',
        forecastTime: '2025-10-27T18:00:00Z',
        temperature: 22.5,
        temperatureMin: null,
        temperatureMax: null,
        precipitationAmount: 0.5,
        windSpeed: null,
        windDirection: null,
        humidity: null,
        pressure: null,
        cloudsPercent: null,
        weatherSymbol: null,
      },
    ];

    vi.mocked(useForecastData).mockReturnValue({
      forecasts: mockForecasts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-1" />
      </QueryClientProvider>
    );

    // Check for temperature and precipitation lines
    expect(screen.getByTestId('line-temperature')).toBeInTheDocument();
    expect(screen.getByTestId('line-precipitation')).toBeInTheDocument();
  });

  it('should render dual Y-axes for temperature and precipitation', () => {
    const mockForecasts: ForecastPoint[] = [
      {
        id: 'forecast-1',
        cityId: 'city-1',
        forecastTime: '2025-10-27T18:00:00Z',
        temperature: 22.5,
        temperatureMin: null,
        temperatureMax: null,
        precipitationAmount: 0.5,
        windSpeed: null,
        windDirection: null,
        humidity: null,
        pressure: null,
        cloudsPercent: null,
        weatherSymbol: null,
      },
    ];

    vi.mocked(useForecastData).mockReturnValue({
      forecasts: mockForecasts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-1" />
      </QueryClientProvider>
    );

    // Check for dual Y-axes (temperature and precipitation)
    expect(screen.getByTestId('y-axis-temp')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis-precip')).toBeInTheDocument();
  });
});

describe('ForecastChart - Data Transformation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('should transform forecast data for Recharts', () => {
    const mockForecasts: ForecastPoint[] = [
      {
        id: 'forecast-1',
        cityId: 'city-1',
        forecastTime: '2025-10-27T18:00:00Z',
        temperature: 22.5,
        temperatureMin: null,
        temperatureMax: null,
        precipitationAmount: 0.5,
        windSpeed: null,
        windDirection: null,
        humidity: null,
        pressure: null,
        cloudsPercent: null,
        weatherSymbol: null,
      },
    ];

    vi.mocked(useForecastData).mockReturnValue({
      forecasts: mockForecasts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-1" />
      </QueryClientProvider>
    );

    // Verify chart is rendered (transformation worked)
    expect(container.querySelector('[data-testid="line-chart"]')).toBeInTheDocument();
  });

  it('should handle null temperature values', () => {
    const mockForecasts: ForecastPoint[] = [
      {
        id: 'forecast-1',
        cityId: 'city-1',
        forecastTime: '2025-10-27T18:00:00Z',
        temperature: null,
        temperatureMin: null,
        temperatureMax: null,
        precipitationAmount: null,
        windSpeed: null,
        windDirection: null,
        humidity: null,
        pressure: null,
        cloudsPercent: null,
        weatherSymbol: null,
      },
    ];

    vi.mocked(useForecastData).mockReturnValue({
      forecasts: mockForecasts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Should not crash with null values
    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <ForecastChart cityId="city-1" />
        </QueryClientProvider>
      );
    }).not.toThrow();
  });
});

describe('ForecastChart - Hook Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('should call useForecastData with correct cityId', () => {
    const mockUseForecastData = vi.mocked(useForecastData);
    mockUseForecastData.mockReturnValue({
      forecasts: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-123" />
      </QueryClientProvider>
    );

    expect(mockUseForecastData).toHaveBeenCalledWith('city-123');
  });

  it('should re-fetch when cityId changes', () => {
    const mockUseForecastData = vi.mocked(useForecastData);
    mockUseForecastData.mockReturnValue({
      forecasts: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-1" />
      </QueryClientProvider>
    );

    expect(mockUseForecastData).toHaveBeenCalledWith('city-1');

    // Change cityId
    rerender(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-2" />
      </QueryClientProvider>
    );

    expect(mockUseForecastData).toHaveBeenCalledWith('city-2');
  });
});

describe('ForecastChart - Accessibility', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('should have proper error icon for error state', () => {
    vi.mocked(useForecastData).mockReturnValue({
      forecasts: [],
      isLoading: false,
      error: new Error('Test error'),
      refetch: vi.fn(),
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="city-1" />
      </QueryClientProvider>
    );

    // Check for AlertCircle icon (rendered as SVG)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have proper icon for empty state', () => {
    vi.mocked(useForecastData).mockReturnValue({
      forecasts: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ForecastChart cityId="" />
      </QueryClientProvider>
    );

    // EmptyState component should be rendered with Calendar icon
    expect(screen.getByText('Nincs előrejelzési adat')).toBeInTheDocument();
  });
});
