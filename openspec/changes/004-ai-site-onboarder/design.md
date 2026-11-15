# Design

## Context

Only OpenSpec plans exist in this repository. Phase 1 defines the Auth0-authenticated onboarding endpoint and insert-only seeds; Phase 2 defines the v2 recursive field contract and draft/published snapshots; Phase 3 defines delivery, @content-studio/client, schema export, and typegen. This CLI consumes those interfaces rather than creating a competing CMS contract.

Inspected reference source includes `../jazzsinghpersonaltrainer/src/site-pages/Home.jsx`, `src/components/Footer.jsx`, `src/data/programs.json`, and package.json. It combines local JSON, existing data-fetch hooks, static JSX text, image paths, map expressions, routes, event handlers, and dynamic copyright text in a mixed Vite/Next.js repository. Static analysis can recover much of the content, but runtime-generated values and existing fetch integrations cannot be safely replaced by matching strings alone.

## Goals / Non-Goals

**Goals:** Source-grounded extraction, a strict local review boundary, reuse of Phases 1–3, and optional inspectable integration changes with explicit coverage and recovery state.

**Non-Goals:** Universal semantic equivalence proofs, executing arbitrary repositories during scanning, headless rendering/crawling, migrating existing Studio databases, automatic deployment/publication, arbitrary model-generated patches, secret discovery, remote push/PR creation, or changing the earlier planning artifacts.

## Decisions

### CLI package and separate run modes

Add `packages/onboard-site` with package/bin name onboard-site, Node.js 22+, TypeScript, parser libraries, provider adapters, and the shared v2 contract bundled into its distribution. These dependencies are confined to the CLI; @content-studio/client remains free of runtime dependencies. Pin supported provider SDK/parser versions during implementation rather than prescribing unverified current versions here.

| Invocation | Effect |
| --- | --- |
| `npx onboard-site ./path-to-site` | Scan/extract and write local review artifacts; no Studio call or source changes |
| `npx onboard-site <git-url> --ref <commit-or-branch>` | Obtain isolated checkout, then scan/extract it |
| `npx onboard-site ./path --analyze-only` | Scan and report semantic candidates without any model call |
| `npx onboard-site ./path --apply --spec ./content-spec.json` | Validate and provision the explicitly reviewed file, without extraction |
| `npx onboard-site ./path --apply --refactor --spec ./content-spec.json` | Provision or resume matching receipt, then prepare optional integration worktree |

Use --provider openai|anthropic|gemini and --model, with ONBOARD_SITE_PROVIDER/MODEL fallbacks; require an explicit model rather than silently selecting a paid model. Use OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY only for the selected adapter. No keys appear in CLI flags or written artifacts. Default artifact directory is the invocation directory; --out-dir changes it. --include/--exclude refine source selection, and --root selects a frontend within a monorepo. --run-checks explicitly enables target package scripts during optional integration. --branch overrides the default branch name without changing the no-push policy.

Analysis/extraction and apply are mutually exclusive operations in a single invocation: even if --apply is present on a first run, require the existing review file and never generate then provision it automatically. The explicit subsequent --apply command is the user's review acknowledgment; do not require a second approval prompt. --refactor opts into local dependency installation/source changes within the new worktree. Unknown/contradictory flags return usage errors.

Use process argument arrays, never shell interpolation. Exit codes distinguish success (0), invalid configuration/spec (2), acquisition/provider failure (3), provisioning failure or indeterminate network result (4), and incomplete/failed refactoring (5). Coverage limitations are reported even on successful extraction; no status claims complete automatic conversion when candidates remain unresolved.

### Repository acquisition and file selection

Local paths resolve to a real directory; follow neither escaping symlinks nor symbolic output targets. A non-Git directory supports analysis and provisioning, but optional branch creation requires a Git repository. Git inputs accept HTTPS and SSH URLs, including the conventional git@host:path form, without embedded passwords or tokens. Reject custom transports, file URLs, Git option-like values, and credentials in URLs; existing Git credential/SSH helpers handle private access.

Clone without submodules into a persistent tool-owned checkout under the output directory and record the resolved commit. Do not run hooks, filters, repository install scripts, or LFS smudge commands while acquiring: fetch into an isolated Git environment and materialize tracked blobs through plumbing into regular files, treating symlinks/submodules as skipped entries. Check resolved paths and enforce acquisition limits before materialization. Never use a repository's tracked configuration as commands to execute. Refactoring uses a branch worktree created from this recorded commit, not the remote origin checkout.

Discover .tsx/.jsx/.html and JSON reachable through local static imports or conventional frontend data directories. Parse adjacent .js/.ts modules only for statically known constants/import edges, not application execution. Honor .gitignore plus `.onboard-siteignore`. Exclude .git, node_modules, build/dist/.next/coverage/vendor, lockfiles, source maps, generated onboarding artifacts, .env variants, key/certificate files, and server/api/admin/auth directories by default. Explicit --include can include ordinary source, but cannot disable secret-file/path containment protections. Summarize excluded patterns before provider transmission.

Defaults: 2000 candidate files, 1 MiB per source file, 20 MiB total scanned text, 4 MiB aggregate semantic model input. A remote fetch is bounded by timeout and a 100 MiB object-store limit; stop it and retain a safe failure report if exceeded. Report every limit hit as incomplete coverage; never silently drop the remainder or emit a provision-ready file from a truncated extraction. Users can reduce scope with --root/--include. No binary/media bytes are uploaded to a model.

### AST and semantic DOM intermediate representation

Use a TSX/JSX-capable AST parser with source locations and a standards-aware HTML parser for a static semantic tree. DOM analysis here means parsed source HTML/JSX semantics, not a live browser DOM. A headless browser would execute site code and would make analysis dependent on credentials, build tools, and runtime state; it is outside this phase.

Create candidate records containing stable ID, file-relative path, file/content hash, source span/AST locator or JSON Pointer, value/value kind, surrounding tag/section/heading, attribute role, import identity, and repeat-group identity. Retain visible text, alt/title/aria-label, href/src/poster, semantic tags, section IDs, child order, and JSON shape. Remove className/class, inline style objects, CSS strings, utility wrappers with no semantics, and decorative icon implementation from model input only. Keep event/control-flow presence as markers without transmitting executable handler bodies.

Decode JSX/HTML entities and normalize rendered JSX whitespace according to syntax semantics, while preserving JSON string values, line breaks, punctuation, and original source bytes in provenance. Retain links/media as strings, not fetched resources. Imported bundled image assets retain their import identity and are reported as requiring an asset mapping if no stable delivery path exists. CSS background-image declarations are reported outside current extraction coverage rather than silently treated as absent media.

Resolve literal objects/arrays, relative JSON imports, safe literal member access, and repeat structure such as array.map; do not execute functions, interpolate unknown variables, run new Date(), or follow existing remote hooks. Keep existing JSON identity fields as declared content data when consumers depend on them; database entry IDs remain separate. Deduplicate an imported data source reused across pages without merging unrelated identical literals. Mark runtime-generated, localized, custom templating, and ambiguous values for review. Dynamic currency, dates, null/union-rich JSON, and imported-asset transformations require explicit compatible mappings rather than forced conversion.

Coverage report distinguishes discovered, extracted, intentionally excluded, ambiguous, unmapped, and refactorable candidates. A candidate fingerprint is content+source identity; changed files invalidate mapped rewrites. Repository comments/strings are untrusted content, never model/developer instructions. The model adapter exposes no filesystem/command/browser tools.

### Provider-neutral constrained extraction

All three SDK adapters accept the same semantic IR and produce a structured extraction envelope. Its collection definitions use the Phase 2 v2 discriminated union; seedData binds declared field paths to source candidate IDs and permitted deterministic transforms. The model proposes logical groupings/labels and singleton/cardinality, never new source copy or commands. Materialize seed values from the local IR after model output rather than trusting echoed strings.

Generate provider-supported structured/tool schemas from the shared contract with bounded recursive expansion. A selected model must support the required constrained response mode; fail with a capability explanation otherwise. A schema-support mismatch never enables free-form Markdown parsing. Split by semantic page/section boundaries under limits and merge by stable source identities; conflicting collection shapes or assignments are reported for review rather than silently winning by response order.

Adapters support a 60-second request timeout, at most 20 model calls per run, and one bounded validation-repair response per chunk within that call budget. Default per-call input/output token ceilings are 12000/8000, configurable downward; provider capabilities may require smaller chunks. Report usage/calls where available and abort on refusals, truncation, budget exhaustion, or repeated invalid output. Send only filtered semantic candidates and relevant type context to the explicitly selected provider; never raw repository archives, secrets, Git credentials, or previous Studio content.

Validate structured shape, supported widget pairs, recursive limits, required/default rules, source-ID existence, complete candidate assignments, seed types, singleton counts, and unique collection keys/slugs. Missing candidate assignments must be explicitly excluded/unresolved in the report. LLM confidence alone never grants permission to edit a file. Unknown source IDs, fabricated media strings, or unsupported numeric conversions reject a result. Shared field validation is the final authority irrespective of a provider's own structured-output guarantee.

### Payload normalization and review artifacts

Emit three files: `content-spec.json` (strict onboarding payload), `onboard-site.report.json` (machine-readable source mappings/diagnostics), and `onboard-site.review.md` (human summary and commands). Report schema includes tool/contract/provider/model versions, source root/commit/file fingerprints, candidate mapping, grouping assumptions, excluded/unresolved content, coverage, payload digest, and next steps. Keep secrets out of all three; provenance includes content from the repository and is documented as a local review artifact, not automatically uploaded to Studio.

Translate seedData into `collections[].entries: [{slug,data,status:'draft'}]`, with envelope version 2 and each spec_definition.version 2. Do not add top-level seedData, source mappings, confidence, or review flags to the strict endpoint payload. Use stable existing source identifiers for slugs where possible; otherwise derive source-identity-based slugs with deterministic collision suffixes. For repeating collections add a declared number field `source_order` when consumer display order matters; generated adapters sort on it because Phase 3 delivery sorts by slug/id, not original source position. Reject conflicting preexisting source_order semantics pending review.

Preserve ordinary string/number/boolean values and source-relative media paths. Choose textarea over rich_text for plain prose; do not invent currency, color-token, or rich HTML conversions without source-backed metadata and a lossless transform. Use object/array repeaters only for supported homogeneous shapes; report heterogeneous/null data for manual adaptation. Defaults cannot hide missing required seed data.

Resolve site name/domain/repo_url from explicit --name/--domain/--repo-url or unambiguous source configuration/Git remote, preferring explicit values. Normalize an HTTPS source origin to its hostname, strip credential material from remote metadata, and require endpoint-valid HTTPS repo_url. Default webhook_url to null: no rebuild receiver is invented. If required metadata is missing, write a clearly incomplete review candidate content-spec.json with empty missing values and a blocking validation report, return code 2, and require correction before apply. Do not report this file as contract-valid. Successful extraction means the completed file validates and is at most the core 1 MiB body limit; oversized candidates fail without truncating content.

Write successful results atomically after all chunks validate. Existing output files require --overwrite; save a backup of existing review files before replacement so edited files are not lost. Provider failures never replace an earlier successful spec. Canonicalize accepted JSON output but do not claim deterministic model inference; record hashes and versions for reproducibility.

### Provisioning and receipts

Use CONTENT_STUDIO_BASE_URL (or --base-url) and CONTENT_STUDIO_ONBOARD_TOKEN for the Phase 1 Auth0 bearer token with verified organization/content:onboard permission. Require HTTPS except localhost development, reject redirects and URL credentials, use a 30-second timeout, and never downgrade to another credential type. --apply re-reads exact review-file bytes, validates shared v2 contract/size, computes its digest, and sends those bytes to POST /api/v1/onboard. It never reruns the model, modifies statuses, or publishes entries. A user who manually changes seeds to published must use Studio's existing publication requirements; the CLI reports that explicit status before submitting and does not add publishing permissions.

Validate response status/shape before recording `onboard-site.receipt.json`: Studio origin, spec digest, source/report digest when available, returned site_id and schema IDs, creation counts, and integration stages. Exclude api_key and all tokens from normal output/receipts; if a creation response contains the one-time key, offer only an explicit --key-out private file destination with mode 0600 and no symlink/overwrite, outside generated code. Without that option discard the key and state it was not retained; it is not needed for SDK reads or typegen.

Identical receipt+origin+spec digest can resume local integration without another POST. An explicit --reprovision forces resubmission under the server's existing upsert/insert-only semantics. A network timeout after send is indeterminate, not proof of rollback; record that stage and instruct retry of the exact reviewed file, whose site/domain and seed identities are idempotent at Studio. An updated payload is a new apply and can change schemas/metadata but must not overwrite existing content outside server rules. Do not issue compensating deletes after downstream local failures.

Provision-only accepts a manually authored valid file even without a provenance report. Automatic refactoring requires a matching report, unchanged source fingerprints, and compatible reviewed schema mappings. Human edits that rename collections/fields or seeds without updating the bindings block refactoring, not otherwise valid provisioning.

### Refactor worktree, credentials, and package integration

Preflight --refactor for a Git repository, clean tracked/untracked work (excluding only tool-generated review files whose hashes are recorded), an unused branch name, supported frontend root, and matching source fingerprints. Refuse to overwrite or reset existing branches/worktrees or user edits. Create `feat/connect-content-studio` (or --branch) and a separate persistent worktree from the recorded HEAD. Never checkout a new branch in the caller's checkout; leave generated changes uncommitted for review. Remote repositories use the isolated recorded commit and never push.

Support conventional npm, pnpm, and Yarn projects with one unambiguous lockfile and package-manager declaration. Refuse ambiguous monorepo/install boundaries rather than rewriting the wrong manifest. Install a compatible pinned @content-studio/client and the Phase 3 content-studio typegen tool in the selected worktree/package, updating the matching lockfile. Disable dependency lifecycle scripts. Use known package-manager adapters with argument arrays; a repository's packageManager string is metadata, not an executable shell command. Pure static HTML without an established bundler/package manager remains analyzable/provisionable and receives a manual integration plan rather than an invented deployment pipeline.

After provisioning, require CONTENT_STUDIO_PREVIEW_TOKEN with schema:read for the returned site and run the actual Phase 3 typegen against Studio, producing content-studio.d.ts. Do not substitute local guessed declarations for an authenticated export. A newly created site's token may not exist yet: keep the receipt at provisioned/awaiting-schema-token, exit 5, and print the resume command after the user obtains the token through the existing Studio session workflow. No new authentication flow or automatic token minting is introduced.

Run the packaged generator in a child process with only the schema token and minimal required environment; provider/onboarding tokens are not inherited by target scripts or written to .env files. Generated connection config contains only public baseUrl/siteId, enabled=false, and fallback imports. For TypeScript targets import the generated map as a type; JavaScript targets use JSDoc typing without converting the entire project to TypeScript. Local package tarballs can be supplied for fixture tests before public package release. No npm publication is performed by this workflow.

### Supported codemods and fallback behavior

Use source-provenance-constrained AST edits, not model-written whole files or global string replacement. Preserve original formatting where possible; mandatory structural validation reparses every changed file, checks mappings/import bindings, and confirms no edit falls outside approved mapped spans or generated integration helpers. Keep handlers, class/style attributes, link routes, JSX escaping, accessibility relationships, and unrelated imports intact. Preserve existing fallback JSON/modules; never delete the original source of fallback data.

Initial adapters:

- React/Vite TSX/JSX: a generated typed/JSDoc content hook starts from local defaults, fetches public SDK data after mount with stale-response protection, and exposes mapped values. Rewrite supported literal JSX text/attributes and literal/JSON array reads to those bindings. No fetch starts in render and no hydration-breaking initial values are injected.
- Next.js App Router: async server-component entry points can await a generated server delivery loader; client components use the hook adapter while preserving existing client boundaries. If a safe boundary cannot be established, leave a manual task rather than adding async hooks or use-client to arbitrary files.
- HTML within an established bundler: generate a bundled module using the SDK and stable data-content-studio markers for supported text/image/link nodes, retaining existing DOM as fallback. Update textContent/approved attributes, never innerHTML. Complex repeated DOM with interactive behavior is reported for manual integration; JSX repeaters are the initial automatic repeating-array target.

Do not rewrite existing fetching hooks, dynamic copyright/route expressions, localization, arbitrary function calls, computed images, rich_text sinks, or values used by application logic unless an explicit supported AST pattern verifies equivalence. Existing imported arrays may include IDs used for keys/routes; preserve those fields under entry.data and adapt the delivery envelope rather than replacing legacy IDs with Studio UUIDs. Sort remote repeating data by declared source_order when present. Report unsupported content individually and mark the result partial if anything remains manual.

Remote activation defaults off because all extracted seeds are drafts and Phase 3 correctly returns []/null until publication. With activation off use exact local defaults. The user publishes in Studio and explicitly enables the generated public configuration after reviewing coverage. With activation on, successful empty arrays are authoritative and never fall back based on falsiness/length; absent/null singleton data and delivery failures use local defaults. Preserve empty strings, zero, and false values. Do not mix arbitrary old collection rows into a successful remote array. No preview credentials are embedded in browser code; optional private preview integration is manual follow-up.

### Validation, reporting, and recovery

Always parse changed source, validate AST span changes, generated imports/config, payload, and receipt consistency. --run-checks additionally invokes the target's recognized typecheck/build/test scripts with a minimal environment; analysis never runs these. Record exact commands, exit codes, unrun/absent checks, supported/skipped bindings, artifact paths, package changes, and whether activation remains disabled. Mixed Vite/Next.js roots and existing fetch hooks require scope selection or partial/manual reporting.

Typegen/install/build failure retains the isolated worktree and successful remote receipt for inspection; it does not reset user files or pretend the remote transaction failed. Resume verifies receipt and worktree fingerprints before continuing; unexpected local changes require review rather than blind replay. Rollback is dropping/reviewing the isolated branch/worktree manually, not deleting provisioned tenant data. No commits, pushes, PR messages, deployment, or publication occur automatically.

## Risks / Trade-offs

- [Universal conversion cannot be guaranteed by static analysis] → Accept broad repository inputs, state syntax/framework coverage, and report unresolved candidates and unsupported codemods explicitly.
- [LLM output invents or misgroups content] → Source-ID-bound materialization, strict v2 validation, bounded repairs, separate reports, and a second explicit apply invocation.
- [Large repositories exceed model budgets] → Deterministic scope limits and semantic chunks; fail incomplete output without silently provisioning a subset.
- [Remote content initially empty because seeds are drafts] → Keep activation off until explicit publication; retain fallback data and treat successful empty arrays honestly once enabled.
- [Provisioning and Git changes are not one transaction] → Persist stage receipts, resume locally, distinguish indeterminate network results, and avoid compensating tenant deletes.
- [Typegen token cannot be known before first site creation] → Provision first, pause with returned site identity, then resume with a site-scoped schema token from Phase 3.
- [Source/metadata contains secrets or hostile instructions] → Exclude secret paths, send semantic content only, separate provider credentials, and grant the model no execution tools.

## Migration Plan

1. Reuse the shared v2 schema tooling and Phase 3 package infrastructure after their implementations land; build the new CLI package and sanitized fixture corpus independently of a live provider/Studio.
2. Deliver analysis and provider extraction with mocked deterministic fixtures, then opt-in provider smoke checks. Produce review artifacts only and validate the shared endpoint contract.
3. Deliver authenticated apply and receipts against an isolated Studio tenant; validate repeat application and recovery after indeterminate requests without publishing seeds.
4. Add worktree/package/typegen/codemod adapters and verify fallback behavior in representative Vite, Next.js, and bundled HTML fixtures. Plain HTML and unsupported framework/manual cases remain visible in reports.
5. Package local CLI tarballs and document commands, metadata review, credentials, activation, limitations, recovery, and separate registry release requirements. This change does not run onboarding against the sibling production site or publish a package.
