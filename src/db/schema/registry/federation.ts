import { mysqlTable, varchar, json, mysqlEnum, timestamp, uniqueIndex, index } from "drizzle-orm/mysql-core";

// Federation Registry — trusted peers for the Boo Base System Federation Bridge Protocol.
export const federationPeers = mysqlTable("federation_peers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  peerKey: varchar("peer_key", { length: 64 }).notNull().unique(),
  baseUrl: varchar("base_url", { length: 512 }).notNull(),
  publicKey: varchar("public_key", { length: 1024 }),
  status: mysqlEnum("status", ["pending", "active", "suspended"]).notNull().default("pending"),
  capabilities: json("capabilities"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const federationTrust = mysqlTable("federation_trust", {
  id: varchar("id", { length: 36 }).primaryKey(),
  peerId: varchar("peer_id", { length: 36 }).notNull(),
  trustLevel: mysqlEnum("trust_level", ["read", "share", "mirror"]).notNull(),
  scopes: json("scopes"),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
});

/**
 * Federation user link (B-2.1) — implements Federation Bridge Protocol §7–8, §22–23.
 * The local users.id stays local; bbs_federation_user_id is the cross-system identifier.
 * Every synchronized record preserves source/origin metadata for ownership and audit.
 */
export const federationUsers = mysqlTable(
  "federation_users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    peerId: varchar("peer_id", { length: 36 }).notNull(),
    bbsFederationUserId: varchar("bbs_federation_user_id", { length: 64 }).notNull(),
    sourceSystemId: varchar("source_system_id", { length: 64 }),
    sourceTenantId: varchar("source_tenant_id", { length: 64 }),
    sourceRecordId: varchar("source_record_id", { length: 64 }),
    dataOrigin: mysqlEnum("data_origin", ["local", "imported", "synced", "external"]).notNull().default("local"),
    syncStatus: mysqlEnum("sync_status", [
      "local",
      "imported",
      "synced",
      "pending",
      "conflict",
      "archived_remote",
      "disconnected",
    ]).notNull().default("local"),
    syncCreatedAt: timestamp("sync_created_at").notNull().defaultNow(),
    syncUpdatedAt: timestamp("sync_updated_at").notNull().defaultNow(),
    metadata: json("metadata"),
  },
  (t) => ({
    peerFedUserUnique: uniqueIndex("federation_users_peer_fed_uid_uq").on(t.peerId, t.bbsFederationUserId),
    userIdIdx: index("federation_users_user_id_idx").on(t.userId),
    syncStatusIdx: index("federation_users_sync_status_idx").on(t.syncStatus),
  }),
);
