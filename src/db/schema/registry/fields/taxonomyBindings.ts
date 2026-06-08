import { mysqlTable, varchar, mysqlEnum, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";
import { FIELD_TAXONOMY_BINDING_KINDS } from "./enums";

// N-N: a field can attach to several taxonomy nodes with different binding kinds.
export const fieldTaxonomyBindings = mysqlTable(
  "field_taxonomy_bindings",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    fieldId: varchar("field_id", { length: 36 }).notNull(),
    taxonomyNodeId: varchar("taxonomy_node_id", { length: 36 }).notNull(),
    bindingKind: mysqlEnum("binding_kind", FIELD_TAXONOMY_BINDING_KINDS).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    bindingUq: uniqueIndex("field_tax_bind_uq").on(t.fieldId, t.taxonomyNodeId, t.bindingKind),
  }),
);
