# Proposal

## Why

Content Studio needs a standalone foundation for managing content across customer sites without mixing tenant data. A shared content contract will let repositories register their schemas and initial content while giving authenticated editors navigation specific to their selected site.

## What Changes

- Introduce PostgreSQL storage for sites, schema definitions, and draft/published content, with explicit Auth0 organization ownership and tenant integrity constraints.
- Add Auth0 organization switching and an accessible sidebar with a site switcher and schema-driven collection navigation, using the ATM Content Studio `/admin` in `atmenterprise/jazzsinghpersonaltrainer` as the visual reference.
- Configure a portable Jaz Singh onboarding example with five collections: programmes, programme_pages, testimonials, about (singleton), and specialistareas; preserve the source field names, required fields, and length limits.
- Introduce authenticated `POST /api/v1/onboard` with a versioned, strict Zod content-spec contract and transactional, repeatable site/schema upserts and initial content seeding.
- Establish a Next.js App Router, TypeScript, Tailwind, Neon, and Drizzle application foundation during implementation.
- Exclude content editing/publishing workflows, repository synchronization, webhook delivery, billing, access-request approvals, notification emails, and administration of Auth0 organizations from this change.

## Capabilities

### New Capabilities

- `database`: Tenant-owned content registry, ingestion integrity, and authorized discovery of sites and collection schemas for workspace navigation.

### Modified Capabilities

None. No existing specifications exist.

## Impact

The repository currently contains OpenSpec setup only. Implementation will add the application, database migrations, Auth0 integration, environment configuration, onboarding API, and integration tests. Neon and Auth0 require deployment configuration; no existing APIs or persisted data need migration. This proposal creates planning documents only.

The inspected reference is the sibling `../jazzsinghpersonaltrainer` repository (two z’s), especially `src/admin/Admin.jsx`, `admin.css`, `Brand.jsx`, `ProjectSelect.jsx`, and `server/content.js`. Reuse its visual language and content model while retaining this application’s Auth0 organization authorization. Its Neon Auth, legacy tables, and working content editors are reference context, not dependencies or migration targets.
