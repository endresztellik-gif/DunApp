#!/bin/bash

###############################################################################
# DunApp PWA — külső TLS-tanúsítványok ellenőrzése
#
# MIÉRT LÉTEZIK:
# 2026-08-25-én a hydroinfo.hu új tanúsítványt kapott, de hibás láncot kezdett
# kiszolgálni (a leaf kibocsátója `e-Szigno RSA OV TLS CA 2026`, a szerver
# viszont az ECC köztest küldi). A böngésző ezt AIA-chasinggel elfedi, a Deno
# (rustls) NEM — így az Edge Function minden kérése elhalt, a vízállás-
# előrejelzés két hétig némán állt. Ugyanez történt a www.vizugy.hu-val is.
#
# Ez a script pontosan úgy nézi a láncot, AHOGY A DENO LÁTJA: a Mozilla root
# store-ral, AIA-chasing NÉLKÜL. Amit itt "FAIL"-nek lát, az az Edge
# Function-ben `invalid peer certificate: UnknownIssuer` hibaként jelentkezik.
#
# A pinelt CA-kat a `_shared/eszigno-fetch.ts`-ből olvassa ki, tehát nincs
# duplikált igazság: ha ott frissül a tanúsítvány, ez a script követi.
#
# HASZNÁLAT:
#   ./scripts/check-certs.sh              # minden host
#   ./scripts/check-certs.sh --edge       # csak az Edge Function-ök hostjai
#   ./scripts/check-certs.sh --days 30    # más lejárati küszöb (alap: 21 nap)
#
# KILÉPÉSI KÓD: 1, ha bármelyik lánc érvénytelen, vagy a küszöbön belül lejár.
###############################################################################

set -uo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
DIM='\033[2m'; NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIN_SOURCE="$REPO_ROOT/supabase/functions/_shared/eszigno-fetch.ts"

WARN_DAYS=21
EDGE_ONLY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --days) WARN_DAYS="$2"; shift 2 ;;
    --edge) EDGE_ONLY=1; shift ;;
    *) echo "Ismeretlen kapcsoló: $1" >&2; exit 2 ;;
  esac
done

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

###############################################################################
# Mozilla root store — ugyanaz a halmaz, amit a Deno/rustls használ
###############################################################################
CA_BUNDLE="$WORK/cacert.pem"
if ! curl -sS --max-time 60 -o "$CA_BUNDLE" https://curl.se/ca/cacert.pem; then
  echo -e "${RED}Nem sikerült letölteni a Mozilla CA bundle-t.${NC}" >&2
  exit 2
fi

# A pinelt CA-k kinyerése a forrásból (egyetlen igazságforrás).
PINNED="$WORK/pinned.pem"
python3 - "$PIN_SOURCE" "$PINNED" <<'PY'
import re, sys
src, out = sys.argv[1], sys.argv[2]
pems = re.findall(r'-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----',
                  open(src, encoding='utf-8').read(), re.S)
open(out, 'w').write('\n'.join(pems) + '\n')
print(f'  {len(pems)} pinelt CA beolvasva: {src.split("/")[-1]}')
PY

# A pinelt CA-kat használó hostoknál a Denónak is megvannak ezek → ezekkel
# együtt kell verifikálni. `-partial_chain`, mert a pinelt köztes önmagában
# is trust anchor lehet (pontosan így viselkedik a Deno caCerts-e).
BUNDLE_WITH_PINS="$WORK/bundle.pem"
cat "$CA_BUNDLE" "$PINNED" > "$BUNDLE_WITH_PINS"

###############################################################################
# Hostlista.  pinelt=1 → az Edge Function az eszignoFetch-en át éri el
#             réteg: edge (Deno, szigorú) | web (böngésző, AIA-val elnézőbb)
###############################################################################
#      host                        réteg  pinelt  mit szolgál ki
HOSTS=(
  "www.hydroinfo.hu             edge 1 vízállás-előrejelzés"
  "www.vizugy.hu                edge 1 FTCS/Kadia víztestek, talajvíz PHP-fallback"
  "vmservice.vizugy.hu          edge 1 aktuális vízállás + talajvíz REST"
  "data.vizugy.hu               edge 1 vizugy auth token"
  "aszalymonitoring.vizugy.hu   edge 1 aszály modul"
  "api.met.no                   edge 0 Yr.no időjárás-előrejelzés"
  "api.openweathermap.org       edge 0 aktuális időjárás"
  "api.open-meteo.com           edge 0 csapadék-előrejelzés"
  "archive-api.open-meteo.com   edge 0 csapadék-archívum"
  "api.rainviewer.com           web  0 radar (frontend)"
  "tilecache.rainviewer.com     web  0 radar csempék"
  "www.met.hu                   web  0 met.hu térképek"
  "odp.met.hu                   web  0 műhold"
  "map.hugeo.hu                 web  0 HUGEO talajvíz-térkép"
  "ovfgis2.vizugy.hu            web  0 OVF GIS"
  "geoportal.vizugy.hu          web  0 vízügyi geoportál"
)

FAILED=0
WARNED=0

check_host() {
  local host="$1" layer="$2" pinned="$3" purpose="$4"
  # A pinelt hostoknál `-partial_chain` kell: a pinelt köztes önmagában is
  # trust anchor lehet — pontosan így viselkedik a Deno `caCerts`-e.
  # (Üres tömböt NEM bontunk ki: bash 3.2-n `set -u` alatt "unbound variable".)
  local cafile="$CA_BUNDLE"
  local out
  if [ "$pinned" = "1" ]; then
    cafile="$BUNDLE_WITH_PINS"
    out=$(echo | openssl s_client -connect "$host:443" -servername "$host" \
          -CAfile "$cafile" -verify_hostname "$host" -partial_chain 2>&1)
  else
    out=$(echo | openssl s_client -connect "$host:443" -servername "$host" \
          -CAfile "$cafile" -verify_hostname "$host" 2>&1)
  fi

  local verify enddate issuer
  verify=$(echo "$out" | grep -m1 "Verify return code:" | sed 's/.*code: //')
  enddate=$(echo "$out" | openssl x509 -noout -enddate 2>/dev/null | sed 's/notAfter=//')
  issuer=$(echo "$out" | grep -m1 "^issuer=" | sed 's/.*CN *= *//;s/.*CN=//;s/,.*//')

  # A hátralévő napok python3-mal: a macOS `date -j -f` nem eszi meg az
  # openssl formátumát ("Sep 12 14:44:46 2026 GMT"), a GNU date igen — a
  # python3 mindkét platformon egyformán működik.
  local days="?"
  if [ -n "$enddate" ]; then
    days=$(ENDDATE="$enddate" python3 -c '
import os, datetime
try:
    dt = datetime.datetime.strptime(os.environ["ENDDATE"].strip(), "%b %d %H:%M:%S %Y %Z")
    dt = dt.replace(tzinfo=datetime.timezone.utc)
    print((dt - datetime.datetime.now(datetime.timezone.utc)).days)
except Exception:
    print("?")
' 2>/dev/null || echo "?")
  fi

  # CI-ban a GitHub Actions annotációkat is kiírjuk, hogy a futás felületén
  # (ne csak a naplóban) látszódjon. Lokálisan a GITHUB_ACTIONS üres → néma.
  local mark color note=""
  if [ -z "$verify" ]; then
    mark="NINCS KAPCSOLAT"; color="$RED"; FAILED=$((FAILED + 1))
  elif [ "$verify" != "0 (ok)" ]; then
    mark="LÁNCHIBA"; color="$RED"; note="$verify"
    FAILED=$((FAILED + 1))
  elif [ "$days" != "?" ] && [ "$days" -lt "$WARN_DAYS" ]; then
    mark="HAMAROSAN LEJÁR"; color="$YELLOW"; WARNED=$((WARNED + 1))
  else
    mark="OK"; color="$GREEN"
  fi

  if [ -n "${GITHUB_ACTIONS:-}" ]; then
    case "$mark" in
      "LÁNCHIBA"|"NINCS KAPCSOLAT")
        echo "::error title=TLS lánc: $host::$mark — $purpose ($note)" ;;
      "HAMAROSAN LEJÁR")
        echo "::warning title=Tanúsítvány lejár: $host::$days nap múlva — $purpose" ;;
    esac
  fi

  local pin_tag=""
  [ "$pinned" = "1" ] && pin_tag="${DIM}[pinelt]${NC}"

  printf "  %b%-16s%b %-28s %5s nap  %b%-28s%b  %b\n" \
    "$color" "$mark" "$NC" "$host" "$days" "$DIM" "${issuer:0:28}" "$NC" "$pin_tag"
  [ -n "$note" ] && printf "      %b└─ %s%b\n" "$RED" "$note" "$NC"
  printf "      %b%s%b\n" "$DIM" "$purpose" "$NC"
}

echo -e "${BLUE}DunApp — külső TLS-tanúsítványok${NC}"
echo -e "${DIM}Mozilla root store, AIA-chasing NÉLKÜL — ahogy a Deno/rustls látja.${NC}"
echo -e "${DIM}Lejárati figyelmeztetés: ${WARN_DAYS} napon belül.${NC}"
echo

echo -e "${BLUE}── Edge Function-ök (Deno — itt van a valódi kockázat) ──${NC}"
for row in "${HOSTS[@]}"; do
  read -r host layer pinned purpose <<< "$row"
  [ "$layer" = "edge" ] && check_host "$host" "$layer" "$pinned" "$purpose"
done

if [ "$EDGE_ONLY" -eq 0 ]; then
  echo
  echo -e "${BLUE}── Frontend (böngésző — AIA-chasinggel elnézőbb) ──${NC}"
  for row in "${HOSTS[@]}"; do
    read -r host layer pinned purpose <<< "$row"
    [ "$layer" = "web" ] && check_host "$host" "$layer" "$pinned" "$purpose"
  done
fi

echo
if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}${FAILED} host lánca érvénytelen.${NC}"
  echo -e "${DIM}Ha 'unable to verify the first certificate' → a szerver hiányos láncot küld.${NC}"
  echo -e "${DIM}Teendő: a leaf AIA 'CA Issuers' URL-jéről töltsd le a köztest, és vedd fel${NC}"
  echo -e "${DIM}a _shared/eszigno-fetch.ts ESZIGNO_CA_CERTS tömbjébe. Részletek:${NC}"
  echo -e "${DIM}docs/DEVELOPMENT_LOG.md 2026-09-07 · CLAUDE.md 'e-Szigno CA lánchiba'.${NC}"
  exit 1
fi

# A közeli lejárat NEM hiba: a tanúsítvány még érvényes. Csak azt jelzi,
# hogy hamarosan megújítják — és pont a megújítás az a pillanat, amikor ez a
# projekt kétszer is elhasalt (hydroinfo.hu 08-25, www.vizugy.hu 08-26).
# Ezért figyelmeztetés + annotáció, de a kilépési kód 0 marad.
if [ "$WARNED" -gt 0 ]; then
  echo -e "${YELLOW}Minden lánc érvényes, de ${WARNED} tanúsítvány ${WARN_DAYS} napon belül lejár.${NC}"
  echo -e "${DIM}A megújítás UTÁN futtasd újra ezt a scriptet: ha az új lánc törik,${NC}"
  echo -e "${DIM}itt derül ki percek alatt, nem napokig tartó néma adatkiesésből.${NC}"
  exit 0
fi

echo -e "${GREEN}Minden lánc érvényes, egyik sem jár le ${WARN_DAYS} napon belül.${NC}"
