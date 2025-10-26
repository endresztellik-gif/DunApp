# DunApp PWA - Claude Code Agents

> **Specialized AI Agents for DunApp PWA Development**

**Created:** 2025-10-26
**Total Agents:** 9
**Based on:** MCP_AND_AGENTS_GUIDE.md v1.0

---

## 📋 AGENT ROSTER

### 🏛️ Agent 0: Master Architect
**Model:** Claude Opus 4.1
**File:** `master-architect.md`
**Cost:** ~$225/month
**Role:** Project coordination, architectural decisions, agent delegation

**Use when:**
- Starting a new major feature or module
- Coordinating work across multiple agents
- Making critical architectural decisions
- Resolving conflicts between components
- Managing releases

---

### ⚛️ Agent 1: Frontend Engineer
**Model:** Claude Sonnet 4.5
**File:** `frontend-engineer.md`
**Cost:** ~$165/month
**Role:** React components, TypeScript, Tailwind CSS, Recharts, Leaflet

**Use when:**
- Building React components
- Creating TypeScript interfaces
- Implementing Tailwind CSS styling
- Adding charts (Recharts)
- Implementing maps (Leaflet)
- State management
- PWA features

---

### 🔧 Agent 2: Backend Engineer
**Model:** Claude Sonnet 4.5
**File:** `backend-engineer.md`
**Cost:** ~$132/month
**Role:** Supabase Edge Functions, SQL, RLS policies, cron jobs

**Use when:**
- Creating Supabase Edge Functions
- Writing SQL schemas and migrations
- Setting up RLS policies
- Configuring cron jobs
- API error handling
- Backend testing

---

### 🗄️ Agent 3: Data Engineer
**Model:** Claude Sonnet 4.5
**File:** `data-engineer.md`
**Cost:** ~$99/month
**Role:** API integration, web scraping, ETL pipelines

**Use when:**
- Integrating external APIs (OpenWeather, Meteoblue, etc.)
- Building web scrapers (vizugy.hu, hydroinfo.hu)
- Parsing CSV/JSON data
- Data validation and transformation
- ETL pipeline development

---

### 🧪 Agent 4: QA Tester
**Model:** Claude Sonnet 4.5
**File:** `qa-tester.md`
**Cost:** ~$198/month
**Role:** Unit tests, E2E tests, coverage reports

**Use when:**
- Writing unit tests (Vitest/Jest)
- Creating E2E tests (Playwright)
- Testing accessibility (WCAG AA)
- Generating coverage reports
- Bug verification

---

### 🔒 Agent 5: Security Analyst
**Model:** Claude Sonnet 4.5
**File:** `security-analyst.md`
**Cost:** ~$84/month
**Role:** Security audits, vulnerability scanning, OWASP compliance

**Use when:**
- Running Semgrep security scans
- Checking for hardcoded API keys
- Scanning dependencies (Snyk)
- Verifying OWASP Top 10 compliance
- Reviewing CORS configurations
- Auditing environment variables

---

### 🚀 Agent 6: DevOps Engineer
**Model:** Claude Haiku ⭐ (cost-effective)
**File:** `devops-engineer.md`
**Cost:** ~$2/month
**Role:** CI/CD, deployment, monitoring

**Use when:**
- Setting up GitHub Actions workflows
- Deploying to Netlify
- Configuring environment variables
- Setting up monitoring (Sentry, UptimeRobot)
- Managing Lighthouse CI
- Creating backup strategies

---

### 🎨 Agent 7: UI/UX Designer
**Model:** Claude Sonnet 4.5
**File:** `uiux-designer.md`
**Cost:** ~$57/month
**Role:** Design system, accessibility, responsive layouts

**Use when:**
- Reviewing component UI/UX
- Ensuring Tailwind consistency
- Checking WCAG AA compliance
- Validating responsive design
- Maintaining color palette
- Managing icon library

---

### 📝 Agent 8: Documentation Writer
**Model:** Claude Haiku ⭐ (cost-effective)
**File:** `documentation-writer.md`
**Cost:** ~$2/month
**Role:** README, API docs, code comments, changelogs

**Use when:**
- Writing/updating README.md
- Creating API documentation
- Adding JSDoc comments
- Maintaining CHANGELOG.md
- Writing deployment guides
- Creating user guides

---

## 💰 COST BREAKDOWN

### Full Agent Fleet
```
Master Architect:         $225/month
Frontend Engineer:        $165/month
Backend Engineer:         $132/month
Data Engineer:            $99/month
QA Tester:               $198/month
Security Analyst:         $84/month
DevOps Engineer:          $2/month   ⭐ (Haiku)
UI/UX Designer:           $57/month
Documentation Writer:     $2/month   ⭐ (Haiku)
────────────────────────────────────
TOTAL:                   $964/month
```

### Budget-Friendly Starter Pack
```
Master Architect:         $225/month (coordination)
Frontend Engineer:        $165/month (components)
Backend Engineer:         $132/month (Edge Functions)
DevOps Engineer:          $2/month   (deployment)
────────────────────────────────────
TOTAL:                   $524/month
```

### Minimal Setup
```
Master Architect:         $225/month
DevOps Engineer:          $2/month
────────────────────────────────────
TOTAL:                   $227/month
```

---

## 🚀 USAGE GUIDE

### Method 1: Direct Reference (Manual)

Simply tell Claude Code which agent context to use:

```
"Act as the Frontend Engineer agent.
Read frontend-engineer.md and create the CitySelector component
following the specifications in CLAUDE.md."
```

### Method 2: Master Architect Coordination

```
"Act as the Master Architect.
Delegate the following task to the appropriate agent:
- Build the Meteorology Module with all components"
```

The Master Architect will then coordinate:
1. UI/UX Designer reviews design
2. Frontend Engineer builds components
3. Data Engineer integrates OpenWeather API
4. Backend Engineer creates Edge Functions
5. Security Analyst scans for vulnerabilities
6. QA Tester writes tests
7. DevOps Engineer deploys

### Method 3: Skills-Based Invocation

If Claude Code supports automatic skill invocation (check documentation):

```
"Create a React component for city selection"
→ Automatically invokes frontend-engineer agent
```

---

## 📚 REQUIRED READING

All agents MUST read these files before starting tasks:

### Essential (All Agents)
- **CLAUDE.md** - Central reference document
- **MCP_AND_AGENTS_GUIDE.md** - Agent coordination guide

### Module-Specific
- **docs/PROJECT_SUMMARY.md** - Module specifications
- **docs/DESIGN_SPECIFICATION.md** - UI/UX requirements
- **docs/DATA_STRUCTURES.md** - TypeScript interfaces
- **DATA_SOURCES.md** - API integration details

---

## 🎯 WORKFLOW EXAMPLES

### Example 1: Building a New Module

```
User: "Build the Meteorology Module"

Master Architect:
├─ 1. Read CLAUDE.md thoroughly
├─ 2. Delegate to UI/UX Designer → review design specs
├─ 3. Delegate to Frontend Engineer → build components
│     ├─ CitySelector
│     ├─ WeatherDisplay
│     └─ WeatherChart
├─ 4. Delegate to Data Engineer → integrate OpenWeather API
├─ 5. Delegate to Backend Engineer → create Edge Function
├─ 6. Delegate to Security Analyst → scan for vulnerabilities
├─ 7. Delegate to QA Tester → write unit tests
├─ 8. Review all work
└─ 9. Delegate to DevOps Engineer → deploy to staging
```

### Example 2: Fixing a Bug

```
User: "The CitySelector dropdown doesn't close on mobile"

Master Architect:
├─ 1. Delegate to Frontend Engineer → investigate and fix
├─ 2. Delegate to QA Tester → write test to prevent regression
├─ 3. Delegate to UI/UX Designer → verify mobile UX
└─ 4. Delegate to DevOps Engineer → deploy hotfix
```

### Example 3: Security Audit

```
User: "Run a complete security audit"

Master Architect:
├─ 1. Delegate to Security Analyst → run Semgrep + Snyk scans
├─ 2. If critical issues found → BLOCK deployment
├─ 3. Delegate to appropriate agent → fix issues
│     ├─ Frontend Engineer (if frontend issue)
│     ├─ Backend Engineer (if backend issue)
│     └─ Data Engineer (if API integration issue)
├─ 4. Delegate to Security Analyst → re-scan
└─ 5. Generate security audit report
```

---

## ⚠️ CRITICAL RULES

All agents MUST follow these rules:

### 1. Module-Specific Selectors
```
❌ FORBIDDEN: Global city/station selector
✅ REQUIRED: 4 separate module-specific selectors
```

### 2. TypeScript Strict Mode
```
❌ FORBIDDEN: 'any' types
✅ REQUIRED: Proper type definitions
```

### 3. Tailwind CSS Only
```
❌ FORBIDDEN: Custom CSS or inline styles
✅ REQUIRED: Tailwind utility classes
```

### 4. No Hardcoded Secrets
```
❌ FORBIDDEN: Hardcoded API keys
✅ REQUIRED: Environment variables
```

### 5. Testing Requirements
```
✅ REQUIRED: 80%+ test coverage
✅ REQUIRED: Unit + E2E tests
```

### 6. Security Scans
```
✅ REQUIRED: Semgrep scan before every deployment
✅ REQUIRED: No critical vulnerabilities
```

---

## 🔗 MCP SERVERS INTEGRATION

Agents have access to these MCP servers:

- **github** - Repository operations
- **filesystem** - File operations
- **supabase** - Database operations
- **fetch** - API calls
- **puppeteer** - Web scraping
- **semgrep** - Security scanning
- **lighthouse** - Performance audits
- **sentry** - Error monitoring

Refer to `MCP_AND_AGENTS_GUIDE.md` for detailed MCP usage.

---

## 📊 AGENT USAGE METRICS

Track which agents are used most:

```
Most Used:
├─ Master Architect (coordination)
├─ Frontend Engineer (components)
└─ Backend Engineer (Edge Functions)

Cost-Effective:
├─ DevOps Engineer (Haiku - $2/month)
└─ Documentation Writer (Haiku - $2/month)

Specialized:
├─ Security Analyst (before deployments)
├─ QA Tester (after features)
└─ UI/UX Designer (design reviews)
```

---

## 🎓 BEST PRACTICES

1. **Start with Master Architect** for complex tasks
2. **Use Haiku agents** for simple, repetitive tasks (DevOps, Docs)
3. **Always run Security Analyst** before production deployment
4. **QA Tester** must verify 80%+ coverage
5. **Frontend + Backend + Data Engineers** work together on modules
6. **UI/UX Designer** reviews all frontend components
7. **Documentation Writer** keeps docs in sync with code

---

## 📞 SUPPORT

If an agent doesn't behave as expected:

1. Check the agent's `.md` file for instructions
2. Verify context files are being read (CLAUDE.md, etc.)
3. Ensure agent is following architecture rules
4. Review examples in MCP_AND_AGENTS_GUIDE.md

---

## ✅ QUICK CHECKLIST

Before starting development:

- [ ] All 9 agent files exist in `.claude/agents/`
- [ ] CLAUDE.md is up to date
- [ ] MCP servers are configured
- [ ] Environment variables are set
- [ ] Master Architect has read all context files

---

**Ready to build with AI agents! 🚀**

*DunApp PWA - Specialized Agent System v1.0*
*Created: 2025-10-26*
*Total Agents: 9*
*Monthly Cost: $227 - $964 (configurable)*
