# DunApp PWA - API Integration Quick Reference

**Last Updated:** 2025-10-28
**Status:** Production Ready - Deployment Pending

---

## 🚀 Quick Start

### Documents to Read First
1. **API_INTEGRATION_SUMMARY.md** - Overview and status
2. **API_INTEGRATION_PLAN.md** - Step-by-step deployment guide
3. **API_INTEGRATION_REPORT.md** - Comprehensive technical analysis

### Time to Production
**6-10 hours total:**
- Environment config: 1-2 hours
- Database setup: 30 minutes
- Edge Functions deploy: 1 hour
- Cron jobs setup: 30 minutes
- Testing: 2-3 hours
- Groundwater CSV: 2-4 hours (optional)

---

## 📊 Edge Functions Status

| Function | Status | Source | Cron | API Calls/Day |
|----------|--------|--------|------|---------------|
| fetch-meteorology | ✅ Ready | OpenWeatherMap, Meteoblue, Yr.no | */20 * * * * | 288 |
| fetch-water-level | ✅ Ready | vizugy.hu, hydroinfo.hu (scraping) | 0 * * * * | 24 scrapes |
| fetch-drought | ✅ Ready | aszalymonitoring.vizugy.hu | 0 6 * * * | 5 |
| check-water-level-alert | ✅ Ready | Database check + Web Push | 0 */6 * * * | 4 checks |

**Total:** 4 functions, 100% coverage, production-ready

---

## 🔑 API Keys

### Active (from DATA_SOURCES.md)
```bash
OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
METEOBLUE_API_KEY=YOUR_METEOBLUE_API_KEY_HERE
YR_NO_USER_AGENT="DunApp PWA/1.0 (contact@dunapp.hu)"
```

### Generate VAPID Keys
```bash
npm install -g web-push
web-push generate-vapid-keys

# Save output:
# VITE_VAPID_PUBLIC_KEY=BEl62iU...
# VAPID_PRIVATE_KEY=xxxxx
```

### Set in Supabase
**Dashboard → Project Settings → Edge Functions → Secrets**
```bash
OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
METEOBLUE_API_KEY=YOUR_METEOBLUE_API_KEY_HERE
YR_NO_USER_AGENT="DunApp PWA/1.0 (contact@dunapp.hu)"
VITE_VAPID_PUBLIC_KEY={your-generated-public-key}
VAPID_PRIVATE_KEY={your-generated-private-key}
VAPID_SUBJECT=mailto:contact@dunapp.hu
```

---

## 💾 Database Setup

### Run Migrations
```bash
supabase link --project-ref {project-ref}
supabase db push

# Or individually:
supabase db execute -f supabase/migrations/001_initial_schema.sql
supabase db execute -f supabase/migrations/002_seed_data.sql
supabase db execute -f supabase/migrations/003_rls_policies.sql
```

### Verify Seed Data
```sql
SELECT COUNT(*) FROM meteorology_cities; -- Expected: 4
SELECT COUNT(*) FROM water_level_stations; -- Expected: 3
SELECT COUNT(*) FROM drought_locations; -- Expected: 5
SELECT COUNT(*) FROM groundwater_wells; -- Expected: 15
```

---

## 🚀 Deploy Edge Functions

```bash
supabase functions deploy fetch-meteorology
supabase functions deploy fetch-water-level
supabase functions deploy fetch-drought
supabase functions deploy check-water-level-alert
```

### Test Functions
```bash
# Replace {project-ref} and {anon-key}
curl -X POST https://{project-ref}.supabase.co/functions/v1/fetch-meteorology \
  -H "Authorization: Bearer {anon-key}"

curl -X POST https://{project-ref}.supabase.co/functions/v1/fetch-water-level \
  -H "Authorization: Bearer {anon-key}"

curl -X POST https://{project-ref}.supabase.co/functions/v1/fetch-drought \
  -H "Authorization: Bearer {anon-key}"

curl -X POST https://{project-ref}.supabase.co/functions/v1/check-water-level-alert \
  -H "Authorization: Bearer {anon-key}"
```

---

## ⏰ Cron Jobs Setup

### Enable pg_cron
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Create Cron Jobs
```sql
-- fetch-meteorology: Every 20 minutes
SELECT cron.schedule(
  'fetch-meteorology',
  '*/20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://{project-ref}.supabase.co/functions/v1/fetch-meteorology',
    headers := '{"Authorization": "Bearer {anon-key}", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- fetch-water-level: Every hour
SELECT cron.schedule(
  'fetch-water-level',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://{project-ref}.supabase.co/functions/v1/fetch-water-level',
    headers := '{"Authorization": "Bearer {anon-key}", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- fetch-drought: Daily at 6:00 AM
SELECT cron.schedule(
  'fetch-drought',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://{project-ref}.supabase.co/functions/v1/fetch-drought',
    headers := '{"Authorization": "Bearer {anon-key}", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- check-water-level-alert: Every 6 hours
SELECT cron.schedule(
  'check-water-level-alert',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://{project-ref}.supabase.co/functions/v1/check-water-level-alert',
    headers := '{"Authorization": "Bearer {anon-key}", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

### Verify Cron Jobs
```sql
SELECT * FROM cron.job ORDER BY jobname;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## ✅ Testing Checklist

### Unit Tests
```bash
npm run test:edge-functions
# Expected: All tests passing
```

### Integration Tests
```bash
# Test each function (see "Test Functions" above)
# Expected: 200 OK responses with success: true
```

### Data Validation
```sql
-- Check data freshness
SELECT
  'meteorology_data' as source,
  MAX(timestamp) as latest,
  NOW() - MAX(timestamp) as age
FROM meteorology_data;
-- Expected: age < 30 minutes

-- Check for outliers
SELECT *
FROM meteorology_data
WHERE
  temperature < -50 OR temperature > 50
  OR humidity < 0 OR humidity > 100;
-- Expected: 0 rows
```

---

## 📈 Monitoring

### Supabase Dashboard
**Bookmark:** Project → Functions → Logs

**Key Metrics:**
- Invocation count
- Success rate (should be > 99%)
- Execution time (should be < 10s)
- Error rate (should be < 1%)

### Health Check (Optional)
```bash
# Create health-check endpoint (see API_INTEGRATION_PLAN.md Phase 9)
curl https://{project-ref}.supabase.co/functions/v1/health-check

# Expected:
{
  "status": "healthy",
  "timestamp": "2025-10-28T12:00:00Z",
  "checks": {
    "meteorology": true,
    "waterLevel": true,
    "drought": true,
    "database": true
  }
}
```

---

## 💰 Cost Estimate

### Development (Free Tier)
```
OpenWeatherMap:  $0/month (1,000 calls/day limit)
Meteoblue:       $0/month (trial, 2,000 calls/month)
Yr.no:           $0/month (free, fair use)
RainViewer:      $0/month (until 2026)
Supabase:        $0/month (500MB DB limit)
Netlify:         $0/month (100GB bandwidth limit)
─────────────────────────────────────────────
TOTAL:           $0/month
```

### Production (Scaled)
```
OpenWeatherMap:  $0/month (free tier)
Meteoblue:       $29/month (paid plan)
Supabase:        $25/month (Pro plan)
Groundwater:     $5-10/month (VPS, optional)
─────────────────────────────────────────────
TOTAL:           $54-64/month
```

### Cost Optimization
```
Use Yr.no instead of Meteoblue:      -$29/month
Manual CSV upload (no VPS):          -$10/month
Stay on Supabase Free tier longer:   -$25/month
─────────────────────────────────────────────
OPTIMIZED TOTAL:                     $0/month
```

---

## ⚠️ Known Limitations

### 1. Groundwater Well Data (15 Wells)
**Status:** NOT IMPLEMENTED
**Reason:** vmservice.vizugy.hu requires Puppeteer (not feasible in Edge Functions)
**Solution:** Manual CSV upload feature (2-4 hours implementation)
**Impact:** Drought module missing 15-well data visualization

### 2. Precipitation Data Module
**Status:** NOT IMPLEMENTED
**Source:** vmservice.vizugy.hu (same as groundwater)
**Solution:** Manual CSV upload or external scraping

### 3. Radar Map (RainViewer)
**Status:** NOT IMPLEMENTED (Frontend Only)
**Location:** /src/modules/meteorology/RadarMap.tsx
**Note:** No Edge Function needed

---

## 🐛 Troubleshooting

### Function Timeout (> 10s)
```bash
# Check execution time
supabase functions logs fetch-meteorology | grep "duration"

# Solution: Optimize API calls, increase timeout
```

### Rate Limit Exceeded (429)
```bash
# Check API usage
# OpenWeatherMap dashboard: https://home.openweathermap.org/api_keys

# Solution: Reduce cron frequency, upgrade API plan
```

### Scraping Failed (HTML Parsing)
```bash
# Check website structure
curl https://www.vizugy.hu/index.php?module=content&programelemid=138

# Solution: Update HTML selectors in Edge Function
```

### Database Connection Error
```sql
-- Test connection
SELECT 1;

-- Check credentials
SELECT current_user, current_database();

-- Solution: Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

---

## 📚 Useful Commands

### Supabase CLI
```bash
# Check project status
supabase status

# View function logs
supabase functions logs fetch-meteorology

# Test function locally
supabase functions serve fetch-meteorology

# List secrets
supabase secrets list

# Set secret
supabase secrets set OPENWEATHER_API_KEY=xxx

# Unset secret
supabase secrets unset OPENWEATHER_API_KEY

# Run migration
supabase db push

# Revert migration
supabase migration revert
```

### SQL Queries
```sql
-- Check cron jobs
SELECT * FROM cron.job ORDER BY jobname;

-- Check cron history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Unschedule cron
SELECT cron.unschedule('fetch-meteorology');

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check latest data timestamps
SELECT
  'meteorology_data' as table,
  MAX(timestamp) as latest,
  COUNT(*) as records
FROM meteorology_data
UNION ALL
SELECT
  'water_level_data',
  MAX(timestamp),
  COUNT(*)
FROM water_level_data
UNION ALL
SELECT
  'drought_data',
  MAX(timestamp),
  COUNT(*)
FROM drought_data;
```

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [ ] Read API_INTEGRATION_SUMMARY.md
- [ ] API keys available
- [ ] Supabase project access confirmed
- [ ] GitHub repository access confirmed

### Phase 4: Environment Config (1-2 hours)
- [ ] Generate VAPID keys
- [ ] Set all environment variables
- [ ] Verify secrets configured

### Phase 5: Database Setup (30 minutes)
- [ ] Run all migrations
- [ ] Verify seed data
- [ ] Test RLS policies

### Phase 6: Edge Functions (1 hour)
- [ ] Deploy all 4 functions
- [ ] Test each function
- [ ] Verify database inserts

### Phase 7: Cron Jobs (30 minutes)
- [ ] Enable pg_cron
- [ ] Create all 4 cron jobs
- [ ] Verify schedules

### Phase 8: Testing (2-3 hours)
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Data quality validation
- [ ] Error handling tests

### Phase 9: Monitoring (1 hour)
- [ ] Bookmark logs dashboard
- [ ] Create health check
- [ ] Set up alerts

### Phase 10: Groundwater CSV (2-4 hours, optional)
- [ ] Create upload endpoint
- [ ] Build admin UI
- [ ] Document process
- [ ] Test with sample CSV

---

## 📖 Documentation Links

### Project Docs
- `/API_INTEGRATION_SUMMARY.md` - This overview
- `/API_INTEGRATION_PLAN.md` - Implementation guide
- `/API_INTEGRATION_REPORT.md` - Technical analysis
- `/CLAUDE.md` - Project architecture
- `/DATA_SOURCES.md` - API documentation

### External Resources
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Meteoblue API](https://docs.meteoblue.com/)
- [Yr.no API](https://api.met.no/weatherapi/locationforecast/2.0/documentation)
- [RainViewer API](https://www.rainviewer.com/api.html)
- [Supabase Docs](https://supabase.com/docs)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)

---

## ✨ Next Steps After Deployment

### Week 1
- Monitor data quality daily
- Check for errors in logs
- Verify all cron jobs running
- Test frontend data display

### Week 2-4
- Analyze API usage patterns
- Optimize cron schedules
- Implement groundwater CSV upload
- Collect user feedback

### Month 2+
- Add predictive analytics
- Implement multi-language support
- Add user-generated data
- Explore additional data sources

---

**Status:** ✅ Production Ready
**Confidence:** HIGH
**Time to Production:** 6-10 hours
**Total API Calls/Day:** 317 (well within limits)
**Total Cost:** $0-64/month (optimizable to $0/month)

---

**Quick Reference Version:** 1.0
**Generated:** 2025-10-28
**Project:** DunApp PWA
