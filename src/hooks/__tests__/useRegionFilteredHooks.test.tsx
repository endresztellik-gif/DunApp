/**
 * Régió-szűrő hookok tesztjei — useStations / useDroughtLocations / useGroundwaterWells
 *
 * ÚJ FÁJL (2026-09-07). Mindhárom hook 0% lefedettségen állt, pedig a
 * Duna/Dráva szétválasztás **üzleti szabály**, és korábban már el is tört:
 * a kút-időbélyeg táblázat mind a 19 kutat mutatta régiótól függetlenül
 * (lásd DEVELOPMENT_LOG 2026-06-26).
 *
 * A három hook ugyanazt a mintát követi:
 *   - mindig szűr `is_active=true`-ra (a kutaknál `enabled=true`-ra is),
 *   - régió megadásakor EXTRA szűrőt tesz rá,
 *   - a `queryKey`-ben szerepel a régió → régióváltáskor nem jön vissza a
 *     másik régió gyorsítótárazott adata.
 *
 * Az utolsó pont a legfontosabb: ha a queryKey nem tartalmazná a régiót, a
 * felhasználó Drávára váltva a Duna adatait látná — pontosan az a hibaosztály,
 * ami miatt ezek a hookok egyáltalán léteznek.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useStations } from '../useStations';
import { useDroughtLocations } from '../useDroughtLocations';
import { useGroundwaterWells } from '../useGroundwaterWells';

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '../../lib/supabase';

/**
 * Láncolható query-builder duplikátum, ami RÖGZÍTI a ráaggatott szűrőket.
 * A valódi PostgREST builder is thenable/láncolható, és az `.order()` zárja
 * a láncot — ezt utánozzuk, hogy a hookok kódját ne kelljen módosítani.
 */
function mockQuery(rows: unknown[], error: { message: string } | null = null) {
  const eqCalls: Array<[string, unknown]> = [];
  const orderCalls: string[] = [];

  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: (col: string, value: unknown) => {
      eqCalls.push([col, value]);
      return builder;
    },
    order: (col: string) => {
      orderCalls.push(col);
      return Promise.resolve({ data: error ? null : rows, error });
    },
  };

  (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue(builder);
  return { eqCalls, orderCalls };
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Ezek a hookok MAGUK írnak elő `retry: 3`-at, és a query-szintű
        // beállítás erősebb a defaultOptions-nél — a `retry: false` itt nem
        // érvényesül. A `retryDelay`-t viszont nem adják meg, így ez hat:
        // 0-ra állítva a 3 újrapróbálkozás azonnal lefut, és a hibaágas
        // teszt nem fut bele az exponenciális backoff (~7 mp) időtúllépésbe.
        retry: false,
        retryDelay: 0,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/** Egy `eq` szűrő megtörtént-e a megadott oszlopra/értékre. */
const hasFilter = (calls: Array<[string, unknown]>, col: string, value: unknown) =>
  calls.some(([c, v]) => c === col && v === value);

// ─────────────────────────────────────────────────────────────────────────────

describe('useStations — régió → folyó leképezés', () => {
  const rows = [
    {
      id: 's1',
      station_id: '442027',
      name: 'Baja',
      river: 'Duna',
      river_km: 1478.7,
      latitude: 46.18,
      longitude: 18.95,
      low_water_level_cm: 100,
      high_water_level_cm: 600,
      alert_level_cm: 400,
      danger_level_cm: 500,
      is_active: true,
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-10-01T00:00:00Z',
    },
  ];

  beforeEach(() => vi.clearAllMocks());

  it('régió nélkül nem tesz folyó-szűrőt', async () => {
    const { eqCalls } = mockQuery(rows);

    const { result } = renderHook(() => useStations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(hasFilter(eqCalls, 'is_active', true)).toBe(true);
    expect(eqCalls.some(([col]) => col === 'river')).toBe(false);
  });

  it('duna → river = "Duna"', async () => {
    const { eqCalls } = mockQuery(rows);

    const { result } = renderHook(() => useStations('duna'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(hasFilter(eqCalls, 'river', 'Duna')).toBe(true);
  });

  it('drava → river = "Dráva" (ékezettel!)', async () => {
    const { eqCalls } = mockQuery(rows);

    const { result } = renderHook(() => useStations('drava'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // A régiókód ékezet nélküli ('drava'), a folyó neve az adatbázisban
    // ékezetes ('Dráva') — ezt a leképezést a RIVER_BY_REGION végzi, és egy
    // elgépelés itt csendben ÜRES állomáslistát adna.
    expect(hasFilter(eqCalls, 'river', 'Dráva')).toBe(true);
  });

  it('snake_case → camelCase leképezés', async () => {
    mockQuery(rows);

    const { result } = renderHook(() => useStations('duna'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const s = result.current.stations[0];
    expect(s.stationId).toBe('442027');
    expect(s.name).toBe('Baja');
    expect(s.riverKm).toBe(1478.7);
    expect(s.lowWaterLevelCm).toBe(100);
    expect(s.alertLevelCm).toBe(400);
    expect(s.dangerLevelCm).toBe(500);
  });

  it('hibát ad tovább', async () => {
    mockQuery([], { message: 'permission denied' });

    const { result } = renderHook(() => useStations('duna'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.error).not.toBe(null));

    expect(result.current.error?.message).toContain('permission denied');
    expect(result.current.stations).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('useDroughtLocations — régió-szűrés', () => {
  const rows = [
    {
      id: 'l1',
      location_name: 'Katymár',
      location_type: 'agricultural',
      county: 'Bács-Kiskun',
      latitude: 46.03,
      longitude: 19.36,
      region: 'duna',
      is_active: true,
    },
  ];

  beforeEach(() => vi.clearAllMocks());

  it('mindig szűr aktívra, régió nélkül nincs region-szűrő', async () => {
    const { eqCalls } = mockQuery(rows);

    const { result } = renderHook(() => useDroughtLocations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(hasFilter(eqCalls, 'is_active', true)).toBe(true);
    expect(eqCalls.some(([col]) => col === 'region')).toBe(false);
  });

  it('régió megadásakor a region oszlopra szűr', async () => {
    const { eqCalls } = mockQuery(rows);

    const { result } = renderHook(() => useDroughtLocations('drava'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // A 029-es migráció adta a `region` oszlopot; enélkül a Dráva modul a
    // Duna helyszíneit mutatná.
    expect(hasFilter(eqCalls, 'region', 'drava')).toBe(true);
    expect(hasFilter(eqCalls, 'is_active', true)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('useGroundwaterWells — kettős szűrés + régió', () => {
  const rows = [
    {
      id: 'w1',
      well_name: 'Hercegszántó',
      well_code: '1450',
      county: 'Bács-Kiskun',
      city_name: 'Hercegszántó',
      latitude: 45.95,
      longitude: 18.94,
      depth_meters: 8,
      well_type: 'shallow',
      is_active: true,
      enabled: true,
      region: 'duna',
    },
  ];

  beforeEach(() => vi.clearAllMocks());

  it('is_active ÉS enabled szűrőt is tesz', async () => {
    const { eqCalls } = mockQuery(rows);

    const { result } = renderHook(() => useGroundwaterWells(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Az `enabled` külön kapcsoló: rossz adatminőségű kutakat zárunk ki vele
    // az `is_active`-tól függetlenül.
    expect(hasFilter(eqCalls, 'is_active', true)).toBe(true);
    expect(hasFilter(eqCalls, 'enabled', true)).toBe(true);
  });

  it('régió megadásakor arra is szűr', async () => {
    const { eqCalls } = mockQuery(rows);

    const { result } = renderHook(() => useGroundwaterWells('drava'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(hasFilter(eqCalls, 'region', 'drava')).toBe(true);
    expect(hasFilter(eqCalls, 'enabled', true)).toBe(true);
  });

  it('a kút mezőit camelCase-re képezi', async () => {
    mockQuery(rows);

    const { result } = renderHook(() => useGroundwaterWells('duna'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const w = result.current.wells[0];
    expect(w.wellName).toBe('Hercegszántó');
    expect(w.wellCode).toBe('1450');
    expect(w.region).toBe('duna');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Gyorsítótár: a régió a queryKey része', () => {
  beforeEach(() => vi.clearAllMocks());

  /**
   * A legfontosabb teszt a háromból. KÖZÖS QueryClient-tel váltunk régiót:
   * ha a `queryKey` nem tartalmazná a régiót, a második hívás a cache-ből
   * szolgálná ki az ELSŐ régió adatait, és a felhasználó Drávára váltva a
   * Duna helyszíneit látná — új hálózati kérés nélkül.
   */
  it('régióváltáskor új lekérdezés indul, nem a cache-ből szolgál ki', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { eqCalls } = mockQuery([
      {
        id: 'l1',
        location_name: 'Katymár',
        location_type: 'agricultural',
        county: 'Bács-Kiskun',
        latitude: 46.03,
        longitude: 19.36,
        region: 'duna',
        is_active: true,
      },
    ]);

    const duna = renderHook(() => useDroughtLocations('duna'), { wrapper });
    await waitFor(() => expect(duna.result.current.isLoading).toBe(false));
    const afterDuna = eqCalls.length;

    const drava = renderHook(() => useDroughtLocations('drava'), { wrapper });
    await waitFor(() => expect(drava.result.current.isLoading).toBe(false));

    // Ha a cache-ből jött volna, egyetlen új `eq` hívás sem történik.
    expect(eqCalls.length).toBeGreaterThan(afterDuna);
    expect(hasFilter(eqCalls, 'region', 'drava')).toBe(true);
  });
});
