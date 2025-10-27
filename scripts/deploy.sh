#!/bin/bash

###############################################################################
# DunApp PWA - Production Deployment Script
###############################################################################
#
# This script automates the deployment process:
# 1. Runs tests to ensure code quality
# 2. Builds production bundle
# 3. Deploys to Netlify
# 4. Runs health check on deployment
#
# Usage:
#   ./scripts/deploy.sh [--skip-tests] [--preview]
#
# Flags:
#   --skip-tests    Skip running tests (not recommended for production)
#   --preview       Deploy to preview URL instead of production
#
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${PROJECT_ROOT}/dist"
SKIP_TESTS=false
PREVIEW=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --preview)
      PREVIEW=true
      shift
      ;;
    --help)
      echo "Usage: $0 [--skip-tests] [--preview]"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

###############################################################################
# Functions
###############################################################################

print_step() {
  echo -e "${BLUE}==>${NC} ${1}"
}

print_success() {
  echo -e "${GREEN}✓${NC} ${1}"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} ${1}"
}

print_error() {
  echo -e "${RED}✗${NC} ${1}"
}

check_dependencies() {
  print_step "Checking dependencies..."

  # Check Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
  fi

  # Check npm
  if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
  fi

  # Check Netlify CLI
  if ! command -v netlify &> /dev/null; then
    print_warning "Netlify CLI not found, installing..."
    npm install -g netlify-cli
  fi

  print_success "All dependencies are available"
}

check_environment() {
  print_step "Checking environment variables..."

  if [ -z "${VITE_SUPABASE_URL:-}" ]; then
    print_error "VITE_SUPABASE_URL is not set"
    print_warning "Set it in .env.local or export it"
    exit 1
  fi

  if [ -z "${VITE_SUPABASE_ANON_KEY:-}" ]; then
    print_error "VITE_SUPABASE_ANON_KEY is not set"
    print_warning "Set it in .env.local or export it"
    exit 1
  fi

  print_success "Environment variables are set"
}

run_tests() {
  if [ "$SKIP_TESTS" = true ]; then
    print_warning "Skipping tests (not recommended for production)"
    return 0
  fi

  print_step "Running tests..."

  cd "$PROJECT_ROOT"

  # Run linting
  print_step "Running ESLint..."
  npm run lint
  print_success "Linting passed"

  # Run type checking
  print_step "Running TypeScript type check..."
  npx tsc --noEmit
  print_success "Type checking passed"

  # Run unit tests
  print_step "Running unit tests..."
  npm run test:coverage
  print_success "All tests passed"
}

build_production() {
  print_step "Building production bundle..."

  cd "$PROJECT_ROOT"

  # Clean previous build
  if [ -d "$DIST_DIR" ]; then
    rm -rf "$DIST_DIR"
    print_success "Cleaned previous build"
  fi

  # Build
  npm run build

  if [ ! -d "$DIST_DIR" ]; then
    print_error "Build failed: dist directory not found"
    exit 1
  fi

  # Check bundle size
  BUNDLE_SIZE=$(du -sh "$DIST_DIR" | awk '{print $1}')
  print_success "Build completed successfully (Size: $BUNDLE_SIZE)"

  # Warn if bundle is too large
  BUNDLE_SIZE_KB=$(du -sk "$DIST_DIR" | awk '{print $1}')
  if [ "$BUNDLE_SIZE_KB" -gt 512000 ]; then
    print_warning "Bundle size is larger than 500MB, consider optimization"
  fi
}

deploy_to_netlify() {
  print_step "Deploying to Netlify..."

  cd "$PROJECT_ROOT"

  # Check if logged in
  if ! netlify status &> /dev/null; then
    print_error "Not logged in to Netlify"
    print_warning "Run 'netlify login' first"
    exit 1
  fi

  # Deploy
  if [ "$PREVIEW" = true ]; then
    print_step "Deploying to preview URL..."
    DEPLOY_OUTPUT=$(netlify deploy --dir="$DIST_DIR" 2>&1)
  else
    print_step "Deploying to production..."
    DEPLOY_OUTPUT=$(netlify deploy --prod --dir="$DIST_DIR" 2>&1)
  fi

  echo "$DEPLOY_OUTPUT"

  # Extract deployment URL
  DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9\-]+\.netlify\.app' | head -1)

  if [ -z "$DEPLOY_URL" ]; then
    print_error "Failed to extract deployment URL"
    exit 1
  fi

  print_success "Deployed to: $DEPLOY_URL"

  # Export for health check
  export DEPLOY_URL
}

health_check() {
  print_step "Running health check..."

  if [ -z "${DEPLOY_URL:-}" ]; then
    print_error "DEPLOY_URL not set"
    exit 1
  fi

  # Wait for deployment to stabilize
  print_step "Waiting 10 seconds for deployment to stabilize..."
  sleep 10

  # Check HTTP status
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL")

  if [ "$STATUS_CODE" -eq 200 ]; then
    print_success "Health check passed (Status: $STATUS_CODE)"
  else
    print_error "Health check failed (Status: $STATUS_CODE)"
    exit 1
  fi

  # Check if content is loaded
  CONTENT=$(curl -s "$DEPLOY_URL")
  if echo "$CONTENT" | grep -q "DunApp"; then
    print_success "Content verification passed"
  else
    print_warning "Content verification failed (app may not have loaded correctly)"
  fi
}

deployment_summary() {
  print_step "Deployment Summary"
  echo ""
  echo "  Deployment URL: $DEPLOY_URL"
  echo "  Bundle Size: $(du -sh "$DIST_DIR" | awk '{print $1}')"
  echo "  Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  print_success "Deployment completed successfully!"
  echo ""
  print_step "Next steps:"
  echo "  1. Test the deployed application"
  echo "  2. Check Lighthouse CI results in GitHub Actions"
  echo "  3. Monitor logs in Netlify dashboard"
  echo "  4. Verify PWA features (offline mode, install prompt)"
  echo ""
}

###############################################################################
# Main Execution
###############################################################################

main() {
  echo ""
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║         DunApp PWA - Production Deployment Script            ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo ""

  check_dependencies
  check_environment
  run_tests
  build_production
  deploy_to_netlify
  health_check
  deployment_summary
}

# Run main function
main

exit 0
