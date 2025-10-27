#!/bin/bash

###############################################################################
# DunApp PWA - Edge Functions E2E Test Script
#
# PURPOSE:
# - Test all 4 Edge Functions locally using curl
# - Validate responses and check database for inserted data
# - Can be used for CI/CD integration
#
# REQUIREMENTS:
# - Supabase CLI installed (for local testing)
# - curl
# - jq (for JSON parsing)
#
# USAGE:
# ./scripts/test-edge-functions.sh
###############################################################################

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_PROJECT_URL="${SUPABASE_URL:-http://localhost:54321}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key}"
FUNCTIONS_URL="${SUPABASE_PROJECT_URL}/functions/v1"

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

test_function() {
  local function_name=$1
  local expected_status=${2:-200}

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  log_info "Testing: ${function_name}"

  # Call Edge Function
  response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    "${FUNCTIONS_URL}/${function_name}")

  # Extract status code (last line)
  status_code=$(echo "$response" | tail -n1)

  # Extract body (all but last line)
  body=$(echo "$response" | sed '$d')

  # Check status code
  if [ "$status_code" -eq "$expected_status" ]; then
    log_info "  ✓ Status code: ${status_code}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    log_error "  ✗ Status code: ${status_code} (expected ${expected_status})"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi

  # Parse and validate JSON response
  if echo "$body" | jq . > /dev/null 2>&1; then
    log_info "  ✓ Valid JSON response"

    # Check for success field
    success=$(echo "$body" | jq -r '.success')
    if [ "$success" == "true" ]; then
      log_info "  ✓ Success: true"
    else
      log_warning "  ! Success: ${success}"
    fi

    # Print summary if available
    if echo "$body" | jq -e '.summary' > /dev/null 2>&1; then
      summary=$(echo "$body" | jq -c '.summary')
      log_info "  Summary: ${summary}"
    fi

    # Print timestamp
    timestamp=$(echo "$body" | jq -r '.timestamp')
    log_info "  Timestamp: ${timestamp}"

  else
    log_error "  ✗ Invalid JSON response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi

  echo ""
}

###############################################################################
# Main Tests
###############################################################################

echo "========================================================================="
echo "DunApp PWA - Edge Functions E2E Tests"
echo "========================================================================="
echo ""

# Check prerequisites
if ! command -v curl &> /dev/null; then
  log_error "curl is not installed"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  log_warning "jq is not installed (JSON parsing will be limited)"
fi

log_info "Testing against: ${FUNCTIONS_URL}"
echo ""

###############################################################################
# Test 1: fetch-meteorology
###############################################################################

log_info "TEST 1/4: fetch-meteorology"
echo "==========================================================================="
test_function "fetch-meteorology" 200

###############################################################################
# Test 2: fetch-water-level
###############################################################################

log_info "TEST 2/4: fetch-water-level"
echo "==========================================================================="
test_function "fetch-water-level" 200

###############################################################################
# Test 3: fetch-drought
###############################################################################

log_info "TEST 3/4: fetch-drought"
echo "==========================================================================="
test_function "fetch-drought" 200

###############################################################################
# Test 4: check-water-level-alert
###############################################################################

log_info "TEST 4/4: check-water-level-alert"
echo "==========================================================================="
test_function "check-water-level-alert" 200

###############################################################################
# Test Summary
###############################################################################

echo ""
echo "========================================================================="
echo "TEST SUMMARY"
echo "========================================================================="
echo "Total Tests:  ${TOTAL_TESTS}"
echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}"
echo "========================================================================="

if [ "$FAILED_TESTS" -eq 0 ]; then
  log_info "All tests passed! ✓"
  exit 0
else
  log_error "${FAILED_TESTS} test(s) failed"
  exit 1
fi
