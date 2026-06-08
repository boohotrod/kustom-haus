// Lazy DB client. mysql2 is loaded ONLY when DATABASE_URL is configured.
// In preview / Cloudflare Workers, mysql2 is never imported so the bundle stays clean.
import { getServerEnv } from "./env";

type DrizzleDb = unknown;
let cached: DrizzleDb | null = null;

export async function getDb(): Promise<DrizzleDb | null> {
  if (cached) return cached;
  const env = getServerEnv();
  if (!env.DATABASE_URL) return null;
  const [{ drizzle }, mysql] = await Promise.all([
    import("drizzle-orm/mysql2"),
    import("mysql2/promise"),
  ]);
  const pool = await mysql.createPool({ uri: env.DATABASE_URL, connectionLimit: 4 });
  const schema = await import("@/db/schema");
  cached = drizzle(pool, { schema, mode: "default" });
  return cached;
}
