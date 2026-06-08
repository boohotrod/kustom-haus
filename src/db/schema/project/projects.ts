import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1024 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
