import { mysqlTable, varchar, mysqlEnum, timestamp, uniqueIndex, index } from "drizzle-orm/mysql-core";
import { FIELD_PERMISSIONS, FIELD_PERMISSION_SUBJECTS } from "./enums";

/**
 * Per-field grants. Evaluated AND-wise with module-level RBAC and
 * entity-level permission from the Universal Profile Engine. `deny > allow`;
 * missing rule = not visible.
 */
export const fieldPermissions = mysqlTable(
  "field_permissions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    fieldId: varchar("field_id", { length: 36 }).notNull(),
    tenantKey: varchar("tenant_key", { length: 64 }).notNull(),
    subjectKind: mysqlEnum("subject_kind", FIELD_PERMISSION_SUBJECTS).notNull(),
    subjectId: varchar("subject_id", { length: 64 }).notNull(),
    permission: mysqlEnum("permission", FIELD_PERMISSIONS).notNull(),
    effect: mysqlEnum("effect", ["allow", "deny"]).notNull().default("allow"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    permUq: uniqueIndex("field_perm_uq").on(t.fieldId, t.subjectKind, t.subjectId, t.permission),
    tenantIdx: index("field_perm_tenant_idx").on(t.tenantKey),
  }),
);
