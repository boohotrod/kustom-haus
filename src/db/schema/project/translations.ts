import { mysqlTable, varchar, mysqlEnum, text, timestamp } from "drizzle-orm/mysql-core";

// Content i18n — distinct from UI i18n JSON. One row per (entity, field, locale).
export const translations = mysqlTable("translations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: varchar("entity_id", { length: 36 }).notNull(),
  field: varchar("field", { length: 64 }).notNull(),
  locale: varchar("locale", { length: 8 }).notNull(),
  value: text("value").notNull(),
  source: mysqlEnum("source", ["human", "ai", "imported"]).notNull().default("human"),
  status: mysqlEnum("status", ["draft", "review", "published"]).notNull().default("draft"),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
