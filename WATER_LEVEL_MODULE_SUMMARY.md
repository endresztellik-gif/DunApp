# Water Level Module - Executive Summary

**Phase 4 Implementation Plan Overview**

**Created:** 2025-11-03
**Full Plan:** `docs/WATER_LEVEL_MODULE_PLAN.md` (1111 lines)

---

## Key Decisions

### 1. Architecture: TypeScript Edge Functions (SELECTED)

**Why TypeScript instead of Python MCP server?**
- Consistent with existing Meteorology Module pattern
- Single tech stack (TypeScript everywhere)
- Deployed on Supabase (no additional infrastructure)
- Easier maintenance for future developers
- Free tier: 500K Edge Function invocations/month

**Trade-off:** Need to rewrite Python scraping logic to TypeScript
**Solution:** Use DOMParser (deno_dom) + TextDecoder for ISO-8859-2

---

## Implementation Overview

### Database (Migration 008 + 009)

**Tables Used (already exist from Migration 001):**
- `water_level_stations` - 3 stations
- `water_level_data` - Time-series measurements
- `water_level_forecasts` - 5-day forecasts

**New:**
- Seed 3 stations: Nagybajcs, Baja, Mohács
- Helper functions: `get_latest_water_level()`, `check_mohacs_alert_threshold()`
- Cron jobs: `fetch-water-level-hourly`, `check-mohacs-alert-hourly`

---

### Backend (Edge Functions)

**fetch-water-level** (main data pipeline)
```
1. Scrape vizugy.hu → Current levels (3 stations)
2. Scrape hydroinfo.hu → 5-day forecasts (ISO-8859-2 encoding)
3. Insert to database
4. Return JSON summary
```

**check-mohacs-alert** (push notifications)
```
1. Check if Mohács >= 400cm
2. Send push notifications to subscribers
3. Log notification history
```

**Cron Schedule:**
- Water level fetch: Every hour at :10
- Alert check: Every hour at :15 (5 min after fetch)

---

### Frontend Components

**Structure:**
```
src/modules/water-level/
├── WaterLevelModule.tsx       # Main module (3 data cards)
├── StationSelector.tsx        # Module-specific selector
├── WaterLevelChart.tsx        # 3-station comparison (7 days)
├── ForecastTable.tsx          # 5-day forecast table
└── hooks/
    ├── useWaterLevelData.ts   # Current data hook
    ├── useStations.ts         # Station list hook
    └── useForecastData.ts     # Forecast data hook
```

**Features:**
- 3 data cards: Water Level (cm), Flow Rate (m³/s), Water Temperature (°C)
- 7-day multi-line chart (3 stations comparison)
- 5-day forecast table
- Module-specific station selector (NOT global!)
- React Query caching (5 min stale time)

---

## Implementation Phases

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 4.1 | Database Schema | 1-2h | ⬜ Not Started |
| 4.2 | Edge Function - Current Levels | 3-4h | ⬜ Not Started |
| 4.3 | Edge Function - Forecasts | 2-3h | ⬜ Not Started |
| 4.4 | Cron Job Setup | 1h | ⬜ Not Started |
| 4.5 | Frontend Components | 4-5h | ⬜ Not Started |
| 4.6 | Push Notifications | 3-4h | ⬜ Not Started |
| 4.7 | Testing & Documentation | 2-3h | ⬜ Not Started |

**Total Estimated Time:** 16-22 hours (5 sessions)

---

## Critical Technical Challenges

### 1. Web Scraping Stability

**Challenge:** vizugy.hu and hydroinfo.hu have no APIs, only HTML scraping

**Solution:**
- Robust error handling with retry logic (3 attempts, exponential backoff)
- Partial failure tolerance (skip failed station, continue with others)
- Detailed logging for monitoring
- Fallback: manual data entry if scraping fails

**Risk Level:** HIGH (external dependency)

---

### 2. ISO-8859-2 Encoding

**Challenge:** hydroinfo.hu uses ISO-8859-2 (Hungarian encoding), not UTF-8

**Solution:**
```typescript
const response = await fetch(url);
const buffer = await response.arrayBuffer();
const decoder = new TextDecoder('iso-8859-2');
const html = decoder.decode(buffer);
```

**Testing:** Verify Hungarian characters (Mohács, not Moh�cs)

**Risk Level:** MEDIUM (can fix with library if native fails)

---

### 3. Push Notification Complexity

**Challenge:** Web Push API is complex

**Solution:**
- Phase 4.6 is optional for MVP
- Start with logging-only implementation
- Full Web Push can be added later

**Risk Level:** LOW (not critical for MVP)

---

## Data Sources

### vizugy.hu (Current Levels)

**URL:** https://www.vizugy.hu/index.php?module=content&programelemid=138

**Data:**
- Water level (cm)
- Flow rate (m³/s)
- Water temperature (°C)

**Method:** HTML table scraping (DOMParser)

**Frequency:** Hourly

---

### hydroinfo.hu (Forecasts)

**URL:** http://www.hydroinfo.hu/html/vizelo.html

**Data:**
- 5-day water level forecast (cm)
- Forecast days: +1, +2, +3, +4, +5

**Method:** HTML table scraping with ISO-8859-2 decoding

**Frequency:** Hourly

---

## Success Criteria

**Phase 4 Complete When:**
- [ ] All 3 stations scrape successfully
- [ ] Current data displayed in frontend (3 data cards)
- [ ] 7-day comparison chart works (3 lines)
- [ ] 5-day forecast table displays
- [ ] Cron jobs run hourly without errors
- [ ] Push notification logic ready (even if logging-only)
- [ ] Data accuracy verified against source websites
- [ ] Documentation updated (CLAUDE.md, API_DOCS.md)

---

## Next Actions

### Before Starting Implementation:

1. **User Review:** Read full plan (`docs/WATER_LEVEL_MODULE_PLAN.md`)
2. **Approve Architecture:** Confirm TypeScript Edge Functions approach
3. **Approve Timeline:** 16-22 hours over 5 sessions acceptable?
4. **Prioritize Features:** Push notifications (Phase 4.6) required for MVP?

### After Approval:

1. **Start Phase 4.1:** Database schema migration
2. **Test Locally:** Supabase local dev environment
3. **Iterate Phases:** Complete 4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7
4. **Deploy:** Production deployment after testing

---

## Questions for User

1. **Architecture Approval:** TypeScript Edge Functions vs Python MCP server?
2. **Push Notifications:** Required for MVP or defer to later?
3. **Timeline:** 5 sessions acceptable for Phase 4 completion?
4. **Data Accuracy:** How critical is exact match with vizugy.hu? (scraping may have small delays)
5. **Error Tolerance:** Acceptable if 1 station fails but other 2 work?

---

**Ready to Start?** Review `docs/WATER_LEVEL_MODULE_PLAN.md` for full details.

**Questions?** Ask before starting Phase 4.1!
