// B-2.4 — Module ↔ Field namespace binding registry (schema only, no migration).
import { mysqlTable, varchar, mysqlEnum, boolean, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";

export const NAMESPACE_BINDING_KINDS = ["owner", "allowed", "required", "reserved"] as const;
export type NamespaceBindingKind = (typeof NAMESPACE_BINDING_KINDS)[number];

export const moduleNamespaceBindings = mysqlTable(
  "module_namespace_bindings",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantKey: varchar("tenant_key", { length: 64 }).notNull(),
    moduleKey: varchar("module_key", { length: 64 }).notNull(),
    namespace: varchar("namespace", { length: 128 }).notNull(),
    bindingKind: mysqlEnum("binding_kind", NAMESPACE_BINDING_KINDS).notNull(),
    /** B-2.4 decision #1: schema + flag only, default false. Actual auto-grant lands in B-3. */
    autoGrantToDependents: boolean("auto_grant_to_dependents").notNull().default(false),
    grantedBy: varchar("granted_by", { length: 36 }),
    grantReason: varchar("grant_reason", { length: 512 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    // Exactly one owner per (tenant, namespace) is enforced application-side
    // (MySQL lacks partial unique indexes); see namespace-ownership.ts.
    uniqBinding: uniqueIndex("uniq_tenant_module_namespace_kind")
      .on(t.tenantKey, t.moduleKey, t.namespace, t.bindingKind),
  }),
);

export const namespaceOwnershipHistory = mysqlTable("namespace_ownership_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tenantKey: varchar("tenant_key", { length: 64 }).notNull(),
  namespace: varchar("namespace", { length: 128 }).notNull(),
  fromModuleKey: varchar("from_module_key", { length: 64 }),
  toModuleKey: varchar("to_module_key", { length: 64 }).notNull(),
  changedBy: varchar("changed_by", { length: 36 }).notNull(),
  changeReason: varchar("change_reason", { length: 512 }).notNull(),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
});
