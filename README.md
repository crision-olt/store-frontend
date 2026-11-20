# Store frontend

A React and Vite frontend for the store service.

## Source layout

- `src/pages`: routes and page-level flows.
- `src/components`: shared UI, tables and feature components.
- `src/lib`: service clients, schemas and data helpers.
- `src/hooks` and `src/providers`: shared behavior and application state.
- `src/locales`: English and Spanish translations.

## Local development

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`. Set `AUTH_SERVICE_URL` to the browser-accessible
   service origin; the example matches the service's default `http://localhost:3000`.
3. Configure the service's `AUTH_FRONTEND_URL` to the frontend origin, normally
   `http://localhost:5173`, and start the service with its database prepared.
4. Run `pnpm dev` and open the URL reported by Vite.

The service database must include the `user` role for registration. The service's
documented initial schema currently does not create that role.

Vite embeds `AUTH_SERVICE_URL` at build time; rebuild when it changes. Do not put
secrets in it.

## Session and deployment

Login and registration call `/auth/login` and `/auth/register` with cookies enabled.
`AUTH_FRONTEND_URL` must match this application's origin for CORS. The service uses a
`SameSite=Lax` cookie, so the applications must be deployed on compatible sites for
the browser to send the session cookie. The service sets `Secure` on production cookies,
which requires HTTPS.

While a user is inside the authenticated layout (`StoreLayout`), `useSessionGuard`
(`watchSession` in `src/lib/auth-api.ts`) keeps an `EventSource` connection open to
`GET /auth/events` with credentials. If an administrator blocks the account, the server
pushes a `blocked` event; the frontend immediately calls `/auth/logout`, clears the
TanStack Query cache, and redirects to `/login` with a blocked-account notice.

When a protected query or mutation returns `401`, the frontend clears cached data and
redirects to login with the current path as the return destination. Unsaved changes are
lost. The session is checked on requests; the frontend does not refresh tokens or poll
for expiry. A reverse proxy must allow the service's SSE connection to stay open.

## Features

After applying the service's zones migration, use **Tables** to configure your
restaurant tables, then open **Zones** to create or edit a zone. Use the
**Tables** dropdown to select multiple unassigned tables. When editing, the
zone's current tables remain selectable. A sun marks outdoor tables, and an
accessibility icon marks accessible tables. Enable **Has an outdoor area** to
include outdoor tables. Turning it off clears outdoor selections when you save.
Mark **Base zone** to designate a zone as the base. Saving a new base zone
automatically removes that designation from the previous one.

After setting up the service's database, use **Categories** in the navigation
to create categories and subcategories. Product filters use their IDs
while displaying their names.

Use **Allergens** to view the 14 EU food allergen categories in English or Spanish.
The page is a read-only reference. To assign allergens, use the optional
**Allergens** multiselect when creating or editing a product. An empty selection
means no allergens have been recorded, not that the product is allergen-free.

Use **Menus and promotions** to create or edit bundles containing one of each
selected product. Set a fixed menu price or apply a percentage discount to the
selected products' current subtotal. For a promotion, set **Minimum different
products** to allow any subset of the eligible list that meets the minimum.
For example, select six coffees, set the minimum to four, and enter a 10% discount.
Repeated units of the same coffee count as one. The page previews fixed bundle
totals; it does not apply offers to orders. If a product is archived, remove it from the bundle
before saving changes.

On **Products**, select **Create product** above the table. Enter a name, unique SKU,
category, and price; description and subcategory are optional. Subcategories
belong to the selected category. Saving immediately closes the dialog and shows a
pending product as the first row inside the table, independently of its filters
and sorting. Pending rows show a saving status and cannot be edited or archived until saved.
The row remains pending until the request and catalog refresh finish; the table
then shows the server results using the existing filters and sorting.
Failed saves remove the pending row and reopen the form with your entries and an error
message. Pending products use TanStack Query mutation state, not the product cache.

Select **Edit** in a product's actions column to open the same form with its current
details. **Save** persists your changes and refreshes the catalog without resetting
filters or sorting. Failed saves keep your edits and display an error; **Cancel**
discards unsaved changes.
The actions column is always visible, has an empty header, and is omitted from **Columns** settings.

Select **Archive** in the actions column and confirm to hide a product from the catalog.
Its data and SKU are retained, not deleted. The row stays until archiving and the
catalog refresh finish; failed requests show an error and allow retrying.
There is no restore screen yet. Existing service databases need the
`sql/products-archived.sql` migration before using this feature; see the service README.

On **Products**, use **Filters** above the table to open a dropdown without moving
the table. Close it with Escape, the close button, or a click outside.
Controls start hidden unless filters are already active. Active filter chips remain
visible when controls are hidden; remove a chip to clear that filter or use **Clear
filters** to reset all filters. Removing or changing a category also clears the
subcategory selection.

Product prices are displayed in euros using the selected language's number format.
The table fits its rows and scrolls vertically when its content exceeds 24rem.
The product-name column stays pinned on the left when the table scrolls horizontally.
Drag a column's right header edge to resize it live as you move the pointer.
Use **Columns** to show, hide, or reorder other columns by their drag handles.
The dropdown lists both visible and hidden columns; the pinned product name cannot
be hidden or moved. To reorder with the keyboard, focus a handle, press Space,
use the arrow keys, then press Space to drop or Escape to cancel.

Select **Download Excel** beside **Columns** to save `Products_{timestamp}.xlsx`,
where the timestamp is the current Unix time in milliseconds. The export uses all
loaded results for the current filters and sort, not just rows visible in the
scroll viewport. Only visible data columns are included, in their displayed order,
with translated headers; actions and unsaved products are excluded. Prices stay
numeric, and creation dates retain their ISO timestamps.
Downloading is disabled while filters are debouncing, results are loading or
refreshing, filters are invalid, loading failed, or there are no saved results.
The service's `/exports/xlsx` endpoint supplies the styled workbook. The browser
buffers the request and completed download before saving; the service still
parses and generates the workbook incrementally. A failed or interrupted download
shows an error and can be retried without resetting the table configuration.

On **Users**, use **Filters** to combine an email search with a role or account
status. Remove individual filters using their chips, or select **Clear filters**.
Use **Columns** to show, hide, or reorder data columns; email stays pinned and
user actions remain available.

Use **Roles and permissions** to create permissions and new roles with selected
permissions. The API requires `access:manage`; see the service's roles and permissions
setup for bootstrapping an administrator. This page does not assign roles to users.

The existing redirect parameter accepts only paths on this frontend's origin; it does
not redirect to external applications.

## Tests

Run `pnpm test` for Vitest tests, `pnpm lint` for alias checks and Oxlint, and
`pnpm build` for strict TypeScript checks and the production build. Vitest globals,
including `describe`, `it`, `expect`, hooks, and `vi`, are available without imports.

Tests use jsdom and mocked service calls where appropriate; they do not replace
browser tests against a running service.
