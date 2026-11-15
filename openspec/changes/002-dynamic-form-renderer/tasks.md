# Tasks

Implementation prerequisite: `001-content-studio-core` must be implemented and its acceptance checks passing before applying this change. The repository currently contains planning artifacts only. Keep core v1 onboarding and the portable Jaz Singh fixture compatible.

## 1. Versioned field contract

- [ ] 1.1 Add strict recursive v2 Zod definitions with inferred TypeScript types, exact widget pairs, typed defaults, token/currency metadata, and nested limits; verify acceptance of every supported pair and path-specific rejection of unknown keys, invalid pairs/defaults, unsafe keys, and excessive depth/items.
- [ ] 1.2 Implement a read-time legacy adapter including date fields and extend onboarding to explicit v2 definitions; verify the original v1 fixture round-trips unchanged and cross-version or unsupported definitions fail without persistence.
- [ ] 1.3 Implement canonical slug/token/currency parsing and rich-text sanitation; verify decimal precision, minor-unit bounds, invalid token rejection, executable markup removal, and equivalent browser/server value validation.
- [ ] 1.4 Document v1/v2 envelopes, nested object-versus-array behavior, limits, value formats, and migration rules with valid/invalid fixtures; verify fixture validation covers every widget and needs no sibling checkout.

## 2. Editing and publication persistence

- [ ] 2.1 Add Drizzle migrations for entry versions/published snapshots, slug claims, command ledger, upload intents, and webhook outbox with tenant references and due-event indexes; verify migration on a core-populated PostgreSQL database preserves entries and backfills published snapshots/slug claims without dispatching events.
- [ ] 2.2 Add atomic working/published slug reservation and snapshot constraints; verify draft rename cannot free a still-published slug, conflicting claims fail, and publish/delete release only the correct claims.
- [ ] 2.3 Add entry-version and schema-digest comparison with consistent locks and extend schema-upsert compatibility checks to published values; verify concurrent writes, schema changes, and singleton creation return conflicts without data loss.
- [ ] 2.4 Add command idempotency and 30-day cleanup with operation/payload/actor binding; verify retries replay the result, changed payloads fail, and commands cannot expose another site's or actor's response.
- [ ] 2.5 Document forward migration, backfill, retention, and maintenance-mode rollback; verify the migration rehearsal and rollback procedure preserve queued events and published snapshots.

## 3. Authorized entry operations

- [ ] 3.1 Add site/schema-scoped list/create/update/duplicate/delete endpoints with session, content:write, content:publish, same-origin, size, and server schema checks; verify 401/403/404/409/413/422 behavior and cross-tenant IDs through API integration tests.
- [ ] 3.2 Implement collection search, status/boolean filters, deterministic sorting, pagination, and matching totals; verify search across nested textual values and results beyond the first page against PostgreSQL fixtures.
- [ ] 3.3 Implement draft defaults, deep-copy duplicate with collision-safe slug, confirmed-delete API semantics, and direct singleton loading; verify duplicates lack publication state and do not mutate originals, and singleton duplication is rejected server-side.
- [ ] 3.4 Document editor requests, responses, version/schema conflicts, permissions, and retry semantics; verify documented request fixtures match endpoint validation and preserve core API behavior.

## 4. Dynamic forms and views

- [ ] 4.1 Implement an exhaustive widget registry and scalar controls for text_input, slug_input, color_token, textarea, number_input, currency_input, toggle_switch, and legacy date; verify schema-driven rendering, defaults, labels, and serialization across v1/v2 fixtures.
- [ ] 4.2 Add rich_text with the documented HTML allowlist and safe preview; verify save/reload preserves permitted formatting and browser/server tests reject or remove unsafe markup and links.
- [ ] 4.3 Add recursive repeater_list rendering, optional object children, add/remove array items, pointer drag, and keyboard move controls with local stable IDs; verify nested error paths, saved order, item identity, and omission of editor IDs from serialized content.
- [ ] 4.4 Replace core singleton landing panels with direct forms and non-singleton panels with searchable/filterable tables and Create/Edit/Duplicate/Delete actions; verify arbitrary schemas including hero_section, global_settings, testimonials, pricing_plans, and blog_posts work without hardcoded names.
- [ ] 4.5 Add dirty navigation/unload confirmation, cancellation of stale requests, conflict-preserving reload choices, loading/empty/no-match/retry states, and keyboard focus behavior; verify site switches and failed/conflicting writes retain the correct local draft.
- [ ] 4.6 Apply ATM typography, accents, panels, responsive editor layout, and the core sidebar-top Site Switcher; verify desktop/narrow-screen browser checks and document dynamic editor usage, object semantics, and limitations.

## 5. Media selection and uploads

- [ ] 5.1 Add media_picker URL entry, site-origin relative preview, and unavailable-image feedback; verify unsafe URLs/paths are rejected, source img/ paths remain unchanged, and failed selection preserves existing data.
- [ ] 5.2 Implement shared upload-intent/completion authorization and file verification with five-minute grants, site-prefixed staging keys, verified bytes/type, and 10 MiB limit; verify expiration, disguised files, cross-site keys, repeated completion, and failed promotion behavior with adapter fakes.
- [ ] 5.3 Implement S3 signed staging upload and promotion; verify its adapter contract tests and provide an opt-in sandbox smoke command that does not affect production assets.
- [ ] 5.4 Implement R2 signed staging upload and promotion; verify the same contract suite plus endpoint/public-delivery URL configuration through a sandbox fixture.
- [ ] 5.5 Implement Cloudinary signed upload and verified completion/promotion; verify the same contract suite rejects forged completion data and unrestricted upload presets.
- [ ] 5.6 Connect provider configuration and upload progress/error/retry UI; verify URL-only mode without credentials and document each provider's secrets, delivery base, staging lifecycle, and completed orphan retention without automatic shared-asset deletion.

## 6. Publication transactions

- [ ] 6.1 Implement Save draft and Publish against separate working/published snapshots, including newly published onboarding seeds; verify draft saves preserve live values, successful publishes replace snapshots, and repeated seed ingestion emits no duplicate events.
- [ ] 6.2 Enqueue immutable entry.published and published-entry entry.deleted events atomically, capturing endpoint/key version, prior slug, revision, and published payload; verify rollback on enqueue failure and continued event availability after entry deletion.
- [ ] 6.3 Add separate per-site signing-key configuration and null/misconfigured webhook behavior; verify null URL yields skipped delivery, missing key blocks configured delivery before mutation, and API-key hashes/secrets never reach DTOs or logs.
- [ ] 6.4 Add publication UI actions, permission gating, published/draft-change indicators, delivery status, and authorized failed-delivery retry; verify publish completion is distinct from receiver acceptance and draft/duplicate actions emit no publication event.
- [ ] 6.5 Document snapshot semantics, lack of an unpublish action, published deletion behavior, endpoint configuration, and key provisioning/rotation; verify examples include core v1 and v2 published seeds and a missing-key failure.

## 7. Asynchronous webhook delivery

- [ ] 7.1 Implement the scheduled worker with due-event claiming, expiring leases, fencing tokens, timeout, and state transitions; verify multi-worker claims and crash recovery without a database transaction held across network I/O.
- [ ] 7.2 Implement HMAC-SHA256 over timestamp and immutable raw JSON with documented headers and key version; verify receiver test vectors, raw-byte tampering, timestamp expiry, site identity, duplicate event IDs, and out-of-order revisions.
- [ ] 7.3 Implement allowed-host validation, DNS/IP restrictions, resolved-address connection enforcement, no redirects, and safe failure reporting; verify IPv4/IPv6, rebinding, credentials, removed targets, metadata addresses, and proxy bypass cases with network fakes.
- [ ] 7.4 Add six-attempt retry schedule, bounded Retry-After, terminal failure, and publisher-triggered retry of the same event; verify network/429/5xx retries, 2xx success, terminal 4xx/redirect responses, and no accidental republish.
- [ ] 7.5 Add local worker and hosted scheduled invocation entry points with worker authentication; verify documented commands and a scheduler smoke test process committed events after the originating request has ended.
- [ ] 7.6 Publish receiver verification/revalidation examples, operations guidance, retry/retention expectations, and deployment configuration; verify examples against test vectors and explain that 2xx acceptance does not guarantee rebuild completion.

## 8. System acceptance

- [ ] 8.1 Run browser-to-database-to-worker flows across two organizations using the portable v1 Jaz Singh fixture and comprehensive v2 fixtures; verify nested editing, draft preservation, duplicate/delete, each media adapter, publication, delivery recovery, and tenant isolation.
- [ ] 8.2 Run typecheck, lint, production build, contract/unit tests, PostgreSQL integration tests, browser tests, and receiver/worker smoke checks using documented scripts; record results and any external Auth0/provider/receiver configuration needed for preview acceptance.
