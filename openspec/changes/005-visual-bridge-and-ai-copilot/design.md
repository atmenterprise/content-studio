# Design

## Context

The repository contains planning artifacts only. Implementation follows 001–003 for Auth0 organization authorization, the recursive renderer, dependency-free SDK, published snapshots, and token-authenticated saved-draft delivery. 004 is optional: its provider interfaces can be reused, but a CLI extraction dependency must not be required by the web application.

Inspected sibling `../jazzsinghpersonaltrainer/src/admin/Admin.jsx` renders labels/controls from resource definitions and keeps dirty-state confirmation around navigation. It has no visual bridge or AI actions. Its JSX is an interaction reference; retain the planned generic schema renderer and Auth0 boundary rather than adopting its fixed resources or Neon Auth.

## Goals / Non-Goals

**Goals:** Precise, opt-in preview-to-field navigation; a narrowly validated cross-origin protocol; useful field-specific AI suggestions; no implicit persistence or publication.

**Non-Goals:** Arbitrary DOM changes, full WYSIWYG editing, streaming unsaved form values into external pages, automatic website instrumentation, provider-driven site crawling, AI-created SEO fields, or replacing Save/Publish workflows. “Live” means an interactive framed website with click targeting; preview refresh reflects saved data, not every keystroke.

## Decisions

### SDK attributes and exact field addresses

Add optional exports under `@content-studio/client/visual`; the core fetch client remains side-effect-free and dependency-free. Module imports must not access window/document. Export a synchronous `fieldAttributes('hero.title', options?)` helper for JSX spread or DOM attribute assignment, producing `data-cs-field="hero.title"` and optional companion attributes:

- `data-cs-entry`: the Studio entry UUID, required for repeating collections.
- `data-cs-path`: an encoded JSON array of string keys/nonnegative integer indexes, e.g. `["cards",2,"title"]`; its first key must equal the marker's fieldName.
- `data-cs-fingerprint`: SHA-256 of canonical displayed entry.data, required whenever the path traverses an array.

Also export async `fingerprintContent(data)` using native Web Crypto to support browser/server loaders without adding a crypto dependency. Applications compute it from the actual displayed SDK entry data, pass it to fieldAttributes, and regenerate it after data changes. Canonicalization sorts object keys, preserves arrays, and uses the same JSON rules in Studio. Never include content text, token values, or credentials in attributes. The helper validates marker/path/UUID formats and escapes through normal framework/DOM APIs, never concatenated innerHTML.

The basic marker identifies a top-level singleton field. For a repeating collection, missing entry metadata is ambiguous and must not select an arbitrary record. Nested object paths require the path attribute; array paths additionally require a matching content fingerprint, avoiding indexes pointing to a different item after reorder. A fingerprint is a stale-data check, not authorization. If the current local form differs from the displayed data, reject an array selection with a refresh/reconcile notice while preserving local work. Do not guess by matching visible text, since duplicate text is common.

Keep public delivery envelopes and schemas unchanged. Companion attributes are consumer instrumentation, not additional spec_definition properties. 004's generic data-content-studio markers are not silently treated as this protocol; website developers may adopt the new helper explicitly. No codemod deployment is part of this change.

### Visual activation and versioned postMessage protocol

`attachVisualBridge({siteId, studioOrigins, onPreviewSession?})` starts only in a browser iframe when the URL has exactly cs_visual_edit=true. Allowed Studio origins are explicit trusted site configuration, never values trusted from a query parameter or document.referrer. Standalone pages and pages without the flag have no highlight/listener side effects. Return a dispose function; no implicit bridge activation on SDK import.

Studio embeds a deployment-configured preview URL derived from the selected site and approved origins, appending the flag while preserving the selected path. It creates a new random 128-bit session nonce for each frame load or site/mode change, and sends a versioned init message to the exact preview origin, retrying that init at bounded intervals until ready or the handshake timeout. The child validates event.source === window.parent, the configured Studio origin, payload/site/version, and flag before responding ready with the nonce. Studio accepts ready only from its current iframe.contentWindow and expected origin/nonce. No wildcard targetOrigin is used in either direction.

Messages share `{channel:'content-studio.visual',version:1,type,siteId,nonce,...}`. Types are init, ready, connect, content-ready, field-select, refresh, disconnect, and safe error. `field-select` adds `{collectionKey,entryId?,path,entryFingerprint?}`. Payloads use strict validation, bounded paths (32 segments, 64 characters per key), known IDs, and a 16 KiB message limit except the fixed-size connect token. Reject prototype keys, arbitrary selectors, executable strings, and unknown message types. The marker's fieldName determines a path root; marker strings are not evaluated or interpolated into selectors.

After connect, highlight only annotated nodes with valid addresses using a transient outline/overlay, not layout-changing borders. Use delegated nearest-annotated-element selection for pointer clicks and Enter/Space on focusable visual targets; provide a keyboard-accessible target list for otherwise nonfocusable text. Prevent default navigation/submission for selected annotated nodes in visual mode, stop duplicate bubbling selections, and leave non-annotated interactions normal within the frame sandbox. Escape exits selection mode without changing content. Use throttled positioning/repaint and clean overlays/listeners on disposal or SPA navigation.

A field selection is only a navigation hint. Studio independently checks that the requested collection/entry belongs to its active authorized site and resolves the path through the current schema and form state. No child message can switch organizations, save values, execute an AI request, or grant access. Regenerate nonce and drop old messages on frame navigation; never reuse a channel across site switches. Version mismatch shows an upgrade/disconnected state rather than processing partially understood messages.

### Split-screen preview and renderer focus

Add a Visual preview toggle to the existing collection/editor workspace. Desktop uses a resizable preview/form split; narrow screens use accessible tabs while retaining both states. Preserve ATM styling. Show URL/path, explicit Published or Saved drafts mode, loading/connected/disconnected status, refresh, and close controls. Preview URLs are HTTPS and match per-site configured origins, with localhost development exceptions; do not accept arbitrary message-supplied navigation URLs.

Use an iframe with a descriptive title, referrerPolicy=no-referrer, and sandbox allowing scripts and same-origin but no top navigation, popups, or form submission. Preview and Studio origins must be distinct for this sandboxed integration. Studio frame-src CSP permits only configured preview origins; the target site must explicitly allow Studio via frame-ancestors and compatible X-Frame-Options. Do not proxy/rewrite around a site's embedding policy. A 10-second handshake timeout shows unavailable/not-integrated guidance; cross-origin browser restrictions mean the UI cannot reliably distinguish every network/CSP cause. Regular form editing remains available.

Extend the renderer with a field-address registry keyed by site/schema/entry/path and refs to actual input/editing surfaces plus ancestor expansion callbacks. After authorized selection, apply dirty-entry confirmation before switching records, load the target if necessary, expand object/repeater ancestors, wait for mount, scrollIntoView, and focus the actual text input, switch, media control, or rich-text surface. Use registry lookup, not DOM selectors supplied by the iframe. Respect reduced-motion preferences and announce the focused field accessibly. Cancel pending focus requests when the user changes context; latest valid selection wins.

A simple singleton marker can open its current or empty singleton form; a repeated entry must exist. Missing/deleted entries, unsupported paths, or stale array fingerprints show a non-destructive notice. Clicking another field in the same current form never reloads saved values over local edits. If a user declines a dirty-form switch, keep selection/form state unchanged and optionally acknowledge rejected selection to the frame.

### Published and saved-draft preview sessions

Published mode needs no content credential and uses Phase 3 public delivery. The query flag alone is never authentication. A site needs to connect its visual callback to its own SDK data loading; the bridge cannot magically replace arbitrary server-rendered content. Document a React/client adapter example and a server-rendered integration pattern that refreshes/reloads through an explicit site adapter; absent integration is shown honestly.

Saved-draft mode additionally requires content:preview permission and uses Phase 3's existing token issuance endpoint with content:preview scope only and a five-minute lifetime. Mint only after a trusted ready message and explicit draft-mode selection. Send token via an exact-origin connect message bound to the nonce; the child callback keeps it in memory and builds an ordinary createContentClient with previewToken. Require the site's origin in Phase 3 browser-preview CORS configuration. Never place tokens in iframe URLs, DOM attributes, local/session storage, logs, or published client configuration. The framed site is intentionally trusted to see only its own site's draft content.

The callback receives `{mode,previewToken?,expiresAt?}` and resolves only when its displayed data has refreshed; the bridge then sends content-ready before selection becomes active. Without a callback, an already-rendered published view can acknowledge readiness, but saved-draft mode is unavailable rather than pretending its content refreshed. A published/draft mode switch clears the old displayed-data readiness state. Use only saved working content; unsaved Studio form text is not sent. Refresh after explicit Save draft may re-fetch through the adapter, but neither save nor iframe refresh is automatic publication. Expiry revokes readiness and offers reconnect rather than silent public fallback. On close/site navigation, clear child memory/listeners and best-effort revoke the issued token; expiry bounds any revocation failure. No AI credentials or Auth0 session tokens are sent to the frame.

### Inline AI UI and field targeting

Add an accessible sparkle button to normalized text_input, textarea, and rich_text controls, including v1 text/textarea adapters. Exclude slug_input, color_token, numbers, images, date controls, and read-only/unauthorized fields. Nested text controls receive the same action. If AI is unconfigured, show a disabled action with a concise configuration explanation supplied by an authorized capabilities flag, never provider secrets.

Use one action popover with Improve Conversion, Shorten, Fix Grammar, and Generate SEO Meta. The button submits current unsaved field text, not merely persisted entry.data. Capture a local request ID, schema digest, stable renderer field/item identity, local text revision, and original value. Loading/cancel/error state belongs to that field. Close or cancel requests on context changes; reorder/removal invalidates positional responses. Prevent duplicate concurrent generation for the same field without preventing normal typing.

Show original and proposed text with Apply/Discard and accessible difference/preview presentation. Apply requires the captured local identity/revision and current schema still to match, updates the field, and marks the form dirty. A stale result can be inspected but not applied over newer typing; rerun from the current value. Discard changes nothing. Undo is a local editor-history operation restoring the pre-apply value only while applicable; it must not erase text typed after the suggestion. Save draft and Publish remain the existing explicit actions. Suggestions are not persisted as separate server records.

### POST /api/v1/ai/refine contract

Use a strict request:

```json
{
  "siteId":"uuid",
  "schemaId":"uuid",
  "entryId":"uuid-or-omitted-for-new-entry",
  "fieldPath":["description"],
  "schemaDigest":"sha256",
  "domainContext":"example.com",
  "fieldLabel":"Description",
  "currentText":"Current unsaved copy",
  "action":"improve_conversion",
  "requestId":"client-uuid"
}
```

entryId is an optional property, not a literal placeholder in real requests. Other action enum values are shorten, fix_grammar, and generate_seo_meta. Support new unsaved entries by resolving schema/path without requiring an entry row; array indexes traverse the item definition, with existing-entry ownership verified when entryId is provided. Apply the Phase 2 key/depth constraints; fieldPath identifies an eligible text field, not arbitrary object properties.

Require a valid organization-aware Auth0 server session, site/schema/entry ownership, content:write and content:ai permissions, and same-origin/CSRF validation. A preview token, site API key, or iframe handshake never authorizes this endpoint. Resolve stored site domain and schema label/type/constraints server-side; supplied domainContext/fieldLabel must match rather than override them. A schemaDigest mismatch returns 409 before a provider call. CurrentText may differ from saved content because it is the user's local draft; validate its type/budget without requiring every other field in an unfinished form to validate.

Return 200 `{requestId,action,schemaDigest,suggestion:{text,format},contextDigest}`. Format is plain_text or sanitized_html according to the target control. contextDigest fingerprints the validated context/input for stale-result checks without persisting text; UI request/revision identity remains authoritative. Responses contain no provider prompt, keys, other entry data, or model-generated commands. Return core-style safe error envelopes with 400 malformed JSON/request, 401 no session, 403 missing permission/CSRF, 404 inaccessible target, 409 changed context, 413 body budget, 422 invalid/unsatisfiable field constraints or provider refusal, 429 limits with Retry-After, 502 invalid/upstream output, 503 unconfigured provider, and 504 timeout. All responses are private,no-store with no ETags.

### Server AI processing and resource limits

Use a server-only provider interface independent of browser/SDK packages. Implement an OpenAI structured-response adapter as the initial web endpoint backend with deployment-specified model and secret; a compatible provider-neutral interface can share 004 adapter logic if present without importing its CLI/Git dependencies. Provider choice/model are operator configuration, never request inputs. Pin supported SDK/model configuration during implementation and reject missing structured-output support. This does not add provider SDK dependencies to @content-studio/client.

Model input is limited to stored domain, field label/type/validation constraints, selected action, and current text. Do not fetch/crawl the domain or include full entries, hidden fields, repository files, contact lists, or unrelated tenants. Treat text/domain/labels as delimited data, not instructions changing the system task. The model has no execution, browser, or persistence tools. Improve Conversion aims for clearer benefit/CTA copy without inventing factual offers; Shorten preserves meaning; Fix Grammar preserves factual content and language; Generate SEO Meta returns one meta-description string, not a title/object/new schema field. Human review handles semantic quality.

Require structured output `{text:string}`. For plain controls keep plain text and escape it in presentation; for rich_text sanitize with Phase 2's allowlist, then run its field validation. SEO action uses plain text, at most 160 Unicode characters and any tighter schema maximum; wrap escaped plain text in a permitted paragraph only for a rich_text target. Rich-text length validation uses the existing sanitized plain-text semantics. Reject an unsatisfiable minimum/maximum combination before generation, reject truncation/invalid output, and never silently chop prose to satisfy limits. One bounded repair attempt may correct invalid output within the total request timeout; unsuccessful repair is a safe failure, not an applicable invalid suggestion.

Limit request body to 256 KiB and currentText/output to 32000 Unicode characters (plus existing field constraints on output); total provider timeout is 30 seconds and output token budget at most 8000. Cancel pending provider work where supported when the request is aborted; cancellation may not avoid provider charges and must not be reported as a content change. No automatic retry on network failures or user cancellation.

Enforce distributed counters, default 10 requests per minute per verified subject/site and 1000 requests per day per site, configurable server-side. Add a minimal PostgreSQL ai_usage_limits table keyed by organization/site/subject-or-site bucket, period, and start with atomic reservation/increment and expiry cleanup. Validate authorization/input before charging counters; count dispatched provider attempts, including failures, against limits. Record safe request ID/action/duration/status and aggregate usage only; do not log current/suggested text, provider payloads, raw domain prompts, secrets, or hashes as substitutes for raw-text storage. No persistent suggestion history is required.

## Risks / Trade-offs

- [An annotation lacks entry/index identity] → Require companion metadata and array fingerprints; reject ambiguity instead of guessing by text.
- [Iframe unavailable due to hosting policy] → Explicit origins/CSP/frame-ancestors guidance and timeout state; keep ordinary editing available.
- [Saved preview differs from unsaved local form] → No keystroke mirroring, dirty-form preservation, stale checks, and explicit refresh/reconnect.
- [Cross-origin messages carry forged targets or tokens] → Exact origin/source/nonce validation, independent Studio authorization, short-lived site-scoped tokens, and no wildcard sends.
- [AI suggestion loses meaning or invents claims] → Constrained prompts, bounded validated output, visible comparison, and user-controlled Apply/Undo rather than autonomous save.
- [Late AI response overwrites newer text] → Local request/revision/item identity checks before application.
- [Provider costs or configuration failures] → Distributed limits, timeout, server-only configuration, and failure states that preserve manual editing.

## Migration Plan

1. After 001–003, add field registry, optional SDK exports, AI capabilities configuration, and request-counter migration without changing existing content/schema payloads.
2. Deliver browser fixtures with separately hosted Studio/site origins, valid annotations, published/draft callbacks, CSP, and trusted messages. External consumers adopt helpers manually; no production site is instrumented by this change.
3. Add server AI adapter and UI behind feature flags; verify mocks and opt-in provider smoke checks without storing suggestions or publishing content.
4. Verify origin/tenant isolation, exact nested focus, dirty-state preservation, AI stale/undo behavior, preview expiry, and zero-dependency SDK packaging before enabling preview/AI for users.
5. Roll back by disabling visual/AI flags, disposing sessions/revoking preview tokens, and leaving field content/publication unchanged. Preserve harmless annotations and compatible SDK exports; request-counter storage can remain for audit/expiry cleanup.
