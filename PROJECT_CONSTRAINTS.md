# DunApp PWA - Project Constraints

> **⚠️ KRITIKUS DOKUMENTUM**
> Ez a fájl tartalmazza azokat a constraint-eket amelyeket MINDEN session elején be kell vezetni Claude Code-nak.

**Létrehozva:** 2025-11-03
**Utolsó frissítés:** 2025-11-03
**Verzió:** 1.0

---

## 🚨 DEPLOYMENT CONSTRAINTS

### ❌ NO NETLIFY DEPLOYMENT

**Constraint:**
```
NINCS NETLIFY TOKEN
→ NEM lehet Netlify-ra deploy-olni
→ NEM használható Netlify CLI
→ NEM lehet production build push
```

**Miért:**
- Nincs Netlify hozzáférési token
- Nincs fizetős Netlify subscription
- Lokális fejlesztési környezet

**Mit lehet csinálni:**
- ✅ **Lokális tesztelés:** `npm run dev` (port 5173)
- ✅ **Build ellenőrzés:** `npm run build` (bundle size check)
- ✅ **Git commit & push:** GitHub repository sync
- ✅ **Manual browser testing:** localhost:5173
- ✅ **Bundle analysis:** `npm run build` output

**Mit NEM lehet csinálni:**
- ❌ `netlify deploy`
- ❌ `netlify dev`
- ❌ Netlify CLI commands
- ❌ Production URL generation
- ❌ Netlify Functions deployment
- ❌ Netlify environment variables setup

---

## 🧪 TESTING CONSTRAINTS

### LOCAL TESTING ONLY

**Testing workflow:**
```bash
# 1. Start development server
npm run dev

# 2. Open browser
# http://localhost:5173

# 3. Manual testing
# - Test all 3 modules (Meteorology, Water Level, Drought)
# - Check responsive design (mobile, tablet, desktop)
# - Verify data loading/error states
# - Test user interactions (selectors, maps, charts)

# 4. Build verification
npm run build
# Check bundle size in output

# 5. Type check
npm run type-check
# Ensure 0 TypeScript errors
```

**Test verification:**
- ✅ Visual inspection in browser (localhost:5173)
- ✅ Console log checking (no errors)
- ✅ Network tab inspection (API calls)
- ✅ Responsive design testing (DevTools)
- ✅ Bundle size verification (< 200KB gzipped main)

**No automated deployment:**
- ❌ NO Lighthouse CI (requires production URL)
- ❌ NO Netlify preview deployments
- ❌ NO staging environment

---

## 🔧 DEVELOPMENT WORKFLOW

### Approved Workflow

**1. Development:**
```bash
npm run dev
# Develop locally at localhost:5173
```

**2. Type checking:**
```bash
npm run type-check
# Ensure TypeScript strict mode compliance
```

**3. Linting:**
```bash
npm run lint
# Check code quality
```

**4. Build verification:**
```bash
npm run build
# Verify bundle size and build success
```

**5. Git workflow:**
```bash
git add .
git commit -m "feat: Your feature description"
git push origin main
# GitHub repository sync ONLY
```

### NOT Approved Workflow

**❌ Deployment attempts:**
```bash
# DO NOT RUN THESE:
netlify deploy                    # ❌ No token
netlify deploy --prod            # ❌ No token
netlify dev                      # ❌ Not needed
netlify functions:deploy         # ❌ Use Supabase Edge Functions
```

---

## 🌐 API & BACKEND CONSTRAINTS

### Supabase Backend ONLY

**What we use:**
- ✅ **Supabase PostgreSQL** - Database
- ✅ **Supabase Edge Functions** - Serverless backend
- ✅ **pg_cron** - Scheduled jobs
- ✅ **pg_net** - HTTP requests from database

**Deployment method:**
```bash
# Edge Functions deployment (Supabase CLI)
supabase functions deploy fetch-meteorology
supabase functions deploy fetch-water-level
supabase functions deploy fetch-drought
supabase functions deploy check-water-level-alerts
supabase functions deploy send-push-notification

# Database migrations
supabase db push
```

**NOT using:**
- ❌ Netlify Functions (használjuk Supabase Edge Functions helyett)
- ❌ Vercel Serverless Functions
- ❌ AWS Lambda
- ❌ Google Cloud Functions

---

## 📦 MCP CONFIGURATION CONSTRAINTS

### Project-Specific MCP ONLY

**Configuration file:**
```
.claude/mcp_servers.json
```

**What this means:**
- ✅ MCP config a projekt mappában (`.claude/`)
- ✅ Verziókezelhető (git-ben benne van)
- ✅ Projekt-specifikus (más projekteket nem érint)
- ✅ Könnyen megosztható

**NOT using:**
- ❌ Global Claude Desktop config (`~/Library/Application Support/Claude/`)
- ❌ System-wide MCP settings
- ❌ User-specific MCP config

**Configured MCP servers:**
1. `hydroinfo` - Water level scraping (hydroinfo.hu)
2. `aszalymonitoring` - Drought monitoring (sample data)

---

## 💰 COST CONSTRAINTS

### Zero-Cost Development

**Free tier usage:**
- ✅ Supabase Free Tier (500MB DB, 2GB bandwidth)
- ✅ GitHub Free (unlimited public repos)
- ✅ OpenWeatherMap Free (1,000 calls/day)
- ✅ Yr.no API Free (no limit)
- ✅ Local development (no hosting cost)

**Not using paid services:**
- ❌ Netlify Pro ($19/month)
- ❌ Vercel Pro ($20/month)
- ❌ Sentry paid plan ($26/month)
- ❌ Semgrep Team ($80/month)

---

## 🧠 AGENT USAGE CONSTRAINTS

### Available Agents

**Configured agents (9 total):**
- Master Architect (Opus 4.1)
- Frontend Engineer (Sonnet 4.5)
- Backend Engineer (Sonnet 4.5)
- Data Engineer (Sonnet 4.5)
- QA Tester (Sonnet 4.5)
- Security Analyst (Sonnet 4.5)
- DevOps Engineer (Haiku)
- UI/UX Designer (Sonnet 4.5)
- Documentation Writer (Haiku)

**Agent invocation:**
```bash
# Use Task tool with subagent_type
Task(subagent_type="frontend-engineer", prompt="...")
Task(subagent_type="master-architect", prompt="...")
```

**NOT using:**
- ❌ External AI services (GPT-4, etc.)
- ❌ Paid agent orchestration platforms
- ❌ Third-party agent frameworks

---

## 📝 DOCUMENTATION CONSTRAINTS

### Required Documentation Files

**Must maintain:**
- ✅ `CLAUDE.md` - Central reference (update after each phase)
- ✅ `SESSION_PROGRESS_YYYY-MM-DD.md` - Daily session logs
- ✅ `PROJECT_CONSTRAINTS.md` - This file
- ✅ `PROGRESS_LOG.md` - Overall progress tracking
- ✅ `.claude/README_MCP.md` - MCP usage guide

**Update frequency:**
- End of each session: SESSION_PROGRESS file
- End of each phase: CLAUDE.md
- When constraints change: PROJECT_CONSTRAINTS.md
- Weekly: PROGRESS_LOG.md

---

## 🔒 SECURITY CONSTRAINTS

### No Secrets in Repository

**What to protect:**
- ❌ API keys (OpenWeatherMap, Meteoblue)
- ❌ Supabase service role key
- ❌ VAPID private key
- ❌ Database passwords
- ❌ Authentication tokens

**How to protect:**
```bash
# .gitignore includes:
.env
.env.local
.env.vapid
*.key
secrets/
```

**Safe practices:**
- ✅ Use environment variables
- ✅ Store secrets in Supabase Vault
- ✅ Use Supabase secrets for Edge Functions
- ✅ Never hardcode API keys in code

---

## 🎯 PERFORMANCE CONSTRAINTS

### Bundle Size Budget

**Targets:**
```
Main bundle:       < 200 KB gzipped ✅ (currently 99.54 KB)
Total JavaScript:  < 500 KB gzipped ✅ (currently ~297 KB)
Module chunks:     < 20 KB each     ✅ (currently 16.66 KB)
```

**If exceeded:**
- ⚠️ Analyze bundle with `npm run build`
- ⚠️ Check for duplicate dependencies
- ⚠️ Consider code splitting (React.lazy)
- ⚠️ Review third-party library usage

---

## 🧪 TESTING CONSTRAINTS

### Deferred Testing

**E2E tests:**
- ⏳ **DEFERRED** until Phase 4-5 complete
- ⏳ Target: 80%+ coverage
- ⏳ Framework: Playwright (when implemented)

**Current testing:**
- ✅ Manual browser testing (localhost:5173)
- ✅ TypeScript strict mode (0 errors)
- ✅ Visual regression (manual inspection)
- ✅ 94 test files exist (not verified)

---

## 📞 SESSION START CHECKLIST

**Before EVERY session, verify:**

- [ ] Read `SESSION_PROGRESS_YYYY-MM-DD.md` (latest session log)
- [ ] Read `PROJECT_CONSTRAINTS.md` (this file)
- [ ] Understand: **NO NETLIFY DEPLOYMENT**
- [ ] Understand: **LOCAL TESTING ONLY**
- [ ] Check `CLAUDE.md` for latest project status
- [ ] Review git log (`git log --oneline -5`)

**Remind Claude Code:**
```
CONSTRAINT: NINCS Netlify token → csak lokális tesztelés (npm run dev)
NO DEPLOYMENT to Netlify, csak GitHub push!
```

---

## 🔄 HOW TO UPDATE THIS FILE

**When to update:**
- New constraint discovered
- Workflow change required
- Tool/service change
- Cost considerations change

**Who can update:**
- Project owner (Endre)
- Lead developer
- Master Architect agent (with approval)

**Update process:**
1. Identify new constraint
2. Add to appropriate section
3. Update version number (top of file)
4. Update "Utolsó frissítés" date
5. Commit with message: `docs: Update PROJECT_CONSTRAINTS - [reason]`
6. Inform all team members / AI agents

---

## ✅ SUMMARY TL;DR

**Kritikus constraint-ek:**
1. ❌ **NO NETLIFY** - nincs token, csak local testing
2. ✅ **Supabase backend ONLY** - Edge Functions, PostgreSQL
3. ✅ **Project-specific MCP** - `.claude/mcp_servers.json`
4. ✅ **Zero-cost development** - free tier services only
5. ✅ **Manual testing** - `npm run dev` + browser
6. ✅ **Git workflow** - commit & push only

**Testing workflow:**
```bash
npm run dev         # Start local server (localhost:5173)
npm run build       # Verify bundle size
npm run type-check  # Check TypeScript errors
git push origin main # GitHub sync ONLY (no Netlify)
```

---

**Verzió:** 1.0
**Következő review:** 2025-11-10 (ha változás van)
**Contact:** DunApp PWA project team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
