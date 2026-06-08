// B-2.2 — Dynamic Field Registry runtime helpers.
// Mock-store typed shapes + in-memory permission cache + materialized projection
// hook (preparation only; actual generation deferred to B-3).
import type {
  FieldDataType, FieldStatus, FieldPermission, FieldPermissionSubject,
  FieldTaxonomyBindingKind, FieldEntityType,
} from "@/db/schema/registry/fields";

export type MockFieldDefinition = {
  id: string;
  tenantKey: string;
  namespace: string;
  key: string;
  ownerModule: string;
  dataType: FieldDataType;
  isMultivalue: boolean;
  isRequiredDefault: boolean;
  status: FieldStatus;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type FieldSchema = {
  min?: number;
  max?: number;
  regex?: string;
  enumMembers?: string[];
  /** Cross-entity reference (B-2.2 decision #1). tenant-aware + permission-checked at read. */
  reference?: { entityType: FieldEntityType };
  ui?: { widget?: string; hint?: string };
};

export type MockFieldVersion = {
  id: string;
  fieldId: string;
  versionNo: number;
  schema: FieldSchema;
  defaultValue: unknown;
  changeReason: string | null;
  createdBy: string | null;
  createdAt: string;
  isCurrent: boolean;
};

export type MockFieldTranslation = {
  id: string;
  fieldVersionId: string;
  locale: string;
  label: string;
  help?: string;
  placeholder?: string;
  enumLabels?: Record<string, string>;
};

export type MockFieldTaxonomyBinding = {
  id: string;
  fieldId: string;
  taxonomyNodeId: string;
  bindingKind: FieldTaxonomyBindingKind;
};

export type MockFieldPermission = {
  id: string;
  fieldId: string;
  tenantKey: string;
  subjectKind: FieldPermissionSubject;
  subjectId: string;
  permission: FieldPermission;
  effect: "allow" | "deny";
};

export type MockFieldEntityBinding = {
  id: string;
  fieldId: string;
  entityType: string;
  isRequired: boolean;
  displayOrder: number;
  groupKey: string | null;
};

export type MockFieldValue = {
  id: string;
  tenantKey: string;
  entityType: string;
  entityId: string;
  fieldId: string;
  fieldVersionId: string;
  position: number | null;
  valueString: string | null;
  valueNumber: number | null;
  valueBool: boolean | null;
  valueDatetime: string | null;
  valueJson: unknown;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type MockFieldValueHistory = {
  id: string;
  valueId: string;
  previousSnapshot: unknown;
  changedBy: string | null;
  changedAt: string;
  changeReason: string | null;
  auditEventId: string | null;
};

// Fallback per B-2 decision #4 — preserves the dummy translation format.
export function fieldLabel(
  translations: MockFieldTranslation[],
  versionId: string,
  locale: string,
  fallbackKey: string,
): string {
  const exact = translations.find((t) => t.fieldVersionId === versionId && t.locale === locale);
  if (exact) return exact.label;
  return `[${locale}] ${fallbackKey}`;
}

// ---------------------------------------------------------------------------
// Lifecycle transitions — `active → hidden → disabled → deprecated → archived`.
// Reverse hops require admin + change_reason. `archived` is terminal when any
// field_values row exists for the field.
// ---------------------------------------------------------------------------
const FORWARD: Record<FieldStatus, FieldStatus[]> = {
  active: ["hidden", "deprecated"],
  hidden: ["disabled", "deprecated", "active"],
  disabled: ["deprecated", "hidden"],
  deprecated: ["archived"],
  archived: [],
};
export function canTransition(from: FieldStatus, to: FieldStatus): boolean {
  return FORWARD[from]?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// Permission cache — simple in-memory memo (B-2.2 decision #4). Invalidated on
// audit events tagged `field.permission.*` / `field.role.*`. No Redis, no
// cluster, no distributed cache — that's explicitly out of scope.
// ---------------------------------------------------------------------------
type PermissionCacheKey = string;
const permCache = new Map<PermissionCacheKey, FieldPermission[]>();

function permKey(fieldId: string, subjectKind: FieldPermissionSubject, subjectId: string): PermissionCacheKey {
  return `${fieldId}|${subjectKind}|${subjectId}`;
}

export function resolveFieldPermissions(
  grants: MockFieldPermission[],
  fieldId: string,
  subjectKind: FieldPermissionSubject,
  subjectId: string,
): FieldPermission[] {
  const k = permKey(fieldId, subjectKind, subjectId);
  const cached = permCache.get(k);
  if (cached) return cached;
  const allowed = new Set<FieldPermission>();
  const denied = new Set<FieldPermission>();
  for (const g of grants) {
    if (g.fieldId !== fieldId || g.subjectKind !== subjectKind || g.subjectId !== subjectId) continue;
    (g.effect === "deny" ? denied : allowed).add(g.permission);
  }
  // deny > allow
  for (const d of denied) allowed.delete(d);
  const result = Array.from(allowed);
  permCache.set(k, result);
  return result;
}

export function invalidatePermissionCache(fieldId?: string) {
  if (!fieldId) { permCache.clear(); return; }
  for (const k of Array.from(permCache.keys())) {
    if (k.startsWith(`${fieldId}|`)) permCache.delete(k);
  }
}

// ---------------------------------------------------------------------------
// Materialized projection — B-2.2 decision #2: PREPARATION ONLY. The interface
// + registry + hook are defined here; physical flat tables (e.g.
// `profile_vehicle_flat`) are generated in B-3 or later.
// ---------------------------------------------------------------------------
export type MaterializedProjection<TEntity extends string = string> = {
  entityType: TEntity;
  tableName: string;          // logical name of the future flat table
  description: string;
  /** Reserved for B-3: produce a row from values; not invoked yet. */
  build?: (entityId: string, values: MockFieldValue[]) => Record<string, unknown>;
};

const projectionRegistry = new Map<string, MaterializedProjection>();
export function registerProjection(p: MaterializedProjection): void {
  projectionRegistry.set(p.entityType, p);
}
export function listProjections(): MaterializedProjection[] {
  return Array.from(projectionRegistry.values());
}
export function getProjection(entityType: string): MaterializedProjection | undefined {
  return projectionRegistry.get(entityType);
}

// Seed registry — interface presence only; no actual flattening runs.
registerProjection({ entityType: "profile.vehicle", tableName: "profile_vehicle_flat", description: "Reserved for B-3." });
registerProjection({ entityType: "profile.user", tableName: "profile_user_flat", description: "Reserved for B-3." });
