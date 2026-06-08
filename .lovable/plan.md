# B-2.2 — Dynamic Field Registry (DFR) — Terv

A Dynamic Field Registry a BBS központi metaadat-rendszere. A mező nem oszlop, hanem **önálló, verziózott, auditált, fordítható, jogosultságkezelt, taxonomy-hoz kapcsolható objektum**. Az adatok EAV modellben tárolódnak, de indexelhető és skálázható módon.

---

## 1. Alapelvek (rögzítve)

- A **mező = objektum**, nem oszlop.
- **Életciklus**: `active → hidden → disabled → deprecated → archived`
- Használt mező **fizikailag nem törölhető** (csak archived).
- Minden mező: **verziózott, auditált, fordítható, jogosultságkezelt, taxonomy-hoz köthető**.
- A **Universal Profile Engine** elsődleges fogyasztó; később: Vehicle, Club, Event, Business, Workshop, Shop, Artist, Performer.
- EAV maradjon **indexelhető és skálázható** (típusos value oszlopok + részleges indexek + materialized projection opció).

---

## 2. Adatmodell – Táblák

A DFR 9 új tábla + 2 enum a `public` sémában (mock-store-ban tükrözve). Minden tábla `tenant_key`-jel scope-olt és audit-kompatibilis.

### 2.1 Enums

- `field_status`: `active | hidden | disabled | deprecated | archived`
- `field_data_type`: `string | text | integer | decimal | boolean | date | datetime | enum | reference | json | media | geo`

### 2.2 Központi táblák

**`field_definitions`** — A mező mint objektum (a "fej").
- `id` (uuid, pk)
- `tenant_key` (text, idx)
- `key` (text) — gépi azonosító, pl. `vehicle.engine.displacement_cc`
- `namespace` (text) — pl. `vehicle`, `club`, `profile.core`
- `owner_module` (text) — melyik BBS modul birtokolja
- `data_type` (`field_data_type`)
- `is_multivalue` (bool)
- `is_required_default` (bool)
- `status` (`field_status`, default `active`)
- `current_version_id` (uuid, fk → `field_versions.id`)
- `created_at`, `updated_at`, `archived_at`
- UNIQUE (`tenant_key`, `namespace`, `key`)

**`field_versions`** — Verziózás (a "test"). Minden szerkesztés új verzió.
- `id` (uuid, pk)
- `field_id` (fk → field_definitions)
- `version_no` (int, monoton)
- `schema` (jsonb) — validáció, min/max, regex, enum-tagok, reference target, UI hints
- `default_value` (jsonb, null)
- `change_reason` (text)
- `created_by`, `created_at`
- `is_current` (bool, részleges unique idx field_id + is_current=true)

**`field_translations`** — Minden mező fordítható (label, help, placeholder, enum-tagok).
- `id`, `field_version_id` (fk), `locale` (text), `label`, `help`, `placeholder`, `enum_labels` (jsonb)
- UNIQUE (`field_version_id`, `locale`)
- B-1 dummy-formátum továbbra is működik: hiányzó fordítás esetén `[locale] key`.

**`field_taxonomy_bindings`** — Mező ↔ taxonomy node.
- `id`, `field_id`, `taxonomy_node_id` (fk a meglévő taxonomy-hoz), `binding_kind` (`scope | filter | classifier`), `created_at`
- UNIQUE (`field_id`, `taxonomy_node_id`, `binding_kind`)

**`field_permissions`** — Jogosultságok mezőszinten (read/write/admin).
- `id`, `field_id`, `subject_kind` (`role | group | user | federation_peer`), `subject_id` (text), `permission` (`read | write | admin`), `effect` (`allow | deny`), `tenant_key`
- UNIQUE (`field_id`, `subject_kind`, `subject_id`, `permission`)
- Kiértékelés: `deny > allow`, hiányzó szabály = nem látható.

### 2.3 Entitás-kapcsolódás (profil-agnosztikus)

**`field_entity_bindings`** — Melyik entitástípuson jelenhet meg a mező.
- `id`, `field_id`, `entity_type` (text: `profile.user | profile.vehicle | profile.club | profile.event | profile.business | profile.workshop | profile.shop | profile.artist | profile.performer | ...`), `is_required` (bool override), `display_order` (int), `group_key` (text, UI csoport)
- UNIQUE (`field_id`, `entity_type`)

### 2.4 EAV érték-tárolás (indexelhető)

**`field_values`** — A tényleges adat. Típusos oszlopok + részleges indexek.
- `id` (uuid)
- `tenant_key` (text, idx)
- `entity_type` (text), `entity_id` (uuid) — kompozit logikai FK
- `field_id` (fk), `field_version_id` (fk) — milyen verzió szerint íródott
- `value_string` (text, null)
- `value_number` (numeric, null)
- `value_bool` (bool, null)
- `value_datetime` (timestamptz, null)
- `value_json` (jsonb, null) — komplex/multivalue/reference esetén
- `created_at`, `updated_at`, `created_by`
- INDEX-ek:
  - `(tenant_key, entity_type, entity_id)` — entitás-olvasás
  - `(field_id, value_string)` WHERE value_string IS NOT NULL — equality search
  - `(field_id, value_number)` WHERE value_number IS NOT NULL
  - `(field_id, value_datetime)` WHERE value_datetime IS NOT NULL
  - GIN `(value_json jsonb_path_ops)` WHERE value_json IS NOT NULL
- UNIQUE (`tenant_key`, `entity_type`, `entity_id`, `field_id`) ha `is_multivalue=false`

**`field_value_history`** — Érték-szintű audit + visszaállítás.
- `id`, `value_id`, `previous_snapshot` (jsonb), `changed_by`, `changed_at`, `change_reason`, `audit_event_id` (fk → audit_events)

### 2.5 Audit kapcsolat

- Minden DFR művelet (create/update/status-change/archive/permission-change/translation-change/value-write) **`audit_events`-be ír** a B-2.1-ben bevezetett `tenant_key` és hash-chain (v2) szerint.
- `audit_events.target_type` értékek: `field_definition`, `field_version`, `field_translation`, `field_permission`, `field_value`.

---

## 3. Kapcsolatok (ER diagram – ASCII)

```text
                       field_definitions
                              │ 1
              ┌───────────────┼───────────────┬──────────────┬────────────────┐
              │ N             │ N             │ N            │ N              │ N
       field_versions  field_entity_b.  field_taxonomy_b.  field_permissions  field_values
              │ 1
              │ N
       field_translations

       field_values ─1─N─ field_value_history ─1─1─ audit_events
       field_definitions.current_version_id ──► field_versions.id
       field_taxonomy_bindings ──► taxonomy_nodes (B-1 meglévő)
       field_permissions.subject_id ──► users / roles / federation_peers (B-2.1)
       field_values.(entity_type, entity_id) ──► Universal Profile Engine entitások
```

---

## 4. Mező-életciklus

```text
   ┌─────────┐  hide      ┌────────┐  disable   ┌──────────┐
   │ active  │──────────► │ hidden │──────────► │ disabled │
   └────┬────┘            └───┬────┘            └────┬─────┘
        │ deprecate            │ deprecate            │ deprecate
        ▼                      ▼                      ▼
                       ┌──────────────┐  archive   ┌──────────┐
                       │  deprecated  │──────────► │ archived │
                       └──────────────┘            └──────────┘
```

Szabályok:
- `active` → új íráshoz és olvasáshoz használható.
- `hidden` → UI-on rejtett, API-n olvasható, írható.
- `disabled` → olvasható (történeti), **új írás tiltott**.
- `deprecated` → olvasható, írás csak migrációs jogosultsággal.
- `archived` → csak audit/visszaállító nézetben látható, **soha nem törölhető fizikailag** ha létezik bármilyen `field_values` rekord.
- Visszafelé átmenet csak `admin` szerepkörrel és `change_reason` kötelező.

---

## 5. Jogosultsági modell

Három szint, AND kapcsolatban kiértékelve:

1. **Modul-szint** (`owner_module` + RBAC role: `field.admin`, `field.editor`, `field.viewer`).
2. **Mező-szint** (`field_permissions` – per role/group/user/federation_peer).
3. **Entitás-szint** (a profil saját jogosultsága – Universal Profile Engine adja).

Műveletek:
- `read` — látszik a UI-on, kiolvasható API-n.
- `write` — érték írható (a mező státusza is engedi-e).
- `admin` — definíciót, verziót, fordítást, jogot módosíthat, státuszt léptethet.

Federation: `subject_kind=federation_peer` lehetővé teszi peer-szintű read-only kiosztást a B-2.1 `federation_users` mentén.

---

## 6. Taxonomy kapcsolat

- A taxonomy node-okhoz **3 kötési mód**: `scope` (csak ezen ág entitásain jelenik meg), `filter` (UI/API szűrőkulcs), `classifier` (a mező értéke maga osztályoz egy taxonomy node-ba).
- A bindings tábla N-N, mező több taxonomy ághoz is köthető (pl. `vehicle.engine.displacement_cc` → `vehicle/cars`, `vehicle/motorcycles`).

---

## 7. Translation kapcsolat

- A fordítás a **verzióhoz** kötődik, nem a definícióhoz → a régi verzió fordítása megőrződik.
- Új verzió létrehozásakor a fordítások öröklődnek (copy-on-write); szerkesztéskor új sor.
- Dummy fallback: `[locale] field.key` (B-1 + B-2 döntés #4).
- Locale-ok forrása: meglévő i18n locales (`en`, `hu`, `no`).

---

## 8. Versioning kapcsolat

- Minden szerkesztés `field_versions` új sora (`version_no++`).
- `current_version_id` a `field_definitions`-en mutat az aktívra.
- Régi verziók megmaradnak — `field_values.field_version_id` mutatja, melyik szerint íródott az érték.
- Migráció: új verzió bevezetése nem írja át a régi értékeket; külön "revalidate" job futtatható később (B-3 hatókör).

---

## 9. Audit kapcsolat

- Minden DFR művelet `audit_events` (v2, `tenant_key` + hash-chain).
- `field_value_history.audit_event_id` ↔ `audit_events.id` 1:1.
- Archiválás és státuszváltás kötelezően `change_reason`-nel.
- Federation-eredetű módosítás `actor_id`-ja az importáló rendszerhez (B-2.1 `federation_users.source_system_id`) kötődik.

---

## 10. UI képernyők

Új route-ok a meglévő `/registry/*` minta szerint:

1. **`/registry/fields`** — Field lista
   - Szűrők: `namespace`, `owner_module`, `status`, `entity_type`, `tenant_key`, taxonomy node.
   - Oszlopok: key, label (aktuális locale), data_type, status, version_no, használati szám (value-count).
2. **`/registry/fields/:fieldId`** — Field részletek
   - Tabok: **Overview**, **Versions**, **Translations**, **Permissions**, **Taxonomy**, **Entities**, **Audit**.
3. **`/registry/fields/new`** — Új mező varázsló
   - Lépések: alap (key, namespace, data_type) → schema (validáció) → entitások → taxonomy → fordítások → jogosultságok → összegzés.
4. **`/registry/fields/:fieldId/versions/:versionNo`** — Verzió diff nézet (schema + translations).
5. **`/registry/fields/:fieldId/values`** — EAV inspector (read-only, debug/admin).
6. **`/registry/fields/lifecycle`** — Életciklus dashboard (státusz-eloszlás, deprecated/archived műveletek, `change_reason` követelmény).

A **Universal Profile Engine** képernyői a mezőket olvassák a registry-ből; a DFR UI csak metaadat-kezelés.

---

## 11. Migrációs stratégia

- Új migrációk a meglévő számozási rendben:
  - `0004_field_enums.sql` (enumok)
  - `0005_field_definitions_and_versions.sql`
  - `0006_field_translations.sql`
  - `0007_field_taxonomy_bindings.sql`
  - `0008_field_permissions.sql`
  - `0009_field_entity_bindings.sql`
  - `0010_field_values.sql` (+ részleges indexek + GIN)
  - `0011_field_value_history.sql`
- Minden tábla után **explicit GRANT** (`authenticated`, `service_role`; `anon` nem kap), RLS engedélyezés és policy-k `has_role(...)` mintával.
- Mock-store előbb (B-2.2 implementáció), valódi migráció futtatása **B-3** hatókörben (a 4 B-2 döntés szerint).
- B-2.1-kompatibilis: minden insert `tenant_key`-t kap, minden audit hash-chain v2-be írja a változást.

---

## 12. Kockázatok és nyitott pontok (jóváhagyásra)

1. **Reference data_type célja** — engedjük-e cross-entity referenciát már most? (Javaslat: igen, `schema.reference.entity_type` mezővel.)
2. **Materialized projection** entitásonként (cache tábla, pl. `profile_vehicle_flat`) — most csak előkészítés, tényleges generálás B-3.
3. **Multivalue rendezés** — kell-e explicit `position` oszlop `field_values`-ben? (Javaslat: igen, opcionális `position int`.)
4. **Permission cache** — futásidőben memo a UI-ban; invalidáció audit-eseményre.

---

## 13. B-2.2 leszállítandó (jóváhagyás után)

- 9 séma-fájl `src/db/schema/registry/fields/` alatt.
- Mock-store kiterjesztés (definíciók, verziók, fordítások, jogok, taxonomy bindings, entity bindings, values, history).
- 6 új UI route a fenti listából.
- i18n kulcsok (`en`, `hu`, `no`).
- Dokumentáció: `docs/architecture/b-2.2-dynamic-field-registry.md`.
- **Nem** indul: AI Translation Cache (B-2.4), BBS seed bővítés (B-2.3).
- **Nem** fut: valódi DB migráció.

Kérlek jelezd, ha a 12-es pont nyitott kérdéseire is kéred a döntést, vagy a tervet így jóváhagyod és indulhat a B-2.2 implementáció.
