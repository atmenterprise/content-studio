# Proposal

## Why

Content Studio's planned registry can ingest collection definitions but cannot yet turn them into editing interfaces. A shared, validated field contract will let every tenant edit and publish its own content without bespoke forms or unreliable request-bound rebuild hooks.

## What Changes

- Define a strict version 2 Zod/TypeScript field contract with the requested type/widget mappings, recursive nested values, validation, and compatibility for the core change's v1 definitions.
- Replace collection landing panels with schema-driven singleton forms and searchable, filterable collection tables supporting Create, Edit, Duplicate, and Delete.
- Add schema-validated editing, conflict detection, draft saves, published snapshots, and clear publication/delivery states within the existing tenant boundary and ATM visual language.
- Add URL-based image selection and site-scoped uploads through configurable S3, Cloudinary, and R2 adapters, with credentials held server-side.
- Publish through a transactional outbox and asynchronous HMAC-signed webhook delivery, including retries, failure visibility, and receiver verification guidance.
- Keep public content delivery APIs, site frontend integration, scheduled publishing, collaborative editing, asset-library administration, and automatic media cleanup out of scope.

## Capabilities

### New Capabilities

- `field-contract`: Versioned recursive schema definitions, widget compatibility, and content validation.
- `content-editing`: Authorized dynamic singleton/collection views and draft/published entry management.
- `media-management`: Site-scoped image URL selection and provider-backed upload.
- `publishing`: Published snapshots and reliable signed webhook dispatch.

### Modified Capabilities

None in the current main-spec inventory. The `database` capability exists only in the unimplemented `001-content-studio-core` change; this change adds capabilities on top of that planned baseline without rewriting its artifacts.

## Impact

Implementation depends on `001-content-studio-core` first providing the Next.js/TypeScript/Tailwind application, Auth0 organizations, Neon/Drizzle persistence, and onboarding. This change extends onboarding to accept v2 while preserving v1, adds authorized editor/media endpoints, publication snapshot columns and an outbox table, a separately scheduled worker, upload-provider configuration, and a site webhook-signing secret reference. Existing v1 Jaz Singh definitions and data remain usable without forced migration.

The core change's editor and webhook exclusions apply to its own phase; this second phase deliberately implements those deferred behaviors. Its schema-driven registry and tenant isolation remain authoritative. The repository currently contains planning artifacts only; all runtime components here are proposed additions. No application code is created by this proposal.
