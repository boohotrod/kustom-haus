// B-2.4 — Module ↔ Field Namespace ownership rules.
// Runtime helpers, used by mock-store seed + UI. Pure functions over typed shapes.
import type { NamespaceBindingKind } from "@/db/schema/registry/moduleNamespaces";
import type { ModuleState } from "@/db/schema/project/modules";

export type MockModuleNamespaceBinding = {
  id: string;
  tenantKey: string;
  moduleKey: string;
  namespace: string;
  bindingKind: NamespaceBindingKind;
  autoGrantToDependents: boolean;
  grantedBy: string | null;
  grantReason: string;
  createdAt: string;
  updatedAt: string;
};

export type MockNamespaceOwnershipHistory = {
  id: string;
  tenantKey: string;
  namespace: string;
  fromModuleKey: string | null;
  toModuleKey: string;
  changedBy: string;
  changeReason: string;
  changedAt: string;
};

// ---------------------------------------------------------------------------
// Dot-prefix matching — B-2.4 decision #3.
// `vehicle` covers `vehicle.engine`, `vehicle.engine.cc`, etc.
// ---------------------------------------------------------------------------
export function namespaceMatches(scope: string, target: string): boolean {
  if (scope === target) return true;
  return target.startsWith(`${scope}.`);
}

export function findOwner(
  bindings: MockModuleNamespaceBinding[],
  tenantKey: string,
  namespace: string,
): MockModuleNamespaceBinding | undefined {
  // Direct owner first, then nearest dot-prefix owner.
  const direct = bindings.find(
    (b) => b.tenantKey === tenantKey && b.bindingKind === "owner" && b.namespace === namespace,
  );
  if (direct) return direct;
  const candidates = bindings
    .filter((b) => b.tenantKey === tenantKey && b.bindingKind === "owner" && namespaceMatches(b.namespace, namespace))
    .sort((a, b) => b.namespace.length - a.namespace.length);
  return candidates[0];
}

export type UsageDecision =
  | { allowed: true; reason: "owner" | "allowed" | "required" | "parent_allowed" | "dependency" | "superadmin" }
  | { allowed: false; reason: "no_owner" | "reserved_blocked" | "denied" };

export function canModuleUseNamespace(opts: {
  bindings: MockModuleNamespaceBinding[];
  moduleKey: string;
  moduleDeps: string[];        // transitive dependencies of moduleKey
  tenantKey: string;
  namespace: string;
  isSuperadmin?: boolean;
}): UsageDecision {
  const { bindings, moduleKey, moduleDeps, tenantKey, namespace, isSuperadmin } = opts;
  if (isSuperadmin) return { allowed: true, reason: "superadmin" };

  const owner = findOwner(bindings, tenantKey, namespace);
  if (!owner) return { allowed: false, reason: "no_owner" };
  if (owner.moduleKey === moduleKey) return { allowed: true, reason: "owner" };

  const direct = bindings.find(
    (b) =>
      b.tenantKey === tenantKey &&
      b.moduleKey === moduleKey &&
      namespaceMatches(b.namespace, namespace),
  );
  if (direct) {
    if (direct.bindingKind === "reserved") return { allowed: false, reason: "reserved_blocked" };
    if (direct.bindingKind === "required") return { allowed: true, reason: "required" };
    if (direct.bindingKind === "allowed") {
      return { allowed: true, reason: direct.namespace === namespace ? "allowed" : "parent_allowed" };
    }
  }

  // Dependency-based: if module depends on the owner module AND the owner
  // flagged `autoGrantToDependents = true`, allow. (B-2.4 decision #1 — schema
  // present, default false; behaviour lands in B-3, but we still honor the flag.)
  if (owner.autoGrantToDependents && moduleDeps.includes(owner.moduleKey)) {
    return { allowed: true, reason: "dependency" };
  }

  return { allowed: false, reason: "denied" };
}

// ---------------------------------------------------------------------------
// Ownership invariant — every namespace referenced by any field definition
// must have exactly one owner binding per tenant.
// ---------------------------------------------------------------------------
export type InvariantViolation =
  | { kind: "no_owner"; tenantKey: string; namespace: string }
  | { kind: "multiple_owners"; tenantKey: string; namespace: string; modules: string[] };

export function checkOwnershipInvariant(
  bindings: MockModuleNamespaceBinding[],
  namespaces: { tenantKey: string; namespace: string }[],
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const seen = new Set<string>();
  for (const ns of namespaces) {
    const key = `${ns.tenantKey}|${ns.namespace}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const owners = bindings.filter(
      (b) => b.tenantKey === ns.tenantKey && b.bindingKind === "owner" && namespaceMatches(b.namespace, ns.namespace),
    );
    if (owners.length === 0) {
      violations.push({ kind: "no_owner", tenantKey: ns.tenantKey, namespace: ns.namespace });
    } else if (owners.filter((o) => o.namespace === ns.namespace).length > 1) {
      violations.push({
        kind: "multiple_owners",
        tenantKey: ns.tenantKey,
        namespace: ns.namespace,
        modules: owners.map((o) => o.moduleKey),
      });
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Lifecycle reason requirement — all of these throw without a non-empty reason.
// Callers (UI + future server fns) MUST catch and surface the message.
// ---------------------------------------------------------------------------
export class ChangeReasonRequiredError extends Error {
  constructor(op: string) { super(`change_reason is required for ${op}`); this.name = "ChangeReasonRequiredError"; }
}

export function requireReason(op: string, reason: string | null | undefined): string {
  const trimmed = (reason ?? "").trim();
  if (!trimmed) throw new ChangeReasonRequiredError(op);
  return trimmed;
}

// Allowed module-state transitions (matches FORWARD for fields but for modules
// we allow any → any with reason since module lifecycle isn't strictly linear).
export function isModuleTransitionAllowed(_from: ModuleState, _to: ModuleState): boolean {
  // Permissive on purpose — B-1 explicitly leaves module lifecycle policy open.
  // The hard requirement here is the change_reason, not the topology.
  return true;
}

// ---------------------------------------------------------------------------
// Seed bindings — B-2.4 decision #4: every namespace used by any field gets
// an owner now so the invariant is green at boot.
// ---------------------------------------------------------------------------
export type SeedBinding = {
  moduleKey: string;
  namespace: string;
  bindingKind: NamespaceBindingKind;
  autoGrantToDependents?: boolean;
  grantReason: string;
};

export const SEED_NAMESPACE_BINDINGS: SeedBinding[] = [
  // Foundation
  { moduleKey: "identity",       namespace: "identity",   bindingKind: "owner",    grantReason: "Identity module owns its own namespace." },
  { moduleKey: "identity",       namespace: "auth",       bindingKind: "owner",    grantReason: "Auth surfaces are owned by Identity." },
  { moduleKey: "identity",       namespace: "session",    bindingKind: "owner",    grantReason: "Session metadata is owned by Identity." },
  { moduleKey: "audit",          namespace: "audit",      bindingKind: "owner",    grantReason: "Audit owns its event namespace." },
  { moduleKey: "project",        namespace: "project",    bindingKind: "owner",    grantReason: "Project memory/ADR namespace." },
  { moduleKey: "rbac",           namespace: "rbac",       bindingKind: "owner",    grantReason: "Roles/permissions namespace." },

  // Registries
  { moduleKey: "taxonomy",       namespace: "taxonomy",   bindingKind: "owner",    grantReason: "Universal taxonomy namespace." },
  { moduleKey: "federation",     namespace: "federation", bindingKind: "owner",    grantReason: "Federation registry namespace." },
  { moduleKey: "federation",     namespace: "identity",   bindingKind: "allowed",  grantReason: "Federation reads identity to link users." },
  { moduleKey: "fields",         namespace: "field",      bindingKind: "owner",    grantReason: "Dynamic Field Registry namespace." },
  { moduleKey: "ai",             namespace: "ai",         bindingKind: "owner",    grantReason: "AI registry namespace." },
  { moduleKey: "knowledge",      namespace: "knowledge",  bindingKind: "owner",    grantReason: "Knowledge map namespace." },
  { moduleKey: "knowledge",      namespace: "project",    bindingKind: "allowed",  grantReason: "Knowledge map links to project decisions." },
  { moduleKey: "translation",    namespace: "translation",bindingKind: "owner",    grantReason: "Translation engine namespace." },
  { moduleKey: "translation",    namespace: "field",      bindingKind: "allowed",  grantReason: "Translation engine reads field labels." },
  { moduleKey: "translation",    namespace: "ai",         bindingKind: "allowed",  grantReason: "Translation engine consumes AI provider config." },

  // Profile engine + types
  { moduleKey: "profile_engine", namespace: "profile",    bindingKind: "owner", autoGrantToDependents: true, grantReason: "Universal Profile Engine owns the shared profile namespace; dependents auto-allowed (B-3)." },
  { moduleKey: "profile_engine", namespace: "profile.core", bindingKind: "required", grantReason: "Core profile fields must be present." },
  { moduleKey: "profile_engine", namespace: "profile.ext",  bindingKind: "reserved", grantReason: "Reserved for per-type extensions." },
  { moduleKey: "profile_engine", namespace: "taxonomy",   bindingKind: "allowed",  grantReason: "Profile uses taxonomy for tagging." },
  { moduleKey: "profile_engine", namespace: "field",      bindingKind: "allowed",  grantReason: "Profile engine reads field definitions." },

  { moduleKey: "profile_user",   namespace: "profile",    bindingKind: "allowed",  grantReason: "User profile extends shared profile." },
  { moduleKey: "profile_vehicle",namespace: "vehicle",    bindingKind: "owner",    grantReason: "Vehicle profile owns the vehicle namespace." },
  { moduleKey: "profile_vehicle",namespace: "vehicle.core", bindingKind: "required", grantReason: "Vehicle profile requires its core fields." },
  { moduleKey: "profile_vehicle",namespace: "vehicle.engine", bindingKind: "reserved", grantReason: "Reserved for engine sub-fields." },
  { moduleKey: "profile_vehicle",namespace: "vehicle.build",  bindingKind: "reserved", grantReason: "Reserved for build-state sub-fields." },
  { moduleKey: "profile_vehicle",namespace: "profile",    bindingKind: "allowed",  grantReason: "Vehicle profile extends shared profile." },
  { moduleKey: "profile_vehicle",namespace: "taxonomy",   bindingKind: "allowed",  grantReason: "Vehicle types come from taxonomy." },
  { moduleKey: "profile_club",   namespace: "club",       bindingKind: "owner",    grantReason: "Club profile namespace." },
  { moduleKey: "profile_club",   namespace: "profile",    bindingKind: "allowed",  grantReason: "Club profile extends shared profile." },
  { moduleKey: "profile_event",  namespace: "event",      bindingKind: "owner",    grantReason: "Event profile namespace." },
  { moduleKey: "profile_event",  namespace: "event.schedule", bindingKind: "reserved", grantReason: "Reserved for schedule sub-fields." },
  { moduleKey: "profile_event",  namespace: "profile",    bindingKind: "allowed",  grantReason: "Event profile extends shared profile." },
  { moduleKey: "profile_event",  namespace: "taxonomy",   bindingKind: "allowed",  grantReason: "Event tagging via taxonomy." },
  { moduleKey: "profile_business",namespace: "business",  bindingKind: "owner",    grantReason: "Business profile namespace." },
  { moduleKey: "profile_business",namespace: "profile",   bindingKind: "allowed",  grantReason: "Business profile extends shared profile." },
  { moduleKey: "profile_workshop",namespace: "workshop",  bindingKind: "owner",    grantReason: "Workshop profile namespace." },
  { moduleKey: "profile_workshop",namespace: "business",  bindingKind: "allowed",  grantReason: "Workshop extends business profile." },
  { moduleKey: "profile_workshop",namespace: "vehicle",   bindingKind: "allowed",  grantReason: "Workshops reference vehicles." },
  { moduleKey: "profile_shop",   namespace: "shop",       bindingKind: "owner",    grantReason: "Shop profile namespace." },
  { moduleKey: "profile_shop",   namespace: "business",   bindingKind: "allowed",  grantReason: "Shop extends business profile." },
  { moduleKey: "profile_artist", namespace: "artist",     bindingKind: "owner",    grantReason: "Artist profile namespace." },
  { moduleKey: "profile_artist", namespace: "profile",    bindingKind: "allowed",  grantReason: "Artist extends shared profile." },
  { moduleKey: "profile_performer",namespace: "performer",bindingKind: "owner",    grantReason: "Performer profile namespace." },
  { moduleKey: "profile_performer",namespace: "artist",   bindingKind: "allowed",  grantReason: "Performer extends artist profile." },

  // Platform
  { moduleKey: "files",          namespace: "files",      bindingKind: "owner",    grantReason: "Object storage namespace." },
  { moduleKey: "notifications",  namespace: "notifications", bindingKind: "owner", grantReason: "Notifications namespace." },
  { moduleKey: "search",         namespace: "search",     bindingKind: "owner",    grantReason: "Search namespace." },
  { moduleKey: "moderation",     namespace: "moderation", bindingKind: "owner",    grantReason: "Moderation namespace." },
  { moduleKey: "analytics",      namespace: "analytics",  bindingKind: "owner",    grantReason: "Analytics namespace." },
  { moduleKey: "billing",        namespace: "billing",    bindingKind: "owner",    grantReason: "Billing namespace." },

  // Portals
  { moduleKey: "support",        namespace: "support",    bindingKind: "owner",    grantReason: "Support portal namespace." },
  { moduleKey: "travel",         namespace: "travel",     bindingKind: "owner",    grantReason: "Travel portal namespace." },
  { moduleKey: "media",          namespace: "media",      bindingKind: "owner",    grantReason: "Media portal namespace." },
  { moduleKey: "media",          namespace: "gallery",    bindingKind: "owner",    grantReason: "Gallery sub-system owned by Media portal." },
  { moduleKey: "media",          namespace: "profile",    bindingKind: "allowed",  grantReason: "Media portal renders profile media." },
  { moduleKey: "garage",         namespace: "vehicle",    bindingKind: "allowed",  grantReason: "Garage portal shows vehicles." },
  { moduleKey: "garage",         namespace: "workshop",   bindingKind: "allowed",  grantReason: "Garage portal shows workshops." },

  // Compliance
  { moduleKey: "gdpr",           namespace: "gdpr",       bindingKind: "owner",    grantReason: "GDPR engine namespace." },
  { moduleKey: "consent",        namespace: "consent",    bindingKind: "owner",    grantReason: "Consent namespace." },
];

// Transitive deps helper (used by the usage rule).
export function transitiveDeps(
  moduleKey: string,
  modules: { key: string; dependsOn: string[] }[],
): string[] {
  const out = new Set<string>();
  const stack = [moduleKey];
  while (stack.length) {
    const k = stack.pop()!;
    const m = modules.find((x) => x.key === k);
    if (!m) continue;
    for (const d of m.dependsOn) {
      if (!out.has(d)) { out.add(d); stack.push(d); }
    }
  }
  return Array.from(out);
}
