import { sha256 } from "@noble/hashes/sha2.js";

export type AuditEvent = {
  id: string;
  seq: number;
  actorId: string | null;
  tenantKey: string | null;
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

/**
 * B-2.1: payload schema now includes tenantKey. The verifier respects the
 * `chainSchema` field on each event so the pre-checkpoint legacy events stay
 * verifiable alongside post-checkpoint tenant-scoped events.
 */
type Schema = "v1" | "v2";

function payloadFor(e: AuditEvent, schema: Schema) {
  const base = {
    seq: e.seq,
    actorId: e.actorId,
    action: e.action,
    targetType: e.targetType,
    targetId: e.targetId,
    payload: e.payload,
    createdAt: e.createdAt,
  };
  return schema === "v2" ? { ...base, tenantKey: e.tenantKey } : base;
}

export function appendAudit(
  chain: AuditEvent[],
  event: Omit<AuditEvent, "seq" | "prevHash" | "hash" | "createdAt" | "id" | "tenantKey"> & {
    id?: string;
    tenantKey?: string | null;
  },
): AuditEvent {
  const prev = chain[chain.length - 1];
  const prevHash = prev?.hash ?? "0".repeat(64);
  const seq = (prev?.seq ?? 0) + 1;
  const id = event.id ?? crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const full: AuditEvent = {
    id,
    seq,
    actorId: event.actorId,
    tenantKey: event.tenantKey ?? null,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId,
    payload: event.payload,
    prevHash,
    hash: "",
    createdAt,
  };
  full.hash = computeAuditHash(prevHash, payloadFor(full, "v2"));
  chain.push(full);
  return full;
}

/** Insert an explicit chain-schema checkpoint (used by the audit.tenant_key migration). */
export function appendAuditCheckpoint(chain: AuditEvent[], note: string): AuditEvent {
  return appendAudit(chain, {
    actorId: null,
    action: "audit.chain.checkpoint",
    targetType: "audit",
    targetId: "schema",
    payload: { from: "v1", to: "v2", note },
  });
}

export function verifyAuditChain(chain: AuditEvent[]): { ok: true } | { ok: false; brokenAt: number } {
  let prevHash = "0".repeat(64);
  let schema: Schema = "v1";
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const expected = computeAuditHash(prevHash, payloadFor(e, schema));
    if (e.prevHash !== prevHash || e.hash !== expected) return { ok: false, brokenAt: i + 1 };
    prevHash = e.hash;
    if (e.action === "audit.chain.checkpoint") {
      const p = e.payload as { to?: Schema } | null;
      if (p?.to === "v2") schema = "v2";
    }
  }
  return { ok: true };
}
