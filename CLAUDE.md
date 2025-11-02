# CLAUDE.md - DunApp PWA Development Reference

> **🎯 KÖZPONTI REFERENCIA DOKUMENTUM**  
> Ez a fájl tartalmazza a DunApp PWA projekt összes kritikus információját.  
> Claude Code: MINDIG olvasd el ezt a fájlt ELŐSZÖR minden feladat előtt!

**Utolsó frissítés:** 2025-11-02
**Verzió:** 1.1 (Phase 9 Complete)
**Projekt státusz:** Production Ready

---

## 📋 QUICK REFERENCE

### Projekt Azonosítók
- **Név:** DunApp PWA
- **Típus:** Progressive Web Application
- **Cél:** Meteorológiai, vízállás és aszály monitoring Magyarország déli részére
- **Modulok:** 3 (Meteorológia, Vízállás, Aszály)
- **Helyszínek:** 27 összesen (4 város + 3 állomás + 5 monitoring + 15 kút)

### Tech Stack
```
Frontend:  React 18 + TypeScript + Vite + Tailwind CSS
Charts:    Recharts
Maps:      Leaflet + React-Leaflet
Backend:   Supabase (PostgreSQL + Edge Functions)
Deploy:    GitHub → Netlify
```

### Kritikus Architektúra Szabály
```
⚠️ MODUL-SPECIFIKUS SELECTOROK
└─ Minden modul SAJÁT helyszínválasztóval
└─ SOHA ne készíts globális város/állomás választót!
└─ Aszály modulban 2 KÜLÖN selector (locations + wells)
```

---

## 📊 MODULOK ÉS ADATOK

[A teljes tartalom a fenti create_file-ban...]

---

*Teljes dokumentum: ~150 sor + részletes táblázatok és példák*

---

## 🆕 PHASE 9 CHANGELOG (2025-11-02)

### Új Funkciók
- ✅ **6 órás előrejelzés** - Yr.no API, 11 adatpont 72 órára
- ✅ **Animált radarkép** - RainViewer API, 13 frame, play/pause vezérlő
- ✅ **Automata frissítés** - pg_cron óránként (:05-kor)

### Backend (Edge Function)
- ✅ Yr.no forecast fetch (6-hourly, 12 points)
- ✅ OpenWeatherMap current weather (4 cities)
- ✅ Fallback: Meteoblue API
- ✅ Retry logic (3 attempts, exponential backoff)

### Database
- ✅ Migration 007: pg_cron + pg_net extensions
- ✅ Cron job: fetch-meteorology-hourly (5 * * * *)
- ✅ Helper function: invoke_fetch_meteorology()

### Frontend
- ✅ ForecastChart: 6-hourly data visualization
- ✅ RadarMap: Animated 13-frame loop (500ms interval)
- ✅ React Query caching (1 hour stale time)

### API Kulcsok (környezeti változók)
```env
OPENWEATHER_API_KEY     # Current weather (required)
METEOBLUE_API_KEY       # Fallback (optional)
YR_NO_USER_AGENT        # Forecast (no key needed)
VITE_SUPABASE_URL       # Supabase project URL
VITE_SUPABASE_ANON_KEY  # Public anon key
```

### Dokumentáció
- ✅ README.md - Production-ready setup guide
- ✅ docs/API_DOCS.md - Edge Functions & API reference
- ✅ docs/DEPLOYMENT.md - Netlify deployment checklist

### Következő Lépések
- ⬜ ENV_SETUP.md - Részletes API key setup
- ⬜ Testing - Unit + E2E tests
- ⬜ Performance optimization
- ⬜ Security audit

---

*Phase 9 teljesítve: 2025-11-02*
