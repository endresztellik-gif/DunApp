/**
 * A mért csapadék tiszta logikájának tesztjei.
 * A modul az Edge Function-ök közös mappájában van (nincs Deno-függése), ezért vitest alól is fut.
 */

import { describe, it, expect } from 'vitest';
import {
  haversineKm,
  parseSynopticDailyRain,
  parseStationYearFile,
  estimateForCity,
  stationsNearCity,
  summarizeWindows,
  shiftIsoDate,
  toIsoDate,
  type CityRef,
  type StationReading,
  type DailyValue,
} from '../../../supabase/functions/_shared/precipitation-geo';

// Valódi HABP_1RD_20261010.csv-ből vett sorok (rövidítve).
const SYNOPTIC_CSV = [
  'Time;StationNumber;StationName                             ;Latitude;Longitude;Elevation;     r; Q_r;  rh;Q_rh; rf1;Q_rf1; rf2;Q_rf2;EOR',
  '20261010;        38413;Baja Józsefváros                        ; 46.1903;  18.9497;     93.0;  22.6;    ;-999;    ;   1;     ;   3;     ;EOR',
  '20261010;        39308;Kölked                                  ; 45.9497;  18.7083;     85.0;  22.3;    ;   0;    ;   1;     ;-999;     ;EOR',
  '20261010;        13710;Fertőrákos                              ; 47.7147;  16.6658;    116.0;   0.0;    ;-999;    ;   1;     ;-999;     ;EOR',
  '20261010;        99999;Hiányzó állomás                         ; 46.0000;  18.0000;    100.0;-999.0;    ;-999;    ;-999;     ;-999;     ;EOR',
].join('\n');

// Valódi HABP_1RD_20260101_20260831_38413.csv eleje.
const YEAR_FILE_CSV = [
  '##Meta',
  '#StationNumber;StartDate;EndDate ;Latitude;Longitude;Elevation;StationName                             ;EOR',
  '#        38413;20220621 ;20260926; 46.1903;  18.9497;     93.0;Baja Józsefváros                        ;EOR',
  '##Meta END',
  '',
  'StationNumber;    Time;     r; Q_r;  rh;Q_rh; rf1;Q_rf1; rf2;Q_rf2;EOR',
  '        38413;20260101;   0.0;    ;  -2;    ;   1;     ;-999;     ;EOR',
  '        38413;20260102;  26.0;    ;   0;    ;   1;     ;   4;     ;EOR',
  '        38413;20260103;-999.0;    ;   0;    ;   1;     ;   4;     ;EOR',
].join('\n');

const reading = (
  id: string,
  lat: number,
  lon: number,
  mm: number,
  date = '2026-10-10'
): StationReading => ({ id, name: id, lat, lon, elevation: null, date, mm });

const BAJA: CityRef = { id: 'baja', name: 'Baja', lat: 46.1811, lon: 18.955 };
const SZEKSZARD: CityRef = { id: 'szekszard', name: 'Szekszárd', lat: 46.3481, lon: 18.7097 };

describe('toIsoDate / shiftIsoDate', () => {
  it('YYYYMMDD → ISO, érvénytelenre null', () => {
    expect(toIsoDate('20261010')).toBe('2026-10-10');
    expect(toIsoDate('2026-10-10')).toBeNull();
  });

  it('napokat tol hónap- és évhatáron át is', () => {
    expect(shiftIsoDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftIsoDate('2027-01-03', -6)).toBe('2026-12-28');
  });
});

describe('haversineKm', () => {
  it('Baja – Baja Józsefváros állomás ≈ 1 km', () => {
    expect(haversineKm(46.1811, 18.955, 46.1903, 18.9497)).toBeCloseTo(1.1, 0);
  });
});

describe('parseSynopticDailyRain', () => {
  const parsed = parseSynopticDailyRain(SYNOPTIC_CSV);

  it('beolvassa az állomásokat névvel, koordinátával, dátummal', () => {
    const baja = parsed.find((r) => r.id === '38413');
    expect(baja).toMatchObject({
      name: 'Baja Józsefváros',
      lat: 46.1903,
      lon: 18.9497,
      elevation: 93,
      date: '2026-10-10',
      mm: 22.6,
    });
  });

  it('az adathiányt (-999) kihagyja, nem 0 mm-ként kezeli', () => {
    expect(parsed.find((r) => r.id === '99999')).toBeUndefined();
    expect(parsed).toHaveLength(3);
  });

  it('a valódi 0,0 mm-t megtartja', () => {
    expect(parsed.find((r) => r.id === '13710')?.mm).toBe(0);
  });
});

describe('parseStationYearFile', () => {
  const parsed = parseStationYearFile(YEAR_FILE_CSV);

  it('a metasorból veszi az állomás adatait', () => {
    expect(parsed[0]).toMatchObject({ id: '38413', name: 'Baja Józsefváros', elevation: 93 });
  });

  it('napi értékeket ad, a -999 napot kihagyja', () => {
    expect(parsed.map((r) => [r.date, r.mm])).toEqual([
      ['2026-01-01', 0],
      ['2026-01-02', 26],
    ]);
  });
});

describe('estimateForCity', () => {
  it('≤10 km-re lévő állomás értékét közvetlenül adja', () => {
    const result = estimateForCity(BAJA, [
      reading('38413', 46.1903, 18.9497, 22.6),
      reading('far', 46.0, 18.7, 5),
    ]);
    expect(result).toMatchObject({
      mm: 22.6,
      method: 'station',
      nStations: 1,
      stationIds: ['38413'],
    });
    expect(result?.nearestKm).toBeCloseTo(1.1, 0);
  });

  it('közeli állomás nélkül IDW-t számol a ≤30 km-es állomásokból', () => {
    // Szekszárd: a legközelebbi ~18 km → IDW
    const result = estimateForCity(SZEKSZARD, [
      reading('porboly', 46.1503, 18.8736, 10),
      reading('tevel', 46.3253, 18.5167, 20),
      reading('varalja', 46.4392, 18.4938, 30),
    ]);
    expect(result?.method).toBe('idw');
    expect(result?.nStations).toBe(3);
    // A legközelebbi állomás súlya a legnagyobb → az eredmény 20 alatt marad
    expect(result!.mm).toBeGreaterThan(10);
    expect(result!.mm).toBeLessThan(25);
  });

  it('IDW-nél a közelebbi állomás nagyobb súlyt kap', () => {
    const near = reading('near', 46.35, 18.55, 100); // ~12,5 km
    const far = reading('far', 46.35, 18.2, 0); // ~36 km → kívül esik
    const mid = reading('mid', 46.35, 18.35, 0); // ~25 km
    const result = estimateForCity(SZEKSZARD, [near, mid, far]);
    expect(result?.method).toBe('idw');
    expect(result?.stationIds).toEqual(['near', 'mid']);
    expect(result!.mm).toBeGreaterThan(50); // 100 mm felé húz
  });

  it('kevesebb mint 2 állomásnál (30 km-en belül) nem ad értéket', () => {
    expect(estimateForCity(SZEKSZARD, [reading('one', 46.3253, 18.5167, 20)])).toBeNull();
    expect(estimateForCity(SZEKSZARD, [])).toBeNull();
  });

  it('a 30 km-nél távolabbi állomást nem használja', () => {
    const result = estimateForCity(SZEKSZARD, [
      reading('porboly', 46.1503, 18.8736, 10),
      reading('veryfar', 47.5, 19.0, 99),
    ]);
    expect(result).toBeNull();
  });

  it('ha a közeli állomás aznap hiányzik (kimarad a listából), IDW-re vált a többiből', () => {
    // A 38413 nincs a listában (aznap -999 volt), két távolabbi állomás marad.
    const result = estimateForCity(BAJA, [
      reading('p', 46.0, 18.7, 10), // ~25 km
      reading('q', 46.0, 19.1, 20), // ~21 km
    ]);
    expect(result?.method).toBe('idw');
    expect(result?.stationIds).toEqual(['q', 'p']);
  });

  it('a 10 km-en belüli állomás közvetlen érték, akkor is, ha van másik is', () => {
    const result = estimateForCity(BAJA, [
      reading('a', 46.1503, 18.8736, 10), // ~8,9 km
      reading('b', 46.0, 19.1, 20),
    ]);
    expect(result?.method).toBe('station');
    expect(result?.mm).toBe(10);
  });
});

describe('stationsNearCity', () => {
  it('csak a 30 km-en belüli állomásokat tartja meg', () => {
    const near = { id: 'n', name: 'n', lat: 46.19, lon: 18.95, elevation: null };
    const far = { id: 'f', name: 'f', lat: 47.5, lon: 19.0, elevation: null };
    expect(stationsNearCity(BAJA, [near, far]).map((s) => s.id)).toEqual(['n']);
  });
});

describe('summarizeWindows', () => {
  const day = (date: string, mm: number, method: DailyValue['method'] = 'station'): DailyValue => ({
    date,
    mm,
    method,
  });

  it('a 7 napos ablak inkluzív (dataThrough és az azt megelőző 6 nap)', () => {
    const daily = [
      day('2026-10-03', 100), // kívül
      day('2026-10-04', 1),
      day('2026-10-10', 2),
    ];
    const result = summarizeWindows(daily, '2026-10-10');
    expect(result.last7Days).toBe(3);
    expect(result.daysAvailable7).toBe(2);
  });

  it('a tárgyév az adott év január 1-jétől számít, az előző évet kihagyja', () => {
    const daily = [day('2025-12-31', 50), day('2026-01-01', 5), day('2026-01-02', 7)];
    const result = summarizeWindows(daily, '2026-01-02');
    expect(result.yearToDate).toBe(12);
    expect(result.daysExpectedYtd).toBe(2);
    // a 30 napos ablak viszont átnyúlik az előző évbe
    expect(result.last30Days).toBe(62);
  });

  it('évváltáskor a tárgyév újraindul', () => {
    const daily = [day('2026-12-31', 40), day('2027-01-01', 3)];
    expect(summarizeWindows(daily, '2027-01-01').yearToDate).toBe(3);
  });

  it('a hiányzó napot nem számolja 0-nak: a lefedettség eltér a várttól', () => {
    const result = summarizeWindows([day('2026-01-01', 5), day('2026-01-04', 5)], '2026-01-04');
    expect(result.yearToDate).toBe(10);
    expect(result.daysMeasuredYtd).toBe(2);
    expect(result.daysExpectedYtd).toBe(4);
  });

  it('a becsült (model) napokat külön számolja', () => {
    const result = summarizeWindows(
      [day('2026-01-01', 5), day('2026-01-02', 3, 'model')],
      '2026-01-02'
    );
    expect(result.daysMeasuredYtd).toBe(1);
    expect(result.daysModeledYtd).toBe(1);
    expect(result.yearToDate).toBe(8);
  });

  it('adat nélkül null összeg, nem 0', () => {
    const result = summarizeWindows([], '2026-10-10');
    expect(result.last7Days).toBeNull();
    expect(result.yearToDate).toBeNull();
  });

  it('tizedes összegeket lebegőpont-hiba nélkül kerekít', () => {
    const result = summarizeWindows(
      [day('2026-10-08', 0.1), day('2026-10-09', 0.2), day('2026-10-10', 0.3)],
      '2026-10-10'
    );
    expect(result.last7Days).toBe(0.6);
  });
});
