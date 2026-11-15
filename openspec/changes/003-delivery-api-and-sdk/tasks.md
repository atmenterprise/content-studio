# Tasks

Prerequisites: implement and validate `001-content-studio-core` and `002-dynamic-form-renderer` before applying this change. All runtime code and package infrastructure described here are new work; this planning change does not publish npm packages or modify external websites.

## 1. Published delivery reads

- [ ] 1.1 Implement a consistent-snapshot, site-scoped delivery reader projecting only id/published_slug/published_data and registered collection cardinality; verify draft-only exclusion, unchanged public output after draft saves, cross-site isolation, deterministic ordering, and empty singleton/collection/site shapes against PostgreSQL fixtures.
- [ ] 1.2 Add the all-content and single-collection GET/HEAD routes with strict UUID/key/query handling, shared entry envelopes, safe errors, and 405 mutation responses; verify known-empty 200, unknown 404, invalid-input 400, sanitized service failures, and HEAD body omission through route tests.
- [ ] 1.3 Document JSON examples, inclusion of empty schema keys, metadata-versus-data fields, snapshot semantics, and image-path preservation; verify examples match both v1 Jaz Singh and v2 nested fixture responses without trainer-specific reshaping.

## 2. Preview tokens and working delivery

- [ ] 2.1 Add a Drizzle preview_tokens migration with site ownership, token-hash uniqueness, scopes, expiry, revocation, and lookup indexes; verify migration preserves existing content and stores no plaintext tokens.
- [ ] 2.2 Implement protected token creation/revocation using Auth0 organization ownership, content:preview permission, CSRF checks, one-time token responses, and one-hour maximum lifetime; verify unauthorized/cross-site requests fail, default scopes/expiry are applied, and authorized revocation is idempotent.
- [ ] 2.3 Add per-request bearer validation for hash/expiry/revocation/site/scope and preview=true working-copy projection; verify draft-only and newer draft reads, no merge with old snapshots, 401/403 handling, and no implicit preview from cookies or Authorization on preview=false.
- [ ] 2.4 Document token provisioning, content:preview versus schema:read scopes, revocation, and server-side preview examples; verify example requests work and token material never appears in URLs, application logs, or errors.

## 3. HTTP caching and CORS

- [ ] 3.1 Add canonical representation serialization, weak SHA-256 ETags, Cache-Control public/max-age=0/s-maxage=60/must-revalidate, and conditional GET/HEAD; verify If-None-Match lists/wildcards/weak tags, correct 304 headers, and changed ETags after changed publication/deletion but not working-only updates.
- [ ] 3.2 Apply private,no-store with no validators to preview, schema export, token operations, Authorization-bearing reads, and errors, bypassing framework caches; verify expired-token requests cannot return 304 and warmed preview/public requests never share representations.
- [ ] 3.3 Add anonymous wildcard CORS, exposed cache headers, read-only OPTIONS, and allowlisted bearer-preview browser access without cookies; verify allowed/rejected origins, preflight headers including revalidation, mutation rejection, and no credential leakage.
- [ ] 3.4 Document and exercise reverse-proxy/CDN query/Vary/bypass configuration and the 60-second freshness bound; verify a cache test harness separates sites/previews and honors request no-cache revalidation, and document that immediate hosted-CDN purge is outside scope.

## 4. Authenticated schema export

- [ ] 4.1 Add GET /api/v1/public/:siteId/schemas with schema:read scope, a consistent schema snapshot, versioned export envelope, canonical digest, and sorted collection definitions; verify v1/v2 export identity, cardinality, no entry/configuration data, and no-store behavior.
- [ ] 4.2 Add export authorization and failure coverage for absent/expired/revoked/wrong-site/insufficient-scope tokens, unsupported stored definitions, and conditional headers; verify no public metadata fallback or 304 bypass is possible.
- [ ] 4.3 Document export protocol version versus field-definition version and current-schema compatibility expectations; verify example exports validate against the existing field contract and digest rules.

## 5. Dependency-free SDK

- [ ] 5.1 Add npm workspace packaging for packages/client and packages/cli while preserving application scripts; verify the client emits independently packable ESM/declarations with zero runtime dependencies or required peers and no server-only imports.
- [ ] 5.2 Implement createContentClient, getAll, getCollection, URL validation/prefix preservation, safe segment construction, and generated-map generics; verify strict positive/negative type fixtures and valid default JSON-compatible types without any.
- [ ] 5.3 Implement public/automatic-preview transport, credentials omission, redirects rejection, timeout, optional revalidation requests, and ContentStudioError categories; verify fetch request shape, token secrecy, no anonymous fallback, HTTP/network/timeout/malformed-response handling, and null singleton preservation.
- [ ] 5.4 Document browser, Node, edge, typed, preview, and revalidation examples with runtime requirements; verify packed-tarball imports and both methods in clean native-fetch consumer fixtures without adding runtime dependencies.

## 6. Type generation CLI

- [ ] 6.1 Add the content-studio package/bin and typegen parser with --site, --base-url, --out, --check, and --force plus environment-only credentials; verify precedence, usage errors, absent credentials, default output, and nonzero failures without exposing tokens.
- [ ] 6.2 Implement bounded authenticated schema fetching with timeout, redirect rejection, streamed size cap, and export/digest/field validation; verify wrong-site exports, unsupported versions, oversized responses, revoked tokens, and invalid schemas preserve existing output.
- [ ] 6.3 Generate strict entry-data/nested interfaces and ContentStudioCollections for all v1/v2 types, optional fields, color literals, nullable singletons, and collections; verify strict consumer compilation and rejection of unknown keys, wrong nested types, or invalid null/array usage.
- [ ] 6.4 Add deterministic canonical emission, safe identifiers/literals, collision handling, digest/provenance comments, and atomic output replacement; verify reordered exports produce identical bytes, hostile labels cannot inject code, symlinks are rejected, non-generated files require --force, and write failures preserve prior output.
- [ ] 6.5 Implement --check drift detection and document regeneration/CI usage and static-type limitations; verify unchanged output passes, stale/missing files fail without writes, and the local packed CLI generates declarations in a clean frontend fixture.

## 7. System acceptance and release artifacts

- [ ] 7.1 Run end-to-end flows with two sites/organizations: publish, save newer drafts, fetch public and preview through the SDK, revoke tokens, export schemas, generate types, and detect drift; verify snapshot, cache, scope, and type guarantees hold across all layers.
- [ ] 7.2 Run application build/typecheck/lint, API/PostgreSQL/cache integration tests, SDK runtime/type tests, CLI output tests, and package tarball consumer checks; record results and build local release artifacts without publishing to a registry.
- [ ] 7.3 Verify documented rollout/rollback and receiver no-cache revalidation against a preview environment or representative cache harness; record deployment-specific cache settings and package-publication prerequisites without changing external websites or hosted registry state.
