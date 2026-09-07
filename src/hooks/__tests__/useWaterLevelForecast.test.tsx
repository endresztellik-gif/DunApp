/**
 * Tests for useWaterLevelForecast Hook
 *
 * ÚJ FÁJL (2026-09-07). Ez a hook adja a vízállás modul „5 Napos Előrejelzés"
 * kártyáját, és eddig NULLA tesztfedezete volt — pont az az útvonal, ami
 * 2026-08-25 és 2026-09-07 között némán megállt (hydroinfo.hu TLS lánchiba,
 * lásd DEVELOPMENT_LOG). A régi `forecast` állítások a useWaterLevelData
 * tesztjében laktak, de a funkció azóta ebbe a külön hookba költözött, és a
 * séma is megváltozott — azokat töröltük, a fedezet ide került.
 *
 * A mockok a `water_level_forecasts` VALÓDI oszlopneveit használják
 * (ellenőrizve a prod sémán): forecast_date, issued_at, forecasted_level_cm,
 * forecast_uncertainty_cm, source.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWaterLevelForecast } from '../useWaterLevelForecast';
import * as supabaseModule from '../../lib/supabase';
import type { ReactNode } from 'react';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

const LATEST_ISSUE = '2026-09-07T11:00:08.887+00:00';
const OLDER_ISSUE = '2026-09-06T09:05:00.000+00:00';

/** Baja, a 2026-09-07-i kiadás — valódi hydroinfo értékek. */
const mockForecastRows = [
  { id: 'f1', station_id: 'station-123', forecast_date: '2026-09-08', issued_at: LATEST_ISSUE, forecasted_level_cm: -12, forecast_uncertainty_cm: 2, source: 'hydroinfo.hu', created_at: LATEST_ISSUE },
  { id: 'f2', station_id: 'station-123', forecast_date: '2026-09-09', issued_at: LATEST_ISSUE, forecasted_level_cm: -17, forecast_uncertainty_cm: 5, source: 'hydroinfo.hu', created_at: LATEST_ISSUE },
  { id: 'f3', station_id: 'station-123', forecast_date: '2026-09-10', issued_at: LATEST_ISSUE, forecasted_level_cm: -19, forecast_uncertainty_cm: 8, source: 'hydroinfo.hu', created_at: LATEST_ISSUE },
  { id: 'f4', station_id: 'station-123', forecast_date: '2026-09-11', issued_at: LATEST_ISSUE, forecasted_level_cm: -19, forecast_uncertainty_cm: 13, source: 'hydroinfo.hu', created_at: LATEST_ISSUE },
  { id: 'f5', station_id: 'station-123', forecast_date: '2026-09-12', issued_at: LATEST_ISSUE, forecasted_level_cm: -15, forecast_uncertainty_cm: 19, source: 'hydroinfo.hu', created_at: LATEST_ISSUE }
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // FONTOS: a hook MAGA ír elő `retry: 3`-at, és a query-szintű beállítás
        // erősebb a defaultOptions-nél — a `retry: false` itt nem érvényesül.
        // A `retryDelay`-t viszont a hook nem adja meg, így ez a default hat:
        // 0-ra állítva a 3 újrapróbálkozás azonnal lefut, és a hibaágas
        // tesztek nem futnak bele az exponenciális backoff (~7 mp) miatti
        // időtúllépésbe.
        retry: false,
        retryDelay: 0,
        gcTime: 0
      }
    }
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/**
 * A hook két kérést fűz össze:
 *   1. a legfrissebb `issued_at` (order desc → limit 1 → maybeSingle)
 *   2. az ahhoz a kiadáshoz tartozó sorok (eq → eq → gte → order → limit)
 * Ez a helper mindkét lánc végét kiszolgálja, és rögzíti, milyen szűrőkkel
 * hívták — így ellenőrizhető, hogy tényleg a legfrissebb kiadásra szűr.
 */
function mockSupabase(opts: {
  latestIssue?: { issued_at: string } | null;
  rows?: typeof mockForecastRows;
  issueError?: { message: string } | null;
  rowsError?: { message: string } | null;
}) {
  const calls = { issuedAtFilter: null as string | null, gteDate: null as string | null };

  const from = vi.fn().mockImplementation(() => ({
    select: (columns: string) => {
      // 1. kérés: csak az issued_at oszlopot kéri
      if (columns === 'issued_at') {
        return {
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: opts.issueError ? null : (opts.latestIssue ?? null),
                  error: opts.issueError ?? null
                })
              })
            })
          })
        };
      }
      // 2. kérés: a kiadás összes sora
      return {
        eq: () => ({
          eq: (_col: string, value: string) => {
            calls.issuedAtFilter = value;
            return {
              gte: (_c: string, date: string) => {
                calls.gteDate = date;
                return {
                  order: () => ({
                    limit: vi.fn().mockResolvedValue({
                      data: opts.rowsError ? null : (opts.rows ?? []),
                      error: opts.rowsError ?? null
                    })
                  })
                };
              }
            };
          }
        })
      };
    }
  }));

  (supabaseModule.supabase.from as unknown) = from;
  return calls;
}

describe('useWaterLevelForecast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not query when stationId is null', () => {
    mockSupabase({ latestIssue: { issued_at: LATEST_ISSUE }, rows: mockForecastRows });

    const { result } = renderHook(() => useWaterLevelForecast(null), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.forecasts).toEqual([]);
    expect(supabaseModule.supabase.from).not.toHaveBeenCalled();
  });

  it('returns the 5 forecast days of the latest issue', async () => {
    mockSupabase({ latestIssue: { issued_at: LATEST_ISSUE }, rows: mockForecastRows });

    const { result } = renderHook(() => useWaterLevelForecast('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.forecasts).toHaveLength(5);
    expect(result.current.error).toBe(null);
  });

  it('maps database columns onto the WaterLevelForecast interface', async () => {
    mockSupabase({ latestIssue: { issued_at: LATEST_ISSUE }, rows: mockForecastRows });

    const { result } = renderHook(() => useWaterLevelForecast('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const first = result.current.forecasts[0];
    expect(first.forecastDate).toBe('2026-09-08');
    expect(first.forecastedLevelCm).toBe(-12);
    // A ± sáv oszlopneve `forecast_uncertainty_cm`, a mezőé viszont
    // `uncertaintyCm` — ez a leképezés könnyen elcsúszik, ezért külön állítjuk.
    expect(first.uncertaintyCm).toBe(2);
    expect(first.issuedAt).toBe(LATEST_ISSUE);
    expect(first.source).toBe('hydroinfo.hu');
    expect(first.stationId).toBe('station-123');
  });

  it('keeps the negative low-water values intact', async () => {
    mockSupabase({ latestIssue: { issued_at: LATEST_ISSUE }, rows: mockForecastRows });

    const { result } = renderHook(() => useWaterLevelForecast('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Kisvíznél a Duna vízállása negatív (Baja 2026 szeptember). Egy „csak
    // számjegy" parse ezeket előjel nélkül hozná — ez éles hiba lenne.
    expect(result.current.forecasts.map((f) => f.forecastedLevelCm)).toEqual([
      -12, -17, -19, -19, -15
    ]);
  });

  it('filters to the newest issue and to today or later', async () => {
    const calls = mockSupabase({
      latestIssue: { issued_at: LATEST_ISSUE },
      rows: mockForecastRows
    });

    const { result } = renderHook(() => useWaterLevelForecast('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // A második kérésnek a LEGFRISSEBB kiadásra kell szűrnie, nem a régire.
    expect(calls.issuedAtFilter).toBe(LATEST_ISSUE);
    expect(calls.issuedAtFilter).not.toBe(OLDER_ISSUE);
    // ... és csak a mai vagy későbbi napokra.
    expect(calls.gteDate).toBe(new Date().toISOString().split('T')[0]);
  });

  it('returns an empty list when the station has no forecast yet', async () => {
    mockSupabase({ latestIssue: null });

    const { result } = renderHook(() => useWaterLevelForecast('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.forecasts).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('returns an empty list when every forecast date is already in the past', async () => {
    // REGRESSZIÓS TESZT a 2026-08-25 → 09-07 közti kiesésre: a cron futott és
    // 200-at adott, de a hydroinfo TLS-lánc hibája miatt nem íródott új sor.
    // A legfrissebb kiadás így hetekkel korábbi lett, és a `gte(ma)` szűrő
    // mindent kizárt → a UI „Nincs előrejelzési adat"-ot mutatott.
    // A hook helyes viselkedése ilyenkor: üres lista, NEM hiba.
    mockSupabase({ latestIssue: { issued_at: OLDER_ISSUE }, rows: [] });

    const { result } = renderHook(() => useWaterLevelForecast('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.forecasts).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('surfaces an error when the issue lookup fails', async () => {
    mockSupabase({ issueError: { message: 'connection reset' } });

    const { result } = renderHook(() => useWaterLevelForecast('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.error).not.toBe(null));

    expect(result.current.error?.message).toContain('connection reset');
    expect(result.current.forecasts).toEqual([]);
  });

  it('surfaces an error when the forecast rows fail to load', async () => {
    mockSupabase({
      latestIssue: { issued_at: LATEST_ISSUE },
      rowsError: { message: 'permission denied' }
    });

    const { result } = renderHook(() => useWaterLevelForecast('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.error).not.toBe(null));

    expect(result.current.error?.message).toContain('permission denied');
  });

  it('exposes a refetch function', async () => {
    mockSupabase({ latestIssue: { issued_at: LATEST_ISSUE }, rows: mockForecastRows });

    const { result } = renderHook(() => useWaterLevelForecast('station-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(typeof result.current.refetch).toBe('function');
  });
});
