import { mysqlTable, varchar, json, timestamp, text } from "drizzle-orm/mysql-core";

export const decisions = mysqlTable("decisions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("proposed"),
  context: text("context"),
  decision: text("decision"),
  consequences: text("consequences"),
  // Array of project_modules.key values — a single ADR can affect many modules.
  relatedModules: json("related_modules"),
  authorId: varchar("author_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
