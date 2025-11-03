# Fetch Drought Data - Quick Start Guide

**5-Minute Setup** for local testing

---

## Prerequisites

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Ensure Docker is running
docker --version
```

---

## Step 1: Start Supabase (2 min)

```bash
cd /Volumes/Endre_Samsung1T/codeing/dunapp-pwa

# Start local Supabase
supabase start
```

**Output:**
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 2: Apply Migrations (1 min)

```bash
# Apply all database migrations
supabase db reset
```

**Verify:**
```bash
supabase db connect
# Then run: SELECT COUNT(*) FROM drought_locations;
# Expected: 5
```

---

## Step 3: Create .env.local (30 sec)

```bash
cat > .env.local << EOF
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF
```

Replace `service_role_key` with actual key from Step 1 output.

---

## Step 4: Serve Edge Function (30 sec)

```bash
supabase functions serve fetch-drought --env-file .env.local
```

**Output:**
```
Serving functions on http://localhost:54321/functions/v1/
fetch-drought: http://localhost:54321/functions/v1/fetch-drought
```

---

## Step 5: Test (1 min)

**Terminal 2:**
```bash
# Test function
curl -X POST http://localhost:54321/functions/v1/fetch-drought \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-03T10:00:00.000Z",
  "duration": 12453,
  "summary": {
    "total": 5,
    "success": 5,
    "failed": 0
  },
  "results": [
    {
      "location": "Katymár",
      "status": "success",
      "station": "Katymár monitoring állomás",
      "distance": 1200,
      "droughtIndex": 2.5
    },
    ...
  ]
}
```

---

## Step 6: Verify Database (30 sec)

```bash
supabase db connect
```

**SQL:**
```sql
SELECT
  dl.location_name,
  dd.drought_index,
  dd.soil_moisture_20cm,
  dd.timestamp
FROM drought_data dd
JOIN drought_locations dl ON dd.location_id = dl.id
ORDER BY dd.timestamp DESC
LIMIT 5;
```

**Expected:** 5 rows

---

## 🎉 Success!

You now have:
- ✅ Local Supabase running
- ✅ Database with 5 locations
- ✅ Edge Function fetching real data
- ✅ 5 drought records in database

---

## Production Deployment (5 min)

```bash
# 1. Login to Supabase
supabase login

# 2. Link project
supabase link --project-ref [your-project-ref]

# 3. Push database migrations
supabase db push

# 4. Deploy Edge Function
supabase functions deploy fetch-drought

# 5. Test production
curl -X POST https://[project-ref].supabase.co/functions/v1/fetch-drought \
  -H "Authorization: Bearer [service-role-key]"
```

---

## Troubleshooting

### "No station found near {location}"

**Fix:** Check location name spelling in `DROUGHT_LOCATIONS` array.

### "Missing environment variables"

**Fix:** Ensure `.env.local` exists with correct keys.

### "Database connection error"

**Fix:** Run `supabase start` again.

### Timeout errors

**Fix:** Increase `REQUEST_TIMEOUT` from 10s to 30s in code.

---

## Next Steps

- Read **TESTING.md** for comprehensive testing guide
- Read **DEPLOYMENT.md** for production deployment
- Read **IMPLEMENTATION_PLAN.md** for architecture details

---

**Need Help?**
- Check logs: `supabase functions logs fetch-drought`
- View database: Open http://localhost:54323 (Supabase Studio)
- Debug: Add `console.log()` statements in code

**Ready for production?**
- Follow **DEPLOYMENT.md** checklist
- Monitor for 7 days
- Set up alerts (optional)
