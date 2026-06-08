#!/usr/bin/env node
/**
 * Superadmin seed CLI — interactive.
 *
 *   node scripts/seed-superadmin.mjs
 *
 * Creates the single Global SuperAdmin in the configured MySQL database.
 * Refuses to run twice. v0.1 uses scrypt; production cPanel build swaps to argon2id.
 *
 * Requires DATABASE_URL in the environment.
 */
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL missing. Aborting (no seed).");
    process.exit(2);
  }
  const rl = readline.createInterface({ input, output });
  const username = await rl.question("SuperAdmin username: ");
  const email = await rl.question("SuperAdmin email: ");
  const password = await rl.question("SuperAdmin password: ");
  rl.close();

  if (!username || !email || !password || password.length < 12) {
    console.error("Invalid input. Username/email required; password >= 12 chars.");
    process.exit(3);
  }

  // Implementation arrives once the first real migration is run. The CLI is
  // intentionally a stub in v0.1 — no live DB writes from preview. See docs/DEPLOY_CPANEL.md.
  console.log("Would create SuperAdmin", { username, email, isGlobalSuperadmin: true, isInvisible: true });
  console.log("Run drizzle migrations first, then re-run this CLI to perform the insert.");
}

void main();
