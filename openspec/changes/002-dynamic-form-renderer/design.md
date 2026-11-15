# Design

## Context

The repository contains OpenSpec planning only; there is no application or test suite to extend yet. `001-content-studio-core` is an explicit implementation prerequisite. Its design establishes Next.js App Router, TypeScript, Tailwind, Drizzle, Neon, Auth0 organization ownership, v1 onboarding, and the ATM shell. This change fills its intentionally deferred editor/publishing scope and leaves its artifacts unchanged.

Source inspection of `../jazzsinghpersonaltrainer/src/admin/Admin.jsx` confirms useful interaction patterns: schema-like resource iteration, dirty-state confirmation, list search, versioned saves, image preview, and site-scoped requests. Its resources are hardcoded and it uses Neon Auth; reuse interaction patterns and visual tokens rather than its authentication or fixed resource registry. No sibling checkout is required at runtime.

## Goals / Non-Goals

**Goals:** One field definition drives browser controls and server validation; editing retains tenant integrity; publication and delivery survive process termination; v1 content remains lossless.

**Non-Goals:** Public read APIs, automatic installation of receiver code, complete revision history, collaborative merges, scheduled publishing, media-library browsing, asset deletion/garbage collection, and a webhook endpoint configuration UI. Operational configuration is documented instead.

## Decisions

### Versioned Zod contract and compatibility

Use strict discriminated Zod unions and infer TypeScript types from them; use recursive lazy definitions for nested fields. Do not maintain separate handwritten runtime and compile-time contracts. Implement a widget registry exhaustively checked against the normalized union. Reject executable expressions, arbitrary components, and unknown widget names.

Keep onboarding envelope v1 unchanged. Accept envelope v2 with the same site/collections structure, but require `spec_definition.version: 2`. Stored v1 definitions have no version marker; only that legacy shape is interpreted as v1. New v2 definitions use `{version: 2, fields: [...]}`. Never infer v2 from a widget name. Persist original definitions; a read-time adapter provides a normalized renderer representation without writing to the database.

Legacy mappings: string/text → string/text_input; string/textarea → text/textarea; number/number → number/number_input; boolean/checkbox → boolean/toggle_switch. Retain date/date as a legacy-only ISO calendar-date control, with no coercion to arbitrary strings. The adapter copies required flags and length/number bounds. Opening/saving v1 content does not convert image-looking strings into image types or prose into rich HTML. A future explicitly requested schema upsert can change v1 to v2 only after validating all working and published values for compatibility.

All v2 fields require `key`, `label`, `type`, `widget`, and `required`. Optional properties are `default` and `validation` (default `{}`), plus the type-specific properties below. Keys, labels, envelope shape, field-key uniqueness, slug rules, and the 1 MiB JSON request limit inherit the core design. Duplicate keys and `__proto__`, `constructor`, and `prototype` are rejected at every depth. Optional fields can be absent, not null. Defaults are applied only to new or deliberately added values, never over an existing missing optional field on load.

| Type | Widget | Stored value and extra definition properties |
| --- | --- | --- |
| string | text_input | Plain string |
| string | slug_input | Lowercase hyphenated string; optional suggestion from a label never replaces manual input |
| string | color_token | Token key; required `tokens` is a nonempty list of unique `{key,label,value}` with six-digit hexadecimal color values |
| text | textarea | Plain string |
| text | rich_text | Sanitized HTML string |
| number | number_input | Finite JSON number |
| number | currency_input | Safe integer minor units; required `currency` is a three-uppercase-letter currency code and `minor_digits` is an integer 0–4 |
| boolean | toggle_switch | Boolean |
| image | media_picker | HTTPS URL or safe site-relative path string |
| array | repeater_list | JSON array; required `items` is one recursive field definition describing the item value |
| object | repeater_list | JSON object; required `fields` is an ordered list of recursive named fields |

Array item definitions carry the same common properties; their `key` is a stable schema key used for labels and validation, not a JSON wrapper around the item. Object keys remain fixed by the schema. Add/remove controls expose optional object children; required children remain present. Repeatable object groups are expressed as array items of type object. Drag and keyboard reordering apply to arrays, including those nested inside objects; object property order has no content semantics. This preserves conventional JSON object/array shapes rather than introducing an ordered-map encoding.

Validation supports minLength/maxLength for string/text, min/max for number, and minItems/maxItems for arrays. Bounds must be ordered and finite; lengths/counts are nonnegative integers. Currency bounds use minor units. Currency parsing uses decimal-string arithmetic, rejects excess fractional digits, and never relies on binary floating-point rounding. Color values must be declared token keys. Depth is at most 8 field containers, each schema at most 200 total field nodes, each array at most 100 items (a lower declared maximum takes precedence), and each entry at most 1000 aggregate array items. Error responses contain stable paths; default values must satisfy the same contract and limits.

Use a maintained rich-text editor and server HTML sanitizer during implementation, pinned after confirming support for the application stack. The storage format is HTML, independent of the chosen editor. Allow p, br, strong, em, ul, ol, li, blockquote, h2, h3, and a with only href/title. Links allow HTTPS and safe root-relative paths; forbid scripts, event handlers, style, iframes, embedded images, and unsafe schemes. Sanitize client previews and server writes; length bounds apply to sanitized plain-text content. This avoids storing editor-specific JSON or allowing arbitrary executable markup.

### Dynamic forms and collection views

Use a recursive form renderer with stable local item IDs that are removed before serialization. A schema-derived Zod resolver validates locally; each mutation re-fetches the current schema and validates again on the server. Bind errors to value paths while preserving item identity across reorder. Use accessible drag controls with Move up/Move down alternatives, labeled inputs, error summaries, focus restoration, and a single-column layout on small screens.

Use the ATM shell from the core plan. Singleton collection routes show a form directly; an absent singleton remains unsaved until the first save, using the collection key with underscores converted to hyphens as its initial slug. Lock the schema during first insert, retaining the core database singleton protection. Non-singletons show a paginated table and an adjacent editor panel on desktop. Include slug/status/updated time and up to three top-level plain text/string/number/boolean summary fields in schema order. Rich HTML is shown as plain text; nested values are summarized, never dumped as HTML.

Default sorting is updated_at descending then id ascending, page size 25 (maximum 100). Search slug and recursively extracted textual values case-insensitively with literal substring semantics; status filters are all/draft/published, and optional boolean top-level fields receive true/false filters. Apply search/filter before page/count queries. Do not hardcode testimonials, pricing, or blog behavior. Show “Draft changes; previous version published” when applicable. Table status filters refer to working status, not webhook state.

Create starts with defaults, a user-entered slug, and draft status; an explicit Publish action may create and publish in the same transaction. Duplicate deep-copies working data into a new draft and generates a collision-safe `original-slug-copy-<suffix>` within the slug length limit; no published snapshot, version, or event is copied. Destructive Delete requires confirmation and current version; published deletion also requires content:publish. Share image URL strings on duplication rather than duplicating provider files. Guard site/schema/entry navigation and browser unload against dirty forms; cancel stale loads and preserve local work on failed saves or version conflicts.

### Authorization and editor API

Protect reads with the existing verified organization session and mutations with content:write. Publish and deletion of any previously published entry additionally require content:publish. Same-origin/CSRF protection applies to browser mutations. API keys are not editor credentials. Every nested route independently checks schema/site/organization joins and never trusts a posted site/schema ID. Return 401 for no session, 403 for missing permission, 404 for inaccessible resources, 409 for stale version/schema or duplicate slug, 413 for body limits, and 422 for invalid values.

Proposed JSON endpoints under `/api/v1/sites/[siteId]/schemas/[schemaId]`:

- `GET /entries?q=&status=&page=&page_size=&filter[field]=`: scoped result list and total; singleton view uses the same reader.
- `POST /entries`: create `{slug,data,status,schema_digest,idempotency_key}`. Status is draft or published; published creation uses the publication pipeline.
- `PATCH /entries/[entryId]`: `{slug,data,status,expected_version,schema_digest,idempotency_key}`; latest schema digest also accompanies create requests.
- `POST /entries/[entryId]/duplicate`: `{expected_version,idempotency_key}` creates a draft.
- `DELETE /entries/[entryId]`: `{expected_version,idempotency_key}`.
- `GET /entries/[entryId]/deliveries` and `POST /deliveries/[deliveryId]/retry`: authorized delivery status and publisher-only retry.

Use server-computed SHA-256 digest of canonical stored spec_definition to detect schema changes. Lock schema then entry consistently and compare digests/version in the transaction. Extend core schema-upsert compatibility checks to published snapshots as well as working content. Return conflicts with a reload option; do not silently overwrite another editor or discard the local draft.

### Persistence and draft/publish semantics

Add to content_entries: `version` positive integer default 1, nullable `published_data` JSONB, `published_slug` text, `published_at` timestamptz, and `published_version` integer. Constrain snapshot columns to be all null or all populated. Preserve the existing `data`, `slug`, `status`, and updated_at fields as the working copy. A draft save increments version and working timestamp but leaves publication columns unchanged. A publish increments version and copies validated data/slug into publication columns; status becomes published. Another draft save sets working status draft while the snapshot remains live. Unpublish is outside this phase; the UI must not suggest draft save unpublishes existing content.

Reserve both working and published slugs within a schema using a `content_slug_claims` table unique on `(schema_id, slug)` and compound tenant/entry references; an entry may hold both its current working slug and old published slug. Transactionally release a superseded working claim only if it is not still published, release the old published claim on successful republish, and release both on delete. This avoids two entries claiming the same live URL when one is renamed in draft.

Add `content_commands`: site_id, command UUID, actor subject, request digest, operation, response JSON, created_at; unique `(site_id, command_id)`. Authorize first, bind the command to its actor and operation, then atomically record the mutation and replayable result; same command/payload returns its original response, changed payload returns 409. Publish, create, duplicate, delete, and update use this ledger. Another actor cannot replay the stored response. No credential material is stored in command results. Retain command records for 30 days and document that deduplication is bounded by that retention. Entry-version checks prevent stale republish beyond the retention window.

### Media adapters and deployment configuration

Provide adapters for S3, Cloudinary, and R2 behind one server interface. Select a provider and public delivery base per site from a deployment-managed configuration keyed by site UUID; credentials are secret references, never fields in content-spec.json. S3/R2 use short-lived signed uploads to private staging keys; Cloudinary uses signed resource uploads with verified server completion. No unsigned unrestricted upload preset is accepted.

`POST /api/v1/sites/[siteId]/media/uploads` validates permission, requested size/type, and creates a five-minute upload intent with server-generated organization/site-prefixed random staging key. `POST /media/uploads/[intentId]/complete` reauthorizes, checks intent/key ownership, verifies actual size and file signature by server-side inspection through the provider adapter, and promotes a valid image to its durable public delivery URL. Track intents in `media_uploads` with UUID, site_id, provider, staging key, claimed type/size, expiry, completion state, final URL, and timestamps; grants cannot authorize arbitrary buckets or keys. Completed intents return the same final URL on retry.

Limit to JPEG, PNG, WebP, GIF, 10 MiB. Provider policy enforces size/type where supported; completion independently verifies bytes and metadata before promotion. Return failure without updating content; reject and remove invalid staging objects where possible. Staging objects expire through documented provider lifecycle rules. A completed but unattached asset is an acknowledged orphan; automatic cleanup and deletion of shared assets are deferred. External URL input is not fetched by the server; previews use safe browser image rendering and relative paths resolve to the selected site's HTTPS origin. Site-relative paths forbid traversal, protocol-relative paths, query credentials, and unsafe schemes. Changing a provider must not rewrite existing image URLs.

### Publication outbox and worker

In the same transaction as a publish, insert an immutable `webhook_deliveries` event if webhook_url is configured. Columns: event UUID, site_id FK, schema_id/entry_id identifiers retained as values after deletion, revision, event_type, immutable serialized body, captured endpoint, signing-key reference/version, state, attempts, next_attempt_at, lease_expires_at, lease_token, last safe error/status, delivered_at, created_at. Do not cascade events when entries are deleted. Include an index on `(state,next_attempt_at)` and unique `(site_id,entry_id,revision,event_type)`.

Null webhook_url means publication succeeds with skipped delivery and no outbox record; derive skipped from the command result rather than fabricating a dispatched event. Configured URL with no usable signing key returns 409 before any publish/delete mutation. Generate a separate 256-bit per-site webhook secret in an operator-controlled secret store and configure its reference; share it with the receiver out of band. The hashed sites.api_key is neither recoverable nor suitable for signing. Keep old key versions available while deliveries referencing them remain pending. No secret is returned through content listing, logs, browser forms, or the onboarding payload.

A separately scheduled Node worker polls at least once per minute, claims due rows with database locks and expiring leases, then performs network I/O outside the transaction. Use a 30-second lease and 10-second HTTP timeout; update result only if the lease token still matches, preventing an expired worker from overwriting a newer attempt. Never rely on fire-and-forget promises inside Next.js requests. A hosted scheduler invokes the worker using a deployment-managed worker credential; local development provides an explicit worker command. This worker is a required deployable component, not a task deferred until after implementation.

HTTP 2xx marks delivered. Network errors, 429, and 5xx retry after 1 minute, 5 minutes, 30 minutes, 2 hours, then 12 hours (six total attempts); a bounded Retry-After can delay up to 12 hours. Other responses including redirects fail without retry. After exhaustion show failed; publisher-triggered retry resets the schedule on the same event, not a new publish. Dispatch is at least once: a crash after receiver acceptance may redeliver. Multiple revisions can arrive out of order; receiver deduplication and revision handling are mandatory in the integration guide.

### Webhook wire contract

POST JSON body is frozen at commit:

```json
{"id":"event-uuid","type":"entry.published","occurred_at":"ISO-8601 UTC","site_id":"uuid","schema_id":"uuid","collection_key":"testimonials","entry_id":"uuid","revision":7,"slug":"example","previous_slug":null,"data":{"title":"Example"}}
```

A republish after slug change includes the previous published slug so both paths can be revalidated. `entry.deleted` contains the deleted entry's last published slug/data and a revision one greater than its final entry version; it invalidates a live route without depending on a deleted database row. Draft-only deletion emits no event. Newly seeded entries with published status from v1/v2 onboarding use the same snapshot/outbox transaction and configuration checks after this phase; repeat ingestion remains insert-only and emits nothing for existing seeds. Backfilling historical published rows emits no events.

Headers: `Content-Type: application/json`, `X-Content-Studio-Event-Id`, `X-Content-Studio-Timestamp` (attempt UNIX seconds), `X-Content-Studio-Key-Id`, and `X-Content-Studio-Signature: v1=<lowercase hex>`. Sign UTF-8 bytes of `timestamp + "." + exact_body` with HMAC-SHA256. Re-sign retries with a fresh timestamp, preserving body and event ID. Receiver examples verify constant-time equality, require timestamp within five minutes, bind expected site identity, deduplicate event IDs, and ignore older per-entry revisions before side effects. A 2xx means receiver acceptance, never proof a rebuild completed.

Validate HTTPS targets with no embedded credentials or fragments and a deployment-managed hostname allowlist per site. At every attempt resolve DNS and reject all private, loopback, link-local, reserved, and metadata IPv4/IPv6 destinations. Use a dispatcher that connects to the validated resolved address while retaining TLS hostname verification, or an equivalently enforced egress proxy; a check followed by an unrestricted re-resolution is insufficient. Disable redirects and proxy-environment bypasses. A queued event keeps its endpoint/key version; if later removed from the trusted configuration, fail it rather than sending elsewhere. Record only safe failure categories and HTTP codes, never bodies, signatures, credentials, or content payloads.

## Risks / Trade-offs

- [Core phase is not implemented] → Apply and validate 001 first; reconcile the new APIs with its implemented structure without altering the v1 contract.
- [Renderer assumes object order is meaningful] → Reorder repeated array items; keep fixed object field identities and order presentation from the schema.
- [Draft content accidentally goes live] → Keep a separate published snapshot, and never use working data as a publication payload.
- [Provider configurations vary] → Deliver all three adapters with mocked contract tests and opt-in sandbox smoke checks; missing credentials disable uploads only.
- [Uploads leave orphaned assets] → Document staging lifecycle and completed orphan retention; avoid unsafe deletion of shared files.
- [Outbox duplicates or reorders events] → Immutable IDs/revisions, leases, signature verification, and receiver deduplication guidance.
- [Schema conversion breaks published content] → Validate both working and published copies, reject incompatible changes, and keep legacy adapters lossless.
- [More persistence than a form-only change] → Snapshot, idempotency, slug-claim, upload-intent, and outbox storage directly support the promised editing/publication guarantees; full revision history is deferred.

## Migration Plan

1. After core implementation, add forward Drizzle migrations for versions/snapshots, slug claims, command ledger, upload intents, and outbox; backfill existing slug claims and published snapshots without dispatch.
2. Add v1/v2 validators and renderer behind a feature flag; exercise the core Jaz Singh fixture and a v2 fixture containing every widget and nested item type.
3. Configure Auth0 write/publish permissions, site upload providers, webhook endpoint allowlists/key references, and a receiver sandbox. Document grants and worker credentials independently of content definitions.
4. Deploy API/UI and the scheduled worker; verify drafts, publication, failure/retry recovery, upload completion, and two-organization isolation before enabling editors.
5. For rollback disable editing and worker scheduling while preserving pending events and all new columns. Older code must not resume mutations against the new publication invariants; use a read-only maintenance mode until a compatible release is restored. Do not drop snapshots or queued events in production.
