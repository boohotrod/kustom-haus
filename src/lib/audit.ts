import { sha256 } from "@noble/hashes/sha2.js";

export type AuditEvent = {
  id: string;
  seq: number;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  payload: unknown;
  prevHash: string;
  hash: string;
  createdAt: string;
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}

export function computeAuditHash(prevHash: string, payload: unknown): string {
  return toHex(sha256(new TextEncoder().encode(prevHash + canonicalJson(payload))));
}

export function appendAudit(
  chain: AuditEvent[],
  event: Omit<AuditEvent, "seq" | "prevHash" | "hash" | "createdAt" | "id"> & { id?: string },
): AuditEvent {
  const prev = chain[chain.length - 1];
  const prevHash = prev?.hash ?? "0".repeat(64);
  const seq = (prev?.seq ?? 0) + 1;
  const id = event.id ?? crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const payloadForHash = {
    seq, actorId: event.actorId, action: event.action,
    targetType: event.targetType, targetId: event.targetId, payload: event.payload, createdAt,
  };
  const hash = computeAuditHash(prevHash, payloadForHash);
  const full: AuditEvent = { ...event, id, seq, prevHash, hash, createdAt };
  chain.push(full);
  return full;
}

export function verifyAuditChain(chain: AuditEvent[]): { ok: true } | { ok: false; brokenAt: number } {
  let prevHash = "0".repeat(64);
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const payloadForHash = {
      seq: e.seq, actorId: e.actorId, action: e.action,
      targetType: e.targetType, targetId: e.targetId, payload: e.payload, createdAt: e.createdAt,
    };
    const expected = computeAuditHash(prevHash, payloadForHash);
    if (e.prevHash !== prevHash || e.hash !== expected) return { ok: false, brokenAt: i + 1 };
    prevHash = e.hash;
  }
  return { ok: true };
}
