# Schedzo UI

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
| `/` | Project landing page with a pot preview, story, features, and open-source links, and console access |
| `/console` | Login when signed out; user identity, account list, balances, and logout when signed in |
| `/demo` | Interactive console demo with simulated login and sample data |
| `/demo/account/[accountId]` | Browse sample balances and pots |
| `/demo/account/[accountId]/pot/[potId]` | Create, filter, paginate, and cancel simulated scheduled transfers |
| `/callback` | Validate OAuth callback parameters and complete login through the same-origin API |
| `/console/account/[accountId]` | Show account balances and pots |
| `/console/account/[accountId]/pot/[potId]` | Show a pot and create, filter, paginate, or cancel scheduled transfers |

The live console only calls narrow, same-origin Route Handlers under `/api`. Those
handlers read the JWT from the session cookie, send it to the configured backend
as `Authorization: Bearer <jwt>`, and validate untrusted backend responses before
returning data to the UI. The JWT is never exposed to client-side JavaScript.

The phone preview renders the existing `Navbar`, `PotDetails`, and `ScheduledTransfers`
components with sample data
from an isolated SWR cache. Revalidation is disabled, so it makes no authenticated
account requests. The preview is inert, with disabled
controls and a not-allowed cursor. The landing page explains the motivation,
illustrates a pot withdrawal followed by a payment scheduled in Monzo,
shows three features and example Monzo notifications, and links to both public
repositories. Its Explore the code button links to the on-page open-source section.
Landing page copy is editable in `components/landing/landing-page/landing-page.tsx`.

The interactive demo at `/demo` reuses the live console components with an
in-memory client and an isolated SWR cache. Login is immediate and requires no
Monzo account or backend configuration. Main Account and Joint Account have
separate fictional balances, pots, and transfer histories. The pots use neutral names and sample IDs, with Monzo's
public cover images and a variety of pot types and deleted states. Most active
pots include sample transfer history; Hobbies and the joint Groceries pot start
with no schedules. Creating and cancelling schedules updates demo state across navigation without calling `/api` or the
backend. No simulated transfers execute or move money. Refreshing or leaving
the demo resets its login and data. Pot cover images still load from Monzo's
public image URLs.

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

The login link navigates to `/api/auth/login`. That same-origin route requests
`${BASE_URL}/monzo-redirect` server-side and forwards its redirect to Monzo.
It also relays the backend's short-lived `monzo_oauth_state` cookie to the app,
scoped to `/api/auth/callback`. After authorization, the callback page calls
`/api/auth/callback`, which forwards validated `code`, `state`, and the state
cookie to `${BASE_URL}/monzo-callback`. The callback response contains
`token`, `expiresIn`, `refreshToken`, and `refreshExpiresIn`; both tokens are
stored in separate `HttpOnly` cookies. Both cookies expire according to
`refreshExpiresIn`, so an expired JWT remains available for the BFF to detect a
`401` and refresh while the refresh token is valid. Successful login returns to
`/console`.

Authenticated browser requests that receive a `401` share one request to
`/api/auth/refresh` per browser tab. That BFF route reads the refresh cookie,
calls `${BASE_URL}/auth/refresh` server-side with `{ "refresh_token": "…" }`,
and updates the cookies without returning tokens to JavaScript. Waiting
requests retry once, concurrently. Delayed `401` responses reuse a completed
refresh instead of starting another one. Separate tabs still require backend
coordination for concurrent refreshes.

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
  pot, authentication, and scheduled-transfer features. Components with multiple
  files have a named subfolder containing their implementation, styles, and tests
  (for example, `components/pots/pot-details/pot-details.tsx`). Single-file
  components remain at their domain's root. Imports point directly to the named
  implementation rather than a barrel file.
- `lib/` contains request clients, cache keys, runtime validation, domain types,
  money formatting, session helpers, and UK date-time handling.

### Adding or changing components

Choose the domain first: accounts, pots, authentication (`auth`), scheduled
transfers, or the landing page. Shared controls belong in `components/ui/`, SVG
icons in `components/ui/icons/`, shared page structure in `components/layout/`,
and context providers in `components/providers/`. Reuse existing components and
helpers before extracting or adding new ones.

Keep single-file components in their existing domain folder. Once a component
needs a second related file, group its implementation, styles, and tests in a
kebab-case folder named after it:

```text
components/pots/pot-details/
  pot-details.tsx
  pot-details.module.css
  pot-details.test.tsx
```

Create only the files the component needs. Import the named implementation
directly, without an `index.ts` barrel:

```tsx
import { PotDetails } from "@/components/pots/pot-details/pot-details";
```

Use relative imports within the component folder and `@/*` imports between
folders. Keep non-React helpers under their existing `lib/` domains. When moving
files, update imports, test mocks, and documentation paths, and remove abandoned
files and unused styles. See [AGENTS.md](AGENTS.md) for the full repository rules
and verification requirements.

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
