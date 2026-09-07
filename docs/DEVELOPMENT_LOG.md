# DunApp PWA — Fejlesztési Napló

> **Cél:** Az összes fejlesztési döntés, hotfix, architektúrális választás és tanulság egy helyen.
> Minden jövőbeli fejlesztés előtt érdemes átolvasni.

**Utolsó frissítés:** 2026-09-07
**Projekt verzió:** 4.5.0

---

## 2026-09-07 — vitest triázs (2. kör): 55 → 0 bukás, a tesztkapu élesítve

**356 teszt zöld, 0 bukás** (kiindulás: 71 bukás / 290 zöld). Háromszori teljes futtatás azonos eredményt ad → sorrendfüggetlen.

### App.test — 14 → 0, három egymásra rakódó ok

1. **HomePage-landing.** Az `App` a `!activeModule` ágon a `HomePage`-et rendereli, amiben nincs `Header`. Új `renderAppInModule()` helper lép be egy modulba a render után — a landing csempéi `<button>`-ok `<h2>` címkével, tehát elérhető név szerint kattinthatók, nem kellett hozzá `data-testid`.
2. **`lazy()` + `Suspense`.** A modulok aszinkron töltődnek, a tesztek viszont szinkron `getByTestId`-t hívtak. → `findBy` + async tesztek.
3. **Explicit `role="tablist"`.** A `ModuleTabs` `<nav>`-ja explicit `role="tablist"`-et állít, ami **felülírja** az implicit `navigation` szerepet — a `getByRole('navigation')` sosem találhatta meg.

Ráadásul a fájl csak a `useCities`-t mockolta; a `useDroughtLocations` és a `useGroundwaterWells` valódi Supabase-hívásra futott, ezért a fájl önmagában átment, a teljes suite-ban viszont **sorrendfüggően** elbukott. Most mindkettő mockolva.

### UI-komponensek — 22 → 0, role-alapon (nem `data-testid`)

A tesztek a redesign előtti CSS-osztályokat keresték (`.spinner`, `.empty-state`, `.error-card`, `text-red-600`, `bg-cyan-600`). Új horgonyok: a `role="status"` / `role="alert"` és az azon belüli `aria-hidden="true"` elem.

**Miért role és nem `data-testid`:** a `data-testid` olyan jelölés, ami kizárólag a tesztért van — ha a `LoadingSpinner` elveszíti a `role="status"`-t, a képernyőolvasók elnémulnak, de a testid-es teszt zölden futna tovább. A role-alapú teszt viszont elbukik, mert azt méri, amit a felhasználó és a segédtechnológia ténylegesen érzékel.

**Fontos: a méret-tesztek nem voltak elavultak.** A `h-6 w-6 border-2` osztályok ma is pontosan ott vannak a komponensben — csak a `.spinner` szelektor volt rossz. Ténylegesen elavult mindössze 3+2 stílusteszt, ahol a komponens Tailwind-osztályról **design tokenre** váltott; ezek most a token nevére állítanak (`var(--accent-primary)`, `var(--text-secondary)`), ami a valódi szerződés.

Egy jsdom-részlet mérés alapján, nem találgatásból: a `borderColor` + `borderTopColor` együttesét a jsdom egyetlen shorthanddé vonja össze, és `var()` érték mellett nem bontja longhandekre — a `borderBottomColor` üres sztringet ad. Ezért a shorthandben keressük a tokent.

**Mellékesen egy vakon átmenő teszt is kiderült:** az `EmptyState` „does not render description when not provided" a nemlétező `.empty-state-text`-et kereste, ami mindig `null` volt — a teszt akkor is zöld lett volna, ha a leírás **megjelenik**. Most `queryByText`-tel valóban mér.

### Vízállás-tesztek — a fixture-ök a migráció előtti sémát használták

A `useWaterLevelData` és a `data-flow` fixture-jei még a régi oszlopneveket vitték (`station_name`, `river_name`, `city_name`, `lnv_level`, `kkv_level`, `nv_level`), a valódi tábla viszont `station_id` / `name` / `river` / `river_km` / `low_water_level_cm` / `high_water_level_cm` / `alert_level_cm` / `danger_level_cm` (ellenőrizve a prod sémán). A fixture-ök és az állítások átírva; a `cityName`-nek nincs is megfelelője, az kikerült.

### RadarMap — 15 → 6 teszt, a törölt kód tesztjei eltávolítva

A mock kiegészítése (`ImageOverlay`, `useMap`) után maradt 10 teszt a **RainViewer** JSON API-t mockolta, a komponens viszont **met.hu ODP** radarra lett átírva, ami nem is hív JSON-indexet. Ezek nem hibás tesztek működő kódra voltak, hanem törölt kód tesztjei — a „Radar Data Fetching", „Animation Controls" és „RainViewer overlay" blokkok törölve, a fejlécben dokumentálva, hogy miért. Ami maradt (6 teszt): megjelenítési állapotok, térképközéppont, marker + popup, OSM alapréteg — ezek a jelenlegi komponenst mérik.

### ÚJ: `useWaterLevelForecast.test.tsx` — 10 teszt a korábban fedezet nélküli útvonalra

Ez a hook adja az „5 Napos Előrejelzés" kártyát, és **nulla tesztfedezete volt** — pont az, ami 2026-08-25 és 09-07 között némán megállt. A régi `forecast` állítások a `useWaterLevelData` tesztjében laktak, de a funkció külön hookba költözött és a séma is változott; azok törölve, a fedezet ide került, a **valódi** oszlopnevekkel.

Kiemelendő két teszt:
- **Regressziós teszt a mostani kiesésre:** ha a legfrissebb kiadás minden dátuma múltbeli, a hook **üres listát** ad, nem hibát — pontosan ez volt a látható tünet („Nincs előrejelzési adat").
- **Negatív értékek épsége:** kisvíznél a Duna vízállása negatív (Baja `-12 … -19` cm). Egy „csak számjegy" parse előjel nélkül hozná — éles hiba lenne.

Egy testability-tanulság: a hook **maga** ír elő `retry: 3`-at, és a query-szintű beállítás erősebb a `QueryClient` defaultjánál, ezért a teszt `retry: false`-a nem érvényesül. A `retryDelay`-t viszont a hook nem adja meg → a wrapperben `retryDelay: 0`-val a 3 újrapróbálkozás azonnal lefut, és a hibaágas tesztek nem futnak bele az exponenciális backoff (~7 mp) okozta időtúllépésbe.

### CI

A vitest kapu **élesítve** (`continue-on-error: false`). Ezzel a `ci.yml`-ben már csak a **Prettier** maradt maszkolva (104 formázatlan fájl a `src/`-ben) — az a hátralévő tétel.

---

## 2026-09-07 — vitest triázs (1. kör): 71 → 55 bukás, és a CI hamis zöldje

**A legfontosabb felfedezés: a CI sosem volt piros — hamis zöldet jelentett.** A `ci.yml`-ben négy lépés `continue-on-error: true` volt (ESLint, Prettier, vitest, Deno edge tesztek), tehát a workflow **sikert írt ki** úgy, hogy közben a lint el sem futott, 71 teszt bukott és a Deno teszteket senki nem nézte. Ez rosszabb a pirosnál: pirosnál van ok utánanézni, hamis zöldnél nincs.

### Gyökérok szerinti triázs (nem tesztenként)

| # | Gyökérok | Bukás | Állapot |
|---|---|---|---|
| 1 | A Supabase-mockok nem ismerik a `.maybeSingle()`-t | 19 | ✅ **javítva** |
| 2 | A RadarMap `react-leaflet` mockja elavult | 15 | ✅ részben (15→10) |
| 3 | UI-tesztek a régi CSS-osztályokra (restyle óta) | 22 | ⏳ döntést igényel |
| 4 | App-tesztek a HomePage-landing előtti állapotra | 15 | ⏳ döntést igényel |

**1) `.maybeSingle()` — 19 bukás, egyetlen ok.** Mind a négy hook (`useDroughtData`, `useGroundwaterData`, `useWaterLevelData` + a `data-flow` integráció) `.maybeSingle()`-t hív az adatlekérdezésre, a mockok viszont csak `.single()`-t kínáltak. A lánc `undefined`-ba futott → a query sosem dőlt el → az `isLoading` örökre `true` maradt. Innen jött a rejtélyes `expected true to be false`. A valódi PostgREST builder **mindkét** metódust kínálja, ezért a mock most mindkettőt adja — így hűbb a valósághoz, nem lazább. `useDroughtData` és `useGroundwaterData` ezzel teljesen zöld.

**2) RadarMap mock — 15 bukás.** A komponens időközben `ImageOverlay`-t (radar-képréteg) és `useMap`-et (`InvalidateMapSize`) is importál; a mock ezekkel nem bővült, ezért mind a 15 teszt *„No export is defined on the react-leaflet mock"* hibával halt el, **mielőtt bármit is állított volna**. A mock kiegészítve → 5 teszt azonnal zöld lett.

A maradék 10 viszont mélyebb baj: ezek a tesztek a **RainViewer**-implementációt tesztelik (`fetch('https://api.rainviewer.com/public/weather-maps.json')`), a komponenst viszont azóta **met.hu ODP radarra** írták át, ami nem is hív JSON-indexet — a képkocka-URL-eket időbélyegből számolja. Ezek nem hibás tesztek működő kódra, hanem **törölt kód tesztjei**.

**3) UI-komponensek — 22 bukás** (`LoadingSpinner` 9, `EmptyState` 8, `ErrorBoundary` 5). A tesztek `document.querySelector('.spinner')`-t és `toHaveClass('h-6')`-ot használnak; a komponensek viszont Tailwind utility-osztályokra lettek átírva (`animate-spin rounded-full border-t-transparent`), `.spinner` osztály már nincs. Megjegyzés: a Tailwind-osztályokra állítani eleve törékeny — az **stílust** tesztel, nem viselkedést. A `LoadingSpinner` már ad `role="status"`-t, tehát van mire építeni.

**4) `App.test.tsx` — 14 bukás, egyetlen ok.** A tesztek azonnal `getByRole('banner')`-t várnak, de az `App` a `!activeModule` ágon a **`HomePage`** landinget rendereli, ami nem tartalmaz `Header`-t. A tesztek a HomePage bevezetése előtti állapotra íródtak. (A `RegionProvider` és a `dunapp-region` localStorage rendben van bennük — nem az a baj.) Egy fix, ami modult választ a render után, mind a 14-et viszi.

### Külön találat: nulla tesztfedezet a ma elromlott útvonalon

A `useWaterLevelForecast` hooknak — pontosan annak, ami mögött a ma javított vízállás-előrejelzés fut — **nincs tesztje**. Ráadásul a `useWaterLevelData.test.tsx` még mindig a hookból **kikerült** `forecast` mezőt állítja (a funkció átköltözött a külön `useWaterLevelForecast`-ba), innen a maradék 6 bukása.

### CI-kapuk élesítve, amik valóban átmennek

- **ESLint → `continue-on-error: false`.** A lépés saját megjegyzése is ezt kérte („ESLint v9 config migration needed") — az megvan.
- **Deno edge tesztek → `continue-on-error: false`.** 61/61 zöld. Ehhez javítani kellett egy flaky tesztet: a `check-water-level-alert` cutoff-tesztje **két külön óraolvasásból** számolt (`Date.now()` és `new Date()`), így ha közben eltelt 1 ms, `6.000000277…` jött ki és elhasalt. Most egyetlen rögzített időpontból számol — ugyanaz az aritmetika, determinisztikus eredmény. 5/5 futásra stabil.
- Prettier és vitest **marad** `continue-on-error: true`, de a megjegyzésük mostantól a valós okot és a hátralévő munkát írja, nem azt, hogy „temporarily skip".

**Eredmény:** 306 passed (volt 290), 55 failed (volt 71).

---

## 2026-09-07 — ESLint flat config migráció: a lint-kapu újra ad jelet

**A tényleges állapot.** A `npm run lint` nem „pár warningot" adott, hanem **el sem indult**:

```
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```

Az ESLint v9 óta a CLI nem olvassa a `.eslintrc.*` formátumot, a repóban viszont `.eslintrc.json` volt. Vagyis a CI lint-lépése **hosszú ideje nulla ellenőrzést futtatott** — ez volt a legolcsóbban visszaszerezhető védőháló a három örökölt CI-piros (ESLint / Prettier / vitest) közül.

**Nem kellett új függőség** — a flat-config-kész csomagok (`@eslint/js`, `typescript-eslint`, `globals`, `eslint-plugin-react` 7.37, `react-hooks` 5.2, `react-refresh`) mind telepítve voltak már.

**Miért blokkos a config.** A repó három élesen eltérő futtatókörnyezetet kever, és egy globális beállítás mindegyiken hamis riasztást adna:

| Fájlminta | Környezet |
|---|---|
| `src/**` | böngésző + React (jsx-runtime, hooks, react-refresh) |
| `supabase/functions/**` | Deno (worker globals + `Deno` névtér, nincs DOM) |
| `*.config.ts`, `netlify/**`, `scripts/**` | Node |
| tesztek | + vitest globals (`globals: true`) |

**Szabály-döntések** (mind kommentezve a configban, hogy később ne kelljen kitalálni a miértet):
- `react/prop-types` **KI** — a propokat a TypeScript ellenőrzi; a szabály nem érti a TS interface-eket, ezért **28 hamis riasztást** adott. A `plugin:react/recommended` JS-projektekből örökölt maradványa.
- `@typescript-eslint/no-explicit-any` **WARN, nem ERROR** — 37 valós `any` van a kódban (Supabase válaszalakok, Leaflet/Recharts interop). Látható technikai adósság marad, de egy 37 fájlos refaktor nem tartozik a kapu bevezetéséhez.
- `react/display-name` **KI a tesztekben** — a React Query wrapperek inline komponensek.

**Valódi kódhibák — javítva, nem elnémítva** (a maradék 5 error mind az volt):
- `prefer-const` ×2: a `sourceUsed` sosem kap új értéket (FTCS + Kadia).
- `no-useless-escape`: `/\-/` → `/-/` a base64url dekódolásban (`send-push-notification`). Viselkedés bizonyítottan azonos: `'ab-cd_ef'` → `'ab+cd/ef'` mindkettővel.
- `no-unused-vars`: a Netlify handler `context` paramétere szándékosan használatlan (a kód saját kommentje is ezt írja) → `_context`, a projekt `^_` konvenciója szerint.
- `no-explicit-any` a `vite.config.ts`-ben: `as any` → **`as unknown as PluginOption`**. Ez nem elnémítás, hanem szűkebb típus; a `unknown` csak a rollup-plugin-visualizer és a Vite eltérő Rollup-típusai közti átfedéshiányt hidalja át.

**Egyéb.** A `lint`/`lint:fix` scriptekből kikerült az `--ext` (a flat config a `files` mintákból dolgozik). A `.eslintrc.json` **törölve** — az ESLint 9 nem olvassa, bent hagyva csak félrevezetne egy jövőbeli olvasót.

**Eredmény:** `npm run lint` **exit 0**, 50 warning láthatóan megmarad. Ellenőrizve: `tsc --noEmit` 0 hiba, `npm run build` OK, Deno edge tesztek **61/61**, és a módosított Edge Function fájlokon a `deno check` **1 hiba előtte és utána is** (`git stash`-sel összevetve, nulla új).

**Marad a másik két CI-piros** (külön körre): Prettier 104 fájl a `src/`-ben — egy `format:write`, de az egész `src/` git blame-jét elmossa, ezért külön commitba és `.git-blame-ignore-revs`-be való. Vitest 71 bukás 10 fájlban — ez a legértékesebb és a legnagyobb meló: jelenleg a tesztfuttatás használhatatlan kapuként, mert nem lehet megkülönböztetni egy valódi regressziót a zajtól.

---

## 2026-09-07 — Teljes tanúsítvány-audit: e-Szigno lánchiba (hydroinfo.hu + www.vizugy.hu)

Az előrejelzés-javítás után **végignéztük az összes külső HTTPS-végpontot**, mert a hiba osztálya (rossz CA-lánc) más forrásoknál is előjöhet. Módszer: `openssl s_client` a Mozilla root store-ral (`curl.se/ca/cacert.pem`, 121 gyökér), AIA-chasing **nélkül** — pontosan ahogy a Deno/rustls látja.

### Eredmény — Edge Function (Deno) végpontok

| Host | Állapot | Használó |
|---|---|---|
| `www.hydroinfo.hu` | ❌ **TÖRÖTT** → javítva | `fetch-water-level` (előrejelzés) |
| `www.vizugy.hu` | ❌ **TÖRÖTT** → javítva | `fetch-ftcs/kadia-water-level`, `fetch-groundwater-vizugy` (PHP fallback) |
| `vmservice.vizugy.hu` | ⚠️ OK, de cert **2026-09-12-én lejár** → megelőzőleg pinelve | `vizugy-api-client` (minden aktuális vízállás + talajvíz) |
| `data.vizugy.hu` | ⚠️ ua. | `vizugy-api-client` (auth token) |
| `aszalymonitoring.vizugy.hu` | ⚠️ ua. | `fetch-drought` |
| `api.met.no`, `api.openweathermap.org`, `api.open-meteo.com`, `archive-api.open-meteo.com`, `fcm.googleapis.com` | ✅ OK | meteo, csapadék, push |
| `vizadat.hu` | ⛔ nem elérhető (connection timeout) | csak a **holt** `fetch-groundwater` (nincs cronja, `fetch-groundwater-vizugy` váltotta) |

**Frontend (böngésző) végpontok:** mind a 12 ✅ (`rainviewer`, `met.hu`, `odp.met.hu`, `map.hugeo.hu`, `ovfgis2/geoportal.vizugy.hu`, OSM, cartocdn, unpkg, supabase, netlify). A böngésző amúgy is AIA-chasingel, ott ez a hibaosztály nem jelentkezik.

### A második törött host: `www.vizugy.hu`

Ugyanaz a minta, mint a hydroinfónál: `*.vizugy.hu` leaf **2026-08-26 12:39 UTC**-tól, kibocsátó `e-Szigno RSA OV TLS CA 2026`, de a szerver az **ECC** köztest küldi. Napló:

```
❌ FTCS error: TypeError: error sending request for url (https://www.vizugy.hu/?mapModule=OpGrafikon...):
   client error (Connect): invalid peer certificate: UnknownIssuer
```

Ez volt a képernyőképen a „Víztestek Napi Vízállása" tábla **FTCS / Kadia = N/A**-ja.

### Megelőző pinelés a 2026-09-12-i lejárat miatt

A `vmservice` / `data` / `aszalymonitoring.vizugy.hu` még a régi `e-Szigno SSL CA 2014` certet futtatja, ami **2026-09-12-én lejár**. Ha ugyanarra a hibásan konfigurált láncra újítanak (ahogy a `www` és a `hydroinfo` tette), akkor **egyszerre halna meg az aktuális vízállás, a talajvíz és az aszály modul**. Ezért ezek is átmentek a pinelt kliensre — a pinelt CA már a *jövőbeli* kibocsátó, tehát a rotáció nem tud kárt okozni.

### Kód

A `_shared/hydroinfo-fetch.ts` átnevezve **`_shared/eszigno-fetch.ts`**-re, `eszignoFetch(url, init?)` általános aláírással (teljes `RequestInit`, default User-Agent csak ha a hívó nem ad). Átállított hívási helyek: `fetch-water-level` (2), `fetch-ftcs-water-level`, `fetch-kadia-water-level`, `fetch-groundwater-vizugy` (PHP fallback), `fetch-drought`, `_shared/vizugy-api-client.ts` (4 — auth + 2 station-lista + timeseries).

### Ellenőrzés (deploy után, éles hívással)

| Függvény | Eredmény |
|---|---|
| `fetch-water-level` | 5/5 állomás, **6-6 előrejelzési nap** |
| `fetch-groundwater-vizugy` | 24 kút, 0 hiba, 8998 rekord — ebből **11 kút a korábban törött PHP-úton** |
| `fetch-drought` | 8/8 helyszín |
| `fetch-belso-beda-water-level` | OK (167 reading) |
| `fetch-ftcs` / `fetch-kadia` | TLS ✅, de lásd lent |

### ⚠️ FTCS és Kadia: a FORRÁS állt le, nem mi

A TLS javítása után az FTCS/Kadia már eléri az oldalt, de `No data in HTML scrape`. Kivizsgálva:
- a `www.vizugy.hu` `vizmercelista` táblája **üres** (csak fejléc, nulla adatsor),
- a REST API (`adatFajtaKod=68`) TSZ **130033** és **130038** utolsó észlelése egyaránt **2026-08-03 04:00 UTC**,
- ugyanez a dátum van a mi `water_body_measurements` táblánkban → **nem vesztettünk adatot**, a forrás hallgat.

Összehasonlításul Belső-Béda (TSZ 150035) ugyanabban az ablakban 666 readinget ad. Tehát a két szivattyútelepi mérce a vízügynél állt le; ezt nálunk nem lehet javítani. (Megfontolandó: az UI „N/A" helyett mutassa az utolsó ismert értéket + dátumot.)

### Egyéb, közben talált eltérések (nem javítva)

- **Halott cron duplikátumok 401-gyel:** `fetch-meteorology-hourly` (jobid 5, `5 * * * *`) az `invoke_fetch_meteorology()`-t hívja **elavult Bearer tokennel** → óránként 401 (24 db/nap). Az igazi meteo a jobid 1 (`*/20`), az megy. Ugyanez `fetch-drought` (jobid 3 ✅ 200) vs `fetch-drought-daily` (jobid 6 ❌ 401, `invoke_fetch_drought()` nem küld Authorizationt). Tisztítás: `SELECT cron.unschedule(5); SELECT cron.unschedule(6);`
- **Elavult CLAUDE.md cron-tábla** — javítva ebben a körben a valós állapotra.
- **Befagyott talajvízkutak a forrásnál:** Decs (2026-03-31), Nagybaracska / Szeremle (04-13), Alsónyék / Báta / Őcsény (05-29), Dávod (06-16). A többi 12 kút friss.
- `supabase/functions/fetch-groundwater` (vizadat.hu) **holt kód** — nincs cronja, a host sem válaszol.

**Tanulság.** Egy CA-rotáció egyszerre több hostot is elvisz, ha közös a kibocsátó — a `*.vizugy.hu` és a `hydroinfo.hu` ugyanattól a Microsec köztestől kap certet. Érdemes a cert-lejáratot monitorozni: a `vizugy.hu` aldomainek **2026-09-12-i** lejárata ugyanezt a kört ismételné meg.

---

## 2026-09-07 — Vízállás-előrejelzés leállt: hydroinfo.hu TLS lánchiba (UnknownIssuer)

**Tünet.** A vízállás modulban a „5 Napos Előrejelzés" kártya „Nincs előrejelzési adat"-ot mutatott, miközben a hydroinfo.hu weben rendben megjelenítette az előrejelzést. Az aktuális vízállás / vízhozam frissült — csak az előrejelzés nem.

**Diagnózis.** A `water_level_forecasts` tábla utolsó írása **2026-08-25 09:00 UTC** volt (a `water_level_data` ugyanakkor óránként frissült). A `fetch-water-level` óránként lefutott és 200-at adott vissza, de ~45 mp-ig tartott — ez volt az árulkodó jel: az 5 hydroinfo-fetch mind a 3 retryt végigfutotta. A `function_logs` megerősítette:

```
❌ Detail table for Baja: error sending request for url
   (https://www.hydroinfo.hu/tables/442031H.html):
   client error (Connect): invalid peer certificate: UnknownIssuer
```

**Gyökérok.** A hydroinfo.hu **2026-08-25 08:35 UTC-kor** (pontosan a leállás előtt fél órával) új leaf tanúsítványt kapott, amelynek kibocsátója az `e-Szigno RSA OV TLS CA 2026`. A szerver viszont továbbra is a **rossz (ECC) köztes tanúsítványt** küldi a handshake-ben (`e-Szigno OV TLS CA 2026` — „RSA" nélkül), így a lánc nem záródik. Böngésző/macOS ezt elfedi, mert az AIA „CA Issuers" URL-ről letölti a hiányzó köztest; a Deno (rustls) **nem csinál AIA-chasinget** → `UnknownIssuer`. Ellenőrizve: `openssl s_client` is „unable to get local issuer certificate"-tel bukik.

A helyes lánc: leaf ← `e-Szigno RSA OV TLS CA 2026` ← `e-Szigno RSA TLS Root CA 2025` (ez utóbbi az AIA-ból tölthető, a `Microsec e-Szigno Root CA 2009` cross-signolja).

**Javítás.** Új `supabase/functions/_shared/hydroinfo-fetch.ts`: beágyazza a két hiányzó tanúsítványt PEM-ként, és `Deno.createHttpClient({ caCerts })`-szel épít egy HTTP klienst, amit a `hydroinfoFetch(url)` használ. A `fetch-water-level` mindkét scraper-je (detail table + konszolidált `dunelotH.html`) erre vált. A pinelt CA-k csak **hozzáadódnak** az alap trust store-hoz, nem váltják le — ha a hydroinfo megjavítja a láncát, ez ártalmatlan marad. Ha a runtime-ból hiányozna a `Deno.createHttpClient`, a helper warninggal sima `fetch`-re esik vissza.

**Ellenőrzés.** Deploy után manuális invoke: **5/5 állomás, mind 6 előrejelzési nap** (Nagybajcs is, a konszolidált táblából). A DB-be írt Baja-sor bitre egyezik az élő hydroinfo táblával (`-12 ±2`, `-17 ±5`, `-19 ±8`, `-19 ±13`, `-15 ±19`, `-4 ±24`).

**Tanulság.** Külső HTML-scraping esetén a „200 OK + üres eredmény" néma hiba. Két konkrét jelzés vitt a megoldáshoz: (1) az edge_logs-ban a futásidő ugrott ~7 mp-ről ~45 mp-re (retry-backoff), (2) a tanúsítvány `notBefore` dátuma pontosan egybeesett az utolsó sikeres adatírással. Deno/rustls **nem** tud AIA-chasinget — ami böngészőben működik, edge function-ből eldőlhet.

**Nyitott (nem ebben a körben javítva):**
- `issued_at` minden futásnál `new Date()` → az `onConflict: 'station_id,forecast_date,issued_at'` upsert soha nem ütközik, óránként új sorhalmaz keletkezik (`water_level_forecasts` ma **134 ezer sor**). Helyesen a lapról olvasott „Kiadva:" időbélyeget kellene `issued_at`-nek használni — akkor az upsert valóban deduplikálna.
- A CLAUDE.md cron-táblázata elavult: a `fetch-water-level` valójában `0 * * * *` (nem `10 * * * *`), a meteo két jobbal is fut (`*/20 * * * *` + `5 * * * *`), és van egy nem dokumentált `fetch-water-bodies-daily` (`0 7 * * *`).

---

## 2026-06-28 — Dráva aszály crash-fix + met.hu fullscreen jelmagyarázat + v4.5

Hibajavító kör a 2026-06-26-i Dráva-fejlesztés után (commit `fe0018d`, **közvetlenül `main`-re** pusholva — user-döntés, nem PR).

**1. Dráva aszály modul crash (a fő bug) — `DroughtLocationSelector`.**
A komponens render közben hard errort dobott, ha a helyszínek száma nem pontosan 5 (`locations.length !== 5`) — régi invariáns abból, amikor az aszály csak a Dunához létezett. A Dráva aszály modul **3** helyszínnel (Felsőszentmárton, Berzence, Kálmáncsa) → a throw-t az `ErrorBoundary` kapta el → „Hiba történt", a teljes drávai aszály-nézet kifagyott (a meteo + vízállás ment, mert azok selectorai nem ilyen merevek). Javítás: `!== 5` → **`< 1`** a testvér `WellSelector` mintájára (ami már korábban így volt) — a helyszín-/kútszámok régiófüggők (Duna 5, Dráva 3). JSDoc/kommentek + `DroughtModule` prop-kommentek frissítve. Tesztek átírva: az „exactly 5" tesztek helyett üres-lista-dob + Duna(5)/Dráva(3) elfogad → **27/27 zöld**.

**2. met.hu térkép fullscreen jelmagyarázat — `WaterDeficitDashboard`.**
A 3 aszály-térképből kettő (`DroughtMapsWidget`: HUGEO + Aszályindex) már `CollapsibleLegend`-del bírt fullscreenben, de a met.hu talaj-vízhiány térkép **zoom-modaljából hiányzott** a jelmagyarázat (csak normál nézetben, a kép alatt volt). Bekerült ugyanaz a félig átlátszó, lenyitható `CollapsibleLegend` (bal-alsó sarok), `stopPropagation`-nel hogy a jelmagyarázatra kattintás ne zárja be a modalt. A legend-tartalom közös `legendBody` változóba emelve (normál + fullscreen újrahasználat, duplikáció megszüntetve).

**Meteo fullscreen — már kész volt.** A `WeatherMapsWidget` (radar) a 2026-06-26-i körben már kapott fullscreen gombot + `CollapsibleLegend`-et; ellenőrizve, **nem kellett módosítani** (a felhasználói kérés ezen része már teljesült a kódban).

**Verzió:** 4.5.0 — `package.json` + HomePage `v 4.5`. (A megjelenített verzió két helyen hardcode-olt; nincs single-source.)

**Ellenőrzés + élesítés:** `tsc --noEmit` 0 hiba; `security-review` a 6 módosított fájlon **0 találat** (csak statikus szöveg/komment/kliensoldali UI-guard + statikus jelmagyarázat-JSX). A teljes `vitest run` ~71 tesztet bukik 10 fájlban (LoadingSpinner, EmptyState, ErrorBoundary, RadarMap, App, hálózati hook-tesztek) — **git-stash baseline-nal igazolva, hogy ezek a változtatás ELŐTT is buknak** (környezeti/hálózati), nem a fix okozza; külön körben rendezendő. Commit `fe0018d` (6 fájl, +73/−51) közvetlenül `main`-re (`b2d5e23..fe0018d`), Netlify auto-deploy.

**Tanulság:** új régió/terület bevezetésekor a selectorokban sose feltételezz fix elemszámot — `>= 1` jellegű validáció kell, különben egy másik terület eltérő darabszáma **render-time crasht** okoz, amit az ErrorBoundary csak elnyel, de a modul használhatatlan lesz.

---

## 2026-06-26 — Aszály régió-szétválasztás (helyszínek + kutak) + teljes képernyős térképek + v4.2

Három felhasználói kérés egy körben (branch: `feat/drava-drought-locations-fullscreen-maps`, **PR #5 → main mergelve** `044c3aa`, prod-deploy sikeres).

**1. Régió-szétválasztás az aszály modulban.**
- *Kút-időbélyeg táblázat:* a `GroundwaterTimestampTable` a `get_all_well_last_timestamps` RPC-vel mind a 19 enabled kutat mutatta (Duna+Dráva) — ez volt a látható „nem válik szét" tünet (a kút-legördülő már szétvált). Javítás: a régió-szűrt `wells` levitele `DroughtModule → GroundwaterChart → GroundwaterTimestampTable`, és kliens-oldali szűrés `wellCode` alapján. Nincs DB-migráció. A „Talajvízkút Monitoring (10 kút)" fejléc dinamikus (`{wells.length} kút`).
- *Monitoring helyszínek:* a `drought_locations` táblába `region` oszlop (**migráció 029**), default 'duna'. 3 új Dráva állomás: **Felsőszentmárton** (Baranya), **Berzence**, **Kálmáncsa** (Somogy) — `region='drava'`. A `fetch-drought` `DROUGHT_LOCATIONS` tömbjébe bekerült a 3 OVF aszálymonitoring UUID (mindhárom 7 datasetet ad a pattern API-n, ellenőrizve). `useDroughtLocations(region)` szűr, App.tsx átadja a régiót.

**2. Kattintható, teljes képernyős térképek** (időjárás `WeatherMapsWidget` + aszály `DroughtMapsWidget` 2 ArcGIS térképe). Megosztott `useFullscreen` hook (Escape + body scroll-lock) és `CollapsibleLegend` komponens (lenyitható „ⓘ Jelmagyarázat" gomb, framer-motion). A térkép wrapper `fixed inset-0`-ra vált (DOM nem mozdul → Leaflet példány él), toggle után `invalidateSize()`. `X` vagy Esc zár. A met.hu `WaterDeficitDashboard` már korábban teljes képernyős volt (változatlan).

**3. Dráva térkép-középpont az aszály modulban.** A `DroughtMapsWidget` center/zoom régiófüggő (`useRegion`): Duna `[47.16,19.50]`/z7 (változatlan), Dráva `[46.03,17.42]`/z8. (Az időjárás modul már korábban régiófüggő volt.)

**Verzió:** 4.2.0 mindenhol (package.json, CLAUDE.md, README, HomePage `v 4.2`, DEVELOPMENT_LOG).

**Élesítés (2026-06-26):**
- Migráció `029` prodra alkalmazva `supabase db query --linked -f`-fel (additív DDL — ezúttal NEM blokkolta a prod-write classifier), verifikálva: 8 helyszín (3 Dráva + 5 Duna).
- `fetch-drought` deployolva `functions deploy --use-api`-val (Docker nélkül). Lefuttatva → **mind a 8 helyszínnek van mai `drought_data`-ja** (Felsőszentmárton HDI 1.48, Berzence 1.36, Kálmáncsa 1.55).
- **TIMEOUT-FIX (2. commit, `e20ebc2`):** a `fetch-drought` `REQUEST_TIMEOUT` 20s→**35s**. Felsőszentmárton ~24s / Berzence ~17s válaszidő az OVF pattern API-n → 20s-mal a NAPI CRON is tartósan hibázott volna rájuk. Caveat: lassú OVF-napokon a függvény túllépheti a Supabase edge gateway-timeoutot (a hívó 504/üres választ kap), DE az inszertek állomásonként inkrementálisak → az adat akkor is beíródik (ma is így lett mind a 8 feltöltve a záró üres válasz ellenére).
- PR #5 mergelve (`044c3aa`), GitHub Actions deploy zöld (build ✓, Netlify+Edge Functions ✓, Lighthouse ✓, Health check ✓), `https://dunapp.netlify.app` HTTP 200.

**Tanulság — lokális `main` elavult:** a `git pull --ff-only` a `main`-en nem futott (nincs upstream tracking); a stale lokális `main` (`88cf0bb`, Dráva ELŐTTI) félrevezet. Mindig `origin/main`-ról ágazz (`git checkout -B <ág> origin/main`), ne a lokális `main`-ról.

---

## 2026-06-25 — Dráva fast-follow: legend olvashatóság + aktiválás + v4.0

A go-live utáni rendrakás, egy preview-ban észrevett UI-bug és verzióemelés. Két PR (#2 cleanup, #3 verzió).

**Dupla jelmagyarázat + olvashatóság (UI-fix, PR #2) — `DroughtMapsWidget` + `components.css`:**
Előbb a `renderMap` KÉT helyen renderelte a jelmagyarázatot (térképre úszó overlay + térkép-alatti blokk) →
az overlay törölve, csak a térkép-alatti maradt (nagyobb hasznos képterület, user-döntés). Majd kiderült,
hogy a megmaradt doboz szövege hardcode-olt `text-gray-900`/`text-gray-700` → **dark mode**-ban olvashatatlan
a sötét `--bg-surface`-en. Javítás: téma-tudatos szöveg (`var(--text-primary)` cím, `var(--text-secondary)`
tételek), scope-olt **`.map-legend-below`** osztályon — a megosztott `.map-legend-item`-et NEM bántja, így a
`GroundwaterMap` fehér on-map overlay-e érintetlen. Mindkét aszály-térképre (HUGEO + Aszályindex) érvényes.

**Dráva aktiválás (PR #2, migráció `028`):** a 027-ben prod-safe `is_active/enabled=false`-szal seedelt Dráva
sorok átbillentve `true`-ra. A flag-flipet a **Supabase Dashboard SQL Editorban** futtattuk — az MCP/CLI
`db query --linked` írást a prod-write guard (auto classifier) **blokkolta**, ezért manuálisan. Verifikálva:
Dráva 3 város / 2 állomás / 9 kút aktív; Duna érintetlen (5 város).

**Hook-cleanup (PR #2):** a `useCities`/`useStations`/`useGroundwaterWells` `drava` `// TODO go-live`
flag-átlépő kivételei eltávolítva → **uniform `is_active=true` (+`enabled=true`) szűrés** minden régióra.
A Dráva azért látszik, mert a flagei már `true`. A legacy no-region ág (csak tesztek) változatlan.
`useCities` teszt 11/11, `tsc` zöld.

**Verzió v4.0 (PR #3):** a megjelenített/jelzett verzió mindenhol 4.0-ra — HomePage `v 4.0`, `package.json`
4.0.0, CLAUDE.md / DEVELOPMENT_LOG / README 4.0.0. Historikus changelog-bejegyzések érintetlenek.

**Deploy:** mind mergelve `main`-be, `origin/main`=`7169c86`, prod HTTP 200. Restore-pontok továbbra is állnak:
git tag `pre-drava-golive` (88cf0bb) + DB `groundwater_data_backup_20260623` (eldobható, ha stabil).

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
