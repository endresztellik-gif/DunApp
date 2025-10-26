# 🚀 MCP Gyors Setup - DunApp PWA

> **5 perces MCP setup útmutató kezdőknek**

---

## 🎯 Mi az MCP?

**Model Context Protocol** = Claude (és más AI-k) tudnak dolgozni:
- ✅ GitHub repo-ddal (commit, push, PR)
- ✅ Fájlrendszerrel (olvasás, írás)
- ✅ API-kkal (OMSZ, VízÜgy)
- ✅ Adatbázissal (Supabase)
- ✅ És sok mással...

**Eredmény:** Claude Code automatikusan tudja fejleszteni a projektedre anélkül, hogy manuálisan másolgatnod kellene!

---

## ⚡ 5 PERCES SETUP

### 1️⃣ Kötelező MCP-k Telepítése (3 perc)

```bash
# GitHub MCP
npm install -g @modelcontextprotocol/server-github

# Filesystem MCP
npm install -g @modelcontextprotocol/server-filesystem

# Fetch MCP (API hívások)
npm install -g @modelcontextprotocol/server-fetch

# PostgreSQL MCP (Supabase-hez)
npm install -g @modelcontextprotocol/server-postgres
```

### 2️⃣ Claude Desktop Config (2 perc)

**Fájl helye:**
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

**Config tartalom:**

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN_HERE"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/your/dunapp-pwa"
      ]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
      }
    }
  }
}
```

### 3️⃣ GitHub Token Generálás

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Válaszd ki: `repo`, `workflow`, `admin:org`
4. Másold be a config-ba

### 4️⃣ Supabase Connection String

1. Supabase Dashboard → Project Settings → Database
2. Connection string → URI
3. Másold be a config-ba

### 5️⃣ Restart Claude Desktop

**Kész!** 🎉

---

## 🧪 Teszt: Működik-e?

**Claude-nak:**

```
Hozz létre egy új fájlt: test.txt
Tartalom: "MCP működik! 🚀"
```

Ha létrehozza → **MCP működik!** ✅

---

## 📚 Használat Példák

### GitHub MCP

```
"Hozz létre egy új GitHub repository-t 'dunapp-pwa' néven"

"Commitold a változtatásokat: 'feat: Add CitySelector component'"

"Hozz létre PR-t a feature/meteorology branch-ről"
```

### Filesystem MCP

```
"Olvasd el a CLAUDE.md fájlt"

"Hozz létre komponenst: src/modules/meteorology/CitySelector.tsx"

"Keress minden .tsx fájlt ami 'any' típust használ"
```

### Fetch MCP

```
"Hívd meg az OMSZ API-t Szekszárd időjárásért"

"Kérdezd le a mohácsi vízállást"
```

### Supabase MCP

```
"Hozd létre a meteorology_cities táblát"

"Futtasd le a seed-data/meteorology_cities.sql fájlt"

"Kérdezd le az összes várost"
```

---

## 💡 Tippek

### Ha nem működik:

1. **Restart Claude Desktop** (mindig!)
2. **Ellenőrizd a config fájl szintaxisát** (JSON valid?)
3. **Nézd meg a console-t** (Help → Toggle Developer Tools)
4. **Token/password helyes?**

### Jó gyakorlatok:

- ✅ Mindig használj environment variable-öket érzékeny adatokhoz
- ✅ GitHub token-nek adj minimális scope-ot (csak ami kell)
- ✅ Supabase használd a `service_role` key-t csak dev-ben
- ✅ Filesystem MCP-nek adj csak egy konkrét mappát

---

## 🎓 Következő Lépések

### Haladó MCP-k (opcionális):

```bash
# Puppeteer (web scraping)
npm install -g @modelcontextprotocol/server-puppeteer

# SQLite (cache)
npm install -g @modelcontextprotocol/server-sqlite

# Google Drive
npm install -g @modelcontextprotocol/server-gdrive
```

Config hozzáadása:

```json
{
  "mcpServers": {
    // ... előző MCP-k ...
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "sqlite": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sqlite",
        "/path/to/cache.db"
      ]
    }
  }
}
```

---

## 📖 További Dokumentáció

**Részletes útmutató:** [MCP_AND_AGENTS_GUIDE.md](computer:///mnt/user-data/outputs/MCP_AND_AGENTS_GUIDE.md)

**Tartalmazza:**
- 11 MCP szerver részletesen
- Custom MCP építés
- AI Agents setup
- Költség becslés
- Production best practices

---

## 🚀 Kezdjük El!

**Most már minden készen áll:**
1. ✅ MCP-k telepítve
2. ✅ Claude Desktop konfigurálva
3. ✅ GitHub/Supabase csatlakoztatva

**Következő:**
```
"Claude, olvasd el a CLAUDE.md fájlt és kezdjük el 
a DunApp PWA projekt fejlesztését!"
```

---

**Happy Coding with MCPs! 🎉**

*MCP Gyors Setup v1.0 - DunApp PWA*  
*Létrehozva: 2025-10-24*
