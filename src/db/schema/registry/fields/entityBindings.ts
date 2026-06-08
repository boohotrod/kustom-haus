import { mysqlTable, varchar, boolean, int, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Which entity types a field appears on (profile-agnostic). `is_required`
 * overrides the field's default. `group_key` clusters fields in the UI;
 * `display_order` controls ordering within the group.
 */
export const fieldEntityBindings = mysqlTable(
  "field_entity_bindings",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    fieldId: varchar("field_id", { length: 36 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    isRequired: boolean("is_required").notNull().default(false),
    displayOrder: int("display_order").notNull().default(0),
    groupKey: varchar("group_key", { length: 64 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    entityUq: uniqueIndex("field_entity_bind_uq").on(t.fieldId, t.entityType),
  }),
);
