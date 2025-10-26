# 🌊 DunApp PWA - Claude Code Starter Package

> Progressive Web Application meteorológiai, vízállás és aszály monitoring adatokkal

## 📦 Package Tartalma

Ez a csomag minden szükséges dokumentációt és konfigurációt tartalmaz a DunApp PWA fejlesztésének megkezdéséhez Claude Code-dal VS Code-ban.

---

## 📁 Struktúra

```
dunapp-starter-package/
├── README.md                          # Ez a fájl
├── QUICKSTART.md                      # Gyors indítási útmutató
├── docs/                              # Teljes dokumentáció
│   ├── PROJECT_SUMMARY.md            # ✅ Teljes projekt áttekintés
│   ├── DESIGN_SPECIFICATION.md       # ✅ UI/UX design specifikáció
│   ├── DATA_STRUCTURES.md            # ✅ Adatstruktúrák és API-k
│   ├── KEY_CHANGES_SUMMARY.md        # ✅ Főbb változások összefoglalója
│   └── LOCATIONS_DATA.md             # ✅ Települések teljes listája
├── .claude/                           # Claude Code konfiguráció
│   ├── context.json                  # Projekt kontextus
│   └── instructions.md               # Fejlesztési instrukciók
├── config/                            # Starter config fájlok
│   ├── .env.example                  # Environment változók
│   ├── .gitignore                    # Git ignore szabályok
│   ├── package.json.template         # NPM package template
│   ├── tsconfig.json                 # TypeScript konfig
│   ├── vite.config.ts                # Vite konfig
│   └── tailwind.config.js            # Tailwind CSS konfig
└── seed-data/                         # Seed adatok adatbázishoz
    ├── meteorology_cities.sql        # Meteorológiai városok
    ├── water_level_stations.sql      # Vízállás állomások
    ├── drought_locations.sql         # Aszály helyszínek
    └── groundwater_wells.sql         # Talajvízkutak
```

---

## 🎯 Adatok Összesítése

### Modulok és Helyszínek

| Modul | Helyszínek | Darabszám |
|-------|-----------|-----------|
| 🌤️ **Meteorológia** | Szekszárd, Baja, Dunaszekcső, Mohács | **4 város** |
| 💧 **Vízállás** | Baja, Mohács, Nagybajcs | **3 állomás** |
| 🏜️ **Aszály (Monitoring)** | Katymár, Dávod, Szederkény, Sükösd, Csávoly | **5 helyszín** |
| 🚰 **Aszály (Kutak)** | 15 különböző talajvízkút | **15 kút** |
| **ÖSSZESEN** | | **27 helyszín** |

---

## 🚀 Gyors Indítás (3 lépés)

### 1️⃣ Előfeltételek Ellenőrzése

```bash
# Node.js verzió (18+ vagy 20 LTS szükséges)
node --version

# NPM verzió
npm --version

# Git verzió
git --version

# Claude Code telepítése (ha még nincs)
npm install -g @anthropic-ai/claude-code
```

### 2️⃣ Projekt Létrehozása

```bash
# Új projekt könyvtár
mkdir dunapp-pwa
cd dunapp-pwa

# Git inicializálás
git init

# Másold be a starter package tartalmát
# (Másold át a docs/, .claude/, config/, seed-data/ könyvtárakat)
```

### 3️⃣ VS Code + Claude Code Indítás

```bash
# Projekt megnyitása VS Code-ban
code .

# VS Code-ban:
# Ctrl+Shift+P (vagy Cmd+Shift+P Mac-en)
# > "Claude Code: Start"
```

---

## 📚 Dokumentáció Használata

### Olvasási Sorrend (Ajánlott)

1. **QUICKSTART.md** - Gyors áttekintés és setup
2. **docs/PROJECT_SUMMARY.md** - Teljes architektúra megértése
3. **docs/LOCATIONS_DATA.md** - Települések és helyszínek listája
4. **docs/DESIGN_SPECIFICATION.md** - UI/UX részletek
5. **docs/DATA_STRUCTURES.md** - API struktúrák és adatformátumok

### Claude Code Használat

Amikor Claude Code-ot indítasz, add meg neki a következő promptot:

```
Olvasd el a docs/PROJECT_SUMMARY.md fájlt, hogy megértsd a DunApp PWA 
projekt architektúráját. Ez egy meteorológiai, vízállás és aszály monitoring 
alkalmazás 3 modullal. Kezdjük a projekt inicializálásával.
```

---

## 🏗️ Fejlesztési Fázisok

### Phase 1: Projekt Setup (1-2 nap)
- ✅ Vite + React + TypeScript projekt inicializálás
- ✅ Tailwind CSS setup
- ✅ Folder struktúra létrehozása
- ✅ Supabase projekt setup
- ✅ Environment változók

### Phase 2: Supabase Adatbázis (1-2 nap)
- ✅ Táblák létrehozása (schema.sql)
- ✅ Seed adatok betöltése
- ✅ RLS policies beállítása
- ✅ Supabase client konfiguráció

### Phase 3: Alapkomponensek (2-3 nap)
- ✅ Layout komponensek
- ✅ Header + Module Tabs
- ✅ BaseSelector komponens
- ✅ DataCard komponens
- ✅ Loading & Error states

### Phase 4-6: Modulok (6-8 nap)
- ✅ Meteorológia modul
- ✅ Vízállás modul
- ✅ Aszály modul (térképekkel)

### Phase 7: PWA Features (1-2 nap)
- ✅ Service Worker
- ✅ Manifest.json
- ✅ Offline support

### Phase 8: Deployment (1 nap)
- ✅ GitHub push
- ✅ Netlify deployment
- ✅ CI/CD pipeline

**Összesen: ~14-20 nap fejlesztés**

---

## 🛠️ Technológiai Stack

### Frontend
- **React** 18+ (Functional components + Hooks)
- **TypeScript** (Strict mode)
- **Vite** (Build tool)
- **Tailwind CSS** (Styling)
- **React Router** (Navigation)

### Charts & Maps
- **Recharts** vagy **Chart.js** (Grafikonok)
- **Leaflet** / **React-Leaflet** (Térképek)

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage)
- **Supabase Edge Functions** (API logic)

### Deployment
- **GitHub** (Version control)
- **Netlify** (Hosting + CD)

---

## 🎨 Design System

### Színséma

```css
/* Modul színek */
--meteorology: #00A8CC;
--water-level: #00BCD4;
--drought: #FF9800;

/* Háttér színek */
--bg-main: #F0F4F8;
--bg-card: #FFFFFF;

/* Szöveg színek */
--text-primary: #2C3E50;
--text-secondary: #607D8B;
```

Teljes design system: `docs/DESIGN_SPECIFICATION.md`

---

## 📊 Adatforrások (Később konfigurálás)

### Meteorológia
- **Forrás**: OMSZ API (konfigurálás szükséges)
- **Radarkép**: RainViewer API
- **Frissítés**: Óránként

### Vízállás
- **Forrás**: VízÜgy Data Portal (API/scraping)
- **Frissítés**: 6 óránként

### Aszály
- **Források**: 
  - HUGEO (talajvíz)
  - OVF (aszálymonitoring)
  - VízÜgy (kutak)
- **Frissítés**: Naponta

---

## 🔐 Environment Változók

A projekt következő környezeti változókat igényli:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys (később)
VITE_OMSZ_API_KEY=your_omsz_api_key
VITE_RAINVIEWER_API_KEY=your_rainviewer_api_key
# ... további API kulcsok
```

Példa: `config/.env.example`

---

## 🧪 Testing Stratégia

### Unit Tests
- **Framework**: Vitest
- **Target**: 80%+ coverage

### Integration Tests
- **Framework**: React Testing Library

### E2E Tests
- **Framework**: Playwright

---

## 📱 PWA Features

- ✅ Offline működés
- ✅ Install prompt
- ✅ Service Worker caching
- ✅ Push notifications (opcionális)

---

## 🤝 Claude Code Prompt Példák

### Projekt Indítás
```
Hozz létre egy új Vite + React + TypeScript projektet a DunApp PWA számára.
Telepítsd a Tailwind CSS-t és állítsd be a konfigurációt a 
docs/DESIGN_SPECIFICATION.md alapján.
```

### Komponens Létrehozás
```
Hozd létre a BaseSelector komponenst, ami egy újrafelhasználható dropdown 
lesz a települések/állomások választásához. A design a 
DESIGN_SPECIFICATION.md fájlban van.
```

### Modul Fejlesztés
```
Fejleszd ki a Meteorológia modult a PROJECT_SUMMARY.md specifikáció 
alapján. A modul 4 városra (Szekszárd, Baja, Dunaszekcső, Mohács) 
működjön, városválasztóval és 6 adatkártyával.
```

---

## 🎓 További Dokumentáció

### Kulcs Dokumentumok

1. **PROJECT_SUMMARY.md** - Teljes projekt dokumentáció
   - Architektúra
   - Modul részletek
   - Adatbázis séma
   - Fejlesztési fázisok

2. **DESIGN_SPECIFICATION.md** - Design rendszer
   - Színpaletta
   - Tipográfia
   - Komponens méretek
   - Layout szabályok
   - Accessibility

3. **LOCATIONS_DATA.md** - Helyszínek
   - Meteorológiai városok (4)
   - Vízállás állomások (3)
   - Aszály helyszínek (5)
   - Talajvízkutak (15)
   - JSON formátumok
   - SQL seed scriptek

4. **DATA_STRUCTURES.md** - Adatstruktúrák
   - API response formátumok
   - Frontend state management
   - Cache stratégiák

---

## ❓ Gyakori Kérdések

### Q: Melyik modullal kezdjem?
**A:** Meteorológia modul - ez a legegyszerűbb és validálja az alaparchitektúrát.

### Q: Szükséges azonnal az API integráció?
**A:** Nem, kezdheted dummy adatokkal. Az API-k később integrálhatók.

### Q: Hogyan deployoljam?
**A:** GitHub + Netlify automatikus deployment a main branch-re push után.

### Q: Mi a különbség az aszály modul két helyszín típusa között?
**A:** Az aszály monitoring helyszínek (5 db) az aszályindex/talajnedvesség/vízhiány adatokhoz, míg a talajvízkutak (15 db) a talajvízszint adatokhoz kapcsolódnak. KÜLÖN választók!

---

## 📞 Support & Kontakt

Ez a starter package Claude Code-hoz készült. Ha Claude Code-ban dolgozol:

1. Olvasd el a docs/ könyvtár dokumentációit
2. Használd a .claude/instructions.md-t fejlesztési útmutatóként
3. Kérdezz bátran Claude-tól az implementációról!

---

## 🎯 Következő Lépés

Olvasd el a **QUICKSTART.md** fájlt a részletes setup útmutatóért! 🚀

---

*DunApp PWA - Claude Code Starter Package v1.0*
*Létrehozva: 2025-10-24*
*Készítette: Claude (Anthropic) + User Collaboration*
