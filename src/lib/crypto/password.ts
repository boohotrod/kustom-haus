import { scryptAsync } from "@noble/hashes/scrypt.js";
import { randomBytes } from "@noble/hashes/utils.js";

// scrypt is the cross-platform baseline (Workers + Node). Production cPanel
// build replaces this with argon2id from the `argon2` npm package — same API.
const N = 1 << 15;
const r = 8;
const p = 1;
const dkLen = 32;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const dk = await scryptAsync(password, salt, { N, r, p, dkLen });
  return `scrypt$${N}$${r}$${p}$${toHex(salt)}$${toHex(dk)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const salt = fromHex(parts[4]);
  const expected = fromHex(parts[5]);
  const dk = await scryptAsync(password, salt, {
    N: Number(parts[1]), r: Number(parts[2]), p: Number(parts[3]), dkLen: expected.length,
  });
  if (dk.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < dk.length; i++) diff |= dk[i] ^ expected[i];
  return diff === 0;
}
