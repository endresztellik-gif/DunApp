# DunApp PWA - Project-Specific MCP Configuration

> **Projekt-specifikus MCP szerverek konfigurációja**

## 📋 Beállított MCP Szerverek

### 1. HydroInfo MCP
- **Funkció:** Vízállás adatok lekérdezése hydroinfo.hu-ról
- **Helyszínek:** Baja, Mohács, Nagybajcs
- **Server:** `/hydroinfo-mcp/server.py`

### 2. Aszálymonitoring MCP
- **Funkció:** Aszály monitoring adatok (talajnedvesség, HDI, HDIS)
- **Helyszínek:** Katymár, Dávod, Szederkény, Sükösd, Csávoly
- **Server:** `/aszalymonitoring-mcp/server.py`

---

## 🔧 Konfiguráció

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

---

## 🚀 Használat

### HydroInfo MCP Tools

```
# Vízállás lekérdezése
mcp__hydroinfo__get_water_level(station="baja")
mcp__hydroinfo__get_water_level(station="mohacs")
mcp__hydroinfo__get_water_level(station="nagybajcs")

# Állomások listázása
mcp__hydroinfo__list_stations()
```

### Aszálymonitoring MCP Tools

```
# Aszály adat lekérdezése
mcp__aszalymonitoring__get_drought_data(location="Katymár", format="json")
mcp__aszalymonitoring__get_drought_data(location="Dávod", format="markdown")

# Összes helyszín adatai
mcp__aszalymonitoring__get_all_drought_data(format="json")

# Helyszínek listázása
mcp__aszalymonitoring__list_locations()
```

---

## 📦 Python Környezet

**Python verzió:** 3.11+

**Telepítés:**
```bash
# HydroInfo MCP
cd hydroinfo-mcp
python3.11 -m pip install -r requirements.txt

# Aszálymonitoring MCP
cd aszalymonitoring-mcp
python3.11 -m pip install -r requirements.txt
```

**Függőségek:**
- `mcp>=1.0.0`
- `requests>=2.31.0`
- `beautifulsoup4>=4.12.0`
- `pydantic>=2.0.0`

---

## ⚠️ Fontos Megjegyzések

### 1. API Korlátozások
- **aszalymonitoring.vizugy.hu** REST API **NEM ELÉRHETŐ** (404 hibák)
- Jelenleg a MCP szerver **sample adatokat** generál
- Évszak-alapú változásokkal (nyár: szárazabb, tél: nedvesebb)

### 2. Web Scraping Jövőbeli Terv
- vmservice.vizugy.hu scraping (Puppeteer vagy Playwright)
- Teljes oldal interaktív scraping Selenium-mal
- Vagy várni míg az API elérhetővé válik

---

## 📖 További Dokumentáció

- **HydroInfo MCP:** [/hydroinfo-mcp/server.py](../hydroinfo-mcp/server.py)
- **Aszálymonitoring MCP:** [/aszalymonitoring-mcp/README.md](../aszalymonitoring-mcp/README.md)
- **MCP Quick Setup:** [/MCP_QUICK_SETUP.md](../MCP_QUICK_SETUP.md)
- **MCP & Agents Guide:** [/MCP_AND_AGENTS_GUIDE.md](../MCP_AND_AGENTS_GUIDE.md)

---

**Létrehozva:** 2025-11-03
**Státusz:** ✅ Konfigurálva és működik
**Verzió:** 1.0
