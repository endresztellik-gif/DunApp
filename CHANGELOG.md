# Changelog

Minden jelentős változás ebben a fájlban kerül dokumentálásra.

A verziókezelés a [Semantic Versioning](https://semver.org/) formátumot követi.

---

## [1.8.0] - 2025-12-23

### ✨ Új Funkciók

#### Meteorológia Modul
- **Napkelte/Napnyugta Kártyák** - Budapest-specifikus napkelte és napnyugta időpontok
  - SunCalc library integráció (kliens-oldali számítás, nincs API hívás)
  - 24 órás időformátum (HH:MM)
  - Automatikus frissítés naponta éjfélkor
  - 2 oszlopos responsive layout (mobil: 1 oszlop, desktop: 2 oszlop)
  - Elhelyezés: Csapadék összesítés előtt
  - Magyar lokalizáció: "Napkelte", "Napnyugta"
  - Budapest koordináták: 47.4979°N, 19.0402°E

### 🐛 Hibajavítások

#### Meteorológia Modul
- **Csapadék összesítés frissítés javítva** (#fix-precipitation-refresh)
  - React Query cache optimalizálva (1 óra → 5 perc staleTime)
  - Hozzáadva `refetchOnWindowFocus: true`
  - Hozzáadva `refetchOnMount: true`
  - Hozzáadva `refetchOnReconnect: true`
  - Automatikus frissítés 30 percenként

### 🔧 Technikai Változások

- **Új függőségek:**
  - `suncalc@^1.9.0` - Csillagászati számítások
  - `@types/suncalc@^1.9.2` - TypeScript típusdefiníciók

- **Bundle méret:**
  - MeteorologyModule: +2.51 KB gzipped (7.65 → 10.16 KB)
  - Main bundle: +0.01 KB gzipped (100.34 → 100.35 KB)
  - Összesen: ~2.5 KB növekedés

- **Performance:**
  - Lighthouse Score: 99 (Performance) ⚡
  - PWA Score: 100 📱
  - Accessibility: 100 ♿

### 📝 Dokumentáció

- Frissített `CLAUDE.md` - Precipitation fix dokumentálva
- Új implementációs terv: napkelte/napnyugta kártyák

---

## [1.7.0] - 2025-12-10

### 🔐 Biztonsági Javítások

- **CodeQL CWE-209/CWE-497 Fix** - Information Exposure javítva
  - Hozzáadva `sanitizeError()` helper minden Edge Function-höz
  - 2 MEDIUM severity alert feloldva
  - 13 további információ kiszivárgási kockázat javítva

### 🔧 Technikai Változások

- **Edge Functions:**
  - Új fájl: `_shared/error-sanitizer.ts` (170 sor)
  - 7 Edge Function frissítve biztonságos hibakezeléssel

---

## [1.6.0] - 2025-12-08

### 🔐 Biztonsági Frissítések

- **CodeQL Action v3 → v4 upgrade**
  - Runtime: Node.js 20 → Node.js 24
  - Kompatibilis CodeQL bundle: 2.17.6+
  - Deprecation figyelmeztetések feloldva (2026 December)

### 📝 Dokumentáció

- Új: `docs/GITHUB_CODE_SCANNING_GUIDE.md` (400+ sor)
- Frissített: `docs/SECURITY_AUDIT_REPORT.md` - CodeQL v4 szekció

---

## [1.5.0] - 2025-11-04

### ✨ Új Funkciók

#### Aszály Modul (Phase 5)
- **Drought Data Integration** - 5 monitoring helyszín
  - Aszálymonitoring.vizugy.hu Pattern API integráció
  - 7 adatsor: HDI, vízhiány, talajnedvesség (6 mélység), hőmérséklet, csapadék, páratartalom
  - Helyszínek: Katymár, Dávod, Szederkény, Sükösd, Csávoly
  - Edge Function: `fetch-drought` v3.0
  - Automatikus frissítés: naponta 6:00 AM UTC (pg_cron)

- **3 Adat Kártya (Valós adatokkal):**
  - DroughtIndexCard - HDI (1.70-2.13)
  - SoilMoistureCard - Átlag 6 mélység (4-26%)
  - WaterDeficitCard - 35cm mélység (35-60 mm)

### 📝 Dokumentáció

- Új: `SESSION_PROGRESS_2025-11-03.md`
- Új: `PROJECT_CONSTRAINTS.md`
- Új: `ASZALYMONITORING_MCP_INSTALLATION_SUMMARY.md`
- Frissített: `CLAUDE.md` - Phase 5 success

---

## [1.4.0] - 2025-11-03

### ✨ Új Funkciók

#### Phase 4 - Water Level Module
- HydroInfo API integráció (3 állomás: Baja, Mohács, Nagybajcs)
- Valós idejű vízállás adatok
- 72 órás előrejelzés
- Automatikus frissítés óránként

### 🎨 Performance Optimalizáció

- **Bundle Reduction:** 112KB → 99KB gzipped (11.6% csökkenés)
- **Code Splitting:** React.lazy() lazy loading mindhárom modulra
- **React Performance:** React.memo() expensive komponensekre
- **Cache Optimization:** Kiterjesztett staleTime statikus adatokra

### 📊 Metrics (Before → After)

- Main bundle: 49% → 49% of budget ✅
- Total JavaScript: 59% of 500KB budget ✅
- First Contentful Paint: ~1.5s → ~1.2s (-20%)
- Time to Interactive: ~3.0s → ~2.4s (-20%)
- Estimated Lighthouse: 90-95 (target: 90+) ✅

### 🔐 Security Hardening

- Security Audit: 0 critical vulnerabilities
- OWASP Top 10: 7/9 pass
- Security Headers: CSP, HSTS, X-Frame-Options (netlify.toml)
- Score: 9.1/10

### 📝 Dokumentáció

- Új: `docs/SECURITY_AUDIT_REPORT.md` (comprehensive)
- Új: `docs/PERFORMANCE_AUDIT_REPORT.md`
- Új: `docs/PERFORMANCE_OPTIMIZATION_SUMMARY.md`

---

## [1.3.0] - 2025-11-02

### ✨ Új Funkciók (Phase 9)

#### Meteorológia Modul
- **6 órás előrejelzés** - Yr.no API (11 adatpont, 72 óra)
- **Animált radarkép** - RainViewer API (13 frame, play/pause vezérlő)
- **Automatikus frissítés** - pg_cron óránként (:05-kor)

#### Backend (Edge Function)
- Yr.no forecast fetch (6-hourly, 12 points)
- OpenWeatherMap current weather (4 cities)
- Fallback: Meteoblue API
- Retry logic (3 attempts, exponential backoff)

#### Database
- Migration 007: pg_cron + pg_net extensions
- Cron job: fetch-meteorology-hourly (5 * * * *)
- Helper function: invoke_fetch_meteorology()

#### Frontend
- ForecastChart: 6-hourly data visualization
- RadarMap: Animated 13-frame loop (500ms interval)
- React Query caching (1 hour stale time)

### 📝 Dokumentáció

- Frissített: `README.md` - Production-ready setup guide
- Új: `docs/API_DOCS.md` - Edge Functions & API reference
- Új: `docs/DEPLOYMENT.md` - Netlify deployment checklist
- Új: `docs/ENV_SETUP.md` - Environment variables (1111 lines)

---

## [1.2.0] - 2025-10-31

### ✨ Új Funkciók

- Initial MVP release
- 3 modul: Meteorológia, Vízállás, Aszály
- 4 város: Szekszárd, Baja, Dunaszekcső, Mohács
- PWA support: Offline, installable
- Push notification support

### 🎨 UI/UX

- Tailwind CSS design system
- Responsive layout (mobile-first)
- Leaflet maps integration
- Recharts visualization

### 📝 Dokumentáció

- README.md - Setup guide
- CLAUDE.md - Development reference (150+ lines)

---

## [1.1.0] - 2025-10-30

### 🔧 Setup & Infrastructure

- Vite + React 18 + TypeScript
- Supabase backend (PostgreSQL + Edge Functions)
- Netlify deployment pipeline
- GitHub Actions CI/CD

---

## [1.0.0] - 2025-10-29

### 🎉 Initial Release

- Project structure created
- Basic architecture defined
- Tech stack finalized

---

**Legend:**
- ✨ Új Funkciók
- 🐛 Hibajavítások
- 🔐 Biztonsági Frissítések
- 🎨 UI/UX Változások
- 🔧 Technikai Változások
- 📝 Dokumentáció
- 📊 Performance
- ⚠️ Breaking Changes
