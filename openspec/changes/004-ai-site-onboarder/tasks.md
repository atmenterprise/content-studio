# Tasks

Prerequisites: reuse Phase 2's shared v2 schema tooling; provisioning requires implemented 001/002 and optional integration requires implemented 003. This change creates the CLI, not a live onboarding run against the sibling trainer site. Provider SDK dependencies remain outside the dependency-free client package.

## 1. CLI modes and source acquisition

- [ ] 1.1 Add the onboard-site workspace package/bin, typed configuration, documented modes/flags/environment variables, and exit categories; verify a packed local CLI accepts the requested positional command and rejects conflicting extraction/apply/refactor flags.
- [ ] 1.2 Implement local-path/monorepo-root resolution and isolated HTTPS/SSH Git acquisition with recorded commit, protocol/path checks, disabled hooks/filters/submodules, and size/time limits; verify local/remote fixtures cannot modify origin/source files, execute repository hooks, or escape the target root.
- [ ] 1.3 Add ignore rules, default source/secret/admin exclusions, include/exclude controls, symlink handling, and scan budgets; verify excluded secrets are never read into model payloads and every skipped/oversized item has a safe coverage entry.
- [ ] 1.4 Document local/Git inputs, private-repository credentials, supported syntax, static DOM meaning, and analysis-only mode; verify commands work on sanitized fixture directories without running install scripts or the application.

## 2. Semantic analysis and provenance

- [ ] 2.1 Parse TSX/JSX and HTML into semantic candidates with spans, stable IDs, content hashes, roles, headings, accessibility copy, links, and media; verify style/class omission affects only model input while original source and rendered text semantics remain intact.
- [ ] 2.2 Trace relative JSON imports, literal arrays/objects/member access, repeat groups, and reused sources without evaluating code; verify candidate deduplication, original IDs, nested values, and source array order in fixtures inspired by Home.jsx, Footer.jsx, and programs.json.
- [ ] 2.3 Classify dynamic functions/hooks, bundled images, CSS backgrounds, heterogeneous/null data, and unsupported frameworks as unresolved/manual; verify dynamic copyright and malicious comment instructions are never executed or silently replaced.
- [ ] 2.4 Add a versioned provenance/coverage report and analyzer fixtures for parse failures, stale files, excluded candidates, and limits; verify stable rerun fingerprints and document source-content privacy and coverage interpretation.

## 3. Structured LLM extraction

- [ ] 3.1 Define a shared structured extraction envelope using v2 collection definitions plus source-ID seed bindings and a contract-to-provider schema compiler; verify bounded nested/widget schemas and final materialized seeds validate against the actual Phase 2 contract.
- [ ] 3.2 Implement the OpenAI SDK adapter with explicit model, constrained responses, timeout, and safe errors; verify contract tests with mocked valid/refused/truncated/unsupported-capability responses and an opt-in non-production smoke command.
- [ ] 3.3 Implement the Anthropic SDK adapter against the same envelope and capability checks; verify the shared adapter suite and that unsupported structured modes never fall back to free-form parsing.
- [ ] 3.4 Implement the Gemini SDK adapter against the same envelope and capability checks; verify the shared adapter suite and secret-free diagnostics.
- [ ] 3.5 Add semantic chunking/merge, bounded model/repair budgets, candidate grounding, and conflict detection; verify hallucinated source IDs, invented copy, incompatible groupings, omissions, and exhausted budgets cannot produce a successful provision-ready file.
- [ ] 3.6 Document provider selection, model capability requirements, transmitted semantic input, call limits, and nondeterministic inference; verify no provider/onboarding credentials appear in request logs, recorded reports, or failure messages.

## 4. Reviewable specification artifacts

- [ ] 4.1 Normalize seedData into v2 collections[].entries with draft status, stable slugs, source_order where needed, and source-compatible scalar/nested widgets; verify singleton counts, repeat order, preserved JSON identity fields/media paths, and absence of unsupported payload metadata.
- [ ] 4.2 Resolve explicit/source-derived site metadata and report missing/conflicting values; verify production domains/repository URLs are never fabricated, incomplete candidates are marked invalid, and apply blocks them until corrected.
- [ ] 4.3 Atomically write content-spec.json, onboard-site.report.json, and onboard-site.review.md with payload/source digests and overwrite backups; verify validation/provider/write failures preserve prior valid or user-edited artifacts and oversized payloads fail without truncation.
- [ ] 4.4 Document review and subsequent explicit apply commands, grouping assumptions, unsupported mappings, and draft-only defaults; verify fixture output passes the actual onboarding validator and extraction never contacts Studio or uploads media.

## 5. Provisioning and resume

- [ ] 5.1 Implement reviewed-file-only --apply using CONTENT_STUDIO_ONBOARD_TOKEN, endpoint/origin validation, exact validated bytes, timeout, and no redirects; verify no model rerun, no credential substitution, correct 200/201 handling, and 401/403/409/413/422 errors against a fake or isolated Studio.
- [ ] 5.2 Validate responses and write secret-free staged receipts with site/schema IDs and payload digests; verify repeat/resume skips redundant provisioning, --reprovision follows insert-only server semantics, and changed payloads cannot silently reuse an old receipt.
- [ ] 5.3 Handle indeterminate network results, downstream failures, and optional private one-time-key output; verify no compensating delete, no plaintext keys in normal artifacts, secure key-file creation, and recovery guidance distinguishes remote from local stages.
- [ ] 5.4 Document onboarding versus schema-read credentials and first-site token acquisition; verify a new-site flow can pause at awaiting-schema-token and resume later without losing receipt state or requiring new authentication endpoints.

## 6. Isolated package and typegen integration

- [ ] 6.1 Preflight --refactor for clean Git state, matching provenance/source hashes, valid frontend/install root, and branch availability; verify stale mappings, user edits, branch collisions, and non-Git sources fail before local source modifications.
- [ ] 6.2 Create feat/connect-content-studio in a separate persistent worktree with staged recovery metadata; verify the original checkout/branch remains unchanged and reruns never reset, commit, or push existing work.
- [ ] 6.3 Add npm/pnpm/Yarn package adapters for pinned client/typegen installation with lifecycle scripts disabled and lockfile updates; verify each fixture changes only its correct manifest/lockfile and ambiguous package roots are reported.
- [ ] 6.4 Run actual Phase 3 authenticated typegen with the returned site ID and scoped schema token, then create public-only disabled connection configuration and TS/JSDoc bindings; verify missing/expired/wrong-site credentials preserve provisioned state and no secret reaches generated code or child-script environments.
- [ ] 6.5 Document worktree paths, local tarball testing, resume stages, package limitations, and branch review/removal; verify the documented resume command detects unexpected worktree changes and does not reprovision automatically.

## 7. Syntax-aware connection transforms

- [ ] 7.1 Implement mapped React/Vite literal text/attribute and JSON/literal-array bindings plus a default-first SDK hook; verify original fallback values, styles, handlers, route behavior, legacy IDs, source_order, and stale-request handling in browser/AST fixtures.
- [ ] 7.2 Implement safe Next.js server-loader/client-hook adapters while preserving existing boundaries; verify no invalid async client component, changed hydration default, or arbitrary use-client insertion and report unsupported boundary cases.
- [ ] 7.3 Implement bundled-HTML text/media/link bindings with stable markers, safe textContent/attribute updates, and retained static fallback; verify markup/handlers are preserved and unsupported repeating DOM or unbundled HTML receives manual guidance.
- [ ] 7.4 Add activation-off defaults and activated fallback rules; verify draft-seeded integrations initially render original content, null/failure uses fallbacks, and successful empty arrays/empty strings/zero/false remain authoritative.
- [ ] 7.5 Enforce provenance-span changes and mandatory reparse/import/config checks, reporting unsupported expressions/hooks/localization/rich-text sinks individually; verify codemods are repeat-safe and partial mappings are never reported as complete conversion.
- [ ] 7.6 Add explicit --run-checks for recognized build/typecheck/test scripts and a report of commands/statuses; verify scripts never run during analysis or without the flag, unrun checks are not claimed as passed, and failures retain inspectable worktree changes.

## 8. System acceptance and distribution

- [ ] 8.1 Run analyze/extract/review/apply/resume/refactor flows against sanitized Vite, Next.js, bundled HTML, plain HTML, and unsupported-pattern fixtures with mocked providers; verify end-to-end contract compatibility, credential separation, original-checkout preservation, and honest partial/error states.
- [ ] 8.2 Run package build/typecheck/lint, parser/provider contract tests, provisioning/worktree recovery tests, codemod browser checks, and clean tarball CLI execution; record results and document opt-in live provider/isolated-tenant smoke checks without production access.
- [ ] 8.3 Deliver an operator/consumer guide covering metadata review, source transmission, draft publication and activation, manual cases, retries, and staged recovery; verify examples and prepare local release artifacts without npm publication, external commits/pushes, or deployment.
