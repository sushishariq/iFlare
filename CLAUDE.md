# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## Project Purpose

**iFLARE** — *"Real connections. Right now."* — is a mobile-first web app that
lets **Indian college students** create and join spontaneous, interest-based
meetups ("**iFlares**": study buddies, gym partners, coffee runs, cycling
groups, game nights, etc.) with peers **from their own university only**.
University scoping is enforced by matching the email domain used at
registration (e.g. an IIT KGP student only sees IIT KGP flares).

For the full feature list see [`README.md`](./README.md).

## Technology Stack

| Layer            | Choice                                                          |
| ----------------- | ---------------------------------------------------------------- |
| Framework         | Next.js 14 (App Router)                                          |
| Language           | JavaScript (JSX) — no TypeScript                                 |
| Styling            | Tailwind CSS + shadcn/ui (Radix primitives); `next-themes` pinned to a dark-only theme |
| Icons              | lucide-react (the `Radar` icon is the brand mark)                |
| Forms/validation   | react-hook-form + zod                                            |
| Database           | MongoDB via the `mongodb` driver (local in preview, managed in production) |
| Auth               | Custom — SHA-256 password hash + base64 JSON session token (see Security section — **not production-grade**) |
| Email (opt-in)     | Resend (`resend` npm package) — mostly disabled in current flows |
| Package manager    | yarn                                                              |
| Process manager    | `supervisor` — runs Next.js on `0.0.0.0:3000`                    |

## Project Structure

```
/app                                    # repo root (Next.js project root)
├── app/                                # Next.js App Router
│   ├── api/[[...path]]/route.js        # ⭐ Monolithic API — every backend endpoint lives here
│   ├── page.js                         # Landing page (/)
│   ├── login/page.js                   # /login
│   ├── register/page.js                # /register — 4-step signup wizard
│   ├── verify/page.js                  # /verify — email verification landing (legacy flow)
│   ├── forgot-password/page.js         # /forgot-password
│   ├── (app)/                          # ⭐ Route group: authenticated shell (sidebar + onboarding)
│   │   ├── layout.js                   # Sidebar chrome; adds no URL segment
│   │   ├── flares/page.js              # /flares — main dashboard (Join | Create modes)
│   │   ├── activity/page.js            # /activity — flares you created/joined
│   │   ├── notifications/page.js       # /notifications — in-app notification history
│   │   ├── profile/page.js             # /profile — bio + interests + university card
│   │   └── settings/page.js            # /settings — notifications, account, about links
│   ├── about|contact|feedback|privacy|terms/page.js   # Public info pages (no session needed)
│   ├── layout.js, globals.css, icon.svg
├── components/
│   ├── AppShell.js                     # Authenticated chrome: sidebar + top bar + onboarding
│   ├── AppSidebar.js                   # The one shared nav; off-canvas sheet below md
│   ├── AppTopBar.js                    # Sticky top chrome: title, search slot, bell, account menu
│   ├── Logo.js                         # ⭐ The one brand lockup (mark + optional wordmark)
│   ├── FlareCard.js                    # ⭐ Feed row for a single flare — used by /flares AND /activity
│   ├── FlareDetailBody.js              # ⭐ The detail content; rendered by both containers below
│   ├── FlareDetailModal.js             # Detail as a modal bottom sheet (below lg)
│   ├── FlareDetailPanel.js             # Detail as a persistent side pane (lg+)
│   ├── FlareChat.js                    # Per-flare chat (host + attendees only)
│   ├── CreateFlareForm.js              # 2-step create flow, inline on /flares
│   ├── FlareSearch.js                  # Client-side feed search + interest suggestions
│   ├── InterestChip.js                 # ⭐ The one interest chip (built-in and custom alike)
│   ├── InterestSelector.js             # ⭐ The one interest picker (search + create)
│   ├── ConfirmDialog.js                # ⭐ The one "are you sure?" for destructive actions
│   ├── FormBanner.js                   # The one error/success/info banner in forms
│   ├── NotificationsPanel.js           # Renders NotificationProvider's in-app history
│   ├── UnreadBadge.js                  # The one unread-count badge
│   ├── StepProgress.js                 # Stepper shared by register + forgot-password + create-flare
│   ├── InfoPageShell.js                # Chrome for the public info pages
│   ├── OnboardingWalkthrough.js        # 4-slide first-run guide (mounted in AppShell)
│   ├── SwipeToToggleSidebar.js         # Edge-swipe gesture for the mobile sidebar
│   ├── ClientProviders.js              # Theme + notifications + toaster providers
│   └── ui/                             # shadcn/ui primitives (10 retuned onto the tokens, rest stock)
├── lib/
│   ├── universities.js                 # ⭐ Indian university domain whitelist/blocklist + resolver
│   ├── universityOptions.js            # Picker-shaped view derived from universities.js
│   ├── interests.js                    # ⭐ Single source of truth for interest ids
│   ├── useInterestCatalog.js           # Built-ins + this campus's custom interests, module-cached
│   ├── campusLocations.js              # Predefined campus venues for the create flow
│   ├── flareTime.js                    # ⭐ Timing + urgency styling, shared by /flares and /activity
│   ├── flareCapacity.js                # ⭐ The one answer to "how full is this flare"
│   ├── AppChromeProvider.js            # The top bar's portal slot for a page's own search
│   ├── useSessionUser.js               # The cached localStorage session read, for chrome
│   ├── site.js                         # Contact email for the info pages (unset by default)
│   ├── NotificationProvider.js         # In-app notifications context
│   └── notifications.js                # Browser Notification API helpers
├── memory/
│   └── test_credentials.md             # Test accounts for manual QA
├── hooks/
│   └── useEnterSubmit.js               # Enter-to-advance for non-<form> wizard steps
├── DEVELOPMENT.md                      # Full DB schema + API reference + hardening checklist
├── README.md                           # Project overview
├── test_result.md                      # Test run notes/log
└── .env                                # Env vars — never commit real values
```

## How to Run the Project

This is intended to run inside the Emergent platform workspace, managed by
`supervisor` — you normally **do not** run `next dev` yourself:

```bash
sudo supervisorctl status              # see what's running
sudo supervisorctl restart nextjs      # restart after editing .env or deps
tail -n 200 /var/log/supervisor/nextjs.out.log   # tail logs
```

Frontend hot-reload picks up file edits under `app/` and `components/`
automatically — no restart needed for normal code changes.

`package.json` also defines standalone scripts (`yarn dev`, `yarn build`,
`yarn start`) if you need to run Next.js directly outside supervisor.

**Env vars** (`/app/.env`): `MONGO_URL`, `DB_NAME` (`iflare` in production,
`iflare_dev` on a local dev server — check the value before querying Mongo
directly),
`NEXT_PUBLIC_BASE_URL`, `RESEND_API_KEY`, `CORS_ORIGINS`, and
`NEXT_PUBLIC_CONTACT_EMAIL` (optional — read by `lib/site.js`; when unset the
Contact/Feedback pages show an honest "not set up yet" state instead of a dead
`mailto:` link). Never hand-edit
`MONGO_URL` or `NEXT_PUBLIC_BASE_URL` — the Emergent platform manages and
wires these to the correct backing services per environment.

## Important Files and What They Do

| File | Purpose |
| ---- | ------- |
| `app/api/[[...path]]/route.js` | Every backend endpoint: auth, user, flares, chat. ~1400 lines, single `handleRoute` dispatcher. |
| `lib/universities.js` | The whitelist of Indian university email domains + `resolveUniversity()` / `getDomainFromEmail()` — the core of the product's access-control model. |
| `lib/universityOptions.js` | Derived, *presentation-only* inverse of that whitelist (one entry per university, all its domains) for the signup picker. Not a second source of truth — never edit the list here. |
| `lib/interests.js` | `INTERESTS` + `INTEREST_MAP`, the `interestEmoji`/`interestName`/`interestLabel` helpers, and `slugifyInterest`/`mergeInterests`/`resolveInterest` for custom interests. **The ids are persisted** on `users.interests[]` and `flares.interests[]`, so renaming one needs a data migration. Entries are `{id, emoji, name}` only — the old per-id `color`/`tag` Tailwind classes were deleted once `components/InterestChip.js` became the single chip treatment. |
| `lib/campusLocations.js` | Predefined campus venues for the create-flare flow, plus `toLocationValue()`. Replaced free-text venue entry; still writes the existing `{name, lat, lng}` shape with `lat`/`lng` null. **Known gap:** it is one global list shared by every campus — the only part of the product that isn't university-scoped — and needs to become per-`emailDomain` the way `db.interests` already is. Flagged in the file header. |
| `app/(app)/layout.js` | Shell for every authenticated page: sidebar, mobile trigger bar, onboarding modal. |
| `app/(app)/flares/page.js` | Main dashboard: feed, search, `join`/`create` mode switch. Was ~1100 lines; now ~450 after extracting `FlareCard`/`FlareDetailModal`/`CreateFlareForm`/`FlareSearch`. |
| `app/register/page.js` | 4-step signup wizard (University → Account → Verify → Interests + bio). Largest frontend file. |
| `lib/NotificationProvider.js` / `lib/notifications.js` | In-app bell/unread-badge notification system; `components/NotificationsPanel.js` renders its history at `/notifications`. Rows link to `/flares?flare=<id>`, which that page reads on load to open the flare. |
| `components/AppSidebar.js` | The app's only navigation. Items marked `available: false` render disabled rather than linking to a 404 — flip the flag when the page ships. |
| `components/OnboardingWalkthrough.js` | First-run guide: an offer, then 4 slides. Not a modal — a bottom-anchored panel with no backdrop, so the app stays usable. The "seen" flag is keyed per user id; `/settings` clears it and fires the `iflare:replay-onboarding` event through the exported `replayOnboarding()`, because AppShell keeps this component mounted across navigation. |
| `components/ClientProviders.js` | Root wrapper composing theme, notifications, and toaster providers. |
| `DEVELOPMENT.md` | Authoritative deep-dive: full DB schema, full API endpoint reference, DB backup/restore, security hardening checklist. Read this for anything this file only summarizes. |
| `memory/test_credentials.md` | Suggested test accounts (same-university pair + cross-university pair) for manual QA. |

## Frontend / UI Architecture

- Next.js **App Router**: each route is a folder under `app/` with its own
  `page.js`; routing is file-based, no separate router config.
- **Two shells, split by the `(app)` route group.** Authenticated pages live
  in `app/(app)/` and inherit `app/(app)/layout.js` (sidebar + mobile trigger
  bar + onboarding modal). A route group adds chrome without adding a URL
  segment, so `/flares`, `/activity`, `/profile`, `/settings` are unchanged.
  Public pages (landing, auth, and the info pages) stay outside it because the
  landing footer links to them while logged out.
- **Two content widths, chosen per route by `AppShell`.** `.app-column` is the
  reading column (`--app-column-width`: 30rem on a phone, 34rem from `md`) and
  is the default. `.app-canvas` (`--app-canvas-width`) matches it below `lg`
  and opens to 68rem above, for the pages that have a real desktop layout —
  the feed-plus-detail two-pane on `/flares` and `/activity`, and the
  two-column `/profile` and `/settings`. The opt-in list is `WIDE_ROUTES` in
  `components/AppShell.js`; it is route-driven rather than page-driven so the
  width is known during SSR instead of shifting after hydration. Both widths
  and the shared `.app-gutter` live in `globals.css`. Don't widen a page by
  hand — add its route to `WIDE_ROUTES`.
- Pages are client-heavy (fetch data from the monolithic API, manage local
  state) rather than using server components/server actions. The public info
  pages are the exception — they're server components exporting `metadata`.
- **Session state lives in `localStorage`** (`iflare_user`, `iflare_token`);
  each authenticated page reads it and redirects to `/login` if absent —
  there's no route middleware or auth guard component.
- **There are no cross-page `sessionStorage` handoffs any more.** `/activity`
  used to write a flare to `iflare_open_flare` and route to `/flares` just to
  show its detail sheet, which remounted the whole feed and flashed its empty
  state on the way. Both pages now render the detail themselves —
  `FlareDetailBody` inside `FlareDetailModal` below `lg`, and inside
  `FlareDetailPanel` above it. Don't reintroduce the pattern; give the page the
  component.
- Shared UI comes from `components/ui/` — shadcn/ui components generated on
  top of Radix primitives (`components.json` configures the shadcn setup).
  Feature components live directly in `components/`.
- Styling is Tailwind CSS throughout (`tailwind.config.js`), with
  `tailwind-merge`/`class-variance-authority` for variant composition. The
  shadcn CSS variables in `globals.css` (including the `--sidebar-*` set) are
  tuned to the slate/orange palette the pages hardcode, so primitives render
  on-brand.
- **Dark-only for now**: `ClientProviders` pins `next-themes` to `dark` with
  `enableSystem={false}`; the light-theme token block exists but is untested.
  `<html suppressHydrationWarning>` in the root layout is required by
  next-themes — don't remove it.
- Toasts via `sonner`; forms via `react-hook-form` + `zod` resolvers.
- Cross-cutting concerns (notifications, etc.) are wired through
  `components/ClientProviders.js` so pages can consume context via hooks.
- Icon system is `lucide-react`; the `Radar` icon is the app's brand mark.

## Backend / API Architecture

- **Single catch-all route**: `app/api/[[...path]]/route.js` handles all
  HTTP verbs through one `handleRoute(request, { params })` function. There
  is no separate router library — dispatch is a long chain of
  `if (route === '/x' && method === 'Y') { ... }` (with `route.match(/regex/)`
  for dynamic segments like `/flares/:id/messages`).
- **Mongo connection** is a lazy singleton (`connectToMongo()`), reused
  across requests within the same server process.
- **`ensureMigrated(db)`** runs once per server start (idempotent): backfills
  `emailDomain`/`hostEmailDomain` on legacy documents and creates indexes
  (`messages`, `otps`, `password_resets` — the latter two are TTL-indexed
  for auto-expiry).
- **CORS** is handled manually — every response is wrapped in `handleCORS()`,
  which sets `Access-Control-Allow-*` headers (origin defaults to `*` unless
  `CORS_ORIGINS` is set).
- **Access-control helpers** are written per-feature, e.g.
  `assertFlareChatAccess(db, flareId, userId)` — only the flare's host or an
  attendee may read/write its chat.
- Route groups actually present in the code:
  - **Auth**: `/auth/register` (legacy), `/auth/signup/{start,verify,resend}`
    (current OTP flow), `/auth/forgot-password/{start,verify}`,
    `/auth/verify`, `/auth/login`, `/auth/resend-verification`.
  - **User**: `/user/me`, `/user/interests`, `/user/settings` (interests,
    `visibilityMode`, and `bio` — max 300 chars, `BIO_MAX_LENGTH`),
    `/user/:id/flares`, `/user/:id/activity`.
  - **Flares**: `POST /flares` (create), `GET /flares` (university-scoped
    feed), `POST /flares/:id/join`.
  - **Chat**: `GET/POST /flares/:id/messages`.
  - **Interests**: `GET /interests` (this campus's custom interests only — the
    twelve built-ins ship in `lib/interests.js` and are never sent over the
    wire), `POST /interests` (create/re-use one, upserted on
    `{id, emailDomain}`).
- Full endpoint-by-endpoint reference: [`DEVELOPMENT.md § 7`](./DEVELOPMENT.md#7-api-reference).

## Database Structure

MongoDB database `iflare`. Collections: `users`, `flares`, `messages`,
`interests` (per-campus custom interests), plus `otps` and `password_resets`
(short-lived, TTL-indexed for the OTP-based signup/reset flows). **All app-level IDs are UUIDs (`uuid` v4), never Mongo
`ObjectId`** — kept out of API responses because `ObjectId` isn't directly
JSON-serializable.

- `users`: `id`, `name`, `email`, `password` (SHA-256 hex), `interests[]`,
  `bio` (optional short profile blurb, ≤300 chars, `''` when unset),
  `emailDomain` (auto-set, drives university scoping), `university`,
  `isVerified`, `createdAt`/`updatedAt`, plus legacy/optional fields
  (`verificationToken`, `verificationTokenExpiry`, `visibilityMode`).
  Accounts created before the bio field simply lack it, so read it as
  `user.bio || ''` — the profile page refetches `/user/me` for exactly this
  reason, since the cached `localStorage` copy can predate the field.
- `flares`: `id`, `title`, `description`, `interests[]`, `location`
  (`{name, lat, lng}`; `name` now comes from `lib/campusLocations.js` and
  lat/lng are null — nothing renders a map), `host`, `attendees[]`,
  `maxAttendees`, `startTime`, `hostEmailDomain` (drives university-scoped
  visibility), `createdAt`/`updatedAt`.
- `messages`: per-flare chat messages. Indexed on `{flareId, createdAt}` and
  unique on `{id}`.
- `interests`: custom interests a campus has added — `id` (the slug that gets
  persisted on `users.interests[]`/`flares.interests[]`), `name`, `emoji`,
  `emailDomain`, `createdBy`, `createdAt`. Upserted on `{id, emailDomain}`. The
  twelve built-ins are **not** stored here.
- `otps` / `password_resets`: unique per `email`, TTL-expired via
  `expiresAt` (`expireAfterSeconds: 0`).
- No indexes on `users.email`/`users.id` are created yet even though they're
  the primary lookup keys — `DEVELOPMENT.md` flags this as a to-do.

Full field-by-field schema: [`DEVELOPMENT.md § 5`](./DEVELOPMENT.md#5-database-schema).

## Authentication Flow

The UI for this is the 4-step wizard in `app/register/page.js`:
**University → Account → Verify (OTP) → Interests + bio**. The account is not
created until the OTP is verified at step 3; step 4 saves interests (minimum 3,
required) and an optional bio through `PUT /user/settings`. Step 1's picker is
cosmetic — it pre-fills and
sanity-checks the email domain via `emailMatchesUniversity()`, but the server's
`resolveUniversity()` remains the only real gate, and "my university isn't
listed" is a supported path (any `.ac.in`/`.edu.in` address is accepted).

1. **Register/signup** — email is validated against
   `lib/universities.js` (`resolveUniversity`): must be on the explicit
   Indian-university whitelist, a subdomain of one, or end in `.ac.in`/
   `.edu.in`; explicitly-blocked personal-email domains (gmail, yahoo,
   outlook, icloud, etc.) are rejected. Two parallel flows exist in the
   code: the newer OTP-based `/auth/signup/start` → `/auth/signup/verify`,
   and a legacy `/auth/register` + token-link `/auth/verify`.
2. Password is hashed with **unsalted SHA-256** (`hashPassword`) and the
   user document is stored with `emailDomain` stamped from the email.
3. **Login** (`POST /auth/login`) re-validates the domain (403 if blocked,
   in case a legacy account slipped through), looks up the user by
   lowercased email, and compares the SHA-256 hash.
4. On success, a **session token** is issued by `generateSessionToken`:
   `base64(JSON.stringify({ userId, timestamp }))` — plain base64, **no
   signature, no expiry**.
5. The client stores this token and sends it as `Authorization: Bearer
   <token>`. On protected routes (e.g. `GET /user/me`) the server just
   base64-decodes the payload, reads `userId`, and looks the user up fresh
   from Mongo — the token is a lookup key, not a cryptographically verified
   credential.
6. `POST /flares/:id/join` and chat routes take `userId` from the request
   body/lookup rather than deriving it from a verified session, matching the
   same trust model.

## Important Security Considerations

These are real, current gaps in the code — not hypothetical:

- **Unsigned session tokens**: `generateSessionToken` produces a plain
  base64 JSON blob with no HMAC/JWT signature. Anyone can construct a valid
  `Bearer` token for **any** `userId` by base64-encoding
  `{"userId": "<victim-id>"}` — there is no way for the server to detect a
  forged token. This is the single highest-priority item to fix before any
  real launch (replace with signed JWT via `jose`, or server-side sessions).
- **Unsalted SHA-256 passwords**: no per-user salt, no adaptive cost —
  vulnerable to rainbow-table/offline brute force if the DB leaks. Replace
  with bcrypt or argon2.
- **Verified gap — cross-university join is not enforced**:
  `POST /flares/:id/join` (`app/api/[[...path]]/route.js` around line 1241)
  performs no domain/university check at all. Any authenticated user can
  join any flare by ID regardless of university, even though the product's
  entire premise is university-scoped visibility. The feed endpoint
  (`GET /flares`) filters by domain, but the join endpoint doesn't
  re-verify — so this is enforceable only by not knowing another
  university's flare IDs, which is not real access control.
- **Verified gap — the join endpoint can create flares**: if the flare id
  isn't found and the request body carries a `flareData` object, that branch
  inserts it verbatim (client-supplied `host`, `attendees`, `maxAttendees`,
  and no `hostEmailDomain`). It's a leftover from the sample-data era; it lets
  any caller write an arbitrary flare document, and the missing
  `hostEmailDomain` means the result is invisible to the university-scoped
  feed. Delete the branch when the sample-data path is retired.
- **CORS defaults to `*`** unless `CORS_ORIGINS` is explicitly set.
- **No rate-limiting** on `/api/auth/*` or `POST /api/flares` — brute force
  and spam are both currently unmitigated.
- **Email verification is effectively disabled** (`isVerified` is set true
  automatically in the active signup path), so there's no real proof a
  registrant controls the university email they used.
- `.env` is gitignored and must never contain committed real secrets;
  `MONGO_URL`/`NEXT_PUBLIC_BASE_URL` are platform-managed — don't hand-edit.

Full checklist: [`DEVELOPMENT.md § 8`](./DEVELOPMENT.md#8-security-notes-for-future-hardening)
and [`README.md § Security Notes`](./README.md#-security-notes).

## Coding Conventions Observed

- **Plain JavaScript/JSX, no TypeScript.** 2-space indentation, single
  quotes, generally no trailing semicolons in `route.js`/`universities.js`
  — match this when editing those files.
- **API handlers** follow a consistent pattern: each route branch validates
  its own input and does an early `return handleCORS(NextResponse.json(...,
  { status }))` on failure — there's no shared middleware/validation layer,
  so new endpoints should follow the same inline-validation style rather
  than introducing a framework.
- **Dynamic route segments** are matched with regex
  (`route.match(/^\/flares\/[^/]+\/messages$/)`) rather than a router
  library — keep new dynamic routes consistent with this.
- **Comments explain *why*, not just *what*** (e.g. the migration backfill
  rationale, the chat-access-rule comment, the file-header blocks on the newer
  components and `lib/` modules) — this codebase leans on inline rationale
  comments for non-obvious decisions; preserve that density.
- **Shared constants belong in `lib/`, not in pages.** Interests, campus
  venues and the university picker list were each duplicated across several
  pages and had drifted; they're now single modules. Import from
  `lib/interests.js` / `lib/campusLocations.js` rather than re-declaring a
  local copy.
- **Feature components are extracted, not inlined.** The flares page and the
  register wizard both compose components from `components/`; keep new UI of
  any size out of the page files.
- **One component per concept — do not fork a second copy.** Almost every
  inconsistency this codebase has had came from the same UI being written twice
  and then drifting: two flare cards, two segmented controls, three brand
  lockups, three unread badges, three interest chips, three error banners, three
  "success" greens. Each of those is now exactly one module (`FlareCard`,
  `ui/tabs`, `Logo`, `UnreadBadge`, `InterestChip`, `FormBanner`,
  `lib/flareTime.js`). When a page needs a variant, **give the shared component
  a prop** — as `/activity` does with `FlareCard`'s `meta`/`muted`/`selected` —
  rather than copying it.
- **Pages consume design tokens, never raw palette classes.** `bg-surface-1`,
  `text-ink-muted`, `border-line-subtle`, `text-brand-400`, `shadow-e2`,
  `rounded-xl` — not `bg-slate-800/50`, `text-orange-400` or a hardcoded radius.
  The tokens are defined in `app/globals.css` and exposed in
  `tailwind.config.js`; `VISUAL_OVERHAUL_PLAN.md` documents the system.
- Several places already carry explicit "simple for now, harden later"
  comments (e.g. above `hashPassword`) — these are known, intentional MVP
  shortcuts, not oversights; don't "fix" them silently, but do flag them
  when relevant (see Security section above).
- camelCase for functions/variables; UUIDs (not Mongo `ObjectId`) as the
  app-level identifier convention everywhere.

## Further Reading

- [`README.md`](./README.md) — feature overview, roadmap, deploy flow.
- [`DEVELOPMENT.md`](./DEVELOPMENT.md) — full DB schema, full API reference,
  DB backup/restore workflow, complete security hardening checklist.
- [`memory/test_credentials.md`](./memory/test_credentials.md) — test
  accounts for manual QA.
