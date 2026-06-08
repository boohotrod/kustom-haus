import { mysqlTable, varchar, json, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";

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
