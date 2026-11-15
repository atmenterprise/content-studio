# Proposal

## Why

Editors need to connect what they see on a website to the corresponding structured content field, and improve copy without leaving that field. An optional visual bridge and reviewable inline AI suggestions will reduce navigation and writing effort while retaining existing validation and publishing controls.

## What Changes

- Add an optional, dependency-free SDK attribute helper emitting `data-cs-field="collectionKey.fieldName"`, with companion entry/path metadata for precise repeating and nested field targeting.
- Add opt-in visual-mode highlighting and click/keyboard selection when an instrumented site is framed with `cs_visual_edit=true`, using a versioned, origin-checked postMessage bridge.
- Add a responsive Studio split-screen preview that opens the correct authorized entry, expands nested controls, scrolls, and focuses the exact field while preserving dirty forms.
- Add AI sparkle actions beside text_input, textarea, and rich_text widgets for Improve Conversion, Shorten, Fix Grammar, and Generate SEO Meta.
- Add authenticated POST /api/v1/ai/refine using verified site-domain/field context and current unsaved text, returning bounded validated suggestions for explicit user acceptance.
- Preserve Save draft/Publish, rich-text sanitation, preview-token rules, and the SDK's zero-runtime-dependency promise. Neither a visual click nor AI generation saves or publishes content.
- Exclude arbitrary DOM editing, automatic website instrumentation or deployment, streaming keystroke-to-iframe updates, autonomous AI publication, site crawling, and automatic SEO schema creation.

## Capabilities

### New Capabilities

- `visual-editing`: Optional SDK instrumentation, iframe bridge protocol, and exact-field navigation in Studio.
- `ai-refinement`: Authorized field-specific AI actions and review/apply/undo suggestion behavior.

### Modified Capabilities

None in the current main-spec inventory. The renderer, SDK, preview, and provider-adapter plans are in pending changes 001–004. This change adds integrations without rewriting their artifacts.

## Impact

Implementation requires 001–003's application, renderer, SDK, and delivery/preview contracts. Phase 4 extraction is not required, though provider infrastructure can be shared if already implemented. Add SDK optional exports, renderer field-address registration, Studio preview UI, deployment-managed frame/origin configuration, a server AI adapter, and request-limit storage. No provider SDK enters the browser or delivery client bundle.

The repository currently contains planning only; there is no running Studio or SDK to modify yet. The sibling trainer admin source supplies field-label/form interaction reference, not an existing visual bridge or AI implementation. External sites must opt into SDK instrumentation and framing configuration; this proposal does not modify or deploy them.
