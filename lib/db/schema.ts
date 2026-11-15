import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, jsonb, boolean, unique, foreignKey, index, check } from "drizzle-orm/pg-core";

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(),
  domain: text("domain").notNull(), repoUrl: text("repo_url").notNull(),
  webhookUrl: text("webhook_url"), apiKey: text("api_key").notNull(),
  auth0OrgId: text("auth0_org_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [unique("sites_org_domain_unique").on(table.auth0OrgId, table.domain), index("sites_org_idx").on(table.auth0OrgId)]);

export const schemas = pgTable("schemas", {
  id: uuid("id").primaryKey().defaultRandom(), siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "restrict" }),
  collectionKey: text("collection_key").notNull(), label: text("label").notNull(),
  isSingleton: boolean("is_singleton").notNull().default(false),
  specDefinition: jsonb("spec_definition").$type<{ fields: unknown[] }>().notNull(),
}, table => [unique("schemas_site_key_unique").on(table.siteId, table.collectionKey), unique("schemas_site_id_unique").on(table.siteId, table.id), index("schemas_site_idx").on(table.siteId)]);

export const contentEntries = pgTable("content_entries", {
  id: uuid("id").primaryKey().defaultRandom(), siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "restrict" }),
  schemaId: uuid("schema_id").notNull(), slug: text("slug").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(), status: text("status").$type<"draft" | "published">().notNull().default("draft"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [foreignKey({ name: "entries_site_schema_fk", columns: [table.siteId, table.schemaId], foreignColumns: [schemas.siteId, schemas.id] }).onDelete("restrict"), unique("entries_schema_slug_unique").on(table.schemaId, table.slug), check("entries_status_check", sql`${table.status} IN ('draft', 'published')`), index("entries_site_schema_idx").on(table.siteId, table.schemaId)]);
