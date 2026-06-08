// B-2.3 — BBS seed module catalogue.
// Registry-level seed only: no business logic. Each entry describes the module's
// place in the BBS roadmap, its dependencies and its lifecycle defaults. UI text
// is rendered via i18n keys ("modules.catalog.<key>.name" / ".description").

import type { ModuleState, ModuleVisibility } from "@/db/schema/project/modules";

export type ModuleCategory =
  | "foundation"
  | "registry"
  | "profile"
  | "portal"
  | "platform"
  | "compliance";

export type RoadmapPhase = "B-1" | "B-2" | "B-3" | "B-4" | "B-5";

export type BbsSeedModule = {
  key: string;
  category: ModuleCategory;
  state: ModuleState;
  visibility: ModuleVisibility;
  roadmapPhase: RoadmapPhase;
  dependsOn: string[];
};

// Order matters only for display: foundation → registry → profile → portal → platform → compliance.
export const BBS_SEED_MODULES: BbsSeedModule[] = [
  // --- B-1 foundation (kept in_dev — the "active four") -------------------
  { key: "identity",      category: "foundation", state: "in_dev",  visibility: "internal", roadmapPhase: "B-1", dependsOn: [] },
  { key: "audit",         category: "foundation", state: "in_dev",  visibility: "internal", roadmapPhase: "B-1", dependsOn: [] },
  { key: "project",       category: "foundation", state: "in_dev",  visibility: "internal", roadmapPhase: "B-1", dependsOn: ["identity", "audit"] },
  { key: "rbac",          category: "foundation", state: "in_dev",  visibility: "internal", roadmapPhase: "B-1", dependsOn: ["identity", "audit"] },

  // --- B-2 registries -----------------------------------------------------
  { key: "taxonomy",      category: "registry",   state: "planned", visibility: "internal", roadmapPhase: "B-2", dependsOn: ["identity", "audit"] },
  { key: "federation",    category: "registry",   state: "planned", visibility: "internal", roadmapPhase: "B-2", dependsOn: ["identity", "audit"] },
  { key: "fields",        category: "registry",   state: "planned", visibility: "internal", roadmapPhase: "B-2", dependsOn: ["identity", "audit", "taxonomy"] },
  { key: "ai",            category: "registry",   state: "planned", visibility: "internal", roadmapPhase: "B-2", dependsOn: ["identity", "audit"] },
  { key: "knowledge",     category: "registry",   state: "planned", visibility: "internal", roadmapPhase: "B-2", dependsOn: ["project"] },
  { key: "translation",   category: "registry",   state: "planned", visibility: "internal", roadmapPhase: "B-2", dependsOn: ["ai", "fields"] },

  // --- B-3 Universal Profile Engine + profile types -----------------------
  { key: "profile_engine",category: "profile",    state: "planned", visibility: "internal", roadmapPhase: "B-3", dependsOn: ["fields", "taxonomy", "rbac"] },
  { key: "profile_user",  category: "profile",    state: "planned", visibility: "internal", roadmapPhase: "B-3", dependsOn: ["profile_engine", "identity"] },
  { key: "profile_vehicle",category:"profile",    state: "planned", visibility: "internal", roadmapPhase: "B-3", dependsOn: ["profile_engine"] },
  { key: "profile_club",  category: "profile",    state: "planned", visibility: "internal", roadmapPhase: "B-3", dependsOn: ["profile_engine"] },
  { key: "profile_event", category: "profile",    state: "planned", visibility: "internal", roadmapPhase: "B-3", dependsOn: ["profile_engine"] },
  { key: "profile_business",category:"profile",   state: "planned", visibility: "internal", roadmapPhase: "B-3", dependsOn: ["profile_engine"] },
  { key: "profile_workshop",category:"profile",   state: "planned", visibility: "internal", roadmapPhase: "B-3", dependsOn: ["profile_engine", "profile_business"] },
  { key: "profile_shop",  category: "profile",    state: "planned", visibility: "internal", roadmapPhase: "B-3", dependsOn: ["profile_engine", "profile_business"] },
  { key: "profile_artist",category: "profile",    state: "planned", visibility: "internal", roadmapPhase: "B-3", dependsOn: ["profile_engine"] },
  { key: "profile_performer",category:"profile",  state: "planned", visibility: "internal", roadmapPhase: "B-3", dependsOn: ["profile_engine", "profile_artist"] },

  // --- B-4 platform services ---------------------------------------------
  { key: "files",         category: "platform",   state: "planned", visibility: "internal", roadmapPhase: "B-4", dependsOn: ["identity", "rbac"] },
  { key: "notifications", category: "platform",   state: "planned", visibility: "internal", roadmapPhase: "B-4", dependsOn: ["identity"] },
  { key: "search",        category: "platform",   state: "planned", visibility: "internal", roadmapPhase: "B-4", dependsOn: ["profile_engine", "fields"] },
  { key: "moderation",    category: "platform",   state: "planned", visibility: "internal", roadmapPhase: "B-4", dependsOn: ["identity", "audit"] },
  { key: "analytics",     category: "platform",   state: "planned", visibility: "internal", roadmapPhase: "B-4", dependsOn: ["audit"] },
  { key: "billing",       category: "platform",   state: "planned", visibility: "internal", roadmapPhase: "B-4", dependsOn: ["identity", "profile_business"] },

  // --- BBS portals (long-term) -------------------------------------------
  { key: "support",       category: "portal",     state: "planned", visibility: "hidden",   roadmapPhase: "B-4", dependsOn: ["identity", "notifications"] },
  { key: "travel",        category: "portal",     state: "planned", visibility: "hidden",   roadmapPhase: "B-4", dependsOn: ["profile_engine", "profile_event"] },
  { key: "media",         category: "portal",     state: "planned", visibility: "hidden",   roadmapPhase: "B-4", dependsOn: ["files", "profile_engine"] },
  { key: "garage",        category: "portal",     state: "planned", visibility: "hidden",   roadmapPhase: "B-4", dependsOn: ["profile_vehicle", "profile_workshop"] },

  // --- B-5 compliance / governance ---------------------------------------
  { key: "gdpr",          category: "compliance", state: "planned", visibility: "internal", roadmapPhase: "B-5", dependsOn: ["identity", "audit"] },
  { key: "consent",       category: "compliance", state: "planned", visibility: "internal", roadmapPhase: "B-5", dependsOn: ["identity", "gdpr"] },
];

export const MODULE_CATEGORIES: ModuleCategory[] = [
  "foundation", "registry", "profile", "platform", "portal", "compliance",
];
