
# BBS AI Builder Platform v0.2 — B-2 terv

A B-2 a **Dynamic Field Registry** köré épül (Alkotmány §9–10), kiegészítve egy könnyű Federation-kompatibilitási patch-csel, a BBS seed bővítésével és az AI fordítási cache első rétegével. Workflow / GDPR / Backup / Export Engine **nem része** a B-2-nek — B-3-ban marad.

A B-2 minden eleme:
- additív (nem ír felül B-0/B-1 táblát),
- i18n-kulcsból jön minden UI szöveg,
- tényleges UI képernyőhöz kötött (admin Builder felületen),
- dokumentált a `docs/architecture/` alatt,
- mock-store-on és Drizzle MySQL schema-n is fut (a Lovable preview az in-memory mock-ot használja, a cPanel Node target a valós DB-t).

---

## B-2.1 — Federation user link + audit tenant scoping

### Új tábla: `federation_users`

```text
federation_users
  id                BIGINT PK
  user_id           BIGINT FK -> users.id            (helyi globális identitás)
  peer_id           BIGINT FK -> federation_peers.id
  bbs_federation_user_id  VARCHAR(64)  UNIQUE per peer
  source_system_id  VARCHAR(64)
  source_tenant_id  VARCHAR(64)
  source_record_id  VARCHAR(64)
  data_origin       ENUM('local','imported','synced','external')
  sync_status       ENUM('local','imported','synced','pending','conflict','archived_remote','disconnected')
  sync_created_at   TIMESTAMP
  sync_updated_at   TIMESTAMP
  metadata          JSON
  UNIQUE (peer_id, bbs_federation_user_id)
  INDEX (user_id), INDEX (sync_status)
```

Federation Bridge §7–8, §22–23 mezőkövetelményeit fedi le. A helyi `users.id` változatlan; a federation ID csak link.

### Módosítás: `audit_events`

Új oszlop: `tenant_key VARCHAR(64) NULL` (index). Visszafelé kompatibilis; régi sorok `NULL`. A hash-chain láncot nem töri (a `tenant_key` belekerül a kanonikus payload-ba a **migráció után** írt eseményeknél; régi események saját régi hash-ükkel maradnak — ez egy explicit chain-checkpoint).

### Migrációs lépés

- `0002_federation_users.sql` — új tábla + indexek + GRANT.
- `0003_audit_tenant_key.sql` — `ALTER TABLE audit_events ADD COLUMN tenant_key …` + chain-checkpoint sor beszúrása (`event_type = 'audit.chain.checkpoint'`).

### UI

- `/registry/federation` képernyő bővítése: peer-detail nézetben **Linked users** lista (user_id ↔ federation_user_id ↔ sync_status).
- `/audit` képernyő bővítése: `tenant_key` szűrő + oszlop.

---

## B-2.2 — Dynamic Field Registry (B-2 központi eleme)

Alkotmány §9–10: minden üzletileg kritikus mező **kezelt rendszerobjektum**, nem hardcoded oszlop. Fizikai törlés tilos.

### Adatmodell — 6 tábla

```text
field_definitions
  id              BIGINT PK
  key             VARCHAR(96)   -- pl. "profile.business.vat_number"
  scope_type      ENUM('global','tenant','project','module','entity')
  scope_ref       VARCHAR(128)  -- pl. "module:webshop" vagy "entity:profile.business"
  data_type       ENUM('string','text','int','decimal','bool','date','datetime',
                       'json','enum','ref','media','geo','i18n_string')
  ui_widget       VARCHAR(64)   -- text|textarea|select|multiselect|date|toggle|...
  state           ENUM('draft','active','hidden','disabled','deprecated','archived')
  is_required     BOOL
  is_unique       BOOL
  is_indexed      BOOL
  is_pii          BOOL
  default_value   JSON NULL
  validation      JSON NULL     -- { min, max, regex, enum, custom_rule_key }
  ref_target      VARCHAR(128) NULL  -- ha data_type='ref'
  owner_user_id   BIGINT
  created_at, updated_at
  UNIQUE (scope_type, scope_ref, key)

field_versions                  -- minden mező-változás verziózva (Alk. §32)
  id, field_id FK, version INT,
  snapshot JSON, change_reason TEXT,
  changed_by_user_id, changed_at,
  UNIQUE (field_id, version)

field_labels                    -- i18n címke + segéd szöveg
  id, field_id FK, locale VARCHAR(8),
  label VARCHAR(255), help_text TEXT, placeholder VARCHAR(255),
  UNIQUE (field_id, locale)

field_options                   -- enum / select értékek (külön értékek mind verziózottak)
  id, field_id FK, value VARCHAR(128),
  state ENUM('active','hidden','deprecated','archived'),
  sort_order INT,
  UNIQUE (field_id, value)

field_option_labels
  id, option_id FK, locale, label,
  UNIQUE (option_id, locale)

field_values                    -- dinamikus értéktár (EAV, írás-optimalizált index-szel)
  id BIGINT PK,
  field_id FK,
  entity_type VARCHAR(64),      -- pl. "user","profile","project","module","custom:X"
  entity_id   VARCHAR(64),
  value_string   VARCHAR(1024) NULL,
  value_text     TEXT NULL,
  value_number   DECIMAL(20,6) NULL,
  value_bool     BOOL NULL,
  value_date     DATETIME NULL,
  value_json     JSON NULL,
  locale         VARCHAR(8) NULL,   -- csak i18n_string-nél
  created_at, updated_at,
  INDEX (field_id, entity_type, entity_id),
  INDEX (entity_type, entity_id)
```

### Mező-életciklus (Alk. §10)

```text
draft → active → hidden → disabled → deprecated → archived
                     ↑                      |
                     └──────── reactivate ──┘   (csak SuperAdmin)
```

- `draft`: létrejött, még nem használható.
- `active`: használható, megjelenik UI-on.
- `hidden`: UI-on rejtett, adat marad.
- `disabled`: nem írható, csak olvasható.
- `deprecated`: jelölt, új helyen nem ajánlott; meglévő adat él.
- `archived`: csak read-only audit célból; UI-on nem jelenik meg.
- **Fizikai törlés tiltott** ha bármikor volt `field_values` rekord.

Minden átmenet → `field_versions` snapshot + `audit_events` esemény (`field.lifecycle.*`).

### Kapcsolatok

- `field_definitions.scope_ref` → `project_modules`, `entity_versions` (puha hivatkozás, nem FK, mert a scope_type dönt).
- `field_values.entity_type/entity_id` polimorf — a Builder gondoskodik integritásról az alkalmazás-rétegben.
- `entity_versions` (B-1) snapshot-jaiba a dinamikus mezők is bekerülnek.

### Jogosultságok (function-level, B-1 RBAC-on)

Új permission kulcsok (`module.function.action`):

```
fields.definition.read
fields.definition.create
fields.definition.update
fields.definition.lifecycle      -- állapotváltás
fields.definition.delete         -- csak draft-on engedélyezett
fields.options.manage
fields.labels.manage
fields.values.read
fields.values.write
fields.values.read_pii           -- külön gate ha is_pii=true
```

Resolver sorrend változatlan: SuperAdmin → deny override → allow override → role → default deny. SuperAdmin invisibility érvényes a `field_definitions.owner_user_id` listázáskor is.

### UI képernyők (mind i18n)

1. **`/fields`** — Field Registry lista: szűrők (scope, data_type, state, is_pii), gyors állapotváltás.
2. **`/fields/$fieldKey`** — Field detail: alap meta, validáció, opciók, i18n címkék, verziótörténet, audit alsablon.
3. **`/fields/new`** — Új mező varázsló (scope kiválasztás → data_type → validation → labels → draft mentés).
4. **`/fields/$fieldKey/values`** — Field-használat: melyik entitásokon, hány érték, link az entitásra.
5. **Entitás-oldali integráció** (B-1 képernyők bővítése): pl. `/u/$username` és `/users` profile-szerkesztő automatikusan rendereli a `scope = entity:profile.<upe_type>` mezőket.

### Migrációs stratégia

- `0004_field_registry.sql` — 6 új tábla, GRANT-okkal.
- `0005_field_registry_seed.sql` — alaprendszermezők seed-elése `is_system=true` flag-gel (pl. `profile.common.display_name`, `profile.business.vat_number`, `profile.vehicle.vin`), hogy a meglévő képernyők ne ürüljenek ki.
- A B-1 `profiles` táblán **nem** változtatunk — a dinamikus mezők párhuzamosan élnek a fix oszlopokkal. Lassú migráció B-3-ban (`fix → dynamic` flip).

---

## B-2.3 — BBS seed modulok teljes készlete

Az 1 db `bbs` seed projekt bővítése; csak adat, nem új schema.

Modulkészlet (state = `active` vagy `planned`):

```
support, travel, media, garage,
blog, webshop, events, tickets, gallery,
memberships, finance, cash_register, notifications,
translations, themes, admin, superadmin, backup,
ai_engine, federation, seo, automation
```

- Minden modul kap: `module_state`, `visibility`, default permission set (csak read-stub), placeholder route a Builder UI-ban (`/modules` lista mutatja).
- Csak `support, travel, media, garage` modulok rendelkeznek tényleges UI stub route-tal (B-1-ből). A többi modul a `/modules` képernyőn jelenik meg listaként + detail drawer-rel, de nem kap új route-fát.

### Migráció

- `0006_bbs_seed_modules.sql` — `INSERT INTO project_modules ...` az új modulokra (`insert` eszközzel, nem schema-migrációként a Lovable felé; cPanel-en SQL seed scriptként).

### UI

- `/modules` képernyő (B-1) bővül: szűrő modul-státuszra, lifecycle akció gombok, audit link.

---

## B-2.4 — AI Translation Cache

Alkotmány §13. Most még **dummy provider**, valós OpenAI/Claude hívás nem indul.

### Új táblák

```text
ai_translations
  id BIGINT PK
  source_locale     VARCHAR(8)
  target_locale     VARCHAR(8)
  source_hash       CHAR(64)   -- sha256(source_text)
  source_text       TEXT
  translated_text   TEXT
  provider_id       BIGINT FK -> ai_providers.id
  model_id          BIGINT FK -> ai_models.id  NULL
  quality_score     DECIMAL(3,2) NULL
  state             ENUM('cached','stale','manual_override','rejected')
  created_at, updated_at,
  UNIQUE (source_locale, target_locale, source_hash)

ai_translation_jobs
  id, source_locale, target_locale,
  source_hash, status ENUM('pending','running','done','failed'),
  requested_by_user_id, requested_at, finished_at,
  error TEXT NULL
```

### Logika (dummy provider)

- `translate(source, from, to)` → cache hit? return; else dummy job, ami a forrást `[to] ` prefixszel visszaadja, és cache-eli.
- AI Registry `ai_providers` táblába seed: `dummy-translator` provider (`kind = 'translate'`).

### UI

- `/registry/ai` bővítés: **Translations** fül — cache statisztika, recent jobs, manuális fordítás form (forrás + target_locale → eredmény).
- `/i18n` (új): kulcs-szintű i18n cache inspektor — látható, mely UI kulcsok mely nyelven cache-eltek, melyek hiányoznak.

### Permission

```
ai.translation.read
ai.translation.request
ai.translation.override
ai.translation.purge
```

### Migráció

- `0007_ai_translation_cache.sql` — 2 tábla + GRANT + dummy provider seed.

---

## Migrációs stratégia összefoglalva

| Lépés | Fájl | Típus | Reverzibilis |
|---|---|---|---|
| 0002 | `federation_users` | CREATE | igen (DROP) |
| 0003 | `audit_events.tenant_key` | ALTER ADD | igen (DROP COLUMN) — checkpoint sor megmarad |
| 0004 | Field Registry 6 tábla | CREATE | igen |
| 0005 | Field Registry seed | INSERT | igen |
| 0006 | BBS modulok seed | INSERT | igen |
| 0007 | AI translation cache | CREATE+INSERT | igen |

- Lovable preview: a mock-store kap megfelelő bővítést, hogy a Builder UI minden képernyője működjön valós DB nélkül.
- cPanel Node target: a `drizzle-kit generate` futtatja a SQL-t, de **csak a tulajdonos jóváhagyott pillanatban**. A B-2 fejlesztés alatt **nem fut migráció**.

---

## Mit NEM csinálunk B-2-ben (megerősítés)

- Workflow Engine → B-3
- GDPR Engine (consent, export, anonymize) → B-3
- Backup Engine → B-3
- Export Engine → B-3
- Valós OpenAI / Claude API hívás → külön jelzéssel B-3+
- BBS portál tényleges modul-implementációk (webshop logika, ticketing) → BBS projekt saját ütemezésében
- Hot Rod / Kustom UI redesign → későbbi vizuális fázis

---

## B-2 zárójelentés tartalma (előre rögzítve)

1. Létrehozott fájlok
2. Módosított fájlok
3. Telepített csomagok
4. Generált migrációk (nem futtatott)
5. Működő képernyők (preview-ban)
6. Mock-store lefedettség
7. Ismert hiányok
8. Hibák / figyelmeztetések
9. Következő javasolt lépés (B-3 sorrend)

---

## Jóváhagyásra váró döntések

1. **`field_values` tárolási modell**: EAV (fenti) **vs.** entitásonkénti `JSON` blob a `entity_versions`-ben. Javaslat: **EAV**, mert indexelhető + Field Registry permission-jaihoz illeszkedik.
2. **`audit_events.tenant_key`** chain-checkpoint elfogadható-e (régi hash-lánc megmarad, új lánc indul) — javaslat: **igen**.
3. **BBS seed**: minden új modul `state = 'planned'`, csak a B-1 négyese marad `active` — javaslat: **igen**.
4. **Dummy translation prefix** formátum (`[hu] szöveg`) — javaslat: **igen**, hogy vizuálisan azonnal látszódjon a cache működése.

Jóváhagyás után indul a B-2 implementáció a fenti sorrendben (B-2.1 → B-2.2 → B-2.3 → B-2.4).
