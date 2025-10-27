# DunApp PWA - Deployment Guide

Complete guide for deploying the DunApp PWA to production using Netlify and Supabase.

**Last Updated:** 2025-10-27
**Version:** 1.0

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Supabase Setup](#supabase-setup)
4. [Netlify Setup](#netlify-setup)
5. [GitHub Actions Setup](#github-actions-setup)
6. [Deployment Process](#deployment-process)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

- **GitHub Account** - For repository hosting and CI/CD
- **Netlify Account** - For frontend hosting (free tier available)
- **Supabase Account** - For backend/database (free tier available)

### Local Development Tools

```bash
# Node.js 20.x LTS
node --version  # Should be v20.x.x

# NPM 10.x
npm --version   # Should be 10.x.x

# Git
git --version

# Supabase CLI (optional, but recommended)
npm install -g supabase
supabase --version
```

---

## Environment Variables

### Required Variables for Production

#### Frontend (Netlify)

These variables must be set in the Netlify dashboard under **Site settings > Environment variables**.

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Push Notifications (Optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here

# Build Configuration
NODE_VERSION=20
NODE_ENV=production
```

#### Backend (Supabase Edge Functions)

These are set in the Supabase dashboard or via CLI.

```env
# Database Connection (automatically provided by Supabase)
SUPABASE_DB_URL=postgresql://...

# API Keys for external services
OMSZ_API_KEY=your_omsz_api_key
VIZUGY_API_KEY=your_vizugy_api_key
OPENWEATHER_API_KEY=your_openweather_api_key

# Cron Job Configuration
CRON_SECRET=your_cron_secret_key
```

### Setting Environment Variables

#### Netlify Dashboard

1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site settings > Environment variables**
4. Click **Add a variable**
5. Add each variable with its value
6. Click **Save**

#### Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings > Edge Functions**
4. Click **Environment Variables**
5. Add each variable
6. Deploy Edge Functions

#### Local Development

Create a `.env.local` file (gitignored):

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

---

## Supabase Setup

### 1. Create Supabase Project

```bash
# Option A: Via Supabase Dashboard
# Go to https://app.supabase.com
# Click "New Project"
# Fill in project details

# Option B: Via CLI
supabase login
supabase projects create dunapp-pwa --region eu-central-1
```

### 2. Initialize Local Supabase

```bash
cd /path/to/dunapp-pwa
supabase init
```

### 3. Link to Remote Project

```bash
supabase link --project-ref your-project-ref
```

### 4. Run Database Migrations

```bash
# Create migrations from schema
supabase db diff --use-migra

# Or use existing migrations
supabase db push

# Verify migrations
supabase migration list
```

### 5. Deploy Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy

# Or deploy individual functions
supabase functions deploy fetch-meteorology-data
supabase functions deploy fetch-water-level-data
supabase functions deploy fetch-drought-data

# Set environment variables for functions
supabase secrets set OMSZ_API_KEY=your_key
supabase secrets set VIZUGY_API_KEY=your_key
```

### 6. Set Up Database Tables

```bash
# Run seed data scripts
psql $SUPABASE_DB_URL < seed-data/meteorology_cities.sql
psql $SUPABASE_DB_URL < seed-data/water_level_stations.sql
psql $SUPABASE_DB_URL < seed-data/drought_locations.sql
psql $SUPABASE_DB_URL < seed-data/groundwater_wells.sql
```

### 7. Configure Row Level Security (RLS)

Enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE meteorology_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_level_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE drought_data ENABLE ROW LEVEL SECURITY;

-- Create policies (read-only public access)
CREATE POLICY "Allow public read access" ON meteorology_data
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON water_level_data
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON drought_data
  FOR SELECT USING (true);
```

### 8. Set Up Cron Jobs

Configure cron jobs for data fetching:

```sql
-- Install pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule meteorology data fetch (every hour)
SELECT cron.schedule(
  'fetch-meteorology-data',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/fetch-meteorology-data',
      headers := '{"Authorization": "Bearer your_service_role_key"}'::jsonb
    );
  $$
);

-- Schedule water level data fetch (every 6 hours)
SELECT cron.schedule(
  'fetch-water-level-data',
  '0 */6 * * *',
  $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/fetch-water-level-data',
      headers := '{"Authorization": "Bearer your_service_role_key"}'::jsonb
    );
  $$
);

-- Schedule drought data fetch (daily at 3 AM)
SELECT cron.schedule(
  'fetch-drought-data',
  '0 3 * * *',
  $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/fetch-drought-data',
      headers := '{"Authorization": "Bearer your_service_role_key"}'::jsonb
    );
  $$
);
```

---

## Netlify Setup

### 1. Create Netlify Site

```bash
# Option A: Via Netlify Dashboard
# Go to https://app.netlify.com
# Click "Add new site" > "Import an existing project"
# Connect to GitHub and select dunapp-pwa repository

# Option B: Via Netlify CLI
npm install -g netlify-cli
netlify login
netlify init
```

### 2. Configure Build Settings

In Netlify dashboard:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** `20`

Or use `netlify.toml` (already configured in this project).

### 3. Set Environment Variables

Go to **Site settings > Environment variables** and add:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_VAPID_PUBLIC_KEY
NODE_VERSION=20
```

### 4. Configure Custom Domain (Optional)

1. Go to **Domain settings**
2. Click **Add custom domain**
3. Enter your domain (e.g., `dunapp.hu`)
4. Follow DNS configuration instructions
5. Enable HTTPS (automatic via Let's Encrypt)

### 5. Enable Netlify Plugins

Install recommended plugins:

```bash
# Lighthouse CI plugin
npm install -D @netlify/plugin-lighthouse

# Sitemap submission plugin
npm install -D netlify-plugin-submit-sitemap
```

Plugins are configured in `netlify.toml`.

---

## GitHub Actions Setup

### 1. Create GitHub Secrets

Go to your GitHub repository settings:

**Settings > Secrets and variables > Actions**

Add the following secrets:

#### Required Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token | Netlify Dashboard > User Settings > Applications > Personal access tokens |
| `NETLIFY_SITE_ID` | Your Netlify site ID | Netlify Dashboard > Site settings > Site details > API ID |
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API > URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard > Settings > API > anon public |
| `SUPABASE_ACCESS_TOKEN` | Supabase access token for CLI | Supabase Dashboard > Account > Access Tokens |

#### Optional Secrets

| Secret Name | Description |
|------------|-------------|
| `CODECOV_TOKEN` | For code coverage reports |
| `VITE_VAPID_PUBLIC_KEY` | For push notifications |

### 2. Get Netlify Tokens

```bash
# Login to Netlify CLI
netlify login

# Get site ID
netlify sites:list

# Create personal access token
# Go to: https://app.netlify.com/user/applications#personal-access-tokens
```

### 3. Get Supabase Access Token

```bash
# Login to Supabase CLI
supabase login

# Get access token
# Go to: https://app.supabase.com/account/tokens
# Click "Generate new token"
```

### 4. Verify Workflows

The project includes three GitHub Actions workflows:

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Runs on: push to main/develop, pull requests
   - Performs: lint, type check, tests, build

2. **Deploy Workflow** (`.github/workflows/deploy.yml`)
   - Runs on: push to main
   - Performs: build, deploy to Netlify, Lighthouse CI

3. **CodeQL Workflow** (`.github/workflows/codeql.yml`)
   - Runs on: push, pull requests, weekly schedule
   - Performs: security analysis

---

## Deployment Process

### Automatic Deployment (Recommended)

1. **Make changes** to your code
2. **Commit changes** to a feature branch
3. **Create pull request** to `main`
4. **CI workflow runs** automatically (lint, test, build)
5. **Merge pull request** after approval
6. **Deploy workflow runs** automatically
7. **Netlify deploys** to production
8. **Lighthouse CI** runs performance audit

### Manual Deployment

#### Using Deployment Script

```bash
# Run the deployment script
./scripts/deploy.sh

# The script will:
# 1. Run tests
# 2. Build production bundle
# 3. Deploy to Netlify
# 4. Run health check
```

#### Using Netlify CLI

```bash
# Build locally
npm run build

# Deploy to production
netlify deploy --prod --dir=dist

# Or deploy to preview
netlify deploy --dir=dist
```

#### Using Git Push

```bash
# Commit and push to main
git add .
git commit -m "Deploy: your changes"
git push origin main

# GitHub Actions will automatically deploy
```

---

## Monitoring and Logging

### Netlify Analytics

Access via Netlify Dashboard:

- **Deployment logs**: Site > Deploys > Select deployment
- **Function logs**: Site > Functions > Select function
- **Analytics**: Site > Analytics (paid feature)

### Supabase Monitoring

Access via Supabase Dashboard:

- **Database health**: Project > Database > Health
- **API logs**: Project > Logs > API
- **Function logs**: Project > Edge Functions > Logs
- **Database queries**: Project > Database > Query Performance

### Lighthouse CI Reports

Available in GitHub Actions:

- Go to **Actions** tab
- Select **Deploy** workflow
- View **Lighthouse** artifacts

### Error Tracking (Optional)

For production error tracking, integrate Sentry:

```bash
npm install @sentry/react @sentry/vite-plugin
```

Configure in `src/lib/analytics.ts`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Performance Monitoring

Use built-in Web Vitals tracking:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## Rollback Procedures

### Netlify Rollback

#### Via Dashboard

1. Go to **Deploys** tab
2. Find the last working deployment
3. Click **Publish deploy**
4. Confirm rollback

#### Via CLI

```bash
# List recent deployments
netlify deploys:list

# Restore specific deployment
netlify deploys:restore <deploy-id>
```

### Database Rollback

#### Via Supabase Dashboard

1. Go to **Database > Backups**
2. Select backup to restore
3. Click **Restore**

#### Via CLI

```bash
# List migrations
supabase migration list

# Rollback last migration
supabase migration down

# Rollback to specific version
supabase migration down --version 20231027000000
```

### Code Rollback

```bash
# Revert last commit
git revert HEAD

# Or reset to previous commit
git reset --hard HEAD~1
git push --force origin main  # Use with caution!

# Or checkout previous version
git checkout <commit-hash>
git push origin main
```

---

## Troubleshooting

### Common Issues

#### Build Fails on Netlify

**Problem:** Build fails with module not found error

**Solution:**
```bash
# Clear cache and rebuild
netlify build --clear-cache

# Check node version in netlify.toml
NODE_VERSION=20
```

#### Environment Variables Not Working

**Problem:** App can't connect to Supabase

**Solution:**
1. Verify variables in Netlify dashboard
2. Variable names must start with `VITE_` for Vite
3. Redeploy after adding variables

#### PWA Not Installing

**Problem:** Install prompt doesn't appear

**Solution:**
1. Check `manifest.json` is served correctly
2. Verify HTTPS is enabled
3. Check service worker registration in DevTools
4. Ensure all icons are available

#### Supabase Connection Timeout

**Problem:** API requests timeout

**Solution:**
```bash
# Check Supabase project status
supabase status

# Test connection
curl https://your-project.supabase.co/rest/v1/

# Verify RLS policies aren't blocking requests
```

#### GitHub Actions Failing

**Problem:** CI/CD workflows fail

**Solution:**
1. Check secrets are set correctly
2. Verify token permissions
3. Check workflow logs for specific errors
4. Re-generate expired tokens

### Debug Commands

```bash
# Test production build locally
npm run build
npm run preview

# Check bundle size
npm run build
du -sh dist/

# Verify environment variables
printenv | grep VITE_

# Test Supabase connection
supabase db remote-commit

# Check Netlify deploy status
netlify status
```

### Support Resources

- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev
- **GitHub Actions Docs**: https://docs.github.com/actions

---

## Performance Checklist

Before deploying to production, verify:

- [ ] Lighthouse Performance Score > 90
- [ ] Lighthouse Accessibility Score > 95
- [ ] Lighthouse Best Practices Score > 90
- [ ] Lighthouse SEO Score > 90
- [ ] PWA Score > 90
- [ ] Total bundle size < 500KB
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] All images optimized (WebP format)
- [ ] Service worker caching configured
- [ ] HTTPS enabled
- [ ] Gzip/Brotli compression enabled
- [ ] CDN configured for static assets

---

## Security Checklist

Before deploying to production, verify:

- [ ] Environment variables secured (not in code)
- [ ] RLS policies enabled on all tables
- [ ] HTTPS enabled (SSL certificate)
- [ ] CSP headers configured
- [ ] CORS properly configured
- [ ] API keys rotated regularly
- [ ] Service role key never exposed to frontend
- [ ] Authentication implemented (if required)
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] SQL injection protection (use parameterized queries)
- [ ] Rate limiting configured
- [ ] Secrets stored in GitHub Secrets
- [ ] Regular dependency updates

---

## Next Steps

After successful deployment:

1. **Monitor Performance**: Set up alerts for performance degradation
2. **Test PWA Features**: Verify offline functionality, install prompt
3. **Set Up Analytics**: Track user behavior and app usage
4. **Configure Alerts**: Set up error monitoring and uptime checks
5. **Plan Updates**: Create a deployment schedule for features and fixes
6. **Document Changes**: Keep this deployment guide updated
7. **User Testing**: Gather feedback from real users
8. **Optimize Further**: Continuously improve performance metrics

---

**Deployment Guide Complete!**

For questions or issues, create an issue in the GitHub repository.
