#!/bin/bash
###############################################################################
# Talajvízkút Napi Adatgyűjtés
#
# Ez a script naponta 06:00-kor fut (cron job-ból)
# és legyűjti a 15 kút adatait a vizugy.hu-ról, majd beszúrja Supabase-be.
#
# Telepítés cron job-ként:
#   crontab -e
#   0 6 * * * /path/to/talajviz/run_daily.sh >> /path/to/talajviz/data/cron.log 2>&1
###############################################################################

# Navigálás a script könyvtárába
cd "$(dirname "$0")" || exit 1

# Timestamp kezdéskor
echo "========================================"
echo "🌊 Talajvízkút scraper - START"
echo "Időpont: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# Python környezet aktiválása (ha van virtualenv)
# Opcionális: uncomment ha virtualenv-et használsz
# source venv/bin/activate

# Python script futtatása
python3 talajviz_scraper_supabase.py

# Kilépési kód ellenőrzése
if [ $? -eq 0 ]; then
    echo "✅ Scraper sikeresen lefutott"
else
    echo "❌ Scraper hibával futott le"
    exit 1
fi

echo "========================================"
echo "🎉 BEFEJEZVE - $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
