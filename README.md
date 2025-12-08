# 🌊 DunApp PWA

> Progressive Web Application for meteorology, water level, and drought monitoring in Southern Hungary

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_BADGE_ID/deploy-status)](https://app.netlify.com/sites/dunapp-pwa/deploys)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com/)
[![CodeQL](https://github.com/endresztellik-gif/DunApp/workflows/CodeQL%20Security%20Analysis/badge.svg)](https://github.com/endresztellik-gif/DunApp/actions/workflows/codeql.yml)

**Live Demo:** [https://dunapp-pwa.netlify.app](https://dunapp-pwa.netlify.app) _(Coming soon)_

---

## 📋 Overview

DunApp PWA monitors environmental data for 27 locations across Southern Hungary's Danube region:

| Module | Locations | Count |
|--------|-----------|-------|
| 🌤️ **Meteorology** | Szekszárd, Baja, Dunaszekcső, Mohács | **4 cities** |
| 💧 **Water Level** | Baja, Mohács, Nagybajcs | **3 stations** |
| 🏜️ **Drought Monitoring** | Katymár, Dávod, Szederkény, Sükösd, Csávoly | **5 locations** |
| 🚰 **Groundwater Wells** | 15 monitoring wells | **15 wells** |
| **TOTAL** | | **27 locations** |

### Key Features

- ✅ **Real-time weather data** (OpenWeatherMap + Yr.no APIs)
- ✅ **Animated radar map** (RainViewer API with 13-frame loop)
- ✅ **6-hourly forecast** (11 data points for 72 hours)
- ✅ **Danube water levels** (HydroInfo API integration)
- ✅ **Drought monitoring** (Aszálymonitoring.hu Pattern API - HDI, soil moisture, water deficit)
- ✅ **Automated data refresh** (Hourly cron jobs via pg_cron)
- ✅ **Offline support** (Service Worker caching)
- ✅ **Mobile-first PWA** (Installable on mobile devices)

### ✅ Module Status

**Production Ready:**
- ✅ **Meteorology Module** - Real-time weather data from OpenWeatherMap + Yr.no APIs
- ✅ **Water Level Module** - Live Danube water levels from HydroInfo API
- ✅ **Drought Module** - Real-time drought monitoring data from Aszálymonitoring.hu Pattern API

**Phase 5 Drought Module (Completed 2025-11-04):**
- ✅ **5 monitoring locations** - Katymár, Dávod, Szederkény, Sükösd, Csávoly
- ✅ **7 datasets** - Drought Index (HDI), Water Deficit (35cm), Soil Moisture (6 depths), Temperature, Precipitation, Humidity
- ✅ **Pattern API endpoint** - Official `aszalymonitoring.vizugy.hu/index.php?view=pattern` integration
- ✅ **Automated daily refresh** - pg_cron scheduled at 6:00 AM UTC
- ✅ **3 data cards working** - Drought Index (1.7-2.2), Soil Moisture (10-30%), Water Deficit (35-60 mm)

**In Progress:**
- ⚠️ **Groundwater Wells (15 wells)** - Schema ready, pending VízÜgy API discovery or web scraping implementation
- ⚠️ **Drought Maps** - UI ready, real data integration testing in progress

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ or 20 LTS
- **NPM** 8+
- **Supabase Account** (free tier works)
- **API Keys** (see [Environment Setup](#-environment-setup))

### Installation

```bash
# Clone repository
git clone https://github.com/endresztellik-gif/DunApp.git
cd DunApp

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Setup section)

# Start development server
npm run dev
```

Visit http://localhost:5173

---

## 🛠️ Tech Stack

### Frontend
- **React** 19.1.1 (Functional components + Hooks)
- **TypeScript** 5.6 (Strict mode)
- **Vite** 6.0 (Build tool + HMR)
- **Tailwind CSS** 4.0 (Utility-first styling)
- **React Router** 7.0 (Client-side routing)
- **React Query** 5.62 (@tanstack/react-query for data fetching)

### Charts & Maps
- **Recharts** 2.15 (Weather forecast charts)
- **Leaflet** 1.9 + **React-Leaflet** 4.2 (Interactive maps)

### Backend & Database
- **Supabase** (PostgreSQL 15 + Row Level Security)
- **Supabase Edge Functions** (Deno runtime for API integrations)
- **pg_cron** (Automated hourly data refresh)
- **pg_net** (HTTP requests from PostgreSQL)

### APIs
- **OpenWeatherMap** (Current weather data)
- **Yr.no** (MET Norway 6-hourly forecast)
- **RainViewer** (Animated weather radar)
- **HydroInfo** (Danube water level data)
- **Meteoblue** (Fallback weather API)

### Deployment & Security
- **GitHub** (Version control)
- **Netlify** (Hosting + CI/CD)
- **GitHub Actions** (Automated workflows)
  - CI Pipeline: Lint, test, type-check, build
  - CodeQL Security Scanning: v4 (JavaScript/TypeScript)
  - Weekly security scans + PR checks

---

## 📦 Project Structure

```
dunapp-pwa/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout/          # Header, Footer, MainLayout
│   │   ├── UI/              # DataCard, EmptyState, LoadingSpinner
│   │   └── selectors/       # CitySelector, StationSelector, LocationSelector
│   ├── modules/             # Feature modules
│   │   ├── meteorology/     # Weather module (ForecastChart, RadarMap)
│   │   ├── waterlevel/      # Water level module (WaterLevelChart)
│   │   └── drought/         # Drought module (DroughtMap, WellSelector)
│   ├── hooks/               # Custom React hooks
│   │   ├── useForecastData.ts
│   │   ├── useWeatherData.ts
│   │   └── useWaterLevelData.ts
│   ├── lib/                 # External service clients
│   │   └── supabase.ts      # Supabase client configuration
│   ├── types/               # TypeScript type definitions
│   ├── data/                # Mock data for development
│   └── App.tsx              # Main application component
├── supabase/
│   ├── functions/           # Edge Functions (Deno)
│   │   └── fetch-meteorology/  # Hourly weather data fetcher
│   └── migrations/          # Database migrations
│       ├── 001_initial_schema.sql
│       ├── 005_meteorology_forecasts.sql
│       ├── 006_add_forecast_temperature_range.sql
│       └── 007_setup_cron_jobs.sql
├── public/                  # Static assets
│   ├── icons/               # PWA icons (192x192, 512x512)
│   └── manifest.json        # PWA manifest
├── docs/                    # Documentation
│   ├── API_DOCS.md          # Edge Functions API reference
│   ├── DEPLOYMENT.md        # Deployment guide
│   └── ENV_SETUP.md         # Environment variables guide
├── CLAUDE.md                # Claude Code development reference
└── README.md                # This file
```

---

## 🔐 Environment Setup

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Edge Function Secrets (set via Supabase Dashboard or CLI)
# Note: These are NOT prefixed with VITE_ as they're server-side only
OPENWEATHER_API_KEY=your_openweathermap_api_key
METEOBLUE_API_KEY=your_meteoblue_api_key
YR_NO_USER_AGENT="DunApp PWA/1.0 (contact@dunapp.hu)"

# PWA Push Notifications (optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:contact@dunapp.hu
```

### Getting API Keys

1. **Supabase**
   - Create account: https://supabase.com
   - Create new project
   - Copy `Project URL` and `anon/public` key from Settings > API

2. **OpenWeatherMap** (required for current weather)
   - Sign up: https://openweathermap.org/api
   - Free tier: 1,000 calls/day
   - API key in Account > API keys

3. **Meteoblue** (optional fallback)
   - Sign up: https://www.meteoblue.com/en/weather-api
   - Free tier available
   - Get API key from dashboard

4. **Yr.no** (MET Norway)
   - No API key required!
   - Just set User-Agent header (already configured)

5. **RainViewer** (radar maps)
   - No API key required!
   - Free public API

See [docs/ENV_SETUP.md](docs/ENV_SETUP.md) for detailed setup instructions.

---

## 🗄️ Database Setup

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
2. Run each migration file in order:
   ```sql
   -- Run migrations in this order:
   -- 1. supabase/migrations/001_initial_schema.sql
   -- 2. supabase/migrations/005_meteorology_forecasts.sql
   -- 3. supabase/migrations/006_add_forecast_temperature_range.sql
   -- 4. supabase/migrations/007_setup_cron_jobs.sql
   ```

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_ID

# Push migrations
supabase db push
```

### Cron Job Setup

Migration `007_setup_cron_jobs.sql` automatically sets up hourly data refresh:

- **Schedule:** Every hour at :05 (00:05, 01:05, 02:05, etc.)
- **Action:** Calls `fetch-meteorology` Edge Function
- **Refreshes:** Current weather + 6-hourly forecast for all 4 cities

Verify cron job:
```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'fetch-meteorology-hourly';
```

---

## 🚢 Deployment

### Netlify (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" > "Import an existing project"
   - Select your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables in Site settings > Environment variables

3. **Auto-deploy**
   - Every push to `main` triggers automatic deployment
   - Build time: ~2-3 minutes

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed guide.

---

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173)

# Building
npm run build        # Build for production (output: dist/)
npm run preview      # Preview production build locally

# Linting & Formatting
npm run lint         # Run ESLint
npm run format       # Run Prettier (check only)
npm run format:fix   # Run Prettier (auto-fix)

# Type Checking
npm run type-check   # Run TypeScript compiler (no emit)

# Testing
npm run test         # Run Vitest unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
```

---

## 🧪 Testing

Currently using **Vitest** for unit tests:

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

_(Integration and E2E tests planned for future phases)_

---

## 📊 Data Sources & Attribution

| Source | Used For | Update Frequency |
|--------|----------|------------------|
| [OpenWeatherMap](https://openweathermap.org) | Current weather | Hourly (via cron) |
| [Yr.no (MET Norway)](https://api.met.no) | 6-hourly forecast | Hourly (via cron) |
| [RainViewer](https://www.rainviewer.com) | Radar animation | Real-time (client-side) |
| [HydroInfo](https://www.hydroinfo.hu) | Danube water levels | 6-hourly _(planned)_ |
| [Meteoblue](https://www.meteoblue.com) | Fallback weather | As needed |

All data sources are properly attributed in the app footer.

---

## 🏗️ Development Phases

- ✅ **Phase 1:** Project setup (Vite + React + TypeScript + Tailwind)
- ✅ **Phase 2:** Supabase database schema + migrations
- ✅ **Phase 3:** Base components (Layout, DataCard, Selectors)
- ✅ **Phase 4:** Meteorology module (current weather + cities)
- ✅ **Phase 5:** Water level module (Danube stations)
- ⚠️ **Phase 6:** Drought module (UI complete, API blocker - see Known Issues)
- ✅ **Phase 7:** PWA features (Service Worker + manifest)
- ✅ **Phase 8:** Netlify deployment + GitHub CI/CD
- ✅ **Phase 9:** Forecast chart + radar map + cron automation

**Current Status:** Phase 9 Complete 🎉 (Phase 6 data integration pending due to external API issues)

---

## 📖 Documentation

- **[API_DOCS.md](docs/API_DOCS.md)** - Edge Functions API reference
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide (Netlify + Supabase)
- **[ENV_SETUP.md](docs/ENV_SETUP.md)** - Environment variables detailed setup
- **[CLAUDE.md](CLAUDE.md)** - Claude Code development reference

---

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Weather data: [OpenWeatherMap](https://openweathermap.org), [Yr.no](https://www.yr.no)
- Radar imagery: [RainViewer](https://www.rainviewer.com)
- Water data: [HydroInfo](https://www.hydroinfo.hu)
- Maps: [OpenStreetMap](https://www.openstreetmap.org) contributors
- Built with [Claude Code](https://claude.com/claude-code) by Anthropic

---

**Last Updated:** 2025-11-02 (Phase 9 Complete)
**Project Version:** 1.0.0
**Author:** Endre Sztellik
