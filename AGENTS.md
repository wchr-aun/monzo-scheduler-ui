# Repository Guidelines

## Project overview

This is a minimal Next.js App Router frontend for a Monzo scheduler authentication flow.

- `/` displays a login link or `Logged in` when the session cookie exists.
- `/callback` validates OAuth `code` and `state` parameters and calls the same-origin callback API.
- `/api/auth/callback` calls the authentication backend server-to-server, receives a JWT, and stores it in a secure `HttpOnly` cookie.

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
- Future authenticated backend requests should go through narrow, endpoint-specific Route Handlers. Read the JWT from the cookie server-side and forward it as `Authorization: Bearer <jwt>`.
- Do not add a generic user-controlled proxy endpoint.

## Code conventions

- Keep the interface intentionally small and dependency-light.
- Use strict TypeScript and validate untrusted JSON at runtime.
- Keep server-only environment access in Server Components or Route Handlers.
- Keep browser APIs and React hooks in Client Components marked with `"use client"`.
- Preserve accessible status messaging and reduced-motion behavior.

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
- The landing page recognizes the configured session cookie.

## Scope and safety

- Preserve unrelated user changes.
- Do not commit generated build directories such as `.next` or `out`.
- Do not deploy, push, or modify external services unless explicitly requested.
