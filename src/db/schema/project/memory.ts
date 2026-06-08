import { mysqlTable, varchar, mysqlEnum, timestamp, text } from "drizzle-orm/mysql-core";

export const MEMORY_SCOPES = ["core", "business", "technical", "design", "legal", "note"] as const;
export type MemoryScope = (typeof MEMORY_SCOPES)[number];

export const projectMemory = mysqlTable("project_memory", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  scope: mysqlEnum("scope", MEMORY_SCOPES).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  authorId: varchar("author_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
