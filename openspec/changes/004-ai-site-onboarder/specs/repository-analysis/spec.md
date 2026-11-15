# Spec Delta

## Purpose

Discover source-backed website content and semantic structure from existing frontend repositories without executing their application code.

## ADDED Requirements

### Requirement: Local and Git repository inputs
The onboard-site CLI SHALL accept a local directory or supported Git URL. Local analysis SHALL preserve source files; remote analysis SHALL use a separate checkout and record its commit. Invalid paths, unsupported protocols, and failed acquisition SHALL produce actionable errors without provisioning or source changes.

#### Scenario: Analyze a local site
- **WHEN** a user runs npx onboard-site ./path-to-site
- **THEN** the CLI resolves that directory and prepares local review artifacts without changing its application files

#### Scenario: Analyze a remote repository
- **WHEN** a supported Git URL is provided
- **THEN** the CLI obtains a separate checkout without modifying the origin repository or pushing changes

### Requirement: Semantic source analysis
Analysis SHALL scan TSX, JSX, HTML, and relevant JSON, preserving headings, section relationships, visible copy, links, media references, accessibility text, and repeated data structure. Styling boilerplate SHALL be omitted from model input while original styling source remains untouched. Static import tracing SHALL NOT evaluate repository code.

#### Scenario: Strip styling without losing meaning
- **WHEN** a styled hero and JSON-backed services list are analyzed
- **THEN** candidates retain copy, media paths, section identity, and list items without class/style boilerplate
- **AND** source file locations and content hashes identify each candidate

### Requirement: Bounded file selection
Analysis SHALL respect ignore rules and exclude dependencies, build output, version-control internals, environment files, credentials, and unrelated backend/admin code by default. Files outside the resolved source root SHALL NOT be followed through symlinks. Size/count limits and skipped files SHALL appear in the coverage report rather than silently truncating content.

#### Scenario: Excluded or oversized source
- **WHEN** a repository includes environment files, external symlinks, or source exceeding scan limits
- **THEN** excluded content is not sent to the model and the report explains coverage limits without printing secrets

### Requirement: Provenance and unsupported patterns
Every extracted candidate SHALL have stable source provenance and a classification as supported, ambiguous, or unresolved. Dynamic expressions, unsupported framework syntax, and unresolvable imports SHALL remain unchanged and be reported. Repository text SHALL be treated as input data, never as instructions authorizing commands or network access.

#### Scenario: Runtime-only expression
- **WHEN** a component generates text through an unresolved function or includes instructions in a comment
- **THEN** analysis reports the expression as unresolved and does not execute the function or follow the comment's instructions
