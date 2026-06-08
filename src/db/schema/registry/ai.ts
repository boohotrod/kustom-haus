import { mysqlTable, varchar, mysqlEnum, json, timestamp } from "drizzle-orm/mysql-core";

// AI Registry — v0.1 has a dummy provider. Real providers come in via secrets in B-2+.
export const aiProviders = mysqlTable("ai_providers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  kind: mysqlEnum("kind", ["llm", "embed", "vision", "tts", "stt", "translate"]).notNull(),
  status: mysqlEnum("status", ["dummy", "active", "disabled"]).notNull().default("dummy"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiModels = mysqlTable("ai_models", {
  id: varchar("id", { length: 36 }).primaryKey(),
  providerId: varchar("provider_id", { length: 36 }).notNull(),
  modelKey: varchar("model_key", { length: 128 }).notNull(),
  capabilities: json("capabilities"),
  cost: json("cost"),
});

export const aiRoutingRules = mysqlTable("ai_routing_rules", {
  id: varchar("id", { length: 36 }).primaryKey(),
  useCase: varchar("use_case", { length: 64 }).notNull(),
  modelId: varchar("model_id", { length: 36 }).notNull(),
  priority: varchar("priority", { length: 16 }).notNull().default("normal"),
});
