#!/usr/bin/env python3
"""
Talajvízkút Adatgyűjtő - Supabase Integráció (v2 - JavaScript Parser)

Naponta (06:00-kor) lefut, és:
  1. Scrapolja a vizugy.hu-t mind a 15 kútra (JavaScript array parsing)
  2. Közvetlenül beszúrja az új adatokat Supabase-be
  3. Opcionálisan CSV backup-ot is készít
  4. Csak új méréseket ad hozzá (duplikátum ellenőrzés)

Követelmények:
  pip install requests beautifulsoup4 pandas supabase python-dotenv

Használat:
  python talajviz_scraper_supabase.py
  vagy: ./talajviz_scraper_supabase.py
"""

import os
import sys
import json
import re
import logging
from datetime import datetime
from typing import List, Dict, Optional

import requests
from bs4 import BeautifulSoup
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# =============================================================================
# KONFIGURÁCIÓ
# =============================================================================

# Környezeti változók betöltése .env fájlból
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

KUTAK_JSON = "kutak.json"
CSV_BACKUP_PATH = "data/talajviz_adatok.csv"
LOG_PATH = "data/scraper.log"

# Logging beállítása
os.makedirs("data", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_PATH),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# =============================================================================
# SUPABASE INICIALIZÁLÁS
# =============================================================================

def init_supabase() -> Optional[Client]:
    """Supabase client inicializálás"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        logger.error("❌ Hiányzó környezeti változók: SUPABASE_URL vagy SUPABASE_SERVICE_ROLE_KEY")
        logger.error("   Hozz létre egy .env fájlt a talajviz/ mappában:")
        logger.error("   SUPABASE_URL=https://your-project.supabase.co")
        logger.error("   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
        return None

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("✅ Supabase client inicializálva")
        return supabase
    except Exception as e:
        logger.error(f"❌ Supabase inicializálási hiba: {e}")
        return None

# =============================================================================
# KÚTLISTA BETÖLTÉS
# =============================================================================

def load_wells() -> List[Dict[str, str]]:
    """Kútlista betöltése kutak.json-ból"""
    try:
        with open(KUTAK_JSON, "r", encoding="utf-8") as f:
            kutak = json.load(f)
        logger.info(f"✅ {len(kutak)} kút betöltve a kutak.json-ból")
        return kutak
    except FileNotFoundError:
        logger.error(f"❌ Nem található: {KUTAK_JSON}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        logger.error(f"❌ Hibás JSON formátum: {e}")
        sys.exit(1)

# =============================================================================
# WEB SCRAPING - JAVASCRIPT ARRAY PARSER
# =============================================================================

def scrape_well_data(torzsszam: str, nev: str) -> List[Dict[str, str]]:
    """
    Egyetlen kút adatainak scraping-e a vizugy.hu-ról (JavaScript array parsing)

    Returns:
        List of dicts: [{"datum": "2025-11-06", "vizszint": "6.16"}, ...]
    """
    url = f"https://www.vizugy.hu/talajvizkut_grafikon/index.php?torzsszam={torzsszam}"

    try:
        logger.info(f"🔍 {nev} (#{torzsszam}) scraping...")
        response = requests.get(url, timeout=15)
        response.raise_for_status()

        html_content = response.text

        # JavaScript array-ek keresése
        # chartView() hívás két array-vel: [vízszintek], [dátumok]
        # Példa: chartView(["616","617",...],["2024-11-11 04:00:00.0000000",...])

        # Keressük meg a chartView hívást
        chart_start = html_content.find('chartView(')
        if chart_start == -1:
            logger.warning(f"   ⚠️  {nev}: chartView() nem található a HTML-ben")
            return []

        # Keressük meg a záró zárójelet - figyelünk a beágyazott zárójelekre
        bracket_count = 0
        chart_end = -1
        for i in range(chart_start + 10, len(html_content)):
            if html_content[i] == '(':
                bracket_count += 1
            elif html_content[i] == ')':
                if bracket_count == 0:
                    chart_end = i
                    break
                bracket_count -= 1

        if chart_end == -1:
            logger.warning(f"   ⚠️  {nev}: chartView() záró zárójele nem található")
            return []

        # Kinyerjük a chartView argumentumait
        chart_call = html_content[chart_start + 10:chart_end]  # "chartView(".length = 10

        # Kettévágás a középső "],["  mentén
        split_pattern = r'\],\['
        parts = re.split(split_pattern, chart_call, maxsplit=1)

        if len(parts) != 2:
            logger.warning(f"   ⚠️  {nev}: chartView() nem tartalmaz két array-t")
            return []

        # Az első array
        water_levels_str = parts[0].lstrip('[')

        # A második array: megkeressük a záró ] jelet
        # (mert chartView-nak több mint 2 paramétere van)
        second_array_end = parts[1].find(']')
        if second_array_end == -1:
            logger.warning(f"   ⚠️  {nev}: Második array záró ] nem található")
            return []

        timestamps_str = parts[1][:second_array_end]

        # String → lista konverzió (JSON parse)
        try:
            water_levels = json.loads(f"[{water_levels_str}]")
            timestamps = json.loads(f"[{timestamps_str}]")
        except json.JSONDecodeError as e:
            logger.error(f"   ❌ {nev}: JSON parse hiba - {e}")
            return []

        if len(water_levels) != len(timestamps):
            logger.warning(f"   ⚠️  {nev}: Eltérő array hosszok ({len(water_levels)} vs {len(timestamps)})")
            return []

        measurements = []
        for i in range(len(water_levels)):
            try:
                # Vízszint: cm → méter
                water_level_cm = int(water_levels[i])
                water_level_m = water_level_cm / 100.0

                # Teljes timestamp: "2024-11-11 04:00:00.0000000"
                timestamp_full = timestamps[i]

                # CSAK REGGELI MÉRÉSEKET TARTJUK MEG (napi 1 mérés: 07:00 VAGY 08:00)
                # Parse hour from timestamp
                time_part = timestamp_full.split(' ')[1] if ' ' in timestamp_full else '00:00:00'
                hour = int(time_part.split(':')[0])

                # Skip if not morning measurement (07:00 or 08:00)
                # Some wells measure at 07:00 (Mohács, Érsekcsanád, Kölked, Mohács II.)
                # Others measure at 08:00 (Sátorhely, Dávod, etc.)
                if hour not in [7, 8]:
                    continue

                measurements.append({
                    "timestamp": timestamp_full,
                    "vizszint": f"{water_level_m:.2f}"
                })
            except (ValueError, IndexError) as e:
                logger.debug(f"   ⏭️  {nev}: Adat skip ({i}. elem) - {e}")

        logger.info(f"   ✅ {len(measurements)} mérés találva")
        return measurements

    except requests.exceptions.Timeout:
        logger.error(f"   ❌ Timeout: {nev}")
        return []
    except requests.exceptions.RequestException as e:
        logger.error(f"   ❌ HTTP hiba {nev}: {e}")
        return []
    except Exception as e:
        logger.error(f"   ❌ Scraping hiba {nev}: {e}")
        return []

# =============================================================================
# SUPABASE MŰVELETEK
# =============================================================================

def get_well_id(supabase: Client, torzsszam: str) -> Optional[str]:
    """Kút UUID lekérése a well_code alapján"""
    try:
        response = supabase.table("groundwater_wells").select("id").eq("well_code", torzsszam).single().execute()
        return response.data["id"] if response.data else None
    except Exception as e:
        logger.error(f"❌ Kút ID lekérési hiba (#{torzsszam}): {e}")
        return None

def insert_measurements_to_supabase(
    supabase: Client,
    well_id: str,
    measurements: List[Dict[str, str]],
    well_name: str
) -> int:
    """
    Mérések beszúrása Supabase-be (csak új adatok)

    Returns:
        Beszúrt rekordok száma
    """
    if not measurements:
        return 0

    new_count = 0

    for m in measurements:
        try:
            # Timestamp konverzió ISO 8601 formátumra
            # m["timestamp"] = "2024-11-11 04:00:00.0000000" → "2024-11-11T04:00:00Z"
            timestamp_str = m['timestamp']
            # Parse the timestamp (remove microseconds for simplicity)
            timestamp_parts = timestamp_str.split('.')
            timestamp_clean = timestamp_parts[0]  # "2024-11-11 04:00:00"
            # Convert to ISO format
            from datetime import datetime
            dt = datetime.strptime(timestamp_clean, "%Y-%m-%d %H:%M:%S")
            timestamp_iso = dt.isoformat() + "Z"

            # Beszúrás (upsert: conflict esetén ignore)
            data = {
                "well_id": well_id,
                "water_level_meters": float(m["vizszint"]),
                "timestamp": timestamp_iso
            }

            response = supabase.table("groundwater_data").insert(data).execute()

            if response.data:
                new_count += 1
                logger.debug(f"   ➕ {well_name}: {timestamp_iso} → {m['vizszint']}m beszúrva")

        except Exception as e:
            # Duplikátum vagy egyéb hiba - csendben léptetünk
            logger.debug(f"   ⏭️  {well_name}: {m.get('timestamp', 'N/A')} kihagyva ({str(e)[:50]})")

    return new_count

# =============================================================================
# CSV BACKUP (OPCIONÁLIS)
# =============================================================================

def save_to_csv_backup(
    measurements_by_well: Dict[str, List[Dict[str, str]]],
    kutak: List[Dict[str, str]]
):
    """CSV backup mentése (append mode)"""
    try:
        # Meglévő CSV betöltése
        try:
            existing = pd.read_csv(CSV_BACKUP_PATH)
        except FileNotFoundError:
            existing = pd.DataFrame(columns=["timestamp", "vizszint", "kut_nev", "torzsszam"])

        # Új adatok előkészítése
        new_rows = []
        for kut in kutak:
            torzsszam = kut["torzsszam"]
            nev = kut["nev"]

            for m in measurements_by_well.get(torzsszam, []):
                # Duplikátum ellenőrzés
                is_duplicate = ((existing["timestamp"] == m["timestamp"]) &
                               (existing["torzsszam"] == torzsszam)).any()

                if not is_duplicate:
                    new_rows.append({
                        "timestamp": m["timestamp"],
                        "vizszint": m["vizszint"],
                        "kut_nev": nev,
                        "torzsszam": torzsszam
                    })

        # Új adatok hozzáfűzése
        if new_rows:
            df_new = pd.DataFrame(new_rows)
            df_all = pd.concat([existing, df_new], ignore_index=True)
            df_all.to_csv(CSV_BACKUP_PATH, index=False, encoding="utf-8-sig")
            logger.info(f"💾 {len(new_rows)} új rekord mentve CSV backup-ba: {CSV_BACKUP_PATH}")
        else:
            logger.info("💾 CSV backup: nincs új adat")

    except Exception as e:
        logger.error(f"❌ CSV backup hiba: {e}")

# =============================================================================
# FŐPROGRAM
# =============================================================================

def main():
    """Főprogram: scraping + Supabase insert + CSV backup"""
    logger.info("=" * 60)
    logger.info("🌊 Talajvízkút Adatgyűjtő - INDULÁS")
    logger.info(f"   Időpont: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)

    # 1. Supabase inicializálás
    supabase = init_supabase()
    if not supabase:
        logger.error("❌ Supabase nem elérhető - kilépés")
        sys.exit(1)

    # 2. Kútlista betöltése
    kutak = load_wells()

    # 3. Scraping mind a 15 kútra
    measurements_by_well = {}
    total_scraped = 0

    for kut in kutak:
        measurements = scrape_well_data(kut["torzsszam"], kut["nev"])
        measurements_by_well[kut["torzsszam"]] = measurements
        total_scraped += len(measurements)

    logger.info(f"📊 Összesen {total_scraped} mérés scrapolva {len(kutak)} kútból")

    # 4. Beszúrás Supabase-be
    total_inserted = 0

    for kut in kutak:
        well_id = get_well_id(supabase, kut["torzsszam"])

        if not well_id:
            logger.error(f"❌ {kut['nev']}: Kút nem található az adatbázisban (#{kut['torzsszam']})")
            continue

        measurements = measurements_by_well.get(kut["torzsszam"], [])
        inserted = insert_measurements_to_supabase(supabase, well_id, measurements, kut["nev"])
        total_inserted += inserted

        if inserted > 0:
            logger.info(f"   ✅ {kut['nev']}: {inserted} új mérés beszúrva Supabase-be")

    logger.info(f"✅ Supabase: {total_inserted} új rekord beszúrva")

    # 5. CSV backup (opcionális)
    save_to_csv_backup(measurements_by_well, kutak)

    # 6. Összegzés
    logger.info("=" * 60)
    logger.info("🎉 SIKERES BEFEJEZÉS")
    logger.info(f"   Scrapolva: {total_scraped} mérés")
    logger.info(f"   Beszúrva: {total_inserted} új rekord")
    logger.info("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\n⚠️  Megszakítva felhasználó által")
        sys.exit(0)
    except Exception as e:
        logger.error(f"💥 Váratlan hiba: {e}", exc_info=True)
        sys.exit(1)
