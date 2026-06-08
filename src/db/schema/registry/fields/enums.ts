// B-2.2 Dynamic Field Registry — shared enums.
// Lifecycle is monotonic toward `archived`; reverse transitions require admin + change_reason.
export const FIELD_STATUSES = ["active", "hidden", "disabled", "deprecated", "archived"] as const;
export type FieldStatus = (typeof FIELD_STATUSES)[number];

export const FIELD_DATA_TYPES = [
  "string", "text", "integer", "decimal", "boolean",
  "date", "datetime", "enum", "reference", "json", "media", "geo",
] as const;
export type FieldDataType = (typeof FIELD_DATA_TYPES)[number];

export const FIELD_PERMISSIONS = ["read", "write", "admin"] as const;
export type FieldPermission = (typeof FIELD_PERMISSIONS)[number];

export const FIELD_PERMISSION_SUBJECTS = ["role", "group", "user", "federation_peer"] as const;
export type FieldPermissionSubject = (typeof FIELD_PERMISSION_SUBJECTS)[number];

export const FIELD_TAXONOMY_BINDING_KINDS = ["scope", "filter", "classifier"] as const;
export type FieldTaxonomyBindingKind = (typeof FIELD_TAXONOMY_BINDING_KINDS)[number];

// Profile-agnostic — Universal Profile Engine entity types DFR can bind to.
export const FIELD_ENTITY_TYPES = [
  "profile.user", "profile.vehicle", "profile.club", "profile.event",
  "profile.business", "profile.workshop", "profile.shop",
  "profile.artist", "profile.performer",
] as const;
export type FieldEntityType = (typeof FIELD_ENTITY_TYPES)[number];
