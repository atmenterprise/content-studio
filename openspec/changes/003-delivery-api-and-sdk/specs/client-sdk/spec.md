# Spec Delta

## Purpose

Provide a small typed delivery client that external websites can use without runtime dependencies or framework coupling.

## ADDED Requirements

### Requirement: Client helper and methods
The @content-studio/client package SHALL export createContentClient({siteId,baseUrl,previewToken?}) returning getAll() and getCollection(key). getAll SHALL resolve to the API's keyed object; getCollection SHALL resolve to that collection's entry, null, or array without extra wrapping or flattening.

#### Scenario: Read a singleton and collection
- **WHEN** a consumer calls getAll() and getCollection('testimonials')
- **THEN** both use the configured site and the collection result matches the corresponding key from getAll()

### Requirement: Typed collection mapping
The helper SHALL accept a generated site collection-map type so getAll() and literal-key getCollection() infer exact singleton/collection and nested field types. Unknown keys SHALL fail type checking for typed clients. Untyped clients SHALL remain usable through conservative JSON-compatible types without implicit any.

#### Scenario: Strict consumer compile
- **WHEN** a consumer supplies the generated map and requests an unknown collection or treats a collection array as a singleton
- **THEN** TypeScript reports an error
- **AND** valid known-key access compiles under strict mode

### Requirement: Automatic private preview requests
A supplied previewToken SHALL cause both methods to send preview=true and Authorization: Bearer credentials, omit cookies, and request no-store. Without a token, methods SHALL request published content. Tokens SHALL never appear in URLs, logged messages, or thrown errors; redirects SHALL NOT forward credentials to another origin.

#### Scenario: Use preview mode
- **WHEN** a token-configured client calls getCollection('hero_section')
- **THEN** the request uses the bearer header and preview query, bypasses caches, and returns working content

### Requirement: Dependency-free portable runtime
The SDK SHALL have zero runtime package dependencies, use native fetch, and include JavaScript and TypeScript declarations without a consumer build-time compiler requirement. It SHALL work in browser, Node.js, and edge runtimes with native fetch and SHALL NOT import server-only modules or provider SDKs.

#### Scenario: Install the packed SDK
- **WHEN** the package tarball is installed into clean browser and Node consumer fixtures
- **THEN** imports and both methods work without runtime dependency installation or global SDK setup

### Requirement: Predictable failures and request handling
The SDK SHALL validate configuration, safely encode path segments, and reject HTTP, network, timeout, or invalid-response failures with a documented ContentStudioError. HTTP failures SHALL retain safe status/code information. It SHALL NOT silently fall back to published content after preview authentication fails.

#### Scenario: Preview token expires
- **WHEN** preview delivery returns 401
- **THEN** the client rejects with a safe 401 error and performs no anonymous fallback request

#### Scenario: Invalid JSON or unavailable service
- **WHEN** a request times out, fails at the network layer, or returns malformed JSON
- **THEN** the client rejects with the corresponding safe error category instead of returning partial or fabricated content
