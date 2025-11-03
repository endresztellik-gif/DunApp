# Aszálymonitoring MCP Server

MCP (Model Context Protocol) szerver az aszálymonitoring.vizugy.hu adatainak lekérdezéséhez.

## Funkciók

- Aszály monitoring adatok 5 dél-magyarországi helyszínre
- Aszályindex (HDI - Hungarian Drought Index)
- Talajnedvesség 6 mélységben (10, 20, 30, 50, 70, 100 cm)
- Vízhiány index (HDIS)
- Meteorológiai adatok (hőmérséklet, csapadék, páratartalom)

## Helyszínek

1. **Katymár** - Bács-Kiskun megye
2. **Dávod** - Tolna megye
3. **Szederkény** - Bács-Kiskun megye
4. **Sükösd** - Bács-Kiskun megye
5. **Csávoly** - Bács-Kiskun megye

## Telepítés

```bash
cd aszalymonitoring-mcp
pip install -r requirements.txt
```

## Konfiguráció

### Projekt-specifikus MCP (Ajánlott)

A DunApp PWA projekt már tartalmaz egy MCP konfigurációs fájlt:

**Fájl:** `.claude/mcp_servers.json`

```json
{
  "mcpServers": {
    "hydroinfo": {
      "command": "python3.11",
      "args": [
        "/Volumes/Endre_Samsung1T/codeing/dunapp-pwa/hydroinfo-mcp/server.py"
      ]
    },
    "aszalymonitoring": {
      "command": "python3.11",
      "args": [
        "/Volumes/Endre_Samsung1T/codeing/dunapp-pwa/aszalymonitoring-mcp/server.py"
      ]
    }
  }
}
```

✅ **Már konfigurálva!** Nincs további teendő.

### Alternatív: Claude Desktop Globális Konfiguráció

Ha szeretnéd globálisan használni (minden projektben), add hozzá az `~/Library/Application Support/Claude/claude_desktop_config.json` fájlhoz (macOS):

```json
{
  "mcpServers": {
    "aszalymonitoring": {
      "command": "python3.11",
      "args": [
        "/Volumes/Endre_Samsung1T/codeing/dunapp-pwa/aszalymonitoring-mcp/server.py"
      ]
    }
  }
}
```

## MCP Tools

### 1. `get_drought_data`

Lekéri az aszály adatokat egy adott helyszínre.

**Paraméterek:**
- `location` (required): Helyszín neve (Katymár, Dávod, Szederkény, Sükösd, Csávoly)
- `format` (optional): Formátum (json | markdown, default: json)

**Példa használat:**
```
Get drought data for Katymár
```

**Válasz (JSON):**
```json
{
  "location": "Katymár",
  "county": "Bács-Kiskun",
  "station_name": "Monitoring állomás (Katymár környéke)",
  "station_distance_km": 10.0,
  "drought_index": 32.5,
  "water_deficit_index": 15.2,
  "soil_moisture": [
    {"depth_cm": 10, "value": 20.0},
    {"depth_cm": 20, "value": 25.0},
    ...
  ],
  "soil_temperature": 23.5,
  "air_temperature": 30.0,
  "precipitation": 0.5,
  "relative_humidity": 55.0,
  "timestamp": "2025-11-03T16:00:00"
}
```

### 2. `get_all_drought_data`

Lekéri mind az 5 helyszín aszály adatait.

**Paraméterek:**
- `format` (optional): Formátum (json | markdown, default: json)

**Példa használat:**
```
Get drought data for all locations
```

### 3. `list_locations`

Listázza az összes elérhető helyszínt koordinátákkal.

**Példa használat:**
```
List all drought monitoring locations
```

**Válasz:**
```json
[
  {
    "name": "Katymár",
    "county": "Bács-Kiskun",
    "lat": 46.2167,
    "lon": 19.5667
  },
  ...
]
```

## Fejlesztés

### Jelenlegi Állapot

**⚠️ FONTOS**: Az aszalymonitoring.vizugy.hu **REST API nem elérhető** (404 hibák).

Ezért a szerver jelenleg:
- Realisztikus **sample adatokat** generál
- Évszak-alapú változásokat alkalmaz (nyár: szárazabb, tél: nedvesebb)
- Megpróbál scrape-elni az oldalról (alapvető információkért)

### Jövőbeli Fejlesztések

1. **API Újra-kutatás**
   - Ellenőrizni, hogy megváltozott-e az API struktúra
   - Alternatív endpoint-ok keresése

2. **Teljes Web Scraping**
   - Selenium vagy Playwright használata
   - Teljes oldal interaktív scraping

3. **vmservice.vizugy.hu Integráció**
   - CSV/XLSX export automatizálás
   - Puppeteer-based letöltés

## Licenc

MIT

## Kapcsolat

DunApp PWA Project - contact@dunapp.hu
