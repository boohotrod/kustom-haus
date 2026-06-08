import { mysqlTable, varchar, json, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Translations bind to a field VERSION (not definition) — old version labels
 * are preserved. New versions inherit translations via copy-on-write.
 * Missing locale falls back to `[locale] field.key` (B-2 decision #4).
 */
export const fieldTranslations = mysqlTable(
  "field_translations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    fieldVersionId: varchar("field_version_id", { length: 36 }).notNull(),
    locale: varchar("locale", { length: 8 }).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    help: varchar("help", { length: 1024 }),
    placeholder: varchar("placeholder", { length: 255 }),
    enumLabels: json("enum_labels"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    versionLocaleUq: uniqueIndex("field_tr_version_locale_uq").on(t.fieldVersionId, t.locale),
  }),
);
