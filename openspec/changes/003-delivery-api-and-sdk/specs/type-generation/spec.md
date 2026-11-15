# Spec Delta

## Purpose

Generate reproducible site-specific frontend declarations from authoritative schema definitions without exposing unpublished content or secrets.

## ADDED Requirements

### Requirement: Authenticated schema export
GET /api/v1/public/:siteId/schemas SHALL return a versioned site-scoped document containing collection_key, is_singleton, spec_definition, and a schema digest. It SHALL require a valid site token with schema:read scope, include no entry data or secrets, and use private, no-store without ETags or 304 responses.

#### Scenario: Fetch schema definitions
- **WHEN** typegen presents a valid schema:read token for the requested site
- **THEN** the export contains only that site's current v1/v2 definitions and a deterministic digest
- **AND** missing, expired, revoked, wrong-site, or insufficient-scope tokens are rejected

### Requirement: Typegen CLI command
The content-studio CLI SHALL support npx content-studio typegen --site <siteId>, resolving the API origin from --base-url or CONTENT_STUDIO_BASE_URL and credentials from CONTENT_STUDIO_PREVIEW_TOKEN. It SHALL generate content-studio.d.ts in the current directory by default, support --out, and exit nonzero on invalid configuration, authentication, fetch, schema, or write failures.

#### Scenario: Generate in a frontend repository
- **WHEN** a user runs the command with a valid site, origin, and schema-scoped token
- **THEN** the selected output file contains strict TypeScript declarations without modifying other frontend files

### Requirement: Precise field and delivery types
Generated declarations SHALL model v1/v2 string, text, image, date, number, boolean, recursive arrays and objects, color-token literals, and required/optional properties. Singletons SHALL be nullable entry objects and repeating collections SHALL be entry arrays with id, slug, and typed data. Unsupported definitions SHALL fail generation without falling back to any.

#### Scenario: Nested declaration mapping
- **WHEN** a schema contains an optional array of objects, a required currency field, and a token field
- **THEN** declarations preserve optionality and nesting, model minor units as number, and emit the declared token-key union

### Requirement: Safe deterministic output
Identical schema exports SHALL generate identical declaration bytes, independent of fetch timing or collection order. Names and property keys SHALL be escaped safely with deterministic collision handling. The file SHALL contain a provenance marker and schema digest, no tokens or entry values, and SHALL be replaced atomically only after successful generation.

#### Scenario: Invalid or hostile schema
- **WHEN** schema validation fails or a label contains code-like text
- **THEN** generation either rejects it or safely encodes it without executable output
- **AND** an existing declaration file remains untouched on failure

### Requirement: Generated SDK integration
Declarations SHALL export a ContentStudioCollections map usable as the SDK generic. The CLI SHALL offer --check to detect missing or stale output without modifying it. Documentation SHALL explain schema regeneration and that TypeScript declarations do not validate live JSON or prevent future schema drift.

#### Scenario: CI detects drift
- **WHEN** --check compares current definitions against a stale generated file
- **THEN** it exits nonzero without writing files
- **AND** an up-to-date file passes and supports strict SDK consumer compilation
