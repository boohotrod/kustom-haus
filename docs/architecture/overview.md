# BBS AI Builder — Architecture (v0.2 B-0/B-1)

## Pillars

1. **Global Identity Registry.** The `users` table is the single source of
   truth for the entire BBS ecosystem. No separate BBS-portal users, no
   `user_link` bridge. Future tenants attach through
   `tenant_user_membership`.
2. **Single Global SuperAdmin.** Exactly one identity carries
   `isGlobalSuperadmin = true` and `isInvisible = true`. Every list,
   search and public profile filters them out unless the viewer is a
   SuperAdmin.
3. **Function-level permissions.** Keys are `module.function.action`.
   Resolution order: SuperAdmin → user deny override → user allow override
   → role permission → default deny.
4. **Module lifecycle.** `project_modules.state` ∈ {planned, in_design,
   in_dev, in_test, live, deprecated, archived}. Every transition is
   recorded in `module_state_history` and the audit log.
5. **Immutable audit log.** `audit_events` is append-only with a sha256
   hash chain. Production DB must REVOKE UPDATE/DELETE.
6. **Content i18n.** UI strings live in JSON; entity field translations
   live in `translations` (entity, field, locale, source, status). Wired
   end-to-end in B-2+.
7. **Entity versioning.** `entity_versions` snapshots memory, decisions,
   modules and (later) any entity for full revision history.

## Placeholder registries (skeleton in B-1, full in B-2+)

- **Universal Taxonomy Engine** — shared dictionaries.
- **Federation Registry** — BBS Federation Bridge Protocol peers.
- **AI Registry** — providers, models, routing.
- **Knowledge Map Registry** — graph of requirements ↔ decisions ↔
  modules ↔ memory.
