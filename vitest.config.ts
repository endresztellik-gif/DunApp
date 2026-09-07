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
      /**
       * RÁCS (ratchet), nem cél. A korábbi 80% sosem teljesült — a tényleges
       * szint 2026-09-07-én: statements 42.64 / branches 45.2 /
       * functions 53.07 / lines 43.35. Amíg a `test:coverage` lépés
       * `continue-on-error: true` volt, ez észrevétlen maradt; a kapu
       * élesítésekor azonnal pirosra váltott.
       *
       * Az itteni értékek a MAI szint alatt vannak pár ponttal: így a kapu
       * a VISSZAESÉST fogja meg (ez az, amit egy CI-kapunak tudnia kell),
       * anélkül hogy apróságokon csapkodna.
       *
       * A 80% továbbra is a cél — ha a fedezet nő, ezeket a számokat kell
       * utána húzni. Legnagyobb hiányzó területek: a modulkomponensek
       * (meteorology / water-level / drought) és a térkép-widgetek.
       */
      thresholds: {
        statements: 40,
        branches: 43,
        functions: 51,
        lines: 41,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
