import { mysqlTable, varchar, timestamp, primaryKey } from "drizzle-orm/mysql-core";

export const roles = mysqlTable("roles", {
  key: varchar("key", { length: 64 }).primaryKey(),
  label: varchar("label", { length: 128 }).notNull(),
  description: varchar("description", { length: 512 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userRoles = mysqlTable(
  "user_roles",
  {
    userId: varchar("user_id", { length: 36 }).notNull(),
    roleKey: varchar("role_key", { length: 64 }).notNull(),
    grantedAt: timestamp("granted_at").notNull().defaultNow(),
    grantedBy: varchar("granted_by", { length: 36 }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.roleKey] }) }),
);
