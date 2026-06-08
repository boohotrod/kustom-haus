# Builder Core v0.2 — Záró dokumentáció

Lezárás dátuma: 2026-06-08
Státusz: **Stabil preview**, valódi DB migráció nem futott, mock-store alapú.

---

## 1. Mi készült el (B-0 → B-2.4)

| Fázis | Cím | Eredmény |
|------|-----|----------|
| **B-0** | Bootstrap / shell | TanStack Start v1 + Vite 7, route shell, i18n (en/hu/no), BuilderShell/BuilderSidebar, mock-store skeleton, login + role-mock. |
| **B-1** | Builder Core foundation (4 aktív modul) | `identity`, `audit`, `project`, `fields` modulok `in_dev` állapotban; users/roles/permissions/audit/memory/decisions/modules képernyők; hash-láncolt audit váz; SuperAdmin invisibility szabály. |
| **B-2.1** | Federation + tenant-aware audit | `tenant_key` minden audit eseményen; peer/federation registry séma; `audit_events` szigorítva. |
| **B-2.2** | Dynamic Field Registry | Field definitions, versions, translations, entity bindings, taxonomy bindings, permissions, values; `change_reason` kötelező a státuszváltáson; reference data_type cross-entity; permission cache flag (séma); multivalue `position`; materialized projection csak előkészítve. |
| **B-2.3** | BBS seed modules | 32 modul katalógus (`src/lib/bbs-modules.ts`), 4 active + 28 planned; kategória, roadmap-fázis, függőségek; UI szűrő + oszlopok. |
| **B-2.4** | Module ↔ namespace binding + ownership | `module_namespace_bindings` (owner/allowed/required/reserved), `namespace_ownership_history`, dot-prefix matching, `auto_grant_to_dependents` flag (default false), reserved namespace csak admin, ownerless namespace eliminálva a seed-ben. |
| **Stabilizálás** | B-2.4 utáni cleanup | `modules.$moduleKey.fields.tsx` `<tr>/<td>` → `<TableRow>/<TableCell>`; minden új route smoke-tesztelve, SSR tiszta. |

---

## 2. Fájl- és modulösszefoglaló

### 2.1 Routes (`src/routes/`)
- **Core/Shell:** `__root.tsx`, `index.tsx`, `login.tsx`, `profile.tsx`, `u.$username.tsx`
- **B-1 alapfelületek:** `users.tsx`, `roles.tsx`, `permissions.tsx`, `audit.tsx`, `memory.tsx`, `decisions.tsx`, `modules.tsx`
- **B-2.1 federation/registry:** `registry.federation.tsx`, `registry.knowledge.tsx`, `registry.taxonomy.tsx`, `registry.ai.tsx`
- **B-2.2 field registry:** `registry.fields.index.tsx`, `registry.fields.new.tsx`, `registry.fields.lifecycle.tsx`, `registry.fields.$fieldId.tsx`, `registry.fields.$fieldId.values.tsx`, `registry.fields.$fieldId.versions.$versionNo.tsx`
- **B-2.4 module-namespace:** `modules.$moduleKey.tsx`, `modules.$moduleKey.fields.tsx`
- **Stubs (placeholder modulok):** `stubs.garage.tsx`, `stubs.media.tsx`, `stubs.support.tsx`, `stubs.travel.tsx`

### 2.2 Domain könyvtárak (`src/lib/`)
- `mock-store.ts` — in-memory állapot és seed (ez váltja le majd a DB-t)
- `bbs-modules.ts` — 32 modul katalógus (B-2.3)
- `field-registry.ts` — field lifecycle, label-resolver, change_reason enforcement
- `namespace-ownership.ts` — dot-prefix matching, `canModuleUseNamespace`, `requireReason`, seed bindings
- `rbac.ts` — szerep/jog ellenőrzés (SuperAdmin invisibility)
- `audit.ts` — append-only event helper (hash-lánc váz)

### 2.3 Drizzle séma (`src/db/schema/`) — még nem migrált
- `identity/` — `users`, `profiles`, `roles`, `permissions`, `membership`, `invites`
- `audit/events.ts` — tenant_key + hash-chain
- `project/` — `projects`, `modules`, `decisions`, `memory`, `translations`, `versions`
- `registry/` — `ai.ts`, `federation.ts`, `taxonomy.ts`, `knowledge.ts`, `moduleNamespaces.ts`
- `registry/fields/` — `definitions`, `enums`, `translations`, `entityBindings`, `taxonomyBindings`, `permissions`, `values`, `index`

### 2.4 i18n
`src/i18n/locales/en.json`, `hu.json`, `no.json` — minden új felület kulcsból renderel; nincs hard-coded UI szöveg.

### 2.5 Dokumentáció (`docs/architecture/`)
- `overview.md`
- `b-2.1-federation-and-tenant-audit.md`
- `b-2.2-dynamic-field-registry.md`
- `b-2.3-bbs-seed-modules.md`
- `b-2.4-module-namespace-binding.md`
- `builder-core-v0.2-closing.md` *(ez a fájl)*

---

## 3. Adatmodell összefoglaló

```
identity        users, profiles, roles, permissions, membership, invites
audit           audit_events (tenant_key, hash-chain, append-only)
project         projects, modules, decisions, memory, translations, versions

registry
  federation    peers, federation_links
  taxonomy      taxonomies, taxonomy_terms
  knowledge     knowledge_nodes, knowledge_edges
  ai            ai_providers, ai_logs (stub)
  moduleNamespaces
                module_namespace_bindings (owner/allowed/required/reserved,
                                           auto_grant_to_dependents flag)
                namespace_ownership_history (change_reason kötelező)
  fields
    definitions       field_definitions (status, data_type, multivalue, …)
    enums             field_enum_values
    translations      field_translations (label/help, locale)
    entityBindings    field_entity_bindings (display order, required)
    taxonomyBindings  field_taxonomy_bindings
    permissions       field_permissions (read/write per role, cache flag)
    values            field_values (multivalue position, reference)
```

**Invariánsok**
- Minden namespace pontosan egy `owner` modullal.
- Reverse field lifecycle hop és minden namespace ownership change `change_reason` köteles.
- `tenant_key` kötelező minden audit eseményen.
- Dot-prefix namespace matching (`vehicle` lefedi `vehicle.engine`-t).

---

## 4. Működő képernyők

| Útvonal | Funkció |
|---------|---------|
| `/` | Builder dashboard |
| `/login` | Mock login + szerepválasztás |
| `/profile`, `/u/$username` | Profil nézet |
| `/users`, `/roles`, `/permissions` | Identity admin |
| `/audit` | Tenant-szűrt hash-láncolt audit |
| `/memory`, `/decisions` | Constitutional memory + ADR-ek |
| `/modules` | Modul katalógus (kategória/fázis/depends-on szűrők) |
| `/modules/$moduleKey` | Modul részlet + namespace panel + ownership history |
| `/modules/$moduleKey/fields` | Modulhoz tartozó field-ek + access badge |
| `/registry/federation` | Peer & federation registry |
| `/registry/taxonomy` | Country / vehicle_type taxonómiák |
| `/registry/knowledge` | Knowledge map (B-2.1) |
| `/registry/ai` | AI provider registry (stub) |
| `/registry/fields` | Field registry lista (owner module oszlop) |
| `/registry/fields/new` | Új field varázsló |
| `/registry/fields/lifecycle` | Lifecycle audit + change_reason kényszer |
| `/registry/fields/$fieldId` | Field részlet + namespace usage panel |
| `/registry/fields/$fieldId/values` | Értékek (multivalue position) |
| `/registry/fields/$fieldId/versions/$versionNo` | Verzió snapshot |
| `/stubs/*` | Placeholder modulok (garage/media/support/travel) |

Smoke: minden route 200 / vagy 404 a notFoundComponent-ből.

---

## 5. Ismert hiányok

- **Valódi DB nincs bekötve** — minden olvasás/írás a `mock-store` ellen megy, oldalfrissítéskor reszetel.
- **Materialized projection nincs** — séma előkészítve, flat/cache táblák B-3+ feladat.
- **Permission cache nincs valódi cluster mögé kötve** — csak flag és invalidáció hook.
- **Namespace ownership transfer UI nincs** — séma + history kész, csak a kényelmi UI hiányzik (B-2.5 opcionális).
- **Invariant dashboard nincs** — `checkNamespaceInvariants()` futtatható, de nincs központi felület.
- **AI Translation Cache, Workflow Engine, GDPR Engine, Backup Engine, Export Engine** — egyik sem indult el.
- **Hash-chain audit** csak váz, kriptográfiai verifier még nincs.
- **Tests:** nincs e2e vagy unit teszt a registry / ownership logikára.

---

## 6. Opcionális későbbi fejlesztések

1. **B-2.5** — Namespace ownership transfer UI + invariant dashboard.
2. **B-2.6** — Hash-chain verifier + audit export.
3. **Materialized projection** — flat/cache táblák generálása (B-3 része).
4. **Permission cache cluster** — Redis vagy in-memory LRU mögé kötés.
5. **Field reference picker** — cross-entity reference UI (séma kész).
6. **i18n editor UI** — `field_translations` szerkesztő.
7. **BBS portál modulok bekötése** (garage, media, …) — jelenleg stub.
8. **Unit teszt: `namespace-ownership.ts` és `field-registry.ts` lifecycle.**

---

## 7. Következő nagy döntés

Négy reális irány — egymást nem zárják ki, de sorrendet kell választani:

| Opció | Mit jelent | Mikor érdemes |
|-------|------------|---------------|
| **A. DB bekötés / migráció generálás** | Drizzle sémából valódi migrációk, mock-store mögé Postgres adapter, seed re-play. | Ha a perzisztencia és a tényleges multi-user teszt a következő prioritás. |
| **B. GitHub export** | Repo szinkron, branch-stratégia, CI alap. | Ha külső review / másik környezet kell. |
| **C. cPanel deploy előkészítés** | Build pipeline + Worker → cPanel adapter / statikus + edge függvény szétválasztás. | Ha élesítés és üzemeltetés a prioritás. |
| **D. AI Translation Cache (B-2.4 után)** | `field_translations` mögé AI-fordító cache, invalidáció namespace/permission eseményekre. | Ha a többnyelvű tartalom a következő blokkoló. |

**Javaslat (csak ajánlás, döntés a Tied):**
`A → B → C` sorrend a legbiztonságosabb: DB-vel valódi a stack, GitHub export után reviewable, cPanel deploy zárja a v0.3 mérföldkövet. A `D` (AI Translation Cache) bárhol beilleszthető, mert namespace-binding és field lifecycle már stabil.

---

*Builder Core v0.2 ezzel lezárva. Új fejlesztés a következő nagy döntés után indul.*
