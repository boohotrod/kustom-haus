# BBS AI Builder Platform — v0.2 (B-0 / B-1)

Constitutional builder platform that will design, document and later operate
the BBS Hot Rod & Kustom Europe portal.

## Status

- Scope: **B-0 + B-1** of the v0.2 Hybrid (Option C) plan.
- Build target: TanStack Start → Node / cPanel Passenger.
- Backend: schemas defined for MySQL (Drizzle). **No migrations are run in
  preview.** Preview uses an in-memory mock store so every screen is wired
  end-to-end.

## What works in preview

- Identity registry (Global Identity Registry) with SuperAdmin invisibility.
- Function-level permissions matrix and role catalogue.
- Project memory (with 6 scopes), Architecture Decision Records, Modules
  with full lifecycle state machine.
- Append-only audit log with sha256 hash chain + UI verifier.
- Placeholder admin views for the four new registries: Universal Taxonomy
  Engine, Federation Registry, AI Registry, Knowledge Map Registry.
- Universal Profile Engine — 10 profile types, public `/u/$username`.
- Invite-only login (mock credentials `demo` / `demo`).
- i18n: HU/EN/NO ship translations; 26-language skeleton ready.
- PWA manifest + placeholder icons.

## What is NOT built yet

- Dynamic Field Registry, Workflow Engine, GDPR Engine, Backup Engine,
  Export Engine — all deferred to **B-2+**.
- Real AI providers (only the dummy entry).
- Real federation peer traffic (registry only).
- BBS portal modules (Support, Travel, Media, Garage are stubs).

## Folder layout

```
src/
  db/schema/       Drizzle schemas grouped by domain
  i18n/            UI translations (HU/EN/NO + 26-language skeleton)
  lib/             crypto, audit, RBAC, mock store, server env, lazy DB client
  components/
    builder/       BuilderShell, BuilderSidebar
    ui/            shadcn components
  routes/          file-based routes (TanStack Start)
scripts/
  seed-superadmin.mjs   interactive CLI (no live writes in v0.1)
docs/              architecture / deploy / Gap report templates
```

## Secrets (configured later on cPanel, never in preview)

`DATABASE_URL`, `SESSION_SECRET`, `INVITE_SIGNING_KEY`, `AUDIT_CHAIN_SECRET`,
`FEDERATION_SIGNING_KEY`, `AI_GATEWAY_KEY`.

## Next steps

1. Detailed Gap analysis of the 6 newly uploaded BBS documents.
2. Decide whether B-2 starts with Dynamic Field Registry or Workflow Engine.
3. First real migration on cPanel + run the SuperAdmin seed CLI.
