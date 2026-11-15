# Spec Delta

## Purpose

Offer contextual inline AI copy suggestions for text fields while preserving editor control, tenant authorization, and content validation.

## ADDED Requirements

### Requirement: Inline supported actions
The renderer SHALL show an accessible sparkle action beside editable text_input, textarea, and rich_text widgets, including their v1 equivalents. It SHALL offer Improve Conversion, Shorten, Fix Grammar, and Generate SEO Meta. Unsupported widgets SHALL have no AI action. Read-only or unauthorized fields SHALL not initiate generation.

#### Scenario: Open field actions
- **WHEN** an authorized editor activates the sparkle button by pointer or keyboard
- **THEN** all four actions are available with that field's context and current unsaved text

### Requirement: Authorized refinement endpoint
POST /api/v1/ai/refine SHALL require a verified Auth0 organization session, site ownership, content:write and content:ai permissions, and same-origin protection. It SHALL accept a strict field-address/action/current-text request, verify the schema field and supplied domain/label context, and derive authoritative context from stored records. Preview tokens SHALL NOT authorize AI generation.

#### Scenario: Reject foreign context
- **WHEN** a request references another organization's site/entry or an unsupported schema field
- **THEN** it is rejected before any provider request and no content is exposed

### Requirement: Contextual bounded suggestions
Refinement SHALL send only the authorized site's domain, field label/type/constraints, selected action, and current field text to a configured server-side model. Responses SHALL use a validated structured suggestion. Generate SEO Meta SHALL propose a single meta-description text of at most 160 characters without creating fields or changing schema.

#### Scenario: Generate SEO text
- **WHEN** an editor chooses Generate SEO Meta
- **THEN** the response proposes one field-compatible meta description within the field's constraints and the 160-character limit
- **AND** it does not invent or persist separate SEO fields

### Requirement: Safe output and non-persistence
Suggested text SHALL satisfy the current field's validation before it is offered as applicable. Rich-text suggestions SHALL be sanitized with the Phase 2 allowlist; plain text SHALL never be injected as executable HTML. The endpoint SHALL NOT save entries, publish, dispatch webhooks, or crawl the site's domain.

#### Scenario: Unsafe provider output
- **WHEN** a model returns disallowed HTML, malformed structured data, or a suggestion outside field constraints
- **THEN** the output is sanitized and revalidated or rejected without changing content

### Requirement: Review apply discard and undo
The UI SHALL show original text and suggestion with Apply and Discard controls. Apply SHALL update only the local field and mark it dirty; Undo SHALL restore its previous local value. Save draft and Publish SHALL remain explicit. A response SHALL not apply after the user edits, reorders, switches, or removes its target field.

#### Scenario: User types during generation
- **WHEN** a suggestion arrives after the editor has changed that field
- **THEN** it is marked stale and cannot overwrite the newer text

#### Scenario: Accept and undo
- **WHEN** an editor applies then undoes a suggestion
- **THEN** the local original is restored without a persistence request or webhook

### Requirement: Limits privacy and failure states
Refinement SHALL enforce bounded input/output, timeout, and per-user/site request limits. Provider credentials and field text SHALL remain out of logs and public caches. The UI SHALL handle unavailable configuration, rate limits, refusals, network/provider failures, and cancellation without losing the local draft.

#### Scenario: Provider unavailable or rate-limited
- **WHEN** a request cannot complete because of configuration, timeout, refusal, or request limits
- **THEN** a safe actionable error is shown and the editor can continue writing with its existing text unchanged
