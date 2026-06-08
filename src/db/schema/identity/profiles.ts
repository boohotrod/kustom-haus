import { mysqlTable, varchar, json, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

// Universal Profile Engine — 10 profile types prepared for the BBS ecosystem.
export const PROFILE_TYPES = [
  "developer", "member", "business", "club", "event",
  "vehicle", "workshop", "shop", "artist", "performer",
] as const;
export type ProfileType = (typeof PROFILE_TYPES)[number];

export const profiles = mysqlTable("profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  profileType: mysqlEnum("profile_type", PROFILE_TYPES).notNull(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  bio: varchar("bio", { length: 1024 }),
  // Per-profile-type fields. Will migrate to Dynamic Field Registry in B-2+.
  extensions: json("extensions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
