import { mysqlTable, varchar, boolean, timestamp, json } from "drizzle-orm/mysql-core";

/**
 * Global Identity Registry — single source of truth for the entire BBS ecosystem.
 * SuperAdmin is exactly one global identity and is invisible across all surfaces.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isGlobalSuperadmin: boolean("is_global_superadmin").notNull().default(false),
  isInvisible: boolean("is_invisible").notNull().default(false),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  locale: varchar("locale", { length: 8 }).notNull().default("hu"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
