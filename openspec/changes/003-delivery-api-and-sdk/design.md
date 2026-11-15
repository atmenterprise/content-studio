# Design

## Context

The repository contains only planning artifacts, with no application, packages, or tests yet. Implementation follows 001 and 002 in order. The former defines tenant-owned sites/schemas; the latter adds separate working and published entry snapshots, v1/v2 field definitions, and publication webhooks. Their exclusions of public delivery apply to those phases; this change supplies that deferred layer without editing their plans.

The inspected sibling `../jazzsinghpersonaltrainer/src/app/api/testimonials/route.ts` exposes a fixed server-selected project's content with trainer-specific reshaping and no-store. Its `src/hooks/useTestimonials.js` uses native fetch with cancellation and static fallback. These demonstrate an existing consumer need, but neither endpoint nor hook is part of this implementation: this API is site-parameterized, publication-aware, generic, and cacheable.

## Goals / Non-Goals

**Goals:** Explicit published-versus-working reads, predictable JSON and HTTP semantics, isolated preview credentials, and portable typed consumption from native-fetch runtimes.

**Non-Goals:** Write access through delivery routes, a public schema catalog, automatic runtime field validation in the SDK, provider-dependent CDN purges, full schema-version history, package publication, or changes to external website repositories.

## Decisions

### Response representation and publication semantics

Use an explicit entry envelope `{id, slug, data}`. Flattening user fields into the envelope risks collisions with id/slug and complicates generated types. The all-content endpoint returns a plain keyed object, not a second data wrapper. The single-collection endpoint returns exactly the corresponding value:

```json
{
  "hero_section": {"id":"uuid","slug":"hero-section","data":{"title":"Welcome"}},
  "testimonials": [{"id":"uuid","slug":"client-one","data":{"author":"Example"}}],
  "global_settings": null,
  "blog_posts": []
}
```

Include every registered schema key for the selected site, with null for an empty singleton and [] for an empty collection. A site with no schemas returns {}. This exposes collection names/cardinality intentionally, but not field definitions, labels, entry drafts, repository URLs, or organizational configuration. UUIDs are public resource identifiers, not credentials. Unknown site or collection returns 404; malformed UUID/key or unsupported/duplicate query parameters returns 400. The only content query is preview=true or preview=false, default false. No pagination or silent truncation is introduced into the requested all-content API.

For public reads, select entries with non-null published snapshots regardless of working status. Serialize id, published_slug, and published_data only. Sort schema keys lexicographically and entries by published_slug then id. Never sort on updated_at, which changes on draft saves. Sort nested object keys for stable serialization while preserving nested array order. Read schema metadata and entry values within one consistent database snapshot for getAll; otherwise a concurrent publish could produce inconsistent mixed queries. The single-collection route uses the same reader/projection.

Preview reads select each existing entry's current data and slug, including draft-only and currently published rows; they are a complete working-copy view, not drafts-only filtering or a merge with old published snapshots. Sort on working slug/id. Unsaved browser forms are not included. Public GETs never mutate persistence, create keys, update usage timestamps, or invoke webhooks. Deletions become absent at origin immediately after commit, subject to the cache freshness bound below.

### Preview credentials and lifecycle

Use opaque random 256-bit bearer tokens, separate from site API keys, Auth0 access tokens, and webhook secrets. Add `preview_tokens`: UUID id, site_id FK, SHA-256 token_hash unique, scopes, created_by verified subject, created_at, expires_at, revoked_at. Store only the hash; return the plaintext once. Default lifetime is 15 minutes, with a maximum of one hour. Allowed scopes are content:preview and schema:read; minting defaults to both, and callers can request either alone. No token can authorize writes or mint other tokens.

Protected management routes `POST /api/v1/sites/:siteId/preview-tokens` and `DELETE /api/v1/sites/:siteId/preview-tokens/:tokenId` require a verified Auth0 organization session, site ownership, content:preview permission, and same-origin/CSRF protection. A member with that permission may revoke any token for the owned site; the plaintext is never listed. Request creation fields are optional scopes and optional expires_in_seconds; enforce bounds before writing. Return 201 `{id,token,scopes,expires_at}` or 204 on authorized idempotent revocation, with private,no-store. This is a small control-plane addition, not an exception allowing mutation through the public content routes.

For preview=true, validate the bearer format/hash, expiry, revocation, scope, and requested site on every origin request before reading content or considering conditional headers. Return 401 for absent/unknown/expired/revoked credentials, 403 for a valid token with wrong site or missing scope, and 404 for an authorized resource that does not exist. Never accept a token in query strings or cookies. Revocation is checked against the database without a positive authentication cache.

An Authorization header on preview=false does not enable preview: return published content with private,no-store and no ETag. An ordinary Auth0 browser session cookie does not enable preview either; public routes do not read sessions or emit session cookies. SDK preview mode always adds preview=true. Logs, errors, generated files, and analytics omit Authorization and token material. Document server-side preview use as the default; browser use deliberately exposes its short-lived token to that browser and must remain in a trusted preview context.

### Cache-Control, ETag, and CORS

For anonymous published GET/HEAD 200 responses, send:

- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: public, max-age=0, s-maxage=60, must-revalidate`
- `ETag: W/"<sha256 of canonical representation bytes>"`
- `Vary: Accept-Encoding, Authorization`
- `Access-Control-Allow-Origin: *` and exposed ETag/Cache-Control headers, without Access-Control-Allow-Credentials.

Use a weak representation ETag so content encoding does not imply byte-identical compressed transfers. Parse If-None-Match including lists, weak validators, and wildcard according to HTTP semantics. A match yields 304 without a JSON body, preserving ETag, cache, Vary, and CORS headers. HEAD uses GET's status/headers and no body. A draft save leaves the public representation and ETag unchanged; publish, slug/cardinality change, or deletion changes affected representations when their JSON changes. Identical JSON after a republish may retain the same ETag.

Preview, schema exports, token management, credential-bearing content requests, and all errors use `Cache-Control: private, no-store`, emit no ETag, and never return 304. Preview and schema-export requests ignore If-None-Match only after authentication. Explicitly disable framework data/route caches for private paths, and use a shared reader that never caches preview results under public keys. Reverse-proxy/CDN configuration must include path/query and Vary semantics, bypass preview=true/Authorization/private paths, and never cache errors or Set-Cookie responses. Do not rely solely on Vary to protect draft data.

No stale-while-revalidate or stale-if-error is advertised. Without a deployment-specific purge, existing edge responses may remain fresh for up to 60 seconds after publication/deletion. Receiver documentation must distinguish this from immediate origin freshness: a rebuild that must read the new snapshot sends `Cache-Control: no-cache` and uses a CDN configured to revalidate such requests, or explicitly reads the origin. An optional request option on SDK methods exposes this revalidation request; it is not a provider-specific purge guarantee.

Support OPTIONS without content or authentication side effects. Anonymous public reads use wildcard CORS. Browser preview uses a deployment-managed per-site origin allowlist and responds only for a matching origin, with `Vary: Origin, Authorization, Accept-Encoding`; allow Authorization, If-None-Match, and Cache-Control headers and GET/HEAD/OPTIONS methods, never cookies. Schema export is intended for CLI/server use and does not enable browser CORS by default. Public POST/PATCH/DELETE return 405 with Allow and no-store. Use the core safe JSON error envelope `{error:{code,message}}` and sanitize 500/503 failures.

### Schema export for type generation

Add `GET /api/v1/public/:siteId/schemas`, requiring the opaque site token's schema:read scope even though the route prefix is public. Return:

```json
{"version":1,"site_id":"uuid","schema_digest":"sha256","collections":[{"collection_key":"hero_section","is_singleton":true,"spec_definition":{"version":2,"fields":[]}}]}
```

Envelope version 1 is the export protocol; it does not override each spec_definition's own v1/v2 version. Use one consistent schema snapshot, sort collections by key, and compute a digest from site identity and canonical collection definitions/cardinality. Export no entry content, credentials, domain/repository/webhook configuration, or internal token records. Schema defaults are already content-contract data and must not be used to store secrets. A schema:read-only token cannot preview content, and a content:preview-only token cannot export schemas. No unprotected metadata endpoint is needed.

Export current definitions, not historical publication-time schema revisions: 002 already requires compatibility checks against both working and published values. The CLI types represent these current definitions; users regenerate after schema changes. Future breaking field-contract versions must be explicitly supported; do not erase unknown types to any.

### SDK workspace and runtime behavior

Add `packages/client` for `@content-studio/client` and `packages/cli` for package `content-studio` with bin `content-studio`. Use npm workspaces around the application layout established by 001, preserving its run/build commands. Keep the SDK package independently packable; CLI/server schema tooling is not imported into its runtime bundle. Build tools and TypeScript are development dependencies only. Produce ESM JavaScript with package exports and .d.ts, no runtime dependencies or required peers. Document modern native-fetch browser/edge runtimes and Node.js 22+; consumers need no ts-node, provider SDK, Auth0 package, or Zod.

`createContentClient<ContentStudioCollections>({siteId,baseUrl,previewToken?})` returns promises typed as the map or selected key's value. Export reusable ContentEntry<T> and conservative JsonValue types. The generic map determines exact getCollection keys and nullable singleton/array results. Without a generic use a safe record of nullable entries or entry arrays with JSON-compatible data, never any. This generic supplies static assertions, not runtime field validation.

Require baseUrl as the deployment origin with an optional path prefix; do not bake in a hosted service URL. Reject credentials/query/fragment and non-HTTPS URLs except explicit localhost HTTP development origins. Validate site UUID. Normalize trailing slashes and append encoded site/key segments beneath the supplied prefix without discarding it. Construct routes internally; user content is never a full request URL. Reject malformed collection keys before fetch.

Both methods optionally accept `{revalidate?: boolean}`; revalidate true requests `cache: 'no-cache'` and Cache-Control:no-cache for a published read. Preview always sets cache:no-store, Authorization, and preview=true irrespective of that option. Use credentials:omit and redirect:error, and a 10-second abort timeout, clearing timers after completion. No built-in retries, global cache, or conditional ETag cache is required; browser/edge transport and callers own caching. As the SDK never sends If-None-Match itself, a raw 304 with no body is a response error, not empty content.

Reject invalid configuration synchronously; request failures reject with ContentStudioError containing a stable code, safe message, optional HTTP status, and server error code when known. Distinguish configuration, HTTP, network, timeout, and invalid_response. Parse JSON safely, check top-level collection/map and entry-envelope shapes, and preserve null. Do not pretend to validate every schema field at runtime. Never attach a raw request, token, URL credentials, response body, or third-party exception message to public errors. Do not fall back to public data after failed preview authentication.

### Typegen CLI and strict declaration mapping

`npx content-studio typegen --site <siteId>` uses CONTENT_STUDIO_BASE_URL and CONTENT_STUDIO_PREVIEW_TOKEN; --base-url overrides the origin and --out overrides `./content-studio.d.ts`. Credentials are environment-only, not a --token flag or query parameter. An explicitly present invalid flag value fails instead of falling back silently. `--check` compares expected bytes to the existing file without writing and exits nonzero on missing/stale output. Other commands/unknown flags return usage errors. No package install/publication or local app configuration is performed by typegen.

The Node CLI uses native fetch with a 10-second timeout, redirects disabled, and a 5 MiB streamed schema-response limit. Validate export identity/version, digest, all field definitions, recursion limits, and unique keys before emitting. Bundle any shared contract-validation tooling into the CLI distribution or declare its own dependencies; do not introduce runtime dependencies into @content-studio/client to share server validators. Fetch and generate entirely before opening the target file.

| Contract field | Declaration value |
| --- | --- |
| v1 string / v2 string or text | string |
| rich_text | string (sanitized HTML; doc comment) |
| v1 date | string (ISO calendar date; doc comment) |
| image | string (URL/path unchanged) |
| number / currency_input | number (minor-unit doc comment for currency) |
| boolean | boolean |
| color_token | Union of declared token keys |
| array | Recursive item type[] |
| object | Strict named properties from recursive fields |
| required false | Optional property with ?, no implicit null |

Defaults do not make optional fields required: preexisting entries may omit them. Generate exported interfaces for top-level entry data and nested objects, plus a local exported `ContentStudioEntry<T>` interface matching id/slug/data and a `ContentStudioCollections` interface mapping quoted keys to nullable singleton entries or entry arrays. These declarations import no runtime code and can be used as the SDK generic. Do not add permissive index signatures, any, or broad unknown fallbacks to generated site types.

Sort collections and field declarations canonically while retaining type semantics. Derive interface names from collection/field paths, escape property/literal strings, avoid reserved identifiers, and add stable hash suffixes for name collisions. Do not copy untrusted labels into comments; emit only generator-owned comments with sanitized provenance, digest, generator format version, and relevant value-format notes. No timestamps, token values, sample content, or locale-dependent formatting appear in output.

Write through a same-directory temporary file and atomic rename after successful fetch/validation/emission; clean the temporary file on failure. Always refuse a symlink target; replacing an existing non-generated regular file requires explicit --force; --check never modifies output. An existing generated file is replaceable without a prompt for repeatable CI use. Test the generated file with strict TypeScript consumer fixtures; generation itself requires no frontend dependency or tsconfig changes.

Example consumer usage (documentation only):

```ts
import { createContentClient } from '@content-studio/client';
import type { ContentStudioCollections } from './content-studio';
const content = createContentClient<ContentStudioCollections>({siteId, baseUrl});
const all = await content.getAll();
const stories = await content.getCollection('testimonials');
```

### Delivery compatibility and rollout

The SDK and typegen operate on both the core v1 Jaz Singh fixture and 002 v2 nested/widget fixtures. Image values stay strings; consumers resolve site-relative paths using their own website origin rather than the Studio origin. No trainer-specific testimonial reshaping or auto-injection into the sibling repository is included.

The package names and bin command follow the user's requested interface. Produce tarballs and verify local execution first; npm account permissions, registry-name availability, versioning, and actual publication are a separate release action. Until released, test the requested CLI behavior via the local packed package. The implementation must not claim that an unshipped command is already available on the public registry.

## Risks / Trade-offs

- [Draft leakage through cache or projection reuse] → Separate public/preview projections, authenticate first, no-store every private path, and exercise the deployed cache configuration.
- [An entry's working status hides its published snapshot] → Public readers key off snapshot existence and return published data/slug even after a draft save.
- [Cached deletion remains visible temporarily] → Bound shared freshness to 60 seconds and document origin/no-cache reads for rebuilds requiring immediate freshness.
- [Large all-content responses] → Preserve complete-response semantics without silent truncation; measure representative site payloads and document performance before considering a future paginated API.
- [Generated declarations become stale] → Digest provenance, --check CI workflow, compatibility validation, and explicit regeneration guidance; static types are not a runtime guarantee.
- [Browser preview token exposure] → Short expiry/revocation, server-side preview examples, no URL tokens, and an explicit origin allowlist for browser preview.
- [Package names require registry ownership] → Keep artifacts locally testable and treat registry publication as a separate release step.

## Migration Plan

1. Implement and validate 001/002, then add token storage/indexes and lifecycle endpoints without modifying existing content snapshots.
2. Deploy schema export and public/preview readers; verify no-store paths bypass framework and CDN caching, public CORS, token revocation, conditional requests, and the 60-second freshness bound.
3. Build workspace SDK/CLI tarballs and validate clean Node/browser/edge consumers with generated v1/v2 types and --check.
4. Document API examples, preview-token provisioning, cache/rebuild integration, package installation from local artifacts, and schema regeneration. Registry publication and external-site adoption remain separate actions.
5. Roll back by disabling new routes and token issuance/revoking issued tokens; preserve schema/content snapshots and token audit records. Purge any deployment cache for removed routes or wait out its documented bound. Do not revert the 002 publication model to expose working data.
