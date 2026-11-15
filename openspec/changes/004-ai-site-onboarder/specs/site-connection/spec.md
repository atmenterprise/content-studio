# Spec Delta

## Purpose

Connect a reviewed repository content specification to Content Studio and optionally prepare a reviewable SDK integration branch without disrupting the original checkout.

## ADDED Requirements

### Requirement: Explicit reviewed provisioning
Only an explicit --apply invocation SHALL POST a locally reviewed content-spec.json to /api/v1/onboard. Apply SHALL revalidate the exact file, require an Auth0 organization-scoped content:onboard token, and SHALL NOT regenerate extraction results. Preview/schema-read tokens and site API keys SHALL NOT substitute for onboarding authentication.

#### Scenario: Apply an edited review file
- **WHEN** a user runs --apply after reviewing and editing content-spec.json
- **THEN** the validated file bytes are submitted without another model call
- **AND** invalid input blocks all provisioning

### Requirement: Resumable apply state
The CLI SHALL record a secret-free receipt with endpoint, payload digest, site/schema IDs, counts, and stage status after verified provisioning. Repeated apply SHALL follow server upsert/insert-only semantics and preserve existing content. A refactoring failure SHALL NOT trigger automatic site deletion or conceal successful remote provisioning.

#### Scenario: Provision succeeds but integration fails
- **WHEN** provisioning commits and typegen or installation later fails
- **THEN** the CLI reports the remote site as provisioned, preserves recovery details, and leaves the original checkout unchanged

### Requirement: Optional isolated integration branch
Only --apply --refactor SHALL create an integration branch, default feat/connect-content-studio, in an isolated Git worktree. It SHALL refuse conflicting branch names, stale source mappings, or unrelated dirty target work. It SHALL install @content-studio/client, run authenticated Phase 3 typegen, and produce reviewable changes without committing, pushing, or deploying.

#### Scenario: Prepare connection changes
- **WHEN** a clean supported Git repository is applied with refactoring enabled and valid schema credentials
- **THEN** a separate worktree contains the branch, SDK dependency/lockfile changes, generated declarations, connection configuration, and source edits
- **AND** the caller's original branch and files remain intact

### Requirement: Source-preserving refactoring
Refactoring SHALL use verified source mappings and syntax-aware transforms for supported React/HTML patterns, retain original copy/media as fallback defaults, and preserve styling, accessibility, event handlers, routing, and dynamic expressions. Ambiguous transformations SHALL remain unapplied with manual guidance rather than using unrestricted model-authored patches.

#### Scenario: Preserve interactive content
- **WHEN** a literal inside an interactive component is connected to delivery data
- **THEN** its original fallback, classes, handlers, and accessibility relationships remain valid
- **AND** unsupported expressions are listed rather than rewritten

### Requirement: Fallback and activation behavior
Generated integration SHALL use published delivery and contain no preview, onboarding, or provider credentials. Remote-content activation SHALL default off until the user publishes and explicitly enables it. When enabled, request failure or absent singleton data SHALL use local defaults; a successfully delivered empty collection SHALL remain empty.

#### Scenario: Newly provisioned draft site
- **WHEN** a draft-seeded site receives an integration branch
- **THEN** the original site content continues rendering before publication/activation

#### Scenario: Intentional empty collection
- **WHEN** activated delivery successfully returns an empty collection
- **THEN** the frontend renders that empty collection rather than restoring old fallback items

### Requirement: Honest validation and recovery status
The integration report SHALL distinguish parsed, generated, installed, checked, skipped, and failed work. Repository scripts SHALL run only when explicitly enabled. Structural checks SHALL be mandatory; missing or unrun build/browser checks SHALL never be reported as passed. Failed checks SHALL leave inspectable worktree changes without rewriting the original checkout.

#### Scenario: Checks cannot run
- **WHEN** a target lacks a supported package manager or build checks are not enabled
- **THEN** the report records the limitation and does not claim the branch is production-ready
