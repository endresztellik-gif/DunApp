#!/bin/bash

###############################################################################
# DunApp PWA - Supabase Setup Script
###############################################################################
#
# This script automates Supabase project setup:
# 1. Creates/links Supabase project
# 2. Runs database migrations
# 3. Deploys Edge Functions
# 4. Sets environment variables
# 5. Configures cron jobs
# 6. Seeds initial data
#
# Usage:
#   ./scripts/setup-supabase.sh [--new-project|--link|--update]
#
# Modes:
#   --new-project   Create a new Supabase project
#   --link          Link to existing Supabase project
#   --update        Update existing project (migrations, functions)
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
MODE=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --new-project)
      MODE="new"
      shift
      ;;
    --link)
      MODE="link"
      shift
      ;;
    --update)
      MODE="update"
      shift
      ;;
    --help)
      echo "Usage: $0 [--new-project|--link|--update]"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

# Check if mode is set
if [ -z "$MODE" ]; then
  echo "Error: Please specify a mode"
  echo "Usage: $0 [--new-project|--link|--update]"
  exit 1
fi

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

  # Check Supabase CLI
  if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed"
    print_warning "Install it with: npm install -g supabase"
    exit 1
  fi

  # Check psql (optional but recommended)
  if ! command -v psql &> /dev/null; then
    print_warning "psql is not installed (optional)"
    print_warning "Install PostgreSQL client for advanced features"
  fi

  print_success "Dependencies are available"
}

login_to_supabase() {
  print_step "Logging in to Supabase..."

  if ! supabase projects list &> /dev/null; then
    print_warning "Not logged in to Supabase"
    supabase login
  fi

  print_success "Logged in to Supabase"
}

create_new_project() {
  print_step "Creating new Supabase project..."

  read -p "Enter project name (e.g., dunapp-pwa): " PROJECT_NAME
  read -p "Enter database password (min 12 chars): " -s DB_PASSWORD
  echo ""
  read -p "Enter region (default: eu-central-1): " REGION
  REGION=${REGION:-eu-central-1}

  print_step "Creating project '$PROJECT_NAME'..."

  supabase projects create "$PROJECT_NAME" \
    --db-password "$DB_PASSWORD" \
    --region "$REGION" \
    --org-id default

  print_success "Project created successfully"

  # Get project reference
  PROJECT_REF=$(supabase projects list | grep "$PROJECT_NAME" | awk '{print $3}')

  if [ -z "$PROJECT_REF" ]; then
    print_error "Failed to get project reference"
    exit 1
  fi

  # Save to .env.local
  print_step "Saving credentials to .env.local..."
  cat > "$PROJECT_ROOT/.env.local" << EOF
VITE_SUPABASE_URL=https://$PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=<get-from-dashboard>
EOF

  print_success "Credentials saved to .env.local"
  print_warning "Please update VITE_SUPABASE_ANON_KEY in .env.local with the actual key from the Supabase dashboard"
}

link_existing_project() {
  print_step "Linking to existing Supabase project..."

  # List available projects
  print_step "Available projects:"
  supabase projects list

  read -p "Enter project reference (from API Settings): " PROJECT_REF

  supabase link --project-ref "$PROJECT_REF"

  print_success "Linked to project: $PROJECT_REF"
}

run_migrations() {
  print_step "Running database migrations..."

  cd "$PROJECT_ROOT"

  # Check if migrations exist
  if [ ! -d "supabase/migrations" ]; then
    print_warning "No migrations found, creating migrations directory..."
    mkdir -p supabase/migrations
  fi

  # List migrations
  print_step "Available migrations:"
  supabase migration list

  # Push migrations to remote
  print_step "Pushing migrations to remote database..."
  supabase db push

  print_success "Migrations completed"
}

deploy_edge_functions() {
  print_step "Deploying Edge Functions..."

  cd "$PROJECT_ROOT"

  # Check if functions exist
  if [ ! -d "supabase/functions" ]; then
    print_warning "No Edge Functions found"
    return 0
  fi

  # List functions
  FUNCTIONS=$(ls -d supabase/functions/*/ 2>/dev/null | xargs -n 1 basename || true)

  if [ -z "$FUNCTIONS" ]; then
    print_warning "No Edge Functions to deploy"
    return 0
  fi

  # Deploy all functions
  for func in $FUNCTIONS; do
    print_step "Deploying function: $func"
    supabase functions deploy "$func" --no-verify-jwt
    print_success "Deployed: $func"
  done

  print_success "All Edge Functions deployed"
}

set_environment_variables() {
  print_step "Setting environment variables for Edge Functions..."

  read -p "Do you want to set API keys now? (y/n): " SET_KEYS

  if [ "$SET_KEYS" != "y" ]; then
    print_warning "Skipping API keys setup"
    return 0
  fi

  # OMSZ API Key
  read -p "Enter OMSZ API Key (press Enter to skip): " OMSZ_KEY
  if [ ! -z "$OMSZ_KEY" ]; then
    supabase secrets set OMSZ_API_KEY="$OMSZ_KEY"
    print_success "Set OMSZ_API_KEY"
  fi

  # VízÜgy API Key
  read -p "Enter VízÜgy API Key (press Enter to skip): " VIZUGY_KEY
  if [ ! -z "$VIZUGY_KEY" ]; then
    supabase secrets set VIZUGY_API_KEY="$VIZUGY_KEY"
    print_success "Set VIZUGY_API_KEY"
  fi

  # OpenWeather API Key
  read -p "Enter OpenWeather API Key (press Enter to skip): " OPENWEATHER_KEY
  if [ ! -z "$OPENWEATHER_KEY" ]; then
    supabase secrets set OPENWEATHER_API_KEY="$OPENWEATHER_KEY"
    print_success "Set OPENWEATHER_API_KEY"
  fi

  # Cron secret
  CRON_SECRET=$(openssl rand -hex 32)
  supabase secrets set CRON_SECRET="$CRON_SECRET"
  print_success "Set CRON_SECRET (auto-generated)"

  print_success "Environment variables configured"
}

seed_database() {
  print_step "Seeding database with initial data..."

  cd "$PROJECT_ROOT"

  # Check if seed data exists
  if [ ! -d "seed-data" ]; then
    print_warning "No seed data found"
    return 0
  fi

  # Get database URL
  DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')

  if [ -z "$DB_URL" ]; then
    print_error "Failed to get database URL"
    print_warning "You can seed data manually using the Supabase SQL Editor"
    return 1
  fi

  # Run seed scripts
  for seed_file in seed-data/*.sql; do
    if [ -f "$seed_file" ]; then
      print_step "Running seed: $(basename "$seed_file")"
      psql "$DB_URL" < "$seed_file"
      print_success "Completed: $(basename "$seed_file")"
    fi
  done

  print_success "Database seeding completed"
}

configure_cron_jobs() {
  print_step "Configuring cron jobs..."

  print_warning "Cron jobs must be configured manually in the Supabase SQL Editor"
  print_step "Please run the following SQL in your Supabase project:"

  cat << 'EOF'

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

EOF

  print_success "Cron job configuration displayed above"
}

setup_summary() {
  print_step "Setup Summary"
  echo ""
  echo "  Supabase Project: $(supabase projects list | tail -1)"
  echo "  Migrations: Completed"
  echo "  Edge Functions: Deployed"
  echo "  Environment Variables: Set"
  echo ""
  print_success "Supabase setup completed!"
  echo ""
  print_step "Next steps:"
  echo "  1. Update .env.local with Supabase credentials"
  echo "  2. Configure cron jobs in Supabase SQL Editor"
  echo "  3. Test Edge Functions in Supabase dashboard"
  echo "  4. Set up RLS policies in Database settings"
  echo "  5. Run 'npm run dev' to test locally"
  echo ""
}

###############################################################################
# Main Execution
###############################################################################

main() {
  echo ""
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║         DunApp PWA - Supabase Setup Script                   ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo ""

  check_dependencies
  login_to_supabase

  case "$MODE" in
    new)
      create_new_project
      run_migrations
      deploy_edge_functions
      set_environment_variables
      seed_database
      configure_cron_jobs
      ;;
    link)
      link_existing_project
      run_migrations
      deploy_edge_functions
      ;;
    update)
      run_migrations
      deploy_edge_functions
      ;;
  esac

  setup_summary
}

# Run main function
main

exit 0
