/**
 * ESLint 9 flat config — DunApp PWA
 *
 * Migrálva a `.eslintrc.json`-ből (2026-09-07). Az ESLint v9 óta a régi
 * `.eslintrc.*` formátumot a CLI már nem is olvassa: a `npm run lint` addig
 * el sem indult ("ESLint couldn't find an eslint.config.(js|mjs|cjs) file"),
 * vagyis a CI lint-lépése hosszú ideje nulla jelet adott.
 *
 * A repó három, egymástól élesen eltérő futtatókörnyezetet kever, ezért nem
 * egy globális beállítás van, hanem fájlminta szerinti blokkok:
 *
 *   src/**              → böngésző + React (JSX runtime, hooks, react-refresh)
 *   supabase/functions/ → Deno (nincs DOM, nincs React, URL-importok)
 *   *.config.ts, netlify/ → Node
 *   *.test.*, src/test/ → a fentiek + vitest globals (`globals: true`)
 *
 * A projekt `"type": "module"`, ezért ez a fájl ESM.
 */

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  // ─── Amit egyáltalán nem nézünk ────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'public/**',
      // Csomagolt/archív másolatok a repó gyökerében — nem élő forrás.
      'dunapp-complete-package-v3/**',
      'dunapp-starter-package/**',
      'aszalymonitoring-mcp/**',
      'hydroinfo-mcp/**',
      'seed-data/**',
      'talajviz/**',
      'talajvizkutak/**',
      'design/**',
      // Egyszeri diagnosztikai szkriptek a gyökérben (test-*.cjs, *.js).
      '*.cjs',
      'apply-select-policy.js',
      'test-*.js',
    ],
  },

  // ─── Alap: JS + TypeScript ajánlott szabályok minden vizsgált fájlra ───────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ─── Frontend: src/** (böngésző + React) ──────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.serviceworker },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules, // React 17+ — nem kell import React
      ...reactHooks.configs['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // A .eslintrc.json-ből átvéve: a `_` előtagú argumentum szándékosan
      // használatlan (pl. eseménykezelő-aláírások kitöltése).
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // KI: a prop-típusokat a TypeScript ellenőrzi. A szabály nem érti a TS
      // interface-eket, ezért minden komponensre hamis riasztást adott (28 db)
      // — a `plugin:react/recommended` öröksége JS-projektekből.
      'react/prop-types': 'off',

      // WARN, nem ERROR: 37 helyen van `any` a kódbázisban (jórészt Supabase
      // válamalakok és Leaflet/Recharts interop). Valós technikai adósság, de
      // egy 37 fájlos refaktor nem tartozik a lint-kapu bevezetéséhez —
      // maradjon látható, de ne blokkolja a CI-t.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // ─── Backend: Supabase Edge Functions (Deno) ──────────────────────────────
  {
    files: ['supabase/functions/**/*.ts'],
    languageOptions: {
      // Deno-futtatókörnyezet: van fetch/URL/console, de nincs DOM és nincs
      // Node-os `process`. A `Deno` névteret kézzel adjuk hozzá.
      globals: { ...globals.worker, Deno: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // A catch-ágakban `error.message`-t olvasunk implicit `any`-n; ezt a
      // Deno típusellenőrzés külön jelzi (lásd DEVELOPMENT_LOG 2026-09-07),
      // itt nem duplázzuk a zajt.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ─── Build- és eszközkonfigok (Node) ──────────────────────────────────────
  {
    files: ['*.config.ts', 'netlify/**/*.ts', 'scripts/**/*.{js,ts}'],
    languageOptions: { globals: globals.node },
    rules: {
      // Ugyanaz a `_`-konvenció, mint máshol: a Netlify/Vite handler-aláírások
      // kötött paramétereit gyakran nem használjuk (pl. `_context`).
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // ─── Tesztek: vitest `globals: true` (describe/it/expect/vi globálisan) ───
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node, vi: 'readonly' } },
    rules: {
      // Tesztekben a szándékos `any` és a nem használt fixture gyakori.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // A React Query wrapperek inline komponensként készülnek
      // (`({ children }) => <QueryClientProvider>…`), ezeknek nincs értelme
      // displayName-et adni — csak a teszt fixture-ök.
      'react/display-name': 'off',
    },
  }
);
