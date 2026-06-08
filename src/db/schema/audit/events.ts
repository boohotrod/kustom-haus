import { mysqlTable, varchar, json, timestamp, bigint, index } from "drizzle-orm/mysql-core";

/**
 * Immutable audit log. App enforces append-only; production must also
 * REVOKE UPDATE/DELETE from the runtime DB user. Hash chain:
 *   hash = sha256(prev_hash || canonical_json(payload))
 *
 * B-2.1: tenant_key added as additive column. Pre-migration rows keep their
 * original hashes; the migration inserts an explicit `audit.chain.checkpoint`
 * event so the chain remains verifiable while the canonical payload schema
 * evolves to include tenant_key for new rows.
 */
export const auditEvents = mysqlTable(
  "audit_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    seq: bigint("seq", { mode: "number" }).notNull().unique(),
    actorId: varchar("actor_id", { length: 36 }),
    tenantKey: varchar("tenant_key", { length: 64 }),
    action: varchar("action", { length: 128 }).notNull(),
    targetType: varchar("target_type", { length: 64 }),
    targetId: varchar("target_id", { length: 64 }),
    payload: json("payload"),
    prevHash: varchar("prev_hash", { length: 64 }).notNull(),
    hash: varchar("hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantKeyIdx: index("audit_events_tenant_key_idx").on(t.tenantKey),
  }),
);

// GDPR-aware redactions for the immutable log (B-2+ wires the workflow).
export const auditRedactions = mysqlTable("audit_redactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  eventId: varchar("event_id", { length: 36 }).notNull(),
  reason: varchar("reason", { length: 512 }).notNull(),
  redactedBy: varchar("redacted_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
