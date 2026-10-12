/**
 * PrecipitationMeasuredCard Tests
 *
 * Állapotok: betöltés, hiba, nincs közeli állomás, mért (állomás), interpolált, hiányos lefedettség.
 * Horgonyok: szöveg / role / aria-label (nem data-testid).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrecipitationMeasuredCard } from './PrecipitationMeasuredCard';
import type { PrecipitationMeasured } from '../../hooks/usePrecipitationMeasured';

vi.mock('../../hooks/usePrecipitationMeasured', () => ({
  usePrecipitationMeasured: vi.fn(),
}));

import { usePrecipitationMeasured } from '../../hooks/usePrecipitationMeasured';

const baseData: PrecipitationMeasured = {
  cityId: 'baja',
  last7Days: 23.6,
  last30Days: 31.2,
  yearToDate: 403.4,
  daysAvailable7: 7,
  daysAvailable30: 30,
  daysMeasuredYtd: 250,
  daysModeledYtd: 0,
  daysExpectedYtd: 250,
  dataThrough: '2026-10-10',
  method: 'station',
  stations: [{ id: '38413', name: 'Baja Józsefváros', km: 1.1 }],
  nearestKm: 1.1,
  updatedAt: '2026-10-12T07:30:00Z',
};

const mockHook = (overrides: Partial<ReturnType<typeof usePrecipitationMeasured>>) => {
  vi.mocked(usePrecipitationMeasured).mockReturnValue({
    precipitationData: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  });
};

describe('PrecipitationMeasuredCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('betöltés közben jelzi a töltést', () => {
    mockHook({ isLoading: true });
    render(<PrecipitationMeasuredCard cityId="baja" />);
    expect(screen.getByText('Betöltés...')).toBeInTheDocument();
  });

  it('hibánál újrapróbálás gombot ad, ami lekérdezést indít', () => {
    const refetch = vi.fn();
    mockHook({ error: new Error('x'), refetch });
    render(<PrecipitationMeasuredCard cityId="baja" />);

    expect(screen.getByText('Nem sikerült betölteni az adatokat.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Újrapróbálás' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('nincs közeli mérőállomás: megmondja, nem 0 mm-t mutat', () => {
    mockHook({ precipitationData: null });
    render(<PrecipitationMeasuredCard cityId="vizvar" />);

    expect(
      screen.getByText(/nincs elég közeli, naponta frissülő mérőállomás/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  it('település nélkül "Nincs elérhető adat"', () => {
    mockHook({ precipitationData: null });
    render(<PrecipitationMeasuredCard cityId={null} />);
    expect(screen.getByText('Nincs elérhető adat')).toBeInTheDocument();
  });

  it('mért adatnál az állomás nevét és távolságát, az értékeket és a forrást mutatja', () => {
    mockHook({ precipitationData: baseData });
    render(<PrecipitationMeasuredCard cityId="baja" />);

    expect(screen.getByText('Mért adat: Baja Józsefváros, 1,1 km')).toBeInTheDocument();
    expect(screen.getByText('23.6')).toBeInTheDocument();
    expect(screen.getByText('31.2')).toBeInTheDocument();
    expect(screen.getByText('403.4')).toBeInTheDocument();
    expect(screen.getByText('Tárgyév (jan. 1-től)')).toBeInTheDocument();
    expect(
      screen.getByText('Adatbázis: Meteorológiai Adattár, HungaroMet Nonprofit Zrt.')
    ).toBeInTheDocument();
  });

  it('interpolált adatnál az állomások számát és a legközelebbi távolságát mutatja', () => {
    mockHook({
      precipitationData: {
        ...baseData,
        method: 'idw',
        stations: [
          { id: 'a', name: 'A', km: 18 },
          { id: 'b', name: 'B', km: 20.4 },
          { id: 'c', name: 'C', km: 23 },
        ],
        nearestKm: 18,
      },
    });
    render(<PrecipitationMeasuredCard cityId="szekszard" />);

    expect(
      screen.getByText('Interpolált adat: 3 környező mérőállomás (legközelebbi: 18,0 km)')
    ).toBeInTheDocument();
  });

  it('a becsült (modellel pótolt) napokat külön kiírja', () => {
    mockHook({
      precipitationData: {
        ...baseData,
        daysMeasuredYtd: 217,
        daysModeledYtd: 33,
        daysExpectedYtd: 250,
      },
    });
    render(<PrecipitationMeasuredCard cityId="baja" />);

    expect(
      screen.getByText('Tárgyév: 217 nap mért, 33 nap becsült (Open-Meteo) a 250 napból')
    ).toBeInTheDocument();
  });

  it('hiányos ablaknál jelzi, hány nap adata van meg; a null érték kötőjel, nem 0', () => {
    mockHook({
      precipitationData: { ...baseData, last7Days: null, daysAvailable7: 0, daysAvailable30: 25 },
    });
    render(<PrecipitationMeasuredCard cityId="baja" />);

    expect(screen.getByText('0/7 nap adata')).toBeInTheDocument();
    expect(screen.getByText('25/30 nap adata')).toBeInTheDocument();
    expect(screen.getByText('–')).toBeInTheDocument();
  });

  it('az info gomb kinyitja a magyarázatot (06:45-ös mérési időszak)', () => {
    mockHook({ precipitationData: baseData });
    render(<PrecipitationMeasuredCard cityId="baja" />);

    const toggle = screen.getByRole('button', { name: 'Adatforrás információ' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/06:45/)).toBeInTheDocument();
  });
});
