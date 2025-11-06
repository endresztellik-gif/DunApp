# 🌊 Talajvízkút Adatgyűjtő - Supabase Integráció

Napi automatikus adatgyűjtés a **vizugy.hu** talajvízkút grafikonokról Supabase adatbázisba.

---

## 📋 Áttekintés

Ez a Python script:
- ✅ **Naponta 06:00-kor** automatikusan lefut (cron job)
- ✅ **15 talajvízkút** adatait scrapeli a vizugy.hu-ról
- ✅ **Csak új méréseket** szúr be Supabase-be (duplikátum ellenőrzés)
- ✅ **CSV backup** készítése opcionálisan
- ✅ **Logging** minden futásról (data/scraper.log)

---

## 🚀 Gyors Indítás

### 1. Függőségek Telepítése

```bash
pip3 install requests beautifulsoup4 pandas supabase python-dotenv
```

### 2. Környezeti Változók Beállítása

Másold át a `.env.example`-t `.env`-re:

```bash
cp .env.example .env
```

Szerkeszd a `.env` fájlt és add meg a Supabase hitelesítési adatokat:

```env
SUPABASE_URL=https://zpwoicpajmvbtmtumsah.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

**Service Role Key megszerzése:**
1. Supabase Dashboard → Settings → API
2. Másold ki a `service_role` secret-et (NEM az `anon` public key-t!)

### 3. Teszt Futtatás

```bash
cd talajviz
python3 talajviz_scraper_supabase.py
```

**Várható kimenet:**
```
============================================================
🌊 Talajvízkút Adatgyűjtő - INDULÁS
   Időpont: 2025-11-06 10:00:00
============================================================
✅ Supabase client inicializálva
✅ 15 kút betöltve a kutak.json-ból
🔍 Sátorhely (#4576) scraping...
   ✅ 120 mérés találva
🔍 Mohács II. (#912) scraping...
   ✅ 115 mérés találva
...
📊 Összesen 1785 mérés scrapolva 15 kútból
✅ Supabase: 1785 új rekord beszúrva
💾 1785 új rekord mentve CSV backup-ba: data/talajviz_adatok.csv
============================================================
🎉 SIKERES BEFEJEZÉS
   Scrapolva: 1785 mérés
   Beszúrva: 1785 új rekord
============================================================
```

---

## ⏰ Automatizálás (Cron Job)

### macOS / Linux

Nyisd meg a crontab editort:

```bash
crontab -e
```

Add hozzá ezt a sort (napi 06:00-kor fut):

```cron
0 6 * * * /path/to/dunapp-pwa/talajviz/run_daily.sh >> /path/to/dunapp-pwa/talajviz/data/cron.log 2>&1
```

**Példa abszolút útvonallal:**

```cron
0 6 * * * /Volumes/Endre_Samsung1T/codeing/dunapp-pwa/talajviz/run_daily.sh >> /Volumes/Endre_Samsung1T/codeing/dunapp-pwa/talajviz/data/cron.log 2>&1
```

**Ellenőrzés:**

```bash
crontab -l  # Listázza az aktív cron job-okat
```

### Windows

Használd a **Task Scheduler**-t:
1. Task Scheduler → Create Basic Task
2. Trigger: Daily, 06:00 AM
3. Action: Start a Program
4. Program: `python3`
5. Arguments: `C:\path\to\talajviz_scraper_supabase.py`
6. Start in: `C:\path\to\talajviz`

---

## 📁 Fájlstruktúra

```
talajviz/
├── talajviz_scraper_supabase.py  # Fő script (Supabase integráció)
├── kutak.json                     # 15 kút listája (név + törzsszám)
├── run_daily.sh                   # Cron job wrapper script
├── .env                           # Környezeti változók (TITKOS!)
├── .env.example                   # Példa konfig fájl
├── data/
│   ├── talajviz_adatok.csv        # CSV backup (opcionális)
│   ├── scraper.log                # Naplófájl
│   └── cron.log                   # Cron job kimenet
└── README.md                      # Ez a fájl
```

---

## 🗄️ Supabase Adatbázis Struktúra

### groundwater_wells (15 kút metaadatai)

| Mező         | Típus    | Leírás                              |
|--------------|----------|-------------------------------------|
| id           | UUID     | Elsődleges kulcs                    |
| well_name    | TEXT     | Kút neve (pl. "Sátorhely")         |
| well_code    | TEXT     | Törzsszám (pl. "4576")              |
| county       | TEXT     | Megye                               |
| city_name    | TEXT     | Település                           |
| latitude     | DECIMAL  | GPS szélesség                       |
| longitude    | DECIMAL  | GPS hosszúság                       |
| depth_meters | DECIMAL  | Kútmélység méterben                 |

### groundwater_data (Idősor adatok)

| Mező                | Típus        | Leírás                           |
|---------------------|--------------|----------------------------------|
| id                  | UUID         | Elsődleges kulcs                 |
| well_id             | UUID         | Külső kulcs → groundwater_wells  |
| water_level_meters  | DECIMAL(6,2) | Talajvízszint (m)                |
| water_level_masl    | DECIMAL(6,2) | tBf magasság (opcionális)        |
| water_temperature   | DECIMAL(4,1) | Vízhőmérséklet (opcionális)      |
| timestamp           | TIMESTAMPTZ  | Mérés időpontja (06:00 AM)       |
| created_at          | TIMESTAMPTZ  | Rekord létrehozási ideje         |

**Unique Constraint:** (well_id, timestamp) - megelőzi a duplikátumokat

---

## 🔍 Hibaelhárítás

### 1. "Hiányzó környezeti változók" hiba

**Tünet:**
```
❌ Hiányzó környezeti változók: SUPABASE_URL vagy SUPABASE_SERVICE_ROLE_KEY
```

**Megoldás:**
- Hozz létre `.env` fájlt a `talajviz/` mappában
- Másold be a `.env.example` tartalmát
- Add meg a valós Supabase URL-t és Service Role Key-t

### 2. "Kút nem található az adatbázisban" hiba

**Tünet:**
```
❌ Sátorhely: Kút nem található az adatbázisban (#4576)
```

**Megoldás:**
Ellenőrizd, hogy a `groundwater_wells` tábla tartalmazza az összes 15 kutat:

```sql
SELECT well_name, well_code FROM groundwater_wells ORDER BY well_name;
```

Ha hiányzik, futtasd újra a `002_seed_data.sql` migrációt.

### 3. Scraping timeout

**Tünet:**
```
❌ Timeout: Sátorhely
```

**Megoldás:**
- vizugy.hu lehet lassú vagy le van terhelve
- Script újrafuttatása később (cron job automatikusan újrapróbál másnap)
- Timeout növelése: `requests.get(url, timeout=30)`

### 4. Duplikátum adatok

**Megoldás:**
A script automatikusan kezeli a duplikátumokat:
- Database constraint: `(well_id, timestamp)` UNIQUE
- Duplikátumoknál egyszerűen átlépteti, nem hibát dob

---

## 📊 Adatok Ellenőrzése

### Supabase Dashboard

```sql
-- Összesített statisztika
SELECT
  w.well_name,
  COUNT(d.id) as data_points,
  MIN(d.timestamp) as first_measurement,
  MAX(d.timestamp) as latest_measurement
FROM groundwater_wells w
LEFT JOIN groundwater_data d ON w.id = d.well_id
GROUP BY w.well_name
ORDER BY w.well_name;
```

### CSV Backup

```bash
# CSV megnyitása
cat data/talajviz_adatok.csv | head -20

# Rekordok száma
wc -l data/talajviz_adatok.csv
```

---

## 🔗 Frontend Integráció

A frontend automatikusan használja a Supabase-ben tárolt adatokat:

1. **Mock mode kikapcsolása:**
   ```typescript
   // src/utils/mockGroundwaterData.ts
   export function isMockDataMode(): boolean {
     return false; // ← Átállítva false-ra
   }
   ```

2. **Chart automatikusan real data-t használ:**
   - `useGroundwaterTimeseries` hook Supabase-ből olvas
   - Piros "MOCK DATA" banner eltűnik
   - Valós 60 napos trend megjelenik

---

## 📝 Logging és Monitoring

### Log Fájlok

- **scraper.log**: Minden scraping részlet
- **cron.log**: Cron job kimenet (stdout + stderr)

### Log Szintek

- `INFO`: Általános működés (kutak száma, beszúrt rekordok)
- `DEBUG`: Részletes adatok (minden mérés)
- `WARNING`: Kisebb problémák (érvénytelen adat)
- `ERROR`: Kritikus hibák (HTTP hiba, DB hiba)

### Példa Log

```
2025-11-06 06:00:05 [INFO] ============================================================
2025-11-06 06:00:05 [INFO] 🌊 Talajvízkút Adatgyűjtő - INDULÁS
2025-11-06 06:00:05 [INFO]    Időpont: 2025-11-06 06:00:05
2025-11-06 06:00:05 [INFO] ============================================================
2025-11-06 06:00:05 [INFO] ✅ Supabase client inicializálva
2025-11-06 06:00:05 [INFO] ✅ 15 kút betöltve a kutak.json-ból
2025-11-06 06:00:05 [INFO] 🔍 Sátorhely (#4576) scraping...
2025-11-06 06:00:07 [INFO]    ✅ 120 mérés találva
2025-11-06 06:00:07 [INFO]    ✅ Sátorhely: 5 új mérés beszúrva Supabase-be
...
```

---

## 🛡️ Biztonság

- ⚠️ **`.env` fájl SOHA ne legyen commit-olva Git-be!**
- ✅ Service Role Key titkos - ne oszd meg
- ✅ CSV backup tartalmaz publikus adatokat (nincs API key)

**Ellenőrzés:**
```bash
cat .gitignore | grep .env
# Kimenet: talajviz/.env (ha nincs, add hozzá!)
```

---

## 🔄 Frissítés és Karbantartás

### Új Kút Hozzáadása

Szerkeszd `kutak.json`:

```json
{
  "nev": "Új Kút Név",
  "torzsszam": "12345"
}
```

Majd add hozzá a `groundwater_wells` táblához is:

```sql
INSERT INTO groundwater_wells (well_name, well_code, county, city_name, latitude, longitude)
VALUES ('Új Kút Név', '12345', 'Megye', 'Település', 46.1234, 18.5678);
```

### Script Frissítése

```bash
git pull origin main
cd talajviz
# Ellenőrizd a változásokat
git diff talajviz_scraper_supabase.py
```

---

## 📞 Support

**Gyakori kérdések:**
- Hány napnyi adat van?: Az összes elérhető a vizugy.hu-n (általában 180-365 nap)
- Milyen gyakran frissül?: Naponta egyszer 06:00-kor
- Mi van ha kiesik egy nap?: A következő futáskor letölti az elmaradt napokat is

**Kapcsolat:**
- GitHub Issues: [dunapp-pwa/issues](https://github.com/yourusername/dunapp-pwa/issues)
- Email: contact@dunapp.hu

---

**Verzió:** 1.0.0
**Utolsó frissítés:** 2025-11-06
**Státusz:** Production Ready ✅
