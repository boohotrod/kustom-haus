import { mysqlTable, varchar, mysqlEnum, primaryKey, timestamp } from "drizzle-orm/mysql-core";

// Function-level permissions: <module>.<function>.<action>
export const permissions = mysqlTable("permissions", {
  key: varchar("key", { length: 191 }).primaryKey(),
  module: varchar("module", { length: 64 }).notNull(),
  function: varchar("function", { length: 64 }).notNull(),
  action: varchar("action", { length: 32 }).notNull(),
  description: varchar("description", { length: 512 }),
});

export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    roleKey: varchar("role_key", { length: 64 }).notNull(),
    permissionKey: varchar("permission_key", { length: 191 }).notNull(),
    effect: mysqlEnum("effect", ["allow", "deny"]).notNull().default("allow"),
  },
  (t) => ({ pk: primaryKey({ columns: [t.roleKey, t.permissionKey] }) }),
);

export const userPermissionOverrides = mysqlTable(
  "user_permission_overrides",
  {
    userId: varchar("user_id", { length: 36 }).notNull(),
    permissionKey: varchar("permission_key", { length: 191 }).notNull(),
    effect: mysqlEnum("effect", ["allow", "deny"]).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.permissionKey] }) }),
);
