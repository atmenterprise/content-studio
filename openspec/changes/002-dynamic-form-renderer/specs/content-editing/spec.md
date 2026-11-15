# Spec Delta

## Purpose

Let authorized editors manage singleton and repeating content through interfaces derived from each site's registered schema definitions.

## ADDED Requirements

### Requirement: Authorized schema-driven editing
The system SHALL render registered field labels, widgets, defaults, and validation rules without hardcoded collection names. All reads and writes SHALL verify the active Auth0 organization, site, and schema. Writes SHALL require content:write permission, and publishing SHALL additionally require content:publish. Cross-tenant identifiers SHALL return 404 without leaking content.

#### Scenario: Edit an arbitrary collection
- **WHEN** a permitted editor opens a newly registered schema
- **THEN** its fields render without application changes and valid writes affect only that site's records

#### Scenario: Reject unauthorized writes
- **WHEN** a caller lacks a valid session, required permission, or site ownership
- **THEN** the request returns 401, 403, or 404 respectively and persists no changes

### Requirement: Singleton form view
A singleton schema SHALL open its entry form directly without a collection table. If no entry exists, the system SHALL show a blank form with declared defaults and create the first entry on save. Concurrent creation SHALL never persist a second entry. Singleton duplication SHALL be unavailable.

#### Scenario: First singleton save
- **WHEN** an editor saves a previously empty hero_section or global_settings singleton
- **THEN** one entry is created and reopening the schema loads it directly

### Requirement: Searchable collection table
Non-singleton schemas SHALL show a paginated data table with slug, status, updated time, and schema-derived summary fields. Search SHALL match slug and textual content; filters SHALL include draft/published status. Search and filters SHALL apply to the complete authorized collection before pagination, with distinct loading, empty, no-match, and retry states.

#### Scenario: Filter beyond the first page
- **WHEN** the user searches and filters a collection containing more than one page
- **THEN** all matching authorized records are eligible for results and result counts reflect the filtered set

### Requirement: Collection entry actions
Collections SHALL support Create, Edit, Duplicate, and confirmed Delete. Creation SHALL default to draft unless explicitly published; duplication SHALL always produce an independent draft with a unique slug. Duplication SHALL deep-copy nested values without publishing or copying publication/delivery state. Delete SHALL require publication permission for an entry with a published snapshot.

#### Scenario: Duplicate a published entry
- **WHEN** an editor duplicates a published pricing plan
- **THEN** a new draft with independent nested values and a new slug is created without a webhook event

#### Scenario: Delete cancellation
- **WHEN** an editor cancels the deletion confirmation
- **THEN** the entry and its publication state remain unchanged

### Requirement: Nested repeaters
Array and object fields SHALL render recursive repeater_list controls. Editors SHALL be able to add and remove permitted nested values and drag-reorder array items, with equivalent keyboard controls. Saved arrays SHALL preserve user order; objects SHALL preserve declared field identities and types. Validation errors SHALL remain associated with the correct nested values after edits.

#### Scenario: Reorder nested items
- **WHEN** a user adds, removes, and reorders objects within an array using pointer or keyboard controls
- **THEN** reopening the entry preserves the saved order and nested values without leaking editor-only item identifiers into content

### Requirement: Conflict and dirty-state protection
Updates and deletes SHALL detect stale entry versions and updates SHALL detect changed schema definitions. Conflicts SHALL return 409 and preserve the editor's local work for reconciliation. Navigation away from unsaved work SHALL request confirmation. Unsupported or invalid definitions SHALL show an actionable error and block saving.

#### Scenario: Concurrent edits
- **WHEN** a user saves an entry changed by another editor or validated against a replaced schema
- **THEN** the write returns 409 without overwriting persisted values and the local draft remains available

#### Scenario: Switch site with unsaved work
- **WHEN** an editor changes sites while a form is dirty and rejects discarding changes
- **THEN** the current site and form values remain selected
