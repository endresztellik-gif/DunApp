# Environment Setup Guide - DunApp PWA

> Complete guide to configuring environment variables for local development and production deployment

**Last Updated:** 2025-11-03
**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Reference](#quick-reference)
3. [Local Development Setup](#local-development-setup)
4. [API Keys Setup](#api-keys-setup)
5. [Supabase Edge Function Secrets](#supabase-edge-function-secrets)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)
9. [Quick Start Checklist](#quick-start-checklist)

---

## Overview

Environment variables in DunApp PWA are split into two categories:

### Frontend Variables (VITE_ prefix)

- Exposed to the browser
- Must start with `VITE_` prefix to be included in the build
- Safe for public consumption
- Examples: `VITE_SUPABASE_URL`, `VITE_VAPID_PUBLIC_KEY`

### Backend Variables (No prefix)

- Only used in Supabase Edge Functions
- Never exposed to the browser
- Must be kept secret
- Set via Supabase Dashboard or CLI
- Examples: `OPENWEATHER_API_KEY`, `METEOBLUE_API_KEY`

### RainViewer and Yr.no

- No API keys required
- RainViewer: Free public API
- Yr.no: No key needed, just requires User-Agent header

---

## Quick Reference

### Variables Summary Table

| Variable Name | Required | Scope | Used By | Purpose |
|---------------|----------|-------|---------|---------|
| `VITE_SUPABASE_URL` | ✅ Yes | Frontend | App.tsx | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Frontend | useWeatherData, etc. | Supabase public key |
| `OPENWEATHER_API_KEY` | ✅ Yes | Backend | fetch-meteorology | Current weather data |
| `YR_NO_USER_AGENT` | ✅ Yes | Backend | fetch-meteorology | 6-hourly forecast data |
| `METEOBLUE_API_KEY` | ⚪ Optional | Backend | fetch-meteorology | Fallback weather API |
| `VITE_VAPID_PUBLIC_KEY` | ⚪ Optional | Frontend | Service Worker | Push notifications |
| `VAPID_PRIVATE_KEY` | ⚪ Optional | Backend | Edge Function | Push notifications |
| `VAPID_SUBJECT` | ⚪ Optional | Backend | Edge Function | Push notification subject |

---

## Local Development Setup

### Step 1: Create .env File

Copy the example file to create your local environment file:

```bash
cp .env.example .env
```

### Step 2: Review .env Structure

The `.env` file has several sections:

```env
# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# METEOROLOGY API KEYS (Backend - Edge Functions)
# ============================================================================
OPENWEATHER_API_KEY=your_api_key_here
METEOBLUE_API_KEY=your_api_key_here
YR_NO_USER_AGENT=DunApp PWA/1.0 (contact@dunapp.hu)

# ============================================================================
# PUSH NOTIFICATION KEYS (Optional)
# ============================================================================
VITE_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Step 5: Verify Environment Variables

Check that variables loaded correctly in the console:

```bash
# Should print your Supabase URL
npm run dev | grep "VITE_SUPABASE_URL"
```

Or in your browser console, check:

```javascript
// These should be defined
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### Important Notes

- ⚠️ **NEVER commit `.env` to Git** - Add it to `.gitignore`
- 🔄 **Restart dev server** after changing `.env` values
- ✅ **Use `.env.example`** for documentation only
- 📝 **Copy `.env.example`** to create new environment files

---

## API Keys Setup

### 1. Supabase Configuration

**Purpose:** Database, authentication, and Edge Functions hosting

#### Signup & Project Creation

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign in with GitHub or email
4. Click "Create a new project"
5. Fill in:
   - **Name:** DunApp PWA (or your project name)
   - **Database Password:** Create a strong password
   - **Region:** Select closest to your location
6. Click "Create new project" and wait for initialization (1-2 minutes)

#### Get Your Keys

Once your project is ready:

1. Go to **Settings > API** (or press `g a` in dashboard)
2. You'll see:
   - **Project URL:** This is your `VITE_SUPABASE_URL`
   - **anon/public key:** This is your `VITE_SUPABASE_ANON_KEY`
   - **service_role key:** Keep this secret, only for backend use

3. Copy these values to your `.env`:

```env
VITE_SUPABASE_URL=https://zpwoicpajmvbtmtumsah.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3BhambdYW1zYWgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyODEyMzQ1MCwiZXhwIjoxNzQzNzQ1NDUwfQ.abc...
```

✅ **Tip:** Supabase free tier includes 2 projects, 500MB database, and 5GB bandwidth - perfect for development.

---

### 2. OpenWeatherMap API

**Purpose:** Current weather data for 4 cities (Szekszárd, Baja, Dunaszekcső, Mohács)

**Status:** ✅ **REQUIRED** - App won't work without this

#### Getting Your API Key

1. Go to [https://openweathermap.org/api](https://openweathermap.org/api)
2. Click "Sign Up" (or Sign In if you have an account)
3. Complete email verification
4. In dashboard, go to **API keys** (left menu)
5. You'll see a default key created
6. Copy it to your `.env`:

```env
OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

#### Testing Your API Key

Test the API key with curl:

```bash
curl "https://api.openweathermap.org/data/2.5/weather?q=Budapest&appid=YOUR_API_KEY&units=metric"
```

You should get a response with current weather data.

#### Free Tier Limits

- **Calls/day:** 1,000
- **Calls/month:** 30,000
- **Update frequency:** Real-time
- **Data freshness:** 10 minutes

#### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid API key | Check key is correct, API key is activated |
| 429 Too Many Requests | Rate limit exceeded | Wait before next request or upgrade plan |
| Empty response | API key not activated | Go to API keys page, check status |

---

### 3. Yr.no (MET Norway)

**Purpose:** 6-hourly weather forecast for 72 hours (11 data points)

**Status:** ✅ **REQUIRED** - Free, no API key needed!

#### Configuration

No signup required! Just set the User-Agent header:

```env
YR_NO_USER_AGENT=DunApp PWA/1.0 (contact@dunapp.hu)
```

Replace with your app name and contact email.

#### Why User-Agent?

Yr.no requires a descriptive User-Agent header for identification. This is already configured in the `fetch-meteorology` Edge Function:

```typescript
headers: {
  "User-Agent": Deno.env.get("YR_NO_USER_AGENT") || "DunApp PWA/1.0"
}
```

#### Rate Limits

- **Calls/second:** No limit (fair use)
- **Update frequency:** Hourly
- **Data availability:** 72 hours ahead
- **Free tier:** Fully free, no restrictions

#### Testing

```bash
# Get forecast for Budapest
curl -H "User-Agent: DunApp PWA/1.0" \
  "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=47.5&lon=19.0"
```

✅ **Tip:** Yr.no is 100% free with no API key needed - excellent for production!

---

### 4. RainViewer (Animated Radar)

**Purpose:** Animated weather radar with 13-frame loop

**Status:** ✅ **OPTIONAL** - Free public API, no key required

#### How It Works

RainViewer provides free weather radar data:

```typescript
// No authentication needed
const response = await fetch(
  `https://api.rainviewer.com/public/weather-maps-api/v1/...`
);
```

#### Features

- 13-frame animated loop (6 hours total)
- 500ms interval between frames
- Full global coverage
- Real-time precipitation data
- Play/pause controls in RadarMap component

#### Rate Limits

- **Calls/minute:** 5
- **Frames cached:** 13 most recent
- **Update frequency:** 10 minutes

No configuration needed - works out of the box!

---

### 5. Meteoblue API (Fallback)

**Purpose:** Fallback weather API if OpenWeatherMap fails

**Status:** ⚪ **OPTIONAL** - Only needed for redundancy

#### When to Use

Meteoblue is used as fallback:
- If OpenWeatherMap API key is invalid
- If OpenWeatherMap rate limit is exceeded
- For testing fallback behavior

#### Getting Your API Key

1. Go to [https://www.meteoblue.com/en/weather-api](https://www.meteoblue.com/en/weather-api)
2. Click "Get API Key" or "Create Account"
3. Sign up with email
4. In dashboard, go to **API Keys**
5. Create a new key
6. Copy to `.env`:

```env
METEOBLUE_API_KEY=your_meteoblue_api_key_here
```

#### Free Tier Limits

- **Calls/month:** 3,000
- **Data points:** Standard weather data
- **Locations:** Unlimited
- **History:** No historical data

#### Configuration in Edge Function

The `fetch-meteorology` function automatically tries Meteoblue if OpenWeatherMap fails:

```typescript
// 1. Try OpenWeatherMap
const owmData = await fetchFromOpenWeatherMap(city);
if (!owmData) {
  // 2. Fallback to Meteoblue
  const fallbackData = await fetchFromMeteoblue(city);
}
```

✅ **Tip:** Only add Meteoblue if you need extra reliability - OpenWeatherMap is sufficient for most uses.

---

### 6. VAPID Keys (Push Notifications - Optional)

**Purpose:** Web Push API notifications when water level exceeds thresholds

**Status:** ⚪ **OPTIONAL** - Only needed if implementing push notifications

#### What Are VAPID Keys?

VAPID (Voluntary Application Server Identification) keys are cryptographic keypairs that allow your server to:
- Send push notifications to subscribed clients
- Identify your application to push services
- Sign notification payloads

#### Generate VAPID Keys

##### Option A: Using web-push CLI (Recommended)

```bash
# Install web-push globally
npm install -g web-push

# Generate keys
web-push generate-vapid-keys
```

Output:
```
Public Key: BGU-xuubTzjN5AFb8aEaapyuoBINLd5qUeIocIi1p_ohsBTAsQFpXxByDTatp_19tbvk2DehTighbzIpufhDKdU
Private Key: dysnyO0A961F3BdcSMNVH-fNceUwB-FJ9XdclTDaUF8
```

##### Option B: Using Online Generator

Visit [https://vapidkeys.com/](https://vapidkeys.com/) and click "Generate"

#### Configuration

Add to `.env`:

```env
VITE_VAPID_PUBLIC_KEY=BGU-xuubTzjN5AFb8aEaapyuoBINLd5qUeIocIi1p_ohsBTAsQFpXxByDTatp_19tbvk2DehTighbzIpufhDKdU
VAPID_PRIVATE_KEY=dysnyO0A961F3BdcSMNVH-fNceUwB-FJ9XdclTDaUF8
VAPID_SUBJECT=mailto:contact@dunapp.hu
```

#### Security Notes

- ⚠️ **Never expose private key** in frontend code
- ⚠️ **Rotate keys** periodically (at least yearly)
- ✅ Public key is safe to expose
- ✅ Subject email for service identification

#### Testing Push Notifications

Once configured, test in browser console:

```javascript
// Request notification permission
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    console.log('Notifications enabled!');
  }
});
```

---

## Supabase Edge Function Secrets

### What Are Secrets?

Secrets are environment variables that:
- **Only exist in Edge Function runtime**
- **Never exposed to the browser**
- **Separate from frontend .env variables**
- Used to store API keys, tokens, and passwords

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** > **Your Project**
2. Navigate to **Edge Functions** (in left sidebar)
3. Click **Secrets** tab
4. Click **New secret**
5. Add each secret:

```
Key: OPENWEATHER_API_KEY
Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

Repeat for:
- `METEOBLUE_API_KEY`
- `YR_NO_USER_AGENT`
- `VAPID_PRIVATE_KEY` (if using push notifications)

### Method 2: Via Supabase CLI

Install CLI if not already installed:

```bash
npm install -g supabase
```

Login:

```bash
supabase login
```

Link to your project:

```bash
supabase link --project-ref zpwoicpajmvbtmtumsah
```

Set secrets:

```bash
# Set OpenWeatherMap key
supabase secrets set OPENWEATHER_API_KEY="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# Set Meteoblue key
supabase secrets set METEOBLUE_API_KEY="your_meteoblue_key"

# Set Yr.no User-Agent
supabase secrets set YR_NO_USER_AGENT="DunApp PWA/1.0 (contact@dunapp.hu)"

# Set VAPID private key (if using notifications)
supabase secrets set VAPID_PRIVATE_KEY="dysnyO0A961F3BdcSMNVH-fNceUwB-FJ9XdclTDaUF8"
```

### Verify Secrets Are Set

Check that secrets are correctly configured:

```bash
# List all secrets (shows keys but not values)
supabase secrets list

# Output:
# OPENWEATHER_API_KEY
# METEOBLUE_API_KEY
# YR_NO_USER_AGENT
# VAPID_PRIVATE_KEY
```

### Access Secrets in Edge Functions

In your Edge Function code:

```typescript
// Import Deno for environment access
const openWeatherKey = Deno.env.get("OPENWEATHER_API_KEY");
const meteoblueKey = Deno.env.get("METEOBLUE_API_KEY");
const userAgent = Deno.env.get("YR_NO_USER_AGENT");

// Use in API calls
const response = await fetch(
  `https://api.openweathermap.org/data/2.5/weather?appid=${openWeatherKey}`
);
```

### Important Differences

| Aspect | Frontend .env | Backend Secrets |
|--------|---------------|-----------------|
| Location | `.env` file | Supabase Dashboard |
| Prefix | `VITE_*` required | No prefix needed |
| Visibility | Exposed in build | Hidden from browser |
| Access | `import.meta.env` | `Deno.env.get()` |
| When Set | Before build | Before function deploy |
| Examples | `VITE_SUPABASE_URL` | `OPENWEATHER_API_KEY` |

---

## Production Deployment

### Deployment to Netlify

#### Step 1: Set Environment Variables in Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Select your DunApp PWA site
3. Navigate to **Site settings** > **Build & deploy** > **Environment**
4. Click **Edit variables**
5. Add your VITE_ variables:

```
VITE_SUPABASE_URL = https://zpwoicpajmvbtmtumsah.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_VAPID_PUBLIC_KEY = BGU-xuubTzjN5AFb8aEaapyuoBINLd5qUeIocIi1p_...
```

#### Step 2: Set Supabase Secrets

Secrets for Edge Functions are set in Supabase, not Netlify:

```bash
supabase secrets set OPENWEATHER_API_KEY="your_key_here" --project-ref zpwoicpajmvbtmtumsah
```

#### Step 3: Deploy

Push to GitHub main branch:

```bash
git push origin main
```

Netlify automatically builds and deploys.

### Deploy Previews

Netlify creates preview sites for pull requests. Environment variables from production are used by default. To override for previews:

1. In Site settings, click "Deploy contexts"
2. Add variables under "Deploy previews" section
3. These override production variables for PR previews

### Verify Deployment

After deployment, verify variables loaded:

1. Open DevTools (F12)
2. Go to Console
3. Type: `console.log(import.meta.env)`
4. Should see `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

✅ **Tip:** Never log sensitive variables in production! Check only in development.

---

## Troubleshooting

### Environment Variables Undefined

**Problem:** `import.meta.env.VITE_SUPABASE_URL` is undefined

**Solutions:**

1. Check variable name starts with `VITE_`:
   ```env
   # ✅ Correct
   VITE_SUPABASE_URL=...

   # ❌ Wrong
   SUPABASE_URL=...  # Won't be available in browser
   ```

2. Restart dev server after updating `.env`:
   ```bash
   # Kill current server (Ctrl+C)
   npm run dev
   ```

3. Check file location - `.env` must be in project root:
   ```
   dunapp-pwa/
   ├── .env            ✅ Correct location
   ├── src/
   └── package.json
   ```

4. Clear cache and rebuild:
   ```bash
   npm run build      # Clean build
   npm run preview    # Test build locally
   ```

### API Key Invalid

**Problem:** API calls return 401 Unauthorized

**OpenWeatherMap:**

```bash
# Test your API key
curl "https://api.openweathermap.org/data/2.5/weather?q=Budapest&appid=YOUR_KEY"

# Response should include weather data, not error
```

**Solutions:**

1. Verify API key is active:
   - Go to https://openweathermap.org/api
   - Click "API keys"
   - Check status is "Active"

2. Check for typos:
   ```env
   # Copy-paste entire key, no extra spaces
   OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

3. Verify rate limits not exceeded:
   - Check API usage dashboard
   - Free tier: 1,000 calls/day

4. Use different API key:
   - Generate new key in OpenWeatherMap dashboard
   - Allow 10 minutes for activation

### CORS Errors

**Problem:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** Browser blocking API calls from frontend

**Solution:** Use Edge Functions as proxy (already done in this app)

- Frontend calls → Edge Function → External API
- Edge Functions don't have CORS restrictions

**Verify Edge Function is working:**

```bash
curl -X POST 'https://zpwoicpajmvbtmtumsah.supabase.co/functions/v1/fetch-meteorology' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Edge Function Secrets Not Found

**Problem:** Edge Function returns "secret not found"

**Solutions:**

1. Verify secret is set:
   ```bash
   supabase secrets list
   ```

2. Check spelling matches exactly:
   ```bash
   # What you set:
   supabase secrets set OPENWEATHER_API_KEY="xxx"

   # What you access in code:
   Deno.env.get("OPENWEATHER_API_KEY")  # ✅ Exact match
   Deno.env.get("openweather_api_key")   # ❌ Wrong case
   ```

3. Wait after setting secret:
   - Secrets take ~30 seconds to propagate
   - Try calling function again after waiting

4. Redeploy Edge Function:
   ```bash
   supabase functions deploy fetch-meteorology
   ```

### Netlify Build Fails

**Problem:** Build fails with "environment variable not defined"

**Solutions:**

1. Verify VITE_ prefix:
   ```env
   # ✅ Correct - available in Netlify env vars
   VITE_SUPABASE_URL=...

   # ❌ Won't work - no VITE_ prefix
   SUPABASE_URL=...
   ```

2. Set variables in Netlify Dashboard:
   - Site settings > Environment
   - Add all `VITE_*` variables

3. Check build command:
   ```bash
   npm run build
   ```

4. View build logs:
   - Go to Deploys in Netlify
   - Click failed deployment
   - Check "Deploy log" for errors

### App Works Locally but Not on Production

**Problem:** App works on `localhost:5173` but fails on Netlify

**Common causes:**

1. Missing environment variables in Netlify:
   ```bash
   # Check what's set
   # Netlify Dashboard > Environment
   ```

2. Different API keys for production:
   - Use different OpenWeatherMap keys for dev/prod
   - Verify production keys have higher rate limits

3. CORS issues in production:
   - Always use Edge Functions as proxy
   - Never call external APIs directly from frontend

4. Service Worker issues:
   - Clear browser cache
   - Check DevTools > Application > Service Workers

**Debug production:**

```javascript
// In browser console on production
console.log(import.meta.env);  // Shows all env vars
console.log(import.meta.env.VITE_SUPABASE_URL);
```

---

## Security Best Practices

### 1. Never Commit Secrets

**⚠️ CRITICAL:** Environment variables should NEVER be in git

#### Check .gitignore

```bash
# View .gitignore
cat .gitignore
```

Should include:

```
.env
.env.local
.env.*.local
.env.vapid
```

#### If Accidentally Committed

```bash
# Remove from git history (⚠️ DANGEROUS - READ CAREFULLY)
# Only do this if keys were exposed!

# 1. Rotate the API key immediately
#    - Change password on OpenWeatherMap, Supabase, etc.

# 2. Remove from git
git rm --cached .env
git commit -m "fix: Remove .env from git history"
git push

# 3. Use git-filter-repo to remove from all history
npm install -g git-filter-repo
git filter-repo --invert-paths --paths .env
```

### 2. Rotate Keys Regularly

**Best practice:** Rotate API keys at least quarterly

#### OpenWeatherMap

1. Go to https://openweathermap.org/api
2. Click "API keys"
3. Delete old key
4. Create new key
5. Update in:
   - `.env` (development)
   - Supabase secrets (Edge Functions)
   - Netlify environment variables (production)

#### Supabase

1. Go to Settings > API
2. Click eye icon next to key to rotate
3. Confirm rotation
4. Update in frontend `.env`

### 3. Use Different Keys for Dev/Production

```bash
# Development
OPENWEATHER_API_KEY=dev_key_1234...

# Production
# Set different key in Netlify or Supabase
```

Benefits:
- Easy to revoke dev keys without affecting production
- Can monitor usage separately
- Easier to test without affecting users

### 4. Monitor API Usage

#### OpenWeatherMap

- Dashboard > Usage
- Monitor calls/day
- Alert if approaching limit (1,000/day free)

#### Supabase

- Dashboard > Home > Usage
- Monitor Edge Function invocations
- Check bandwidth usage

### 5. Use Private Keys Only Where Needed

**Frontend:**
```env
# ✅ OK to expose
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_VAPID_PUBLIC_KEY=...  # Public means safe!
```

**Backend:**
```
# ⚠️ NEVER expose these
OPENWEATHER_API_KEY
METEOBLUE_API_KEY
VAPID_PRIVATE_KEY
```

### 6. Secure Supabase Row Level Security (RLS)

Ensure RLS policies are enabled on all tables:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Should show "true" for all tables
```

See [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security) for details.

### 7. Limit API Scope

When creating API keys, use minimum required permissions:

**OpenWeatherMap:**
- Only enable "Current weather" if not using forecast
- Restrict to specific endpoints if possible

**Supabase:**
- Anon key: Read/query only
- Service role: For backend operations only
- Create separate keys for different environments

### 8. Enable 2FA on Service Accounts

For Supabase and OpenWeatherMap dashboards:

1. Go to Account Settings
2. Enable Two-Factor Authentication
3. Use authenticator app (not SMS)
4. Save backup codes

### 9. Audit Access Logs

Check who accessed your keys:

**Supabase:**
- Settings > Audit logs
- Review API key access patterns
- Alert if unusual activity

**OpenWeatherMap:**
- Account > Usage > API keys
- Check last accessed date
- Revoke unused keys

---

## Quick Start Checklist

### Pre-Setup

- [ ] Read through this entire guide
- [ ] Ensure you have Node.js 18+ installed
- [ ] Have a text editor ready

### Supabase

- [ ] Create Supabase account at https://supabase.com
- [ ] Create new Supabase project
- [ ] Wait for project initialization (1-2 minutes)
- [ ] Go to Settings > API
- [ ] Copy `Project URL` → Add to notes
- [ ] Copy `anon/public key` → Add to notes

### OpenWeatherMap

- [ ] Go to https://openweathermap.org/api
- [ ] Sign up and verify email
- [ ] Go to API keys
- [ ] Copy your API key → Add to notes

### Local Setup

- [ ] Clone repository
  ```bash
  git clone https://github.com/endresztellik-gif/DunApp.git
  cd DunApp
  ```

- [ ] Copy .env template
  ```bash
  cp .env.example .env
  ```

- [ ] Open `.env` file in text editor

- [ ] Fill in Supabase values:
  ```env
  VITE_SUPABASE_URL=https://zpwoicpajmvbtmtumsah.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGc...
  ```

- [ ] Fill in OpenWeatherMap:
  ```env
  OPENWEATHER_API_KEY=a1b2c3d4e5...
  ```

- [ ] Set Yr.no User-Agent:
  ```env
  YR_NO_USER_AGENT=DunApp PWA/1.0 (your-email@example.com)
  ```

- [ ] Save `.env` file

### Install Dependencies

- [ ] Run npm install
  ```bash
  npm install
  ```

### Supabase Secrets (Edge Functions)

- [ ] Go to Supabase Dashboard
- [ ] Navigate to Edge Functions > Secrets
- [ ] Add secret: `OPENWEATHER_API_KEY` = your key
- [ ] Add secret: `YR_NO_USER_AGENT` = your user agent

### Start Development

- [ ] Start dev server
  ```bash
  npm run dev
  ```

- [ ] Open browser to http://localhost:5173

- [ ] Verify app loads without errors

- [ ] Check weather data displays for 4 cities

- [ ] Open DevTools (F12)
  ```javascript
  // Test in console
  console.log(import.meta.env.VITE_SUPABASE_URL);
  ```

- [ ] Should see Supabase URL printed

### Database Setup (Optional for full features)

- [ ] Go to Supabase Dashboard > SQL Editor
- [ ] Run migrations from `supabase/migrations/`:
  - `001_initial_schema.sql`
  - `005_meteorology_forecasts.sql`
  - `006_add_forecast_temperature_range.sql`
  - `007_setup_cron_jobs.sql`

### Production Deployment (Netlify)

- [ ] Create Netlify account at https://netlify.com
- [ ] Connect GitHub repository
- [ ] In Site settings > Environment:
  - Add `VITE_SUPABASE_URL`
  - Add `VITE_SUPABASE_ANON_KEY`
  - Add `VITE_VAPID_PUBLIC_KEY` (if using push notifications)

- [ ] Push to GitHub main branch
  ```bash
  git push origin main
  ```

- [ ] Netlify auto-deploys
- [ ] View live app when deployment completes
- [ ] Verify weather data works on production

### Verification Tests

Run these commands to verify setup:

```bash
# Test build process
npm run build

# Test production preview
npm run preview

# Check types
npm run type-check

# View all env vars available
npm run dev
# Then in console: console.log(import.meta.env)
```

---

## Additional Resources

### Official Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/edge-functions)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Yr.no Weather API](https://www.yr.no/en/documentation/weatherapi)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Netlify Env Variables](https://docs.netlify.com/configure-builds/environment-variables/)

### Helpful Tools

- [VAPID Key Generator](https://vapidkeys.com/)
- [JWT Debugger](https://jwt.io/)
- [Postman](https://www.postman.com/) - API testing
- [DBeaver](https://dbeaver.io/) - Database GUI

### Related Documentation

- [API_DOCS.md](./API_DOCS.md) - Edge Functions API reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment checklist
- [CLAUDE.md](../CLAUDE.md) - Development reference

---

**Need Help?**

- Check [Troubleshooting](#troubleshooting) section
- Review error messages carefully
- Check Supabase logs: Dashboard > Edge Functions > Logs
- Check Netlify logs: Site > Deploys > View logs
- Search GitHub issues or create new issue

**Last Updated:** 2025-11-03
