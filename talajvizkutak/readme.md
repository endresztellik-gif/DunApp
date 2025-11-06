# 🌍 Talajvízkút Adatgyűjtő (Duna–Dráva térség)

Ez a Python-szkript a `vizadat.hu` nyilvános vízügyi API-ját használja a
**Duna menti talajvízkutak** 60 napos vízszint-idősorainak automatikus letöltésére
és mentésére.  
Kifejezetten terepi felhasználásra és **PWA integrációhoz** készült.

---

## ⚙️ Funkciók

- 🔁 Lekérdezés 15 kijelölt **monitoringkútról** (Sátorhelytől Bátáig)
- 🧠 **Cache-rendszer**: naponta csak egyszer kér új adatokat, a többit a helyi cache-ből tölti
- 💾 Minden kúthoz külön **JSON-fájl**, valamint egy **összesített CSV**
- 📈 Minta-grafikon a Sátorhelyi kútról
- 🪄 A JSON-fájlok formátuma közvetlenül beolvasható a PWA frontenden (pl. Chart.js)

---

## 📍 Lefedett kutak

| Kút neve         | Kód     |
| ---------------- | ------- |
| Sátorhely        | #4576   |
| Mohács II.       | #912    |
| Kölked           | #1461   |
| Mohács           | #1460   |
| Mohács-Sárhát    | #4481   |
| Dávod            | #448    |
| Hercegszántó     | #1450   |
| Nagybaracska     | #4479   |
| Szeremle         | #132042 |
| Alsónyék         | #662    |
| Érsekcsanád      | #1426   |
| Decs             | #658    |
| Szekszárd-Borrév | #656    |
| Őcsény           | #653    |
| Báta             | #660    |

---

## 🧩 Fájlszerkezet
