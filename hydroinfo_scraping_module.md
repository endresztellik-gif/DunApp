# Hydroinfo Scraping Modul
Ez a dokumentum a DunApp PWA-ból származó hydroinfo.hu vízállás és előrejelzés scraping logikát tartalmazza.
Könnyen integrálható más Deno/Edge Function környezetű (pl. Supabase) PWA-ba. A HTML feldolgozáshoz a `deno-dom-wasm` csomagot használja.

## Szükséges Importok
Az alábbi importok szükségesek a Deno környezetben való futtatáshoz (DOM parse, error handler és Supabase - ha szükséges):

```typescript
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

// Ha használsz saját error sanitizer-t:
// import { sanitizeError } from '../_shared/error-sanitizer.ts'; 
```

## Állomás Konfiguráció
Definiáld az állomásokat, amelyeket le akarsz kérdezni. Az ID-k a hydroinfo.hu oldalán található iframe és részletes táblázatokból származnak.

```typescript
// Állomások konfigurációja
// hydroinfoActualId: hydroinfo.hu iframe tábla szerinti azonosító (aktuális adatok)
// hydroinfoId: hydroinfo.hu részletes tábla azonosító (6 napos előrejelzés)
const STATIONS = [
  {
    name: 'Nagybajcs',
    stationId: '442051',
    hydroinfoActualId: '442502',
    hydroinfoId: null,   // Nincs egyedi részletes táblája
    useConsolidatedTable: true // A gyűjtőtáblát kell használni (kb 1-2 napos)
  },
  {
    name: 'Baja',
    stationId: '442027',
    hydroinfoActualId: '442031',
    hydroinfoId: '442031',
    useConsolidatedTable: false
  },
  {
    name: 'Mohács',
    stationId: '442010',
    hydroinfoActualId: '442032',
    hydroinfoId: '442032',
    useConsolidatedTable: false
  }
];
```

## Újrapróbálkozási (Retry) Logika
Mivel a külső weboldalak időnként megbízhatatlanok, érdemes implementálni egy exponenciális újrapróbálkozási logikát a hívásokhoz.

```typescript
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // ms

async function fetchWithRetry(
  fetchFn: () => Promise<Response>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<Response> {
  try {
    const response = await fetchFn();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    console.warn(`Fetch failed, retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fetchFn, retries - 1, delay * 2);
  }
}
```

## 1. Aktuális adatok letöltése (Vízállás, Vízhozam, Hőmérséklet)
Ezt a funkciót a hydroinfo.hu közös iframe táblájából (dunhif_a.html) lehet kiolvasni. Az oldal ISO-8859-2 (Central European) kódolást használ.

```typescript
/**
 * Aktuális elérhető vízállás, vízhozam és hőmérséklet letöltése.
 * Forrás: https://www.hydroinfo.hu/tables/dunhif_a.html
 * Visszatérési érték struktúra: 
 * { [stationName]: { waterLevel: number, flowRate?: number, waterTemp?: number } }
 */
async function scrapeHydroinfoActual() {
  const url = 'https://www.hydroinfo.hu/tables/dunhif_a.html';

  const response = await fetchWithRetry(() => fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PWA Scraper/1.0)'
    }
  }));

  // ISO-8859-2 magyar karakterek kezelése
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-2');
  const html = decoder.decode(buffer);

  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Failed to parse HTML from hydroinfo.hu iframe table');
  }

  const waterLevelData: Record<string, {
    waterLevel: number;
    flowRate?: number;
    waterTemp?: number
  }> = {};

  const getCellText = (cell: any): string => {
    if (!cell) return '';
    return cell.textContent?.trim() || '';
  };

  const tables = doc.querySelectorAll('table');

  for (const table of tables) {
    const rows = table.querySelectorAll('tr');

    for (const row of rows) {
      const cells = row.querySelectorAll('td');

      // Legalább 10 oszlopnak lennie kell a valid adatsorhoz
      if (cells.length < 10) continue;

      const stationCode = getCellText(cells[0]);

      for (const station of STATIONS) {
        if (stationCode === station.hydroinfoActualId) {
          // Oszlop struktúra a táblában:
          // 0: station code
          // 1: station name
          // 2: river name 
          // 3: régi vízállás bázisérték
          // 4: intermediate vízállás
          // 5: vízállás (reggeli aktuális mérés) ← EZT HASZNÁLJUK
          // 6: trend (változás cm-ben)
          // 7: vízhozam (m³/s)
          // 8: vízhőmérséklet (°C)
          // 9: extra info

          const waterLevel = parseInt(getCellText(cells[5]).replace(/[^\d-]/g, ''));
          const flowRateText = getCellText(cells[7]);
          const waterTempText = getCellText(cells[8]);

          if (!isNaN(waterLevel)) {
            const data: {
              waterLevel: number;
              flowRate?: number;
              waterTemp?: number;
            } = { waterLevel };

            // Vízhozam (ha nincs adat: "//")
            if (flowRateText && flowRateText !== '//' && flowRateText !== '//') {
              const flowRate = parseInt(flowRateText.replace(/[^\d]/g, ''));
              if (!isNaN(flowRate)) {
                data.flowRate = flowRate;
              }
            }

            // Vízhőmérséklet ("," -> "." csere az 11,1 -> 11.1 végett)
            if (waterTempText && waterTempText !== '//' && waterTempText !== '//') {
              const waterTemp = parseFloat(waterTempText.replace(',', '.'));
              if (!isNaN(waterTemp)) {
                data.waterTemp = waterTemp;
              }
            }

            waterLevelData[station.name] = data;
          }
          break;
        }
      }
    }
  }

  return waterLevelData;
}
```

## 2. 6 Napos Előrejelzés Letöltése (Részletes Tábla)
Ezt az állomások egyedi táblázataiból olvassuk ki, pl.: Baja/Mohács esetében.

```typescript
/**
 * 6 napos vízállás előrejelzés letöltése (állomásspecifikus részletes tábla).
 * Csak a reggeli 07:00 órás adatokat emeljük ki napi előrejelzés gyanánt.
 * Forrás: https://www.hydroinfo.hu/tables/{hydroinfoId}H.html
 */
async function scrapeHydroinfoDetailTable(hydroinfoId: string): Promise<Array<{ day: number; waterLevel: number; uncertainty: number; date: string }>> {
  const url = `https://www.hydroinfo.hu/tables/${hydroinfoId}H.html`;

  const response = await fetchWithRetry(() => fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PWA Scraper/1.0)'
    }
  }));

  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-2');
  const html = decoder.decode(buffer);

  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error(`Failed to parse HTML from ${url}`);
  }

  const forecasts: Array<{ day: number; waterLevel: number; uncertainty: number; date: string }> = [];
  const rows = doc.querySelectorAll('table tr');

  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) continue;

    const dateCell = cells[0]?.textContent?.trim() || '';

    // "2025.11.08. 07:00" formátum -> 07:00 reggeli érték kerestetik
    if (dateCell.includes('07:00') && dateCell.match(/\d{4}\.\d{2}\.\d{2}/)) {
      const dateMatch = dateCell.match(/(\d{4})\.(\d{2})\.(\d{2})/);
      if (!dateMatch) continue;

      const year = dateMatch[1];
      const month = dateMatch[2];
      const day = dateMatch[3];
      const forecastDate = `${year}-${month}-${day}`; // YYYY-MM-DD

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(forecastDate);
      const dayOffset = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const valueCell = cells[1];
      const boldTags = valueCell?.querySelectorAll('b');

      if (boldTags && boldTags.length > 0) {
        const forecastText = boldTags[0]?.textContent?.trim() || '';
        const forecastLevel = parseInt(forecastText.replace(/[^\d-]/g, ''));

        // Bizonytalansági sáv kiolvasása második 'b' tag-ból, pl: " ± 2"
        let uncertainty = 0;
        if (boldTags.length > 1) {
          const uncertaintyText = boldTags[1]?.textContent?.trim() || '';
          const uncertaintyMatch = uncertaintyText.match(/±\s*(\d+)/);
          if (uncertaintyMatch) {
            uncertainty = parseInt(uncertaintyMatch[1]);
          }
        }

        if (!isNaN(forecastLevel) && dayOffset > 0 && dayOffset <= 6) {
          forecasts.push({
            day: dayOffset,
            waterLevel: forecastLevel,
            uncertainty: uncertainty,
            date: forecastDate
          });
        }
      }
    }
  }

  return forecasts;
}
```

## 3. Gyűjtőtáblás Előrejelzés Letöltése (Nagybajcs-szerű Fallback)
Itt rövidebb, csak 1-2 napos adat érhető el általában, ez azokhoz az állomásokhoz kell, amikhez nincs egyedi id-vel rendelkező napi bontású oldal.

```typescript
/**
 * Összevont előrejelző tábla azokhoz az állomásokhoz, amiknek nincs részletes táblája.
 * Forrás: https://www.hydroinfo.hu/tables/dunelotH.html
 */
async function scrapeHydroinfoForecast() {
  const url = 'https://www.hydroinfo.hu/tables/dunelotH.html';

  const response = await fetchWithRetry(() => fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PWA Scraper/1.0)'
    }
  }));

  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-2');
  const html = decoder.decode(buffer);

  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Failed to parse HTML from hydroinfo.hu');
  }

  const forecasts: Record<string, Array<{ day: number; waterLevel: number; uncertainty: number; date: string }>> = {};
  const tables = doc.querySelectorAll('table');

  for (const table of tables) {
    const rows = table.querySelectorAll('tr');

    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) continue;

      // Nagybajcs esetében pl. a cellák felépítése fura lehet
      const cell0Text = cells[0]?.textContent?.trim() || '';
      const cell1Text = cells[1]?.textContent?.trim() || '';
      const stationText = cell0Text + ' ' + cell1Text;

      for (const station of STATIONS) {
        if (stationText.includes(station.name)) {
          const stationForecasts = [];
          let dayCounter = 0;

          // Végignézzük az érték cellákat
          for (let i = 2; i < cells.length; i++) {
            const cell = cells[i];
            const cellText = cell.textContent?.trim() || '';

            // '±' cella átugrása
            if (cellText.includes('±')) continue;
            // 2. indexű (aktuális adat oszlop) átugrása
            if (i === 2) continue;

            const boldTags = cell.querySelectorAll('b');

            if (boldTags.length > 0) {
              const forecastText = boldTags[0]?.textContent?.trim() || '';
              const forecastLevel = parseInt(forecastText.replace(/[^\d-]/g, ''));

              let uncertainty = 0;
              const nextCell = cells[i + 1];
              if (nextCell) {
                const nextCellText = nextCell.textContent?.trim() || '';
                const uncertaintyMatch = nextCellText.match(/±\s*(\d+)/);
                if (uncertaintyMatch) {
                  uncertainty = parseInt(uncertaintyMatch[1]);
                }
              }

              if (!isNaN(forecastLevel) && forecastLevel < 1000) {
                dayCounter++;
                const dayOffset = dayCounter;
                const forecastDate = new Date();
                forecastDate.setDate(forecastDate.getDate() + dayOffset);

                stationForecasts.push({
                  day: dayOffset,
                  waterLevel: forecastLevel,
                  uncertainty: uncertainty,
                  date: forecastDate.toISOString().split('T')[0]
                });

                if (dayCounter >= 6) break;
              }
            }
          }

          if (stationForecasts.length > 0) {
            forecasts[station.name] = stationForecasts;
          }
          break;
        }
      }
    }
  }

  return forecasts;
}
```

## Használati Példa (Fő Ciklus)

```typescript
// Aktuális adatok
const actualData = await scrapeHydroinfoActual();
console.log(actualData['Nagybajcs']); 
// pl: { waterLevel: 240, flowRate: 1450, waterTemp: 11.2 }

// Előrejelzések összegyűjtése
let allForecasts: Record<string, any> = {};

for (const station of STATIONS) {
  if (station.hydroinfoId && !station.useConsolidatedTable) {
    const detailForecast = await scrapeHydroinfoDetailTable(station.hydroinfoId);
    if (detailForecast.length > 0) {
      allForecasts[station.name] = detailForecast;
    }
  }
}

// Fallback az olyan állomásokhoz mint Nagybajcs (részletes tábla nélküli)
const consolidatedForecasts = await scrapeHydroinfoForecast();
for (const [stationName, stationForecasts] of Object.entries(consolidatedForecasts)) {
  if (!allForecasts[stationName]) {
    allForecasts[stationName] = stationForecasts;
  }
}
```
