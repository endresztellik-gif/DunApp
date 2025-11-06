import requests
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import json
import os

# --- Kútlista ---
KUTAK = [
    "Sátorhely", "Mohács II.", "Kölked", "Mohács", "Mohács-Sárhát",
    "Dávod", "Hercegszántó", "Nagybaracska", "Szeremle", "Alsónyék",
    "Érsekcsanád", "Decs", "Szekszárd-Borrév", "Őcsény", "Báta"
]

PARAM = "talajvízszint"
DAYS = 60

# --- Mappák ---
DATA_DIR = "output"
CACHE_FILE = os.path.join(DATA_DIR, "cache_log.json")
os.makedirs(DATA_DIR, exist_ok=True)

# --- Cache betöltés ---
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        cache = json.load(f)
else:
    cache = {}

today = datetime.now().strftime("%Y-%m-%d")

# --- Fő ciklus ---
all_data = []

for site in KUTAK:
    cache_key = site.replace(" ", "_")
    last_update = cache.get(cache_key)

    # Ha már ma frissítve volt, ugrás
    if last_update == today:
        print(f"🟡 {site}: cache-ből töltve")
        json_path = f"{DATA_DIR}/talajviz_{cache_key}.json"
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                site_data = json.load(f)
                for rec in site_data:
                    all_data.append({"kút": site, **rec})
        continue

    print(f"🔹 {site}: új lekérés...")

    to_date = datetime.now()
    from_date = to_date - timedelta(days=DAYS)
    url = (
        "https://vizadat.hu/api/v1/observations?"
        f"site_name={site}&parameter={PARAM}"
        f"&from={from_date.strftime('%Y-%m-%d')}&to={to_date.strftime('%Y-%m-%d')}"
    )

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        records = [
            {"dátum": r.get("time"), "vízszint": r.get("value")}
            for r in data.get("data", [])
        ]

        if not records:
            print(f"⚠️  Nincs adat: {site}")
            continue

        df = pd.DataFrame(records)
        df["dátum"] = pd.to_datetime(df["dátum"])
        df = df.sort_values("dátum")

        # JSON export
        json_path = f"{DATA_DIR}/talajviz_{cache_key}.json"
        df.to_json(json_path, orient="records", date_format="iso", force_ascii=False)
        print(f"   ✅ Mentve: {json_path}")

        # Cache frissítés
        cache[cache_key] = today

        # Összesítettbe
        for rec in records:
            all_data.append({"kút": site, **rec})

    except Exception as e:
        print(f"❌ Hiba {site}: {e}")

# --- Cache mentés ---
with open(CACHE_FILE, "w", encoding="utf-8") as f:
    json.dump(cache, f, ensure_ascii=False, indent=2)

# --- Összesített CSV ---
if all_data:
    df_all = pd.DataFrame(all_data)
    csv_path = os.path.join(DATA_DIR, "talajviz_osszes.csv")
    df_all.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f"📁 Összesített fájl: {csv_path}")

# --- Mintagrafikon ---
sample_site = "Sátorhely"
df_sample = pd.DataFrame([r for r in all_data if r["kút"] == sample_site])
if not df_sample.empty:
    plt.figure(figsize=(10, 5))
    plt.plot(df_sample["dátum"], df_sample["vízszint"], marker="o")
    plt.title(f"Talajvízszint – {sample_site} (elmúlt {DAYS} nap)")
    plt.xlabel("Dátum")
    plt.ylabel("Vízszint")
    plt.grid(True)
    plt.tight_layout()
    plt.show()

print("✅ Lekérések és cache frissítés befejezve.")
