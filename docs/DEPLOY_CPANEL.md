# Deploy to cPanel (Node / Passenger)

Builder Core v0.2 deploy útmutató cPanel Node.js Selector + Passenger
környezetre. **DB migráció és valódi secret beállítás csak akkor történik,
amikor a B-3 nyitásakor explicit jóváhagyod.**

---

## 0. Előfeltételek

- cPanel hozzáférés Node.js App támogatással (Setup Node.js App / Passenger).
- Node.js **>= 20.11** elérhető a cPanel Node Selector-ban.
- (B-3+) MySQL 8.x adatbázis és user létrehozva.
- GitHub repo connect-elve (lásd `docs/GITHUB_EXPORT.md`).

## 1. Aldomain és könyvtárszerkezet (javasolt)

| Környezet | Aldomain | DocRoot | App Root | Branch |
|-----------|----------|---------|----------|--------|
| Live | `builder.bbs-europe.eu` | `/home/<user>/apps/builder-live/public` | `/home/<user>/apps/builder-live` | `main` |
| Test | `test.builder.bbs-europe.eu` | `/home/<user>/apps/builder-test/public` | `/home/<user>/apps/builder-test` | `develop` |

Live és test **külön Node.js App**, **külön DB**, **külön env változók**.

## 2. Repo letöltése a szerverre

SSH-val:

```bash
cd ~/apps
git clone git@github.com:<org>/<repo>.git builder-live
cd builder-live
git checkout main
```

(Test app-hoz ugyanez `builder-test` + `develop` branch.)

## 3. Node.js App létrehozása cPanel-en

1. cPanel → **Setup Node.js App** → **Create Application**.
2. Node.js version: **20.x** (vagy újabb LTS).
3. Application mode: **Production**.
4. Application root: `apps/builder-live` (relatív a home-hoz).
5. Application URL: `builder.bbs-europe.eu`.
6. Application startup file: `.output/server/index.mjs`
7. Passenger log file: hagyd a default-ot.

## 4. Environment Variables (cPanel UI)

A `Setup Node.js App` → app → **Environment variables** szekcióban add hozzá
a `.env.example` szerinti változókat valós értékekkel:

```
NODE_ENV=production
DATABASE_URL=mysql://USER:PASS@localhost:3306/bbs_builder_live   # csak B-3+
SESSION_SECRET=<openssl rand -hex 32>
INVITE_SIGNING_KEY=<openssl rand -hex 32>
AUDIT_CHAIN_SECRET=<openssl rand -hex 32>
FEDERATION_SIGNING_KEY=<openssl rand -hex 32>
AI_GATEWAY_KEY=                                                   # csak ha aktív
```

**Ne** tölts fel `.env` fájlt FTP-vel — cPanel csak az UI-ban beállított env
változókat injektálja a Passenger process-be.

## 5. Build és start

cPanel app oldalon → **Run NPM Install** (vagy SSH-ban):

```bash
cd ~/apps/builder-live
source ~/nodevenv/apps/builder-live/20/bin/activate    # a cPanel által megadott aktiváló script
npm install --omit=dev                                  # vagy: bun install --production
npm run build                                           # → .output/
```

Majd cPanel → **Restart Application**.

### Parancsok összefoglalása

| Cél | Parancs |
|-----|---------|
| Install | `bun install` (lokál) / `npm install --omit=dev` (cPanel) |
| Build | `bun run build` (lokál) / `npm run build` (cPanel) |
| Start (prod) | `node .output/server/index.mjs` |
| Dev | `bun run dev` (csak lokál) |

## 6. Apache / Passenger útválasztás

A `Setup Node.js App` automatikusan generálja a `.htaccess`-t a doc root-ba,
ami minden requestet a Node app-ra irányít. A TanStack Start routing
(file-based) ezután mindent kezel — **nincs szükség** külön
`public/_redirects`, `vercel.json` vagy `BrowserRouter` konfigurációra.

## 7. Adatbázis (B-3+, MOST NE FUSSON)

Amikor a B-3 nyit:

1. cPanel → **MySQL Databases** → új DB + új user, `ALL PRIVILEGES`.
2. `DATABASE_URL` beállítása az env változókban.
3. Migrációk generálása lokálisan: `bunx drizzle-kit generate` (commitold a `drizzle/` mappát).
4. SSH-val a szerveren a generált SQL futtatása: `mysql -u <user> -p <db> < drizzle/0000_*.sql`.
5. SuperAdmin seed: `node scripts/seed-superadmin.mjs` (interaktív).
6. **Az első deploy után:** `REVOKE UPDATE, DELETE ON bbs_builder_live.audit_events FROM '<user>'@'localhost';`
   — az audit chain immutability-jét DB szinten is kikényszeríti.

## 8. Deploy workflow (kézi, CI nélkül)

```bash
# lokálisan
git push origin main

# szerveren
ssh user@host
cd ~/apps/builder-live
git pull
source ~/nodevenv/.../activate
npm install --omit=dev
npm run build
# cPanel UI → Restart Application
```

Test app-hoz ugyanez `builder-test` + `develop` branch-ből.

## 9. Ellenőrzőlista deploy után

- [ ] `https://builder.bbs-europe.eu/` → 200, dashboard betölt.
- [ ] `https://builder.bbs-europe.eu/login` → működik a login form.
- [ ] `https://builder.bbs-europe.eu/modules` → katalógus render.
- [ ] `https://builder.bbs-europe.eu/registry/fields` → 200.
- [ ] Passenger error log üres.
- [ ] Browser console nincs hibával.

## 10. Most NE csináld

- Ne futtass valódi DB migrációt.
- Ne állíts be `DATABASE_URL`-t éles DB-vel.
- Ne tölts fel OpenAI / Anthropic kulcsot.
- Ne kapcsold be a federation peer trafficot.

Mindezek a **B-3 nyitásakor** kerülnek elő, külön jóváhagyással.
