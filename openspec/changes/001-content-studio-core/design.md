# Design

## Context

The repository contains OpenSpec configuration and no application, package manifest, migrations, tests, or existing capability specs. The existing sibling `../jazzsinghpersonaltrainer` (`https://github.com/atmenterprise/jazzsinghpersonaltrainer`) supplies a source-level `/admin` reference, not an application being migrated. This is a greenfield design; see proposal.md for motivation and specs/database/spec.md for the behavior contract. Choices below establish the initial v1 contract rather than claim compatibility with an existing content-spec format.

## Goals / Non-Goals

**Goals:** Keep browser credentials away from PostgreSQL; use one server authorization boundary; make ingestion transactional and safe to retry; keep collection navigation derived from persisted schemas.

**Non-Goals:** Dynamic form rendering, entry CRUD screens, publication side effects, organization provisioning, and destructive synchronization. Collection links lead to a labeled collection landing view; editing is future work.

## Decisions

### Application and persistence stack

Use Next.js App Router with React, TypeScript, Tailwind, server route handlers, Neon PostgreSQL, and Drizzle migrations. This keeps the UI and API in one deployable application. Vite would require a separate API service; Prisma is viable but Drizzle keeps compound constraints and PostgreSQL integrity rules explicit. Pin supported dependency versions during implementation; this document does not prescribe unverified version numbers.

### Reference implementation and adaptation boundary

Inspected reference files: `src/admin/Admin.jsx` (workspace, navigation, profile menu), `ProjectSelect.jsx` (selection and focus behavior), `Brand.jsx` (ATM wordmark), `admin.css` (tokens and responsive shell), `server/content.js` (resource definitions and validation), `scripts/setup-db.js` (seed mapping), `db/schema.sql`, `docs/admin.md`, and `tests/projects.test.js` (project isolation and image handling).

The reference runs a Vite public website beside a Next.js admin, uses Neon Auth and explicit project memberships, and stores fixed resources in `admin_content`. This standalone application keeps Next.js, Drizzle, Auth0 organizations, UUID sites, and schema-driven navigation. No legacy memberships or user IDs are imported. Reference access approval, SMTP, account-editing screens, optimistic entry versions, and public-site API integration are outside this change. Retaining the standalone foundation avoids coupling every tenant to a trainer-specific frontend or resource enum.

### Auth0 organizations define tenants; sites define workspace selections

One Auth0 organization owns many sites. Add required `sites.auth0_org_id` text to the requested model; a site ID alone cannot establish tenant ownership. Use Auth0 hosted organization selection and reauthentication to change active organization, avoiding a local organization-membership database and Management API integration.

Server sessions protect UI reads. The onboarding endpoint accepts an Auth0 bearer access token verified for issuer, audience, signature, expiry, organization claim, and `content:onboard` permission. Missing credentials return 401; missing organization or permission returns 403. Site queries include the verified organization predicate; nested reads join back to the authorized site. Do not trust organization IDs in the request body. The site API key is reserved for future site integrations and does not authenticate this initial endpoint, avoiding bootstrap-key ambiguity. Browser access tokens and database credentials are not exposed to the client.

### Relational model and integrity

- `sites`: UUID primary key; non-null name, normalized domain, repo_url, api_key (hash), auth0_org_id, created_at (timestamptz default now); nullable webhook_url. Unique `(auth0_org_id, domain)`.
- `schemas`: UUID primary key; non-null site_id FK, collection_key, label, is_singleton default false, spec_definition JSONB; unique `(site_id, collection_key)` and `(site_id, id)`.
- `content_entries`: UUID primary key; non-null site_id FK, schema_id, slug, data JSONB, status default draft, updated_at timestamptz default now; status check limited to draft/published; compound FK `(site_id, schema_id)` to schemas `(site_id, id)`; unique `(schema_id, slug)`.

Index site ownership, schemas by site, and entries by `(site_id, schema_id)` for discovery. Use restrictive parent deletion; deletion is outside this change. A database trigger locks the parent schema row before entry writes and rejects a second singleton entry; schema mode changes take the same lock and reject multi-entry collections becoming singleton. This protects concurrency across direct writes as well as ingestion. Entry updates set updated_at server-side; seed conflict no-ops preserve it. A singleton's existing entry is preserved regardless of an incoming seed's slug.

Generate a cryptographically random 256-bit site key on creation, persist a SHA-256 hash in api_key, and return the plaintext only in the creation response. High entropy permits this hash without password-style stretching. Never return hashes in site listing DTOs. Ordinary updates preserve the key; lost-key rotation is deferred.

### Version 1 content-spec contract

Use strict Zod objects at every structural level, with this envelope (illustrative values):

```json
{
  "version": 1,
  "site": {
    "name": "Example",
    "domain": "example.com",
    "repo_url": "https://github.com/example/site",
    "webhook_url": null
  },
  "collections": [
    {
      "collection_key": "pages",
      "label": "Pages",
      "is_singleton": false,
      "spec_definition": {
        "fields": [
          {
            "key": "title",
            "label": "Title",
            "type": "string",
            "required": true,
            "validation": {"minLength": 1, "maxLength": 200},
            "widget": "text"
          }
        ]
      },
      "entries": [
        {"slug": "home", "data": {"title": "Home"}, "status": "draft"}
      ]
    }
  ]
}
```

All illustrated structural properties are required except field `validation` (defaults to `{}`) and entry `status` (defaults to draft). Empty collections, fields, and entries arrays are allowed. Site name and labels are trimmed nonempty strings up to 200 characters. Domain is a hostname only, lowercased with a trailing dot removed; reject schemes, ports, paths, and invalid hostnames. repo_url and non-null webhook_url must be HTTPS URLs. No URL is fetched in this change. Collection and field keys match `[a-z][a-z0-9_]{0,63}`; slugs match `[a-z0-9]+(?:-[a-z0-9]+)*` and are at most 200 characters. Field keys are unique in a definition.

V1 field types are string, number, boolean, and date (ISO YYYY-MM-DD calendar date). Allowed widgets: string uses text or textarea; number uses number; boolean uses checkbox; date uses date. All field properties key/label/type/required/widget are required. Validation accepts minLength/maxLength for strings and min/max for numbers only; bounds must be ordered and string lengths nonnegative integers. No arbitrary regex or executable validation is accepted. Seed data accepts only declared keys; required fields must be present and non-null; optional fields may be omitted but not null. Values must match types and bounds. JSONB preserves definitions and data without accepting arbitrary structural properties in the contract.

Reject duplicate collection keys, field keys, entry slugs, or multiple singleton seeds. Cap request bodies at 1 MiB (413 when exceeded). This is a proposed initial contract; additional types and widget mappings require explicit future contract evolution.

### Jaz Singh onboarding configuration

Deliver a checked-in example content-spec fixture during implementation, derived from the source JSON and `server/content.js`, with exactly the five collections visible in the reference sidebar. This is an example that any authorized organization can onboard, not an automatic production tenant or a live database import. Do not modify the sibling repository or connect to its database. `images` and `settings` exist in the source registry but are excluded from this initial example because they are not standalone sections in the current sidebar.

| Collection key | Label | Singleton | Fields and maximum string lengths | Required fields |
| --- | --- | --- | --- | --- |
| `programmes` | Programmes & Services | No | name: 200; short_description: 10000; image_url: 2048; program_id: 100; page_url: 100 | All |
| `programme_pages` | Programme Pages | No | title: 200; page_url: 100; introduction: 10000; audience_title/included_title/results_title/investment_title: 200 each; audience_content/included_content/results_content/investment_content: 20000 each | title, page_url, introduction |
| `testimonials` | Testimonials | No | title: 500; author: 200; description: 30000; image/link: 2048 each; featured: boolean; focus: 200; headline: 500; summary/excerpt: 5000 each | title, author, description |
| `about` | About Me | Yes | title: 200; introduction: 5000; description: 30000; image_url: 2048; alt/cta_text: 500 each | title, introduction, description, image_url |
| `specialistareas` | Specialist Areas | No | name: 200; description: 5000; image_url: 2048 | All |

Map source text/title/name/description/story/author/slug/image/url fields to v1 `string`, using `text` for short labels, identifiers, and paths, and `textarea` for long prose. Map featured to boolean/checkbox. Preserve required flags and maximum lengths; trim seed strings and set required strings to minLength 1. Existing source URL/slug field semantics are not new v1 validator types: the fixture must contain valid source values, while the generic contract remains limited to the types and validation rules already defined above. Source editor read-only restrictions do not become new schema properties because editing is deferred.

Use `src/data/siteConfig.json` for name and hostname-normalized site URL, the reference GitHub remote for repo_url, and null webhook_url. The adapter normalizes the source HTTPS origin to a hostname before submission; the onboarding endpoint continues rejecting full URLs in `site.domain`. UUIDs remain database-generated; do not treat the legacy `jazboom` project ID as a site UUID or organization ID.

Use `programs.json`, `programmePages.json`, `about.json`, `specialistAreas.json`, and `testimonials.json` with `storyHighlights.json` for representative seeds. Flatten testimonial wrapper data, retaining featured and focus/headline/summary/excerpt; omit wrapper IDs from data. Map legacy IDs/source keys to stable contract-valid entry slugs, using `about` for the singleton; reject mapping collisions rather than silently replacing records. Include at least one seed per collection, document sample selection, and keep the fixture under 1 MiB. These are example draft seeds, not a complete production export or publication action.

Preserve HTTPS image URLs and relative `img/...` or root-relative asset strings in data without fetching or uploading them. Media preview is deferred with editing; any future preview must resolve relative paths against the selected site's HTTPS origin, never the Studio origin. No image assets need copying for ingestion.

### Atomic ingestion and response semantics

Authenticate, enforce body limit, parse JSON, then validate structural and seed contracts before opening a transaction. Upsert site by `(auth0_org_id, normalized domain)` and lock the site row to serialize onboarding for that site; the unique constraint also arbitrates simultaneous creation. Update submitted site metadata, preserving UUID, creation time, and API key hash.

For each collection, lock/upsert by `(site_id, collection_key)`. Validate all existing entries against the proposed definition and singleton mode before changing it; incompatible changes return 409. Insert missing seeds by schema/slug; preserve existing records entirely. For an already populated singleton, skip its seed. Do not delete omitted schemas or entries. Commit once all operations succeed; roll back on any failure. Retry bounded serialization/deadlock failures internally, then return a sanitized 500 if exhausted.

Return JSON `{site_id, schemas: [{id, collection_key}], created: {sites, schemas, entries}}`, plus `api_key` only when creating a site. Return 201 for site creation and 200 for an existing site. Validation failures return `{error: {code, message, issues: [{path, message}]}}`; other errors use the same error envelope without issues. Do not log payloads, bearer tokens, key material, database errors, or submitted content. Log request ID, result, and safe counts. An identical retry after a lost creation response does not reveal the original key.

### Server reads and workspace layout

Use server-side data access for authorized site and schema reads rather than adding a public read API. Implement `/sites/[siteId]/collections/[collectionKey]` as the collection landing route and a protected home route with the switcher. Site is URL state; reauthorize every route and do not accept client selection as proof of access. List sites by name/id and schemas by label/collection_key with deterministic ties. Display every registered schema, including singletons, with its label.

Use organization- and site-scoped cache keys or disable caching of tenant reads. Clear selection on organization changes, ignore stale in-flight responses, and show explicit loading, empty, and retry states. The top sidebar switcher has an accessible label, keyboard navigation, and visible focus. No-site users see an onboarding explanation; an empty-schema site shows an empty navigation message. Unauthorized selections return 404. Session expiry initiates login.

### ATM workspace presentation

Implement the reference visual language with Tailwind tokens: Plus Jakarta Sans with Inter/Arial/sans-serif fallbacks, ink `#1a1a1a`, muted text `#71717a`, yellow accent `#ffde59`, canvas `#fcfcfc`, white panels, and borders `#e4e4e7`. Use 8px control radii, 12px panel radii, generous whitespace, and dark text on pale yellow active navigation. Carry over ATM / Apps That Matter branding and the Content Studio wordmark from the existing vector reference; this needs no generated imagery.

Use a roughly 245px expanded desktop sidebar, accessible collapse/expand control, collection heading, and a main header with breadcrumbs and profile trigger. Put the Site Switcher at the sidebar top below branding and before collection navigation; the reference places its project switcher in the main header, but the original Studio requirement takes precedence. In collapsed mode, the switcher remains discoverable with an accessible name and the active site, and icon-only collection links retain labels/tooltips. On narrow screens, use a single-column shell with expandable navigation and no horizontal overflow.

Breadcrumbs use Home / selected site / active collection, derived from authorized records. The profile menu shows verified identity, a selected-site website link built from its hostname, organization switching, and sign-out. Omit New Project, account editing, and Access requests actions until those workflows exist; site creation is through onboarding. Menus close on Escape and outside interaction, and restore focus to their triggers. Profile content must not claim an administrator role unless established by verified permissions.

Retain flat, dynamically generated navigation and existing deterministic sorting. The reference's hardcoded Programmes submenu, record search, two-column editor, featured filters, previews, Save/Delete controls, and unsaved-change prompts describe later editor work. Current collection routes render a labeled landing panel using the same visual tokens; do not render nonfunctional editor controls. Avoid adding navigation grouping or editor metadata to the strict v1 contract solely to imitate trainer-specific UI.

## Risks / Trade-offs

- [Visual similarity mistaken for complete editor parity] → Document the shell-only scope and verify no editor or approval actions are presented in this phase.
- [Reference fixture becomes coupled to a sibling checkout] → Commit the portable example in this repository with provenance and mapping documentation; runtime and CI must not require the sibling repository.
- [Organization claim misconfiguration] → Document Auth0 audience, organization configuration, permission grants, and rejection tests before deployment.
- [Shared database queries omit scope] → Centralize authorized data access and test adversarial cross-organization IDs; compound FKs independently prevent mismatched entry ownership. PostgreSQL row-level security is deferred.
- [Schema evolution rejects existing data] → Return 409 without mutations; content migration tooling is outside this change.
- [Large existing collections slow definition validation] → Keep transactions bounded by request limits, index lookup paths, and measure onboarding duration; bulk migration is deferred.
- [One-time key response is lost] → Document that retries do not recover plaintext; key rotation requires future work.
- [Database-specific singleton trigger] → Include migration and direct/concurrent-write integration coverage.

## Migration Plan

1. Scaffold the application and document server-only Neon/Auth0 environment values and local setup.
2. Apply initial forward migrations to an empty Neon development branch; exercise constraints and transaction behavior against PostgreSQL.
3. Configure Auth0 organization-enabled login, callback/logout URLs, API audience, and onboarding permission; deploy to a preview environment.
4. Verify two-organization isolation, repeated ingestion, and workspace switching before production rollout.
5. Roll back an application deployment without dropping persisted tenant data. Destructive migration rollback is only acceptable on an unused development database; retain schema and restore from backup for production recovery.
