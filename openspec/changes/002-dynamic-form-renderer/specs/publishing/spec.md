# Spec Delta

## Purpose

Publish validated content snapshots and reliably notify each site's rebuild or revalidation receiver with verifiable asynchronous events.

## ADDED Requirements

### Requirement: Draft and published state
Editors SHALL be able to save drafts and publish valid entries. Draft saves SHALL preserve the last published snapshot and emit no publication event. Publishing SHALL atomically save the working entry and replace its published snapshot. Duplicates SHALL start without a published snapshot. A draft form SHALL clearly indicate whether an earlier version remains published.

#### Scenario: Edit already published content
- **WHEN** an editor saves changes to a published entry as a draft
- **THEN** the working status becomes draft while the previous published snapshot remains intact and no webhook is dispatched

### Requirement: Atomic publication events
When a publish succeeds for a site with webhook_url, the system SHALL durably enqueue one entry.published event in the same transaction. Retrying the same idempotent command SHALL NOT create another publication or event. Deleting a previously published entry with a configured webhook SHALL atomically enqueue entry.deleted. Rollback SHALL leave neither a content mutation nor an event.

#### Scenario: Publish and retry
- **WHEN** a successful publish command is retried with the same idempotency key and payload
- **THEN** it returns the original result and only one logical event exists

#### Scenario: Event persistence fails
- **WHEN** event enqueueing fails within the publish transaction
- **THEN** publication is rolled back and the editor receives an error

### Requirement: Signed asynchronous dispatch
A worker SHALL POST immutable event JSON to the site's captured webhook_url after commit using a per-site HMAC-SHA256 signing secret. The signature SHALL cover the attempt timestamp and exact body bytes. Events SHALL identify their event ID, site, schema, entry, and monotonic revision. Site API-key hashes SHALL NOT be used as signing secrets.

#### Scenario: Receiver verifies delivery
- **WHEN** the receiver checks the documented timestamp and signature against the raw request body
- **THEN** genuine deliveries verify and tampered bodies fail verification

### Requirement: Delivery retries and visibility
Delivery SHALL be at least once, use bounded retries for network failures, 429, and 5xx responses, and recover after worker interruption. The UI SHALL distinguish saved publication from pending, delivered, failed, or skipped delivery. Authorized publishers SHALL be able to retry a failed delivery without republishing content.

#### Scenario: Failed receiver and recovery
- **WHEN** a receiver is unavailable and later recovers
- **THEN** a scheduled or authorized manual retry delivers the same event ID without creating another publication

### Requirement: Receiver safety and configuration
Dispatch SHALL require HTTPS endpoints and reject private, loopback, link-local, metadata, credential-bearing, and redirected targets. Secrets SHALL remain server-side. A null webhook_url SHALL allow publication with skipped delivery; a configured URL without a usable signing secret SHALL block publication before changing content.

#### Scenario: Missing configuration
- **WHEN** a publisher saves with no webhook_url or with a URL but no signing secret
- **THEN** publication succeeds with skipped delivery in the first case and returns an actionable configuration error without changes in the second

#### Scenario: Unsafe endpoint
- **WHEN** the target resolves to a prohibited network address at dispatch time
- **THEN** no request is sent and the delivery is marked failed with a safe explanation

### Requirement: Replay and stale-event handling contract
Receiver documentation SHALL require timestamp-window validation, constant-time signature comparison, event-ID deduplication, and revision-aware handling of out-of-order deliveries. A successful delivery SHALL indicate HTTP acceptance only, not completion of a static build.

#### Scenario: Duplicate or late delivery
- **WHEN** a receiver receives the same event twice or an older revision after a newer one
- **THEN** the documented verification example suppresses duplicate side effects and prevents older data replacing newer state
