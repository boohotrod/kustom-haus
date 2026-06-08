import { sha256 } from "@noble/hashes/sha2.js";

// Opaque session / invite tokens. We store only the SHA-256 hash server-side.
export function generateToken(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hashToken(token: string): string {
  const digest = sha256(new TextEncoder().encode(token));
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}

// UUIDv4 is fine for IDs in v0.1; UUIDv7 will replace it together with mysql8 deploy.
export function newId(): string {
  return crypto.randomUUID();
}
