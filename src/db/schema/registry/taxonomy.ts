import { mysqlTable, varchar, json, timestamp } from "drizzle-orm/mysql-core";

// Universal Taxonomy Engine — shared dictionaries (categories, tags, vehicle types, countries…).
export const taxonomies = mysqlTable("taxonomies", {
  id: varchar("id", { length: 36 }).primaryKey(),
  scope: varchar("scope", { length: 64 }).notNull(),
  key: varchar("key", { length: 128 }).notNull(),
  parentId: varchar("parent_id", { length: 36 }),
  label: varchar("label", { length: 255 }).notNull(),
  locale: varchar("locale", { length: 8 }).notNull().default("en"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
