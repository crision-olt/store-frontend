# Store frontend

A React and Vite application for managing a store. The frontend is organized around
feature boundaries so presentation, application workflows, domain rules, and network
details can change independently.

## Architecture

| Layer | Location | Responsibility |
| --- | --- | --- |
| Presentation | `src/pages`, `src/components` | Render views, collect input, and show loading, success, and error states. |
| Server-state hooks | `src/features/<feature>/hooks.ts` | Bind endpoints to TanStack Query and own cache keys, invalidation, and cache updates. |
| Application | `src/features/<feature>/application` | Expose use cases and feature workflows to the UI. |
| Domain | `src/features/<feature>/domain` | Define feature types, rules, and repository contracts without React or network dependencies. |
| Infrastructure | `src/features/<feature>/infrastructure`, `src/lib/*-api.ts` | Implement repository contracts and handle HTTP, response validation, and service errors. |
| Composition | Feature entry points under `src/features` | Connect application use cases to concrete infrastructure adapters. |
| Shared platform | `src/providers`, `src/hooks`, `src/components/ui` | Configure routing, localization, session/query state, and reusable UI. |

The dependency direction is inward:

```text
pages and components → feature hooks → feature application → domain contracts
infrastructure adapters → domain contracts
feature composition → application + infrastructure
```

Views should use endpoint hooks, not construct queries or call transport APIs. Use cases
depend on repository interfaces; adapters implement those interfaces and reuse the
existing API modules instead of duplicating requests or validation. Keep domain rules
independent of React, TanStack Query, and `fetch`. Add an interface when it protects a
real feature boundary or makes the workflow independently testable.

For example, product creation flows from the dialog through a create-product use case
and repository contract to an API adapter. The adapter delegates to the existing
products API, which owns HTTP and response validation. The view remains responsible
for form interaction and rendering the result.

### Endpoint hooks and cache keys

Use the feature's query and mutation hooks for endpoint calls. Pass UI callbacks or
query options such as `enabled`; keep cache invalidation inside the hooks. Shared
resources, such as roles used by Users and Access, use the same hook and cache entry.

`src/lib/query-keys.ts` defines the resource identifiers and all query/mutation keys.
Keys start with the resource and HTTP method, for example `[Service.Users, HttpMethod.GET]`.
Filtered product keys also include their parameters; mutations use `mutationKey`
with their actual write method. Invalidate the centralized resource query prefix
when all filtered variants need refreshing.

`Service` and `HttpMethod` are typed, enum-like constant objects because the project enables
TypeScript's `erasableSyntaxOnly`; they provide named identifiers without requiring
runtime enum compilation or changing the compiler configuration.

## Local development

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and set `AUTH_SERVICE_URL` to the browser-
   accessible service origin. The example uses `http://localhost:3000`.
3. Start `store-service` with its database prepared. The service's `.env.example`
   sets `AUTH_FRONTEND_URL` to `http://localhost:5173`; update it if Vite uses a
   different origin, and use the same hostname for both applications.
4. Run `pnpm dev` and open the URL reported by Vite.

The service database must include the `user` role for registration; the documented
initial schema currently does not create it. Vite embeds `AUTH_SERVICE_URL` at build
time, so rebuild when it changes. Do not put secrets in this variable.

## Session and deployment

Login and registration call `/auth/login` and `/auth/register` with cookies enabled.
`AUTH_FRONTEND_URL` must match this application's origin for CORS. The service uses a
`SameSite=Lax` cookie, so the applications must be deployed on compatible sites for
the browser to send the session cookie. Production cookies use `Secure` and require
HTTPS.

Inside the authenticated layout, `useSessionGuard` keeps an `EventSource` connection
open to `GET /auth/events` with credentials. A `blocked` event triggers logout, query
cache clearing, and a redirect with a blocked-account notice. A protected request
returning `401` clears cached data and redirects to login with the current path as the
return destination. Unsaved changes are lost. The frontend does not refresh tokens or
poll for expiry; a reverse proxy must allow the service's SSE connection to stay open.

The redirect parameter accepts only paths on this frontend's origin and cannot send
users to external applications.

## Feature behavior

- **Catalog:** Categories and subcategories organize products; names support English
  and Spanish. Older records with no Spanish name fall back to English, but saving an
  edit requires both names. Product creation supports optional descriptions and
  allergens. An empty allergen selection means none were recorded, not that a product
  is allergen-free.
- **Products:** Creation shows a pending row while saving without inserting it into
  the catalog cache; failed saves remove the row and reopen the form with entered
  values. Editing preserves filters and sorting. Archiving hides a product while
  retaining its data and SKU; there is no restore screen. Existing databases need
  `sql/products-archived.sql`.
- **Tables and zones:** Apply the service's zones migration, configure tables, then
  create zones. Zones can include multiple tables, designate a base zone, and
  represent outdoor and accessible tables. Saving a new base zone removes that
  designation from the previous one; disabling outdoor seating clears outdoor
  selections when saved.
- **Allergens:** The page is a read-only reference to the 14 EU food allergen
  categories in English and Spanish.
- **Menus and promotions:** Bundles contain selected products. Menus use a fixed
  price or a percentage discount; promotions allow eligible subsets that meet a
  minimum number of different products. Repeated units count once. These pages
  preview offer totals; they do not apply offers to orders. Remove archived products
  from a bundle before saving.
- **Discounts:** `/discounts` manages invoice-wide discount definitions; it does not
  apply them to invoices. Apply `sql/discounts.sql` in `store-service` first.
- **Users and access:** Users can be filtered by email, role, or account status.
  Roles and permissions can be created, but this page does not assign roles to users.
  The access API requires `access:manage`; see the service README for administrator
  bootstrapping.
- **Product export:** Download Excel exports all loaded results for the current
  filters and sort, not only visible rows. It includes visible data columns in their
  displayed order, excludes actions and unsaved products, and preserves numeric
  prices and ISO creation dates. The service's `/exports/xlsx` endpoint provides the
  styled workbook. Failed or interrupted downloads can be retried without resetting
  the table configuration.

For existing service database setup and migrations, see the `store-service` README.

## Verification

- `pnpm test` runs Vitest. Tests use jsdom and mocked service calls where appropriate;
  they do not replace browser tests against a running service.
- `pnpm lint` checks import aliases and runs Oxlint.
- `pnpm build` runs strict TypeScript checks and creates the production build.

Vitest globals (`describe`, `it`, `expect`, hooks, and `vi`) are available without
imports.
