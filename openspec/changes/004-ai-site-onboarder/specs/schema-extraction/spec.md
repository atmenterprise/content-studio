# Spec Delta

## Purpose

Convert semantic repository candidates into source-backed, human-reviewable Content Studio schema and seed artifacts using validated structured model output.

## ADDED Requirements

### Requirement: Structured provider-neutral extraction
The CLI SHALL provide OpenAI, Anthropic, and Gemini adapters with explicit provider/model selection and environment-supplied credentials. Model outputs SHALL be constrained to a structured schema and independently validated against the Phase 2 v2 field contract. Refusals, unsupported structured-output capabilities, truncation, or invalid output SHALL fail without provisioning.

#### Scenario: Extract through a selected provider
- **WHEN** a configured supported model returns valid structured results
- **THEN** the CLI accepts them only after shared contract and seed validation
- **AND** invalid results never become provisionable JSON through unvalidated text parsing

### Requirement: Logical content grouping and grounded seeds
Extraction SHALL group source-backed content into logical singleton or repeating collections, preserving original copy, media strings, nested values, and array order. Extracted seed values SHALL map to recorded source candidates. Ambiguous grouping or unsupported conversions SHALL be reported instead of inventing copy or silently dropping content.

#### Scenario: Hero and repeating testimonials
- **WHEN** source contains one hero section and a testimonial array
- **THEN** extraction proposes a singleton hero and repeating testimonials with source-backed seed values
- **AND** source ordering is represented explicitly where needed for later frontend rendering

### Requirement: Ingestion-compatible output
The final content-spec.json SHALL use the version 2 onboarding envelope and spec_definition.version 2, with extractor seedData mapped to collections[].entries. Provenance and diagnostics SHALL remain outside the strict payload. Generated seeds SHALL default to draft; extraction SHALL NOT provision, publish, or upload assets.

#### Scenario: Validate generated payload
- **WHEN** extraction succeeds
- **THEN** the generated file passes the same onboarding/field validation as Studio and contains no unsupported seedData or provenance properties

### Requirement: Human review and artifact preservation
The CLI SHALL write content-spec.json and a separate report with source mappings, coverage, assumptions, and validation results before any provisioning action. It SHALL write atomically, avoid overwriting user-edited artifacts silently, and display the next explicit apply command. Missing site metadata SHALL remain a reported blocking issue rather than fabricated production values.

#### Scenario: Metadata requires review
- **WHEN** a local source has no reliable production domain or repository URL
- **THEN** the report identifies the missing values and apply remains blocked until the reviewed file supplies valid values

### Requirement: Bounded reproducible processing
The CLI SHALL bound scan/model budgets and validation repair attempts, preserve successful review artifacts on provider failure, and record provider/model and contract versions without secrets. Identical accepted results SHALL serialize deterministically. Rerunning extraction SHALL NOT promise identical model inference or automatically apply new results.

#### Scenario: Provider timeout or exhausted budget
- **WHEN** extraction times out or reaches its configured limit
- **THEN** it reports an incomplete run, preserves previous valid artifacts, and performs no provisioning or refactoring
