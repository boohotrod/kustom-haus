import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

// Knowledge Map Registry — graph linking requirements, decisions, modules, memory, etc.
export const knowledgeNodes = mysqlTable("knowledge_nodes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  kind: varchar("kind", { length: 32 }).notNull(),
  refType: varchar("ref_type", { length: 64 }),
  refId: varchar("ref_id", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const knowledgeEdges = mysqlTable("knowledge_edges", {
  id: varchar("id", { length: 36 }).primaryKey(),
  fromNode: varchar("from_node", { length: 36 }).notNull(),
  toNode: varchar("to_node", { length: 36 }).notNull(),
  relation: varchar("relation", { length: 64 }).notNull(),
});
