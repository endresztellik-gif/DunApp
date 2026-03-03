# CLAUDE.md - DunApp PWA Development Reference

> CENTRAL REFERENCE DOCUMENT
> Claude Code: Read this file FIRST before every task.

**Last updated:** 2026-03-03
**Version:** 3.0.0
**Project status:** Production Ready (All modules operational, all cron jobs active)

## WeatherMapsWidget v3.0 — kritikus konfiguráció

**TILOS** a MapContainer-ben:
- `preferCanvas={true}` → Canvas renderer TileLayer sub-pixel shift-et okoz
- `maxBounds` + `maxBoundsViscosity` → koordináta eltolást okoz

**Legend container:** soha ne használj `flex items-center`-t → mobil magasságszámítási hiba.
Helyes: `<div className="... px-3 py-2.5">` (block layout).

**Default view:** center `[45.85, 18.5]`, zoom 9, height `h-64 sm:h-96`

---

## QUICK REFERENCE

### Project IDs
- **Name:** DunApp PWA
- **Type:** Progressive Web Application
- **Goal:** Meteorology, water level, and drought monitoring for southern Hungary
- **Modules:** 3 (Meteorology, Water Level, Drought)
- **Locations:** 27 total (5 cities + 3 stations + 5 monitoring sites + 15 wells - 5 disabled)
- **Supabase project:** `zpwoicpajmvbtmtumsah` (CORRECT project URL - NEVER use tihqkmzwfjhfltzskfgi)
- **Production URL:** https://dunapp.netlify.app
- **GitHub repo:** https://github.com/endresztellik-gif/DunApp
- **Netlify site ID:** `d7544b8d-be4f-4d72-8846-913d5039f7ad`

### Tech Stack
```
Frontend:  React 18 + TypeScript + Vite + Tailwind CSS
Charts:    Recharts
Maps:      Leaflet + React-Leaflet
Icons:     lucide-react
Backend:   Supabase (PostgreSQL + Edge Functions + pg_cron)
Deploy:    GitHub Actions -> Netlify (auto-deploy on push to main)
Node:      22 (set in netlify.toml)
```

### Critical Architecture Rule
```
WARNING: MODULE-SPECIFIC SELECTORS
- Every module has its OWN location/city selector
- NEVER create a global city/station selector
- Drought module has 2 SEPARATE selectors (locations + wells)
```

---

## MODULES AND DATA

### Meteorology Module
- **Cities (5):** Szekszárd, Baja, Dunaszekcső, Mohács, Bátaapáti
- **Data sources:** OpenWeatherMap (current), Yr.no (forecast), RainViewer (radar)
- **Edge Function:** `fetch-meteorology`
- **Cron:** Every hour at :05 (`5 * * * *`)
- **Features:** Current weather, 6-hour forecast, animated radar map (13 frames)
- **Status:** Operational

### Water Level Module
- **Stations (3):** Baja, Mohács, Nagybajcs
- **Data source:** vizugy.hu (web scraping) + HydroInfo MCP
- **Edge Functions:** `fetch-water-level`, `fetch-belso-beda-water-level`, `fetch-ftcs-water-level`, `fetch-kadia-water-level`
- **Cron:** Hourly at :10 (`10 * * * *`)
- **Features:** Live water levels, push notifications (alert at >=400cm), historical data
- **Precipitation:** `fetch-precipitation-summary`, cron daily at 06:00 UTC (`0 6 * * *`)
- **Status:** Operational

### Drought Module
- **Monitoring locations (5):** Katymár, Dávod, Szederkény, Sükösd, Csávoly
- **Groundwater wells (15 total, 10 enabled):** See docs/history/HOTFIXES_2026.md for disabled wells
- **Data sources:** aszalymonitoring.vizugy.hu (Pattern API), vizugy.hu PHP endpoint (groundwater)
- **Edge Functions:** `fetch-drought`, `fetch-groundwater-vizugy`
- **Cron (drought):** Daily at 06:00 UTC (`0 6 * * *`)
- **Cron (groundwater):** Daily at 05:00 UTC, SMART threshold: only fetches if >=5 days since last data
- **Features:** HDI index, soil moisture (6 depths), water deficit, groundwater levels (365-day history)
- **Status:** Operational (10 wells enabled, 5 disabled due to poor data quality)

---

## CURRENT CRON JOB STATUS

| Job Name | Schedule | Edge Function | jobid | Status |
|----------|----------|---------------|-------|--------|
| fetch-meteorology-hourly | `5 * * * *` | fetch-meteorology | - | Active |
| fetch-water-level-hourly | `10 * * * *` | fetch-water-level | - | Active |
| fetch-precipitation-summary-daily | `0 6 * * *` | fetch-precipitation-summary | 9 | Active |
| fetch-drought-daily | `0 6 * * *` | fetch-drought | - | Active |
| fetch-groundwater-daily | `0 5 * * *` | fetch-groundwater-vizugy (smart) | 13 | Active |

All cron jobs use Supabase project URL: `https://zpwoicpajmvbtmtumsah.supabase.co`

---

## KEY FILE PATHS

### Frontend Source
```
src/
  App.tsx                           # Root component, module routing
  modules/
    meteorology/                    # Meteorology module
      WeatherMapsWidget.tsx         # 4-tab map widget (Radar/Műhold/Szél/Hőmérséklet)
    water-level/                    # Water level module
    drought/                        # Drought module
  hooks/
    useGroundwaterWells.ts          # Filters by enabled=true (10 wells)
  types/index.ts                    # TypeScript interfaces
  sw.ts                             # Service worker (Workbox caching)
  styles/design-tokens.css          # CSS variables, GPU acceleration styles
```

### Backend
```
supabase/
  functions/
    _shared/error-sanitizer.ts      # Safe error messages (CWE-209 fix)
    fetch-meteorology/index.ts
    fetch-water-level/index.ts
    fetch-drought/index.ts
    fetch-groundwater-vizugy/index.ts  # PRIMARY groundwater function (vizugy.hu)
    fetch-precipitation-summary/index.ts
    send-push-notification/index.ts
    check-water-level-alert/index.ts
  migrations/                       # DB migrations 001-025
```

### Config Files
```
netlify.toml                        # Build config, security headers, CSP, redirects
.github/workflows/deploy.yml        # Auto-deploy to Netlify on push to main
.github/workflows/codeql.yml        # CodeQL v4 security scanning
```

---

## ENVIRONMENT VARIABLES

```env
# Frontend (Vite - prefix VITE_)
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_VAPID_PUBLIC_KEY

# Supabase Edge Functions (server-side only)
OPENWEATHER_API_KEY
METEOBLUE_API_KEY
VAPID_PRIVATE_KEY
VAPID_PUBLIC_KEY
VAPID_SUBJECT
```

GitHub Actions secrets required for Netlify deployment:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

---

## DOCUMENTATION INDEX

### Architecture & Design
- `docs/DESIGN_SPECIFICATION.md` - UI/UX design spec
- `docs/DATA_STRUCTURES.md` - TypeScript interfaces and data shapes
- `docs/LOCATIONS_DATA.md` - All city/station/well coordinates and codes

### API & Backend
- `docs/API_DOCS.md` - Edge Functions API reference
- `docs/SUPABASE_DEPLOYMENT_GUIDE.md` - Database and Edge Function deployment
- `docs/ENV_SETUP.md` - Environment variables and API key setup (detailed)
- `docs/PUSH_NOTIFICATIONS_SPEC.md` - Web Push / VAPID setup

### Deployment & Operations
- `docs/DEPLOYMENT.md` - Netlify deployment checklist
- `docs/SECURITY_AUDIT_REPORT.md` - Security audit (0 critical, 9.1/10 score)
- `docs/GITHUB_CODE_SCANNING_GUIDE.md` - CodeQL setup guide

### History (Archived)
- `docs/history/CHANGELOGS.md` - Phase 9 and Phase 5 (Drought) changelogs
- `docs/history/HOTFIXES_2025.md` - Cron URL fixes, CodeQL v4, CWE-209 fix, RadarMap performance
- `docs/history/HOTFIXES_2026.md` - Groundwater source migration, cron fixes, API format change

### Skills (Runbooks)
- `.claude/skills/dunapp-deploy.md` - How to deploy Edge Functions and verify cron jobs
- `.claude/skills/dunapp-csp.md` - How to update CSP headers in netlify.toml
- `.claude/skills/dunapp-cron-fix.md` - How to debug and fix broken cron jobs
