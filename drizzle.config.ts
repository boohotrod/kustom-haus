import type { Config } from "drizzle-kit";

// Drizzle config — generates SQL migrations only.
// DO NOT run migrations in preview. Real DATABASE_URL is configured on cPanel.
export default {
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "mysql://placeholder@localhost/bbs_builder" },
} satisfies Config;
