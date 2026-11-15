# Spec Delta

## Purpose

Expose stable, cacheable published content to external websites while isolating authenticated draft previews from public delivery.

## ADDED Requirements

### Requirement: Published delivery routes
GET /api/v1/public/:siteId/content SHALL return content keyed by collection_key. GET /api/v1/public/:siteId/content/:collectionKey SHALL return that key's value. Each entry SHALL be an object containing id, slug, and data. Singletons SHALL return an entry or null; non-singletons SHALL return arrays. Known empty schemas SHALL return null or [] respectively.

#### Scenario: Read a complete site
- **WHEN** an anonymous client requests a site with a singleton and a repeating collection
- **THEN** it receives a keyed object containing the singleton entry and the collection array with deterministic ordering
- **AND** user fields remain under data, without collision with metadata

#### Scenario: Missing and empty resources
- **WHEN** a client requests a known empty schema, an unknown site, or an unknown collection
- **THEN** the empty schema returns 200 with null or [], and unknown resources return 404

### Requirement: Published snapshot isolation
Public responses SHALL contain only last-published data and slugs, including when an entry's working status has become draft. Never-published entries SHALL be absent. Reads SHALL be site-scoped and SHALL NOT expose drafts, organization metadata, secrets, provider configuration, or webhook state.

#### Scenario: Draft after publication
- **WHEN** an entry with a published snapshot receives a draft data or slug change
- **THEN** public delivery continues returning the previous published values and its ETag remains unchanged

#### Scenario: Separate sites
- **WHEN** a client requests one site's content
- **THEN** entries and schemas belonging to other sites cannot appear in the result

### Requirement: Token-authenticated working preview
Requests with preview=true SHALL require a valid site-scoped bearer preview token and return current working copies, including draft-only entries and newer drafts of published entries. Preview SHALL NOT merge published and working copies of an entry. Missing, expired, or revoked tokens SHALL return 401; a valid token for another site SHALL return 403.

#### Scenario: Preview working content
- **WHEN** a valid token requests preview=true for its site
- **THEN** the response uses the same shape as public delivery but contains working data and slugs

#### Scenario: Reject a preview before conditional handling
- **WHEN** an expired token requests preview=true with If-None-Match
- **THEN** the response is 401 with no draft body and no 304 response

### Requirement: Preview token lifecycle
Verified organization members with content:preview permission SHALL be able to create and revoke site-scoped preview tokens with explicit content:preview and/or schema:read scopes. Tokens SHALL expire within one hour, be returned in plaintext once, and be stored only as hashes. Tokens SHALL NOT authorize editing, publishing, or other sites.

#### Scenario: Revoke a token
- **WHEN** an authorized owner revokes a preview token
- **THEN** its next origin request is rejected even if it was previously valid

### Requirement: HTTP cache behavior
Anonymous published 200 responses SHALL include Cache-Control and a representation ETag. Matching If-None-Match SHALL return bodyless 304 with cache headers. Public shared freshness SHALL be at most 60 seconds with mandatory revalidation thereafter. Preview, schema-export, credential-bearing, and error responses SHALL use private, no-store and SHALL NOT emit ETags or 304s.

#### Scenario: Conditional published read
- **WHEN** an anonymous client presents the current representation's ETag
- **THEN** the API returns 304 without a body
- **AND** a changed publication or deletion produces a changed representation ETag at origin

#### Scenario: Isolate cached previews
- **WHEN** a preview response is followed by an anonymous published request
- **THEN** no shared cache can serve the preview body to the anonymous request

### Requirement: Read-only cross-origin transport
Public content routes SHALL support GET, HEAD, and OPTIONS, reject content mutations with 405, and allow anonymous cross-origin reads without cookies. Browser preview access SHALL require an explicitly allowed origin and bearer authorization. Invalid query parameters SHALL return 400 with a safe structured error and no cacheable body.

#### Scenario: Browser integration
- **WHEN** an external website fetches published content without cookies
- **THEN** CORS permits reading JSON and exposed ETag/cache headers
- **AND** a POST to the same content route cannot mutate records
