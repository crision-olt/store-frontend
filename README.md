# React + TypeScript + Vite

## Auth service

Copy `.env.example` to `.env.local` and set `AUTH_SERVICE_URL` to the browser-accessible
origin of the auth service, for example `http://localhost:3001`. Vite embeds this value
at build time; rebuild when it changes. Do not put secrets in it.

Login and registration call `/auth/login` and `/auth/register` with cookies enabled.
Configure the auth service's `AUTH_FRONTEND_URL` to match this application's origin for
CORS. The service uses a `SameSite=Lax` cookie, so the applications must be deployed
on compatible sites for the browser to send the session cookie.

After setting up the service's database, use **Categories** in the navigation
to create categories and subcategories. Product filters use their IDs
while displaying their names.

On **Products**, select **Create product** above the table. Enter a name, unique SKU,
category, price, and stock; description and subcategory are optional. Subcategories
belong to the selected category. Saving immediately closes the dialog and shows a
pending product as the first row inside the table, independently of its filters
and sorting. Pending rows show a saving status and cannot be edited until saved.
The row remains pending until the request and catalog refresh finish; the table
then shows the server results using the existing filters and sorting.
Failed saves remove the pending row and reopen the form with your entries and an error
message. Pending products use TanStack Query mutation state, not the product cache.

Select **Edit** in a product's actions column to open the same form with its current
details. **Save** persists your changes and refreshes the catalog without resetting
filters or sorting. Failed saves keep your edits and display an error; **Cancel**
discards unsaved changes.
The actions column is always visible, has an empty header, and is omitted from **Columns** settings.

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

Use **Roles and permissions** to create permissions and new roles with selected
permissions. The API requires `access:manage`; see the service's roles and permissions
setup for bootstrapping an administrator. This page does not assign roles to users.

The existing redirect parameter accepts only paths on this frontend's origin; it does
not redirect to external applications.

## Tests

Run `pnpm test`. Vitest globals, including `describe`, `it`, `expect`, hooks, and `vi`, are available without imports.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
