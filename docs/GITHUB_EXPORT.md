# GitHub Export Plan — Builder Core v0.2

Cél: a Lovable-ben épült kódot egy GitHub repóba szinkronizálni úgy, hogy
verziózva, reviewable és cPanel-re telepíthető legyen, mielőtt a valódi DB
beköttetésre kerül.

---

## 1. Előfeltételek

- [x] Builder Core v0.2 lezárva, minden route 200.
- [x] `.env.example` létezik a repó gyökerében.
- [x] `.gitignore` kizárja: `node_modules/`, `.output/`, `dist/`, `.env`, `.env.*` (kivéve `.env.example`), `tsconfig.tsbuildinfo`, `.tanstack/`.
- [x] Secret scan: nincs hard-coded API kulcs, jelszó vagy token a kódban (csak a `demo` / `demo` mock login, ami nem valódi credential).
- [x] Minden új UI szöveg i18n kulcsból renderel.

## 2. Connect / create repo (Lovable oldal)

1. Lovable szerkesztő → `+` menü (bal alul a chat inputban) → **GitHub → Connect project**.
2. Engedélyezd a Lovable GitHub App-ot a kívánt szervezetre.
3. **Create Repository** — Lovable létrehozza az új repót és push-olja a jelenlegi kódot.
4. A két irányú sync azonnal aktív: Lovable change → GitHub push, GitHub push → Lovable preview.

## 3. Lokális klónozás (fejlesztők számára)

```bash
git clone git@github.com:<org>/<repo>.git
cd <repo>
bun install                # vagy npm install
cp .env.example .env       # mock-store futtatáshoz üresen is jó
bun run dev                # http://localhost:8080
```

## 4. Branch stratégia (javasolt)

```
main         → live (release-only, protected)
develop      → test / staging (CI-ról auto-deploy a test aldomainre)
feature/*    → új feature, PR-en át megy develop-ba
hotfix/*     → live javítás, közvetlen main-be PR-en át
```

A Lovable Branch Switching kísérleti — ha kell, Account Settings → Labs alatt aktiválható.

## 5. Commit-kompatibilitás ellenőrzés (elvégezve)

| Tétel | Státusz | Megjegyzés |
|-------|---------|-----------|
| `node_modules/` | ✅ ignored | |
| `.output/`, `.nitro/`, `.tanstack/` | ✅ ignored | build artifact |
| `tsconfig.tsbuildinfo` | ✅ ignored | most explicit |
| `.env`, `.env.*` | ✅ ignored | kivéve `.env.example` |
| `bun.lock` | ✅ tracked | reproducible install |
| `drizzle/` (migrations) | ⚠️ még nincs | B-3-ban generálódik |
| `public/` | ✅ tracked | csak placeholder ikonok |
| Secrets a kódban | ✅ nincs | scan tiszta |
| Hard-coded URL-ek | ✅ nincs | env / config alapú |

## 6. CI/CD (későbbi lépés — most nem aktiválva)

Javasolt minimum GitHub Actions workflow `.github/workflows/build.yml`:

```yaml
name: Build
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run build
```

Most ezt **NEM** hozzuk létre — csak akkor, ha a GitHub repo aktiválva van és a build pipeline-t éles használatra szánjuk.

## 7. Mire nem terjed ki ez a lépés

- Nem fut valódi DB migráció.
- Nem kérünk `DATABASE_URL`-t.
- Nem kérünk OpenAI / Anthropic / Lovable AI kulcsot.
- Nem aktiválunk webhookot vagy külső integrációt.

## 8. Következő mérföldkő

Repo aktív → **cPanel deploy előkészítés** (lásd `docs/DEPLOY_CPANEL.md`).
Csak ezután jön a valódi DB bekötés (B-3 nyitás).
