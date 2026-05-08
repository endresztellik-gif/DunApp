/**
 * VizugyApiClient
 *
 * Reusable client for the vmservice.vizugy.hu/vraquery/ REST API.
 * Works as a Deno/edge-function module — no Node.js dependencies.
 *
 * API discovery: data.vizugy.hu Angular bundle (2026-04-09)
 *   Auth:     GET  https://data.vizugy.hu/AuthApi/auth/token
 *               → requires Origin: https://data.vizugy.hu
 *               → returns { access_token: string }  (JWT, ~15 min TTL)
 *   Stations: GET  https://vmservice.vizugy.hu/vraquery/Vra/InternetVmo/{type}/false
 *               → type 11 = surface water stations (~1190 stations)
 *   Data:     POST https://vmservice.vizugy.hu/vraquery/TS/TsShortList
 *               → hourly time series for any station list + date range
 *
 * Data type codes (adatFajtaKod):
 *   68  = Felszíni vízállás (cm)
 *   87  = Felszíni vízhozam (m³/s)
 *   85  = Vízhő a vízfelszín közelében (°C)
 *
 * TSZ IDs for DunApp stations (from PecApp hydroinfo_stations mapping):
 *   Nagybajcs   TSZ 3      (hydroinfo 442502)
 *   Baja        TSZ 1344   (hydroinfo 442031)
 *   Mohács      TSZ 831    (hydroinfo 442032)
 *   Belső-Béda  TSZ 150035
 *   FTCS        TSZ 130033 (Hercegszántó-Karapancsa alvíz)
 *   Kadia       TSZ 130038 (Kadia-Ó-Duna felvíz)
 *
 * Compatible with PecApp and DunApp.
 */

const AUTH_URL = 'https://data.vizugy.hu/AuthApi/auth/token';
const API_BASE = 'https://vmservice.vizugy.hu/vraquery';
const ORIGIN_HEADER = 'https://data.vizugy.hu';
const USER_AGENT = 'Mozilla/5.0 (compatible; VizugyApiClient/1.0)';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VizugyStation {
  tsz: number;
  name: string;
  riverName: string;
  lat: number;
  lon: number;
  riverKm?: number;
  alertLevel?: number;
  dangerLevel?: number;
  majorLevel?: number;
}

export interface WaterLevelReading {
  utcTime: string;
  valueCm: number;
}

export interface StationTimeSeries {
  tsz: number;
  readings: WaterLevelReading[];
  latest: WaterLevelReading | null;
  trend: 'rising' | 'falling' | 'stable';
}

export const DATA_TYPE = {
  WATER_LEVEL: 68,
  FLOW_RATE: 87,
  WATER_TEMP: 85,
} as const;

// ─── Token cache (process-level, reused within one function invocation) ───────

let _cachedToken: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry) return _cachedToken;

  const res = await fetch(AUTH_URL, {
    headers: {
      Origin: ORIGIN_HEADER,
      Referer: `${ORIGIN_HEADER}/`,
      'User-Agent': USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`Vizugy auth failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  if (!json.access_token) {
    throw new Error('Vizugy auth: no access_token in response');
  }

  _cachedToken = json.access_token as string;
  try {
    const b64 = _cachedToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')));
    _tokenExpiry = payload.exp * 1000 - 60_000;
  } catch {
    _tokenExpiry = now + 10 * 60 * 1000;
  }

  return _cachedToken;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchStations(): Promise<VizugyStation[]> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/Vra/InternetVmo/11/false`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: ORIGIN_HEADER,
      'User-Agent': USER_AGENT,
    },
  });

  if (!res.ok) throw new Error(`fetchStations: ${res.status}`);

  const raw = await res.json();
  return raw.map((s: Record<string, unknown>) => ({
    tsz: s['Tsz'] as number,
    name: s['Nev'] as string,
    riverName: (s['MdrNev'] as string) ?? '',
    lat: s['Lat'] as number,
    lon: s['Lon'] as number,
    riverKm: s['Fkm'] as number | undefined,
    alertLevel: s['KF1'] as number | undefined,
    dangerLevel: s['KF2'] as number | undefined,
    majorLevel: s['KF3'] as number | undefined,
  }));
}

export async function fetchTimeSeries(
  tszList: number[],
  startTime: Date,
  endTime: Date,
  dataType: number = DATA_TYPE.WATER_LEVEL,
): Promise<StationTimeSeries[]> {
  if (tszList.length === 0) return [];

  const token = await getToken();
  const body = {
    torzsszamList: tszList,
    adatFajtaKod: dataType,
    adatTipusKod: 100,
    startTime: isoNoMs(startTime),
    endTime: isoNoMs(endTime),
    dataExtFilter: null,
    valueFilter: 'Relativ',
  };

  const res = await fetch(`${API_BASE}/TS/TsShortList`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: ORIGIN_HEADER,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`fetchTimeSeries: ${res.status} ${await res.text()}`);

  const raw = await res.json();

  return raw.map((item: Record<string, unknown>) => {
    const readings: WaterLevelReading[] = (
      (item['TsItemList'] as Array<Record<string, unknown>>) ?? []
    ).map((r) => ({
      utcTime: r['UTCTime'] as string,
      valueCm: r['Adat'] as number,
    }));

    const latest = readings.length > 0 ? readings[readings.length - 1] : null;
    const trend = computeTrend(readings);

    return { tsz: item['ItemId'] as number, readings, latest, trend };
  });
}

export async function fetchLatestWaterLevel(
  tsz: number,
  lookbackHours = 6,
): Promise<{ valueCm: number; utcTime: string; trend: 'rising' | 'falling' | 'stable' } | null> {
  const end = new Date();
  const start = new Date(end.getTime() - lookbackHours * 3_600_000);
  const series = await fetchTimeSeries([tsz], start, end);
  const s = series[0];
  if (!s || !s.latest) return null;
  return { valueCm: s.latest.valueCm, utcTime: s.latest.utcTime, trend: s.trend };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoNoMs(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function computeTrend(
  readings: WaterLevelReading[],
  windowSize = 3,
): 'rising' | 'falling' | 'stable' {
  if (readings.length < 2) return 'stable';
  const recent = readings.slice(-Math.min(windowSize + 1, readings.length));
  const delta = recent[recent.length - 1].valueCm - recent[0].valueCm;
  if (delta > 5) return 'rising';
  if (delta < -5) return 'falling';
  return 'stable';
}
