# 🚀 DunApp PWA - Gyors Indítási Útmutató

> 10 perc alatt készen állsz a fejlesztésre!

---

## ✅ Előfeltételek Telepítése

### 1. Node.js & NPM

```bash
# Ellenőrzés
node --version  # Kell: v18+ vagy v20+
npm --version   # Kell: 9+

# Ha nincs telepítve: https://nodejs.org/
```

### 2. Git

```bash
# Ellenőrzés
git --version

# Ha nincs telepítve: https://git-scm.com/
```

### 3. VS Code

Download: https://code.visualstudio.com/

### 4. Claude Code CLI

```bash
# Globális telepítés
npm install -g @anthropic-ai/claude-code

# Ellenőrzés
claude-code --version
```

---

## 🏗️ Projekt Létrehozás (5 perc)

### Lépés 1: Projekt Könyvtár

```bash
# Új projekt
mkdir dunapp-pwa
cd dunapp-pwa

# Git inicializálás
git init
```

### Lépés 2: Dokumentációk Másolása

```bash
# Másold be a starter package tartalmát:
# - docs/ könyvtár
# - .claude/ könyvtár
# - config/ könyvtár
# - seed-data/ könyvtár
# - README.md
# - QUICKSTART.md (ez a fájl)
```

Vagy egyszerűen:
```bash
# Ha letöltötted a teljes starter package-et
cp -r /path/to/dunapp-starter-package/* ./
```

### Lépés 3: VS Code Megnyitása

```bash
code .
```

---

## 🎯 Claude Code Indítás (2 perc)

### VS Code-ban:

1. **Nyomj** `Ctrl+Shift+P` (Windows/Linux) vagy `Cmd+Shift+P` (Mac)
2. **Írd be**: `Claude Code: Start`
3. **Enter**

### Első Prompt Claude-nak:

```
Szia! Új projektet kezdek, a DunApp PWA-t. 

Először olvasd el a docs/PROJECT_SUMMARY.md fájlt, hogy megértsd 
a projekt teljes architektúráját.

Ezután hozzunk létre egy új Vite + React + TypeScript projektet 
a következő lépésekkel:

1. Inicializáljuk a Vite projektet
2. Telepítsük a Tailwind CSS-t
3. Állítsuk be a projekt struktúrát a PROJECT_SUMMARY.md alapján
4. Hozzuk létre az alap konfigurációs fájlokat

Kész vagy?
```

---

## 📦 Projekt Inicializálás (Claude Code-dal)

Claude Code automatikusan elvégzi:

### 1. Package.json & Dependencies

```json
{
  "name": "dunapp-pwa",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.38.0",
    "recharts": "^2.10.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/leaflet": "^1.9.8",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0"
  }
}
```

### 2. TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. Tailwind Config

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'meteo-primary': '#00A8CC',
        'water-primary': '#00BCD4',
        'drought-primary': '#FF9800',
        'bg-main': '#F0F4F8',
        'bg-card': '#FFFFFF',
        'text-primary': '#2C3E50',
        'text-secondary': '#607D8B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### 4. Vite Config

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
```

---

## 📁 Projekt Struktúra

Claude Code létrehozza:

```
dunapp-pwa/
├── docs/                       # ✅ Már megvan
├── .claude/                    # ✅ Már megvan
├── src/
│   ├── modules/
│   │   ├── meteorology/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── water-level/
│   │   └── drought/
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── services/
│   │   └── supabase/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── favicon.ico
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🗄️ Supabase Setup (5 perc)

### 1. Supabase Projekt Létrehozása

1. Menj a https://supabase.com
2. Sign up / Log in
3. **New Project**
4. Töltsd ki:
   - Name: `dunapp-pwa`
   - Database Password: (biztonságos jelszó)
   - Region: `Europe (Frankfurt)`

### 2. Environment Változók

Másold a projekt URL-t és Anon key-t:

```bash
# .env fájl létrehozása
cp .env.example .env

# Szerkeszd a .env fájlt:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Adatbázis Táblák Létrehozása

Supabase Dashboard → SQL Editor → New Query

Másold be és futtasd a `seed-data/` könyvtár SQL fájljait:

1. **schema.sql** - Táblák létrehozása
2. **meteorology_cities.sql** - Városok
3. **water_level_stations.sql** - Állomások
4. **drought_locations.sql** - Aszály helyszínek
5. **groundwater_wells.sql** - Kutak

---

## 🎨 Első Komponens (Teszt)

Kérd Claude Code-tól:

```
Hozz létre egy egyszerű Header komponenst, ami tartalmazza:
- DunApp logót (szöveg)
- 3 modul gombot (Meteorológia, Vízállás, Aszály)
- A design a docs/DESIGN_SPECIFICATION.md alapján legyen

Fájl: src/shared/components/Header/Header.tsx
```

---

## 🏃 Futtatás

```bash
# Development szerver indítása
npm run dev

# Böngészőben:
http://localhost:3000
```

---

## 🧭 Következő Lépések

### Ajánlott Fejlesztési Sorrend:

#### 1. Alapkomponensek (1 nap)
```
Claude, hozzuk létre a következő komponenseket:
1. Layout (Header + Container)
2. ModuleTabs (Tab navigáció)
3. BaseSelector (Dropdown alap)
4. DataCard (Adat kártya)
5. LoadingSpinner
```

#### 2. Meteorológia Modul (2 nap)
```
Claude, fejlesszük ki a Meteorológia modult:
1. CitySelector komponens (4 város)
2. 6 adatkártya (hőmérséklet, csapadék, stb.)
3. Dummy adatokkal először
4. Radarkép embed (később)
```

#### 3. Vízállás Modul (2 nap)
```
Claude, fejlesszük ki a Vízállás modult:
1. StationSelector (3 állomás)
2. 3 adatkártya
3. Összehasonlító grafikon (Recharts)
4. Dummy adatokkal először
```

#### 4. Aszály Modul (3 nap)
```
Claude, fejlesszük ki az Aszály modult:
1. LocationSelector + WellSelector (2 külön!)
2. 4 adatkártya dropdown-nal
3. 3 térkép (Leaflet)
4. Kút lista komponens
```

#### 5. API Integráció (később)
- OMSZ API
- VízÜgy scraping/API
- HUGEO, OVF API-k

#### 6. PWA Features
- Service Worker
- Manifest
- Offline support

---

## 💡 Claude Code Tippek

### Jó Promptok:

✅ **Specifikus és kontextusos**
```
Hozz létre egy BaseSelector komponenst TypeScript-tel, ami:
- Props: items (array), value (string), onChange (function)
- Tailwind CSS styling a DESIGN_SPECIFICATION.md alapján
- Location ikon használata (lucide-react)
- Accessible (ARIA labels)
```

✅ **Dokumentációra hivatkozás**
```
A docs/DESIGN_SPECIFICATION.md fájl alapján add meg a pontos 
színkódokat a Meteorológia modulhoz.
```

✅ **Lépésről lépésre**
```
Először hozz létre egy egyszerű Header komponenst, majd 
fokozatosan bővítsük a funkcionalitással.
```

### Kerülendő Promptok:

❌ **Túl általános**
```
Csinálj egy weboldalat időjárással.
```

❌ **Hiányzó kontextus**
```
Kellenek grafikonok.
```

---

## 🐛 Hibaelhárítás

### Supabase Connection Error
```bash
# Ellenőrizd a .env fájlt
cat .env

# Győződj meg róla, hogy a VITE_ prefix megvan
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Tailwind Nem Működik
```bash
# Ellenőrizd a tailwind.config.js content részét
# Győződj meg róla, hogy az src/**/*.{ts,tsx} benne van
```

### TypeScript Hibák
```bash
# Töröld a node_modules-t és újra telepítsd
rm -rf node_modules
npm install
```

---

## 📚 Hasznos Linkek

- **Vite**: https://vitejs.dev/
- **React**: https://react.dev/
- **Tailwind**: https://tailwindcss.com/
- **Supabase**: https://supabase.com/docs
- **Recharts**: https://recharts.org/
- **Leaflet**: https://leafletjs.com/
- **React Leaflet**: https://react-leaflet.js.org/

---

## ✨ Kész vagy!

Most már:
1. ✅ Megvan a teljes dokumentáció
2. ✅ Tisztában vagy a projekt struktúrával
3. ✅ VS Code + Claude Code készen áll
4. ✅ Supabase adatbázis fut

**Kezdheted a fejlesztést! 🚀**

Kérdezz bátran Claude Code-tól, és hivatkozz a `docs/` dokumentációkra!

---

*Happy Coding! 💻*
