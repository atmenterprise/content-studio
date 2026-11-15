# Spec Delta

## Purpose

Connect annotated website elements to exact structured editor fields through an optional, authenticated-context visual preview workflow.

## ADDED Requirements

### Requirement: Optional SDK field instrumentation
The SDK SHALL provide an optional attribute generator emitting data-cs-field="collectionKey.fieldName". Companion metadata SHALL identify collection entries and nested field paths where the simple marker is insufficient. Instrumentation SHALL preserve normal page semantics, server rendering, and the SDK's zero-runtime-dependency contract.

#### Scenario: Instrument a singleton and repeating entries
- **WHEN** a consumer annotates a singleton title and two testimonial titles
- **THEN** the singleton marker identifies its field and entry metadata distinguishes the testimonials without changing their content

### Requirement: Explicit visual-mode activation
Highlighting and click interception SHALL activate only when cs_visual_edit=true, the page is framed, and the bridge completes a trusted Studio handshake. Outside this mode the annotations SHALL remain inert. Highlighted fields SHALL support pointer and keyboard selection without enabling arbitrary DOM/content mutation.

#### Scenario: Normal browsing
- **WHEN** an annotated site is opened normally or standalone with the visual flag
- **THEN** normal interactions remain unchanged and no visual-selection event is sent

#### Scenario: Select a highlighted link
- **WHEN** a trusted visual session selects an annotated link or text element
- **THEN** selection sends a field-address event to Studio and does not follow that link or save content

### Requirement: Verified iframe message protocol
The bridge SHALL use versioned window.postMessage envelopes with exact target origins, site identity, and a navigation-scoped nonce. Studio SHALL verify origin, source window, message shape, site, and active nonce before processing. Messages SHALL NOT carry instructions to execute scripts, persist content, or grant authorization.

#### Scenario: Ignore forged or outdated messages
- **WHEN** a message comes from another origin/window, a prior navigation, or an invalid payload
- **THEN** Studio ignores it without selecting a field, reading another site's data, or changing content

### Requirement: Exact field focus
A valid selection SHALL open the authorized schema and entry, expand nested form controls, scroll the matching field into view, and focus its actual input or rich-text editing surface. Collection entry identity SHALL be required when ambiguous. Stale nested-array bindings SHALL be rejected rather than focusing a different item.

#### Scenario: Select nested content
- **WHEN** an annotated nested item has a valid entry ID, field path, and matching entry fingerprint
- **THEN** the renderer expands its repeater ancestors and focuses that exact item's input

#### Scenario: Missing or stale target
- **WHEN** an entry is deleted, a path no longer exists, or its array fingerprint is stale
- **THEN** Studio reports that the preview needs refreshing without selecting a different field

### Requirement: Split preview and dirty-form protection
Studio SHALL provide a responsive split-screen iframe beside the existing renderer, with loading, disconnected, blocked-framing, and refresh states. Selection of another entry SHALL honor existing dirty-form confirmation. Closing/changing the preview SHALL dispose listeners and session state. Clicking SHALL NOT discard edits or publish content.

#### Scenario: Switch entry while dirty
- **WHEN** an iframe click targets another entry and the editor declines discarding local changes
- **THEN** the current form and field values remain intact

### Requirement: Private preview session handling
Published preview SHALL require no delivery credentials. Saved-draft preview SHALL use an explicitly authorized, short-lived Phase 3 content:preview token delivered only to the trusted frame after handshake. Tokens SHALL remain out of URLs, DOM markers, persistent storage, logs, and public caches. Expired credentials SHALL not silently downgrade draft preview to published mode.

#### Scenario: View saved drafts
- **WHEN** an authorized editor enables saved-draft preview on an integrated site
- **THEN** its SDK fetches private working content using the transient token and no-store
- **AND** expiration shows a reconnect state rather than silently switching content modes
