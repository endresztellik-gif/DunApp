# DunApp PWA — Fejlesztési Napló

> **Cél:** Az összes fejlesztési döntés, hotfix, architektúrális választás és tanulság egy helyen.
> Minden jövőbeli fejlesztés előtt érdemes átolvasni.

**Utolsó frissítés:** 2026-06-24
**Projekt verzió:** 3.3.0

---

## 2026-06-24 — Duna / Dráva régió-kiterjesztés: PROD GO-LIVE

A `feat/drava-region` ág mergelve `main`-be (PR #1) → auto-deploy. A Dráva-oldal élesedett:
régióválasztó, Barcs/Őrtilos/Vízvár meteorológia, Őrtilos/Barcs vízállás, 9 somogyi talajvízkút.

**Végrehajtott go-live lépések (közös prod Supabase `zpwoicpajmvbtmtumsah`):**
1. `027` migráció alkalmazva — **`supabase db query --linked`** módszerrel (lásd infra-megjegyzés).
   Verifikálva: Dráva 3 város / 2 állomás / 9 kút, mind `is_active/enabled=false` (prod-safe seed).
2. Edge Functions deploy `--use-api`-val (Docker nélkül): `fetch-water-level`, `fetch-meteorology`,
   `fetch-groundwater-vizugy`. Invoke-teszt: vízállás 5/5, meteo 8/8.
3. Groundwater **REST-backfill** (`?backfill=true`): 24 kút (23 REST / 1 PHP), 0 empty / 0 fail,
   43 241 rekord. Egységes REST-datum (nincs varrat); Duna kutanként ~0,4–0,9 m konstans eltolás.
4. UI-fix: `DroughtMapsWidget` dupla jelmagyarázat megszüntetve (overlay törölve, térkép alatti marad).

**Infra-megjegyzés (fontos jövőre):** a Supabase **MCP nem éri el** ezt a projektet (más org); a CLI
`db push` **használhatatlan** (törött remote migrációs history: árva `20260412161023`, 005–026 nincs
trackelve, dup 012/015 fájl). Prod SQL futtatása: **`supabase db query --linked`**. Docker nem fut →
`functions deploy --use-api`. A CLI-ben **nincs** `functions invoke` → HTTP-n hívd a `.env` anon kulcsával.

**↩️ VISSZAÁLLÍTÁS (ha a go-live gondot okoz):**
- **Frontend:** `pre-drava-golive` tag = a merge előtti `main` (`88cf0bb`). Visszaállás:
  `git checkout main && git reset --hard pre-drava-golive && git push --force-with-lease origin main`
  → auto-deploy a régi állapotra. (A `feat/drava-region` ág megmarad GitHubon.)
- **Talajvíz-adat:** backup tábla **`groundwater_data_backup_20260623`** (25 681 sor). Visszaállás:
  `TRUNCATE groundwater_data; INSERT INTO groundwater_data SELECT * FROM groundwater_data_backup_20260623;`
  (a 027 additív oszlopai maradhatnak). A backup eldobható, ha minden stabil.
- A Dráva flagek **false**-ok maradtak; a frontend a hookok `drava`-kivételein át mutatja a Drávát.

**Hátralévő (külön fast-follow, NEM sürgős):** élesítő migráció (Dráva flag-flip `true`) + a hookok
`drava`-kivételeinek (`// TODO go-live`) eltávolítása. ⚠️ Csak ebben a sorrendben (a flag-flip a
régió-tudatos frontend élesedése UTÁN biztonságos).

---

## 2026-06-23 — Duna / Dráva régió-kiterjesztés (develop ág, prod érintetlen)

Kezdőoldali **Duna / Dráva** régióválasztó (első indításkor kötelező, fejlécben váltható). A régió
szűri a meteorológia-városokat (`region`), a vízállás-állomásokat (`river`) és a talajvízkutakat
(`region`); az aszály soil-monitoring + országos térképek közösek maradnak. **Dizájn változatlan.**

**Felderítés (data.vizugy REST):**
- Talajvíz állomáslista típusszám = **`InternetVmo/12`** (felszíni 11), talajvízszint **`adatFajtaKod=69`**.
- A REST és a régi PHP-scrape **ugyanazt a jelet** adja, de **kutanként állandó eltolással** (~48–84 cm,
  más referenciapont). A PHP **helyi idő** (CEST), a REST **UTC** — időben illesztve a deltÁk állandók.
- Döntés (user): **REST-first minden kútra** (Duna is, időtálló), PHP fallback; egyszeri **~400 napos
  REST-backfill** (`?backfill=true`) cseréli a PHP-datumú történetet → egységes referencia, nincs varrat.
  Leállt kutak (forrásnál is): Decs 658, Nagybaracska 4479, Szeremle 132042.
- Dráva vízállás megerősítve: Őrtilos tsz `833` (hydroinfo 446198), Barcs tsz `835` (hydroinfo 446199).
- Dráva talajvíz: 9 friss-adatú kút (Gyékényes 885, Berzence 3487, Szenta 3660, Somogyszob 4000,
  Babócsa 878, Mike 4230, Szulok 3484, Darány 4004, Lad 3659). A terv eredeti nevei (Barcs/Őrtilos/
  Drávaszentes/Bolhó) nem adnak friss adatot vagy nincs kútjuk.

**Megvalósítás:**
- `RegionContext` (`src/contexts/`) + `useRegion`, provider a `main.tsx`-ben; HomePage régióválasztó,
  Header régió-pill. Régió a contextből (App nincs új korai return — mobil-flash szabály).
- Migráció `027_drava_region_expansion.sql`: `region` oszlop (cities, wells) + a soha nem committolt
  `enabled` oszlop pótlása; Dráva sorok seed **`is_active=false`/`enabled=false`** (prod-biztonság).
- Edge Functions: `fetch-groundwater-vizugy` REST-first + backfill; `fetch-water-level` STATIONS +Őrtilos/
  Barcs; `fetch-meteorology` +Barcs/Őrtilos/Vízvár. `_shared/vizugy-api-client.ts`: `GROUNDWATER_LEVEL=69`,
  `fetchGroundwaterStations()`.
- Vízállás „pontosan 3 állomás" feltételezés **dinamikussá** téve: StationSelector dobás eltávolítva,
  MultiStationChart / ForecastDataTable `useQueries`-re (hook-szabály), WaterBodiesTable rejtve Dráván.
- Régió-tudatos hookok: `useCities`/`useStations`/`useGroundwaterWells` `region` paraméterrel; a `drava`
  ág a legacy `is_active/enabled` szűrőt **átmenetileg** átlépi (go-live-ig), a `duna` ág változatlan.

**Verifikáció:** `npm run build` ✅, `tsc --noEmit` ✅, tesztek: nulla új hiba (a meglévő 71 környezeti/
hálózati bukás main-en is megvan; StationSelector teszt frissítve).

**Nyitott (go-live, külön jóváhagyással):** (1) élesítő migráció `is_active=true`/`enabled=true`;
(2) egyszeri groundwater REST-backfill futtatása; (3) a régió-tudatos hookok `drava` `is_active/enabled`
kivételének eltávolítása; (4) Dráva push-riasztás hatókörön kívül. **PROD-figyelmeztetés mérlegelendő:**
a groundwater REST-fix a Duna-kutak frissességét is javítja.

---

## Tartalomjegyzék

1. [Projekt áttekintés](#1-projekt-áttekintés)
2. [Fő fejlesztési fázisok](#2-fő-fejlesztési-fázisok)
3. [Kritikus döntések és indoklásuk](#3-kritikus-döntések-és-indoklásuk)
4. [Ismert bugok és javításaik](#4-ismert-bugok-és-javításaik)
5. [Backend / Adatforrás változások](#5-backend--adatforrás-változások)
6. [Biztonsági javítások](#6-biztonsági-javítások)
7. [UI/UX fejlesztések](#7-uiux-fejlesztések)
8. [Folyamatban lévő / nyitott kérdések](#8-folyamatban-lévő--nyitott-kérdések)

---

## 1. Projekt áttekintés

| | |
|---|---|
| **Alkalmazás neve** | DunApp PWA |
| **Cél** | Meteorológiai, vízállás és aszálymonitorozó PWA Dél-Magyarország számára |
| **Prod URL** | https://dunapp.netlify.app |
| **GitHub** | https://github.com/endresztellik-gif/DunApp |
| **Supabase projekt** | `zpwoicpajmvbtmtumsah` |
| **Tech stack** | React 18 + TypeScript + Vite + Tailwind CSS + Supabase + Netlify |

### Modulok

| Modul | Helyszínek | Adatforrás | Státusz |
|-------|-----------|-----------|---------|
| Meteorológia | 5 város | OpenWeatherMap + Yr.no + RainViewer | ✅ Üzemel |
| Vízállás | 3 állomás | vizugy.hu scraping + HydroInfo | ✅ Üzemel |
| Aszály | 5 monitoring hely + 10 kút | aszalymonitoring.vizugy.hu + vizugy.hu | ✅ Üzemel |

---

## 2. Fő fejlesztési fázisok

### Phase 9 (2025-11-02) — Meteorológia modul

Első nagyobb feature fázis, ekkor épült ki a meteorológia modul teljesen:
- **6 órás előrejelzés** — Yr.no API, 11 adatpont 72 órára
- **Animált radarkép** — RainViewer API, 13 frame, play/pause vezérlő
- **Automatikus frissítés** — pg_cron óránkénti futás (:05)
- **Teljesítmény** — 11.6%-os bundle csökkentés (112KB → 99KB gzip), React.memo(), code splitting

### Phase 4 (2025-11-03) — Vízállás modul + Push értesítések

- Vízállás adatok vizugy.hu scraping-ből
- Push értesítések VAPID-dal (riasztás ha Mohács ≥ 400 cm)
- `usePushNotifications` hook + `NotificationSettings` komponens
- Edge Functions: `fetch-water-level`, `check-water-level-alert`, `send-push-notification`

### Phase 5 (2025-11-03 – 2025-11-04) — Aszály modul

- **Áttörés:** `aszalymonitoring.vizugy.hu` Pattern API felfedezése (index.php?view=pattern)
- 5 monitoring helyszín: Katymár, Dávod, Szederkény, Sükösd, Csávoly
- 7 adatkészlet: HDI, vízhiány, talajnedvesség (6 mélység), hőmérséklet, csapadék, páratartalom
- Talajvíz kutak: kezdetben placeholder adat, lásd 2026-01-09 hotfix

### v3.2 — Dunai tájkép redesign (2026-03-22 – 2026-03-23)

- Teljes vizuális redesign: CSS custom properties + `dun-*` osztályok
- DM Serif Display (headings), IBM Plex Mono (számok), Inter (UI)
- Dark mode: `prefers-color-scheme` + `data-theme` manuális kapcsoló
- 4-tabos WeatherMapsWidget (Radar / Felhőtérkép / Szél / Hőmérséklet)
- RainViewer tile-alapú radar (TileLayer, `opacity` animáció) — stabil teljesítmény
- RadarMap komponens megmarad (vészeset backup), aktív: WeatherMapsWidget

---

## 3. Kritikus döntések és indoklásuk

### MapContainer konfiguráció (WeatherMapsWidget)

**TILOS:**
- `preferCanvas={true}` → Canvas renderer TileLayer sub-pixel shift-et okoz
- `maxBounds` + `maxBoundsViscosity` → koordináta eltolást okoz

**Megmarad:** `bounceAtZoomLimits={false}`, `scrollWheelZoom={false}`, `touchZoom={true}`

**Default view:** center `[45.85, 18.5]`, zoom 9 — ez mutatja jól a célterületet (Baja–Mohács–Pécs háromszög)

### Radar: TileLayer opacity animáció vs ImageOverlay

A RainViewer tile alapú (`/512/{z}/{x}/{y}/2/1_1.png`) megközelítés lett választva az ImageOverlay helyett, mert:
- Az ImageOverlay sub-pixel koordináta eltolást okozhat zoom váltáskor
- A TileLayer smooth opacity váltása (`idx === frameIndex ? 0.80 : 0`) performáns és stabil
- Az összes frame egyszerre be van töltve DOM-ba, csak opacity vált — nincs villogás

### Radar alaptérkép opacity

A radar módban az OSM alaptérkép `opacity={0.45}` értékre van állítva (2026-03-24 fix), hogy a csapadékszínek jobban látszódjanak. A többi módban (szél, hőmérséklet) CartoDB Positron szintén 0.45-ön fut; felhőtérkép módban az OSM teljes opacitáson marad.

### Modul-specifikus szelektorok (FONTOS)

Minden modulnak saját helyszín/város szelektor van. **Soha ne hozzunk létre globális szelektor-t.** Az Aszály modulnak 2 külön szelektor van (monitoring helyszínek + kutak).

### Supabase projekt URL

Mindig: `zpwoicpajmvbtmtumsah.supabase.co`
Soha ne: `tihqkmzwfjhfltzskfgi` (régi, hibás URL, amely két cron job meghibásodásához vezetett)

### Groundwater adatforrás (2026-01-09 döntés)

vizugy.hu PHP endpoint (`talajvizkut_grafikon/index.php?torzsszam=CODE`) lett választva vizadat.hu API helyett:
- 13× gyorsabb (4.4 mp vs 60+ mp timeout)
- 15-34× több adat
- 100% sikerráta (vizadat.hu: 0%)

---

## 4. Ismert bugok és javításaik

### 2026-03-24: Push értesítés komponens eltűnik feliratkozás után

**Szimptóma:** Feliratkozáskor a komponens csak egy pillanatra villan fel, leiratkozás nem lehetséges.

**Gyök ok:** `NotificationSettings.tsx` 29-31. sor:
```tsx
if (isSubscribed && permission === 'granted') {
  return null;  // ← a komponens eltűnt feliratkozás után!
}
```

**Javítás:** Eltávolítottuk a korai `return null`-t. A komponens most akkor is megjelenik, ha feliratkozva van — így a leiratkozás gomb mindig elérhető. Leiratkozáshoz megerősítő párbeszédablak is hozzá lett adva.

**Érintett fájl:** `src/components/NotificationSettings.tsx`

### 2026-01-23: Talajvíz cron nem futott le

**Gyök ok:** Migration 021 soha nem lett deploy-olva — a cron job a régi vizadat.hu API-t hívta.

**Javítás:** Migration 021 manuálisan deploy-olva SQL Editorból. Smart threshold rendszer bevezetése (napi cron, de csak akkor fetchel ha ≥5 nap telt el).

### 2025-12-07: Csapadék és vízállás cron javaink nem futottak

**Gyök ok:** Hardcode-olt rossz Supabase URL (`tihqkmzwfjhfltzskfgi`) a migration 015-ben és 017-ben.

**Javítás:** Migration 018-019 a helyes URL-lel. Lecke: **mindig ellenőrizd a project URL-t `.env` alapján**, soha ne másold más migrációból.

### 2026-02-01: vizugy.hu API formátum változás

**Gyök ok:** `chartView()` függvény első paramétere megváltozott:
```
RÉGI: chartView([values], [timestamps], [], [metadata])
ÚJ:  chartView("4576", [values], [timestamps], [], [metadata])
```

**Javítás:** Regex opcionális string paraméterrel bővítve (visszafelé kompatibilis).

### 2024-01: GitHub Actions workflow ki volt kapcsolva

**Szimptóma:** Netlify production site fehér képernyő — a commit-ok nem deployolódtak.

**Gyök ok:** `.github/workflows/deploy.yml.disabled` — a workflow ki volt kapcsolva.

**Javítás:** Fájl visszanevezve `deploy.yml`-re.

### 2026-05-17: Meteorológia modul csak felvillan mobilon (PWA)

**Szimptóma:** PWA indításkor (mobil) a meteorológia modul csak egy pillanatra villan fel, majd nem elérhető. Desktop-on probléma nélkül működik.

**Gyök ok — React early-return anti-pattern:**

Az `App.tsx` 4 különböző React fát adott vissza a loading/error állapotokra. Amikor `citiesLoading` `true`-ról `false`-ra váltott, a React **lebontotta az egész loading tree-t és újraépítette a main tree-t** (teljes unmount+remount). Ez mobilon (lassabb hardver + hálózat) látható villanásként jelentkezett. Desktop-on a folyamat annyira gyors volt, hogy észrevehetetlen.

Három egymást követő loading állapot volt, mindegyik tree-switchez kötve:
1. `App.tsx` early return → "Városok betöltése..." spinner (külön tree)
2. Suspense lazy-load → "Modul betöltése..." spinner
3. `MeteorologyModule` early return → időjárás spinner (teljes modult elfedve, városlista is eltűnt)

Másodlagos problémák:
- `cities.length === 0` esetén (ha a fetch sikerül, de üres eredménnyel) a modul csendben nem renderelt
- Nem volt `ErrorBoundary` — ha bármi elszállt (pl. Leaflet mobilon), az app fehér képernyőre esett

**Javítás:**

`src/App.tsx`:
- A 4 early return törlése — egyetlen konzisztens render tree a modul nézetnél
- Loading/error state-ek a `<main>` tartalmon belülre kerültek (nem cserélik le a teljes fát)
- `cities.length === 0` fallback üzenet hozzáadva
- `<ErrorBoundary>` wrapper a Suspense tartalom köré

`src/modules/meteorology/MeteorologyModule.tsx`:
- Az időjárás-adat loading early return eltávolítva
- Spinner inline jelenik meg a városlista alatt (a városlista mindig látható marad)

**Eredmény:**
- Homepage → Meteorológia: **egyetlen tree-váltás** (ez elkerülhetetlen)
- Összes loading állapot ezután a fán belül, vizuális flash nélkül

**Commit:** `0072329` | **TypeScript:** 0 hiba | **Security review:** tiszta

---

## 5. Backend / Adatforrás változások

### Groundwater: vizadat.hu → vizugy.hu (2026-01-09)

| Metrika | vizadat.hu | vizugy.hu | Javulás |
|---------|-----------|-----------|---------|
| Mérések/kút | 30-60 | 926 | 15× több |
| Legjobb kút | 60 | 2,038 | 34× több |
| Sikerráta | 0% | 100% | +100% |
| Fetch idő | 60+ mp | 4.4 mp | 13× gyorsabb |

### Smart Cron bevezetése (2026-02-01)

Groundwater napi cron (`0 5 * * *`) valójában smart: csak akkor fetchel, ha ≥5 nap telt el az utolsó adat óta. Ez meggátolja a felesleges API hívásokat és az egyenetlen `*/5` day-of-month mintából adódó anomáliákat.

### Aktív Cron Jobs

| Job neve | Schedule | Edge Function | jobid | Státusz |
|----------|----------|---------------|-------|---------|
| fetch-meteorology-hourly | `5 * * * *` | fetch-meteorology | — | Aktív |
| fetch-water-level-hourly | `10 * * * *` | fetch-water-level | — | Aktív |
| fetch-precipitation-summary-daily | `0 6 * * *` | fetch-precipitation-summary | 9 | Aktív |
| fetch-drought-daily | `0 6 * * *` | fetch-drought | — | Aktív |
| fetch-groundwater-daily | `0 5 * * *` | fetch-groundwater-vizugy (smart) | 13 | Aktív |

---

## 6. Biztonsági javítások

### CWE-209/CWE-497 — Hibaüzenet szivárgás (2025-12-10)

Stack trace-ek és belső részletek nem kerülhetnek ki a kliensre. Minden Edge Function-ben `sanitizeError()` whitelist-alapú helper hívódik. A teljes hiba log szerver oldalon megmarad.

**Érintett fájlok:** `supabase/functions/_shared/error-sanitizer.ts` + 7 Edge Function.

### CSP (Content Security Policy)

`netlify.toml`-ban konfigurálva. Ha új külső forrást (API, CDN) adunk hozzá, a CSP-t is frissíteni kell. Runbook: `.claude/skills/dunapp-csp.md`.

### CodeQL (2025-12-08)

GitHub Actions CodeQL v4-re frissítve. Heti scan + minden push-ra fut.

---

## 7. UI/UX fejlesztések

### RadarMap mobil optimalizáció (2025-12-23)

- `setInterval` → `requestAnimationFrame` (35-45fps → 58-60fps)
- Párhuzamos preloading (szekvenciális helyett)
- Service Worker Workbox caching (`/met-radar/*`)
- GPU acceleration (`will-change: opacity`, `transform: translateZ(0)`)
- WebP content negotiation Netlify-on

### WeatherMapsWidget v3.0 (2026-03-22)

A régi `RadarMap` (OMSZ met.hu radar) lecserélve 4-tabos `WeatherMapsWidget`-re:
- **Radar** — RainViewer tile animáció (13 frame)
- **Felhőtérkép** — OMSZ MSG InfraCloud IR (6 frame)
- **Szél** — OpenWeatherMap wind_new tiles + szélnyíl markerek
- **Hőmérséklet** — OpenWeatherMap temp_new tiles + hőmérséklet badge markerek

### Dunai tájkép redesign (2026-03-22)

CSS Custom Properties alapú design system:
- Folyó-ihlette paletta (dunakék, őszi borostyán, dunai zöld, homok)
- `dun-card`, `dun-btn`, `dun-nav` CSS osztályok
- IBM Plex Mono monospace számjegyek az adatmegjelenítőkben
- Automatikus dark mode + manuális kapcsoló

---

## 7b. Bugfix session (2026-03-24)

### Push értesítés UX javítás

**Problémák:**
1. `NotificationSettings` feliratkozás után `return null`-lal eltűnt → leiratkozás nem volt lehetséges
2. A harang ikon mindig ugyanolyan színű volt, nem tükrözte az állapotot
3. Sem feliratkozásnál, sem leiratkozásnál nem volt megerősítő lépés

**Megoldás:**
- `Header.tsx`: `usePushNotifications` hook behúzva, harang gomb dinamikus stílussal:
  - Nem feliratkozott: halvány fehér (`rgba(255,255,255,.45)`)
  - Feliratkozott: cián (`var(--color-dun-wave-400)`) + halvány cián háttér
- `Header.tsx`: a modal tartalma egyszerű confirm dialog lett:
  - Feliratkozatlan → „Szeretnél értesítést kapni...?" + **[Feliratkozás]** / **[Mégsem]**
  - Feliratkozott → „Az értesítések aktívak..." + **[Leiratkozás]** / **[Mégsem]**
  - Sikeres akció után automatikusan bezárul, harang szín azonnal vált
- `NotificationSettings.tsx` (WaterLevelModule kártya): feliratkozott állapotban kompakt zöld sor jelenik meg (nem tűnik el); leiratkozáshoz a harang ikonhoz irányít

**Commit:** `decf3e5`

### Radar alaptérkép opacity

- `WeatherMapsWidget.tsx`: OSM alaptérkép radar módban `opacity={0.45}` (korábban 1.0)
- Indok: RainViewer csempéi átlátszók ahol nincs csapadék — a halvány háttér jobban kiemeli a radar színeket

---

## 9. v3.3.0 — vizugy.hu REST API + csapadék javítás (2026-05-07)

### Csapadék összesítés fix

**Probléma:** Az Open-Meteo Archive API 2-5 napos késéssel dolgozik. A legutóbbi napok `null`-ként (= 0 mm) szerepeltek az összesítőkben, ezért esős napok után sem jelent meg csapadék.

**Megoldás — kettős API stratégia:**
- **7 nap / 30 nap:** `api.open-meteo.com/v1/forecast?past_days=30` → valós idejű, nincs lag
- **YTD:** Archive API (jan. 1 – ma-3 nap) + Forecast API utolsó 3 nap

**Fájl:** `supabase/functions/fetch-precipitation-summary/index.ts`

---

### vizugy.hu REST API migráció

A `data.vizugy.hu` 2026 elején nyílt REST API-vá vált. A PecApp már implementálta; a shared klienst (`vizugy-api-client.ts`) átvettük DunApp-ba.

**Új shared modul:** `supabase/functions/_shared/vizugy-api-client.ts`

**TSZ azonosítók** (az API belső kódjai — ≠ hydroinfo kódok):

| Állomás | TSZ | Hydroinfo kód |
|---|---|---|
| Nagybajcs | 3 | 442502 |
| Baja | 1344 | 442031 |
| Mohács | 831 | 442032 |
| Belső-Béda | 150035 | (VOA GUID) |
| FTCS (Karapancsa) | 130033 | (VOA GUID) |
| Kadia | 130038 | (VOA GUID) |

**Átállított edge functionök:**

| Function | Régi forrás | Új forrás |
|---|---|---|
| `fetch-water-level` | hydroinfo.hu HTML scraping | vizugy.hu REST API (TSZ 3/1344/831) |
| `fetch-belso-beda-water-level` | vizugy.hu HTML scraping | vizugy.hu REST API (TSZ 150035) |
| `fetch-ftcs-water-level` | vizugy.hu HTML scraping | REST API-próba + HTML fallback |
| `fetch-kadia-water-level` | vizugy.hu HTML scraping | REST API-próba + HTML fallback |

> **Megjegyzés:** Az FTCS és Kadia kisebb csatorna/szivattyútelep állomások — a vmservice REST API nem adja vissza az adataikat, ezért automatikus HTML fallback van.

> **DB constraint:** `water_level_data.source` CHECK: csak `'vizugy.hu'`, `'hydroinfo.hu'`, `'manual'`, `'other'` engedélyezett.

---

## 8. Folyamatban lévő / Nyitott kérdések

### Radar provider döntés (2026-03-23 — nyitott)

Vizsgáltuk a radar provider opciókat. Eredmény:

| Provider | Zoom limit | Szabad? | Megjegyzés |
|----------|-----------|---------|-----------|
| RainViewer | Szabad zoom | Igen | Aktuálisan aktív |
| OMSZ met.hu | ~zoom 7 (pixelálódik) | Igen | Régi RadarMap.tsx-ben |
| Rainmapper.eu | ~zoom 8 | Igen | Tartalék opció |

**Nyitott kérdés:** Érdemes-e A/B tesztként vagy fallback-ként megtartani az OMSZ radart (pontosabb Magyarországra, de alacsonyabb zoom)?

### Vízállás: Több állomás adatintegráció

A HydroInfo MCP integrációja folyamatban — `fetch-belso-beda-water-level`, `fetch-ftcs-water-level`, `fetch-kadia-water-level` Edge Functions léteznek.

### Talajvíz: Dávod kút adathiány

A Dávod kút (448) utolsó adata 2025-10-09 — a forrás nem frissül. Megoldás: vizugy.hu upstream problema, nem az alkalmazásunkban van.

---

*Dokumentum létrehozva: 2026-03-24*
*Karbantartás: Minden jelentős változásnál frissíteni kell*
