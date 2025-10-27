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

  it('displays N/A when value is null', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value={null} unit="°C" />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('displays N/A when value is undefined', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value={undefined as any} unit="°C" />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
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
  it('applies meteorology color to icon by default', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const icon = container.querySelector('.data-card-icon');
    expect(icon).toHaveClass('text-cyan-600');
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

    const icon = container.querySelector('.data-card-icon');
    expect(icon).toHaveClass('text-cyan-600');
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

    const icon = container.querySelector('.data-card-icon');
    expect(icon).toHaveClass('text-cyan-500');
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

    const icon = container.querySelector('.data-card-icon');
    expect(icon).toHaveClass('text-orange-600');
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

  it('has heading with correct id', () => {
    render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value="25" unit="°C" />
    );

    const heading = screen.getByText('Hőmérséklet');
    expect(heading).toHaveAttribute('id', 'card-Hőmérséklet');
  });

  it('value has aria-live attribute', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value="25" unit="°C" />
    );

    const value = container.querySelector('.data-card-value');
    expect(value).toHaveAttribute('aria-live', 'polite');
  });

  it('icon has aria-hidden attribute', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Hőmérséklet" value="25" unit="°C" />
    );

    const icon = container.querySelector('.data-card-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('DataCard - Styling', () => {
  it('applies default data-card class', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const card = container.querySelector('.data-card');
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

    const card = container.querySelector('.data-card');
    expect(card).toHaveClass('custom-class');
  });

  it('applies data-card-header class to header', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const header = container.querySelector('.data-card-header');
    expect(header).toBeInTheDocument();
  });

  it('applies data-card-label class to label', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const label = container.querySelector('.data-card-label');
    expect(label).toBeInTheDocument();
  });

  it('applies data-card-value class to value', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const value = container.querySelector('.data-card-value');
    expect(value).toBeInTheDocument();
  });

  it('applies data-card-unit class to unit', () => {
    const { container } = render(
      <DataCard icon={Thermometer} label="Test" value="10" unit="°C" />
    );

    const unit = container.querySelector('.data-card-unit');
    expect(unit).toBeInTheDocument();
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
