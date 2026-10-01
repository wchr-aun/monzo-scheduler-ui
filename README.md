# Monzo Scheduler UI

A small Next.js App Router application for authenticating with Monzo, browsing
accounts and pots, and managing scheduled transfers.

## What the application does

- Authenticates through a backend OAuth flow and stores the returned JWT in a
  secure `HttpOnly` session cookie.
- Lists Monzo accounts and retrieves their available and total balances.
- Displays the pots belonging to an account and each pot's current balance.
- Creates recurring deposits into, or withdrawals from, a pot using UK dates
  and times.
- Lists scheduled transfers with status filtering, pagination, localized dates,
  and status badges.
- Cancels pending scheduled transfers.
- Shares authenticated client reads through SWR so identical requests are
  deduplicated across navigation.
- Supports persistent light and dark themes, including the user's system theme
  when no explicit preference has been saved.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Project landing page with a pot preview, story and development sections, and console access |
| `/console` | Login when signed out; user identity, account list, balances, and logout when signed in |
| `/callback` | Validate OAuth callback parameters and complete login through the same-origin API |
| `/console/account/[accountId]` | Show account balances and pots |
| `/console/account/[accountId]/pot/[potId]` | Show a pot and create, filter, paginate, or cancel scheduled transfers |

The browser only calls narrow, same-origin Route Handlers under `/api`. Those
handlers read the JWT from the session cookie, send it to the configured backend
as `Authorization: Bearer <jwt>`, and validate untrusted backend responses before
returning data to the UI. The JWT is never exposed to client-side JavaScript.

The phone preview renders the existing `Navbar`, `PotDetails`, and `ScheduledTransfers`
components with sample data
from an isolated SWR cache. Revalidation is disabled, so it makes no authenticated
account requests. The preview is inert, with disabled
controls and a not-allowed cursor. Its invite button links to an on-page section;
the email form is marked coming soon and disabled until invite collection is
connected. Story and development copy are editable in
`components/landing/landing-page.tsx`.

## Run locally

The project uses the pnpm version pinned in `package.json`.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Configure these server-only values in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `BASE_URL` | Origin of the authentication and scheduler backend |
| `SESSION_COOKIE_NAME` | Frontend session-cookie name; defaults to `session` |

The login link navigates to `${BASE_URL}/monzo-redirect`. After authorization,
the callback page calls `/api/auth/callback`, which forwards validated `code` and
`state` values to `${BASE_URL}/monzo-callback`. The backend response must contain
`{ "token": "<jwt>" }` and may include `expiresIn` in seconds. Without
`expiresIn`, the cookie lasts for the browser session. Successful login returns
to `/console`.

## Development commands

```bash
pnpm test
pnpm typecheck
pnpm build
```

Tests use Vitest and Testing Library. TypeScript runs in strict mode.

## Project structure

- `app/` contains the landing page, global tokens, and server-side Route
  Handlers. Application pages live under `app/console/`; `/callback` stays at its
  existing path for OAuth. The console and callback layouts share application
  navigation, providers, and the footer.
- `components/` contains the project landing page, UI primitives, layout components, and account,
  authentication, and scheduled-transfer features.
- `lib/` contains request clients, cache keys, runtime validation, domain types,
  money formatting, session helpers, and UK date-time handling.

Authenticated browser reads use the shared SWR provider. Sensitive values are
kept server-side and authenticated data is not persisted in browser storage.

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

Components consume semantic variables from `app/globals.css` rather than using
brand hex values directly. This allows the same meaning to remain consistent
while choosing accessible colors for each theme.

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

Primary actions deliberately share the completed/success family, while
secondary actions share the pending/info family. Coral is reserved for errors
and dangerous actions. Light accent fills use Deep Navy text where needed to
maintain accessible contrast.
