# Repository Guidelines

## Project overview

This is a Next.js App Router frontend for authenticating with Monzo, browsing
accounts and pots, and managing scheduled pot transfers.

- `/` is blank, reserved for a future project story or dev blog.
- `/console` displays a login link when signed out. When signed in, it shows the user
  ID, accounts, balances, and a logout action.
- `/console/account/[accountId]` displays an account balance and its pots.
- `/console/account/[accountId]/pot/[potId]` displays a pot balance and supports listing,
  filtering, paginating, creating, and cancelling scheduled transfers.
- `/callback` validates OAuth `code` and `state` parameters and calls the
  same-origin callback API.
- Route Handlers under `/api` validate requests and backend responses, then make
  authenticated server-to-server requests using the JWT from the session cookie.

## Package manager

Use pnpm exclusively. Do not create or commit `package-lock.json` or `yarn.lock`.

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

The pnpm version is pinned in `package.json` through the `packageManager` field.

## Environment variables

Required variables are documented in `.env.example`:

- `BASE_URL`: server-only origin of the authentication backend.
- `SESSION_COOKIE_NAME`: name of the frontend session cookie.

Never hardcode deployment URLs, JWTs, OAuth credentials, or other secrets in source files. Never commit `.env`, `.env.local`, private keys, package-manager authentication files, or Vercel metadata.

Do not rename `BASE_URL` to a `NEXT_PUBLIC_*` variable. Backend configuration must remain server-only.

## Authentication rules

- Browser code must call same-origin Next.js Route Handlers, not the backend IP directly.
- The login link may navigate directly to `${BASE_URL}/monzo-redirect` in a new tab.
- The backend callback response is expected to contain `{ "token": "<jwt>", "expiresIn": <seconds> }`. `expiresIn` is optional.
- JWTs must never be returned to client-side JavaScript, placed in URLs, logged, or stored in local storage.
- Session cookies must remain `HttpOnly`, `Secure` in production, `SameSite=Lax`, and scoped to `/`.
- Validate all backend responses before setting cookies.
- Authenticated backend requests must go through narrow, endpoint-specific Route
  Handlers. Read the JWT from the cookie server-side and forward it as
  `Authorization: Bearer <jwt>`.
- Do not add a generic user-controlled proxy endpoint.

## Code conventions

- Keep the interface intentionally small and dependency-light.
- Use strict TypeScript and validate untrusted JSON at runtime.
- Keep server-only environment access in Server Components or Route Handlers.
- Keep browser APIs and React hooks in Client Components marked with `"use client"`.
- Use the shared SWR cache for authenticated client-side reads so identical requests
  are deduplicated across navigation. Do not persist authenticated data in browser storage.
- Preserve accessible status messaging and reduced-motion behavior.

## Colour system

The canonical brand palette is:

| Token | Colour | Hex | Intended use |
| --- | --- | --- | --- |
| `deep-navy` | Deep Navy | `#082B63` | Primary brand, headings, navigation, key UI |
| `ocean-blue` | Ocean Blue | `#0B6A95` | Interactive elements and informational highlights |
| `mint` | Mint | `#8FDACB` | Success, accents, illustrations, and highlights |
| `coral` | Coral | `#FF5B71` | Alerts and destructive or exceptional emphasis |
| `sunset-orange` | Sunset Orange | `#F9A64B` | Warnings, badges, and highlights |
| `warm-sand` | Warm Sand | `#FFF4EE` | Page backgrounds and warm foreground text |
| `slate-text` | Slate Text | `#24324A` | Body text, labels, and icons |
| `soft-border` | Soft Border | `#E7ECF2` | Borders, dividers, and input fields |

Use the brand primitives and semantic `--color-*` custom properties in
`app/globals.css`; do not hardcode brand colors in component styles. Components
should consume semantic tokens so light and dark themes can choose accessible
variants.

| Semantic role | Light mode | Dark mode |
| --- | --- | --- |
| Page background | Warm Sand `#FFF4EE` | Derived navy `#051C40` |
| Navigation | Deep Navy `#082B63` | Derived navy `#04152F` |
| Card, form, and input surface | White `#FFFFFF` | Deep Navy `#082B63` |
| Heading | Deep Navy `#082B63` | Warm Sand `#FFF4EE` |
| Body text | Slate Text `#24324A` | Warm Sand `#FFF4EE` |
| Muted text | Derived slate `#55627A` | Derived slate `#CBD5E1` |
| Primary/completed/success | Derived Mint `#246E62` | Mint `#8FDACB` |
| Secondary/pending/info | Derived Ocean `#0B5B80` | Derived Ocean `#A7DFF2` |
| Danger/error | Derived Coral `#C7354D` | Derived Coral `#FF9AAA` |
| Cancelled/warning | Derived Orange `#76500B` | Sunset Orange `#F9A64B` |
| General border | Soft Border `#E7ECF2` | Derived blue `#557AA2` |
| Focus indicator | Ocean Blue `#0B6A95` | Mint `#8FDACB` |

- Primary actions must use the same family as completed/success states.
- Secondary actions and general interactive controls must use the same family as
  pending/info states.
- Coral is not the primary action color; reserve it for danger/error emphasis.
- Pair light Mint, Coral, and Sunset Orange fills with Deep Navy text. Do not use
  white text on Coral for normal-size text because it does not meet AA contrast.
- Keep both explicit dark-theme declarations in `app/globals.css` synchronized:
  `:root[data-theme="dark"]` and the system-preference fallback.

## Application architecture

- Keep `app/` focused on Next.js entry points: pages, layouts, Route Handlers,
  global CSS, and other framework file conventions. Route pages should primarily
  compose imported components.
- Put React UI under `components/`, grouped by responsibility or domain:
  - `components/ui/` for domain-independent controls and presentation primitives.
  - `components/layout/` for shared page structure.
  - `components/providers/` for client context providers.
  - Domain folders such as `components/accounts/`, `components/auth/`, and
    `components/scheduled-transfers/` for feature-specific UI.
- Put non-React application logic under `lib/`, grouped by domain. Types,
  runtime validation, request clients, SWR keys, formatting, and date handling
  belong here rather than in component or route files.
- Use the `@/*` path alias for imports that cross directory or domain boundaries.
  Relative imports are appropriate for files colocated in the same component folder.
- Keep server-only logic in explicitly named `*.server.ts` modules and import
  `server-only` when it prevents accidental client use.
- Keep `app/globals.css` limited to design tokens, resets, and document-wide
  rules. Put component and feature styling in colocated `*.module.css` files.
- Colocate behavior-focused tests with the component or library module they test.
- Add new folders and abstractions only when they contain meaningful code; do not
  create architectural placeholders for hypothetical features.

## Verification

After meaningful changes, run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Keep tests lean and behavior-focused. Prioritize important happy paths, empty
responses, and graceful handling of backend failures. Do not test incidental DOM
hierarchy, styling details, or framework behavior.

For authentication changes, also test:

- Missing `code` or `state` returns an error without calling the backend.
- Backend failures do not set a session cookie.
- Successful callbacks set the cookie without exposing the JWT in the response body.
- The console page recognizes the configured session cookie.

## Scope and safety

- Preserve unrelated user changes.
- Do not commit generated build directories such as `.next` or `out`.
- Do not deploy, push, or modify external services unless explicitly requested.
