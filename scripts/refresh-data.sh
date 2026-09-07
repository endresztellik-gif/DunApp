#!/bin/bash

###############################################################################
# DunApp PWA - Kézi adatfrissítés (production)
#
# CÉL:
# - A cron által amúgy is hívott Edge Function-ök kézi kiváltása, hogy ne
#   kelljen megvárni a következő órás/napi futást.
# - Minden hívás után kiírja, mit hozott vissza a függvény, és a végén
#   megmutatja, mennyire friss az adat az adatbázisban.
#
# MIÉRT KELL: a külső források (hydroinfo.hu, vizugy.hu) csendben el tudnak
# halni (pl. TLS-lánchiba, lásd DEVELOPMENT_LOG 2026-09-07). Ez a script az
# első dolog, amit ilyenkor le kell futtatni — azonnal látszik, melyik
# forrás ad adatot és melyik nem.
#
# KÖVETELMÉNY: curl, python3, és egy .env a repó gyökerében a
# VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY változókkal.
#
# HASZNÁLAT:
#   ./scripts/refresh-data.sh                # minden függvény
#   ./scripts/refresh-data.sh water          # csak a vízállás + előrejelzés
#   ./scripts/refresh-data.sh water bodies   # több csoport is megadható
#   ./scripts/refresh-data.sh --status       # nem hív semmit, csak a frissesség
#
# CSOPORTOK: water | bodies | groundwater | drought | meteo | precip
###############################################################################

set -uo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
DIM='\033[2m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Nincs .env a repó gyökerében: $ENV_FILE${NC}" >&2
  exit 1
fi

# A .env-t soronként olvassuk, nem `source`-oljuk: van benne zárójeles érték
# (contact@dunapp.hu), amin a shell elhasal.
SUPABASE_URL=$(grep -E '^VITE_SUPABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'"' \r')
ANON_KEY=$(grep -E '^VITE_SUPABASE_ANON_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'"' \r')

if [ -z "$SUPABASE_URL" ] || [ -z "$ANON_KEY" ]; then
  echo -e "${RED}Hiányzik a VITE_SUPABASE_URL vagy a VITE_SUPABASE_ANON_KEY a .env-ből${NC}" >&2
  exit 1
fi

FUNCTIONS_URL="$SUPABASE_URL/functions/v1"
REST_URL="$SUPABASE_URL/rest/v1"

FAILED=0

###############################################################################
# Egy Edge Function meghívása + a válasz tömör kiírása
###############################################################################
invoke() {
  local fn="$1"
  local label="$2"
  local timeout="${3:-180}"

  # ${#label} karakterben számol UTF-8 locale-lal, a printf %-32s viszont
  # bájtban — ezért kézzel töltjük fel, különben az ékezetes címkék csúsznak.
  local pad=""
  local i=${#label}
  while [ "$i" -lt 32 ]; do pad="$pad "; i=$((i + 1)); done
  printf "${BLUE}▶ %s%s${NC} " "$label" "$pad"

  local start
  start=$(date +%s)
  local body
  body=$(curl -sS -X POST "$FUNCTIONS_URL/$fn" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    --max-time "$timeout" 2>&1)
  local rc=$?
  local elapsed=$(( $(date +%s) - start ))

  if [ $rc -ne 0 ]; then
    echo -e "${RED}HIBA${NC} (curl rc=$rc, ${elapsed}s)"
    FAILED=$((FAILED + 1))
    return
  fi

  # A választ python3 formázza emberi összefoglalóvá; minden függvény más
  # alakot ad vissza, ezért több ismert kulcsra is ránézünk.
  # A választ python3 formázza emberi összefoglalóvá; minden függvény más
  # alakot ad vissza, ezért több ismert kulcsra is ránézünk.
  # NB: a kód egyszeres idézőjelek közt van, ezért benne NEM használunk
  # dupla idézőjel-escape-et f-stringen belül (Python 3.11 alatt syntax error).
  echo "$body" | python3 -c '
import sys, json
raw = sys.stdin.read()
try:
    d = json.loads(raw)
except Exception:
    print("NEM-JSON valasz: " + raw[:160]); sys.exit(2)

if d.get("success") is False or d.get("status") == "error":
    print("SIKERTELEN: " + str(d.get("error") or d.get("message"))[:160]); sys.exit(1)

parts = []
s = d.get("summary")
if isinstance(s, dict):
    ok = s.get("success", "?")
    total = s.get("total", "?")
    parts.append(str(ok) + "/" + str(total) + " ok")
    if s.get("failed"):
        parts.append(str(s["failed"]) + " hiba")

results = d.get("results")
if isinstance(results, list) and results:
    days = [r.get("forecastDays") for r in results
            if isinstance(r, dict) and r.get("forecastDays") is not None]
    if days:
        parts.append("elorejelzes: " + str(min(days)) + "-" + str(max(days)) + " nap/allomas")

for key, lbl in (("wells_total", "kut"), ("records_total", "rekord"),
                 ("wells_failed", "kut-hiba"), ("wells_empty", "ures kut")):
    if d.get(key) is not None:
        parts.append(str(d[key]) + " " + lbl)

data = d.get("data")
if isinstance(data, dict):
    for key in ("readingsReceived", "inserted"):
        if data.get(key) is not None:
            parts.append(key + "=" + str(data[key]))

print("OK - " + (", ".join(parts) if parts else "valasz rendben"))
sys.exit(0)
' > /tmp/dunapp_refresh_out.$$ 2>&1
  local prc=$?
  local summary
  summary=$(cat /tmp/dunapp_refresh_out.$$); rm -f /tmp/dunapp_refresh_out.$$

  if [ $prc -eq 0 ]; then
    echo -e "${GREEN}${summary}${NC} ${DIM}(${elapsed}s)${NC}"
  else
    echo -e "${RED}${summary}${NC} ${DIM}(${elapsed}s)${NC}"
    FAILED=$((FAILED + 1))
  fi
}

###############################################################################
# Frissesség-riport: mikori a legfrissebb sor az egyes táblákban
###############################################################################
freshness() {
  echo
  echo -e "${BLUE}═══ Adatfrissesség (anon kulcs + RLS — ahogy a PWA is látja) ═══${NC}"

  # A címkék ékezetesek: a printf %-34s bájtban számol, ezért a python
  # igazít karakter szerint, és ő dönt a színről is (nincs awk-hívás üres
  # értékre, ami korábban syntax errort dobott).
  check_table() {
    local label="$1" table="$2" ts_col="$3"
    curl -sS "$REST_URL/$table?select=$ts_col&order=$ts_col.desc&limit=1" \
      -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" --max-time 30 2>/dev/null \
      | LABEL="$label" python3 -c '
import sys, os, json, datetime

GREEN, RED, YELLOW, DIM, NC = "\033[0;32m", "\033[0;31m", "\033[1;33m", "\033[2m", "\033[0m"
label = os.environ["LABEL"].ljust(32)

def out(color, value, suffix=""):
    print(f"  {label} {color}{value}{NC}{suffix}")

raw = sys.stdin.read()
try:
    rows = json.loads(raw)
except Exception:
    out(RED, "lekérdezés sikertelen"); raise SystemExit
if not isinstance(rows, list):
    out(RED, f"hiba: {str(rows)[:60]}"); raise SystemExit
if not rows:
    out(RED, "nincs sor"); raise SystemExit

dt = datetime.datetime.fromisoformat(list(rows[0].values())[0].replace("Z", "+00:00"))
if dt.tzinfo is None:
    dt = dt.replace(tzinfo=datetime.timezone.utc)
age = (datetime.datetime.now(datetime.timezone.utc) - dt).total_seconds() / 3600

color = RED if age > 168 else YELLOW if age > 36 else GREEN
out(color, dt.astimezone().strftime("%Y-%m-%d %H:%M"), f" {DIM}({age:.1f} órája){NC}")
' 2>/dev/null
  }

  check_table "Vízállás (aktuális)"         "water_level_data"        "measured_at"
  check_table "Vízállás-előrejelzés"        "water_level_forecasts"   "issued_at"
  check_table "Víztestek (Béda/FTCS/Kadia)" "water_body_measurements" "measured_at"
  check_table "Talajvíz"                    "groundwater_data"        "timestamp"
  check_table "Aszály"                      "drought_data"            "created_at"
  check_table "Időjárás (aktuális)"         "meteorology_data"        "timestamp"
  check_table "Időjárás-előrejelzés"        "meteorology_forecasts"   "created_at"
  check_table "Csapadék-összegzés"          "precipitation_summary"   "updated_at"

  echo -e "  ${DIM}zöld < 36 óra · sárga 36–168 óra · piros > 1 hét vagy hiányzik${NC}"
}

###############################################################################
# Main
###############################################################################
echo -e "${BLUE}DunApp — kézi adatfrissítés${NC} ${DIM}($SUPABASE_URL)${NC}"
echo

if [ "${1:-}" = "--status" ]; then
  freshness
  exit 0
fi

# FIGYELEM: a változó NEM lehet GROUPS — az a bash egyik beépített speciális
# változója (a felhasználó csoportazonosítói), és az értékadás nem érvényesül.
# Emiatt a `want` sosem talált egyezést, és egyetlen függvény sem futott le.
SELECTED=("$@")
[ ${#SELECTED[@]} -eq 0 ] && SELECTED=(water bodies groundwater drought meteo precip)

want() { for g in "${SELECTED[@]}"; do [ "$g" = "$1" ] && return 0; done; return 1; }

want water       && invoke fetch-water-level              "Vízállás + előrejelzés"     180
want bodies      && invoke fetch-belso-beda-water-level   "Víztest: Belső-Béda"        120
want bodies      && invoke fetch-ftcs-water-level         "Víztest: FTCS (Karapancsa)" 120
want bodies      && invoke fetch-kadia-water-level        "Víztest: Kadia"             120
want groundwater && invoke fetch-groundwater-vizugy       "Talajvízkutak"              300
want drought     && invoke fetch-drought                  "Aszály (8 helyszín)"        300
want meteo       && invoke fetch-meteorology              "Időjárás"                   180
want precip      && invoke fetch-precipitation-summary    "Csapadék-összegzés"         180

freshness

echo
if [ $FAILED -gt 0 ]; then
  echo -e "${YELLOW}$FAILED függvény nem adott sikeres választ.${NC}"
  echo -e "${DIM}Naplók: https://supabase.com/dashboard/project/zpwoicpajmvbtmtumsah/logs/edge-functions${NC}"
  echo -e "${DIM}Ha 'invalid peer certificate: UnknownIssuer' látszik → CLAUDE.md \"e-Szigno CA lánchiba\".${NC}"
  echo -e "${DIM}ISMERT, NEM A MI HIBÁNK: az FTCS és a Kadia a forrásnál áll 2026-08-03 óta${NC}"
  echo -e "${DIM}(a vizugy REST és a HTML tábla is üres rájuk) — ezek bukása várható.${NC}"
  exit 1
fi

echo -e "${GREEN}Minden hívott függvény sikeres.${NC}"
echo -e "${DIM}A PWA-ban egy sima újratöltés után látszik az új adat (a React Query 1 órás cache-e induláskor üres).${NC}"
