#!/bin/bash

# DunApp PWA - Security Quick Fix Script
# This script helps remediate the CRITICAL API key exposure issue
# Run this IMMEDIATELY before deployment

set -e  # Exit on error

echo "=========================================="
echo "DunApp PWA - Security Remediation Script"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will remove .env files from your repository"
echo "Make sure you have backed up your API keys before proceeding!"
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ ERROR: Not in a git repository!"
    exit 1
fi

# Confirmation
read -p "Are you ready to proceed? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "=========================================="
echo "Step 1/5: Removing .env from repository"
echo "=========================================="

# Remove .env files from git tracking
if [ -f .env ]; then
    git rm --cached .env
    echo "✅ Removed .env from git tracking"
else
    echo "⚠️  .env not found (already removed?)"
fi

if [ -f .env.vapid ]; then
    git rm --cached .env.vapid
    echo "✅ Removed .env.vapid from git tracking"
else
    echo "⚠️  .env.vapid not found (already removed?)"
fi

echo ""
echo "=========================================="
echo "Step 2/5: Committing changes"
echo "=========================================="

git commit -m "security: Remove sensitive .env files from repository

SECURITY AUDIT: API keys were accidentally committed.
This commit removes .env and .env.vapid from the repository.

Action items:
- Rotate all API keys (OpenWeather, Meteoblue, VAPID)
- Clean git history with BFG or git-filter-repo
- Set environment variables in Netlify and Supabase dashboards

Ref: SECURITY_AUDIT_REPORT_2025-11-09.md"

echo "✅ Committed .env removal"

echo ""
echo "=========================================="
echo "Step 3/5: Pushing to remote"
echo "=========================================="

read -p "Push to remote now? (yes/no): " push_confirm
if [ "$push_confirm" = "yes" ]; then
    git push origin main
    echo "✅ Pushed to remote"
else
    echo "⚠️  Skipped push (run 'git push origin main' manually)"
fi

echo ""
echo "=========================================="
echo "Step 4/5: Verifying .gitignore"
echo "=========================================="

if grep -q "^\.env$" .gitignore; then
    echo "✅ .env is in .gitignore"
else
    echo "⚠️  WARNING: .env not found in .gitignore!"
    echo "   Adding it now..."
    echo ".env" >> .gitignore
    echo "✅ Added .env to .gitignore"
fi

if grep -q "^\.env\.vapid$" .gitignore; then
    echo "✅ .env.vapid is in .gitignore"
else
    echo "⚠️  WARNING: .env.vapid not found in .gitignore!"
    echo "   Adding it now..."
    echo ".env.vapid" >> .gitignore
    echo "✅ Added .env.vapid to .gitignore"
fi

echo ""
echo "=========================================="
echo "Step 5/5: Next Steps Summary"
echo "=========================================="

echo ""
echo "✅ COMPLETED:"
echo "   - Removed .env files from git tracking"
echo "   - Committed and pushed changes"
echo "   - Verified .gitignore configuration"
echo ""
echo "⚠️  TODO (CRITICAL - Do this MANUALLY):"
echo ""
echo "1. ROTATE ALL API KEYS:"
echo "   OpenWeather: https://home.openweathermap.org/api_keys"
echo "   Meteoblue:   https://www.meteoblue.com/en/weather-api/api-key"
echo "   VAPID:       Run: npx web-push generate-vapid-keys"
echo ""
echo "2. CLEAN GIT HISTORY:"
echo "   Option A (Recommended):"
echo "     brew install bfg"
echo "     git clone --mirror <repo-url>"
echo "     cd <repo>.git"
echo "     bfg --delete-files .env"
echo "     bfg --delete-files .env.vapid"
echo "     git reflog expire --expire=now --all"
echo "     git gc --prune=now --aggressive"
echo "     git push --force"
echo ""
echo "   Option B (Alternative):"
echo "     brew install git-filter-repo"
echo "     git filter-repo --invert-paths --path .env --path .env.vapid --force"
echo "     git push origin --force --all"
echo ""
echo "3. SET ENVIRONMENT VARIABLES:"
echo "   Netlify Dashboard → Site Settings → Environment Variables:"
echo "     - VITE_SUPABASE_URL"
echo "     - VITE_SUPABASE_ANON_KEY"
echo "     - VITE_VAPID_PUBLIC_KEY"
echo ""
echo "   Supabase Dashboard → Edge Functions → Secrets:"
echo "     - OPENWEATHER_API_KEY"
echo "     - METEOBLUE_API_KEY"
echo "     - VAPID_PRIVATE_KEY"
echo "     - VAPID_SUBJECT"
echo ""
echo "4. VERIFY DEPLOYMENT:"
echo "   - Test with new API keys"
echo "   - Verify no secrets in git history"
echo "   - Deploy to production"
echo ""
echo "=========================================="
echo "For detailed instructions, see:"
echo "  - SECURITY_AUDIT_SUMMARY.md"
echo "  - SECURITY_AUDIT_REPORT_2025-11-09.md"
echo "=========================================="
echo ""

# Success
echo "✅ Security quick fix completed!"
echo "⚠️  Remember to manually complete steps 1-4 above!"
exit 0
