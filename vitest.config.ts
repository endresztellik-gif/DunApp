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
       * RÁCS (ratchet), nem cél. A korábbi 80% sosem teljesült — amíg a
       * `test:coverage` lépés `continue-on-error: true` volt, ez észrevétlen
       * maradt; a kapu élesítésekor azonnal pirosra váltott.
       *
       * Az értékek mindig a MAI szint alatt vannak pár ponttal: így a kapu a
       * VISSZAESÉST fogja meg (ez az, amit egy CI-kapunak tudnia kell),
       * anélkül hogy apróságokon csapkodna. Ha a fedezet nő, ezeket a
       * számokat kell utána húzni.
       *
       * Mérések:
       *   2026-09-07 (1.) statements 42.64 / branches 45.2  / functions 53.07 / lines 43.35
       *   2026-09-07 (2.) statements 50.36 / branches 51.25 / functions 64.24 / lines 50.00
       *     ← +20 teszt: régió-szűrő hookok (useStations / useDroughtLocations /
       *       useGroundwaterWells) és useFullscreen, mind 0%-ról indulva.
       *
       * A 80% továbbra is a cél. A legnagyobb hiányzó terület most a
       * `components/` (16%) — a modulkomponensek és a térkép-widgetek.
       */
      thresholds: {
        statements: 48,
        branches: 49,
        functions: 62,
        lines: 48,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
