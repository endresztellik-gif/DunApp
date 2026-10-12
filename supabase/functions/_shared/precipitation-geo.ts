/**
 * Mért csapadék – tiszta (I/O nélküli) logika
 *
 * A HungaroMet napi csapadékmérő (HABP_1RD) fájljainak feldolgozása, a városokhoz
 * rendelt állomásérték / IDW interpoláció és az ablak-összegzés (7 nap, 30 nap, tárgyév).
 *
 * Szándékosan nincs benne Deno-specifikus import, hogy vitest alól is tesztelhető legyen
 * (src/lib/__tests__/precipitation-geo.test.ts).
 *
 * Forrás: Meteorológiai Adattár, HungaroMet Nonprofit Zrt. (odp.met.hu)
 * A napi érték (r) az adott nap 06:45-től a következő nap 06:45-ig tartó időszak mm-ben.
 * Adathiány: -999. A Q_r minőségjelző "fejlesztésre fenntartva" → nem használjuk.
 */

export const DIRECT_MAX_KM = 10;
export const IDW_RADIUS_KM = 30;
export const IDW_MIN_STATIONS = 2;
export const IDW_MAX_STATIONS = 4;
export const IDW_POWER = 2;
/** Ennél közelebbi állomásnál a súlyt nem növeljük tovább (nullával osztás ellen). */
const MIN_DISTANCE_KM = 0.1;

export interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation: number | null;
}

export interface StationReading extends Station {
  /** ISO dátum, YYYY-MM-DD */
  date: string;
  mm: number;
}

export interface CityRef {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export type EstimateMethod = 'station' | 'idw';

export interface CityEstimate {
  mm: number;
  method: EstimateMethod;
  nStations: number;
  nearestKm: number;
  stationIds: string[];
}

export type DailyMethod = EstimateMethod | 'model';

export interface DailyValue {
  /** ISO dátum, YYYY-MM-DD */
  date: string;
  mm: number;
  method: DailyMethod;
}

export interface WindowTotals {
  last7Days: number | null;
  last30Days: number | null;
  yearToDate: number | null;
  daysAvailable7: number;
  daysAvailable30: number;
  daysMeasuredYtd: number;
  daysModeledYtd: number;
  daysExpectedYtd: number;
  dataThrough: string;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/** YYYYMMDD → YYYY-MM-DD (érvénytelen bemenetre null). */
export function toIsoDate(compact: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(compact.trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function splitLine(line: string): string[] {
  return line.split(';').map((cell) => cell.trim());
}

/**
 * Az összes állomás egy napi fájlból (synoptic/hungary/daily_rain/csv/HABP_1RD_YYYYMMDD.csv).
 * Fejléc: Time;StationNumber;StationName;Latitude;Longitude;Elevation;r;Q_r;rh;...;EOR
 * A -999 (adathiány) és a nem szám értékű sorok kimaradnak – sosem lesz belőlük 0 mm.
 */
export function parseSynopticDailyRain(csv: string): StationReading[] {
  const readings: StationReading[] = [];
  let header: string[] | null = null;

  for (const rawLine of csv.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.startsWith('#')) continue;
    const cells = splitLine(rawLine);

    if (cells[0] === 'Time') {
      header = cells;
      continue;
    }
    if (!header) continue;

    const row: Record<string, string> = {};
    header.forEach((name, i) => {
      row[name] = cells[i] ?? '';
    });

    const date = toIsoDate(row.Time ?? '');
    const mm = Number(row.r);
    const lat = Number(row.Latitude);
    const lon = Number(row.Longitude);
    if (!date || row.r === '' || !Number.isFinite(mm) || mm <= -999) continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const elevation = Number(row.Elevation);
    readings.push({
      id: row.StationNumber,
      name: row.StationName,
      lat,
      lon,
      elevation: Number.isFinite(elevation) ? elevation : null,
      date,
      mm,
    });
  }

  return readings;
}

/**
 * Egy állomás éves fájlja (climate/observations_hungary/daily_rain/recent/HABP_1RD_<állomás>_akt.zip).
 * A metaadat a '#' kezdetű sorokban van: #StationNumber;StartDate;EndDate;Latitude;Longitude;Elevation;StationName;EOR
 * Az adatsorok: StationNumber;Time;r;Q_r;rh;...;EOR
 */
export function parseStationYearFile(csv: string): StationReading[] {
  let station: Station | null = null;
  let header: string[] | null = null;
  const readings: StationReading[] = [];

  for (const rawLine of csv.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;

    if (rawLine.startsWith('#')) {
      const cells = splitLine(rawLine.slice(1));
      // Az adatsor-metaadat az, amelyiknek az első cellája állomásszám (nem a fejléc felirata).
      if (/^\d+$/.test(cells[0] ?? '')) {
        const elevation = Number(cells[5]);
        station = {
          id: cells[0],
          name: cells[6] ?? '',
          lat: Number(cells[3]),
          lon: Number(cells[4]),
          elevation: Number.isFinite(elevation) ? elevation : null,
        };
      }
      continue;
    }

    const cells = splitLine(rawLine);
    if (cells[0] === 'StationNumber') {
      header = cells;
      continue;
    }
    if (!header || !station) continue;

    const row: Record<string, string> = {};
    header.forEach((name, i) => {
      row[name] = cells[i] ?? '';
    });

    const date = toIsoDate(row.Time ?? '');
    const mm = Number(row.r);
    if (!date || row.r === '' || !Number.isFinite(mm) || mm <= -999) continue;

    readings.push({ ...station, date, mm });
  }

  return readings;
}

/**
 * Egy város napi értéke az adott napra mért állomásokból.
 *
 * 1. A legközelebbi állomás ≤ DIRECT_MAX_KM → közvetlen állomásérték.
 * 2. Különben (vagy ha az a közeli állomás aznap hiányzik) IDW a ≤ IDW_RADIUS_KM sugarú
 *    állomásokból (legfeljebb IDW_MAX_STATIONS, legalább IDW_MIN_STATIONS kell).
 * 3. Ha egyik feltétel sem teljesül → null (nincs érték, nem 0).
 *
 * `readings` egyetlen nap állomásmérései.
 */
export function estimateForCity(city: CityRef, readings: StationReading[]): CityEstimate | null {
  const withDistance = readings
    .map((reading) => ({
      reading,
      km: haversineKm(city.lat, city.lon, reading.lat, reading.lon),
    }))
    .sort((a, b) => a.km - b.km);

  if (withDistance.length === 0) return null;

  const nearest = withDistance[0];
  if (nearest.km <= DIRECT_MAX_KM) {
    return {
      mm: round1(nearest.reading.mm),
      method: 'station',
      nStations: 1,
      nearestKm: round1(nearest.km),
      stationIds: [nearest.reading.id],
    };
  }

  const neighbours = withDistance.filter((item) => item.km <= IDW_RADIUS_KM).slice(0, IDW_MAX_STATIONS);
  if (neighbours.length < IDW_MIN_STATIONS) return null;

  let weightSum = 0;
  let weighted = 0;
  for (const { reading, km } of neighbours) {
    const weight = 1 / Math.max(km, MIN_DISTANCE_KM) ** IDW_POWER;
    weightSum += weight;
    weighted += weight * reading.mm;
  }

  return {
    mm: round1(weighted / weightSum),
    method: 'idw',
    nStations: neighbours.length,
    nearestKm: round1(neighbours[0].km),
    stationIds: neighbours.map((item) => item.reading.id),
  };
}

/** A városhoz tartozó állomások (a ≤ IDW_RADIUS_KM sugarúak) – ezeket érdemes tárolni. */
export function stationsNearCity(city: CityRef, stations: Station[]): Station[] {
  return stations.filter(
    (station) => haversineKm(city.lat, city.lon, station.lat, station.lon) <= IDW_RADIUS_KM
  );
}

/** ISO dátum eltolása napokkal (UTC-alapon, DST-biztosan). */
export function shiftIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function inclusiveDays(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
}

/**
 * 7 napos, 30 napos és tárgyévi összeg. A tárgyév mindig `dataThrough` évének január 1-jétől
 * számít, ezért évváltáskor magától nullázódik. Hiányzó nap nem számít 0-nak: a
 * `daysAvailable*` / `daysMeasuredYtd` + `daysModeledYtd` vs. `daysExpectedYtd` mutatja a lefedettséget.
 */
export function summarizeWindows(daily: DailyValue[], dataThrough: string): WindowTotals {
  const byDate = new Map<string, DailyValue>();
  for (const value of daily) byDate.set(value.date, value);

  const sumRange = (start: string) => {
    let total = 0;
    let count = 0;
    let measured = 0;
    let modeled = 0;
    for (const [date, value] of byDate) {
      if (date < start || date > dataThrough) continue;
      total += value.mm;
      count++;
      if (value.method === 'model') modeled++;
      else measured++;
    }
    return { total: count > 0 ? round1(total) : null, count, measured, modeled };
  };

  const yearStart = `${dataThrough.slice(0, 4)}-01-01`;
  const w7 = sumRange(shiftIsoDate(dataThrough, -6));
  const w30 = sumRange(shiftIsoDate(dataThrough, -29));
  const ytd = sumRange(yearStart);

  return {
    last7Days: w7.total,
    last30Days: w30.total,
    yearToDate: ytd.total,
    daysAvailable7: w7.count,
    daysAvailable30: w30.count,
    daysMeasuredYtd: ytd.measured,
    daysModeledYtd: ytd.modeled,
    daysExpectedYtd: inclusiveDays(yearStart, dataThrough),
    dataThrough,
  };
}
