# Edge Function Tests

## Overview

This directory contains Deno-based tests for Supabase Edge Functions. These tests are **separate** from the main vitest test suite and require Deno to run.

## Test Files

1. **fetch-meteorology.test.ts** - Tests meteorology data fetching from OpenWeatherMap API
2. **fetch-water-level.test.ts** - Tests water level data fetching from hydroinfo API
3. **fetch-drought.test.ts** - Tests drought monitoring data fetching
4. **check-water-level-alert.test.ts** - Tests water level alert system

## Prerequisites

Install Deno:

```bash
# macOS (Homebrew)
brew install deno

# macOS (curl)
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Linux
curl -fsSL https://deno.land/install.sh | sh
```

## Running Tests

### Run all Edge Function tests

```bash
npm run test:edge-functions
```

Or directly with Deno:

```bash
deno test --allow-net --allow-env --allow-read supabase/functions/tests/*.test.ts
```

### Run specific test file

```bash
deno test --allow-net --allow-env --allow-read supabase/functions/tests/fetch-meteorology.test.ts
```

### Run with watch mode

```bash
deno test --allow-net --allow-env --allow-read --watch supabase/functions/tests/*.test.ts
```

## Test Configuration

Configuration is in `/deno.json`:

```json
{
  "tasks": {
    "test:edge-functions": "deno test --allow-net --allow-env --allow-read supabase/functions/tests/*.test.ts"
  },
  "imports": {
    "std/": "https://deno.land/std@0.168.0/"
  },
  "test": {
    "include": ["supabase/functions/tests/*.test.ts"]
  }
}
```

## Permissions Required

- `--allow-net`: Network access for API calls
- `--allow-env`: Environment variable access for API keys
- `--allow-read`: File system read for test files

## Why Separate from Vitest?

Edge Functions use Deno runtime, which:
- Uses `https://` imports (not supported by Node.js/vitest)
- Has different APIs (Deno namespace instead of Node.js)
- Runs in a different runtime environment

The main vitest suite excludes these tests via `vitest.config.ts`:

```typescript
exclude: [
  '**/node_modules/**',
  '**/dist/**',
  '**/supabase/functions/tests/**', // ⬅️ Excluded
]
```

## Test Coverage

Each test file covers:
- ✅ Successful API calls with mocked responses
- ✅ Error handling (network errors, API failures)
- ✅ Retry logic with exponential backoff
- ✅ Data transformation/parsing
- ✅ Database insertion logic
- ✅ Fallback mechanisms (when applicable)

## Running All Tests

To run both React/frontend tests (vitest) AND Edge Function tests (deno):

```bash
npm run test:all
```

This runs:
1. `npm test` - vitest suite (311 tests)
2. `npm run test:edge-functions` - deno suite (4 Edge Functions)

## CI/CD Integration

In GitHub Actions (`.github/workflows/test.yml`):

```yaml
- name: Install Deno
  uses: denoland/setup-deno@v1
  with:
    deno-version: v1.x

- name: Run Edge Function Tests
  run: npm run test:edge-functions
```

## Troubleshooting

### "Deno not found"

Install Deno using the commands above.

### "Module not found: https://deno.land/..."

This is expected in vitest. Make sure `supabase/functions/tests/**` is in vitest's `exclude` config.

### Test timeout

Increase timeout in individual test files:

```typescript
Deno.test({
  name: "my test",
  fn: async () => { /* ... */ },
  sanitizeOps: false,
  sanitizeResources: false,
});
```

## Documentation

- [Deno Testing Guide](https://deno.land/manual/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [DunApp PWA Tests](../../../docs/TESTING.md)
