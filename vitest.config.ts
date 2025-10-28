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
