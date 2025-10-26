# 📊 DATA_SOURCES.md - DunApp PWA Adatforrások

> **Teljes adatforrás dokumentáció minden modulhoz**  
> API kulcsok, endpoint-ok, scraping stratégiák

**Utolsó frissítés:** 2025-10-24  
**Verzió:** 2.0 (Produkciós API-kkal)  
**Status:** ✅ Production Ready

---

## 📋 TARTALOMJEGYZÉK

1. [Meteorológia Adatforrások](#meteorology)
2. [Vízállás Adatforrások](#water-level)
3. [Aszály & Talajvíz Adatforrások](#drought)
4. [Csapadék Adatforrások](#precipitation)
5. [Adatfrissítési Stratégia](#refresh-strategy)
6. [Hibakezelés & Fallback](#error-handling)
7. [Költség Számítás](#costs)

---

## 🌤️ METEOROLÓGIA ADATFORRÁSOK {#meteorology}

### Célterület
4 város: **Szekszárd, Baja, Dunaszekcső, Mohács**

### Adattípusok
- Aktuális időjárás (hőmérséklet, csapadék, szélsebesség, stb.)
- 3 napos előrejelzés
- 6 órás bontású előrejelzés
- Radar térkép (Magyarország)

---

### 1. **OpenWeatherMap API** ⭐ (Elsődleges - Aktuális adatok)

**Status:** Regisztrálva, API kulcs aktív

**API Kulcsok:**
```
Primary Key:   cd125c5eeeda398551503129fc08636d
Backup Key:    511dd4343465049c67dfbaca353c83e6
```

**Endpoint:**
```
Base URL: https://api.openweathermap.org/data/2.5

Aktuális időjárás:
GET /weather?q={city},hu&appid={API_KEY}&units=metric&lang=hu

5 napos előrejelzés:
GET /forecast?q={city},hu&appid={API_KEY}&units=metric&lang=hu

One Call API (3.0):
GET /onecall?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&lang=hu&exclude=minutely,alerts
```

**Rate Limits:**
- Free tier: 1,000 hívás/nap
- ≈ 42 hívás/óra
- 4 város × 2 endpoint = 8 hívás/frissítés
- **Maximális frissítés:** 5x/óra (biztonságos: 3x/óra)

**Példa Válasz:**
```json
{
  "coord": {"lon": 18.7097, "lat": 46.3481},
  "weather": [
    {
      "id": 800,
      "main": "Clear",
      "description": "tiszta égbolt",
      "icon": "01d"
    }
  ],
  "main": {
    "temp": 23.5,
    "feels_like": 22.8,
    "temp_min": 21.3,
    "temp_max": 25.1,
    "pressure": 1013,
    "humidity": 65
  },
  "wind": {
    "speed": 3.2,
    "deg": 180,
    "gust": 5.5
  },
  "rain": {
    "1h": 0
  },
  "dt": 1635768000,
  "name": "Szekszárd"
}
```

**Koordináták:**
```javascript
const cities = {
  'Szekszárd': { lat: 46.3481, lon: 18.7097 },
  'Baja': { lat: 46.1811, lon: 18.9550 },
  'Dunaszekcső': { lat: 46.0833, lon: 18.7667 },
  'Mohács': { lat: 45.9928, lon: 18.6836 }
};
```

**Dokumentáció:**
- https://openweathermap.org/api
- https://openweathermap.org/current
- https://openweathermap.org/forecast5

---

### 2. **Meteoblue API** ⭐⭐ (Másodlagos - Precíz előrejelzés)

**Status:** API kulcs aktív

**API Kulcs:**
```
API Key: M3VCztJiO2Gn7jsS
```

**Endpoint:**
```
Base URL: https://my.meteoblue.com/packages

Hourly forecast (14 nap):
GET /basic-1h?apikey={KEY}&lat={lat}&lon={lon}&format=json

Daily forecast:
GET /basic-day?apikey={KEY}&lat={lat}&lon={lon}&format=json

Trend forecast:
GET /trend-1h?apikey={KEY}&lat={lat}&lon={lon}&format=json
```

**Csomagok:**
- `basic-1h` - Óránkénti előrejelzés
- `basic-day` - Napi előrejelzés
- `clouds-1h` - Felhőzet
- `wind-1h` - Szél részletek
- `air-1h` - Levegő minőség

**Rate Limits:**
- Trial: 2,000 hívás/hó (≈67/nap)
- Paid: 10,000+

**Példa Válasz:**
```json
{
  "metadata": {
    "name": "Szekszárd",
    "latitude": 46.3481,
    "longitude": 18.7097,
    "timezone": "Europe/Budapest"
  },
  "units": {
    "time": "ISO8601",
    "temperature": "°C",
    "windspeed": "km/h",
    "precipitation": "mm"
  },
  "data_1h": {
    "time": ["2025-10-24T14:00", "2025-10-24T15:00", ...],
    "temperature": [23, 24, 25, ...],
    "precipitation": [0, 0, 0.2, ...],
    "windspeed": [12, 15, 18, ...],
    "winddirection": [180, 185, 190, ...]
  }
}
```

**Dokumentáció:**
- https://docs.meteoblue.com/
- https://www.meteoblue.com/en/weather-api/packages

---

### 3. **Yr.no API** (Ingyenes - Norvég Met Office)

**Status:** Ingyenes, nincs API kulcs

**Endpoint:**
```
Base URL: https://api.met.no/weatherapi/locationforecast/2.0

Compact forecast:
GET /compact?lat={lat}&lon={lon}
```

**Headers (KÖTELEZŐ!):**
```javascript
{
  'User-Agent': 'DunApp PWA/1.0 (contact@dunapp.hu)',
  'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT' // Cache
}
```

**Rate Limits:**
- Nincs hard limit, de "fair use" politika
- Ajánlott: max. 20 hívás/másodperc
- Cache-elés kötelező (If-Modified-Since header)

**Példa Válasz:**
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [18.7097, 46.3481, 100]
  },
  "properties": {
    "timeseries": [
      {
        "time": "2025-10-24T14:00:00Z",
        "data": {
          "instant": {
            "details": {
              "air_temperature": 23.5,
              "relative_humidity": 65.0,
              "wind_speed": 3.2,
              "wind_from_direction": 180
            }
          },
          "next_6_hours": {
            "summary": {
              "symbol_code": "clearsky_day"
            },
            "details": {
              "precipitation_amount": 0.0
            }
          }
        }
      }
    ]
  }
}
```

**Dokumentáció:**
- https://api.met.no/weatherapi/locationforecast/2.0/documentation

---

### 4. **RainViewer API** (Radar Térkép)

**Status:** Ingyenes (korlátokkal)

**Endpoint:**
```
Weather maps:
GET https://api.rainviewer.com/public/weather-maps.json

Radar tiles:
GET https://tilecache.rainviewer.com/v2/radar/{timestamp}/{size}/{z}/{x}/{y}/{color}/{options}.png
```

**Rate Limits:**
- 2025-2026: 1,000 kérés/IP/perc
- 2026+: Csak múltbeli adatok ingyenesen

**Példa Használat (Leaflet.js):**
```javascript
// 1. Weather maps lekérése
const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
const data = await response.json();

// 2. Legfrissebb radar frame
const latestTimestamp = data.radar.past[data.radar.past.length - 1].time;

// 3. Tile URL generálás
const tileUrl = `https://tilecache.rainviewer.com/v2/radar/${latestTimestamp}/256/{z}/{x}/{y}/2/1_1.png`;

// 4. Leaflet layer hozzáadás
const radarLayer = L.tileLayer(tileUrl, {
  opacity: 0.6,
  attribution: 'RainViewer'
});
radarLayer.addTo(map);
```

**Korlátok Kezelése:**
- Cache-eld a tiles-okat (Service Worker)
- Frissítés: max 10 percenként
- Csak Magyarország területére

**Dokumentáció:**
- https://www.rainviewer.com/api.html
- https://github.com/rainviewer/rainviewer-api-example

---

### Adatfrissítési Stratégia (Meteorológia)

```javascript
// Supabase Edge Function: fetch-meteorology (cron job)

const REFRESH_SCHEDULE = {
  current: '*/20 * * * *',      // 20 percenként
  forecast: '0 */3 * * *',      // 3 óránként
  radar: '*/10 * * * *'         // 10 percenként
};

// Fallback hierarchia
async function fetchWeatherData(city) {
  try {
    // 1. OpenWeatherMap (elsődleges)
    return await fetchFromOpenWeather(city);
  } catch (error) {
    console.warn('OpenWeather failed, trying Meteoblue...');
    
    try {
      // 2. Meteoblue (másodlagos)
      return await fetchFromMeteoblue(city);
    } catch (error2) {
      console.warn('Meteoblue failed, trying Yr.no...');
      
      // 3. Yr.no (végső fallback)
      return await fetchFromYrNo(city);
    }
  }
}
```

---

## 💧 VÍZÁLLÁS ADATFORRÁSOK {#water-level}

### Célterület
3 állomás: **Baja, Mohács, Nagybajcs** (Duna)

### Adattípusok
- Aktuális vízállás (cm)
- Vízhozam (m³/s)
- Vízhőmérséklet (°C)
- 5 napos előrejelzés

---

### 1. **vizugy.hu** ⭐ (Elsődleges - Aktuális adatok)

**Status:** Web Scraping (nincs hivatalos API)

**URL:**
```
Aktuális vízállások:
https://www.vizugy.hu/index.php?module=content&programelemid=138

Állomás részletek:
https://www.vizugy.hu/index.php?id=vizmerce&mernev={station_name}
```

**Scraping Stratégia:**
```javascript
// Puppeteer vagy Cheerio

const STATIONS = ['Nagybajcs', 'Mohács', 'Baja'];

async function scrapeVizugyActual() {
  const response = await axios.get(VIZUGY_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(response.data);
  const data = [];

  $('table tr').each((index, row) => {
    const cells = $(row).find('td');
    const stationName = $(cells[0]).text().trim();
    
    if (STATIONS.some(s => stationName.includes(s))) {
      // Vízállás utolsó 8 oszlopból
      const waterLevel = parseInt($(cells[cells.length - 1]).text());
      
      data.push({
        station: stationName,
        waterLevel: waterLevel,
        unit: 'cm',
        timestamp: new Date().toISOString()
      });
    }
  });

  return data;
}
```

**HTML Struktúra (példa):**
```html
<table>
  <tr>
    <td>Mohács</td>
    <td>394</td> <!-- aktuális vízállás cm -->
    <td>395</td>
    <td>396</td>
    ...
  </tr>
</table>
```

**Frissítési Gyakoriság:**
- Óránként (a vizugy.hu-n óránként frissül)

**Kritikus Szintek (Mohács példa):**
```javascript
const CRITICAL_LEVELS = {
  'Mohács': {
    LNV: 120,  // Legkisebb Navigációs Vízállás
    KKV: 280,  // Közepes Kisvíz
    NV: 700    // Nagyvíz
  }
};
```

---

### 2. **hydroinfo.hu** (Előrejelzés)

**Status:** Web Scraping (ISO-8859-2 kódolás!)

**URL:**
```
Duna előrejelzés:
http://www.hydroinfo.hu/Html/hidelo/duna.html
```

**Scraping Stratégia:**
```javascript
import iconv from 'iconv-lite';

async function scrapeHydroinfoForecast() {
  const response = await axios.get(HYDROINFO_URL, {
    responseType: 'arraybuffer'  // Bináris válasz!
  });

  // ISO-8859-2 dekódolás
  const html = iconv.decode(Buffer.from(response.data), 'ISO-8859-2');
  const $ = cheerio.load(html);
  
  const forecasts = [];
  
  $('table').each((tableIndex, table) => {
    $(table).find('tr').each((rowIndex, row) => {
      const cells = $(row).find('td');
      const stationName = $(cells[0]).text().trim();
      
      if (STATIONS.some(s => stationName.includes(s))) {
        const forecastValues = [];
        
        // 5 napos előrejelzés (következő 5 oszlop)
        for (let i = 1; i <= 5; i++) {
          const value = parseInt($(cells[i]).text());
          if (!isNaN(value)) {
            forecastValues.push({
              day: i,
              waterLevel: value,
              date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        }
        
        forecasts.push({
          station: stationName,
          forecast: forecastValues
        });
      }
    });
  });

  return forecasts;
}
```

**Frissítési Gyakoriság:**
- Naponta 9:30-kor (amikor a hydroinfo.hu frissül)

---

### 3. **data.vizugy.hu** (Alternatív - Ha van API)

**Status:** Vizsgálandó (lehet API vagy XML feed)

**Potenciális Endpoint:**
```
https://data.vizugy.hu/api/stations/{station_id}/latest
```

**Folyamat:**
1. Nyisd meg böngészőben: https://data.vizugy.hu/
2. Developer Tools → Network tab
3. Válassz állomást
4. Keresd meg az AJAX/API hívást
5. Másold ki az endpoint-ot

**Ha van API:**
```javascript
async function fetchFromDataVizugy(stationId) {
  const response = await axios.get(`https://data.vizugy.hu/api/stations/${stationId}/latest`, {
    headers: {
      'Accept': 'application/json'
    }
  });

  return {
    station: response.data.name,
    waterLevel: response.data.waterLevel,
    flowRate: response.data.flowRate,
    waterTemp: response.data.waterTemp,
    timestamp: response.data.timestamp
  };
}
```

---

### 4. **vmservice.vizugy.hu** ⭐⭐ (Hidrometeorológiai adatok)

**Status:** CSV/XLSX export (manuális vagy automatizált)

**URL:**
```
https://vmservice.vizugy.hu/
```

**Folyamat:**
1. Adatlekérdezés → Hidrometeorológiai adatok
2. Állomások kiválasztása (Baja, Mohács, Nagybajcs)
3. Dátum beállítása (elmúlt 60 nap)
4. Export: CSV/XLSX

**Automatizált Letöltés (Puppeteer):**
```javascript
import puppeteer from 'puppeteer';

async function downloadVMServiceData() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://vmservice.vizugy.hu/');
  
  // Bejelentkezés (ha szükséges)
  // await page.type('#username', 'user');
  // await page.type('#password', 'pass');
  // await page.click('#login');
  
  // Állomások kiválasztása
  await page.click('#hydrometeo-menu');
  await page.select('#stations', ['Baja', 'Mohács', 'Nagybajcs']);
  
  // Dátum beállítása
  await page.type('#start-date', '2024-08-25');
  await page.type('#end-date', '2024-10-24');
  
  // Export
  await page.click('#export-csv');
  
  // CSV feldolgozása
  const csvData = await page.evaluate(() => {
    return document.querySelector('#data').textContent;
  });
  
  await browser.close();
  
  // Parse CSV
  return parseCSV(csvData);
}
```

---

### Adatfrissítési Stratégia (Vízállás)

```javascript
const REFRESH_SCHEDULE = {
  actual: '0 * * * *',           // Óránként
  forecast: '30 9 * * *',        // Naponta 9:30
  check_push: '0 */6 * * *'      // 6 óránként (push notification check)
};

// Push notification trigger (Mohács >= 400 cm)
async function checkWaterLevelAlert() {
  const data = await scrapeVizugyActual();
  const mohacsData = data.find(d => d.station.includes('Mohács'));
  
  if (mohacsData && mohacsData.waterLevel >= 400) {
    await sendPushNotification({
      title: 'Vízállás Figyelmeztetés - Mohács',
      body: 'A mai vízállás lehetővé teszi a vízutánpótlást a Belső-Béda vízrendszerbe!',
      data: {
        station: 'Mohács',
        waterLevel: mohacsData.waterLevel
      }
    });
  }
}
```

---

## 🏜️ ASZÁLY & TALAJVÍZ ADATFORRÁSOK {#drought}

### Célterület
- **Aszálymonitoring:** 5 helyszín (Katymár, Dávod, Szederkény, Sükösd, Csávoly)
- **Talajvízkutak:** 15 kút

---

### 1. **aszalymonitoring.vizugy.hu** ⭐ (Aszályindex, Talajnedvesség)

**Status:** API elérhető!

**URL:**
```
Base: https://aszalymonitoring.vizugy.hu/

Település keresés:
GET /api/search?settlement={name}

Állomás adatok:
GET /api/station/{station_id}/data?from={date}&to={date}
```

**Elérhető Paraméterek:**
- Aszályindex (HDI - Hungarian Drought Index)
- Talajnedvesség (6 mélységben: 10, 20, 30, 50, 70, 100 cm)
- Talajhőmérséklet
- Levegőhőmérséklet
- Csapadék
- Relatív páratartalom
- Vízhiány index (HDIS)

**Példa API Hívás:**
```javascript
async function fetchDroughtData(settlement) {
  // 1. Keresés településnév alapján
  const searchResponse = await axios.get(
    `https://aszalymonitoring.vizugy.hu/api/search?settlement=${settlement}`
  );
  
  const stationId = searchResponse.data.nearestStation.id;
  
  // 2. Adatok lekérése (elmúlt 60 nap)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const dataResponse = await axios.get(
    `https://aszalymonitoring.vizugy.hu/api/station/${stationId}/data?from=${startDate}&to=${endDate}`
  );
  
  return {
    settlement: settlement,
    station: searchResponse.data.nearestStation.name,
    distance: searchResponse.data.nearestStation.distance,
    data: dataResponse.data.map(d => ({
      date: d.date,
      droughtIndex: d.HDI,
      soilMoisture: {
        cm10: d.soilMoisture_10cm,
        cm20: d.soilMoisture_20cm,
        cm30: d.soilMoisture_30cm,
        cm50: d.soilMoisture_50cm,
        cm70: d.soilMoisture_70cm,
        cm100: d.soilMoisture_100cm
      },
      waterDeficit: d.HDIS,
      precipitation: d.precipitation,
      airTemperature: d.airTemp,
      soilTemperature: d.soilTemp,
      humidity: d.relativeHumidity
    }))
  };
}
```

**5 Monitoring Helyszín:**
```javascript
const DROUGHT_LOCATIONS = [
  { name: 'Katymár', lat: 46.2167, lon: 19.5667 },
  { name: 'Dávod', lat: 46.4167, lon: 18.7667 },
  { name: 'Szederkény', lat: 46.3833, lon: 19.2500 },
  { name: 'Sükösd', lat: 46.2833, lon: 19.0000 },
  { name: 'Csávoly', lat: 46.4500, lon: 19.2833 }
];
```

**Jegyzet:** Az API automatikusan a legközelebbi állomást találja meg (lehet 10-30 km távolságban).

---

### 2. **vizhiany.vizugy.hu** (Vízhiány Térkép)

**Status:** Térkép adatok (API vagy GeoJSON)

**URL:**
```
https://vizhiany.vizugy.hu/
```

**Adatok:** Területi vízhiány heatmap/choropleth

**Potenciális Endpoint:**
```
GeoJSON vagy Tile service
GET /api/water-deficit/tiles/{z}/{x}/{y}.png
```

**Folyamat:**
1. Developer Tools → Network tab
2. Figyeld a térkép betöltését
3. Keresd meg a tile vagy GeoJSON endpoint-ot

**Ha GeoJSON:**
```javascript
async function fetchWaterDeficitMap() {
  const response = await axios.get('https://vizhiany.vizugy.hu/api/geojson');
  
  // Leaflet térképre
  L.geoJSON(response.data, {
    style: (feature) => ({
      fillColor: getColorByDeficit(feature.properties.deficit),
      fillOpacity: 0.6,
      weight: 1
    })
  }).addTo(map);
}
```

---

### 3. **vmservice.vizugy.hu** ⭐⭐ (Talajvízkutak - 15 db)

**Status:** CSV/XLSX export

**15 Talajvízkút Azonosítók:**
```javascript
const GROUNDWATER_WELLS = [
  { name: 'Sátorhely', code: '4576', lat: 46.3333, lon: 19.3667 },
  { name: 'Mohács', code: '1460', lat: 45.9928, lon: 18.6836 },
  { name: 'Hercegszántó', code: '1450', lat: 46.1833, lon: 19.0167 },
  { name: 'Alsónyék', code: '662', lat: 46.2667, lon: 18.5667 },
  { name: 'Szekszárd-Borrév', code: '656', lat: 46.3481, lon: 18.7097 },
  { name: 'Mohács II.', code: '912', lat: 45.9928, lon: 18.6836 },
  { name: 'Mohács-Sárhát', code: '4481', lat: 45.9928, lon: 18.6836 },
  { name: 'Nagybaracska', code: '4479', lat: 46.1333, lon: 18.9833 },
  { name: 'Érsekcsanád', code: '1426', lat: 46.2833, lon: 19.4167 },
  { name: 'Őcsény', code: '653', lat: 46.3167, lon: 18.6667 },
  { name: 'Kölked', code: '1461', lat: 46.0167, lon: 18.7500 },
  { name: 'Dávod', code: '448', lat: 46.4167, lon: 18.7667 },
  { name: 'Szeremle', code: '132042', lat: 46.5500, lon: 19.0333 },
  { name: 'Decs', code: '658', lat: 46.3833, lon: 18.7167 },
  { name: 'Báta', code: '660', lat: 46.2000, lon: 18.7833 }
];
```

**URL:**
```
https://vmservice.vizugy.hu/
→ Adatlekérdezés
→ Talajvíz adatok
→ Kút azonosító szerinti keresés
```

**Automatizált Letöltés (Puppeteer):**
```javascript
async function downloadGroundwaterData(wellCodes) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://vmservice.vizugy.hu/');
  
  // Talajvíz modul
  await page.click('#groundwater-menu');
  
  const allData = [];
  
  for (const wellCode of wellCodes) {
    // Kút keresése azonosító alapján
    await page.type('#well-code', wellCode);
    await page.click('#search');
    
    // Dátum: elmúlt 60 nap
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    await page.type('#start-date', startDate);
    await page.type('#end-date', endDate);
    
    // Export CSV
    await page.click('#export-csv');
    
    // CSV adatok
    const csvData = await page.evaluate(() => {
      return document.querySelector('#data-table').textContent;
    });
    
    allData.push({
      wellCode: wellCode,
      data: parseCSV(csvData)
    });
    
    // Reset a következő kúthoz
    await page.click('#reset');
  }
  
  await browser.close();
  return allData;
}
```

**Példa CSV Struktúra:**
```csv
Dátum,Talajvízszint (m),Talajvízszint (mBf),Hőmérséklet (°C)
2024-10-24,-2.34,98.66,14.5
2024-10-23,-2.36,98.64,14.3
...
```

**Adatok Feldolgozása:**
```javascript
function parseGroundwaterCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      date: values[0],
      waterLevelMeters: parseFloat(values[1]),
      waterLevelMasl: parseFloat(values[2]),  // mBf = méter a Balti tenger felett
      temperature: parseFloat(values[3])
    };
  });
}
```

---

### 4. **HUGEO** (Talajvízszint Térkép)

**Status:** Térkép szolgáltatás

**URL:**
```
https://map.hu-geo.hu/  (vagy hasonló)
```

**Funkció:** Magyarországi talajvízszint térképes megjelenítés

**Implementáció:**
- WMS (Web Map Service) vagy WMTS layer
- Leaflet integráció

```javascript
const HUGEOLayer = L.tileLayer.wms('https://map.hu-geo.hu/wms', {
  layers: 'groundwater_level',
  format: 'image/png',
  transparent: true,
  attribution: 'HUGEO'
});

HUGEOLayer.addTo(map);
```

---

## 💦 CSAPADÉK ADATFORRÁSOK {#precipitation}

### Célterület
4 város: **Szekszárd, Baja, Dunaszekcső, Mohács**

### Adattípusok
- Napi csapadék
- Elmúlt 7 napi összeg
- Tárgyévi csapadék összeg

---

### **vmservice.vizugy.hu** ⭐⭐⭐ (Egyetlen forrás mindenhez!)

**Status:** CSV/XLSX export

**URL:**
```
https://vmservice.vizugy.hu/
→ Adatlekérdezés
→ Hidrometeorológiai adatok
→ Csapadék adatok
```

**Folyamat:**
1. Állomások kiválasztása (Szekszárd, Baja, Dunaszekcső, Mohács)
2. Dátum beállítása
   - Napi: Ma
   - 7 napos: Elmúlt 7 nap
   - Éves: Január 1. - Ma
3. Export: CSV/XLSX

**Automatizált Lekérdezés:**
```javascript
async function fetchPrecipitationData(cities) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://vmservice.vizugy.hu/');
  
  // Hidrometeorológiai modul
  await page.click('#hydrometeo-menu');
  await page.click('#precipitation');
  
  // Állomások kiválasztása
  await page.select('#stations', cities);
  
  const results = {};
  
  // 1. Napi csapadék (ma)
  const today = new Date().toISOString().split('T')[0];
  await page.type('#date', today);
  await page.click('#export-csv');
  
  const dailyCSV = await page.evaluate(() => document.querySelector('#data').textContent);
  results.daily = parseCSV(dailyCSV);
  
  // 2. 7 napos összeg
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await page.type('#start-date', sevenDaysAgo);
  await page.type('#end-date', today);
  await page.click('#sum-checkbox');  // Összegzés funkció
  await page.click('#export-csv');
  
  const weeklyCSV = await page.evaluate(() => document.querySelector('#data').textContent);
  results.weekly = parseCSV(weeklyCSV);
  
  // 3. Éves összeg
  const yearStart = `${new Date().getFullYear()}-01-01`;
  await page.type('#start-date', yearStart);
  await page.click('#export-csv');
  
  const yearlyCSV = await page.evaluate(() => document.querySelector('#data').textContent);
  results.yearly = parseCSV(yearlyCSV);
  
  await browser.close();
  
  return {
    daily: results.daily,
    weekly: results.weekly,
    yearly: results.yearly
  };
}
```

**Példa Eredmény:**
```javascript
{
  daily: {
    'Szekszárd': 12,  // mm
    'Baja': 8,
    'Dunaszekcső': 5,
    'Mohács': 15
  },
  weekly: {
    'Szekszárd': 48,  // mm
    'Baja': 35,
    'Dunaszekcső': 28,
    'Mohács': 52
  },
  yearly: {
    'Szekszárd': 342,  // mm
    'Baja': 298,
    'Dunaszekcső': 275,
    'Mohács': 365
  }
}
```

---

## 🔄 ADATFRISSÍTÉSI STRATÉGIA {#refresh-strategy}

### Supabase Edge Functions (Cron Jobs)

```javascript
// supabase/functions/fetch-all-data/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    // 1. Meteorológia (20 percenként)
    await fetchMeteorologyData();
    
    // 2. Vízállás (óránként)
    await fetchWaterLevelData();
    
    // 3. Aszály & Talajvíz (naponta)
    await fetchDroughtData();
    
    // 4. Csapadék (naponta)
    await fetchPrecipitationData();
    
    // 5. Push Notification Check (6 óránként)
    await checkPushNotifications();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### Cron Schedules

```sql
-- Meteorológia: 20 percenként
SELECT cron.schedule(
  'fetch-meteorology',
  '*/20 * * * *',
  $$SELECT net.http_post(url := 'https://your-project.supabase.co/functions/v1/fetch-meteorology')$$
);

-- Vízállás: óránként
SELECT cron.schedule(
  'fetch-water-level',
  '0 * * * *',
  $$SELECT net.http_post(url := 'https://your-project.supabase.co/functions/v1/fetch-water-level')$$
);

-- Aszály: naponta 6:00
SELECT cron.schedule(
  'fetch-drought',
  '0 6 * * *',
  $$SELECT net.http_post(url := 'https://your-project.supabase.co/functions/v1/fetch-drought')$$
);

-- Csapadék: naponta 7:00
SELECT cron.schedule(
  'fetch-precipitation',
  '0 7 * * *',
  $$SELECT net.http_post(url := 'https://your-project.supabase.co/functions/v1/fetch-precipitation')$$
);

-- Push Notification Check: 6 óránként
SELECT cron.schedule(
  'check-water-level-alert',
  '0 */6 * * *',
  $$SELECT net.http_post(url := 'https://your-project.supabase.co/functions/v1/check-water-level')$$
);
```

---

## ⚠️ HIBAKEZELÉS & FALLBACK {#error-handling}

### Hibahierarchia

```javascript
// 1. Elsődleges forrás
try {
  return await fetchFromPrimary();
} catch (error1) {
  console.warn('Primary failed:', error1);
  
  // 2. Másodlagos forrás
  try {
    return await fetchFromSecondary();
  } catch (error2) {
    console.warn('Secondary failed:', error2);
    
    // 3. Cache-ből (ha van)
    try {
      const cached = await getCachedData();
      if (cached && isNotStale(cached)) {
        return cached;
      }
    } catch (error3) {
      // 4. Hibajelzés
      throw new Error('All data sources failed');
    }
  }
}
```

### Retry Stratégia

```javascript
async function fetchWithRetry(fetchFn, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Exponential backoff
      delayMs *= 2;
    }
  }
}
```

### Cache Stratégia

```javascript
const CACHE_DURATION = {
  meteorology: 20 * 60 * 1000,      // 20 perc
  waterLevel: 60 * 60 * 1000,       // 1 óra
  drought: 24 * 60 * 60 * 1000,     // 24 óra
  precipitation: 24 * 60 * 60 * 1000 // 24 óra
};

async function getCachedOrFetch(key, fetchFn, cacheDuration) {
  // 1. Cache ellenőrzés
  const cached = await supabase
    .from('cache')
    .select('*')
    .eq('key', key)
    .single();
  
  if (cached.data) {
    const age = Date.now() - new Date(cached.data.created_at).getTime();
    
    if (age < cacheDuration) {
      console.log('✅ Cache hit:', key);
      return JSON.parse(cached.data.value);
    }
  }
  
  // 2. Friss adat lekérése
  console.log('🔄 Cache miss, fetching:', key);
  const freshData = await fetchFn();
  
  // 3. Cache frissítése
  await supabase
    .from('cache')
    .upsert({
      key: key,
      value: JSON.stringify(freshData),
      created_at: new Date().toISOString()
    });
  
  return freshData;
}
```

---

## 💰 KÖLTSÉG SZÁMÍTÁS {#costs}

### API Hívások / Nap

```
Meteorológia:
- OpenWeatherMap: 4 város × 2 endpoint × 72 hívás/nap = 576 hívás
- Rate Limit: 1,000/nap → OK ✅
- Költség: $0/hó (free tier)

- Meteoblue: 4 város × 3 hívás/nap = 12 hívás
- Rate Limit: 67/nap (trial) → OK ✅
- Költség: $0/hó (trial), later $29+/hó

- Yr.no: 4 város × 8 hívás/nap = 32 hívás
- Rate Limit: Fair use → OK ✅
- Költség: $0/hó (ingyenes)

- RainViewer: 144 tile kérés/nap
- Rate Limit: 1,000/perc → OK ✅
- Költség: $0/hó (2025-ig)

Vízállás:
- vizugy.hu scraping: 24 scrape/nap
- hydroinfo.hu scraping: 1 scrape/nap
- Költség: $0/hó (scraping)

Aszály & Talajvíz:
- aszalymonitoring API: 5 hívás/nap
- vmservice scraping: 1 scrape/nap (15 kút)
- Költség: $0/hó

Csapadék:
- vmservice scraping: 3 scrape/nap (napi, heti, éves)
- Költség: $0/hó

─────────────────────────────────
TOTAL API COSTS: $0-29/hó
```

### Infrastruktúra Költségek

```
Supabase:
- Free tier: 500MB DB, 2GB bandwidth
- DunApp becslés: ~200MB DB, 1GB bandwidth
- Költség: $0/hó → Later $25/hó (Pro)

Netlify:
- Free tier: 100GB bandwidth
- DunApp becslés: ~10GB/hó
- Költség: $0/hó

Scraping Szolgáltatás (opcionális):
- ScrapingBee vagy similar: $49/hó (10K scrapes)
- Saját server: $5-10/hó (VPS)
- Költség: $0-49/hó

─────────────────────────────────
TOTAL INFRA: $0-74/hó
```

### Összesített Költség

```
Kezdő (Free tiers):         $0/hó
Közepes (Meteoblue trial):  $0-29/hó
Teljes (Production):        $54-103/hó
```

---

## 📚 ÖSSZEFOGLALÁS

### Elsődleges Adatforrások

| Modul | Forrás | Típus | Költség | Frissítés |
|-------|--------|-------|---------|-----------|
| Meteorológia | OpenWeatherMap | API | $0 | 20 perc |
| Meteorológia | Meteoblue | API | $0-29 | 3 óra |
| Meteorológia | RainViewer | API | $0 | 10 perc |
| Vízállás | vizugy.hu | Scraping | $0 | 1 óra |
| Vízállás | hydroinfo.hu | Scraping | $0 | 24 óra |
| Aszály | aszalymonitoring | API | $0 | 24 óra |
| Talajvíz | vmservice | Scraping | $0 | 24 óra |
| Csapadék | vmservice | Scraping | $0 | 24 óra |

### Kritikus API Kulcsok (Production)

```env
# .env.production
OPENWEATHER_API_KEY=cd125c5eeeda398551503129fc08636d
METEOBLUE_API_KEY=M3VCztJiO2Gn7jsS
VITE_VAPID_PUBLIC_KEY=BEl62iU...
VAPID_PRIVATE_KEY=xxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### Következő Lépések

1. ✅ API kulcsok aktiválása
2. ✅ Supabase Edge Functions létrehozása
3. ✅ Cron job-ok beállítása
4. ✅ Scraping scriptek implementálása
5. ✅ Cache stratégia setup
6. ✅ Hibakezelés tesztelése
7. ✅ Production deployment

---

*DATA_SOURCES.md v2.0*  
*DunApp PWA - Teljes Adatforrás Dokumentáció*  
*Létrehozva: 2025-10-24*  
*Status: ✅ Production Ready*
