# Spec Delta

## Purpose

Define portable, versioned field definitions that drive consistent content validation and editing across all tenant schemas.

## ADDED Requirements

### Requirement: Supported type and widget pairs
Version 2 definitions SHALL allow string with text_input, slug_input, or color_token; text with textarea or rich_text; number with number_input or currency_input; boolean with toggle_switch; image with media_picker; and array or object with repeater_list. Unknown types, widgets, properties, and incompatible pairs SHALL be rejected.

#### Scenario: Validate widget mapping
- **WHEN** a definition assigns currency_input to number and rich_text to text
- **THEN** the definition is accepted
- **AND** assigning currency_input to boolean is rejected with a field path

### Requirement: Recursive definition and value validation
Definitions SHALL declare keys, labels, required flags, optional typed defaults and bounds, and nested definitions for arrays and objects. Validation SHALL reject undeclared keys, wrong types, invalid defaults, incompatible bounds, excessive nesting, and oversized data. Client and server SHALL use equivalent rules; server validation SHALL remain authoritative.

#### Scenario: Nested validation failure
- **WHEN** an array's third object contains an invalid required title
- **THEN** validation identifies that item's title path without dropping or reordering other values

#### Scenario: Bound recursive input
- **WHEN** a definition or value exceeds the documented depth, item-count, or request-size limits
- **THEN** it is rejected predictably before persistence

### Requirement: Stable widget value formats
Slug inputs SHALL store valid lowercase hyphenated slugs, color tokens SHALL store a declared token, and currency inputs SHALL store integer minor units with declared currency and precision. Rich text SHALL store a sanitized HTML string from the documented allowlist. Image fields SHALL store a safe URL or supported site-relative asset path.

#### Scenario: Canonical values
- **WHEN** an editor enters 12.34 for a currency field with two minor digits and selects a declared color token
- **THEN** the saved values are 1234 and the token key respectively
- **AND** arbitrary token values or executable rich-text markup cannot be persisted

### Requirement: Version 1 compatibility
The system SHALL continue accepting the core v1 onboarding contract and rendering its text, textarea, number, checkbox, and date widgets through a lossless adapter. Existing stored definitions and values SHALL NOT be rewritten by merely opening an editor. Version 2 SHALL be explicitly declared and unsupported versions SHALL be rejected.

#### Scenario: Open a core fixture
- **WHEN** a v1 Jaz Singh definition or a v1 date field is loaded
- **THEN** an appropriate editable control renders and existing values round-trip without implicit type conversion

#### Scenario: Explicit version selection
- **WHEN** onboarding receives version 2 definitions with the new widget names
- **THEN** v2 validation applies
- **AND** the same definitions under version 1 are rejected rather than ambiguously interpreted
