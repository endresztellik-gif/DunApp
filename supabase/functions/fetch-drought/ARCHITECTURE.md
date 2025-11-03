# Fetch Drought Data - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DUNAPP PWA - DROUGHT MODULE                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. TRIGGER (Automated)                                                       │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────┐         │
│   │ Supabase pg_cron (Daily at 6:00 AM CEST/CET)                 │         │
│   │ SELECT cron.schedule(                                         │         │
│   │   'fetch-drought-daily',                                      │         │
│   │   '0 6 * * *',                                                │         │
│   │   $$ SELECT invoke_fetch_drought(); $$                        │         │
│   │ );                                                            │         │
│   └─────────────────────┬────────────────────────────────────────┘         │
│                         │                                                    │
│                         │ Calls helper function                              │
│                         ▼                                                    │
│   ┌──────────────────────────────────────────────────────────────┐         │
│   │ invoke_fetch_drought() PostgreSQL Function                   │         │
│   │ - Uses pg_net extension                                       │         │
│   │ - Calls Edge Function via HTTP POST                          │         │
│   │ - Includes service_role authentication                        │         │
│   └─────────────────────┬────────────────────────────────────────┘         │
└─────────────────────────┼────────────────────────────────────────────────────┘
                          │
                          │ HTTP POST
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. EDGE FUNCTION (Deno Runtime)                                             │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────┐         │
│   │ fetch-drought Edge Function (index.ts)                        │         │
│   │                                                                │         │
│   │ Main Loop (Sequential):                                       │         │
│   │   For each of 5 drought locations:                            │         │
│   │     ┌─────────────────────────────────────────────┐          │         │
│   │     │ 1. Search Nearest Station                   │          │         │
│   │     │    API: aszalymonitoring.vizugy.hu/search   │          │         │
│   │     │    Input: Settlement name (e.g., "Katymár") │          │         │
│   │     │    Output: { stationId, name, distance }    │          │         │
│   │     └─────────────────┬───────────────────────────┘          │         │
│   │                       │                                        │         │
│   │                       ▼                                        │         │
│   │     ┌─────────────────────────────────────────────┐          │         │
│   │     │ 2. Fetch 60-Day Station Data                │          │         │
│   │     │    API: /station/{id}/data?from=...&to=...  │          │         │
│   │     │    Output: Array of daily records (60 days) │          │         │
│   │     │    Extract: Latest record (last element)    │          │         │
│   │     └─────────────────┬───────────────────────────┘          │         │
│   │                       │                                        │         │
│   │                       ▼                                        │         │
│   │     ┌─────────────────────────────────────────────┐          │         │
│   │     │ 3. Get Location ID from Database            │          │         │
│   │     │    Query: drought_locations table           │          │         │
│   │     │    Match: location_name = "Katymár"         │          │         │
│   │     └─────────────────┬───────────────────────────┘          │         │
│   │                       │                                        │         │
│   │                       ▼                                        │         │
│   │     ┌─────────────────────────────────────────────┐          │         │
│   │     │ 4. Insert Drought Data                      │          │         │
│   │     │    Table: drought_data                      │          │         │
│   │     │    Fields: drought_index, soil_moisture_*, │          │         │
│   │     │            temperature, precipitation, etc. │          │         │
│   │     └─────────────────────────────────────────────┘          │         │
│   │                                                                │         │
│   │ Error Handling:                                               │         │
│   │   - Retry logic: 3 attempts, exponential backoff             │         │
│   │   - Timeout: 10 seconds per API call                         │         │
│   │   - Graceful failure: Continue to next location              │         │
│   │                                                                │         │
│   │ Response Format:                                              │         │
│   │   {                                                           │         │
│   │     success: true,                                            │         │
│   │     summary: { total: 5, success: 5, failed: 0 },            │         │
│   │     results: [ {...}, {...}, ... ]                           │         │
│   │   }                                                           │         │
│   └──────────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
         │                                    │
         │ API Calls                          │ Database Operations
         ▼                                    ▼
┌──────────────────────────┐    ┌────────────────────────────────────┐
│ 3. EXTERNAL API          │    │ 4. SUPABASE DATABASE               │
│                          │    │                                    │
│ aszalymonitoring.vizugy.hu│   │ Tables:                           │
│ (Hungarian Government)    │    │                                    │
│                          │    │ ┌────────────────────────────────┐│
│ Endpoints:               │    │ │ drought_locations (5 rows)     ││
│ - /api/search            │    │ │ - Katymár, Dávod, Szederkény, ││
│ - /api/station/{id}/data │    │ │   Sükösd, Csávoly              ││
│                          │    │ └────────────────────────────────┘│
│ Data Format:             │    │                                    │
│ - JSON                   │    │ ┌────────────────────────────────┐│
│ - Real-time monitoring   │    │ │ drought_data (time-series)     ││
│ - 6-hour updates         │    │ │ - 5 records/day (1 per location)│
│                          │    │ │ - 12 metrics per record        ││
│ No API Key Required      │    │ │ - Indexed by location_id +     ││
│                          │    │ │   timestamp                    ││
│                          │    │ └────────────────────────────────┘│
└──────────────────────────┘    │                                    │
                                │ Indexes:                           │
                                │ - idx_drought_data_location_timestamp│
                                │ - idx_drought_data_timestamp       │
                                │                                    │
                                │ RLS Policies:                      │
                                │ - Public read access               │
                                │ - Service role write access        │
                                └────────────────────────────────────┘
```

---

## Data Flow Sequence

### 1. Cron Trigger (6:00 AM Daily)

```
Time: 06:00:00 CEST/CET
┌──────────────────┐
│ pg_cron scheduler│
└────────┬─────────┘
         │
         ├─► Execute: fetch-drought-daily
         │
         └─► Call: invoke_fetch_drought()
                    │
                    └─► HTTP POST to Edge Function
```

### 2. Edge Function Execution

```
Location: Katymár (Example)
┌────────────────────────────────────────────────────────────┐
│ Step 1: Search Station                                     │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ GET /api/search?settlement=Katymár                     │ │
│ │ Response:                                              │ │
│ │ {                                                      │ │
│ │   nearestStation: {                                   │ │
│ │     id: "KAT001",                                     │ │
│ │     name: "Katymár monitoring állomás",              │ │
│ │     distance: 1200  // meters                        │ │
│ │   }                                                    │ │
│ │ }                                                      │ │
│ └────────────────────────────────────────────────────────┘ │
│                          │                                  │
│                          ▼                                  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Step 2: Fetch Data                                     │ │
│ │ GET /api/station/KAT001/data?from=2024-09-04&to=...   │ │
│ │ Response: [                                            │ │
│ │   {                                                    │ │
│ │     date: "2024-11-03",                               │ │
│ │     HDI: 2.5,          // Drought Index              │ │
│ │     HDIS: 35.2,        // Water Deficit (mm)         │ │
│ │     soilMoisture_20cm: 28.5,  // %                   │ │
│ │     soilTemp: 15.3,    // °C                         │ │
│ │     airTemp: 18.5,                                    │ │
│ │     precipitation: 12.5,                              │ │
│ │     relativeHumidity: 65.0                            │ │
│ │   },                                                   │ │
│ │   ... (59 more records)                               │ │
│ │ ]                                                      │ │
│ └────────────────────────────────────────────────────────┘ │
│                          │                                  │
│                          ▼                                  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Step 3: Get Location ID                                │ │
│ │ SELECT id FROM drought_locations                       │ │
│ │ WHERE location_name = 'Katymár';                      │ │
│ │ Result: uuid-katymar-123                              │ │
│ └────────────────────────────────────────────────────────┘ │
│                          │                                  │
│                          ▼                                  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Step 4: Insert Data                                    │ │
│ │ INSERT INTO drought_data (                             │ │
│ │   location_id,                                         │ │
│ │   drought_index,         // 2.5                       │ │
│ │   water_deficit_index,   // 35.2                      │ │
│ │   soil_moisture_20cm,    // 28.5                      │ │
│ │   soil_temperature,      // 15.3                      │ │
│ │   ...                                                  │ │
│ │   timestamp              // NOW()                     │ │
│ │ );                                                     │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 3. Result Summary

```
┌────────────────────────────────────────────────────────────┐
│ Execution Complete                                         │
│                                                            │
│ Total Time: 12.4 seconds                                   │
│                                                            │
│ Results:                                                   │
│ ├─ Katymár       ✅ Success (HDI: 2.5, station: 1200m)   │
│ ├─ Dávod         ✅ Success (HDI: 1.8, station: 850m)    │
│ ├─ Szederkény    ✅ Success (HDI: 3.2, station: 1450m)   │
│ ├─ Sükösd        ✅ Success (HDI: 2.1, station: 920m)    │
│ └─ Csávoly       ✅ Success (HDI: 2.9, station: 1100m)   │
│                                                            │
│ Summary: 5/5 success, 0 failed                            │
│                                                            │
│ Database: 5 new records inserted into drought_data        │
└────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Matrix

| Component | Calls | Called By | Purpose |
|-----------|-------|-----------|---------|
| **pg_cron** | invoke_fetch_drought() | - (scheduled) | Daily trigger at 6:00 AM |
| **invoke_fetch_drought()** | Edge Function (HTTP) | pg_cron | Helper to call Edge Function |
| **fetch-drought Edge Function** | aszalymonitoring API, Supabase DB | invoke_fetch_drought() | Main data fetching logic |
| **aszalymonitoring API** | - | Edge Function | Provides drought monitoring data |
| **Supabase Database** | - | Edge Function | Stores drought data |

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│ API Call (with Retry Logic)                                 │
│                                                              │
│ Attempt 1: fetchWithTimeout(url, 10s)                       │
│    ├─ Success? ──► Return data                              │
│    └─ Fail? ──► Wait 1 second                               │
│                                                              │
│ Attempt 2: fetchWithTimeout(url, 10s)                       │
│    ├─ Success? ──► Return data                              │
│    └─ Fail? ──► Wait 2 seconds                              │
│                                                              │
│ Attempt 3: fetchWithTimeout(url, 10s)                       │
│    ├─ Success? ──► Return data                              │
│    └─ Fail? ──► Throw error, continue to next location      │
│                                                              │
│ Result:                                                      │
│ ├─ Partial success: 4/5 locations successful               │
│ └─ Function completes with summary: { success: 4, failed: 1 }│
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Runtime Environment
- **Platform:** Supabase Edge Functions
- **Runtime:** Deno (secure JavaScript/TypeScript runtime)
- **Region:** Auto-scaled globally (Cloudflare Workers)

### Dependencies
```typescript
// Standard library
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// No additional dependencies (zero npm packages!)
```

### Database
- **Engine:** PostgreSQL 15
- **Extensions:** pg_cron, pg_net
- **Storage:** ~60 KB/day (5 locations × 12 fields × 1 KB)
- **Retention:** Unlimited (no automatic cleanup)

### APIs
- **aszalymonitoring.vizugy.hu**
  - Protocol: HTTPS REST
  - Format: JSON
  - Authentication: None (public API)
  - Rate Limit: Unknown (likely high)
  - Uptime: Government-backed (99.9% estimated)

---

## Performance Metrics

### Execution Time Breakdown

```
Total: ~12.4 seconds (for 5 locations)

┌────────────────────────────────────────────────┐
│ Component              │ Time (avg)   │ %     │
├────────────────────────────────────────────────┤
│ Search Station API     │ 1.2s × 5     │ 48%   │
│ Fetch Data API         │ 0.8s × 5     │ 32%   │
│ Database Query         │ 0.1s × 5     │ 4%    │
│ Database Insert        │ 0.2s × 5     │ 8%    │
│ Processing/Overhead    │ 1.0s         │ 8%    │
└────────────────────────────────────────────────┘

Optimization Potential:
- Parallel API calls: 48% + 32% = 80% time saved
- Result: 12.4s → ~4s execution time (3x faster)
```

### Database Growth

```
Daily Growth: ~60 KB
- 5 locations × 1 record/day × 12 KB/record = 60 KB

Yearly Growth: ~22 MB
- 60 KB/day × 365 days = 21.9 MB

Storage Cost: Negligible
- Supabase free tier: 500 MB included
- 22 MB/year << 500 MB (only 4.4% of quota)
```

---

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Cron Job → Edge Function                             │
│                                                          │
│    pg_cron uses service_role key (stored in vault)      │
│    ├─ Authorization: Bearer eyJhbGci...                 │
│    └─ Verifies JWT signature before execution           │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ 2. Edge Function → External API                         │
│                                                          │
│    No authentication required (public API)              │
│    ├─ aszalymonitoring.vizugy.hu is open               │
│    └─ No API key or rate limiting                       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ 3. Edge Function → Supabase Database                    │
│                                                          │
│    Uses service_role key (auto-injected)                │
│    ├─ Bypasses RLS policies (authorized)               │
│    └─ Can INSERT into all tables                        │
└─────────────────────────────────────────────────────────┘
```

### Security Best Practices

✅ **Service Role Key** stored in Supabase Vault (encrypted)
✅ **No hardcoded credentials** in code
✅ **HTTPS only** for all API calls
✅ **RLS policies** enabled on database tables
✅ **Input validation** on all user-controlled data
✅ **Error messages** don't expose sensitive info
✅ **Timeout protection** prevents hanging requests
✅ **Rate limiting** via Supabase (10 req/second default)

---

## Monitoring & Observability

### Available Logs

1. **Edge Function Logs (Supabase Dashboard)**
   - Request/response times
   - Error messages
   - Custom console.log() statements

2. **Cron Job Logs (PostgreSQL)**
   - Execution start/end times
   - Success/failure status
   - Return messages

3. **Database Logs (SQL Audit)**
   - INSERT operations
   - Query performance
   - Connection pool status

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Success Rate | 100% | < 95% |
| Execution Time | < 30s | > 45s |
| Data Completeness | > 95% | < 90% |
| API Errors | 0 | > 2/week |
| Cron Execution | Daily at 6:00 | Missed 2+ days |

---

**Last Updated:** 2025-11-03
**Version:** 1.0
**Maintainer:** Backend Engineer Team
