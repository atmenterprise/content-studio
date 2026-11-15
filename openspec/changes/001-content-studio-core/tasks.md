# Tasks

Implementation references: use the source-level `/admin` design in `../jazzsinghpersonaltrainer` and the adaptation decisions in design.md. Keep Auth0 organization authorization; the source Neon Auth, memberships, editor workflows, access approvals, and notification emails are outside this change.

## 1. Application foundation

- [x] 1.1 Scaffold Next.js App Router with TypeScript and Tailwind, pin dependencies and add development/build/typecheck/lint scripts; verify installation, typecheck, and production build succeed.
- [x] 1.2 Add server-only environment validation and an example environment file for Neon and Auth0; document local setup and verify missing required variables produce safe actionable errors without exposing secrets.

## 2. Tenant persistence

- [x] 2.1 Define Drizzle sites, schemas, and content_entries models and initial PostgreSQL migration with organization ownership, UUIDs, JSONB, timestamps, status checks, indexes, uniqueness, and composite foreign keys; verify migration applies to an empty PostgreSQL database and generated schema matches the design.
- [x] 2.2 Enforce singleton integrity with parent schema locking and database triggers, including schema mode transitions; verify direct and concurrent writes cannot create two singleton entries or convert a populated collection incompatibly.
- [x] 2.3 Add PostgreSQL integration coverage for cross-site references, duplicate collection keys/slugs, invalid statuses, restrictive parent deletion, and updated_at behavior; verify all invalid writes fail and valid writes preserve tenant relationships.
- [x] 2.4 Document migration commands, database connection requirements, and data-preserving rollback; verify setup instructions reproduce the schema on a fresh development database.

## 3. Authentication and authorized reads

- [ ] 3.1 Configure Auth0 organization-aware login/logout, protected server sessions, and organization reauthentication; verify unauthenticated UI access starts login and switching establishes a newly verified organization claim.
- [ ] 3.2 Add bearer-token verification and content:onboard permission enforcement for onboarding; verify invalid signature, issuer, audience, expired token, missing organization, and missing permission are rejected with the specified 401/403 responses.
- [ ] 3.3 Implement organization-scoped site and schema access with safe response fields and cache isolation; verify two-organization fixtures cannot read each other's IDs, labels, or key hashes and unauthorized site routes return 404.
- [ ] 3.4 Document Auth0 organization setup, callbacks, audience, permission grants, and obtaining an onboarding token; verify the documented configuration supports both session reads and authenticated API calls in development.

## 4. Content-spec validation

- [ ] 4.1 Define strict version 1 Zod schemas for the envelope, site, collections, field definitions, widgets, validation bounds, and entries; verify unit cases cover unknown properties, unsupported versions, normalization, duplicates, invalid URLs/keys/slugs, and widget/type mismatches.
- [ ] 4.2 Validate seed data against declared fields and singleton rules; verify required/optional fields, undeclared keys, nulls, number bounds, string lengths, valid calendar dates, and multiple singleton seeds are handled as designed.
- [ ] 4.3 Publish a versioned content-spec reference and sample JSON matching the design; verify the fixture passes the actual validator and documents defaults and supported types.

- [ ] 4.4 Add a portable Jaz Singh example fixture with all five mapped collection definitions and representative draft seeds, preserving source fields, required flags, and maximum lengths; verify the actual Zod validator accepts it, its size is under 1 MiB, and About Me has exactly one seed.
- [ ] 4.5 Document fixture provenance and transformations for the source domain, IDs/source keys, testimonial wrappers/highlights, and image strings; verify stable slug uniqueness, required-field coverage, preserved relative paths, and fixture validation in CI without the sibling checkout or its database.

## 5. Transactional onboarding endpoint

- [ ] 5.1 Implement authorized site upsert with organization/domain identity, row locking, one-time random API key generation, and hash-only storage; verify repeated and concurrent calls preserve one site UUID and do not rotate or expose the key on updates.
- [ ] 5.2 Implement schema upserts, existing-data compatibility checks, and insert-only seeding in one transaction; verify stable schema IDs, unchanged existing entries/timestamps, retained omitted records, singleton preservation, 409 incompatibility, and rollback on injected failure.
- [ ] 5.3 Expose POST /api/v1/onboard with a 1 MiB body limit and specified response/error envelopes; verify 201/200, 400, 401, 403, 409, 413, 422, and sanitized 500 behavior through route integration tests.
- [ ] 5.4 Add safe request logging and bounded transaction retries; verify sensitive payloads/tokens/keys never appear in captured logs and retry exhaustion leaves no partial writes.
- [ ] 5.5 Document onboarding requests, responses, permission requirements, retry semantics, and one-time key behavior; verify sample requests work against the development endpoint.

- [ ] 5.6 Add an onboarding integration case using the Jaz Singh fixture; verify creation of exactly five schemas, repeat-ingestion preservation, and independent onboarding into a second organization without importing legacy identities or touching the reference database.

## 6. Workspace layout

- [ ] 6.1 Build the protected sidebar with its site switcher at the top and schema-derived navigation to collection landing routes; verify labels, links, deterministic ordering, singleton inclusion, and the active site match persisted authorized records.
- [ ] 6.2 Implement URL selection, organization-switch clearing, cache separation, stale-response protection, and loading/empty/retry states; verify rapid site changes and organization switches never show another context's collections.
- [ ] 6.3 Add UI coverage for keyboard selection, visible focus, empty sites/schemas, failed reads, unauthorized deep links, and session expiry; verify the browser tests pass and document how to run them.

- [ ] 6.4 Implement the approved ATM shell with the reference wordmark, font stack, color/radius tokens, collapsible sidebar, breadcrumbs, and responsive layout, keeping the Site Switcher at the sidebar top; verify desktop and narrow-screen screenshots against the documented source reference and check collapsed labels and overflow behavior.
- [ ] 6.5 Implement the verified-identity profile menu with site website link, organization switching, and sign-out, plus Escape/outside dismissal and trigger focus restoration; verify browser interaction tests and absence of unsupported editor, project-creation, account-editing, and approval actions.
- [ ] 6.6 Verify the five Jaz Singh collection labels and singleton landing panel render from persisted schemas using the shared visual tokens; document the reference adaptation and verify no hardcoded trainer collection names, groups, or nonfunctional editor controls are required by the generic workspace.

## 7. System acceptance

- [ ] 7.1 Run an end-to-end flow with two organizations using the Jaz Singh example: onboard sites, retry identical ingestion, switch sites and organizations, and attempt cross-tenant navigation; verify the database spec scenarios hold across API, persistence, and UI.
- [ ] 7.2 Run production build, typecheck, lint, unit, PostgreSQL integration, and browser checks using the documented scripts; record results and any external Neon/Auth0 configuration required for preview deployment.
