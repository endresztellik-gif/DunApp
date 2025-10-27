# DunApp PWA - Testing Guide

> **Comprehensive Testing Documentation**
> Last Updated: 2025-10-27
> Version: 1.0

## Table of Contents

1. [Overview](#overview)
2. [Test Architecture](#test-architecture)
3. [Running Tests](#running-tests)
4. [Edge Function Tests](#edge-function-tests)
5. [React Hook Tests](#react-hook-tests)
6. [Integration Tests](#integration-tests)
7. [E2E Tests](#e2e-tests)
8. [Coverage Requirements](#coverage-requirements)
9. [CI/CD Integration](#cicd-integration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The DunApp PWA testing strategy covers four layers:

1. **Edge Function Tests** (Deno) - Backend API integration tests
2. **React Hook Tests** (Vitest) - Frontend data layer tests
3. **Integration Tests** (Vitest) - End-to-end data flow tests
4. **E2E Tests** (Bash + curl) - Full system tests

**Coverage Target:** 80%+ for all code

---

## Test Architecture

```
dunapp-pwa/
├── supabase/functions/tests/          # Edge Function tests (Deno)
│   ├── fetch-meteorology.test.ts
│   ├── fetch-water-level.test.ts
│   ├── fetch-drought.test.ts
│   └── check-water-level-alert.test.ts
│
├── src/hooks/__tests__/                # Hook tests (Vitest + React Testing Library)
│   ├── useWeatherData.test.tsx
│   ├── useWaterLevelData.test.tsx
│   ├── useDroughtData.test.tsx
│   └── useGroundwaterData.test.tsx
│
├── src/test/
│   ├── integration/                    # Integration tests
│   │   └── data-flow.test.tsx
│   ├── mocks/                          # Mock data and utilities
│   │   ├── api-responses.ts
│   │   ├── supabase-mock.ts
│   │   └── handlers.ts
│   └── setup.ts                        # Test setup file
│
└── scripts/
    └── test-edge-functions.sh          # E2E test script
```

---

## Running Tests

### Unit Tests (React Hooks)

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Watch mode (during development)
npm run test:watch

# Run specific test file
npx vitest run src/hooks/__tests__/useWeatherData.test.tsx
```

### Integration Tests

```bash
# Run integration tests only
npx vitest run src/test/integration/

# With coverage
npx vitest run --coverage src/test/integration/
```

### Edge Function Tests (Deno)

```bash
# Navigate to function directory
cd supabase/functions/tests/

# Run all Edge Function tests
deno test --allow-net --allow-env fetch-meteorology.test.ts
deno test --allow-net --allow-env fetch-water-level.test.ts
deno test --allow-net --allow-env fetch-drought.test.ts
deno test --allow-net --allow-env check-water-level-alert.test.ts

# Run all tests at once
for test in *.test.ts; do
  echo "Running $test..."
  deno test --allow-net --allow-env "$test"
done
```

### E2E Tests

```bash
# Requires local Supabase instance running
npm run supabase:start

# Run E2E tests
./scripts/test-edge-functions.sh

# Stop Supabase after testing
npm run supabase:stop
```

---

## Edge Function Tests

### Location
`/supabase/functions/tests/`

### Technology
- **Framework:** Deno built-in testing
- **Assertions:** Deno std assertions

### What's Tested

#### 1. fetch-meteorology.test.ts
- ✅ Successful API calls (OpenWeatherMap, Meteoblue, Yr.no)
- ✅ Fallback mechanism (primary → secondary → tertiary)
- ✅ Retry logic with exponential backoff
- ✅ Data transformation (API → database format)
- ✅ Error handling (network errors, API failures)
- ✅ City coordinates validation
- ✅ Wind speed unit conversion (km/h → m/s)

#### 2. fetch-water-level.test.ts
- ✅ HTML scraping from vizugy.hu
- ✅ HTML scraping from hydroinfo.hu (ISO-8859-2 encoding)
- ✅ Water level parsing from table cells
- ✅ 5-day forecast data extraction
- ✅ Retry logic on scraping failures
- ✅ Missing station data handling
- ✅ Database upsert with conflict resolution

#### 3. fetch-drought.test.ts
- ✅ API integration with aszalymonitoring.vizugy.hu
- ✅ Station search by settlement name
- ✅ 60-day historical data fetching
- ✅ Latest data point extraction
- ✅ 6 soil moisture depth levels (10-100cm)
- ✅ Drought index validation (0-1 range)
- ✅ Optional field handling (null values)

#### 4. check-water-level-alert.test.ts
- ✅ Water level threshold checking (400cm)
- ✅ Rate limiting (6-hour window)
- ✅ Push notification payload structure
- ✅ Subscription management
- ✅ Expired subscription handling (HTTP 410)
- ✅ Notification logging (sent/failed)
- ✅ Hungarian text in notifications

### Running Edge Function Tests

```bash
cd supabase/functions/tests
deno test --allow-net --allow-env *.test.ts
```

---

## React Hook Tests

### Location
`/src/hooks/__tests__/`

### Technology
- **Framework:** Vitest
- **Testing Library:** React Testing Library
- **Utilities:** @tanstack/react-query test utils

### What's Tested

#### All Hooks Test Coverage
- ✅ Initial loading state
- ✅ Successful data fetching
- ✅ Error state handling
- ✅ Refetch functionality
- ✅ Cache behavior (staleTime)
- ✅ Type safety (TypeScript)
- ✅ Data transformation (snake_case → camelCase)
- ✅ Null/missing field handling

#### Specific Tests

**useWeatherData.test.tsx**
- City data + weather data fetching
- OpenWeatherMap data structure
- Optional fields (rain, snow, visibility)

**useWaterLevelData.test.tsx**
- Station data + water level + forecast
- 5-day forecast ordering
- Threshold levels (LNV, KKV, NV)

**useDroughtData.test.tsx**
- Location data + drought monitoring data
- 6 soil moisture depth levels
- Drought indices (HDI, HDIS)

**useGroundwaterData.test.tsx**
- Well metadata + groundwater levels
- Water level (meters + MASL)
- Temperature data handling

### Example Test Run

```bash
# Run single hook test
npx vitest run src/hooks/__tests__/useWeatherData.test.tsx

# Output:
# ✓ should return initial loading state
# ✓ should not fetch when cityId is null
# ✓ should fetch and return weather data successfully
# ✓ should handle errors
# ✓ should transform database fields to camelCase
# ✓ should provide refetch function
```

---

## Integration Tests

### Location
`/src/test/integration/`

### Purpose
Test complete data flows: Database → Hook → Component Data

### What's Tested

#### data-flow.test.tsx
1. **Meteorology Data Flow**
   - DB query → Hook processing → Component data
   - Error → Retry → Success scenario

2. **Water Level Data Flow**
   - Station + water level + forecasts
   - Missing forecast handling

3. **Drought Data Flow**
   - Location + drought data
   - All 6 soil moisture levels

4. **Cache Behavior**
   - First fetch → Cache → Second fetch (cache hit)

### Running Integration Tests

```bash
npx vitest run src/test/integration/
```

---

## E2E Tests

### Location
`/scripts/test-edge-functions.sh`

### Purpose
Test all Edge Functions against live/local Supabase instance

### Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
npm run supabase:start
```

### What's Tested

1. ✅ HTTP status codes (200 OK)
2. ✅ Valid JSON responses
3. ✅ Success field in response
4. ✅ Summary data (total, success, failed counts)
5. ✅ Timestamp format (ISO 8601)

### Running E2E Tests

```bash
# Set environment variables (or use .env)
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="your-anon-key"

# Run tests
./scripts/test-edge-functions.sh

# Example output:
# =========================================================================
# DunApp PWA - Edge Functions E2E Tests
# =========================================================================
#
# [INFO] Testing: fetch-meteorology
# [INFO]   ✓ Status code: 200
# [INFO]   ✓ Valid JSON response
# [INFO]   ✓ Success: true
# [INFO]   Summary: {"total":4,"success":4,"failed":0}
# [INFO]   Timestamp: 2025-10-27T12:00:00.000Z
#
# =========================================================================
# TEST SUMMARY
# =========================================================================
# Total Tests:  4
# Passed:       4
# Failed:       0
# =========================================================================
# [INFO] All tests passed! ✓
```

---

## Coverage Requirements

### Thresholds

```javascript
// vitest.config.ts
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
  }
}
```

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html

# Coverage by directory:
# src/hooks/         → 95%+ (high priority)
# src/components/    → 80%+
# src/lib/          → 80%+
```

### Current Coverage (Target)

| Module           | Lines | Functions | Branches | Statements |
|------------------|-------|-----------|----------|------------|
| hooks/           | 95%   | 95%       | 90%      | 95%        |
| Edge Functions   | 85%   | 85%       | 80%      | 85%        |
| Integration      | 90%   | 90%       | 85%      | 90%        |

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Setup Deno
        uses: denoland/setup-deno@v1

      - name: Run Edge Function tests
        run: |
          cd supabase/functions/tests
          deno test --allow-net --allow-env *.test.ts

  e2e:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase
        uses: supabase/setup-cli@v1

      - name: Start Supabase
        run: supabase start

      - name: Run E2E tests
        run: ./scripts/test-edge-functions.sh

      - name: Stop Supabase
        run: supabase stop
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

```bash
# Increase timeout in vitest.config.ts
test: {
  testTimeout: 30000 // 30 seconds
}
```

#### 2. Supabase Connection Errors

```bash
# Check Supabase is running
supabase status

# Restart Supabase
supabase stop
supabase start
```

#### 3. Mock Data Not Updating

```bash
# Clear cache and restart tests
rm -rf node_modules/.vite
npm run test
```

#### 4. Edge Function Tests Fail

```bash
# Ensure Deno has correct permissions
deno test --allow-net --allow-env --allow-read

# Check API keys are set
echo $OPENWEATHER_API_KEY
echo $METEOBLUE_API_KEY
```

#### 5. Coverage Not Meeting Threshold

```bash
# Find uncovered lines
npm run test:coverage
open coverage/index.html

# Check coverage for specific file
npx vitest run --coverage src/hooks/useWeatherData.ts
```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm run test

# Vitest UI for debugging
npm run test:ui
```

---

## Mock Data

### Location
`/src/test/mocks/`

### Files

1. **api-responses.ts** - Mock API responses for external APIs
2. **supabase-mock.ts** - Mock Supabase client
3. **handlers.ts** - Mock fetch handlers

### Using Mocks in Tests

```typescript
import { mockOpenWeatherMapResponse } from '../../test/mocks/api-responses';
import { createMockSupabaseClient } from '../../test/mocks/supabase-mock';
import { createMockFetch } from '../../test/mocks/handlers';

// In your test:
vi.stubGlobal('fetch', createMockFetch());
const mockSupabase = createMockSupabaseClient();
```

---

## Best Practices

### 1. Test Naming
```typescript
// ✅ Good
it('should fetch weather data successfully')
it('should handle network errors with retry')

// ❌ Bad
it('test 1')
it('works')
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should transform data to camelCase', () => {
  // Arrange
  const mockData = { feels_like: 21.0 };

  // Act
  const result = transform(mockData);

  // Assert
  expect(result.feelsLike).toBe(21.0);
});
```

### 3. Mock External Dependencies
```typescript
// Always mock external APIs
vi.mock('../../lib/supabase');
vi.stubGlobal('fetch', mockFetch);
```

### 4. Clean Up After Tests
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### 5. Test Edge Cases
- Null/undefined values
- Empty arrays
- Network failures
- Timeout scenarios
- Invalid data formats

---

## Next Steps

After testing is complete:

1. ✅ Review coverage report
2. ✅ Fix any failing tests
3. ✅ Add tests for new features
4. ✅ Update this guide as needed
5. ✅ Set up CI/CD pipeline

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Deno Testing](https://deno.land/manual/testing)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)

---

**Questions?** Check the [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) or create an issue.
