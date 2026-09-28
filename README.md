# Monzo Scheduler UI

A minimal Next.js frontend with:

- `/` — shows a login button, or `Logged in` when the configured session cookie exists.
- `/callback` — validates its `code` and `state` query parameters, completes authentication through a same-origin server route, and shows a completion message.

## Run locally

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Set `BASE_URL` to the authentication service origin. The login button opens `${BASE_URL}/monzo-redirect` in a new tab as a full browser navigation, so redirects are followed normally.

The callback page calls `/api/auth/callback`. That server route forwards `code` and `state` to `${BASE_URL}/monzo-callback`, expects `{ "token": "<jwt>", "expiresIn": 86400 }`, and stores the JWT in a secure `HttpOnly` cookie on the frontend domain. `expiresIn` is optional; without it, the cookie lasts for the browser session.

The backend callback endpoint is called server-to-server with `GET` after both required parameters have been validated. It should return `Cache-Control: no-store` and must never put the JWT in a redirect URL.
