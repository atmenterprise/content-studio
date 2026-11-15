# Tasks

Prerequisites: implement and validate 001–003. Phase 4 is optional; shared provider logic must not require the web app to import CLI/Git infrastructure. This change creates application/SDK capabilities and fixture integrations, not a deployment or instrumentation run against an external production website.

## 1. Optional SDK instrumentation

- [ ] 1.1 Add @content-studio/client/visual exports for fieldAttributes and canonical fingerprintContent using native platform APIs; verify singleton/entry/nested addresses, invalid paths/IDs, SSR-safe imports, deterministic fingerprints, and zero runtime package dependencies.
- [ ] 1.2 Implement opt-in attachVisualBridge activation, delegated highlighting/selection, keyboard target access, and disposal; verify normal pages/standalone visual URLs remain inert and annotated links select rather than navigate only during trusted visual mode.
- [ ] 1.3 Document JSX/DOM usage, repeating entry IDs, nested paths/fingerprints, and optional consumer adoption; verify packed-SDK browser/SSR examples do not add content text or credentials to attributes or change public delivery/schema payloads.

## 2. Trusted message protocol

- [ ] 2.1 Define strict versioned bridge envelopes, nonce lifecycle, exact origins, source-window checks, init retries, and readiness stages; verify valid handshake and rejection of wrong-origin/source/site/nonce/version/oversized/prototype-bearing messages in cross-origin browser fixtures.
- [ ] 2.2 Implement connect/content-ready/field-select/refresh/disconnect handling with latest-session cancellation; verify frame reloads, SPA navigation, site changes, and late messages cannot revive an old selection or trigger persistence/AI requests.
- [ ] 2.3 Add safe protocol failure/timeout reporting and listener/overlay cleanup; verify disposal removes selection effects, reconnect replaces old state, and no wildcard postMessage or secret logging occurs.
- [ ] 2.4 Document site/Studio origin configuration and protocol integration, including compatibility/version errors; verify a fixture with an untrusted parent never highlights or receives credentials.

## 3. Studio preview and field focusing

- [ ] 3.1 Build the ATM-styled resizable preview/form split with narrow-screen tabs, mode/path controls, refresh, and loading/disconnected states; verify keyboard operation, iframe title, and preserved form state across preview toggle/resize.
- [ ] 3.2 Add trusted URL selection, distinct-origin sandbox, referrer policy, Studio frame-src configuration, and target framing guidance; verify blocked/unintegrated sites time out gracefully without a proxy bypass or loss of ordinary editing.
- [ ] 3.3 Add renderer field-address registration, ancestor expansion, mount-aware scrolling, and actual input/rich-text focus; verify singleton fields, repeated entries, and nested repeaters target the exact authorized control.
- [ ] 3.4 Enforce dirty-entry switching, tenant/schema/entry/path validation, array fingerprint checks, and stale/deleted target notices; verify declining a switch preserves local work and reordered/stale arrays never focus another item.
- [ ] 3.5 Connect published preview and explicit saved-draft sessions using five-minute Phase 3 content:preview tokens after handshake; verify callback readiness, no-store delivery, expiry/reconnect, best-effort revocation, and absence of tokens in URLs/markers/storage/public config.
- [ ] 3.6 Document React/client and server-rendered consumer adapter examples, CORS/framing configuration, and saved-data refresh limitations; verify the fixtures show honest unsupported-draft states when no adapter exists and never mirror unsaved keystrokes implicitly.

## 4. AI endpoint and server controls

- [ ] 4.1 Add strict POST /api/v1/ai/refine request/response validation, four action enums, optional new-entry identity, field-path resolution, and schema/context checks; verify malformed, cross-tenant, unsupported-widget, stale-digest, and spoofed domain/label requests are rejected before provider use.
- [ ] 4.2 Enforce Auth0 organization ownership, content:write/content:ai permissions, same-origin/CSRF checks, and private,no-store responses; verify sessions/permissions are independently checked and preview tokens/iframe messages/site API keys cannot invoke generation.
- [ ] 4.3 Add server-only provider/model configuration and the initial structured-response OpenAI adapter behind a reusable interface; verify selected model capability validation, prompt minimization, safe errors, and no provider SDK import in browser/client outputs.
- [ ] 4.4 Implement the four prompts, target-field output validation, Phase 2 HTML sanitation, SEO's 160-character cap, and one bounded repair; verify plain/rich outputs, unsatisfiable constraints, refusals, malformed/truncated results, and unsafe HTML never produce an applicable invalid suggestion.
- [ ] 4.5 Add request/input/output/time budgets, abort handling, and a Drizzle ai_usage_limits migration with atomic per-user/site-minute and per-site-day limits; verify concurrent reservations, expiry cleanup, 429/Retry-After, timeout behavior, and no persistent prompt/suggestion storage.
- [ ] 4.6 Document endpoint examples, permission/provider configuration, scopes, limits, and safe diagnostics; verify 400/401/403/404/409/413/422/429/502/503/504 responses and zero content-save/publish/webhook side effects through integration tests.

## 5. Inline suggestion experience

- [ ] 5.1 Add accessible sparkle buttons and action popovers to eligible v1/v2 normalized text controls, including nested fields; verify exact widget/permission gating and disabled-unconfigured states without exposing provider settings.
- [ ] 5.2 Send current unsaved text with verified context references and capture local request/revision/item identities; verify typing remains possible, duplicate in-flight requests are prevented, and field switches/reorder/removal cancel or stale the correct response.
- [ ] 5.3 Add original/suggestion comparison with Apply, Discard, and local Undo; verify Apply only marks the target dirty, Discard is inert, Undo preserves subsequent typing, and Save draft/Publish remain separate actions.
- [ ] 5.4 Add per-field loading/cancel/refusal/rate-limit/error states and sanitized rich previews; verify timeout/cancellation/provider failures preserve text and stale results cannot overwrite newer drafts or a different tenant's form.
- [ ] 5.5 Document action semantics, SEO meta-description output, suggestion review, and saved-preview refresh; verify keyboard/screen-reader browser flows and no automatic schema or publication changes.

## 6. System acceptance

- [ ] 6.1 Run a two-origin, two-organization browser flow from framed click to exact field, AI suggestion Apply/Undo, explicit draft save, and authorized saved-preview refresh; verify message, token, tenant, stale-data, and non-persistence guarantees end to end.
- [ ] 6.2 Run application build/typecheck/lint, SDK tarball/type/runtime checks, message/focus browser tests, PostgreSQL quota tests, and mocked AI API tests; record opt-in live provider smoke prerequisites and results without production-site changes.
- [ ] 6.3 Verify feature-flag rollout/rollback, session/token cleanup, and unavailable-preview/provider behavior; confirm existing content, schemas, and published snapshots remain unchanged when the feature is disabled.
