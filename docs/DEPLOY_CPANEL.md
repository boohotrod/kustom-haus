# Deploy to cPanel (Node / Passenger)

> v0.1 placeholder. Filled in once the first build target switch is approved.

## Order of operations

1. Provision a Node.js app on cPanel (Passenger).
2. Configure environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `INVITE_SIGNING_KEY`
   - `AUDIT_CHAIN_SECRET`
   - `FEDERATION_SIGNING_KEY`
   - `AI_GATEWAY_KEY` (only when a real provider is activated)
3. Generate migrations: `bunx drizzle-kit generate` (commits the SQL file
   under `drizzle/`).
4. Apply migrations on cPanel using the generated SQL — **never** runs from
   preview.
5. Run `node scripts/seed-superadmin.mjs` interactively to create the
   single Global SuperAdmin.
6. After the first deploy, REVOKE UPDATE/DELETE on `audit_events` from the
   runtime DB user to enforce immutability at the database level.

## Build target switch

The current Lovable preview uses the edge build target. Switching to
Node / Passenger requires updating `vite.config.ts` build target and the
server entry. This is a deliberate one-way operation; do it only when
ready to deploy.
