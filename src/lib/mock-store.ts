// In-memory mock store for preview mode. Production reads from MySQL via Drizzle.
// Every screen reads/writes through this store so all UI features are wired end-to-end.
import { appendAudit, type AuditEvent } from "./audit";
import type { ProfileType } from "@/db/schema/identity/profiles";
import type { ModuleState, ModuleVisibility } from "@/db/schema/project/modules";
import type { MemoryScope } from "@/db/schema/project/memory";

export type MockUser = {
  id: string;
  username: string;
  email: string;
  status: "active" | "invited" | "disabled";
  locale: string;
  isGlobalSuperadmin: boolean;
  isInvisible: boolean;
  profileType: ProfileType;
  displayName: string;
  slug: string;
  bio?: string;
  extensions?: Record<string, unknown>;
  roles: string[];
};

export type MockRole = { key: string; label: string; description: string };
export type MockPermission = { key: string; module: string; function: string; action: string; description: string };
export type MockRolePermission = { roleKey: string; permissionKey: string; effect: "allow" | "deny" };
export type MockPermissionOverride = { userId: string; permissionKey: string; effect: "allow" | "deny" };
export type MockMemory = { id: string; scope: MemoryScope; title: string; body: string; updatedAt: string };
export type MockDecision = { id: string; code: string; title: string; status: string; relatedModules: string[]; createdAt: string };
export type MockModule = { id: string; key: string; name: string; state: ModuleState; visibility: ModuleVisibility };
export type MockTaxonomy = { id: string; scope: string; key: string; label: string };
export type MockPeer = { id: string; peerKey: string; baseUrl: string; status: "pending" | "active" | "suspended" };
export type MockFederationUser = {
  id: string;
  userId: string;
  peerId: string;
  bbsFederationUserId: string;
  sourceSystemId: string;
  sourceTenantId: string;
  sourceRecordId: string;
  dataOrigin: "local" | "imported" | "synced" | "external";
  syncStatus: "local" | "imported" | "synced" | "pending" | "conflict" | "archived_remote" | "disconnected";
  syncCreatedAt: string;
  syncUpdatedAt: string;
};
export type MockAiProvider = { id: string; key: string; kind: string; status: "dummy" | "active" | "disabled" };
export type MockKnowledgeNode = { id: string; kind: string; title: string };

function uid() { return crypto.randomUUID(); }

const superId = uid();
const devId = uid();
const memberId = uid();

export const store = {
  currentUserId: devId as string | null,

  users: [
    { id: superId, username: "root", email: "root@bbs.local", status: "active", locale: "hu", isGlobalSuperadmin: true, isInvisible: true, profileType: "developer", displayName: "Root", slug: "root", roles: ["superadmin"] },
    { id: devId, username: "demo", email: "demo@bbs.local", status: "active", locale: "hu", isGlobalSuperadmin: false, isInvisible: false, profileType: "developer", displayName: "Demo Developer", slug: "demo", bio: "Builder demo account.", roles: ["builder_admin"] },
    { id: memberId, username: "ferenc", email: "ferenc@bbs.local", status: "active", locale: "hu", isGlobalSuperadmin: false, isInvisible: false, profileType: "member", displayName: "Ferenc Komlodi", slug: "ferenc", bio: "Founder & system owner.", roles: ["builder_admin"] },
  ] as MockUser[],

  roles: [
    { key: "superadmin", label: "Super Admin", description: "Global, invisible, single instance." },
    { key: "builder_admin", label: "Builder Admin", description: "Full builder access." },
    { key: "contributor", label: "Contributor", description: "Read + propose decisions/memory." },
    { key: "viewer", label: "Viewer", description: "Read-only." },
  ] as MockRole[],

  permissions: [
    { key: "project.memory.read", module: "project", function: "memory", action: "read", description: "Read project memory" },
    { key: "project.memory.write", module: "project", function: "memory", action: "write", description: "Create/update project memory" },
    { key: "project.decisions.read", module: "project", function: "decisions", action: "read", description: "Read ADRs" },
    { key: "project.decisions.write", module: "project", function: "decisions", action: "write", description: "Create ADRs" },
    { key: "project.modules.read", module: "project", function: "modules", action: "read", description: "Read module list" },
    { key: "project.modules.transition", module: "project", function: "modules", action: "transition", description: "Change module lifecycle state" },
    { key: "identity.users.read", module: "identity", function: "users", action: "read", description: "List identities (invisible filtered)" },
    { key: "identity.users.invite", module: "identity", function: "users", action: "invite", description: "Issue invitations" },
    { key: "audit.events.read", module: "audit", function: "events", action: "read", description: "Read audit log" },
    { key: "registry.taxonomy.read", module: "registry", function: "taxonomy", action: "read", description: "Read taxonomies" },
    { key: "registry.federation.read", module: "registry", function: "federation", action: "read", description: "Read federation peers" },
    { key: "registry.ai.read", module: "registry", function: "ai", action: "read", description: "Read AI registry" },
    { key: "registry.knowledge.read", module: "registry", function: "knowledge", action: "read", description: "Read knowledge map" },
  ] as MockPermission[],

  rolePermissions: [] as MockRolePermission[],
  userOverrides: [] as MockPermissionOverride[],

  memory: [
    { id: uid(), scope: "core", title: "Global Identity Registry", body: "Builder users = global identity for the BBS ecosystem. No user_link.", updatedAt: new Date().toISOString() },
    { id: uid(), scope: "core", title: "SuperAdmin invisibility", body: "Exactly one global SuperAdmin. Invisible on every public surface.", updatedAt: new Date().toISOString() },
    { id: uid(), scope: "technical", title: "Hash-chained audit", body: "audit_events is append-only with sha256 hash chain.", updatedAt: new Date().toISOString() },
    { id: uid(), scope: "design", title: "Hot Rod redesign compatible", body: "v0.1 UI is technical placeholder; future 1950s Speed Shop redesign must not be blocked.", updatedAt: new Date().toISOString() },
    { id: uid(), scope: "legal", title: "GDPR engine", body: "B-2+: audit_redactions + export/delete workflows.", updatedAt: new Date().toISOString() },
  ] as MockMemory[],

  decisions: [
    { id: uid(), code: "ADR-001", title: "Hybrid (Option C) scope for B-0/B-1", status: "accepted", relatedModules: ["identity", "audit", "project"], createdAt: new Date().toISOString() },
    { id: uid(), code: "ADR-002", title: "Single Global Identity Registry", status: "accepted", relatedModules: ["identity"], createdAt: new Date().toISOString() },
    { id: uid(), code: "ADR-003", title: "Function-level permissions from day 1", status: "accepted", relatedModules: ["identity", "audit"], createdAt: new Date().toISOString() },
    { id: uid(), code: "ADR-004", title: "Dummy AI provider in v0.1", status: "accepted", relatedModules: ["ai"], createdAt: new Date().toISOString() },
  ] as MockDecision[],

  modules: [
    { id: uid(), key: "identity", name: "Identity & RBAC", state: "in_dev", visibility: "internal" },
    { id: uid(), key: "audit", name: "Immutable audit", state: "in_dev", visibility: "internal" },
    { id: uid(), key: "project", name: "Project memory & ADR", state: "in_dev", visibility: "internal" },
    { id: uid(), key: "taxonomy", name: "Universal Taxonomy Engine", state: "planned", visibility: "internal" },
    { id: uid(), key: "federation", name: "Federation Registry", state: "planned", visibility: "internal" },
    { id: uid(), key: "ai", name: "AI Registry", state: "planned", visibility: "internal" },
    { id: uid(), key: "knowledge", name: "Knowledge Map", state: "planned", visibility: "internal" },
    { id: uid(), key: "support", name: "Support (BBS portal)", state: "planned", visibility: "hidden" },
    { id: uid(), key: "travel", name: "Travel (BBS portal)", state: "planned", visibility: "hidden" },
    { id: uid(), key: "media", name: "Media (BBS portal)", state: "planned", visibility: "hidden" },
    { id: uid(), key: "garage", name: "Garage (BBS portal)", state: "planned", visibility: "hidden" },
  ] as MockModule[],

  taxonomies: [
    { id: uid(), scope: "country", key: "HU", label: "Hungary" },
    { id: uid(), scope: "country", key: "NO", label: "Norway" },
    { id: uid(), scope: "vehicle_type", key: "hot_rod", label: "Hot Rod" },
    { id: uid(), scope: "vehicle_type", key: "kustom", label: "Kustom" },
  ] as MockTaxonomy[],

  peers: [] as MockPeer[],
  aiProviders: [
    { id: uid(), key: "dummy_llm", kind: "llm", status: "dummy" },
    { id: uid(), key: "dummy_translate", kind: "translate", status: "dummy" },
  ] as MockAiProvider[],
  knowledgeNodes: [
    { id: uid(), kind: "decision", title: "ADR-001 Hybrid scope" },
    { id: uid(), kind: "module", title: "Identity & RBAC" },
    { id: uid(), kind: "requirement", title: "Constitutional Rule: no data duplication" },
  ] as MockKnowledgeNode[],

  audit: [] as AuditEvent[],
};

// Seed role-permission defaults.
for (const p of store.permissions) {
  store.rolePermissions.push({ roleKey: "builder_admin", permissionKey: p.key, effect: "allow" });
  if (p.action === "read") {
    store.rolePermissions.push({ roleKey: "contributor", permissionKey: p.key, effect: "allow" });
    store.rolePermissions.push({ roleKey: "viewer", permissionKey: p.key, effect: "allow" });
  } else if (p.key === "project.memory.write" || p.key === "project.decisions.write") {
    store.rolePermissions.push({ roleKey: "contributor", permissionKey: p.key, effect: "allow" });
  }
}

// Seed audit chain.
appendAudit(store.audit, { actorId: null, action: "system.bootstrap", targetType: "project", targetId: "bbs-builder", payload: { version: "v0.2", scope: "B-0/B-1" } });
appendAudit(store.audit, { actorId: superId, action: "identity.user.created", targetType: "user", targetId: devId, payload: { username: "demo" } });
appendAudit(store.audit, { actorId: superId, action: "identity.user.created", targetType: "user", targetId: memberId, payload: { username: "ferenc" } });
appendAudit(store.audit, { actorId: devId, action: "project.module.created", targetType: "module", targetId: "identity", payload: { state: "in_dev" } });

export function currentUser(): MockUser | null {
  return store.users.find((u) => u.id === store.currentUserId) ?? null;
}

export function login(username: string, password: string): MockUser | null {
  // Preview-mode credentials. Production uses scrypt/argon2id-verified hashes.
  if (password !== "demo") return null;
  const u = store.users.find((u) => u.username === username && !u.isInvisible);
  if (!u) return null;
  store.currentUserId = u.id;
  appendAudit(store.audit, { actorId: u.id, action: "auth.login", targetType: "user", targetId: u.id, payload: null });
  return u;
}

export function logout() {
  const u = currentUser();
  if (u) appendAudit(store.audit, { actorId: u.id, action: "auth.logout", targetType: "user", targetId: u.id, payload: null });
  store.currentUserId = null;
}
