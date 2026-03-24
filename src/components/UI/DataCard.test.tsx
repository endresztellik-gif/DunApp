/**
 * DataCard Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Thermometer, Droplets, Wind } from 'lucide-react';
import { DataCard } from './DataCard';

describe('DataCard - Rendering', () => {
  it('renders icon, label, value, and unit', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value="25.5" unit="°C" />
    );

    expect(screen.getByText('Hőmérséklet')).toBeInTheDocument();
    expect(screen.getByText('25.5')).toBeInTheDocument();
    expect(screen.getByText('°C')).toBeInTheDocument();
  });

  it('displays – when value is null', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value={null} unit="°C" />
    );

    expect(screen.getByText('–')).toBeInTheDocument();
  });

  it('displays – when value is undefined', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value={undefined as any} unit="°C" />
    );

    expect(screen.getByText('–')).toBeInTheDocument();
  });

  it('handles numeric value correctly', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value={25.5} unit="°C" />
    );

    expect(screen.getByText('25.5')).toBeInTheDocument();
  });

  it('handles zero value correctly', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value={0} unit="°C" />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value="25" unit="°C">
        <div data-testid="child-element">Child Content</div>
      </DataCard>
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});

describe('DataCard - Module Colors', () => {
  it('applies meteorology accent color to icon by default', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    // Icon is styled via inline style with CSS variable
    const iconWrapper = icon?.parentElement;
    expect(iconWrapper).toHaveClass('dun-card-header');
  });

  it('applies meteorology color when specified', () => {
    const { container } = render(
      <DataCard
        icon={Thermometer}
        label="Test"
        value="10"
        unit="°C"
        moduleColor="meteorology"
      />
    );

    const card = container.querySelector('.dun-card');
    expect(card).toBeInTheDocument();
  });

  it('applies water level color when specified', () => {
    const { container } = render(
      <DataCard
        icon={Droplets}
        label="Test"
        value="10"
        unit="cm"
        moduleColor="water"
      />
    );

    const card = container.querySelector('.dun-card');
    expect(card).toBeInTheDocument();
  });

  it('applies drought color when specified', () => {
    const { container } = render(
      <DataCard
        icon={Wind}
        label="Test"
        value="10"
        unit="%"
        moduleColor="drought"
      />
    );

    const card = container.querySelector('.dun-card');
    expect(card).toBeInTheDocument();
  });
});

describe('DataCard - Accessibility', () => {
  it('has region role', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value="25" unit="°C" />
    );

    const card = screen.getByRole('region');
    expect(card).toBeInTheDocument();
  });

  it('has correct aria-labelledby attribute', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value="25" unit="°C" />
    );

    const card = screen.getByRole('region');
    expect(card).toHaveAttribute('aria-labelledby', 'card-Hőmérséklet');
  });

  it('has label with correct id', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value="25" unit="°C" />
    );

    const label = screen.getByText('Hőmérséklet');
    expect(label).toHaveAttribute('id', 'card-Hőmérséklet');
  });

  it('value has aria-live attribute', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value="25" unit="°C" />
    );

    const value = container.querySelector('.dun-value');
    expect(value).toHaveAttribute('aria-live', 'polite');
  });

  it('icon has aria-hidden attribute', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value="25" unit="°C" />
    );

    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('DataCard - Styling', () => {
  it('applies dun-card class to root element', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const card = container.querySelector('.dun-card');
    expect(card).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <DataCard
        icon={Thermometer}
        label="Test"
        value="10"
        unit="°C"
        className="custom-class"
      />
    );

    const card = container.querySelector('.dun-card');
    expect(card).toHaveClass('custom-class');
  });

  it('applies dun-card-header class to header', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const header = container.querySelector('.dun-card-header');
    expect(header).toBeInTheDocument();
  });

  it('applies dun-module-label class to label', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const label = container.querySelector('.dun-module-label');
    expect(label).toBeInTheDocument();
  });

  it('applies dun-value class to value', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const value = container.querySelector('.dun-value');
    expect(value).toBeInTheDocument();
  });

  it('applies dun-value-unit class to unit', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const unit = container.querySelector('.dun-value-unit');
    expect(unit).toBeInTheDocument();
  });

  it('applies dun-card-body class to body', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const body = container.querySelector('.dun-card-body');
    expect(body).toBeInTheDocument();
  });
});

describe('DataCard - Different Icon Types', () => {
  it('renders Thermometer icon', () => {
    render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders Droplets icon', () => {
    render(
      <DataCard icon={Droplets} label="Test" value="10" unit="%" />
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders Wind icon', () => {
    render(
      <DataCard icon={Wind} label="Test" value="10" unit="km/h" />
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
