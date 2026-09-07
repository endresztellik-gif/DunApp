import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    testTimeout: 30000, // 30 seconds for async operations
    /**
     * `src/lib/supabase.ts` importáláskor DOB, ha nincs VITE_SUPABASE_URL /
     * VITE_SUPABASE_ANON_KEY. Néhány teszt behúzza a valódi modult a
     * `Header → usePushNotifications → lib/supabase` láncon, ezért a suite
     * eddig csendben a fejlesztő lokális `.env`-jétől függött: gépen zöld,
     * CI-ban "Missing Supabase environment variables" (2026-09-07).
     *
     * Ezek SZÁNDÉKOSAN hamis értékek — a tesztek a Supabase-klienst mockolják,
     * hálózati hívás nem történik. A cél csak az, hogy a modul importálható
     * legyen, és a futtatás gépfüggetlen legyen.
     */
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key-not-a-real-credential',
      VITE_VAPID_PUBLIC_KEY: 'test-vapid-public-key',
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/supabase/functions/tests/**', // Exclude Edge Function tests (run with Deno)
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '**/*.test.tsx',
        '**/*.test.ts',
        'src/test/mocks/**',
        'src/test/integration/**',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
      include: [
        'src/hooks/**/*.ts',
        'src/hooks/**/*.tsx',
        'src/lib/**/*.ts',
        'src/components/**/*.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
