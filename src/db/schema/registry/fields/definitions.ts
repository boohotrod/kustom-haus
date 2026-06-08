import {
  mysqlTable, varchar, json, mysqlEnum, timestamp, boolean, int,
  uniqueIndex, index,
} from "drizzle-orm/mysql-core";
import { FIELD_DATA_TYPES, FIELD_STATUSES } from "./enums";

/**
 * Field as object (head). `current_version_id` points at the active row in
 * `field_versions`. A field with any `field_values` rows cannot be physically
 * deleted — only archived.
 */
export const fieldDefinitions = mysqlTable(
  "field_definitions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantKey: varchar("tenant_key", { length: 64 }).notNull(),
    namespace: varchar("namespace", { length: 64 }).notNull(),
    key: varchar("key", { length: 128 }).notNull(),
    ownerModule: varchar("owner_module", { length: 64 }).notNull(),
    dataType: mysqlEnum("data_type", FIELD_DATA_TYPES).notNull(),
    isMultivalue: boolean("is_multivalue").notNull().default(false),
    isRequiredDefault: boolean("is_required_default").notNull().default(false),
    status: mysqlEnum("status", FIELD_STATUSES).notNull().default("active"),
    currentVersionId: varchar("current_version_id", { length: 36 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    archivedAt: timestamp("archived_at"),
  },
  (t) => ({
    tenantNamespaceKeyUq: uniqueIndex("field_def_tenant_ns_key_uq").on(t.tenantKey, t.namespace, t.key),
    statusIdx: index("field_def_status_idx").on(t.status),
    ownerIdx: index("field_def_owner_idx").on(t.ownerModule),
  }),
);

/**
 * Versioning (body). Every edit creates a new row; `is_current` flips.
 * `schema` jsonb holds validation (min/max/regex/enum members/reference target/UI hints).
 */
export const fieldVersions = mysqlTable(
  "field_versions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    fieldId: varchar("field_id", { length: 36 }).notNull(),
    versionNo: int("version_no").notNull(),
    schema: json("schema").notNull(),
    defaultValue: json("default_value"),
    changeReason: varchar("change_reason", { length: 512 }),
    createdBy: varchar("created_by", { length: 36 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    isCurrent: boolean("is_current").notNull().default(false),
  },
  (t) => ({
    fieldVersionUq: uniqueIndex("field_versions_field_ver_uq").on(t.fieldId, t.versionNo),
    fieldCurrentIdx: index("field_versions_field_current_idx").on(t.fieldId, t.isCurrent),
  }),
);
