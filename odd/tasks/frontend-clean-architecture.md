# Frontend Clean Architecture

Objective: apply clear inward dependencies across the frontend while preserving existing behavior.
Branch: `feat/frontend-clean-architecture` | Delivery: `feature-branch-chain` | Checks: `pnpm test`, `pnpm lint`, `pnpm build`.

## Specs

### S1 — Separation of concerns

User requirement: “Each component in your application has a clear responsibility. This decoupling makes code easier to reason about, modify, and reuse.”

Acceptance: presentation components focus on display and interaction; application operations own feature orchestration; transport stays in infrastructure. Existing observable behavior remains unchanged.

Checks: affected feature tests, then `pnpm test`, `pnpm lint`, and `pnpm build`.

### S2 — Dependency inversion

User requirement: “High-level modules shouldn’t depend on low-level details. Instead, core business logic depends on abstractions (e.g., interfaces), making it possible to swap out concrete implementations without breaking things.”

Acceptance: use cases depend on feature-facing repository contracts; concrete adapters implement those contracts. Domain rules do not import React, TanStack Query, or `fetch`.

Checks: focused unit tests, dependency-boundary scans, lint, and build.

### S3 — View and use-case responsibilities

User requirements:
- “The View Layer’s responsibility is to translate data into the visual elements that users interact with.”
- “The UseCase layer orchestrates the steps a user takes within your application”
- “It retrieves data from repositories and maps it into a form readily consumable by your view components (view models).”

Acceptance: migrate frontend feature flows to call application operations rather than transport APIs directly, preserving routing, loading/error states, cache behavior, and form outcomes.

Checks: existing page/component tests for each migrated feature group.

### S4 — Repositories and adapters

User requirements:
- “The Repository layer isolates your application’s core logic from the specifics of data storage.”
- “Repositories offer a consistent way to get, change, and potentially invalidate (refresh) data.”
- “The adapter is the concrete implementation of the repository interface, actually handling the network operations.”

Acceptance: define repository contracts and concrete adapters at feature boundaries; reuse existing API/HTTP modules for transport instead of duplicating request or validation logic.

Checks: adapter tests and affected feature tests.

### S5 — Services and tests

User requirements:
- “Services encapsulate domain logic, independent of UI concerns.”
- “Tests are essential: Clean Architecture makes it simpler to write unit, integration, and end-to-end tests”

Acceptance: keep domain calculations independent of presentation and add focused tests for introduced boundaries and behavior.

Checks: focused tests, `pnpm test`, `pnpm lint`, and `pnpm build`.

### S6 — Frontend-wide scope and README

User request: “Rewrite the readme and also make the changes to make a clean arquitecture”

Scope selection: “frontend-wide”

Acceptance: document the implemented architecture and migrate the frontend feature groups, including catalog/commerce, restaurant setup, access/users, and authentication/session. Retain the README’s essential setup, deployment, and feature behavior guidance.

Checks: README readback; full frontend tests, lint, and build.

Assumption: use feature-facing application boundaries and repository contracts while retaining stable routes, UI, and current transport behavior; do not introduce abstractions without a concrete feature boundary.

## Tasks

- T1 — Establish architecture conventions and migrate the first vertical feature slice; S1–S5; route: inline; status: done; evidence: meaningful RED on lost repository result, then 10 focused tests, lint, and build passed; risk: none; commit: `cf8d30b` (C1).
- T2 — Migrate catalog and commerce feature flows to application/repository boundaries; S1–S5; route: delegated; status: done; evidence: focused 10 files/62 tests and correction 9 files/33 tests passed; no meaningful RED was observed for extracted behavior; risk: none; commits: `0216f20` (C2), `a4c1a22` (C3).
- T3 — Migrate restaurant setup, access/users, and authentication/session flows; S1–S5; route: delegated; status: done; evidence: initial 12 focused files/44 tests and isolated C4 check 13 files/45 tests passed; independent review and parent spot-check confirmed logout/reset/redirect order; no meaningful RED was observed for extracted behavior; risk: item 4 (session callback ordering); commit: `2f53147` (C4).
- T4 — Rewrite README for the implemented architecture and verify the full frontend; S6; route: inline; status: done; evidence: README readback, dependency-boundary scans, `pnpm test` (38 files/227 tests), `pnpm lint`, `pnpm build`, and `git diff --check` passed; risk: none; commit: C5 (`docs: document frontend feature architecture`; exact hash recorded in the Engram mirror).

### Work-unit slices

- C1 — Catalog and product workflows: `cf8d30b` — `refactor(catalog): isolate product and allergen workflows`; isolated verification: 5 test files/54 tests.
- C2 — Offers and discounts: `0216f20` — `refactor(offers): isolate offer and discount workflows`; isolated verification: 4 test files/7 tests.
- C3 — Excel export: `a4c1a22` — `refactor(exports): isolate spreadsheet download workflow`; isolated verification: 2 test files/31 tests.
- C4 — Platform features: `2f53147` — `refactor(platform): isolate setup, access, and session workflows`; isolated verification: 13 test files/45 tests and independent review for risk item 4.
- C5 — Documentation: `docs: document frontend feature architecture`; includes README and this feature record. Its exact hash is recorded in the Engram mirror because a commit cannot contain its own hash.

Forecast: more than 400 authored changed lines across the frontend-wide refactor. The user selected `feature-branch-chain`; this records future PR stacking only and does not authorize pushing or opening PRs.

## Log

- L1: “Rewrite the readme and also make the changes to make a clean arquitecture”
- L2: “frontend-wide”
- L3: The existing frontend groups pages, components, hooks, providers, and API modules by technical layer. Pages and feature components currently own much of TanStack Query orchestration and call API modules directly; the API modules already isolate HTTP and response validation.
- L4: The user selected a frontend-wide scope. Work is on `feat/frontend-clean-architecture`; T1–T4 are complete and C1–C4 are committed.
- L5: T1 begins with the product creation vertical slice. Keep existing product request validation and HTTP behavior; move input normalization and the repository boundary into the feature application/domain.
- L6: T1 added a domain product model/input, repository contract, API adapter, and injected create use case. Existing create-dialog recovery requires normalized mutation variables, and the mutation result remains the repository response.
- L7: T2 migrated the catalog and commerce views to feature operations, repository contracts, adapters, and tested offer-pricing/discount rules. Its initial focused runs passed (3 files/24 tests and 10 files/62 tests); the attempted RED setup failed before assertions because new modules did not exist.
- L8: T3 migrated restaurant setup, access/users, and auth/session flows. Its 12-file focused suite passed (44 tests); the session guard's event/logout/reset/redirect order was unchanged. Initial new-module test runs failed at import resolution before assertions, so no meaningful RED was observed.
- L9: A parent dependency-boundary check found production views still importing API-layer error classes and types after T2. T2 was reopened for a targeted correction; tests may continue to import API modules as test doubles.
- L10: T2 removed production API error/type imports; only tests retain direct transport imports. Dependency scans found no API imports in views and no React, TanStack Query, or `fetch` usage in domain code. The correction passed 9 focused files/33 tests.
- L11: Final checks passed: 38 test files/227 tests, lint (four existing warnings), TypeScript/build (existing large-chunk warning), and whitespace check. No authored behavior changed the session event ordering.
- L12: Before the first work-unit commit, the user selected `feature-branch-chain`. Do not push or create PRs without explicit authorization.
- L13: The planned slices are complete as C1 catalog/products, C2 offers/discounts, C3 Excel export, C4 platform features, and C5 documentation.
- L14: C1 `cf8d30b` was verified in isolation (5 files/54 tests); C2 `0216f20` passed 4 files/7 tests; C3 `a4c1a22` passed 2 files/31 tests.
- L15: C4 `2f53147` passed its isolated focused suite (13 files/45 tests). Independent review and parent spot-check confirmed the blocked-session callback still orders logout, session reset, then redirect; logout failures remain logged.
- L16: The full combined tree passed `pnpm test` (38 files/227 tests), `pnpm lint`, `pnpm build`, and `git diff --check` before slicing; lint had four pre-existing warnings and build had the existing large-chunk warning.
- L17: C5 commits this README and task record as `docs: document frontend feature architecture`; the exact C5 hash is saved in the Engram mirror after commit. No push or PR is authorized.
