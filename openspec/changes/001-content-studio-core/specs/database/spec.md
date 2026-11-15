# Spec Delta

## Purpose

Provide a tenant-isolated registry of sites, collection definitions, and content, with validated onboarding and authorized discovery for Content Studio navigation.

## ADDED Requirements

### Requirement: Tenant-owned site records
The system SHALL persist sites with UUID id, name, domain, repo_url, webhook_url, hashed api_key, created_at, and Auth0 organization ownership. Domain SHALL be normalized and unique within an organization. Raw API keys SHALL never appear in stored records, logs, or ordinary responses.

#### Scenario: Register a site
- **WHEN** an authorized organization administrator registers a new site
- **THEN** a UUID site with that organization owner and creation timestamp is persisted
- **AND** a generated API key is returned once while only its hash is stored

#### Scenario: Same domain in separate organizations
- **WHEN** two authorized organizations register the same normalized domain
- **THEN** each receives a distinct site without access to the other's data

### Requirement: Collection schema registry
The system SHALL persist schemas with UUID id, site_id foreign key, collection_key, label, is_singleton, and JSONB spec_definition containing field definitions, validation rules, and widget mappings. A collection_key SHALL be unique within a site.

#### Scenario: Upsert an existing collection
- **WHEN** onboarding repeats a collection_key for an existing authorized site
- **THEN** its schema definition is updated while its UUID and associated content remain intact

### Requirement: Content integrity
The system SHALL persist content_entries with UUID id, site_id, schema_id, slug, JSONB data, draft or published status, and updated_at. Entries SHALL reference a schema belonging to the same site. Slugs SHALL be unique per schema; singleton schemas SHALL have at most one entry, including under concurrent writes.

#### Scenario: Reject mismatched tenant references
- **WHEN** a write references a schema belonging to another site
- **THEN** persistence rejects the write

#### Scenario: Enforce entry constraints
- **WHEN** a write duplicates a schema's slug, adds a second singleton entry, or uses an unsupported status
- **THEN** persistence rejects the write

### Requirement: Organization authorization
The system SHALL derive organization scope from verified Auth0 credentials and SHALL authorize every site, schema, and content operation within that scope. Onboarding SHALL require content:onboard permission. Client-provided site IDs or organization values SHALL NOT grant access.

#### Scenario: Unauthorized access
- **WHEN** a caller lacks valid authentication or the onboarding permission
- **THEN** onboarding returns 401 or 403 respectively and performs no writes

#### Scenario: Cross-organization site selection
- **WHEN** an authenticated caller requests a site owned by another organization
- **THEN** the system returns 404 without exposing site metadata or collection labels

### Requirement: Strict onboarding contract
POST /api/v1/onboard SHALL accept the version 1 content-spec contract defined in design.md. It SHALL reject unknown properties, invalid field or widget definitions, duplicate collection keys or seed slugs, invalid seed data, and unsupported versions before writing. An invalid JSON body SHALL return 400 and an invalid contract SHALL return 422 with field paths.

#### Scenario: Invalid seed data
- **WHEN** seed data violates its declared collection fields or validation rules
- **THEN** the endpoint returns 422 identifying the failing path and persists no changes

#### Scenario: Unsupported payload
- **WHEN** a payload contains an unknown property or unsupported version
- **THEN** the endpoint returns 422 and persists no changes

### Requirement: Atomic repeatable onboarding
Onboarding SHALL atomically create or update a site, upsert submitted schemas, and insert missing seeds. Repeated requests SHALL preserve site and schema IDs and existing entry data, status, and timestamps. Omitted collections and entries SHALL remain. Schema updates incompatible with existing entries SHALL return 409 without changes.

#### Scenario: First onboarding succeeds
- **WHEN** a valid authorized payload targets a new organization/domain pair
- **THEN** the endpoint returns 201 with site_id, schema identifiers, creation counts, and a one-time API key after all records commit

#### Scenario: Retry and concurrent onboarding
- **WHEN** valid requests target the same organization/domain pair and seed identities
- **THEN** one logical site and one copy of each seed exist, and subsequent successful requests return 200 without rotating the API key

#### Scenario: Incompatible schema or failed persistence
- **WHEN** a schema update invalidates existing entries or persistence fails during onboarding
- **THEN** the entire operation rolls back and returns 409 for incompatibility or a sanitized 500 for persistence failure

### Requirement: Site switcher and schema-driven navigation
The authenticated application SHALL display a sidebar with a site switcher at the top listing only sites in the active organization. Selecting a site SHALL populate navigation from that site's schema labels and collection keys. Organization switching SHALL establish a new verified organization context before loading its sites.

#### Scenario: Switch sites
- **WHEN** the user selects another authorized site
- **THEN** the sidebar replaces the previous site's collections with the selected site's collections
- **AND** late responses for the previous selection cannot replace the current menu

#### Scenario: Empty, loading, and failure states
- **WHEN** sites or schemas are loading, absent, or fail to load
- **THEN** the sidebar shows an appropriate loading, empty, or retry state without displaying another site's collections

#### Scenario: Keyboard operation and organization switch
- **WHEN** a user operates the switcher by keyboard and changes organizations through Auth0
- **THEN** the switcher supports focus and selection, clears the previous site selection, and loads only the newly verified organization's sites


### Requirement: Reference workspace presentation
The workspace SHALL use the reference ATM branding, Plus Jakarta Sans typography, yellow accents, neutral canvas, white bordered panels, collapsible sidebar, breadcrumbs, and profile menu. The Site Switcher SHALL remain at the sidebar top. Layout SHALL support narrow screens and keyboard operation.

#### Scenario: Desktop and narrow-screen shell
- **WHEN** an authenticated user opens the workspace on desktop or a narrow screen
- **THEN** ATM Content Studio branding, authorized collection navigation, and the active site are visible without horizontal overflow
- **AND** sidebar collapse preserves accessible labels and access to the Site Switcher

#### Scenario: Breadcrumbs and profile menu
- **WHEN** the user opens an authorized collection and then the profile menu
- **THEN** breadcrumbs identify the selected site and collection and the menu shows verified identity, the site website link, organization switching, and sign-out
- **AND** Escape closes the menu and returns focus to its trigger
- **AND** no unsupported editor, project-creation, account-editing, or access-approval controls appear

### Requirement: Portable Jaz Singh onboarding example
The system SHALL provide a portable v1 content-spec example derived from the reference repository with programmes, programme_pages, testimonials, about, and specialistareas. About SHALL be a singleton. Definitions SHALL preserve the source field names, required fields, and maximum lengths using supported v1 types and widgets.

#### Scenario: Onboard the reference example
- **WHEN** an authorized organization submits the documented example with at least one representative draft seed per collection
- **THEN** five schemas and their seeds are created and their labels populate the selected site's navigation
- **AND** About Me contains one entry and the example is accepted within the 1 MiB request limit

#### Scenario: Preserve source data through adaptation
- **WHEN** the reference example is prepared and validated
- **THEN** its domain is a hostname, legacy source keys map to stable valid entry slugs, and testimonial wrapper data is flattened to declared fields
- **AND** relative image strings remain intact without fetching assets, connecting to the reference database, or importing legacy memberships

#### Scenario: Repeat onboarding without coupling other tenants
- **WHEN** the example is retried in one organization and separately onboarded in another
- **THEN** retries preserve existing records and each organization receives isolated site/schema/content identities
- **AND** the committed example works without the sibling repository at runtime or in CI
