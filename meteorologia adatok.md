
METEOROLÓGIA MD


Meteorológiai Adatforrások és Tervezési Terv
1. Előrejelzési Adatok
Meteoblue API: YOUR_METEOBLUE_API_KEY_HERE
* Hourly és daily előrejelzések, 14 napra előre, JSON/CSV formátumban MeteoblueMeteoblue- Különböző csomagok: basic, clouds, wind, air stb. Meteoarena- Földrajzi koordináták alapján lekérdezés Meteoblue- ✅ Előny: Professzionális, precíz, már van API kulcsod
* ⚠️ Hátrány: Fizetős, de trial elérhető
Yr.no (Norvég Meteorológiai Intézet):
* Ingyenes locationforecast API JSON formátumban, 6 órás és 12 órás bontásban YrYr- Compact endpoint ajánlott, Complete túl nagy Yr- User-Agent header kötelező, If-Modified-Since cache támogatás Yr- ✅ Előny: Teljesen ingyenes, megbízható, jó dokumentáció
* ⚠️ Hátrány: Maximum 4 tizedesjegy koordinátákban
2. Aktuális Időjárási Adatok (Magyar források)
OpenWeatherMap (alternatíva):
* Ingyenes tier: 1000 hívás/nap, aktuális időjárás + 5 napos előrejelzés
* OpenWeatherMap Geocoding API településnevek koordinátákká alakításához
* OpenWeatherMapOpenWeatherMap ✅ Előny: Egyszerű, megbízható, magyar települések támogatottak
3. Radar Adatok
RainViewer API:
* Ingyenes, világszintű radar adatok tile formában
* RainViewer ⚠️ 2025-től korlátozott: 1000 kérés/IP/perc, 2026-tól csak múltbeli adatok
* RainViewer Leaflet.js integráció példakóddal
* GitHubGitHub ✅ Előny: Egyszerű használat, animált radar
🏗️ Ajánlott Architektúra
Települések Koordinátái
const cities = {
  'Baja': { lat: 46.1811, lon: 19.0000 },
  'Szekszárd': { lat: 46.3481, lon: 18.7086 },
  'Dunaszekcső: { lat: 46.1333, lon: 18.7667 },
  'Mohács': { lat: 45.9933, lon: 18.6842 }
};
```

#### **Adatforrás Stratégia**

**Option A - Hibrid Megoldás (Ajánlott)**:
1. **Aktuális adatok**: OpenWeatherMap (ingyenes, 1000/nap elég)
2. **Előrejelzés forrás 1**: Meteoblue (már van API-d)
3. **Előrejelzés forrás 2**: Yr.no (ingyenes)
4. **Radar**: RainViewer (tile formátum Leaflet-tel)


### 📱 **PWA Struktúra**
```
📦 Komponensek
├── 🏙️ CitySelector (dropdown: Baja, Szekszárd, Dunaszekcső, Mohács)
│
├── 📊 CurrentWeatherCards (aktuális adatok)
│   ├── TemperatureCard
│   ├── PrecipitationCard
│   ├── WindSpeedCard
│   ├── PressureCard
│   ├── HumidityCard
│   └── WindDirectionCard
│
├── 📈 ForecastCharts (3 napos, 6 órás bontás)
│   ├── TemperatureChart (2 forrás: Meteoblue + Yr.no)
│   ├── PrecipitationChart (2 forrás)
│   ├── WindChart (2 forrás)
│   └── PressureChart (2 forrás)
│
└── 🗺️ RadarMap (élő radar Magyarországra)
    └── RainViewer Leaflet integráció  🔧 Implementációs Lépések
1. API kulcsok beszerzése:
    * ✅ Meteoblue PAI kulcs: YOUR_METEOBLUE_API_KEY_HERE
    * 🔑 OpenWeatherMap regisztráció
name: DunApp
Api Kulcsár: YOUR_OPENWEATHER_API_KEY_HERE
dokumentáció: https://openweathermap.org/api/one-call-3#access_api
 API key:

- Within the next couple of hours, your API key 511dd4343465049c67dfbaca353c83e6 will be activated and ready to use
- You can later create more API keys on your account page
- Please, always use your API key in each API call

Endpoint:

- Please, use the endpoint api.openweathermap.org for your API calls

Example of API call:
api.openweathermap.org/data/2.5/weather?q=London,uk&APPID=511dd4343465049c67dfbaca353c83e6

Useful links:

- API documentation https://openweathermap.org/api
- Details of your plan https://openweathermap.org/price
- Please, note that 16-days daily forecast and History API are not available for Free subscribers
    * 🔑 Yr.no (nincs kulcs, csak User-Agent header)
1. Adatlekérő szolgáltatások:
// services/weatherService.js
   - fetchCurrentWeather(city) → OpenWeatherMap
   - fetchMeteoBlueforecast(lat, lon) → Meteoblue
   - fetchYrForecast(lat, lon) → Yr.no
   - fetchRadarFrames() → RainViewer
1. Grafikon könyvtár: Recharts vagy Chart.js (React-kompatibilis)
2. Radar megjelenítés: Leaflet + RainViewer tiles
3. PWA funkciók:
    * Service Worker offline cache
    * Manifest.json
    * Periodic background sync (frissítések)
