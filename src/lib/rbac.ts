// Function-level permission resolver.
// Order: superadmin → user deny → user allow → role permission → default deny.
import type { MockUser, MockPermissionOverride, MockRolePermission } from "./mock-store";

export type PermissionEffect = "allow" | "deny";

export function hasPermission(
  user: MockUser | null,
  permissionKey: string,
  ctx: {
    userRoles: string[];
    rolePermissions: MockRolePermission[];
    userOverrides: MockPermissionOverride[];
  },
): boolean {
  if (!user) return false;
  if (user.isGlobalSuperadmin) return true;

  const userOverride = ctx.userOverrides.find(
    (o) => o.userId === user.id && o.permissionKey === permissionKey,
  );
  if (userOverride?.effect === "deny") return false;
  if (userOverride?.effect === "allow") return true;

  const roleMatch = ctx.rolePermissions.find(
    (rp) => ctx.userRoles.includes(rp.roleKey) && rp.permissionKey === permissionKey,
  );
  if (roleMatch?.effect === "deny") return false;
  if (roleMatch?.effect === "allow") return true;

  return false;
}

export function filterInvisible<T extends { isInvisible?: boolean }>(
  rows: T[],
  viewer: MockUser | null,
): T[] {
  if (viewer?.isGlobalSuperadmin) return rows;
  return rows.filter((r) => !r.isInvisible);
}
