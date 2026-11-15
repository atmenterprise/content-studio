# Proposal

## Why

External websites need a stable way to consume the published content managed by Content Studio without depending on editor tables or application-specific endpoints. A small typed client and deterministic type generator will make integration straightforward while keeping draft content private.

## What Changes

- Add anonymous read-only all-content and single-collection REST endpoints with singleton/object and collection/array responses derived from published snapshots.
- Add site-scoped, expiring and revocable preview tokens; `preview=true` returns working content only after token validation and always bypasses caching.
- Add deterministic JSON representations, ETags, conditional requests, explicit edge-cache freshness limits, and cross-origin read support.
- Add a dependency-free TypeScript `@content-studio/client` package exposing `createContentClient({siteId,baseUrl,previewToken?})`, `getAll()`, and `getCollection(key)` in browser and server environments with native fetch.
- Add an authenticated schema-export endpoint and the `content-studio` CLI package with `npx content-studio typegen --site <siteId>` to generate strict, site-specific `content-studio.d.ts` declarations.
- Document public/preview integrations, schema drift, cache freshness, and safe token handling; provide package artifacts and local installation checks without publishing to npm during implementation.
- Exclude public write operations, GraphQL, query builders, runtime validation generated into the SDK, automatic edits to consumer repositories, and deployment-specific CDN purge integrations.

## Capabilities

### New Capabilities

- `delivery-api`: Published and preview delivery representations, token access, HTTP caching, and cross-origin behavior.
- `client-sdk`: Dependency-free delivery client, typed methods, configuration, and error behavior.
- `type-generation`: Authenticated schema export and deterministic strict TypeScript declarations through the CLI.

### Modified Capabilities

None in the current main-spec inventory. Related database, field-contract, and publishing capabilities exist only in the pending 001/002 changes; this proposal adds their delivery consumers without rewriting those changes.

## Impact

Implementation requires `001-content-studio-core` and `002-dynamic-form-renderer` first. It adds Next.js read routes, token lifecycle routes/storage, cache configuration, package workspace/build outputs, SDK declarations, and a separate CLI package. Public delivery consumes 002's published snapshots even when working status is draft. Preview tokens are separate from Auth0 sessions, site API keys, and webhook signing secrets.

The repository currently contains planning only and no package workspace or application code. The sibling trainer site's fixed-project public API and fetch hooks are integration references, not migration targets. This change plans the API and packages; it does not publish packages or modify that site.
