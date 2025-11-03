# DunApp PWA - API Integration Implementation Plan

**Generated:** 2025-10-28
**Phase:** 4-9 (API Integration & Data Pipeline)
**Timeline:** 6-10 hours
**Priority:** HIGH

---

## Overview

This document provides a **step-by-step implementation plan** for deploying the API integration layer of the DunApp PWA. All Edge Functions are already implemented and production-ready. This plan focuses on configuration, deployment, and testing.

---

## Prerequisites

### Required Access
- [ ] Supabase project access (admin role)
- [ ] GitHub repository access
- [ ] Netlify account access (for frontend deployment)
- [ ] API keys for external services

### Required Tools
- [ ] Node.js 18+ installed
- [ ] Deno 1.37+ installed (for Edge Functions)
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Git configured

### API Keys Available
- [x] OpenWeatherMap: `YOUR_OPENWEATHER_API_KEY_HERE`
- [x] Meteoblue: `YOUR_METEOBLUE_API_KEY_HERE`
- [ ] VAPID keys (need to generate)

---

## Phase 4: Environment Configuration

**Estimated Time:** 1-2 hours
**Priority:** CRITICAL

### Step 4.1: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for Web Push notifications.

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Output:
# Public Key: BEl62iU... (save this)
# Private Key: xxxxx (save this - KEEP SECRET!)
```

**Save Output:**
```
VITE_VAPID_PUBLIC_KEY=BEl62iU...
VAPID_PRIVATE_KEY=xxxxx
```

---

### Step 4.2: Configure Supabase Environment Variables

Navigate to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

Add the following environment variables:

```bash
# API Keys
OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
METEOBLUE_API_KEY=YOUR_METEOBLUE_API_KEY_HERE
YR_NO_USER_AGENT=DunApp PWA/1.0 (contact@dunapp.hu)

# VAPID (for push notifications)
VITE_VAPID_PUBLIC_KEY={your-generated-public-key}
VAPID_PRIVATE_KEY={your-generated-private-key}
VAPID_SUBJECT=mailto:contact@dunapp.hu

# Supabase (auto-configured, verify only)
SUPABASE_URL=https://{project-ref}.supabase.co
SUPABASE_SERVICE_ROLE_KEY={service-role-key}
```

**Verification:**
```bash
# List all secrets
supabase secrets list

# Expected output:
# OPENWEATHER_API_KEY
# METEOBLUE_API_KEY
# YR_NO_USER_AGENT
# VITE_VAPID_PUBLIC_KEY
# VAPID_PRIVATE_KEY
# VAPID_SUBJECT
# SUPABASE_URL (auto)
# SUPABASE_SERVICE_ROLE_KEY (auto)
```

---

### Step 4.3: Update Frontend Environment Variables

Edit `.env` or `.env.production`:

```bash
# Supabase
VITE_SUPABASE_URL=https://{project-ref}.supabase.co
VITE_SUPABASE_ANON_KEY={anon-key}

# VAPID Public Key (same as in Supabase)
VITE_VAPID_PUBLIC_KEY={your-generated-public-key}

# App Config
VITE_APP_NAME=DunApp PWA
VITE_APP_VERSION=1.0.0
```

---

## Phase 5: Database Setup

**Estimated Time:** 30 minutes
**Priority:** CRITICAL

### Step 5.1: Run Migrations

```bash
# Connect to Supabase project
supabase link --project-ref {project-ref}

# Run all migrations
supabase db push

# Or run individually:
supabase db execute -f supabase/migrations/001_initial_schema.sql
supabase db execute -f supabase/migrations/002_seed_data.sql
supabase db execute -f supabase/migrations/003_rls_policies.sql
```

**Verification SQL:**
```sql
-- Check tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- drought_data
-- drought_locations
-- groundwater_data
-- groundwater_wells
-- meteorology_cities
-- meteorology_data
-- push_notification_logs
-- push_subscriptions
-- water_level_data
-- water_level_forecasts
-- water_level_stations

-- Check seed data
SELECT COUNT(*) as city_count FROM meteorology_cities; -- Expected: 4
SELECT COUNT(*) as station_count FROM water_level_stations; -- Expected: 3
SELECT COUNT(*) as location_count FROM drought_locations; -- Expected: 5
SELECT COUNT(*) as well_count FROM groundwater_wells; -- Expected: 15
```

---

### Step 5.2: Verify RLS Policies

```sql
-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true

-- Test RLS (as anonymous user)
SET ROLE anon;
SELECT * FROM meteorology_cities LIMIT 1; -- Should work (read-only)
INSERT INTO meteorology_cities (name) VALUES ('Test'); -- Should fail (no insert)
RESET ROLE;
```

---

## Phase 6: Edge Functions Deployment

**Estimated Time:** 1 hour
**Priority:** HIGH

### Step 6.1: Deploy All Functions

```bash
# Deploy fetch-meteorology
supabase functions deploy fetch-meteorology

# Deploy fetch-water-level
supabase functions deploy fetch-water-level

# Deploy fetch-drought
supabase functions deploy fetch-drought

# Deploy check-water-level-alert
supabase functions deploy check-water-level-alert
```

**Expected Output:**
```
Deploying function fetch-meteorology...
Function fetch-meteorology deployed successfully!
URL: https://{project-ref}.supabase.co/functions/v1/fetch-meteorology
```

---

### Step 6.2: Test Each Function Manually

#### Test fetch-meteorology
```bash
curl -X POST https://{project-ref}.supabase.co/functions/v1/fetch-meteorology \
  -H "Authorization: Bearer {anon-key}" \
  -H "Content-Type: application/json"

# Expected Response:
{
  "success": true,
  "timestamp": "2025-10-28T12:00:00Z",
  "summary": {
    "total": 4,
    "success": 4,
    "failed": 0
  },
  "results": [
    {
      "city": "Szekszárd",
      "status": "success",
      "source": "openweathermap",
      "temperature": 18.5
    },
    ...
  ]
}
```

#### Test fetch-water-level
```bash
curl -X POST https://{project-ref}.supabase.co/functions/v1/fetch-water-level \
  -H "Authorization: Bearer {anon-key}"

# Expected: 200 OK with 3 stations
```

#### Test fetch-drought
```bash
curl -X POST https://{project-ref}.supabase.co/functions/v1/fetch-drought \
  -H "Authorization: Bearer {anon-key}"

# Expected: 200 OK with 5 locations
```

#### Test check-water-level-alert
```bash
curl -X POST https://{project-ref}.supabase.co/functions/v1/check-water-level-alert \
  -H "Authorization: Bearer {anon-key}"

# Expected: 200 OK with threshold check result
```

---

### Step 6.3: Verify Database Inserts

```sql
-- Check meteorology data
SELECT
  mc.name as city,
  md.temperature,
  md.humidity,
  md.timestamp
FROM meteorology_data md
JOIN meteorology_cities mc ON md.city_id = mc.id
ORDER BY md.timestamp DESC
LIMIT 4;

-- Expected: 4 rows with recent timestamps

-- Check water level data
SELECT
  wls.station_name,
  wld.water_level_cm,
  wld.timestamp
FROM water_level_data wld
JOIN water_level_stations wls ON wld.station_id = wls.id
ORDER BY wld.timestamp DESC
LIMIT 3;

-- Expected: 3 rows with recent timestamps

-- Check drought data
SELECT
  dl.location_name,
  dd.drought_index,
  dd.soil_moisture_10cm,
  dd.timestamp
FROM drought_data dd
JOIN drought_locations dl ON dd.location_id = dl.id
ORDER BY dd.timestamp DESC
LIMIT 5;

-- Expected: 5 rows with recent timestamps
```

---

## Phase 7: Cron Jobs Setup

**Estimated Time:** 30 minutes
**Priority:** HIGH

### Step 7.1: Enable pg_cron Extension

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

---

### Step 7.2: Create Cron Jobs

```sql
-- 1. Fetch Meteorology Data (every 20 minutes)
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

-- 2. Fetch Water Level Data (every hour)
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

-- 3. Fetch Drought Data (daily at 6:00 AM)
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

-- 4. Check Water Level Alert (every 6 hours)
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

**IMPORTANT:** Replace `{project-ref}` and `{anon-key}` with your actual values!

---

### Step 7.3: Verify Cron Jobs

```sql
-- List all scheduled jobs
SELECT * FROM cron.job ORDER BY jobname;

-- Expected output:
-- jobname: fetch-meteorology, schedule: */20 * * * *
-- jobname: fetch-water-level, schedule: 0 * * * *
-- jobname: fetch-drought, schedule: 0 6 * * *
-- jobname: check-water-level-alert, schedule: 0 */6 * * *

-- Check job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

### Step 7.4: Manually Trigger First Run

```sql
-- Trigger fetch-meteorology immediately
SELECT cron.unschedule('fetch-meteorology');
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

-- Or run manually via curl (see Phase 6.2)
```

---

## Phase 8: Testing & Validation

**Estimated Time:** 2-3 hours
**Priority:** CRITICAL

### Step 8.1: Run Unit Tests

```bash
# Run Edge Function tests
npm run test:edge-functions

# Expected output:
# ✓ fetch-meteorology.test.ts (4 tests)
# ✓ fetch-water-level.test.ts (3 tests)
# ✓ fetch-drought.test.ts (3 tests)
# All tests passed!
```

---

### Step 8.2: Integration Testing

#### Test 1: End-to-End Meteorology Flow
```bash
# 1. Trigger function
curl -X POST https://{project-ref}.supabase.co/functions/v1/fetch-meteorology \
  -H "Authorization: Bearer {anon-key}"

# 2. Verify database insert
psql -c "SELECT COUNT(*) FROM meteorology_data WHERE timestamp > NOW() - INTERVAL '5 minutes';"
# Expected: 4 (one per city)

# 3. Check frontend data fetch
curl https://{project-ref}.supabase.co/rest/v1/meteorology_data?select=*&order=timestamp.desc&limit=4 \
  -H "apikey: {anon-key}"
# Expected: 4 recent records
```

#### Test 2: Water Level Alert Flow
```bash
# 1. Insert test data (water level >= 400 cm)
psql -c "INSERT INTO water_level_data (station_id, water_level_cm, timestamp)
         SELECT id, 415, NOW() FROM water_level_stations WHERE station_name = 'Mohács';"

# 2. Trigger alert function
curl -X POST https://{project-ref}.supabase.co/functions/v1/check-water-level-alert \
  -H "Authorization: Bearer {anon-key}"

# 3. Verify notification logs
psql -c "SELECT * FROM push_notification_logs ORDER BY created_at DESC LIMIT 1;"
# Expected: 1 row with status 'sent' or 'failed' (if no subscriptions)
```

---

### Step 8.3: Data Quality Validation

```sql
-- 1. Check for NULL values in critical fields
SELECT
  'meteorology_data' as table_name,
  COUNT(*) FILTER (WHERE temperature IS NULL) as null_temperature,
  COUNT(*) FILTER (WHERE humidity IS NULL) as null_humidity
FROM meteorology_data
WHERE timestamp > NOW() - INTERVAL '1 hour';

-- 2. Check for outliers
SELECT
  city_id,
  temperature,
  humidity
FROM meteorology_data
WHERE
  timestamp > NOW() - INTERVAL '1 hour'
  AND (
    temperature < -50 OR temperature > 50  -- Invalid temperature range
    OR humidity < 0 OR humidity > 100       -- Invalid humidity range
  );

-- Expected: 0 rows (no outliers)

-- 3. Check data freshness
SELECT
  'meteorology_data' as source,
  MAX(timestamp) as latest_timestamp,
  NOW() - MAX(timestamp) as age
FROM meteorology_data
UNION ALL
SELECT
  'water_level_data' as source,
  MAX(timestamp) as latest_timestamp,
  NOW() - MAX(timestamp) as age
FROM water_level_data
UNION ALL
SELECT
  'drought_data' as source,
  MAX(timestamp) as latest_timestamp,
  NOW() - MAX(timestamp) as age
FROM drought_data;

-- Expected: All ages < 24 hours
```

---

### Step 8.4: Error Handling Tests

#### Test API Failure Scenario
```bash
# 1. Set invalid API key (temporarily)
supabase secrets set OPENWEATHER_API_KEY=INVALID_KEY

# 2. Trigger function
curl -X POST https://{project-ref}.supabase.co/functions/v1/fetch-meteorology \
  -H "Authorization: Bearer {anon-key}"

# 3. Check response
# Expected: Fallback to Meteoblue or Yr.no (should still succeed)

# 4. Restore correct API key
supabase secrets set OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
```

#### Test Rate Limiting
```bash
# 1. Trigger function 5 times rapidly
for i in {1..5}; do
  curl -X POST https://{project-ref}.supabase.co/functions/v1/fetch-meteorology \
    -H "Authorization: Bearer {anon-key}" &
done
wait

# 2. Check logs for rate limit warnings
# Supabase Dashboard → Functions → fetch-meteorology → Logs
```

---

## Phase 9: Monitoring Setup

**Estimated Time:** 1 hour
**Priority:** MEDIUM

### Step 9.1: Create Monitoring Dashboard

**Supabase Dashboard:**
- Navigate to: Project → Functions → Logs
- Bookmark this page for regular monitoring

**Key Metrics to Track:**
- Invocation count (per function)
- Success rate (%)
- Average execution time (ms)
- Error rate (%)

---

### Step 9.2: Set Up Log Alerts (Optional)

Use Supabase webhooks or external monitoring service (e.g., Sentry, Datadog):

```javascript
// Example: Send critical errors to Slack
// In each Edge Function's error handler:

if (error.message.includes('CRITICAL')) {
  await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 DunApp Critical Error: ${error.message}`,
      channel: '#dunapp-alerts'
    })
  });
}
```

---

### Step 9.3: Create Health Check Endpoint

**Create new Edge Function:** `health-check`

```typescript
// supabase/functions/health-check/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const checks = {
    meteorology: false,
    waterLevel: false,
    drought: false,
    database: false
  };

  // Check meteorology data freshness
  const { data: meteoData } = await supabase
    .from('meteorology_data')
    .select('timestamp')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  checks.meteorology = meteoData &&
    (new Date().getTime() - new Date(meteoData.timestamp).getTime()) < 30 * 60 * 1000; // < 30 min

  // Check water level data freshness
  const { data: waterData } = await supabase
    .from('water_level_data')
    .select('timestamp')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  checks.waterLevel = waterData &&
    (new Date().getTime() - new Date(waterData.timestamp).getTime()) < 2 * 60 * 60 * 1000; // < 2 hours

  // Check drought data freshness
  const { data: droughtData } = await supabase
    .from('drought_data')
    .select('timestamp')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  checks.drought = droughtData &&
    (new Date().getTime() - new Date(droughtData.timestamp).getTime()) < 25 * 60 * 60 * 1000; // < 25 hours

  // Check database connection
  const { error: dbError } = await supabase.from('meteorology_cities').select('id').limit(1);
  checks.database = !dbError;

  const allHealthy = Object.values(checks).every(check => check === true);

  return new Response(
    JSON.stringify({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks
    }),
    {
      status: allHealthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
});
```

**Deploy and Schedule:**
```bash
# Deploy health check
supabase functions deploy health-check

# Schedule every 5 minutes
SELECT cron.schedule(
  'health-check',
  '*/5 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://{project-ref}.supabase.co/functions/v1/health-check',
    headers := '{"Authorization": "Bearer {anon-key}"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Phase 10: Groundwater Data Solution

**Estimated Time:** 2-4 hours
**Priority:** MEDIUM

### Option A: Manual CSV Upload (RECOMMENDED)

#### Step 10.1: Create CSV Upload Endpoint

**Create new Edge Function:** `upload-groundwater-csv`

```typescript
// supabase/functions/upload-groundwater-csv/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface CSVRow {
  date: string;
  waterLevelMeters: number;
  waterLevelMasl: number;
  temperature: number;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { well_code, csv_data } = await req.json();

  if (!well_code || !csv_data) {
    return new Response('Missing well_code or csv_data', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get well ID
  const { data: well, error: wellError } = await supabase
    .from('groundwater_wells')
    .select('id')
    .eq('well_code', well_code)
    .single();

  if (wellError || !well) {
    return new Response(`Well not found: ${well_code}`, { status: 404 });
  }

  // Parse CSV
  const lines = csv_data.trim().split('\n');
  const headers = lines[0].split(',');
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    rows.push({
      date: values[0],
      waterLevelMeters: parseFloat(values[1]),
      waterLevelMasl: parseFloat(values[2]),
      temperature: parseFloat(values[3])
    });
  }

  // Insert data
  const { error: insertError } = await supabase
    .from('groundwater_data')
    .upsert(
      rows.map(row => ({
        well_id: well.id,
        water_level_meters: row.waterLevelMeters,
        water_level_masl: row.waterLevelMasl,
        water_temperature: row.temperature,
        timestamp: row.date
      })),
      { onConflict: 'well_id,timestamp' }
    );

  if (insertError) {
    return new Response(insertError.message, { status: 500 });
  }

  return new Response(
    JSON.stringify({
      success: true,
      well_code,
      records_imported: rows.length
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Deploy:**
```bash
supabase functions deploy upload-groundwater-csv
```

---

#### Step 10.2: Build Admin UI for CSV Upload

**Create component:** `/src/components/Admin/GroundwaterCSVUpload.tsx`

```tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function GroundwaterCSVUpload() {
  const [wellCode, setWellCode] = useState('');
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!wellCode || !csvFile) {
      alert('Please select well and CSV file');
      return;
    }

    setUploading(true);

    const csvData = await csvFile.text();

    const { data, error } = await supabase.functions.invoke('upload-groundwater-csv', {
      body: { well_code: wellCode, csv_data: csvData }
    });

    setUploading(false);

    if (error) {
      alert(`Upload failed: ${error.message}`);
    } else {
      alert(`Upload successful! ${data.records_imported} records imported.`);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Upload Groundwater CSV</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Well Code</label>
          <input
            type="text"
            value={wellCode}
            onChange={(e) => setWellCode(e.target.value)}
            placeholder="e.g., 4576"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCSVFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>CSV Format:</p>
        <pre className="bg-gray-100 p-2 rounded mt-2">
{`Dátum,Talajvízszint (m),Talajvízszint (mBf),Hőmérséklet (°C)
2024-10-24,-2.34,98.66,14.5
2024-10-23,-2.36,98.64,14.3`}
        </pre>
      </div>
    </div>
  );
}
```

---

#### Step 10.3: Document CSV Upload Process

**Create user guide:** `/docs/GROUNDWATER_CSV_UPLOAD.md`

```markdown
# Groundwater Data CSV Upload Guide

## Step 1: Download CSV from vmservice.vizugy.hu

1. Go to https://vmservice.vizugy.hu/
2. Click "Adatlekérdezés" → "Talajvíz adatok"
3. Select "Kút azonosító szerinti keresés"
4. Enter well code (e.g., 4576 for Sátorhely)
5. Set date range (last 60 days)
6. Click "Export CSV"
7. Save file to your computer

## Step 2: Upload CSV to DunApp

1. Log in to DunApp Admin Panel
2. Navigate to "Data Management" → "Groundwater Data"
3. Click "Upload CSV"
4. Enter well code (same as in Step 1)
5. Select CSV file
6. Click "Upload"
7. Wait for confirmation message

## Step 3: Verify Data

1. Go to Drought Module
2. Select well from dropdown
3. Check chart for new data points
4. Verify date range and values

## Troubleshooting

- **Error: Well not found** → Check well code spelling
- **Error: Invalid CSV format** → Ensure CSV matches expected format
- **Error: Duplicate data** → Data already exists (safe to ignore)
```

---

## Success Criteria

### Phase 4: Environment Configuration
- [ ] All API keys configured in Supabase
- [ ] VAPID keys generated and set
- [ ] Frontend environment variables updated

### Phase 5: Database Setup
- [ ] All migrations run successfully
- [ ] Seed data verified (4 cities, 3 stations, 5 locations, 15 wells)
- [ ] RLS policies active

### Phase 6: Edge Functions Deployment
- [ ] All 4 functions deployed
- [ ] Manual tests passing
- [ ] Database inserts verified

### Phase 7: Cron Jobs Setup
- [ ] All 4 cron jobs created
- [ ] Jobs appearing in cron.job table
- [ ] First runs triggered manually

### Phase 8: Testing & Validation
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Data quality checks passing
- [ ] Error handling verified

### Phase 9: Monitoring Setup
- [ ] Monitoring dashboard bookmarked
- [ ] Health check endpoint deployed
- [ ] Log alerts configured (optional)

### Phase 10: Groundwater Data Solution
- [ ] CSV upload endpoint deployed
- [ ] Admin UI implemented
- [ ] User guide documented
- [ ] Test CSV uploaded successfully

---

## Rollback Plan

### If Edge Function Fails
```sql
-- Unschedule cron job
SELECT cron.unschedule('fetch-meteorology');

-- Check logs
SELECT * FROM cron.job_run_details
WHERE jobname = 'fetch-meteorology'
ORDER BY start_time DESC
LIMIT 10;

-- Re-deploy function
supabase functions deploy fetch-meteorology

-- Re-schedule cron job
-- (see Phase 7.2)
```

### If Database Migration Fails
```bash
# Check migration status
supabase migration list

# Rollback last migration
supabase migration revert

# Fix migration file
# Re-run migration
supabase db push
```

### If Environment Variable Issue
```bash
# List current secrets
supabase secrets list

# Unset wrong secret
supabase secrets unset OPENWEATHER_API_KEY

# Set correct secret
supabase secrets set OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
```

---

## Post-Deployment Checklist

### Day 1: Initial Monitoring
- [ ] Check all cron jobs ran successfully
- [ ] Verify data freshness in all tables
- [ ] Monitor error logs
- [ ] Test frontend data display

### Week 1: Continuous Monitoring
- [ ] Review API usage (stay within rate limits)
- [ ] Check data quality (no outliers, no gaps)
- [ ] Monitor execution times (optimize if > 10s)
- [ ] Collect user feedback

### Month 1: Optimization
- [ ] Analyze API fallback usage (primary vs secondary sources)
- [ ] Review cron schedules (adjust if needed)
- [ ] Optimize database queries (add indexes if slow)
- [ ] Implement groundwater CSV uploads (Phase 10)

---

## Support & Troubleshooting

### Common Issues

**Issue: Function timeout (> 10s)**
- Solution: Optimize API calls, increase timeout limit

**Issue: Rate limit exceeded (429)**
- Solution: Reduce cron frequency, upgrade API plan

**Issue: Database connection error**
- Solution: Check Supabase status, verify credentials

**Issue: Scraping failed (HTML parsing)**
- Solution: Check website structure, update selectors

**Issue: Push notification failed (410)**
- Solution: Expired subscription, automatically deleted

### Useful Commands

```bash
# Check Supabase project status
supabase status

# View function logs
supabase functions logs fetch-meteorology

# Test function locally
supabase functions serve fetch-meteorology

# Check database connection
supabase db remote ls
```

---

## Conclusion

This implementation plan provides a **step-by-step guide** to deploy the DunApp PWA API integration layer. Follow each phase sequentially, verify success criteria, and monitor continuously for optimal performance.

**Estimated Total Time:** 6-10 hours
**Confidence Level:** HIGH (all code is production-ready)

**Next Steps After Deployment:**
1. Monitor data quality for 1 week
2. Implement groundwater CSV upload
3. Optimize cron schedules based on usage
4. Collect user feedback and iterate

---

**Document Version:** 1.0
**Generated:** 2025-10-28
**Author:** Claude Code (Data Engineer Agent)
**Project:** DunApp PWA
