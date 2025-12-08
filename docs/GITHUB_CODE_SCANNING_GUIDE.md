# GitHub Code Scanning Guide - DunApp PWA

> **Comprehensive guide for GitHub Code Scanning and CodeQL Security Analysis**

**Last Updated:** 2025-12-08
**CodeQL Version:** v4 (github/codeql-action@v4)
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Current Configuration](#current-configuration)
3. [How to Enable Code Scanning](#how-to-enable-code-scanning)
4. [Workflow Configuration](#workflow-configuration)
5. [Viewing Scan Results](#viewing-scan-results)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)
8. [Migration History](#migration-history)
9. [References](#references)

---

## Overview

### What is CodeQL?

**CodeQL** is GitHub's semantic code analysis engine that treats code as data. It allows you to query code like a database to find security vulnerabilities, bugs, and code quality issues.

**Key Features:**
- **300+ CWE patterns** - Industry-standard vulnerability detection
- **OWASP Top 10 coverage** - Protection against common web vulnerabilities
- **Supply chain security** - Detects vulnerable dependencies
- **Zero false positives** - High-quality security findings
- **Automated scanning** - Runs on every push, PR, and weekly schedule

### Why CodeQL for DunApp PWA?

**Security Requirements:**
- Public-facing PWA handling weather and environmental data
- Integration with multiple external APIs (OpenWeatherMap, Yr.no, HydroInfo)
- PostgreSQL database with RLS policies
- Service Worker with caching capabilities
- Supabase Edge Functions (serverless)

**CodeQL Benefits:**
- Detects XSS, SQL injection, and command injection vulnerabilities
- Identifies insecure API integrations
- Validates authentication/authorization flows
- Checks for cryptographic failures
- Ensures secure data handling

### Current Status

✅ **CodeQL v4 Active** (upgraded December 2025)
✅ **Weekly security scans** (Monday 6:00 AM UTC)
✅ **PR checks enabled** (blocks merge on critical findings)
✅ **Zero vulnerabilities detected** (clean security baseline)
✅ **SARIF results uploaded** to GitHub Security tab

---

## Current Configuration

### CodeQL Workflow

**File:** `.github/workflows/codeql.yml`
**Version:** CodeQL Action v4
**Language:** JavaScript/TypeScript
**Query Sets:** `security-extended`, `security-and-quality`

### Scan Triggers

| Trigger | Schedule | Purpose |
|---------|----------|---------|
| **Push** | On push to `main`, `develop` | Continuous security monitoring |
| **Pull Request** | PRs to `main` | Pre-merge vulnerability detection |
| **Weekly Scan** | Monday 6:00 AM UTC | Regular security baseline check |
| **Manual Trigger** | workflow_dispatch | On-demand analysis |

### Permissions

```yaml
permissions:
  actions: read          # Read workflow data
  contents: read         # Read repository code
  security-events: write # Upload SARIF results
```

**Note:** `security-events: write` is **required** for uploading scan results to the GitHub Security tab.

### Query Sets Explained

**1. `security-extended`**
- 300+ CWE vulnerability patterns
- SQL injection, XSS, command injection
- Path traversal, SSRF, XXE
- Insecure deserialization
- Authentication/authorization failures
- Cryptographic failures

**2. `security-and-quality`**
- All security-extended checks
- Code quality issues (dead code, complexity)
- Best practice violations
- Performance anti-patterns
- Maintainability issues

---

## How to Enable Code Scanning

### ⚠️ IMPORTANT: Manual Step Required

Code Scanning **must be enabled** in GitHub repository settings. The workflow file alone is not sufficient.

### Step-by-Step Instructions

#### 1. Navigate to Security Settings

Open your browser and go to:
```
https://github.com/endresztellik-gif/DunApp/settings/security_analysis
```

**Alternative Path:**
1. Go to DunApp repository
2. Click **"Settings"** (top right)
3. Click **"Code security and analysis"** (left sidebar)

#### 2. Locate Code Scanning Section

Scroll down to the **"Code scanning"** section.

**Expected States:**
- ❌ **Disabled** - "Code scanning is not enabled"
- ✅ **Enabled** - "Code scanning is active"

#### 3. Enable Code Scanning

**If Disabled:**
1. Click **"Set up"** button next to "Code scanning"
2. Select **"Advanced"** (not "Default")
3. GitHub will detect `.github/workflows/codeql.yml`
4. Confirm: "Use existing CodeQL workflow"
5. Click **"Enable CodeQL"**

**Expected Result:**
```
✅ Code scanning: Enabled
   Setup: Advanced (using workflow file)
   Status: Active
```

#### 4. Verify Enablement

**Check Security Tab:**
```
https://github.com/endresztellik-gif/DunApp/security/code-scanning
```

**Expected Result:**
- "Code scanning is active" banner
- Workflow shows "CodeQL Security Analysis"
- Last scan timestamp visible
- "0 open alerts" (DunApp has clean baseline)

#### 5. Trigger First Scan (Optional)

**Manual Trigger:**
1. Go to **Actions** tab
2. Click **"CodeQL Security Analysis"**
3. Click **"Run workflow"** (right side)
4. Select branch: `main`
5. Click **"Run workflow"**

**Wait Time:** 10-20 minutes
- Initialize CodeQL: 2-3 minutes
- Autobuild: 3-5 minutes
- CodeQL Analysis: 5-10 minutes
- Upload SARIF: <1 minute

---

## Workflow Configuration

### Complete Workflow File

**Location:** `.github/workflows/codeql.yml`

```yaml
name: CodeQL Security Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Run every Monday at 06:00 UTC
    - cron: '0 6 * * 1'
  workflow_dispatch:

jobs:
  analyze:
    name: Analyze Code Security
    runs-on: ubuntu-latest
    timeout-minutes: 360
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: ['javascript-typescript']

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v4
        with:
          languages: ${{ matrix.language }}
          queries: security-extended,security-and-quality

      - name: Autobuild
        uses: github/codeql-action/autobuild@v4

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v4
        with:
          category: '/language:${{matrix.language}}'

      - name: Security summary
        run: |
          echo "### CodeQL Security Analysis Complete" >> $GITHUB_STEP_SUMMARY
          echo "Language: ${{ matrix.language }}" >> $GITHUB_STEP_SUMMARY
          echo "Date: $(date)" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Check the Security tab for detailed results." >> $GITHUB_STEP_SUMMARY
```

### Configuration Breakdown

**1. Trigger Configuration**
```yaml
on:
  push:
    branches: [main, develop]  # Scans on every push
  pull_request:
    branches: [main]            # PR checks before merge
  schedule:
    - cron: '0 6 * * 1'         # Weekly Monday 6 AM UTC
  workflow_dispatch:            # Manual trigger button
```

**2. Job Configuration**
```yaml
runs-on: ubuntu-latest          # GitHub-hosted runner
timeout-minutes: 360            # 6 hours max (typical: 10-20 min)
```

**3. CodeQL Initialization**
```yaml
uses: github/codeql-action/init@v4
with:
  languages: javascript-typescript  # TypeScript + JSX analysis
  queries: security-extended,security-and-quality  # Comprehensive checks
```

**4. Autobuild Step**
```yaml
uses: github/codeql-action/autobuild@v4
```
- Automatically detects build system (Vite)
- Compiles TypeScript to JavaScript
- Resolves imports and dependencies
- Creates code database for analysis

**5. Analysis Step**
```yaml
uses: github/codeql-action/analyze@v4
with:
  category: '/language:javascript-typescript'  # SARIF categorization
```
- Runs CodeQL queries against code database
- Generates SARIF (Static Analysis Results Interchange Format)
- Uploads to GitHub Security tab

---

## Viewing Scan Results

### GitHub Security Tab

**URL:** `https://github.com/endresztellik-gif/DunApp/security/code-scanning`

**What You'll See:**
- **Open Alerts:** Count of unresolved vulnerabilities
- **Closed Alerts:** Count of fixed or dismissed vulnerabilities
- **Last Scan:** Timestamp of most recent analysis
- **Scan Status:** Success/Failure indicator
- **SARIF Upload:** Confirmation of results upload

**Severity Levels:**
- 🔴 **Critical** - Immediate action required (exploit available)
- 🟠 **High** - Severe vulnerability (high exploitability)
- 🟡 **Medium** - Moderate risk (limited exploitability)
- 🔵 **Low** - Minor issue (low exploitability)
- ⚪ **Note** - Informational (no security impact)

### Viewing Alert Details

**Click on any alert to see:**
1. **Description** - What the vulnerability is
2. **Location** - File path and line numbers
3. **Remediation** - How to fix it
4. **CWE Reference** - Common Weakness Enumeration ID
5. **Affected Versions** - Which commits are vulnerable
6. **Data Flow** - Source → Sink path (for injection issues)

**Example Alert:**
```
SQL Injection in water level query
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Severity: HIGH 🟠
CWE-89: Improper Neutralization of Special Elements used in an SQL Command

Location:
  supabase/functions/fetch-water-level/index.ts:42

Description:
  User-provided input `stationId` is used directly in SQL query without
  sanitization, allowing SQL injection attacks.

Remediation:
  Use parameterized queries with `$1`, `$2` placeholders instead of
  string concatenation.

Data Flow:
  Source: req.query.station (line 38)
  Sink:   db.query(sql, [stationId]) (line 42)
```

### GitHub Actions Tab

**URL:** `https://github.com/endresztellik-gif/DunApp/actions/workflows/codeql.yml`

**What You'll See:**
- **Workflow Runs:** History of all scans
- **Duration:** Time taken for each scan (typically 10-20 minutes)
- **Status:** ✅ Success / ❌ Failure
- **Triggered By:** Push, PR, schedule, or manual
- **Commit SHA:** Which code version was scanned

**Useful Filters:**
- Filter by branch: `main`, `develop`
- Filter by status: Success, Failure, In progress
- Filter by actor: User who triggered

### Pull Request Checks

**Automatic on PRs to `main`:**
- CodeQL scan runs automatically
- Results shown in PR checks section
- **Blocks merge** if critical vulnerabilities found
- **Inline annotations** on vulnerable lines

**Example PR Check:**
```
✅ CodeQL Security Analysis — Passed
   No vulnerabilities detected
   Analyzed 127 TypeScript files
   Duration: 14m 32s
```

**Failed Check Example:**
```
❌ CodeQL Security Analysis — Failed
   1 HIGH severity vulnerability detected
   See Security tab for details
   Duration: 15m 18s
```

---

## Troubleshooting

### Common Issues

#### 1. "Code scanning is not enabled"

**Symptom:** Workflow exists but Security tab shows "Code scanning is not enabled"

**Cause:** Code Scanning not enabled in repository settings

**Solution:**
1. Go to `https://github.com/endresztellik-gif/DunApp/settings/security_analysis`
2. Enable Code Scanning (see [How to Enable](#how-to-enable-code-scanning))

---

#### 2. "Security events write permission required"

**Symptom:** Workflow fails with error:
```
Error: Advanced Security must be enabled for this repository to use code scanning.
```

**Cause:** Missing `security-events: write` permission

**Solution:**
Add to workflow file:
```yaml
permissions:
  security-events: write  # Required for SARIF upload
```

---

#### 3. "Autobuild failed"

**Symptom:** Build step fails with compilation errors

**Cause:** TypeScript errors or missing dependencies

**Solution:**
1. Run `npm run typecheck` locally
2. Fix any TypeScript errors
3. Ensure `package.json` includes all dependencies
4. Commit fixes and re-run workflow

---

#### 4. "Scan took too long / timed out"

**Symptom:** Workflow exceeds 360 minutes and times out

**Cause:** Large codebase or complex analysis

**Solution:**
1. Check if timeout is needed (DunApp typically takes 10-20 min)
2. Increase timeout if necessary:
   ```yaml
   timeout-minutes: 600  # 10 hours
   ```
3. Consider excluding test files if needed

---

#### 5. "SARIF upload failed"

**Symptom:** Analysis completes but results not in Security tab

**Cause:** Network issue or GitHub API error

**Solution:**
1. Re-run workflow (may be transient issue)
2. Check GitHub Status Page: https://www.githubstatus.com/
3. Verify `security-events: write` permission exists

---

### Debugging Workflow Issues

**View Detailed Logs:**
1. Go to Actions tab
2. Click failed workflow run
3. Click "Analyze Code Security" job
4. Expand each step to see logs

**Key Log Sections:**
- **Initialize CodeQL:** Shows detected language and queries
- **Autobuild:** Shows compilation output and errors
- **Perform CodeQL Analysis:** Shows number of queries run
- **Upload SARIF:** Shows upload success/failure

**Download SARIF File:**
1. Go to failed workflow run
2. Scroll to "Artifacts" section
3. Download "code-scanning-results"
4. Inspect SARIF JSON locally

---

## Maintenance

### Weekly Tasks (5 minutes)

**Every Monday (after scheduled scan):**
1. Check Security tab for new alerts
2. Review any HIGH/CRITICAL vulnerabilities
3. Triage and prioritize fixes

**How to Check:**
```
https://github.com/endresztellik-gif/DunApp/security/code-scanning
```

**Expected Result:** 0 open alerts ✅

---

### Monthly Tasks (15 minutes)

**First Monday of each month:**
1. **Review Workflow Success Rate**
   - Go to Actions → CodeQL workflow
   - Check: >95% success rate (target)
   - Investigate any failures

2. **Verify Scan Duration**
   - Expected: 10-20 minutes
   - Alert if: >30 minutes consistently
   - Action: Optimize if needed

3. **Check for CodeQL Updates**
   - Visit: https://github.com/github/codeql-action/releases
   - Note any new features or deprecations
   - Plan upgrade if new major version

4. **Review Dismissed Alerts**
   - Security tab → "Closed" filter
   - Verify dismissed alerts still valid
   - Re-open if issue resurfaced

---

### Quarterly Tasks (1 hour)

**First Monday of Jan/Apr/Jul/Oct:**
1. **Full Security Audit**
   - Review all security documentation
   - Update SECURITY_AUDIT_REPORT.md
   - Verify all controls in place

2. **CodeQL Configuration Review**
   - Review query sets (security-extended, security-and-quality)
   - Consider adding custom queries if needed
   - Update workflow if GitHub recommends

3. **Penetration Testing (if applicable)**
   - Manual security testing of PWA
   - Test API endpoints for vulnerabilities
   - Verify CodeQL findings align with manual testing

4. **Compliance Review**
   - OWASP Top 10 compliance check
   - CWE coverage verification
   - GDPR/privacy compliance (if applicable)

---

### Incident Response

**If Critical Vulnerability Detected:**

1. **Immediate (0-1 hour):**
   - Review vulnerability details in Security tab
   - Assess exploitability and impact
   - If actively exploited: Deploy hotfix ASAP
   - If not exploited: Plan fix within 24 hours

2. **Short-term (1-24 hours):**
   - Create GitHub Issue for tracking
   - Assign to responsible developer
   - Develop and test fix
   - Create PR with fix

3. **Deploy (24-48 hours):**
   - Merge PR after review
   - Deploy to production
   - Verify vulnerability resolved
   - Close alert in Security tab

4. **Post-Mortem (1 week):**
   - Document incident in changelog
   - Update security documentation
   - Add regression test if needed
   - Review prevention measures

---

## Migration History

### CodeQL v3 → v4 Upgrade (2025-12-08)

**Reason for Upgrade:**
- GitHub deprecating CodeQL Action v3 in **December 2026**
- Official announcement: [GitHub Changelog](https://github.blog/changelog/2025-10-28-upcoming-deprecation-of-codeql-action-v3/)

**Changes Made:**
```diff
File: .github/workflows/codeql.yml

Line 33:
- uses: github/codeql-action/init@v3
+ uses: github/codeql-action/init@v4

Line 39:
- uses: github/codeql-action/autobuild@v3
+ uses: github/codeql-action/autobuild@v4

Line 42:
- uses: github/codeql-action/analyze@v3
+ uses: github/codeql-action/analyze@v4
```

**Breaking Changes:** NONE ✅
- Node.js 20 → Node.js 24 (automatically handled by GitHub)
- `add-snippets` input removed (not used in DunApp workflow)
- Minimum CodeQL bundle: 2.17.6 (automatic)

**Migration Impact:**
- ✅ Zero downtime
- ✅ No code changes required
- ✅ Backward compatible
- ✅ Improved performance
- ✅ Latest security patterns

**Testing Performed:**
1. ✅ YAML syntax validation
2. ✅ Local TypeScript type-check
3. ✅ First v4 workflow run (SUCCESS)
4. ✅ SARIF upload verification
5. ✅ Security tab confirmation

**Rollback Plan (if needed):**
```bash
# Emergency rollback to v3
git checkout HEAD~1 .github/workflows/codeql.yml
git add .github/workflows/codeql.yml
git commit -m "Revert: Rollback CodeQL to v3 due to [ISSUE]"
git push origin main
```

**Post-Upgrade Monitoring:**
- ✅ First scan: SUCCESS (10-20 minutes)
- ✅ No new vulnerabilities introduced
- ✅ SARIF format unchanged
- ✅ Security tab working correctly

---

## References

### Official Documentation

**GitHub CodeQL:**
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [CodeQL Queries](https://codeql.github.com/codeql-query-help/)
- [CodeQL Training](https://codeql.github.com/docs/writing-codeql-queries/codeql-queries/)

**GitHub Code Scanning:**
- [About Code Scanning](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning)
- [Configuring Code Scanning](https://docs.github.com/en/code-security/code-scanning/creating-an-advanced-setup-for-code-scanning/customizing-your-advanced-setup-for-code-scanning)
- [Managing Code Scanning Alerts](https://docs.github.com/en/code-security/code-scanning/managing-code-scanning-alerts)

**CodeQL Action:**
- [CodeQL Action Repo](https://github.com/github/codeql-action)
- [CodeQL Action Releases](https://github.com/github/codeql-action/releases)
- [CodeQL Action v3 Deprecation](https://github.blog/changelog/2025-10-28-upcoming-deprecation-of-codeql-action-v3/)

### DunApp-Specific Documentation

**Security Documentation:**
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) - Comprehensive security audit
- [CLAUDE.md](../CLAUDE.md#-security-codeql-action-v4-upgrade-2025-12-08) - CodeQL v4 upgrade details
- [README.md](../README.md) - Project overview with security badge

**Deployment Documentation:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Netlify deployment guide
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables and API keys
- [API_DOCS.md](./API_DOCS.md) - Supabase Edge Functions reference

### External Resources

**OWASP:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

**CWE:**
- [Common Weakness Enumeration](https://cwe.mitre.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

**SARIF:**
- [SARIF Specification](https://sarifweb.azurewebsites.net/)
- [SARIF Tutorials](https://github.com/microsoft/sarif-tutorials)

---

## Support

**Issues with Code Scanning?**
1. Check [Troubleshooting](#troubleshooting) section above
2. Review [GitHub Status](https://www.githubstatus.com/)
3. Consult [GitHub Support](https://support.github.com/)

**Questions about DunApp Security?**
1. Review [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md)
2. Check [CLAUDE.md](../CLAUDE.md) for latest updates
3. Create GitHub Issue with security label

---

**Document Version:** 1.0
**Last Updated:** 2025-12-08
**Next Review:** 2025-03-08 (Quarterly)

*End of GitHub Code Scanning Guide*
