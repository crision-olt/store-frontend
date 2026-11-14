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

Use **Roles and permissions** to create permissions and new roles with selected
permissions. The API requires `access:manage`; see the service's roles and permissions
setup for bootstrapping an administrator. This page does not assign roles to users.

The existing redirect parameter accepts only paths on this frontend's origin; it does
not redirect to external applications.

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
