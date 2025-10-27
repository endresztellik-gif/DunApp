# Supabase Setup Guide - DunApp PWA

> Complete guide to setting up Supabase backend for the DunApp PWA project

**Last Updated:** 2025-10-28
**Status:** Production Ready
**Estimated Setup Time:** 20-30 minutes

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Option 1: Create New Project](#option-1-create-new-project)
4. [Option 2: Link Existing Project](#option-2-link-existing-project)
5. [Option 3: Local Development](#option-3-local-development)
6. [Database Schema Overview](#database-schema-overview)
7. [Edge Functions Overview](#edge-functions-overview)
8. [Environment Variables Setup](#environment-variables-setup)
9. [Using the Setup Script](#using-the-setup-script)
10. [Manual Setup Steps](#manual-setup-steps)
11. [Testing Your Setup](#testing-your-setup)
12. [Troubleshooting](#troubleshooting)
13. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

```bash
# 1. Node.js 18+ (check version)
node --version  # Should be v18.0.0 or higher

# 2. Install Supabase CLI globally
npm install -g supabase

# Verify installation
supabase --version  # Should show v1.x.x
```

### Required Accounts

- **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
- **GitHub Account**: For version control (already have one)
- **API Keys** (optional for testing):
  - OpenWeatherMap: [openweathermap.org/api](https://openweathermap.org/api)
  - Meteoblue: [meteoblue.com/en/weather-api](https://www.meteoblue.com/en/weather-api)

### System Requirements

- **Operating System**: macOS, Linux, or Windows (WSL2)
- **RAM**: Minimum 4GB
- **Storage**: 500MB free space
- **Internet**: Stable connection required

---

## Quick Start

Choose one of three setup options based on your needs:

| Option | Use Case | Time | Difficulty |
|--------|----------|------|------------|
| **Option 1: New Project** | Starting fresh | 20-30 min | Easy |
| **Option 2: Link Existing** | Already have a project | 10-15 min | Easy |
| **Option 3: Local Dev** | Development without cloud | 5-10 min | Medium |

💡 **Recommended for beginners:** Start with **Option 1** (Create New Project)

---

## Option 1: Create New Project

### Step 1: Login to Supabase

```bash
# Navigate to project directory
cd /Volumes/Endre_Samsung1T/codeing/dunapp-pwa

# Login to Supabase (opens browser)
supabase login
```

This will open your browser for authentication. Follow the prompts to authorize the CLI.

### Step 2: Create New Project

**Two ways to create a project:**

#### A. Using the CLI (Recommended)

```bash
# Run the setup script in interactive mode
./scripts/setup-supabase.sh --new-project
```

The script will prompt you for:
- **Project name**: `dunapp-pwa` (or your preferred name)
- **Database password**: Minimum 12 characters (save this!)
- **Region**: `eu-central-1` (closest to Hungary)

#### B. Using the Supabase Dashboard (Alternative)

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in details:
   - **Name**: `dunapp-pwa`
   - **Database Password**: (strong password, save it!)
   - **Region**: Europe (Frankfurt) - `eu-central-1`
   - **Pricing Plan**: Free tier (sufficient for development)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project initialization

### Step 3: Get Project Credentials

After project creation, get your credentials:

1. Go to **Project Settings** → **API**
2. Copy the following values:

```
Project URL:    https://xxxxxxxxxxxxx.supabase.co
Project Ref:    xxxxxxxxxxxxx
Anon Key:       eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Key:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**: Keep the Service Role Key secret! Never commit it to Git.

### Step 4: Create .env File

```bash
# Copy the example file
cp .env.example .env

# Edit with your credentials
nano .env
```

Update these values in `.env`:

```env
# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Link Local Project

```bash
# Link your local project to the Supabase project
supabase link --project-ref xxxxxxxxxxxxx

# Verify connection
supabase projects list
```

### Step 6: Run Database Migrations

```bash
# Push all migrations to the remote database
supabase db push

# Verify migrations
supabase migration list
```

You should see:
```
✅ 001_initial_schema.sql
✅ 002_seed_data.sql
✅ 003_rls_policies.sql
```

### Step 7: Deploy Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy fetch-meteorology --no-verify-jwt
supabase functions deploy fetch-water-level --no-verify-jwt
supabase functions deploy fetch-drought --no-verify-jwt
supabase functions deploy check-water-level-alert --no-verify-jwt

# Verify deployment
supabase functions list
```

### Step 8: Set Function Secrets

```bash
# Set API keys for Edge Functions
supabase secrets set OPENWEATHER_API_KEY=your_actual_key_here
supabase secrets set METEOBLUE_API_KEY=your_actual_key_here
supabase secrets set YR_NO_USER_AGENT="DunApp PWA/1.0 (your-email@example.com)"

# Generate and set VAPID keys for push notifications
npx web-push generate-vapid-keys

# Copy the keys and set them
supabase secrets set VAPID_PUBLIC_KEY=your_public_key
supabase secrets set VAPID_PRIVATE_KEY=your_private_key
supabase secrets set VAPID_SUBJECT="mailto:your-email@example.com"

# Verify secrets (values will be hidden)
supabase secrets list
```

### Step 9: Verify Setup

```bash
# Check database tables
supabase db diff

# Test Edge Function
curl -X POST \
  "https://xxxxxxxxxxxxx.supabase.co/functions/v1/fetch-meteorology" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

✅ **Setup Complete!** Proceed to [Testing Your Setup](#testing-your-setup)

---

## Option 2: Link Existing Project

Already have a Supabase project? Link it to your local development environment.

### Step 1: Get Project Reference

```bash
# Login to Supabase
supabase login

# List your projects
supabase projects list
```

Output example:
```
┌─────────────┬──────────────────┬─────────────────────┐
│ NAME        │ PROJECT REF      │ ORGANIZATION        │
├─────────────┼──────────────────┼─────────────────────┤
│ dunapp-pwa  │ xxxxxxxxxxxxx    │ Personal            │
└─────────────┴──────────────────┴─────────────────────┘
```

### Step 2: Link Project

```bash
# Link using project reference
supabase link --project-ref xxxxxxxxxxxxx

# Verify link
supabase projects list
```

### Step 3: Update Local Schema (Optional)

If your remote database already has data:

```bash
# Pull remote schema to local
supabase db pull

# This creates migration files from your remote database
```

If you want to push your local migrations:

```bash
# Push local migrations to remote
supabase db push
```

### Step 4: Update Edge Functions

```bash
# Run the update script
./scripts/setup-supabase.sh --update
```

Or manually:

```bash
# Deploy all functions
supabase functions deploy fetch-meteorology --no-verify-jwt
supabase functions deploy fetch-water-level --no-verify-jwt
supabase functions deploy fetch-drought --no-verify-jwt
supabase functions deploy check-water-level-alert --no-verify-jwt
```

✅ **Link Complete!** Proceed to [Testing Your Setup](#testing-your-setup)

---

## Option 3: Local Development

Use Supabase locally with Docker (no cloud project needed).

### Prerequisites

```bash
# Install Docker Desktop
# macOS: https://docs.docker.com/desktop/install/mac-install/
# Verify Docker is running
docker --version
```

### Step 1: Initialize Local Supabase

```bash
# Start local Supabase (first time)
supabase init

# Start Docker containers
supabase start
```

This will:
- Download Supabase Docker images (~2GB)
- Start PostgreSQL, PostgREST, GoTrue, and other services
- Run all migrations automatically
- Print local credentials

Output example:
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Configure Local Environment

```bash
# Create .env.local for local development
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Use mock data for APIs
USE_MOCK_DATA=true
EOF
```

### Step 3: Access Supabase Studio

Open [http://localhost:54323](http://localhost:54323) in your browser.

You'll see:
- **Table Editor**: View/edit data
- **SQL Editor**: Run queries
- **Database**: Schema explorer
- **Functions**: Edge Functions management

### Step 4: Run Edge Functions Locally

```bash
# Serve a specific function locally
supabase functions serve fetch-meteorology --no-verify-jwt

# Test locally
curl -X POST http://localhost:54321/functions/v1/fetch-meteorology
```

### Step 5: Reset Local Database (if needed)

```bash
# Stop all containers
supabase stop

# Reset database (clears all data)
supabase db reset

# Restart
supabase start
```

### Managing Local Supabase

```bash
# Stop containers (data persists)
supabase stop

# Start containers
supabase start

# View status
supabase status

# View logs
supabase logs
```

✅ **Local Setup Complete!** No API keys needed for development.

---

## Database Schema Overview

The DunApp PWA uses **3 migration files** to set up the complete database schema.

### Migration 001: Initial Schema

**File:** `supabase/migrations/001_initial_schema.sql`

Creates **13 tables** for the 3 modules:

#### Meteorology Module (4 cities)
- `meteorology_cities` - 4 cities (Szekszárd, Baja, Dunaszekcső, Mohács)
- `meteorology_data` - Weather data cache
- `precipitation_data` - Daily/weekly/yearly precipitation

#### Water Level Module (3 stations)
- `water_level_stations` - 3 Danube stations (Baja, Mohács, Nagybajcs)
- `water_level_data` - Current water levels
- `water_level_forecasts` - 5-day forecasts

#### Drought Module (5 locations + 15 wells)
- `drought_locations` - 5 monitoring stations
- `drought_data` - Soil moisture and drought indices
- `groundwater_wells` - 15 groundwater wells
- `groundwater_data` - Well measurements

#### Push Notifications
- `push_subscriptions` - Web Push subscriptions
- `push_notification_logs` - Notification history

#### Cache
- `cache` - Generic key-value cache

**Key Features:**
- UUID primary keys
- Automatic timestamp triggers (`created_at`, `updated_at`)
- Foreign key relationships
- Indexes for performance
- Table comments for documentation

### Migration 002: Seed Data

**File:** `supabase/migrations/002_seed_data.sql`

Seeds **27 locations**:
- ✅ 4 meteorology cities
- ✅ 3 water level stations
- ✅ 5 drought monitoring locations
- ✅ 15 groundwater wells

**Includes:**
- Real coordinates (latitude/longitude)
- Population data
- Water level thresholds (LNV, KKV, NV)
- Well codes and depths
- Verification queries

### Migration 003: RLS Policies

**File:** `supabase/migrations/003_rls_policies.sql`

Implements **Row Level Security (RLS)**:

- **Public Read Access**: All users can read data
- **Service Role Write**: Only Edge Functions can write
- **Security**: No anonymous writes, prevents data pollution

**Policy Structure:**
```sql
-- Example policy
CREATE POLICY "meteorology_data_public_read"
ON meteorology_data
FOR SELECT
USING (true);

CREATE POLICY "meteorology_data_service_write"
ON meteorology_data
FOR ALL
USING (auth.role() = 'service_role');
```

### Database Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    METEOROLOGY MODULE                        │
├─────────────────────────────────────────────────────────────┤
│ meteorology_cities (4)                                       │
│   ↓ (1:N)                                                   │
│ meteorology_data (weather cache)                            │
│ precipitation_data (daily rainfall)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   WATER LEVEL MODULE                         │
├─────────────────────────────────────────────────────────────┤
│ water_level_stations (3)                                     │
│   ↓ (1:N)                                                   │
│ water_level_data (measurements)                             │
│ water_level_forecasts (5-day)                               │
│   ↓ (1:N)                                                   │
│ push_subscriptions                                          │
│ push_notification_logs                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DROUGHT MODULE                            │
├─────────────────────────────────────────────────────────────┤
│ drought_locations (5)                                        │
│   ↓ (1:N)                                                   │
│ drought_data (soil moisture)                                │
│                                                              │
│ groundwater_wells (15)                                       │
│   ↓ (1:N)                                                   │
│ groundwater_data (well measurements)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Edge Functions Overview

DunApp PWA uses **4 Supabase Edge Functions** (Deno-based serverless functions).

### 1. fetch-meteorology

**Purpose:** Fetch weather data for all 4 cities

**Path:** `supabase/functions/fetch-meteorology/index.ts`

**Data Sources:**
- 🌤️ OpenWeatherMap (primary)
- 🌦️ Meteoblue (fallback)
- ☁️ Yr.no (fallback)

**Schedule:** Every 20 minutes (cron job)

**API Keys Required:**
- `OPENWEATHER_API_KEY`
- `METEOBLUE_API_KEY`
- `YR_NO_USER_AGENT`

**What it does:**
1. Fetches weather data for each city
2. Stores in `meteorology_data` table
3. Uses retry logic (3 attempts)
4. Falls back to alternative APIs on failure
5. Logs errors for monitoring

**Test:**
```bash
curl -X POST \
  "https://xxxxx.supabase.co/functions/v1/fetch-meteorology" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 2. fetch-water-level

**Purpose:** Scrape water level data from hydroinfo.hu

**Path:** `supabase/functions/fetch-water-level/index.ts`

**Data Sources:**
- 🌊 vizugy.hu (web scraping)
- 📊 hydroinfo.hu (API + scraping)

**Schedule:** Every 6 hours (cron job)

**API Keys Required:** None (web scraping)

**What it does:**
1. Scrapes water levels from vizugy.hu
2. Extracts data for Baja, Mohács, Nagybajcs
3. Stores in `water_level_data` table
4. Fetches 5-day forecasts
5. Stores forecasts in `water_level_forecasts` table

**Test:**
```bash
curl -X POST \
  "https://xxxxx.supabase.co/functions/v1/fetch-water-level" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 3. fetch-drought

**Purpose:** Fetch drought monitoring data

**Path:** `supabase/functions/fetch-drought/index.ts`

**Data Sources:**
- 🏜️ aszalymonitoring.vizugy.hu (API)
- 💧 OVF soil moisture data
- 🕳️ HUGEO groundwater data

**Schedule:** Daily at 3:00 AM (cron job)

**API Keys Required:** None (public APIs)

**What it does:**
1. Fetches soil moisture for 5 locations
2. Fetches groundwater levels for 15 wells
3. Stores in `drought_data` and `groundwater_data`
4. Calculates drought indices
5. Updates cache

**Test:**
```bash
curl -X POST \
  "https://xxxxx.supabase.co/functions/v1/fetch-drought" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 4. check-water-level-alert

**Purpose:** Send push notifications when water level ≥ 400cm

**Path:** `supabase/functions/check-water-level-alert/index.ts`

**Data Sources:** `water_level_data` table

**Schedule:** Every hour (cron job)

**API Keys Required:**
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

**What it does:**
1. Checks latest water level for each station
2. Finds all subscriptions for that station
3. If water level ≥ 400cm, sends push notification
4. Logs notification in `push_notification_logs`
5. Removes expired subscriptions

**Notification Format:**
```json
{
  "title": "🌊 Árvízriasztás - Mohács",
  "body": "Vízállás: 425 cm (Nagyvíz szint felett!)",
  "icon": "/icons/icon-192x192.png",
  "badge": "/icons/badge-96x96.png",
  "data": {
    "url": "/water-level/mohacs",
    "station": "Mohács",
    "level": 425
  }
}
```

**Test:**
```bash
curl -X POST \
  "https://xxxxx.supabase.co/functions/v1/check-water-level-alert" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

### Edge Functions Summary Table

| Function | Frequency | Purpose | API Keys |
|----------|-----------|---------|----------|
| **fetch-meteorology** | Every 20 min | Weather data | OpenWeatherMap |
| **fetch-water-level** | Every 6 hours | Water levels | None (scraping) |
| **fetch-drought** | Daily 3AM | Drought data | None (public) |
| **check-water-level-alert** | Every hour | Push notifications | VAPID keys |

---

## Environment Variables Setup

DunApp PWA uses **two types** of environment variables:

### Frontend Variables (VITE_*)

**Exposed to the browser** - Safe for public use

```env
# Supabase connection
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Push notifications (public key only)
VITE_VAPID_PUBLIC_KEY=BK1Xz...
```

**Usage in React:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

### Backend Variables (No Prefix)

**Only used in Edge Functions** - Never exposed to browser

```env
# Supabase service role (NEVER expose to frontend!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys
OPENWEATHER_API_KEY=your_openweather_key
METEOBLUE_API_KEY=your_meteoblue_key
YR_NO_USER_AGENT=DunApp PWA/1.0 (your-email@example.com)

# Push notifications (private key - SECRET!)
VAPID_PRIVATE_KEY=abc123...
VAPID_SUBJECT=mailto:your-email@example.com
```

**Usage in Edge Functions:**
```typescript
const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
```

### Complete .env Template

```env
# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# METEOROLOGY API KEYS
# ============================================================================
OPENWEATHER_API_KEY=your_openweather_api_key
METEOBLUE_API_KEY=your_meteoblue_api_key

# ============================================================================
# PUSH NOTIFICATION VAPID KEYS
# ============================================================================
VITE_VAPID_PUBLIC_KEY=BK1Xz...
VAPID_PRIVATE_KEY=abc123...
VAPID_SUBJECT=mailto:your-email@example.com

# ============================================================================
# OPTIONAL
# ============================================================================
YR_NO_USER_AGENT=DunApp PWA/1.0 (your-email@example.com)
NODE_ENV=development
DEBUG=true
USE_MOCK_DATA=false
```

### Setting Variables in Supabase

**For Edge Functions** (backend variables):

```bash
# Set secrets one by one
supabase secrets set OPENWEATHER_API_KEY=your_key
supabase secrets set METEOBLUE_API_KEY=your_key
supabase secrets set VAPID_PRIVATE_KEY=your_key
supabase secrets set VAPID_SUBJECT=mailto:your-email@example.com

# Or from .env file (recommended)
cat .env | grep -v '^VITE_' | supabase secrets set --env-file /dev/stdin

# List secrets (values hidden)
supabase secrets list
```

**For Frontend** (VITE_* variables):

These are set in your local `.env` file and in **Netlify** for production.

### Security Best Practices

✅ **DO:**
- Use `.env` for local development
- Add `.env` to `.gitignore`
- Use Supabase secrets for backend variables
- Rotate keys regularly
- Use different keys for dev/prod

❌ **DON'T:**
- Commit `.env` to Git
- Put service role key in frontend code
- Share keys in Slack/Discord
- Use same keys across projects
- Hardcode API keys in code

---

## Using the Setup Script

The `scripts/setup-supabase.sh` script automates the entire setup process.

### Script Modes

```bash
# Create new project (interactive)
./scripts/setup-supabase.sh --new-project

# Link to existing project
./scripts/setup-supabase.sh --link

# Update existing project (migrations + functions)
./scripts/setup-supabase.sh --update
```

### What the Script Does

#### --new-project Mode

1. ✅ Checks dependencies (Supabase CLI, psql)
2. ✅ Logs in to Supabase
3. ✅ Creates new project (prompts for details)
4. ✅ Creates `.env.local` with credentials
5. ✅ Links local project
6. ✅ Runs all migrations
7. ✅ Deploys Edge Functions
8. ✅ Sets environment variables (optional)
9. ✅ Seeds database with 27 locations
10. ✅ Displays cron job configuration

#### --link Mode

1. ✅ Checks dependencies
2. ✅ Logs in to Supabase
3. ✅ Lists available projects
4. ✅ Links to selected project
5. ✅ Runs migrations
6. ✅ Deploys Edge Functions

#### --update Mode

1. ✅ Checks dependencies
2. ✅ Runs new migrations (if any)
3. ✅ Deploys Edge Functions
4. ✅ Updates existing deployment

### Script Output Example

```bash
$ ./scripts/setup-supabase.sh --new-project

╔═══════════════════════════════════════════════════════════════╗
║         DunApp PWA - Supabase Setup Script                   ║
╚═══════════════════════════════════════════════════════════════╝

==> Checking dependencies...
✓ Dependencies are available

==> Logging in to Supabase...
✓ Logged in to Supabase

==> Creating new Supabase project...
Enter project name (e.g., dunapp-pwa): dunapp-pwa
Enter database password (min 12 chars): ************
Enter region (default: eu-central-1):

==> Creating project 'dunapp-pwa'...
✓ Project created successfully

==> Saving credentials to .env.local...
✓ Credentials saved to .env.local
⚠ Please update VITE_SUPABASE_ANON_KEY in .env.local

==> Running database migrations...
✓ Migrations completed

==> Deploying Edge Functions...
==> Deploying function: fetch-meteorology
✓ Deployed: fetch-meteorology
==> Deploying function: fetch-water-level
✓ Deployed: fetch-water-level
==> Deploying function: fetch-drought
✓ Deployed: fetch-drought
==> Deploying function: check-water-level-alert
✓ Deployed: check-water-level-alert
✓ All Edge Functions deployed

==> Setting environment variables for Edge Functions...
✓ Environment variables configured

==> Setup Summary

  Supabase Project: dunapp-pwa (xxxxxxxxxxxxx)
  Migrations: Completed
  Edge Functions: Deployed
  Environment Variables: Set

✓ Supabase setup completed!

Next steps:
  1. Update .env.local with Supabase credentials
  2. Configure cron jobs in Supabase SQL Editor
  3. Test Edge Functions in Supabase dashboard
  4. Set up RLS policies in Database settings
  5. Run 'npm run dev' to test locally
```

### Script Troubleshooting

**Error: Supabase CLI not found**
```bash
npm install -g supabase
```

**Error: Not logged in**
```bash
supabase login
```

**Error: Project already exists**
```bash
# Use --link mode instead
./scripts/setup-supabase.sh --link
```

---

## Manual Setup Steps

If you prefer manual setup (or the script fails), follow these steps.

### Step 1: Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Enter details and create

### Step 2: Get Credentials

1. Go to **Settings** → **API**
2. Copy URL and keys

### Step 3: Create .env File

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Step 4: Link Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 5: Run Migrations

```bash
# Run each migration in order
supabase db push
```

Or use SQL Editor in dashboard:
1. Go to **SQL Editor**
2. Copy contents of `001_initial_schema.sql`
3. Click **"Run"**
4. Repeat for `002_seed_data.sql` and `003_rls_policies.sql`

### Step 6: Deploy Functions Manually

```bash
cd supabase/functions

# Deploy each function
supabase functions deploy fetch-meteorology --no-verify-jwt
supabase functions deploy fetch-water-level --no-verify-jwt
supabase functions deploy fetch-drought --no-verify-jwt
supabase functions deploy check-water-level-alert --no-verify-jwt
```

### Step 7: Set Secrets

```bash
supabase secrets set OPENWEATHER_API_KEY=your_key
supabase secrets set METEOBLUE_API_KEY=your_key
# ... (see Environment Variables section)
```

### Step 8: Configure Cron Jobs

1. Go to **SQL Editor**
2. Run this SQL:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Fetch meteorology data (every 20 minutes)
SELECT cron.schedule(
  'fetch-meteorology',
  '*/20 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-meteorology',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
  $$
);

-- Fetch water level data (every 6 hours)
SELECT cron.schedule(
  'fetch-water-level',
  '0 */6 * * *',
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-water-level',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
  $$
);

-- Fetch drought data (daily at 3 AM)
SELECT cron.schedule(
  'fetch-drought',
  '0 3 * * *',
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-drought',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
  $$
);

-- Check water level alerts (every hour)
SELECT cron.schedule(
  'check-water-level-alert',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-water-level-alert',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
  $$
);
```

3. Replace `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY`
4. Click **"Run"**

### Step 9: Verify Cron Jobs

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- View cron job logs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## Testing Your Setup

### 1. Test Database Connection

```bash
# List all tables
supabase db diff

# Query a table
echo "SELECT COUNT(*) FROM meteorology_cities;" | supabase db execute
```

Expected output: `count: 4`

### 2. Test Edge Functions

#### Test fetch-meteorology

```bash
curl -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-meteorology" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "results": [
    { "city": "Szekszárd", "success": true },
    { "city": "Baja", "success": true },
    { "city": "Dunaszekcső", "success": true },
    { "city": "Mohács", "success": true }
  ]
}
```

#### Test fetch-water-level

```bash
curl -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-water-level" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### Test fetch-drought

```bash
curl -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-drought" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 3. Test from Frontend

```typescript
// src/test-supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Test query
const { data, error } = await supabase
  .from('meteorology_cities')
  .select('*');

console.log('Cities:', data);
console.log('Error:', error);
```

Run it:
```bash
npm run dev
# Open browser console
```

### 4. Verify Data in Supabase Studio

1. Go to [app.supabase.com](https://app.supabase.com)
2. Open your project
3. Go to **Table Editor**
4. Check these tables:
   - `meteorology_cities` (should have 4 rows)
   - `water_level_stations` (should have 3 rows)
   - `drought_locations` (should have 5 rows)
   - `groundwater_wells` (should have 15 rows)

Total: **27 locations**

### 5. Test Push Notifications (Optional)

```bash
# Subscribe to notifications (requires browser)
# Open your app in browser
# Click "Enable Notifications" button
# Check push_subscriptions table

# Manually trigger alert
curl -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-water-level-alert" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## Troubleshooting

### Common Issues

#### 1. "Supabase CLI not found"

**Solution:**
```bash
npm install -g supabase
supabase --version
```

#### 2. "Error: Database connection failed"

**Possible causes:**
- Wrong credentials in `.env`
- Project not linked
- Supabase project paused

**Solution:**
```bash
# Re-link project
supabase link --project-ref YOUR_PROJECT_REF

# Check connection
supabase projects list

# Resume paused project in dashboard
```

#### 3. "Migration failed"

**Solution:**
```bash
# Reset local database
supabase db reset

# Re-run migrations
supabase db push

# Or run migrations in SQL Editor (dashboard)
```

#### 4. "Edge Function deployment failed"

**Possible causes:**
- Function syntax error
- Missing dependencies
- Network issue

**Solution:**
```bash
# Check function logs
supabase functions logs fetch-meteorology

# Re-deploy with verbose output
supabase functions deploy fetch-meteorology --no-verify-jwt --debug

# Test locally first
supabase functions serve fetch-meteorology
```

#### 5. "API keys not working"

**Solution:**
```bash
# List current secrets
supabase secrets list

# Re-set secrets
supabase secrets set OPENWEATHER_API_KEY=your_key

# Test key directly
curl "https://api.openweathermap.org/data/2.5/weather?lat=46.35&lon=18.71&appid=YOUR_KEY"
```

#### 6. "Cron jobs not running"

**Solution:**
```sql
-- Check if pg_cron is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- List scheduled jobs
SELECT * FROM cron.job;

-- Check job logs
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- Delete and recreate job
SELECT cron.unschedule('fetch-meteorology');
-- Then recreate (see Manual Setup Step 8)
```

#### 7. "RLS policies blocking access"

**Solution:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE meteorology_data DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE meteorology_data ENABLE ROW LEVEL SECURITY;

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'meteorology_data';
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `PGRST301` | JWT token invalid | Check ANON_KEY in `.env` |
| `PGRST204` | No rows found | Database is empty, run migrations |
| `42P01` | Table does not exist | Run migrations |
| `23505` | Unique constraint violation | Duplicate data, check seed script |
| `42501` | Permission denied | Check RLS policies |

### Getting Help

1. **Check logs:**
   ```bash
   # Function logs
   supabase functions logs fetch-meteorology --tail

   # Database logs
   supabase logs db
   ```

2. **Supabase Status:** [status.supabase.com](https://status.supabase.com)

3. **Discord:** [discord.supabase.com](https://discord.supabase.com)

4. **GitHub Issues:** Open issue in this repo

---

## Next Steps

After successful setup:

### 1. Connect Frontend to Supabase

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 2. Use React Hooks

```typescript
// Use existing hooks
import { useWeatherData } from '@/hooks/useWeatherData';
import { useWaterLevelData } from '@/hooks/useWaterLevelData';
import { useDroughtData } from '@/hooks/useDroughtData';

// In component
const { data, isLoading, error } = useWeatherData('szekszard');
```

### 3. Test Each Module

```bash
# Run development server
npm run dev

# Open in browser
open http://localhost:5173

# Test each module:
# - Meteorology: Check weather data for 4 cities
# - Water Level: Check 3 stations
# - Drought: Check 5 locations + 15 wells
```

### 4. Set Up Production Deployment

1. **Deploy to Netlify:**
   ```bash
   # See docs/DEPLOYMENT.md
   npm run build
   netlify deploy --prod
   ```

2. **Set Netlify Environment Variables:**
   - Go to Netlify dashboard
   - Site Settings → Environment Variables
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
   - Add `VITE_VAPID_PUBLIC_KEY`

3. **Monitor Production:**
   - Supabase Dashboard: Check function logs
   - Netlify Dashboard: Check build logs
   - Browser Console: Check for errors

### 5. Enable Monitoring

```bash
# Set up Sentry (optional)
npm install @sentry/react

# Add to main.tsx
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: "your_sentry_dsn" });
```

### 6. Performance Optimization

- Enable Supabase connection pooling
- Add indexes for frequently queried columns
- Use Supabase caching for static data
- Optimize Edge Function cold starts

### 7. Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Service role key never exposed to frontend
- [ ] API keys stored in Supabase secrets
- [ ] `.env` file in `.gitignore`
- [ ] CORS configured properly
- [ ] HTTPS enforced on production

---

## Additional Resources

### Documentation

- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Supabase CLI:** [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)
- **Edge Functions:** [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **Database Migrations:** [supabase.com/docs/guides/cli/local-development](https://supabase.com/docs/guides/cli/local-development)

### Project Documentation

- **CLAUDE.md** - Central project reference
- **PROJECT_SUMMARY.md** - Complete project documentation
- **DEPLOYMENT.md** - Deployment guide
- **.env.example** - Environment variables template

### Useful Commands

```bash
# Supabase CLI
supabase --help
supabase projects list
supabase status
supabase db diff
supabase functions list
supabase secrets list

# Database
supabase db reset              # Reset local database
supabase db push               # Push migrations to remote
supabase db pull               # Pull remote schema
supabase db execute            # Execute SQL

# Functions
supabase functions serve       # Serve locally
supabase functions deploy      # Deploy to remote
supabase functions logs        # View logs

# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run preview                # Preview production build
```

---

**Setup Complete!** 🎉

You now have a fully configured Supabase backend for DunApp PWA with:
- ✅ 13 database tables
- ✅ 27 seeded locations
- ✅ 4 Edge Functions
- ✅ RLS security policies
- ✅ Cron jobs configured
- ✅ Push notifications ready

**Questions?** Open an issue on GitHub or check the troubleshooting section above.

---

*Last updated: 2025-10-28*
*Version: 1.0*
*Author: DunApp PWA Team*
