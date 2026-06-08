import { mysqlTable, varchar, int, json, timestamp } from "drizzle-orm/mysql-core";

// Generic versioning for memory, decisions, modules and (later) any entity.
export const entityVersions = mysqlTable("entity_versions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  targetType: varchar("target_type", { length: 64 }).notNull(),
  targetId: varchar("target_id", { length: 36 }).notNull(),
  versionNo: int("version_no").notNull(),
  snapshot: json("snapshot").notNull(),
  authorId: varchar("author_id", { length: 36 }).notNull(),
  reason: varchar("reason", { length: 512 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
