import { mysqlTable, varchar, timestamp, primaryKey, json } from "drizzle-orm/mysql-core";

// Future tenants (BBS portal, sub-portals) link to the Global Identity Registry here.
export const tenantUserMembership = mysqlTable(
  "tenant_user_membership",
  {
    tenantKey: varchar("tenant_key", { length: 64 }).notNull(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    roleKey: varchar("role_key", { length: 64 }).notNull(),
    metadata: json("metadata"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.tenantKey, t.userId, t.roleKey] }) }),
);
