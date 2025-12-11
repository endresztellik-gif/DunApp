# DunApp PWA - Skills Repository

Ez a mappa tartalmazza a DunApp PWA projekt fejlesztése során szerzett **gyakorlati skill-eket**, amelyek újrafelhasználható tudást tartalmaznak hasonló projektekhez.

---

## 📦 Elérhető Skill-ek

### 1. Supabase CodeQL Fixes Skill

**Fájl:** `supabase-codeql-fixes-skill.zip` (és .md)
**Verzió:** 1.0
**Létrehozva:** 2025-12-10
**Forrás projekt:** DunApp PWA GitHub Security Alert cleanup

**Mit tartalmaz:**
- GitHub CodeQL security alert javítási minták (33 alert megoldva)
- TypeScript type narrowing problémák megoldása
- Supabase Edge Function cleanup best practices
- Test file unused code removal patterns
- Batch fix workflow és commit strategy
- 7 batch commit példa részletes magyarázattal

**Alkalmazási terület:**
- ✅ Supabase Edge Functions (Deno/TypeScript)
- ✅ React/TypeScript test files (Vitest)
- ✅ GitHub CodeQL alert cleanup
- ✅ Production code quality improvement

**Eredmény:**
- 0 Open Alerts (33 Closed)
- ~180 sor dead code törölve
- 11 fájl tisztítva
- ~1.5 óra munka

---

## 📖 Hogyan Használd a Skill-eket

### Opció 1: ZIP Import (Ajánlott)

```bash
# 1. Töltsd le a ZIP fájlt
unzip supabase-codeql-fixes-skill.zip

# 2. Olvasd el a markdown dokumentumot
cat supabase-codeql-fixes-skill.md | less

# 3. Alkalmazd a projektedre
# - Kövesd a "Batch Fix Workflow" lépéseit
# - Használd a code pattern példákat
# - Adaptáld a commit message formátumot
```

### Opció 2: Direkt Markdown Olvasás

```bash
# Nyisd meg a markdown fájlt kedvenc editorodban
code supabase-codeql-fixes-skill.md

# Vagy terminálban:
less supabase-codeql-fixes-skill.md
```

### Opció 3: Claude Code Agent Betöltés

Ha Claude Code-ot használsz:

```bash
# Másold a skill-t a Claude agents mappába
cp supabase-codeql-fixes-skill.md ~/.claude/skills/

# Vagy használd direkt referencia-ként:
# "Claude, olvass el docs/skills/supabase-codeql-fixes-skill.md
#  és javítsd ki a GitHub CodeQL alerteket ugyanezzel a pattern-nel"
```

---

## 🎯 Mikor Alkalmazd Ezeket a Skill-eket

### Supabase CodeQL Fixes Skill

**Használd, ha:**
- ✅ GitHub Security Tab mutat CodeQL alerteket
- ✅ TypeScript project Supabase backend-del
- ✅ Unused variable/import warning-ok vannak
- ✅ Type comparison (CWE-570/571) alertek
- ✅ Test file cleanup szükséges
- ✅ Production-ready code quality-t akarsz

**Ne használd, ha:**
- ❌ Python/Java/Go projekt (nem TypeScript)
- ❌ Nincs GitHub CodeQL beállítva
- ❌ Alertek nem unused variable típusúak
- ❌ Kritikus security sebezhetőség (SQL injection, XSS, stb.)

---

## 📚 Skill Struktúra

Minden skill a következő struktúrát követi:

```markdown
# Skill Cím

## Áttekintés
- Mi ez a skill?
- Milyen problémát old meg?
- Milyen technológiákhoz kapcsolódik?

## Probléma Típusok és Megoldások
- Konkrét code példák (HIBÁS vs JAVÍTOTT)
- Step-by-step fix pattern
- Best practices

## Workflow
- Batch stratégia
- Commit patterns
- Verification steps

## Példák
- Valódi projekt tapasztalatok
- Commit message példák
- Metrikák

## Checklist
- Követhető lépések
- Ellenőrző pontok

## Eredmény Mérése
- Success criteria
- Metrikák

## Hasznos Linkek
- Dokumentációk
- Referenciák
```

---

## 🔄 Skill Verziókezelés

**Verzió formátum:** `MAJOR.MINOR`

- **MAJOR:** Jelentős változás (pl. új technológia, más workflow)
- **MINOR:** Kiegészítések, javítások, új példák

**Jelenlegi verziók:**
- `supabase-codeql-fixes-skill.md` - v1.0 (2025-12-10)

---

## 🤝 Skill Hozzájárulás

Ha új skill-t szeretnél hozzáadni a projekthez:

1. **Formátum követése:**
   - Markdown dokumentum
   - Gyakorlati példákkal
   - Valódi projekt tapasztalatok

2. **ZIP csomagolás:**
   ```bash
   zip -r my-new-skill.zip my-new-skill.md
   ```

3. **README frissítés:**
   - Adj hozzá új bejegyzést az "Elérhető Skill-ek" szekcióhoz
   - Frissítsd a verziószámot

4. **Commit:**
   ```bash
   git add docs/skills/
   git commit -m "docs: Add [Skill Name] skill guide"
   ```

---

## 📈 Skill Használat Tracking

**Supabase CodeQL Fixes Skill:**
- ✅ Alkalmazva: DunApp PWA (2025-12-10) - 33 alert megoldva
- ⏳ Tervezett: [Add here when used in other projects]

---

## 🔗 További Források

**Kapcsolódó dokumentációk:**
- `docs/API_DOCS.md` - Supabase Edge Functions API referencia
- `docs/SECURITY_AUDIT_REPORT.md` - Security audit eredmények
- `docs/DEPLOYMENT.md` - Deployment best practices
- `CLAUDE.md` - Projekt központi referencia

**Külső linkek:**
- [GitHub CodeQL Documentation](https://codeql.github.com/docs/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 📞 Support

Ha kérdésed van egy skill-lel kapcsolatban:
1. Olvasd el a skill teljes dokumentációját
2. Ellenőrizd a "Hasznos Linkek" szekciót
3. Nézd meg a példákat és code pattern-eket
4. Próbáld ki a workflow-t egy kis mintán először

---

**Skills Repository verzió:** 1.0
**Utolsó frissítés:** 2025-12-10
**Összes skill:** 1

*"Share knowledge, build better."* 🚀
