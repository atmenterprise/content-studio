# Proposal

## Why

Connecting an existing website to Content Studio currently requires manually discovering content, defining schemas, seeding entries, and wiring delivery reads. A review-first CLI can automate that work while retaining the website's content, styling, and behavior when analysis is uncertain or delivery is unavailable.

## What Changes

- Add the `onboard-site` package/bin accepting a local path or Git URL and statically analyzing TSX, JSX, HTML, and local JSON into semantic content candidates with source provenance.
- Add OpenAI, Anthropic, and Gemini provider adapters for structured extraction constrained and validated against Phase 2's v2 Zod field contract; group sections into singleton/repeating collections and preserve source-backed values.
- Write a reviewable `content-spec.json` plus a separate provenance/coverage report; map extraction seedData to the existing collections[].entries ingestion shape, with draft seeds by default.
- Add explicit `--apply` provisioning of an existing reviewed file through `/api/v1/onboard`, with local validation, authenticated requests, resumable receipts, and no automatic publishing.
- Add optional `--apply --refactor` to prepare `feat/connect-content-studio` in an isolated Git worktree, install the client, run Phase 3 typegen, and apply supported AST-based content bindings with local fallback defaults.
- Report unsupported frameworks/dynamic expressions and unmapped content instead of claiming universal automatic conversion. Preserve a useful analyzed specification even where automatic source rewriting is unavailable.
- Exclude deployment, push/PR creation, automatic publication, screenshot-driven inference, executing sites during analysis, uploading media, secret migration, and arbitrary LLM-authored code patches.

## Capabilities

### New Capabilities

- `repository-analysis`: Local/Git acquisition, static semantic extraction, source provenance, and coverage reporting.
- `schema-extraction`: Provider-neutral structured LLM extraction and human-reviewable, contract-valid schema/seed artifacts.
- `site-connection`: Reviewed provisioning, resumable connection state, and optional isolated SDK/typegen/refactoring workflow.

### Modified Capabilities

None in the current main-spec inventory. Changes 001–003 are pending plans; this change consumes their onboarding, field, delivery, and typegen contracts without rewriting their artifacts.

## Impact

The repository currently has planning artifacts only. Implementation adds a Node/TypeScript CLI workspace package, parser/provider SDK dependencies, fixtures, documentation, and integration tests. Analysis and extraction can run without a live Studio; provisioning requires 001/002, and refactoring additionally requires 003's client/schema export/typegen. The existing dependency-free SDK remains dependency-free.

The sibling `../jazzsinghpersonaltrainer` provides a concrete mixed Vite/Next.js reference with JSON-backed pages, hardcoded JSX, hooks, and dynamic expressions. Use sanitized fixtures inspired by those patterns; this proposal does not run extraction, contact an LLM, provision a tenant, modify the sibling repository, or publish packages.
