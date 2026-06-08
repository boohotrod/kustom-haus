import { mysqlTable, varchar, timestamp, boolean } from "drizzle-orm/mysql-core";

export const invites = mysqlTable("invites", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  invitedBy: varchar("invited_by", { length: 36 }).notNull(),
  roleKey: varchar("role_key", { length: 64 }),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  ip: varchar("ip", { length: 64 }),
  userAgent: varchar("user_agent", { length: 512 }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
