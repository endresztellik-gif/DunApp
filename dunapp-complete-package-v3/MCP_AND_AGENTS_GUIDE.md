# 🔌 MCP Servers & AI Agents - DunApp PWA

> **Model Context Protocol (MCP) Servers és AI Agent javaslatok**  
> A DunApp PWA fejlesztéséhez és működéséhez

**Létrehozva:** 2025-10-24  
**Projekt:** DunApp PWA  
**Cél:** Fejlesztés gyorsítása, automatizálás, adatintegráció

---

## 📋 TARTALOMJEGYZÉK

1. [MCP Servers Alapok](#mcp-basics)
2. [Ajánlott MCP Servers Fejlesztéshez](#dev-mcps)
3. [Ajánlott MCP Servers Adatintegrációhoz](#data-mcps)
4. [Ajánlott MCP Servers DevOps-hoz](#devops-mcps)
5. [AI Agents Javaslatok](#ai-agents)
6. [Custom MCP Server Építése](#custom-mcp)
7. [Implementációs Útmutató](#implementation)
8. [Költség Becslés](#costs)

---

## 🎯 MCP SERVERS ALAPOK {#mcp-basics}

### Mi az MCP?

**Model Context Protocol (MCP)** = Protokoll amely lehetővé teszi, hogy AI modellek (Claude, GPT, stb.) 
külső rendszerekkel, API-kkal, adatbázisokkal kommunikáljanak szabványosított módon.

### Előnyök DunApp PWA-hoz:

✅ **Real-time adatforrások** - OMSZ, VízÜgy, HUGEO API-k közvetlen elérése  
✅ **Fejlesztés gyorsítás** - Claude Code direktben dolgozhat GitHub-bal, Supabase-zel  
✅ **Automatizálás** - Deployment, tesztelés, monitoring automatikus  
✅ **Adatvalidáció** - API válaszok ellenőrzése Claude által  
✅ **Dokumentáció** - Automatikus dokumentáció generálás kódból

---

## 🛠️ AJÁNLOTT MCP SERVERS - FEJLESZTÉSHEZ {#dev-mcps}

### 1. **GitHub MCP Server** ⭐⭐⭐ (KÖTELEZŐ!)

**Miért kell:** Claude Code közvetlenül tudjon dolgozni a GitHub repo-val

**Funkciók:**
- Repository létrehozás, klónozás
- Branch kezelés (create, merge, delete)
- Commit, push műveletek
- Pull request kezelés
- Issue tracking
- Code review

**Telepítés:**
```bash
# NPM csomag
npm install -g @modelcontextprotocol/server-github

# Claude Desktop config (~/.claude/claude_desktop_config.json)
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Hozz létre egy új GitHub repository-t 'dunapp-pwa' néven, 
inicializáld a master branch-et, és commitold a starter package-et."

"Hozz létre egy új branch-et 'feature/meteorology-module' néven, 
és push-old a változtatásokat."

"Készíts pull request-et a meteorology module-ról a main branch-be."
```

**Előnyök DunApp PWA-hoz:**
- ✅ Verziókezelés automatikus
- ✅ Colaboráció könnyebb
- ✅ Backup folyamatos
- ✅ CI/CD integráció

---

### 2. **Supabase MCP Server** ⭐⭐⭐ (KÖTELEZŐ!)

**Miért kell:** Claude direktben tudjon dolgozni az adatbázissal

**Funkciók:**
- SQL query futtatás
- Táblák létrehozása, módosítása
- Adatok lekérése, beszúrása
- RLS policy kezelés
- Edge Functions deployment
- Real-time subscriptions

**Telepítés:**
```bash
# Nincs official MCP, custom építendő
# Vagy PostgreSQL MCP használható Supabase connection string-gel
npm install -g @modelcontextprotocol/server-postgres

# Config
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
      }
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Hozd létre a meteorology_cities táblát a CLAUDE.md specifikáció alapján."

"Futtasd le az összes SQL seed fájlt a seed-data/ mappából."

"Kérdezd le az összes mohácsi vízállás adatot az utolsó 7 napból."

"Módosítsd a push_subscriptions táblát: adj hozzá egy last_notification_sent 
timestamp oszlopot."
```

**Előnyök DunApp PWA-hoz:**
- ✅ Adatbázis séma gyors létrehozás
- ✅ Seed adatok automatikus betöltés
- ✅ Adatvalidáció (27 helyszín ellenőrzése)
- ✅ Migration management

---

### 3. **Filesystem MCP Server** ⭐⭐⭐ (KÖTELEZŐ!)

**Miért kell:** Claude Code fájlkezeléséhez

**Funkciók:**
- Fájlok olvasása, írása
- Könyvtárak létrehozása
- Fájlkeresés
- Tartalom módosítás

**Telepítés:**
```bash
npm install -g @modelcontextprotocol/server-filesystem

# Config
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/dunapp-pwa"
      ]
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Olvasd el az összes .tsx fájlt a src/modules/meteorology/ mappából 
és ellenőrizd a TypeScript típusokat."

"Hozz létre egy új komponenst: src/modules/water-level/components/NotificationSettings.tsx"

"Keress minden olyan fájlt ahol 'any' típust használunk, és javítsd ki."
```

**Előnyök DunApp PWA-hoz:**
- ✅ Gyors komponens generálás
- ✅ Kód refactoring
- ✅ Fájlstruktúra ellenőrzés

---

### 4. **Puppeteer MCP Server** ⭐⭐ (Ajánlott)

**Miért kell:** Web scraping VízÜgy, OMSZ oldalakhoz (ha nincs API)

**Funkciók:**
- Weboldal scraping
- Screenshot készítés
- Form kitöltés
- Dinamikus tartalom betöltés

**Telepítés:**
```bash
npm install -g @modelcontextprotocol/server-puppeteer

# Config
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Scrapeld le a mohácsi vízállás adatokat a VízÜgy oldaláról: 
https://www.vizugy.hu/index.php?id=vizmerce&mernev=Moh%C3%A1cs"

"Készíts screenshotot az OMSZ radar térképéről és mentsd el."

"Monitorozd a HUGEO talajvízszint oldalát, és értesíts ha változás van."
```

**Előnyök DunApp PWA-hoz:**
- ✅ API nélküli adatforrások elérése
- ✅ Real-time data scraping
- ✅ Tesztelés (visual regression)

---

### 5. **SQLite MCP Server** ⭐ (Opcionális - Cache-hez)

**Miért kell:** Lokális cache adatbázis API válaszokhoz

**Funkciók:**
- Lokális SQLite DB kezelés
- Cache adatok tárolása
- Offline működés támogatása

**Telepítés:**
```bash
npm install -g @modelcontextprotocol/server-sqlite

# Config
{
  "mcpServers": {
    "sqlite-cache": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sqlite",
        "/path/to/dunapp-cache.db"
      ]
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Cache-eld le az OMSZ API válaszokat 1 órára a lokális SQLite-ba."

"Ellenőrizd a cache-t: van-e Mohács vízállás adat az utolsó 6 órából?"
```

**Előnyök DunApp PWA-hoz:**
- ✅ API hívások csökkentése
- ✅ Gyorsabb betöltés
- ✅ Offline működés

---

## 🌐 AJÁNLOTT MCP SERVERS - ADATINTEGRÁCIÓHOZ {#data-mcps}

### 6. **Fetch MCP Server** ⭐⭐⭐ (KÖTELEZŐ!)

**Miért kell:** API-k közvetlen elérése (OMSZ, VízÜgy, HUGEO, OVF)

**Funkciók:**
- HTTP GET/POST/PUT/DELETE
- Headers kezelés
- JSON/XML parsing
- Rate limiting

**Telepítés:**
```bash
npm install -g @modelcontextprotocol/server-fetch

# Config
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Hívd meg az OMSZ API-t Szekszárd időjárás adataiért, és parse-old a JSON-t."

"Kérdezd le a VízÜgy API-t a mohácsi vízállásról, és mentsd Supabase-be."

"Hívd meg az OpenWeather API-t mind a 4 városra (Szekszárd, Baja, Dunaszekcső, Mohács)."
```

**API Integráció DunApp PWA-hoz:**

```typescript
// OMSZ API (példa)
const fetchOMSZData = async (cityName: string) => {
  const response = await fetch(
    `https://api.met.hu/v1/weather/current?city=${cityName}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OMSZ_API_KEY}`
      }
    }
  );
  return response.json();
};

// VízÜgy scraping endpoint
const fetchWaterLevel = async (stationName: string) => {
  // Claude MCP Puppeteer használatával
};
```

**Előnyök DunApp PWA-hoz:**
- ✅ Real-time adatforrások
- ✅ API integráció egyszerűsítés
- ✅ Adatvalidáció Claude által

---

### 7. **Google Drive MCP Server** ⭐⭐ (Ajánlott)

**Miért kell:** Dokumentáció, képek, backup tárolás

**Funkciók:**
- Fájl upload/download
- Folder kezelés
- Megosztás
- Verziókezelés

**Telepítés:**
```bash
npm install -g @modelcontextprotocol/server-gdrive

# Config (Google OAuth szükséges)
{
  "mcpServers": {
    "gdrive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gdrive"],
      "env": {
        "GOOGLE_CLIENT_ID": "your_client_id",
        "GOOGLE_CLIENT_SECRET": "your_secret"
      }
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Mentsd el az összes dokumentációt (docs/) a Google Drive-ba 
'DunApp Documentation' mappába."

"Készíts screenshotokat az app minden moduljáról és töltsd fel Drive-ba."

"Backup-old a Supabase sémát Google Drive-ba hetente egyszer."
```

**Előnyök DunApp PWA-hoz:**
- ✅ Dokumentáció backup
- ✅ Képek tárolása
- ✅ Csapatmunka

---

### 8. **Weather API MCP Server** ⭐⭐ (Custom építendő)

**Miért kell:** Meteorológiai adatok egységes lekérése

**Funkciók:**
- OMSZ API wrapper
- OpenWeatherMap integráció
- WeatherAPI.com integráció
- Egységes interface

**Custom MCP Építés:** (lásd később)

**Használati példák:**
```
Claude Prompt:
"Kérdezd le az időjárást mind a 4 városra az OMSZ API-ról."

"Hasonlítsd össze az OMSZ és OpenWeather előrejelzéseit Mohács-ra."

"Tárold el a meteorológiai adatokat Supabase-be óránként."
```

---

## 🚀 AJÁNLOTT MCP SERVERS - DEVOPS-HOZ {#devops-mcps}

### 9. **Netlify MCP Server** ⭐⭐⭐ (KÖTELEZŐ!)

**Miért kell:** Automatikus deployment

**Funkciók:**
- Site deploy
- Environment variables kezelés
- Build logs lekérése
- Domain management

**Telepítés:**
```bash
# Custom MCP építendő Netlify API-val
# Vagy használd a Netlify CLI-t

# Config
{
  "mcpServers": {
    "netlify": {
      "command": "netlify",
      "args": ["api"],
      "env": {
        "NETLIFY_AUTH_TOKEN": "your_token"
      }
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Deployld az alkalmazást Netlify-ra a main branch-ről."

"Ellenőrizd a build log-okat, van-e hiba?"

"Állítsd be az environment variable-öket Netlify-on:
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_VAPID_PUBLIC_KEY"

"Aktiváld a HTTPS-t és a custom domain-t."
```

**Előnyök DunApp PWA-hoz:**
- ✅ Automatikus deployment
- ✅ Gyors iteráció
- ✅ Környezeti változók kezelés

---

### 10. **Sentry MCP Server** ⭐⭐ (Ajánlott - Monitoring)

**Miért kell:** Error tracking és performance monitoring

**Funkciók:**
- Error log lekérése
- Performance metrics
- Issue management
- Release tracking

**Telepítés:**
```bash
# Custom MCP építendő Sentry API-val

# Config
{
  "mcpServers": {
    "sentry": {
      "command": "sentry-cli",
      "env": {
        "SENTRY_AUTH_TOKEN": "your_token"
      }
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Ellenőrizd a Sentry-ben az utolsó 24 óra hibáit a production-ben."

"Milyen a push notification error rate az utolsó héten?"

"Készíts riportot a leggyakoribb hibákról és javítási javaslatokat."
```

**Előnyök DunApp PWA-hoz:**
- ✅ Proaktív hibajavítás
- ✅ Performance optimalizálás
- ✅ User experience javítás

---

### 11. **Lighthouse MCP Server** ⭐⭐ (Ajánlott - Performance)

**Miért kell:** Automatikus performance tesztelés

**Funkciók:**
- Lighthouse audit futtatás
- Performance score
- Accessibility check
- PWA check

**Telepítés:**
```bash
npm install -g lighthouse
# Custom MCP wrapper építése

# Config
{
  "mcpServers": {
    "lighthouse": {
      "command": "lighthouse",
      "args": ["--output=json"]
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Futtass Lighthouse audit-ot a production URL-en."

"Mi a PWA score? Teljesíti a követelményeket?"

"Milyen optimalizálási javaslataid vannak a Performance score alapján?"
```

**Előnyök DunApp PWA-hoz:**
- ✅ PWA compliance ellenőrzés
- ✅ Performance baseline
- ✅ SEO optimalizálás

---

### 12. **Semgrep MCP Server** ⭐⭐⭐ (KÖTELEZŐ - Biztonság!)

**Miért kell:** Automatikus biztonsági sebezhetőség keresés

**Funkciók:**
- SAST (Static Application Security Testing)
- Kódbiztonság ellenőrzés
- API kulcs kiszivárgás detektálás
- OWASP Top 10 ellenőrzés
- SQL injection, XSS detektálás

**Telepítés:**
```bash
# Semgrep telepítése
pip install semgrep --break-system-packages

# Vagy Docker
docker pull semgrep/semgrep

# Config
{
  "mcpServers": {
    "semgrep": {
      "command": "semgrep",
      "args": ["scan", "--config=auto", "--json"]
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Futtass Semgrep security scan-t a teljes projekten."

"Vannak-e API kulcsok hardcoded a kódban?"

"Ellenőrizd a React komponenseket XSS sebezhetőségekre."

"Vizsgáld meg a backend scraper-eket SQL injection ellen."

"Futtass OWASP Top 10 ellenőrzést."
```

**Semgrep Rules (DunApp PWA-hoz):**
```yaml
# .semgrep/dunapp-security.yml

rules:
  - id: api-key-hardcoded
    pattern: |
      const API_KEY = "..."
    message: API kulcs hardcoded! Használj environment variable-t.
    severity: ERROR
    languages: [javascript, typescript]

  - id: sql-injection-risk
    pattern: |
      $SQL = "SELECT * FROM " + $USER_INPUT
    message: SQL injection kockázat! Használj prepared statement-et.
    severity: ERROR
    languages: [javascript, typescript]

  - id: xss-dangerous-html
    pattern: |
      dangerouslySetInnerHTML={{ __html: $USER_INPUT }}
    message: XSS kockázat! Sanitize-old az input-ot.
    severity: WARNING
    languages: [javascript, typescript]

  - id: cors-wildcard
    pattern: |
      cors({ origin: '*' })
    message: CORS wildcard production-ben tilos!
    severity: ERROR
    languages: [javascript, typescript]

  - id: console-log-production
    pattern: console.log(...)
    message: console.log production kódban ne maradjon!
    severity: INFO
    languages: [javascript, typescript]
```

**Előnyök DunApp PWA-hoz:**
- ✅ API kulcs védelem (OpenWeather, Meteoblue)
- ✅ Scraping biztonság (SQL injection, XSS)
- ✅ React komponens biztonság
- ✅ Environment variable ellenőrzés
- ✅ OWASP compliance

---

### 13. **Snyk MCP Server** ⭐⭐ (Dependency Security)

**Miért kell:** NPM/pip package sebezhetőség ellenőrzés

**Funkciók:**
- Dependency vulnerability scanning
- License compliance
- Container security (ha Docker használ)
- Fix javaslatok

**Telepítés:**
```bash
npm install -g snyk
snyk auth

# Config
{
  "mcpServers": {
    "snyk": {
      "command": "snyk",
      "args": ["test", "--json"],
      "env": {
        "SNYK_TOKEN": "your_token"
      }
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Futtass Snyk scan-t a package.json-on."

"Vannak-e sebezhetőségek a React vagy Express package-ekben?"

"Mi a fix javaslat a kritikus sebezhetőségekre?"

"Ellenőrizd a license compliance-t."
```

**Előnyök DunApp PWA-hoz:**
- ✅ NPM package biztonság
- ✅ Python package biztonság (Puppeteer, Supabase dependencies)
- ✅ Automatikus fix javaslatok
- ✅ License audit

---

### 14. **ESLint/Prettier MCP Server** ⭐⭐ (Code Quality)

**Miért kell:** Kódminőség és stílus ellenőrzés

**Funkciók:**
- ESLint rules enforcement
- Prettier formázás
- TypeScript strict mode ellenőrzés
- Unused imports/variables detektálás

**Telepítés:**
```bash
npm install -g eslint prettier

# Config
{
  "mcpServers": {
    "eslint": {
      "command": "eslint",
      "args": [".", "--format=json"]
    },
    "prettier": {
      "command": "prettier",
      "args": ["--check", "."]
    }
  }
}
```

**Használati példák:**
```
Claude Prompt:
"Futtass ESLint-et a teljes projekten."

"Van-e 'any' típus használva TypeScript-ben?"

"Formázd a kódot Prettier-rel."

"Vannak-e unused imports?"
```

**Előnyök DunApp PWA-hoz:**
- ✅ TypeScript strict mode enforcement
- ✅ No 'any' típus
- ✅ Konzisztens kódformázás
- ✅ Import optimalizálás

---

## 🤖 AI AGENTS JAVASLATOK {#ai-agents}

### Átdolgozott Agent Architektúra - Specializált Mérnöki Szerepkörök

```
                    ┌─────────────────────┐
                    │  Master Architect   │
                    │  (Claude Opus 4.1)  │
                    │  - Döntéshozatal    │
                    │  - Koordináció      │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┬─────────────────┐
        │                      │                      │                 │
┌───────▼───────┐     ┌───────▼───────┐     ┌───────▼───────┐  ┌─────▼─────┐
│ Frontend      │     │ Backend       │     │ QA Tester     │  │ Security  │
│ Engineer      │     │ Engineer      │     │ Agent         │  │ Analyst   │
│ (Sonnet 4.5)  │     │ (Sonnet 4.5)  │     │ (Sonnet 4.5)  │  │ (Sonnet)  │
└───────────────┘     └───────────────┘     └───────────────┘  └───────────┘
        │                      │                      │                 │
        ▼                      ▼                      ▼                 ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐  ┌───────────┐
│ UI/UX         │     │ Data          │     │ DevOps        │  │ Docs      │
│ Designer      │     │ Engineer      │     │ Engineer      │  │ Writer    │
│ (Sonnet 4.5)  │     │ (Sonnet 4.5)  │     │ (Haiku)       │  │ (Haiku)   │
└───────────────┘     └───────────────┘     └───────────────┘  └───────────┘
```

---

### **Agent 0: Master Architect** ⭐⭐⭐ (Koordinátor)

**Felelősség:** Projekt felügyelet, döntéshozatal, agent koordináció

**Technológia:** Claude Opus 4.1 + ALL MCPs

**Feladatok:**
- Projekt architektúra tervezés
- Agent feladatok delegálása
- Konfliktusok feloldása
- Kód review koordináció
- Release management

**Setup:**
```json
{
  "agent": {
    "name": "master-architect",
    "model": "claude-opus-4-1",
    "mcps": ["github", "filesystem", "supabase", "fetch", "puppeteer", "sentry", "lighthouse", "semgrep"],
    "instructions": "You are the Master Architect. Read CLAUDE.md entirely. Coordinate all agents and make architectural decisions.",
    "context_files": [
      "CLAUDE.md",
      "DATA_SOURCES.md",
      "docs/PROJECT_SUMMARY.md",
      "docs/DESIGN_SPECIFICATION.md"
    ],
    "priority": "highest"
  }
}
```

**Használati példa:**
```
Prompt Master Architect-nek:

"Olvasd el a CLAUDE.md-t és DATA_SOURCES.md-t.

Projekt feladat: DunApp PWA teljes implementáció.

Delegáld a feladatokat a megfelelő agent-eknek:
1. Frontend Engineer: React komponensek
2. Backend Engineer: Supabase Edge Functions
3. Data Engineer: API integráció (OpenWeather, vizugy.hu)
4. QA Tester: Unit és E2E tesztek
5. Security Analyst: Semgrep scan és API kulcs védelem
6. DevOps Engineer: Netlify deployment
7. UI/UX Designer: Tailwind komponens design
8. Docs Writer: README és API dokumentáció

Koordináld a munkát és jelentsd az előrehaladást."
```

---

### **Agent 1: Frontend Engineer Agent** ⭐⭐⭐

**Felelősség:** React komponensek, TypeScript, Tailwind CSS

**Technológia:** Claude Sonnet 4.5 + GitHub MCP + Filesystem MCP

**Feladatok:**
- React komponensek generálása
- TypeScript interface-ek
- Tailwind CSS styling
- State management (Zustand/Context)
- Recharts grafikonok
- Leaflet térképek
- PWA service worker
- Frontend unit tesztek

**Setup:**
```json
{
  "agent": {
    "name": "frontend-engineer",
    "model": "claude-sonnet-4-5",
    "mcps": ["github", "filesystem", "eslint", "prettier"],
    "instructions": "You are a React/TypeScript expert. Follow CLAUDE.md strictly. Use Tailwind utility classes. TypeScript strict mode. No 'any' types.",
    "context_files": [
      "CLAUDE.md",
      "docs/DESIGN_SPECIFICATION.md",
      "docs/DATA_STRUCTURES.md"
    ],
    "specialization": "frontend"
  }
}
```

**Használati példa:**
```
Prompt Frontend Engineer-nek:

"Hozd létre a CitySelector komponenst a Meteorológia modulhoz.

Követelmények (CLAUDE.md alapján):
- 4 város: Szekszárd, Baja, Dunaszekcső, Mohács
- Dropdown megjelenítés
- TypeScript strict mode (City interface)
- Tailwind CSS: text-meteo-primary, border-2, rounded-lg
- lucide-react MapPin ikon
- onChange callback: (city: City) => void
- Responsive: mobile-first

Komponens helye: src/modules/meteorology/components/CitySelector/CitySelector.tsx

Commitold GitHub-ra: 'feat(meteorology): Add CitySelector component'

Futtass ESLint-et és javítsd a hibákat."
```

---

### **Agent 2: Backend Engineer Agent** ⭐⭐⭐

**Felelősség:** Supabase Edge Functions, API-k, adatbázis

**Technológia:** Claude Sonnet 4.5 + Supabase MCP + Fetch MCP

**Feladatok:**
- Supabase Edge Functions (TypeScript/Deno)
- SQL táblák létrehozása
- RLS (Row Level Security) policies
- Cron job-ok
- API error handling
- Rate limiting
- Backend tesztek

**Setup:**
```json
{
  "agent": {
    "name": "backend-engineer",
    "model": "claude-sonnet-4-5",
    "mcps": ["supabase", "fetch", "filesystem", "semgrep"],
    "instructions": "You are a backend expert. Build Supabase Edge Functions. Follow DATA_SOURCES.md for API integrations.",
    "context_files": [
      "CLAUDE.md",
      "DATA_SOURCES.md",
      "docs/DATA_STRUCTURES.md",
      "seed-data/schema.sql"
    ],
    "specialization": "backend"
  }
}
```

**Használati példa:**
```
Prompt Backend Engineer-nek:

"Hozd létre a fetch-meteorology Edge Function-t.

Feladat:
1. OpenWeatherMap API hívás mind a 4 városra
2. Adatok lekérése: current weather + 5 day forecast
3. Adatok tárolása Supabase-be (meteorology_data tábla)
4. Rate limit kezelés (1000 hívás/nap)
5. Error handling (fallback: Meteoblue vagy Yr.no)
6. Cache: 20 perc

API kulcs: cd125c5eeeda398551503129fc08636d (env variable!)
Referencia: DATA_SOURCES.md → Meteorológia szekció

Futtass Semgrep-et: ellenőrizd hogy nincs hardcoded API kulcs!

Deployold Supabase-re és állítsd be a cron-t: */20 * * * *"
```

---

### **Agent 3: Data Engineer Agent** ⭐⭐⭐

**Felelősség:** API integráció, scraping, adatfeldolgozás

**Technológia:** Claude Sonnet 4.5 + Fetch MCP + Puppeteer MCP

**Feladatok:**
- Web scraping (vizugy.hu, hydroinfo.hu, vmservice.vizugy.hu)
- API integráció (OMSZ, OpenWeather, Meteoblue, aszalymonitoring)
- CSV/JSON parsing
- Adattisztítás és validáció
- ETL pipeline-ok
- Data transformation

**Setup:**
```json
{
  "agent": {
    "name": "data-engineer",
    "model": "claude-sonnet-4-5",
    "mcps": ["fetch", "puppeteer", "supabase", "filesystem"],
    "instructions": "You are a data integration expert. Build robust scrapers and API integrations. Follow DATA_SOURCES.md.",
    "context_files": [
      "DATA_SOURCES.md",
      "docs/DATA_STRUCTURES.md"
    ],
    "specialization": "data"
  }
}
```

**Használati példa:**
```
Prompt Data Engineer-nek:

"Hozz létre scraper-t a vizugy.hu-ról vízállás adatokhoz.

Feladat:
1. Puppeteer vagy Cheerio használata
2. URL: https://www.vizugy.hu/index.php?module=content&programelemid=138
3. Állomások: Baja, Mohács, Nagybajcs
4. Kinyert adatok:
   - Vízállás (cm)
   - Vízhozam (m³/s) - ha elérhető
   - Vízhőmérséklet (°C) - ha elérhető
5. Hibakezkelés: retry 3x, exponential backoff
6. Validáció: vízállás 0-1000 cm között
7. Supabase mentés: water_level_data tábla

Referencia: DATA_SOURCES.md → Vízállás → vizugy.hu scraping

Implementáció: supabase/functions/fetch-water-level/scrapers/vizugyActual.ts

Teszteld: futtasd le és ellenőrizd hogy 3 állomás adatai megvannak."
```

---

### **Agent 4: QA Tester Agent** ⭐⭐⭐

**Felelősség:** Tesztelés, QA, bug reporting

**Technológia:** Claude Sonnet 4.5 + Puppeteer MCP + Filesystem MCP

**Feladatok:**
- Unit tesztek írása (Vitest/Jest)
- E2E tesztek (Playwright/Puppeteer)
- Integration tesztek
- Visual regression testing
- API tesztek
- Performance testing
- Bug reporting
- Test coverage report

**Setup:**
```json
{
  "agent": {
    "name": "qa-tester",
    "model": "claude-sonnet-4-5",
    "mcps": ["puppeteer", "filesystem", "github"],
    "instructions": "You are a QA expert. Write comprehensive tests. Aim for 80%+ coverage.",
    "context_files": [
      "CLAUDE.md",
      "docs/PROJECT_SUMMARY.md"
    ],
    "specialization": "testing"
  }
}
```

**Használati példa:**
```
Prompt QA Tester-nek:

"Írj unit teszteket a CitySelector komponenshez.

Tesztek:
1. Renders all 4 cities
2. Click on Szekszárd → onChange called with correct city
3. Dropdown closes after selection
4. MapPin icon displayed
5. Responsive: mobile és desktop layout
6. Accessibility: ARIA labels correct

Framework: Vitest + React Testing Library

Fájl helye: src/modules/meteorology/components/CitySelector/CitySelector.test.tsx

Coverage cél: 90%+

Futtasd le a teszteket: npm run test

Ha van hiba, javítsd és commitold: 'test(meteorology): Add CitySelector tests'."
```

---

### **Agent 5: Security Analyst Agent** ⭐⭐⭐

**Felelősség:** Biztonsági audit, sebezhetőség keresés

**Technológia:** Claude Sonnet 4.5 + Semgrep MCP + Snyk MCP

**Feladatok:**
- Semgrep SAST scan
- Snyk dependency scan
- API kulcs védelem ellenőrzés
- SQL injection detektálás
- XSS vulnerability check
- CORS konfiguráció audit
- Environment variable audit
- OWASP Top 10 compliance

**Setup:**
```json
{
  "agent": {
    "name": "security-analyst",
    "model": "claude-sonnet-4-5",
    "mcps": ["semgrep", "snyk", "filesystem", "github"],
    "instructions": "You are a security expert. Run security scans. Report vulnerabilities with severity and fix suggestions.",
    "context_files": [
      "CLAUDE.md",
      "DATA_SOURCES.md"
    ],
    "specialization": "security"
  }
}
```

**Használati példa:**
```
Prompt Security Analyst-nek:

"Futtass teljes biztonsági audit-ot a DunApp PWA-n.

Feladatok:
1. Semgrep SAST scan:
   - Hardcoded API kulcsok keresése
   - SQL injection rizikók
   - XSS vulnerabilities
   - CORS misconfig
   
2. Snyk dependency scan:
   - NPM package sebezhetőségek
   - License compliance
   
3. Manuális ellenőrzés:
   - Environment variables helyesen használva?
   - API kulcsok: OpenWeather, Meteoblue → .env?
   - VAPID keys: public frontend, private backend?
   - Supabase RLS policies aktiválva?
   
4. OWASP Top 10:
   - Injection attacks
   - Broken authentication (nincs auth, de később)
   - Sensitive data exposure
   - XSS
   - Insecure deserialization
   
5. Report:
   - Critical vulnerabilities listája
   - Medium/Low vulnerabilities
   - Fix javaslatok priorizálva
   
Referencia: DATA_SOURCES.md → API kulcsok szekció

Output: SECURITY_AUDIT_REPORT.md

Ha critical issue van, azonnal jelezd és ne commitolj addig!"
```

---

### **Agent 6: DevOps Engineer Agent** ⭐⭐

**Felelősség:** CI/CD, deployment, monitoring

**Technológia:** Claude Haiku (cost-effective) + Netlify MCP + Sentry MCP

**Feladatok:**
- GitHub Actions workflow
- Netlify deployment
- Environment variables setup
- Monitoring (Sentry integration)
- Uptime monitoring
- Performance monitoring
- Log aggregation
- Backup stratégia

**Setup:**
```json
{
  "agent": {
    "name": "devops-engineer",
    "model": "claude-haiku",
    "mcps": ["github", "netlify", "sentry", "lighthouse"],
    "instructions": "You are a DevOps expert. Setup CI/CD pipelines. Monitor production health.",
    "context_files": [
      "CLAUDE.md"
    ],
    "specialization": "devops"
  }
}
```

**Használati példa:**
```
Prompt DevOps Engineer-nek:

"Állítsd be a teljes CI/CD pipeline-t.

Feladatok:
1. GitHub Actions workflow (.github/workflows/deploy.yml):
   - Trigger: push to main branch
   - Steps: install, test, build, deploy
   - Environment: Node 18, npm ci
   
2. Netlify deployment:
   - Build command: npm run build
   - Publish directory: dist
   - Environment variables:
     * VITE_SUPABASE_URL
     * VITE_SUPABASE_ANON_KEY
     * VITE_VAPID_PUBLIC_KEY
     * VITE_OPENWEATHER_API_KEY
     * VITE_METEOBLUE_API_KEY
   
3. Sentry integration:
   - Error tracking setup
   - Source maps upload
   - Performance monitoring
   
4. Monitoring:
   - Uptime check (UptimeRobot vagy similar)
   - Lighthouse CI (performance > 90)
   - Weekly security scan (Semgrep)
   
5. Backup:
   - Supabase daily backup
   - Environment variables dokumentálás
   
Workflow tesztelése: Commit dummy change és figyeld a deployment-et."
```

---

### **Agent 7: UI/UX Designer Agent** ⭐⭐

**Felelősség:** Design rendszer, vizuális konzisztencia

**Technológia:** Claude Sonnet 4.5 + Filesystem MCP

**Feladatok:**
- Tailwind design system maintenance
- Komponens UI/UX review
- Accessibility audit (WCAG AA)
- Responsive design ellenőrzés
- Color palette consistency
- Typography hierarchy
- Icon library management
- Design tokens

**Setup:**
```json
{
  "agent": {
    "name": "uiux-designer",
    "model": "claude-sonnet-4-5",
    "mcps": ["filesystem", "github"],
    "instructions": "You are a UI/UX expert. Follow DESIGN_SPECIFICATION.md strictly. Ensure Tailwind consistency and WCAG AA compliance.",
    "context_files": [
      "CLAUDE.md",
      "docs/DESIGN_SPECIFICATION.md"
    ],
    "specialization": "design"
  }
}
```

**Használati példa:**
```
Prompt UI/UX Designer-nek:

"Review-old a CitySelector komponenst UI/UX szempontból.

Ellenőrzési szempontok:
1. Tailwind classes konzisztencia
   - text-meteo-primary használva?
   - padding, margin értékek design system szerint? (p-4, p-5)
   - border-radius: rounded-lg?
   
2. Responsive design
   - Mobile (< 640px): full width
   - Tablet (640-1024px): auto width
   - Desktop (> 1024px): max-width
   
3. Accessibility (WCAG AA)
   - ARIA labels: aria-label="Város kiválasztása"
   - Keyboard navigation: Tab, Enter
   - Color contrast: 4.5:1 minimum
   - Focus states: focus:ring-2
   
4. Typography
   - Font size: text-base (16px)
   - Font weight: font-medium (500)
   - Line height: megfelelő?
   
5. Interactions
   - Hover: hover:bg-gray-50
   - Active: active:bg-gray-100
   - Disabled: opacity-50, cursor-not-allowed
   
Javaslatok:
- Mi javítható?
- Konzisztencia problémák?
- Accessibility issues?

Output: UI_REVIEW_CitySelector.md"
```

---

### **Agent 8: Documentation Writer Agent** ⭐

**Felelősség:** Dokumentáció írása és karbantartása

**Technológia:** Claude Haiku (cost-effective) + Filesystem MCP + GitHub MCP

**Feladatok:**
- README.md frissítés
- API dokumentáció
- Komponens dokumentáció (JSDoc)
- CHANGELOG.md
- Deployment guide
- Troubleshooting guide
- Inline code comments

**Setup:**
```json
{
  "agent": {
    "name": "docs-writer",
    "model": "claude-haiku",
    "mcps": ["filesystem", "github"],
    "instructions": "You are a technical writer. Keep documentation in sync with code. Write clear, concise docs.",
    "context_files": [
      "CLAUDE.md",
      "docs/*.md"
    ],
    "specialization": "documentation"
  }
}
```

**Használati példa:**
```
Prompt Docs Writer-nek:

"Frissítsd a README.md-t a legfrissebb projektállapot szerint.

Tartalmazzon:
1. Project Overview
   - Mi a DunApp PWA?
   - 3 modul rövid leírása
   
2. Features
   - Meteorológia (4 város)
   - Vízállás (3 állomás + push notifications)
   - Aszály (5 helyszín + 15 kút)
   
3. Tech Stack
   - Frontend: React 18, TypeScript, Vite, Tailwind
   - Backend: Supabase, Edge Functions
   - APIs: OpenWeather, Meteoblue, vizugy.hu
   
4. Quick Start
   - Telepítési lépések
   - Environment variables
   - npm run dev
   
5. Deployment
   - Netlify setup
   - Environment variables production
   
6. API Documentation
   - Linkek: DATA_SOURCES.md
   
7. Contributing
   - Code style (ESLint, Prettier)
   - Commit conventions (feat, fix, docs)
   
8. License: MIT

Stílus: Professzionális, de olvasmányos. Példa kódok ahol szükséges."
```

---

### Agent Koordináció Workflow

```javascript
// Master Architect delegál feladatot

async function buildMeteorologModule() {
  // 1. Master Architect: Terv készítés
  const plan = await masterArchitect.createPlan('meteorology-module');
  
  // 2. UI/UX Designer: Design review
  const design = await uiuxDesigner.reviewDesign(plan.components);
  
  // 3. Frontend Engineer: Komponensek
  const frontend = await frontendEngineer.buildComponents(design.approved);
  
  // 4. Data Engineer: API integráció
  const dataIntegration = await dataEngineer.integrateAPIs([
    'OpenWeather',
    'Meteoblue',
    'Yr.no'
  ]);
  
  // 5. Backend Engineer: Edge Functions
  const backend = await backendEngineer.buildEdgeFunctions(dataIntegration.endpoints);
  
  // 6. Security Analyst: Security scan
  const securityReport = await securityAnalyst.scan(frontend.code + backend.code);
  
  if (securityReport.critical.length > 0) {
    // FIX kritikus sebezhetőségeket!
    await securityAnalyst.fix(securityReport.critical);
  }
  
  // 7. QA Tester: Tesztek
  const tests = await qaTester.writeTests(frontend.components);
  const testResults = await qaTester.runTests(tests);
  
  if (testResults.coverage < 80) {
    // További tesztek
    await qaTester.improveTests(testResults.uncovered);
  }
  
  // 8. Docs Writer: Dokumentáció
  await docsWriter.documentModule('meteorology', {
    frontend: frontend.components,
    backend: backend.functions,
    api: dataIntegration.endpoints
  });
  
  // 9. DevOps Engineer: Deploy
  await devopsEngineer.deploy('staging');
  
  // 10. Master Architect: Review
  const finalReview = await masterArchitect.reviewModule('meteorology');
  
  if (finalReview.approved) {
    await devopsEngineer.deploy('production');
    console.log('✅ Meteorology Module deployed to production!');
  } else {
    console.log('❌ Review failed, fixes needed:', finalReview.issues);
  }
}
```

---

## 🔨 CUSTOM MCP SERVER ÉPÍTÉSE {#custom-mcp}

### Custom MCP: DunApp Weather API Server

**Cél:** Egységes interface meteorológiai API-khoz (OMSZ, OpenWeather, stb.)

**Implementáció:**

```typescript
// dunapp-weather-mcp/src/index.ts

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// MCP Server létrehozása
const server = new Server(
  {
    name: 'dunapp-weather-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool lista
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_current_weather',
        description: 'Get current weather data for a city',
        inputSchema: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'City name (Szekszárd, Baja, Dunaszekcső, Mohács)',
            },
            source: {
              type: 'string',
              enum: ['omsz', 'openweather'],
              description: 'Data source',
            },
          },
          required: ['city'],
        },
      },
      {
        name: 'get_weather_forecast',
        description: 'Get 5-day weather forecast',
        inputSchema: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'City name',
            },
          },
          required: ['city'],
        },
      },
    ],
  };
});

// Tool végrehajtás
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_current_weather') {
    const { city, source = 'omsz' } = args as { city: string; source?: string };

    // OMSZ API hívás
    if (source === 'omsz') {
      const response = await fetch(
        `https://api.met.hu/v1/weather/current?city=${city}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OMSZ_API_KEY}`,
          },
        }
      );
      const data = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    // OpenWeather API hívás
    if (source === 'openweather') {
      // ... implementáció
    }
  }

  if (name === 'get_weather_forecast') {
    // ... implementáció
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Server indítás
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DunApp Weather MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

**Package.json:**

```json
{
  "name": "dunapp-weather-mcp",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "dunapp-weather-mcp": "./build/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Használat Claude Desktop-ban:**

```json
{
  "mcpServers": {
    "dunapp-weather": {
      "command": "node",
      "args": ["/path/to/dunapp-weather-mcp/build/index.js"],
      "env": {
        "OMSZ_API_KEY": "your_api_key"
      }
    }
  }
}
```

---

## 📦 IMPLEMENTÁCIÓS ÚTMUTATÓ {#implementation}

### Fázis 1: Alapvető MCP-k Setup (1 nap)

```bash
# 1. GitHub MCP
npm install -g @modelcontextprotocol/server-github

# 2. Filesystem MCP
npm install -g @modelcontextprotocol/server-filesystem

# 3. Fetch MCP
npm install -g @modelcontextprotocol/server-fetch

# 4. PostgreSQL MCP (Supabase)
npm install -g @modelcontextprotocol/server-postgres
```

**Claude Desktop Config:**

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxx"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/projects/dunapp-pwa"
      ]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"
      }
    }
  }
}
```

---

### Fázis 2: Fejlesztési MCP-k (2 nap)

```bash
# Puppeteer (scraping)
npm install -g @modelcontextprotocol/server-puppeteer

# SQLite (cache)
npm install -g @modelcontextprotocol/server-sqlite
```

---

### Fázis 3: Custom MCP-k (3-5 nap)

**Építendő:**
1. DunApp Weather MCP (OMSZ, OpenWeather wrapper)
2. VízÜgy MCP (scraping automatizálás)
3. HUGEO/OVF MCP (aszály adatok)
4. Netlify Deploy MCP

---

### Fázis 4: AI Agents Setup (2-3 nap)

**Agent Framework:** LangChain vagy AutoGen

```bash
npm install langchain
npm install @langchain/anthropic
```

**Agent Config Példa:**

```typescript
// agents/dev-agent.ts

import { ChatAnthropic } from '@langchain/anthropic';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { Tool } from 'langchain/tools';

// MCP Tools wrapper
const githubTool = new Tool({
  name: 'github',
  description: 'Interact with GitHub repository',
  func: async (input: string) => {
    // GitHub MCP hívás
  },
});

const filesystemTool = new Tool({
  name: 'filesystem',
  description: 'Read/write files',
  func: async (input: string) => {
    // Filesystem MCP hívás
  },
});

// Agent inicializálás
const model = new ChatAnthropic({
  modelName: 'claude-sonnet-4-5',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const executor = await initializeAgentExecutorWithOptions(
  [githubTool, filesystemTool],
  model,
  {
    agentType: 'openai-functions',
    verbose: true,
  }
);

// Agent futtatás
const result = await executor.run(
  'Create CitySelector component based on CLAUDE.md specifications'
);
```

---

### Fázis 5: CI/CD Integráció (1 nap)

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml

name: Deploy DunApp PWA

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        with:
          args: deploy --prod
      
      - name: Notify Claude Agent
        run: |
          curl -X POST https://api.anthropic.com/v1/messages \
            -H "x-api-key: ${{ secrets.ANTHROPIC_API_KEY }}" \
            -d '{
              "model": "claude-haiku",
              "messages": [{"role": "user", "content": "Deployment successful. Run health checks."}]
            }'
```

---

## 💰 KÖLTSÉG BECSLÉS {#costs}

### MCP Servers Költségek

| MCP Server | Típus | Havi Költség |
|------------|-------|--------------|
| GitHub | Ingyenes | $0 |
| Filesystem | Ingyenes | $0 |
| Fetch | Ingyenes | $0 |
| PostgreSQL (Supabase) | Ingyenes* | $0 - $25 |
| Puppeteer | Ingyenes | $0 |
| SQLite | Ingyenes | $0 |
| Google Drive | Ingyenes (15GB) | $0 - $2 |
| Netlify | Ingyenes** | $0 - $19 |
| Sentry | Ingyenes*** | $0 - $26 |
| Lighthouse | Ingyenes | $0 |
| **Semgrep** ⭐ ÚJ! | Ingyenes (Community) | $0 - $80 |
| **Snyk** | Ingyenes (Limited) | $0 - $49 |
| **ESLint/Prettier** | Ingyenes | $0 |

*Supabase Free tier: 500MB DB, 2GB bandwidth  
**Netlify Free tier: 100GB bandwidth, 300 build minutes  
***Sentry Free tier: 5K errors/month

**Összes MCP költség: $0 - $201 / hó** (ha free tier-eket használod: **$0**)

---

### AI Agents Költségek (Átdolgozott Struktúra)

#### Claude API Pricing (2025)

| Model | Input | Output |
|-------|-------|--------|
| Claude Opus 4.1 | $15 / 1M tokens | $75 / 1M tokens |
| Claude Sonnet 4.5 | $3 / 1M tokens | $15 / 1M tokens |
| Claude Haiku | $0.25 / 1M tokens | $1.25 / 1M tokens |

---

#### Becsült Agent Használat (havi) - Specializált Szerepkörök

**Agent 0: Master Architect (Opus 4.1):**
- 50 koordinációs feladat / hó
- ~100K tokens / feladat (komplex döntéshozatal)
- Total: 5M input + 2M output tokens
- Költség: **$225 / hó**

**Agent 1: Frontend Engineer (Sonnet 4.5):**
- 100 komponens generálás / hó
- ~50K tokens / komponens
- Total: 5M input + 10M output tokens
- Költség: **$165 / hó**

**Agent 2: Backend Engineer (Sonnet 4.5):**
- 50 Edge Function / API endpoint / hó
- ~80K tokens / endpoint
- Total: 4M input + 8M output tokens
- Költség: **$132 / hó**

**Agent 3: Data Engineer (Sonnet 4.5):**
- 30 scraper/API integráció / hó
- ~100K tokens / integráció
- Total: 3M input + 6M output tokens
- Költség: **$99 / hó**

**Agent 4: QA Tester (Sonnet 4.5):**
- 200 teszt generálás / hó
- ~30K tokens / teszt
- Total: 6M input + 12M output tokens
- Költség: **$198 / hó**

**Agent 5: Security Analyst (Sonnet 4.5):**
- 50 security scan + fix / hó
- ~60K tokens / scan
- Total: 3M input + 5M output tokens
- Költség: **$84 / hó**

**Agent 6: DevOps Engineer (Haiku):**
- 500 monitoring/deploy feladat / hó
- ~5K tokens / feladat
- Total: 2.5M input + 1M output tokens
- Költség: **$2 / hó** ⭐ (Haiku = cheap!)

**Agent 7: UI/UX Designer (Sonnet 4.5):**
- 100 design review / hó
- ~40K tokens / review
- Total: 4M input + 3M output tokens
- Költség: **$57 / hó**

**Agent 8: Documentation Writer (Haiku):**
- 200 dokumentáció update / hó
- ~10K tokens / update
- Total: 2M input + 1.5M output tokens
- Költség: **$1.9 / hó** ⭐ (Haiku = cheap!)

---

### Összesített Agent Költségek

```
Agent 0 (Master Architect):    $225/hó
Agent 1 (Frontend Engineer):   $165/hó
Agent 2 (Backend Engineer):    $132/hó
Agent 3 (Data Engineer):       $99/hó
Agent 4 (QA Tester):          $198/hó
Agent 5 (Security Analyst):    $84/hó
Agent 6 (DevOps Engineer):     $2/hó   ⭐
Agent 7 (UI/UX Designer):      $57/hó
Agent 8 (Docs Writer):         $2/hó   ⭐
────────────────────────────────────
TOTAL:                         $964/hó
```

**💡 Költségcsökkentési tippek:**
- **Kezdetben**: Csak Master Architect + Frontend + Backend ($522/hó)
- **Közepes**: Add hozzá Data Engineer + Security Analyst ($705/hó)
- **Teljes**: Minden agent ($964/hó)
- **DevOps + Docs**: Haiku modellel olcsón ($4/hó együtt!)

---

### Optimalizált Költség Scenario-k

#### Scenario 1: Ingyenes Kezdés (Csak MCP-k)
```
MCP Servers:  $0/hó
AI Agents:    $0/hó (Claude Code manuálisan)
Infra:        $0/hó (free tiers)
────────────────────────
TOTAL:        $0/hó 🎉
```

#### Scenario 2: Minimális Agent Setup
```
MCP Servers:           $0/hó
Master Architect:      $225/hó
DevOps (monitoring):   $2/hó
Infra:                 $0/hó
────────────────────────
TOTAL:                 $227/hó
```

#### Scenario 3: Fejlesztési Fase (Frontend + Backend fokusz)
```
MCP Servers:         $0/hó
Master Architect:    $225/hó
Frontend Engineer:   $165/hó
Backend Engineer:    $132/hó
Data Engineer:       $99/hó
Security Analyst:    $84/hó
DevOps:              $2/hó
────────────────────────
TOTAL:               $707/hó
```

#### Scenario 4: Teljes Production Fleet
```
MCP Servers:           $0-201/hó
All 9 Agents:          $964/hó
Infra (Supabase Pro):  $25/hó
Sentry:                $26/hó
Semgrep Team:          $80/hó (optional)
────────────────────────
TOTAL:                 $1,096-1,296/hó
```

---

### Total Cost of Ownership (havi) - Frissített

```
MCP Servers:          $0 - $201
AI Agents (9 db):     $0 - $964
Supabase:             $0 - $25
Netlify:              $0 - $19
Sentry:               $0 - $26
Semgrep:              $0 - $80
Anthropic Claude API: $0 - $964

TOTAL:                $0 - $2,279 / hó
```

**Gyakorlati Költségek:**
- **Free Tier Kezdés:** **$0 / hó** (csak MCP-k, manuális Claude Code)
- **Minimális Agent:** **$227 / hó** (Master + DevOps)
- **Fejlesztési Fase:** **$707 / hó** (Core agents)
- **Teljes Production:** **$1,000-1,300 / hó** (Minden agent + MCP-k)

---

### ROI Számítás

**Fejlesztési idő Agent-ekkel:**
```
Manuális fejlesztés:     16-22 nap (128-176 óra)
Agent-assisted:          8-12 nap (64-96 óra)
────────────────────────────────────────────
Időmegtakarítás:         50% gyorsabb! ⚡

Fejlesztői óradíj:       $50/óra (átlag)
Megtakarított munkaóra:  64-80 óra
Megtakarított költség:   $3,200-4,000

Agent költség (3 hó):    $2,100-3,900
────────────────────────────────────────────
NET SAVINGS:             $0-1,900 (első projekt!)
```

**Második projekt és tovább:**
- Agent-ek már konfigurálva
- MCP-k működnek
- Workflow beállt
- **Költség:** Csak API használat (~$700/hó)
- **ROI:** Minden projekt 50% gyorsabb!

---

## 🎯 AJÁNLOTT KEZDŐ SETUP

### Ingyenes / Minimal Költségű Kezdés

**MCP Servers (mind ingyenes):**
1. ✅ GitHub MCP
2. ✅ Filesystem MCP
3. ✅ Fetch MCP
4. ✅ Supabase (PostgreSQL) MCP
5. ✅ Puppeteer MCP

**AI Agents (opcionális):**
- ❌ Kezdetben NEM kell! Claude Code elég
- ✅ Később: Monitor Agent (Haiku, $2/hó)

**Total Cost:** **$0 / hó** 🎉

---

### Érett Projekt Setup

**MCP Servers:**
- Minden fenti + Google Drive + Netlify + Sentry

**AI Agents:**
- Development Agent (Sonnet 4.5)
- Data Agent (Sonnet 4.5)
- Monitor Agent (Haiku)

**Total Cost:** **~$200-300 / hó**

---

## 📚 TOVÁBBI FORRÁSOK

### Official MCP Repositories
- GitHub: https://github.com/modelcontextprotocol
- Documentation: https://modelcontextprotocol.io
- SDKs: Python, TypeScript, Rust

### Custom MCP Examples
- Weather API MCP: https://github.com/example/weather-mcp
- Database MCP: https://github.com/example/db-mcp
- Deployment MCP: https://github.com/example/deploy-mcp

### AI Agent Frameworks
- LangChain: https://python.langchain.com
- AutoGen: https://microsoft.github.io/autogen
- CrewAI: https://www.crewai.io

---

## ✅ SUMMARY - TL;DR

### Kötelező MCP-k (Ingyenes):
1. **GitHub** - Verziókezelés
2. **Filesystem** - Fájlműveletek
3. **Fetch** - API hívások
4. **Supabase** - Adatbázis
5. **Puppeteer** - Scraping (ha nincs API)

### Ajánlott MCP-k:
6. Google Drive - Backup
7. Netlify - Deployment
8. Sentry - Monitoring
9. Lighthouse - Performance

### Custom MCP-k (Építendő):
10. DunApp Weather MCP
11. VízÜgy Scraper MCP

### AI Agents (Opcionális):
- **Dev Agent** - Kód generálás
- **Data Agent** - API integráció
- **Monitor Agent** - Hibafigyelés

### Költségek:
- **Ingyenes kezdés:** $0/hó (csak MCP-k)
- **Minimális setup:** $100/hó (+ Monitor Agent)
- **Teljes setup:** $500-1000/hó (összes agent)

---

**Start with MCPs, add Agents later! 🚀**

*DunApp PWA - MCP & AI Agents Recommendation v1.0*  
*Létrehozva: 2025-10-24*  
*Status: ✅ Ready to Implement*
