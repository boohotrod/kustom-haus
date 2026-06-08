import { mysqlTable, varchar, mysqlEnum, timestamp, json } from "drizzle-orm/mysql-core";

export const MODULE_STATES = [
  "planned", "in_design", "in_dev", "in_test", "live", "deprecated", "archived",
] as const;
export type ModuleState = (typeof MODULE_STATES)[number];

export const MODULE_VISIBILITY = ["public", "internal", "hidden"] as const;
export type ModuleVisibility = (typeof MODULE_VISIBILITY)[number];

export const projectModules = mysqlTable("project_modules", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  key: varchar("key", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  state: mysqlEnum("state", MODULE_STATES).notNull().default("planned"),
  visibility: mysqlEnum("visibility", MODULE_VISIBILITY).notNull().default("internal"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const moduleStateHistory = mysqlTable("module_state_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  moduleId: varchar("module_id", { length: 36 }).notNull(),
  fromState: mysqlEnum("from_state", MODULE_STATES),
  toState: mysqlEnum("to_state", MODULE_STATES).notNull(),
  changedBy: varchar("changed_by", { length: 36 }).notNull(),
  reason: varchar("reason", { length: 512 }),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
});
