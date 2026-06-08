import {
  mysqlTable, varchar, json, timestamp, boolean, int, decimal,
  uniqueIndex, index,
} from "drizzle-orm/mysql-core";

/**
 * EAV storage with typed value columns + partial indexes (real MySQL migration
 * adds the WHERE-filtered indexes & GIN equivalent on JSON). `position` is
 * optional and only meaningful for multivalue fields (B-2 decision #3).
 *
 * Logical FK: (entity_type, entity_id) points at any Universal Profile Engine
 * entity; we don't add a hard FK so DFR stays profile-agnostic.
 */
export const fieldValues = mysqlTable(
  "field_values",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantKey: varchar("tenant_key", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 36 }).notNull(),
    fieldId: varchar("field_id", { length: 36 }).notNull(),
    fieldVersionId: varchar("field_version_id", { length: 36 }).notNull(),
    position: int("position"),
    valueString: varchar("value_string", { length: 1024 }),
    valueNumber: decimal("value_number", { precision: 30, scale: 6 }),
    valueBool: boolean("value_bool"),
    valueDatetime: timestamp("value_datetime"),
    valueJson: json("value_json"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    createdBy: varchar("created_by", { length: 36 }),
  },
  (t) => ({
    entityReadIdx: index("field_values_entity_read_idx").on(t.tenantKey, t.entityType, t.entityId),
    fieldStringIdx: index("field_values_field_string_idx").on(t.fieldId, t.valueString),
    fieldNumberIdx: index("field_values_field_number_idx").on(t.fieldId, t.valueNumber),
    fieldDatetimeIdx: index("field_values_field_datetime_idx").on(t.fieldId, t.valueDatetime),
    singleValueUq: uniqueIndex("field_values_single_uq").on(t.tenantKey, t.entityType, t.entityId, t.fieldId, t.position),
  }),
);

/** Value-level audit + restore. `audit_event_id` links 1:1 to audit_events. */
export const fieldValueHistory = mysqlTable("field_value_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  valueId: varchar("value_id", { length: 36 }).notNull(),
  previousSnapshot: json("previous_snapshot"),
  changedBy: varchar("changed_by", { length: 36 }),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  changeReason: varchar("change_reason", { length: 512 }),
  auditEventId: varchar("audit_event_id", { length: 36 }),
});
