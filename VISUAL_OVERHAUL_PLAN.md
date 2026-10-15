# iFLARE Visual & Interaction Overhaul

**This file is the persistent source of truth for the visual overhaul.** It survives context
resets. At the start of any new session, read [`CLAUDE.md`](./CLAUDE.md), then this file, before
touching anything.

Work is phase-by-phase. Implement only the phase asked for, then update the Status log in §5.

> **Relationship to [`UI_UX_IMPLEMENTATION_PLAN.md`](./UI_UX_IMPLEMENTATION_PLAN.md):** that plan's
> Phases 1–5 (app shell, mobile nav, onboarding, notifications page, shared interest system, 4-step
> signup, create-flare compaction) are **complete and still stand**. Its unstarted Phase 6 (chip
> sweep, delete `INTERESTS[].color`/`.tag`, terminology pass, dead `notifyNewFlare`, docs) is
> **absorbed into Phase F below** — do not run it separately.

---

## 1. Context

The app works, but reads as a wireframe rather than a product. The audit found *why*, and it is not
subjective:

| Symptom | Measured cause |
| --- | --- |
| "Looks like a basic website" | **No typeface was loaded at all.** No `next/font`, no `fontFamily` in `tailwind.config.js`. Everything rendered in the browser default stack. |
| Flat, no hierarchy | **182 of 238 font-size classes were `text-sm`/`text-xs`.** One `text-4xl` in the whole repo. `FlareCard`'s title has no size class at all, while its urgency badge is bolder, coloured and pulsing — visual weight order is emoji → badge → title. |
| No depth | **7 `shadow-*` usages app-wide.** No elevation scale. Surfaces were 9 ad-hoc translucent slates (`bg-slate-800/50`, `/40`, `/60`, `/70`, `bg-slate-900/40`, `/60`, `/70`, `bg-slate-700/50`, `/40`). |
| Nothing moves | Motion was `transition-colors` (53×) + `animate-spin` (17×). **Zero enter/exit animations.** The detail sheet teleports. Wizard steps hard-cut. `components/ui/skeleton.jsx` exists and is imported by nothing. |
| Inconsistent | **~700 hardcoded `slate-*`/`orange-*` utilities** next to shadcn tokens the pages ignore. 8 radii, 6 control heights, 2 "primary" oranges (`orange-500`/`orange-600`), 3 success colours (`green-500`/`emerald-400`/`orange-300`), 3 interest-chip designs, 2 flare-card designs, 2 segmented controls, 3 copies of the brand lockup. |
| Desktop looks like a phone | `--app-column-width: 30rem` capped content at 480px at every width, and the only header is `md:hidden` — **≥768px had no top chrome whatsoever.** |

Three things also make it feel *broken*, and they matter more than any gradient:

1. **`/flares` has no loading state.** `flares` starts `[]` and the fetch waits on a second effect
   reading `localStorage`, so **every user sees a false "No iFlares in the next 90 minutes" on every
   visit** before data lands.
2. **Fetch failures render as empty states** on `/flares` and `/activity` — a 500 and an empty campus
   look identical. Joining has no success *or* failure feedback and never rolls back; `sonner` is
   mounted globally and used by exactly one page.
3. **`CreateFlareForm`'s validation is unreachable.** The primary button is `disabled` under exactly
   the conditions its error branches test, so the only signal about what's missing is a grey button.

**Outcome wanted:** one real design system (type, colour, elevation, radius, motion) expressed as
tokens; a desktop layout that uses the screen; every screen swept onto it.

## 2. Decisions taken (confirmed with the user)

1. **Motion via CSS keyframes + `tailwindcss-animate`.** No `framer-motion`, no new runtime deps.
2. **Geometric body face + tighter display face** — Inter (UI/body) + Space Grotesk (headings,
   wordmark), both via `next/font/google`.
3. **Tokens first, then sweep every page.** Nothing is left half-migrated.
4. **A genuine desktop layout is approved.** User's words: *"this was done because the earlier design
   just extended and widened the phone interface. If you can utilise the desktop display in a better
   and convenient way, you can go for it."* So: not a widened phone — a feed + persistent detail pane.
5. **Orange stays the brand.** The Radar mark, the name and the "flare" metaphor all depend on it.
   After Phase A the accent hue is three token lines, so it stays cheap to revisit.

## 3. Ground rules for every phase

- Pages consume **tokens** (`bg-surface-1`, `text-ink-subtle`, `rounded-xl`, `shadow-e2`,
  `text-brand-400`), never raw palette classes (`bg-slate-800/50`, `text-orange-400`).
- `--radius` drives all eight radii. Never hardcode a radius.
- Every new animation goes in `tailwind.config.js` `keyframes`, never inline.
- Preserve the codebase's existing conventions: plain JS/JSX, 2-space indent, single quotes,
  `handleCORS`-style inline validation in `route.js`, and the high density of *why* comments.
- `next build` clean before a phase is called done.

## 4. Phase overview

| Phase | Theme | Backend? | Depends on | Status |
| ----- | ----- | -------- | ---------- | ------ |
| **A** | Foundation — fonts, tokens, type scale, radius, elevation, motion | No | — | ✅ **Complete** |
| **B** | Primitives — button/input/card/dialog/sheet/skeleton + `Logo` | No | A | ✅ **Complete** |
| **C** | Shell & desktop layout — top bar, responsive column, two-pane at `lg+` | No | B | ✅ **Complete** |
| **D** | Feed & flare surfaces — card, detail, chat, search + the 3 defects | No* | C | ✅ **Complete** |
| **E** | Create flow, auth wizards, landing | No | B | ✅ **Complete** |
| **F** | Secondary screens + consolidation (absorbs old Phase 6) | No | D, E | ✅ **Complete** |

\* D was planned as frontend-only and is, apart from one four-line fix to
`connectToMongo`'s cold-start race, which D's own work made reproducible. See
the Phase D log.

### PHASE A — Foundation ✅ COMPLETE
Delivered. See §5.

### PHASE B — Primitives ✅ COMPLETE
Delivered. See §5.

Files: `components/ui/{button,input,textarea,card,badge,skeleton,dialog,sheet,tabs}.jsx`,
new `components/Logo.js`.

All 49 shadcn files are byte-for-byte stock and **only 9 are imported anywhere** — the product
hand-rolls cards, dialogs, badges and skeletons out of raw slate divs. Make the primitives worth
using, so the page sweep becomes "delete markup, import a component."

- **`button.jsx`** — tallest variant today is 40px, default 36px, below the 44px tap target the app's
  own hand-rolled controls (`h-11`/`h-12`/`h-14`) already exceed. New sizes: `sm` 36 / `default` **44**
  / `lg` 52 (`h-13`) / `icon` 44². Radius `lg`, not `rounded-md`. `default` variant gets
  `bg-gradient-brand` + `shadow-brand` + `active:scale-[.98]`. New `variant="soft"` for the
  `bg-orange-500/10 + border-orange-500/30` pattern hand-written ~18 times.
- **`input.jsx` / `textarea.jsx`** — `h-11`, `rounded-lg`, `bg-surface-3`, `border-line`,
  `focus:border-brand-500`. This is what every field already overrides to by hand.
- **`card.jsx`** — `p-6` is too heavy for a 480px column, which is why nothing uses it. Retune to
  `p-4`/`sm:p-5`, `rounded-xl`, `bg-surface-1`, `shadow-e2`.
- **`dialog.jsx` / `sheet.jsx`** — currently `bg-background`, i.e. a modal is the *same* colour as the
  page behind it. Move to `bg-surface-2` + `shadow-e4`; add a mobile drag handle.
- **`skeleton.jsx`** — swap `animate-pulse` for the `shimmer` sweep (`bg-shimmer` + `animate-shimmer`).
- **`tabs.jsx`** — restyle as the app's segmented control with a sliding indicator, so the two
  divergent hand-rolled switches (`/flares` boxed `orange-600`, `/activity` unboxed `orange-500`)
  both collapse onto it.
- **New `components/Logo.js`** — one lockup with `size`/`showWordmark` props, replacing the three
  copies in `AppSidebar.js`, `AppShell.js`, `InfoPageShell.js`, which disagree on two-tone vs flat and
  on `bg-orange-600` vs `text-orange-500`. Wordmark in `font-display`.

### PHASE C — Shell & desktop layout ✅ COMPLETE
Delivered. See §5.

Files: `components/AppShell.js`, `components/AppSidebar.js`, `app/globals.css`,
new `components/AppTopBar.js`.

- **Responsive column.** `--app-column-width` becomes breakpoint-aware: 30rem below `md`, **34rem** at
  `md`. Unify gutters (shell uses `px-4`, landing/auth/info use `px-6`).
- **Desktop top bar (new).** ≥`md` has no chrome at all today. Sticky header with page title, inline
  search, notification bell, avatar menu (where the currently-unconfirmed icon-only logout moves).
- **Two-pane at `lg+`.** `/flares` becomes feed (max ~30rem) + persistent detail pane, so opening a
  flare doesn't cover everything and its chat stays visible. Extract the modal body into
  **`components/FlareDetailBody.js`**; `FlareDetailModal` (below `lg`) and a new `FlareDetailPanel`
  (`lg+`) both wrap it. `/activity` inherits this, which also deletes its
  `sessionStorage`-handoff-plus-route-change hack (whose full `/flares` remount currently flashes the
  empty state before the modal opens). `/profile` and `/settings` go two-column at `lg+`.
- **Sidebar.** Active item is today just a slate fill with `font-medium` — the brand colour never
  appears in the nav's selected state. Add a brand left indicator + icon tint + tinted fill. Unify the
  unread badge (`bg-red-500` on the feed bell, `bg-orange-500` in the sidebar, a third on
  `/notifications`). `/terms` is missing from the nav.

### PHASE D — Feed & flare surfaces ✅ COMPLETE
Delivered. See §5.

Files: `app/(app)/flares/page.js`, `components/FlareCard.js`, `components/FlareDetailBody.js`,
`components/FlareChat.js`, `components/FlareSearch.js`, `lib/flareTime.js`.

> **Post-Phase-C note.** Three things this phase targets moved in C and are now shared, so a
> single edit reaches two call sites — check both before calling something done:
> `FlareDetailBody` renders inside **both** `FlareDetailModal` (below `lg`) and
> `FlareDetailPanel` (`lg+`); `getUrgencyStyles` now lives in `lib/flareTime.js` and is read by
> `/flares` **and** `/activity`; and the loading/error/empty states below must hold up in the
> two-pane grid, not just the single column.

**Fix the three defects first** — no styling survives a false empty state.
- `isLoading` (init `true`) on `FlaresPage`, rendering 3–4 shimmer skeleton cards.
- A distinct error state with Retry; stop collapsing failures into `setFlares([])`.
- Join: `sonner` toast on success, rollback + toast on failure. Reconcile the off-by-one — the page
  guards `attendees.length < maxAttendees`, the body computes `>= maxAttendees - 1`. (C already
  made joining keep the sheet/pane open on the joined flare, so the toast lands next to a CTA that
  has already flipped to "You're going!" — don't re-add a close.)
- The existing 60s `setInterval` (which only bumps `currentTime`) should also refetch; other students'
  new flares currently need a full page reload. Note C added an effect that clears `selectedFlare`
  when it leaves `filteredFlares`, so a refetch that drops a flare will also close the pane —
  intended, but confirm it doesn't fire mid-scroll on an unrelated flare.

Then: **`FlareCard` hierarchy** — title to `text-lg font-semibold font-display`; venue and spots
promoted out of `text-xs text-ink-subtle` with `.tabular` numerals; urgency badge de-escalated from
`font-bold` + `animate-pulse` to a `animate-pulse-ring` dot; labelled `InterestChip size="sm"`
replacing emoji-only chips (three custom interests currently render as three identical `✨`, and
screen readers get bare emoji); add host name and a "you're going" marker; add `hover` lift,
`active:scale-[.99]` and `focus-visible` — the card has none today, while the *secondary* activity
card has both.

**`FlareDetailBody`** — the three stats the user opened the sheet for (time left, spots, start time)
are `text-xs` with `text-2xs` labels, the smallest type on the sheet; promote to `text-2xl .tabular`.
Collapse the N dashed "Open spot" placeholders (8 of them at `maxAttendees: 10`, pushing the CTA below
the fold) into one "4 spots left" row. Pin the CTA to one height across all five states (it swings
`h-16`↔`h-14` and reflows) — this matters more now that the pane is permanently on screen at `lg+`,
where the swing reflows the whole right column. Its interest chips still read
`INTEREST_MAP[interest]?.tag`, one of the two fields Phase F deletes, so move them onto
`InterestChip` here. `FlareDetailModal` (now just the overlay + container + Escape) gains
`animate-sheet-up`, body scroll lock and a focus trap — those belong to the modal only; the panel is
a non-modal region by design and must not get them.

**`FlareChat`** — group consecutive messages by sender (the name repeats on every bubble, including
your own), day separators, `overscroll-contain` on the nested scroller, and a "new messages ↓" pill
instead of yanking to the bottom every 6s regardless of scroll position. Use the `Input` primitive.

**`FlareSearch`** — real combobox semantics (`role="combobox"`, `aria-expanded`, arrow keys, Enter to
select — none present), `animate-scale-in` on the panel, a 44px clear target (currently a bare 16px
icon), and route custom interests through `useInterestCatalog` (they're silently dropped today by the
`INTEREST_MAP` filter, though the create form fully supports them). Since C it renders in two
places — inline below `md`, portalled into the sticky top bar above it — so verify the suggestion
panel at both: inside the bar it opens over page content from a `z-30` sticky ancestor, and the
field's own width is the bar slot's `max-w-sm`, not the feed column's.

**`lib/flareTime.js`** — `getUrgencyStyles` was moved out of the page in C verbatim, raw palette
classes and all (`bg-red-500/20`, `text-orange-400`, `bg-slate-700/40`…). Retune it onto the tokens
here; it is the one place both `/flares` and `/activity` read, so this is also where the urgency
badge stops being `font-bold` + `animate-pulse`.

### PHASE E — Create flow, auth, landing ✅ COMPLETE
Delivered. See §5.

Files: `components/CreateFlareForm.js`, `components/StepProgress.js`, `app/register/page.js`,
`app/login/page.js`, `app/forgot-password/page.js`, `app/verify/page.js`, `app/page.js`,
new `components/FormBanner.js`.

- **`CreateFlareForm`**: replace disabled-primary-with-no-explanation with per-field inline validation
  (`aria-invalid` + message + `aria-describedby`). Fix the literal `&apos;` inside a JS string at
  line 163 (renders as `doesn&apos;t`). Confirm dialog on Cancel — it currently discards a filled
  2-step form silently, and `alert-dialog.jsx` is available. Toast on success.
- **`StepProgress`**: `animate-fade-in-up` on step change, plus scroll-to-top and focus management
  (focus is lost to `<body>` on every step transition in both wizards). Fix the fill math — step 1
  reads 25% before the user does anything.
- **Auth unification.** `/forgot-password` and `/verify` don't use `.app-column`, so they span the
  full viewport while `/login` and `/register` are capped. `/forgot-password` also uses a bespoke
  2-bar progress instead of `StepProgress`, a plain `Input` with `tracking-[0.5em]` instead of
  `InputOTP` for the same 6-digit code, an orange info banner where register uses emerald, a
  single-institution hardcoded placeholder, and no `htmlFor`/`id` on any field. `/verify` adds a third
  success colour and Title Case copy. Extract the three divergent error/info banners into one
  `FormBanner` with `role="alert"` and `animate-fade-in-up`.
  **Also:** `/forgot-password` redirects to `/login?reset=1` and `/login` never reads the param — the
  reset flow ends with no confirmation at all.
- **Landing.** `bg-gradient-glow` behind the hero, display type on the wordmark, real scroll-triggered
  reveals (`IntersectionObserver` + `animate-fade-in-up` + `.stagger`) replacing the 4-bucket mount
  fade, which currently SSRs the whole page at `opacity-0`. Give the sample flare cards hover states
  (they look tappable and are inert), derive them from `lib/campusLocations.js` instead of duplicated
  literals, and redirect signed-in visitors to `/flares`.

### PHASE F — Secondary screens & consolidation ✅ COMPLETE
Delivered. See §5.

Files: `app/(app)/{activity,profile,settings,notifications}/page.js`,
`components/{NotificationsPanel,OnboardingWalkthrough,InfoPageShell}.js`, `lib/interests.js`.

- **`/activity`**: delete the second hand-written flare card, use `FlareCard`. Shared segmented
  control. Add the missing error state and a ticking clock (cards never flip to "Ended" while open).
- **`/profile`**: swap the raw `INTERESTS.map` for `InterestSelector` — custom interests are currently
  invisible and unmanageable here. Sticky save bar (it only appears when dirty, at the bottom of a
  long scroll, off-screen on mobile). Confirm dialog on the icon-only logout.
- **`/settings`**: confirm dialogs on the two destructive actions; a "replay tour" entry.
- **`/notifications`**: **notifications are un-clickable dead ends** — make them navigate to their
  flare. Per-type icons, day grouping, ticking relative timestamps (`formatRelative` is computed once
  and never re-renders, so "Just now" is permanent), `<time dateTime>`.
- **`OnboardingWalkthrough`**: runs entirely at the app's *smallest* type (`text-xs` body, `h-9`
  `text-xs` buttons) for the first content a new user reads. Bring onto the scale, add
  `animate-sheet-up`, fix the listener `useEffect` that has no dependency array (three document
  listeners re-registered every render).
- **Consolidation (absorbs old Phase 6):** delete `INTERESTS[].color`/`.tag` once nothing reads them;
  delete the dead `notifyNewFlare` at `lib/notifications.js:92`; unify the two body-copy greys in
  `InfoPageShell`; "iFlare" → "flare" terminology pass.
- **Docs:** update `CLAUDE.md` (it still describes a 5-step wizard and a 480px-at-every-viewport
  layout, and lists `components/` without the later additions), and the status logs in both plan files.

---

## 5. Status log

### Phase A — Foundation — ✅ COMPLETE

**What it accomplished**

1. *The app has a typeface.* `Inter` (`--font-sans`) and `Space_Grotesk` (`--font-display`) load via
   `next/font/google`, self-hosted at build with metric-adjusted fallbacks. This was the single
   largest contributor to the "unstyled" read: there was previously **no font setup anywhere** — no
   `next/font`, no `@font-face`, no `fontFamily` in the Tailwind theme — so every screen rendered in
   whatever the browser defaulted to. `h1/h2/h3` default to the display face.
2. *A real colour system.* Replaced the flat token block with a structured ramp: four opaque
   `--surface-0..3` steps, three `--line-*` steps, four `--text-*` steps, a five-stop `--brand-*`
   ramp, and `--success`/`--warning`/`--danger` each with a `-strong` fill variant. Exposed in
   Tailwind as `bg-surface-1`, `border-line`, `text-ink-subtle`, `text-brand-400`, `bg-danger/10`.
3. *A type scale that can express hierarchy.* `xs`/`sm`/`base` keep Tailwind's defaults on purpose
   (the app is already too small; the fix is usage, not shrinking the scale). Added `2xs` as a real
   token to retire the arbitrary `text-[10px]`/`text-[11px]`, and progressively tighter letter-spacing
   from `lg` up through `6xl` — the optical correction stock Tailwind omits.
4. *One radius ladder.* `--radius: 0.875rem` (14px) now derives all six steps via `calc()`. The eight
   ad-hoc radii collapse onto it, and retuning is a one-line change. `rounded-xl` moves 12→16px,
   `rounded-2xl` 16→20px.
5. *An elevation scale.* `shadow-e1..e4` plus `shadow-brand` and `shadow-focus-brand`. Each level
   pairs a drop shadow with an `inset 0 1px 0 rgb(255 255 255 / …)` top highlight, because a dark
   shadow on a dark ground is nearly invisible — the lit edge is what reads as raised.
6. *A motion vocabulary.* Keyframes + animations for `fade-in`, `fade-in-up`, `fade-in-down`,
   `scale-in`, `sheet-up`, `sheet-down`, `shimmer`, `pop`, `pulse-ring`, plus `caret-blink`. Easing
   tokens `--ease-out-quart` / `--ease-out-back` and `transitionTimingFunction` entries.
7. *Gradients as a system.* `bg-gradient-brand` (the lit button face), `bg-gradient-urgent`,
   `bg-gradient-glow` (ambient hero/empty-state flare), `bg-gradient-hairline`, `bg-shimmer`.
8. *The blanket transition rule is gone,* replaced by a targeted rule on interactive elements only,
   and a `prefers-reduced-motion` block was added — there was none, despite two infinite
   `animate-pulse` elements.
9. *Document metadata.* `viewport` (with `viewport-fit=cover`), `themeColor: #0e1016` matching
   `--surface-0`, `openGraph`, and a title template. None existed.

**Files changed**

| File | Change |
| ---- | ------ |
| `VISUAL_OVERHAUL_PLAN.md` | **New** — this file |
| `tailwind.config.js` | Rewritten: `fontFamily`, `fontSize`, token colours with `<alpha-value>`, radius ladder, `boxShadow`, `backgroundImage`, easing, keyframes/animation, `spacing.13`, `maxWidth.column` |
| `app/globals.css` | Rewritten: token ramps on `:root, .dark`, parked `.light`, base rules, `.tabular`/`.stagger`/`.glow-backdrop`/`.no-scrollbar`, cross-browser scrollbars, targeted transitions, reduced-motion |
| `app/layout.js` | `next/font` Inter + Space Grotesk; `viewport` and expanded `metadata` exports |

**Implementation decisions**

- *Dark tokens live on `:root` **and** `.dark`.* next-themes only adds the class after hydration, so
  with the dark values solely under `.dark` the server-rendered first paint used the light block — a
  white flash on every cold load. `.light` is parked below and stays untested, as before.
- *shadcn aliases point at the ramp rather than duplicating it* (`--card: var(--surface-1)`). `var()`
  substitution is textual, so `hsl(var(--card))` resolves through to the triplet, and all 49 generated
  primitives inherit the new system without being edited.
- *The text ramp is namespaced `ink`, not `text-*`.* `text-primary` has to keep meaning the brand
  orange for shadcn's link variant, so a `textColor.primary` override would have silently changed it.
  `text-ink` / `-muted` / `-subtle` / `-disabled` has no such collision.
- *Every colour uses the `<alpha-value>` placeholder.* Verified in the built CSS: `bg-primary/90`
  emits `hsl(var(--primary)/.9)` rather than dropping the modifier.
- *`--text-tertiary` was set to clear 4.5:1* on both `surface-0` and `surface-1`. It replaces
  `text-slate-500`, the app's most-used text colour (100 occurrences) at roughly 4.1:1 and usually
  paired with `text-xs`.
- *`--danger` replaces `--destructive`'s red-900 (`#7f1d1d`)*, which was so dark that every error in
  the app bypassed it for a raw `red-400`. `--destructive` now aliases `--danger-strong`.
- *`--chart-1..5` are finally defined.* `tailwind.config.js` referenced them and `globals.css` never
  declared them, so every `chart-*` utility resolved to an invalid colour.
- *`animate-caret-blink` now works.* `components/ui/input-otp.jsx` has always asked for it; the
  keyframe was never defined, so the OTP caret was a static 1px bar.
- *The blanket `*` transition had to go.* It animated ten properties on every node including Radix
  portals, adding a competing 150ms transform transition that fought `tailwindcss-animate`'s enter/exit
  keyframes, partially defeated next-themes' `disableTransitionOnChange`, and made every explicit
  `duration-300`/`duration-500` in the codebase a lie.
- *`color-scheme: dark` on `html`* so the native date/time pickers in `CreateFlareForm` step 2 stop
  rendering their glyphs dark-on-dark (a live bug).

**Tests / checks performed**

- `RESEND_API_KEY=x next build` — compiles clean, all 19 routes generated, no new warnings. First Load
  JS unchanged across every route (fonts are self-hosted files + CSS, not JS).
- Verified in the emitted CSS: all four `--surface-*`, `--text-primary`, `--brand-500` present;
  `hsl(var(--primary)/.9)` alpha form working; all six `calc(var(--radius) …)` radii; `@keyframes
  caret-blink` emitted; `scrollbar-color`; the `:focus-visible` ring; `h1,h2,h3` bound to
  `var(--font-display)`; `body` bound to `var(--font-sans)` and `hsl(var(--text-primary))`; the
  targeted interactive transition rule; the `prefers-reduced-motion` block; and **zero** occurrences
  of the old blanket `*` transition.
- Verified over HTTP against a dev server: `<html lang="en" class="__variable_f367f3
  __variable_6b9622">` (both font variables applied), `<meta name="theme-color" content="#0e1016">`,
  `<meta name="viewport" … viewport-fit=cover>`. Both woff2 families emitted to
  `.next/static/media/`.

**Known issues / notes for later**

- **Phase A is intentionally a half-migrated look.** The tokens are in place but the ~700 hardcoded
  `slate-*`/`orange-*` utilities still render their old values, so the new surfaces sit next to the old
  ones (e.g. `AppShell`'s header is still `bg-slate-950/90` against a `--surface-0` page). This
  resolves progressively through Phases B–F and is expected until then.
- `.tabular`, `.stagger`, `.glow-backdrop` and most new keyframes are **not in the built CSS yet** —
  Tailwind tree-shakes unused component-layer classes and animation keyframes. They appear as soon as
  a component uses them. Not a bug; don't "fix" it.
- `next build` still fails without `RESEND_API_KEY` set to anything, because
  `app/api/[[...path]]/route.js:108` constructs the Resend client at module scope. Pre-existing and
  unrelated; worth making lazy at some point.
- `next start` does not serve this project — `next.config.js` sets `output: 'standalone'`. Use
  `next dev`, supervisor, or `node .next/standalone/server.js` to look at the app.
- The `.light` token block is updated but remains **untested**; the app is still dark-only.
- Browserslist/caniuse-lite data is 15 months old and warns on every build. Pre-existing.

**Handoff → Phase B**

The token layer is complete and verified; Phase B is the first consumer. Everything Phase B needs is
already defined — `h-13` (52px), `shadow-e1..e4`, `shadow-brand`, `bg-gradient-brand`, `bg-shimmer` +
`animate-shimmer`, the radius ladder, and `font-display` for the `Logo` wordmark. Note that
`components/ui/sidebar.jsx` is generated shadcn that earlier phases deliberately did **not** modify
(`AppShell`'s fixed toggle exists because the mobile sheet hides its own close button via
`[&>button]:hidden`) — keep it that way.

---

### Phase B — Primitives — ✅ COMPLETE

**What it accomplished**

1. *The primitives are now worth importing.* The audit's finding was that all 49 shadcn files were
   byte-for-byte stock and only 9 were imported anywhere — not because the app didn't need cards,
   dialogs, badges and skeletons, but because the stock versions were wrong for it and every screen
   hand-rolled its own out of raw slate divs. Nine files were retuned onto the Phase A tokens so the
   D–F page sweep becomes "delete markup, import a component."
2. *Buttons start at the tap target instead of ending below it.* Stock's tallest variant was 40px and
   its default 36px, while every control the product hand-rolls is already `h-11`/`h-12`/`h-14`. The
   scale is now `sm` 36 / `default` **44** / `lg` 52 (`h-13`) / `icon` 44², radius `lg`, and the
   `default` variant is `bg-gradient-brand` + `shadow-brand` + `active:scale-[.98]` — the lit face
   that stops a filled button reading as a coloured rectangle.
3. *The `soft` variant exists.* `bg-orange-500/10 + border-orange-500/30` was hand-written ~18 times
   across the pages; it is now `<Button variant="soft">`, with the matching `<Badge variant="soft">`
   so a chip and a button of the same intent finally look related.
4. *Fields match what every form already overrides its way to.* `Input`/`Textarea` are `h-11`,
   `rounded-lg`, `bg-surface-3` (stock was `bg-transparent`), `border-line`, `focus:border-brand-500`.
5. *`Card` is usable in a 480px column.* Stock's `p-6` on every section is precisely why nothing
   imported it; now `p-4` / `sm:p-5` on `bg-surface-1` with `shadow-e2`.
6. *A modal is no longer the same colour as the page behind it.* `Dialog` and `Sheet` were
   `bg-background` — the overlay was the only thing separating them from the page. Both are now
   `bg-surface-2` + `shadow-e4` + `rounded-2xl`, with a `bg-surface-0/80 backdrop-blur-sm` overlay.
7. *`Dialog` is a bottom sheet on mobile.* Below `sm` it is bottom-anchored with a drag handle and
   `slide-in-from-bottom`; centred and zoomed from `sm` up. `Sheet side="bottom"` gets the same
   handle. This is the pattern `FlareDetailModal` already hand-rolls, so Phase D has a primitive to
   collapse onto instead of a second copy.
8. *Skeletons sweep instead of pulsing.* `animate-pulse` fades a whole placeholder in and out, which
   reads as broken; `Skeleton` is now a `bg-surface-2` block with the `bg-shimmer` + `animate-shimmer`
   highlight sweeping across it. This is the first consumer of the Phase A shimmer keyframe, and
   Phase D's `/flares` loading state is the first consumer of the component.
9. *`Tabs` is the app's segmented control, with a sliding indicator.* One primitive for the two
   divergent hand-rolled switches (`/flares`' boxed `orange-600`, `/activity`'s unboxed `orange-500`)
   to collapse onto in D/F.
10. *One brand lockup.* `components/Logo.js` replaces the three copies that disagreed on filled tile
    vs bare icon and on one-tone vs two-tone wordmark.

**Files changed**

| File | Change |
| ---- | ------ |
| `components/ui/button.jsx` | Size ladder retuned to 36/44/52/44²; variants onto tokens; new `soft`; `rounded-lg` |
| `components/ui/input.jsx` | `h-11`, `rounded-lg`, `bg-surface-3`, `border-line`, `focus:border-brand-500` |
| `components/ui/textarea.jsx` | Same control tokens; `min-h` 60px → 88px |
| `components/ui/card.jsx` | `p-4`/`sm:p-5`, `bg-surface-1`, `shadow-e2`; `CardTitle` onto `font-display` |
| `components/ui/badge.jsx` | Token variants + `soft`/`success`/`warning`/`danger`; `text-2xs` |
| `components/ui/skeleton.jsx` | `animate-pulse` → `::after` shimmer sweep |
| `components/ui/dialog.jsx` | `bg-surface-2` + `shadow-e4`; mobile bottom sheet + drag handle, centred at `sm+` |
| `components/ui/sheet.jsx` | `bg-surface-2` + `shadow-e4`; `rounded-2xl`; drag handle on `side="bottom"` |
| `components/ui/tabs.jsx` | Segmented control with a measured sliding indicator |
| `components/Logo.js` | **New** — `size` / `showWordmark` / `href` lockup |
| `VISUAL_OVERHAUL_PLAN.md` | Phase B row → ✅, this entry |

**Implementation decisions**

- *No page files were touched.* Phase B adds `Logo` but does **not** wire it into `AppSidebar`,
  `AppShell` or `InfoPageShell` — those three call sites belong to the Phase C shell work, and
  sweeping them here would have mixed two phases in one diff.
- *The retune is safe against every current call site,* which was checked before writing: each
  existing `<Button>`/`<Input>`/`<Textarea>` passes explicit `h-*`/`rounded-*`/`bg-*` in `className`,
  and `cn()`/tailwind-merge resolves conflicts in the call site's favour. `Card`, `Badge`, `Dialog`,
  `Sheet`, `Tabs` and `Skeleton` have zero product-code consumers at all — `FlareDetailModal` is a
  hand-rolled fixed div, not a `Dialog` — so those files were free to change outright.
- *Two stock base classes were deliberately dropped from `Button`.* `transition-colors` narrowed the
  broader transition `globals.css` now applies to every `button` and cancelled the transform on
  `active:scale`. `focus-visible:ring-1 ring-ring` only competed with the global `:focus-visible`
  rule, which is `ring-2 ring-brand-500/70` with an offset and is strictly better.
- *`text-base md:text-sm` was kept on the fields.* It looks like an inconsistency but it is load-
  bearing: iOS Safari zooms the viewport when a focused input's text is below 16px.
- *The skeleton's sweep is an `::after`, not a child element.* `SidebarMenuSkeleton` in
  `components/ui/sidebar.jsx` renders `<Skeleton />` with no children, and that file is off-limits —
  a pseudo-element keeps every existing call site working with no wrapper.
- *`Sheet`'s base stays block-level; only `top`/`bottom` become flex columns.* The mobile sidebar is
  the one real consumer of a side sheet and it renders a single `h-full` child under stock's block
  layout, so the flex change was scoped to the two sides that actually stack a handle above content.
- *The drag handle is gated to `side="bottom"` and rendered as a `div`.* It is the only side a user
  would try to drag, and keeping it off `left` means `sidebar.jsx`'s `[&>button]:hidden` rule — which
  `AppShell`'s fixed toggle depends on — is untouched. The handle is `aria-hidden`: it is an
  affordance, not a control, since the sheet closes via the overlay or the close button.
- *`Tabs` measures its own indicator.* Radix has no indicator part, so `TabsList` reads the active
  trigger's `offsetLeft`/`offsetWidth` onto `--tab-x`/`--tab-w` and a single absolutely-positioned
  span follows them. A `MutationObserver` with `attributeFilter: ['data-state']` is the trigger for
  re-measurement because that attribute is the only signal Radix flips for *both* pointer and
  keyboard activation; a `ResizeObserver` catches layout and font-load reflow. `offsetLeft` and
  `left: 0` both resolve against the offsetParent's padding edge, so no padding correction is needed.
  The indicator is `opacity-0` until the first measurement, otherwise it flashes at x=0 on mount.
- *`useImperativeHandle` in `TabsList`* so the component can own a ref internally without breaking a
  forwarded one.
- *`Logo`'s `href` is optional.* Two of the three call sites link and one (`InfoPageShell`) renders a
  static header, so it emits a `<Link>` when `href` is given and a `<span>` otherwise. It is always a
  single element, which is what `<SidebarMenuButton asChild>` requires in `AppSidebar`.
- *The nine rewritten files moved to the repo's style* — single quotes, *why* comments — since they
  stop being generated shadcn and become app-owned. The other 40 primitives keep their stock form.

**Tests / checks performed**

- `RESEND_API_KEY=x npx next build` — compiles clean, all 19 routes generated, no new warnings (only
  the pre-existing 15-month-old browserslist notice). Route sizes unchanged.
- Verified in the emitted CSS that the classes Tailwind previously tree-shook now have consumers and
  are present: `@keyframes shimmer` and `after:animate-shimmer:after{…animation:shimmer 1.6s
  infinite}`, `after:content-['']`, `shadow-brand`, `bg-gradient-brand`, `.h-13`,
  `transition-[transform,width,opacity]`, and tailwindcss-animate's
  `slide-{in,out}-{from,to}-bottom-0` overrides used by the desktop dialog.
- Ran a dev server plus a temporary probe route mounting all nine primitives, and rendered it in
  headless Chromium (`--dump-dom`, so post-hydration DOM):
  - **Tabs indicator measures and follows selection.** With tab 1 active: `--tab-x: 4px`
    (the list's `p-1`), `--tab-w: 219px` (exactly half the 446px inner width), indicator
    `opacity-100`. After activating tab 2 the same span reads `--tab-x: 223px` (4 + 219) —
    i.e. the `MutationObserver` path fires, not just the initial measurement.
  - **Dialog geometry at both breakpoints.** At a <`sm` viewport: `left=0`, full width,
    `bottom` flush with the viewport height — bottom sheet. At 1200px: `w=512` (`max-w-lg`),
    `left=344` = `(1200−512)/2`, and vertically centred — so the `sm:` overrides do beat the mobile
    classes in the cascade.
  - **Drag-handle gating.** The bottom sheet renders the handle, `side="left"` renders none, and the
    dialog's handle carries `sm:hidden`.
  - All of `/`, `/login`, `/register`, `/flares`, `/settings`, `/activity`, `/profile`, `/about`
    returned 200 with no runtime error.
- The probe route was deleted afterwards; `git status` shows only the nine primitives, `Logo.js`,
  this file, and the untouched Phase A changes.

**Known issues / notes for later**

- **Phase B changes almost nothing visually yet, by design.** Only `Button`, `Input` and `Textarea`
  have live call sites, and all of them override the new styling with their existing hardcoded
  classes. The other six primitives have no consumers until Phases D–F. The half-migrated look from
  Phase A persists.
- **`Tabs`' sliding indicator has not been exercised with a `vertical` orientation** — it measures
  `offsetLeft`/`offsetWidth` only. The app has no vertical tabs; if one is ever needed the sync
  function needs a `top`/`height` branch.
- `next build` still needs `RESEND_API_KEY` set to anything (module-scope Resend client at
  `app/api/[[...path]]/route.js:108`), and `next start` still does not serve this project
  (`output: 'standalone'`) — use `next dev`, supervisor, or `node .next/standalone/server.js`.
- The build is memory-hungry on a loaded machine; it was OOM-killed once here and completed under
  `NODE_OPTIONS=--max-old-space-size=1600`.
- `components/ui/sidebar.jsx` remains unmodified, as Phase A left it.

**Handoff → Phase C**

`Logo` exists but is wired into nothing — replacing the three lockups in `AppSidebar.js`,
`AppShell.js` and `InfoPageShell.js` is the first easy win of the shell work, and the new
`AppTopBar` will want `<Logo size="sm" href="/flares" />`. `Button size="lg"` (`h-13`) is the CTA
height the auth wizards' hand-written `h-14` should collapse onto, and `variant="soft"` is what the
sidebar's tinted active state can be built from. `Tabs` is ready for the `/flares` and `/activity`
segmented controls, though those pages are swept in D and F respectively, not C.

---

### Phase C — Shell & desktop layout — ✅ COMPLETE

**What it accomplished**

1. *There is chrome above 768px for the first time.* The only header in the app was
   `md:hidden`, so every desktop viewport had no title, no search, no bell and no account
   control — the sidebar was the entire UI, and the only logout was an unlabelled icon on
   `/profile`. `components/AppTopBar.js` is one sticky bar serving both breakpoints: below `md`
   it is what the old bar was (space for the fixed toggle, plus the wordmark, since no sidebar is
   on screen); from `md` up it carries the page title, the page's own search, the notification
   bell and an account menu.
2. *The desktop layout stopped being a widened phone.* `--app-column-width` capped content at
   480px at every width. There are now two widths: `.app-column` (30rem → **34rem** at `md`) for
   reading, and `.app-canvas` (identical below `lg`, **68rem** above) for pages with a real
   desktop layout. `AppShell` picks per route.
3. *`/flares` is a feed beside a persistent detail pane at `lg+`.* This is the user's brief —
   *"if you can utilise the desktop display in a better and convenient way, you can go for it"* —
   made concrete. Opening a flare no longer throws a sheet over the whole feed; the feed keeps its
   30rem column, the flare opens beside it, and the chat stays on screen while the feed is still
   scannable. `FlareDetailBody` holds the content, `FlareDetailModal` wraps it below `lg`, the new
   `FlareDetailPanel` wraps it above.
4. *`/activity` inherits the two-pane layout, which deletes the `sessionStorage` hack.* Opening a
   flare there used to write it to `iflare_open_flare` and route to `/flares` — a full feed
   remount that flashed the empty state before the sheet appeared. It opens in place now, and the
   URL never changes.
5. *`/profile` and `/settings` are two-column at `lg+`.* Profile splits read-only identity and
   university (left, sticky) from the editable bio and interests (right); Settings splits the one
   stateful section from the two link lists.
6. *The nav's selected state finally uses the brand.* Stock shadcn's active row is a slate fill
   plus `font-medium`, so the brand colour never appeared in the sidebar at all. Active rows now
   get a 3px brand left indicator, a tinted fill and a tinted icon.
7. *One unread badge.* It was `bg-red-500` on the feed bell, `bg-orange-500` in the sidebar and a
   third treatment on `/notifications`. `components/UnreadBadge.js` is the single definition —
   brand fill, `9+` clamp — and all four sites (including the new top bar) use it.
8. *One brand lockup, wired in.* Phase B built `Logo` but deliberately left it unused; the three
   hand-written copies in `AppSidebar`, `AppShell` and `InfoPageShell` are now gone.
9. *One gutter.* The shell used `px-4` while the landing, auth and info pages used `px-6`, so
   content shifted sideways when you crossed between them. `.app-gutter` (`px-4 sm:px-6`) is the
   one value; the shell and `InfoPageShell` use it (the auth and landing pages are swept in E).
10. *`/terms` is in the nav.* It was linked from Settings and the public footer but missing from
    the sidebar.

**Files changed**

| File | Change |
| ---- | ------ |
| `app/globals.css` | `--app-canvas-width` + the `md`/`lg` breakpoint ladder for both widths; `.app-canvas`, `.app-gutter` |
| `tailwind.config.js` | `maxWidth.canvas` |
| `components/AppShell.js` | `AppTopBar`; `WIDE_ROUTES` picks column vs canvas; wrapped in `AppChromeProvider`; toggle onto tokens; local `Brand` deleted |
| `components/AppTopBar.js` | **New** — the sticky bar, route-derived title, search slot, bell, account menu |
| `components/AppSidebar.js` | `Logo`; brand active indicator/tint; `UnreadBadge` + collapsed-icon dot; `/terms` |
| `components/UnreadBadge.js` | **New** — the one unread badge, with a `dot` variant |
| `components/Logo.js` | (Phase B) now wired into all three call sites |
| `components/FlareDetailBody.js` | **New** — the detail content, extracted verbatim from the modal |
| `components/FlareDetailModal.js` | Reduced to the overlay + sheet container + Escape |
| `components/FlareDetailPanel.js` | **New** — the `lg+` side pane, plus its empty state |
| `components/InfoPageShell.js` | `Logo`; `.app-gutter` |
| `lib/AppChromeProvider.js` | **New** — the top bar's portal slot |
| `lib/useSessionUser.js` | **New** — the cached-session read the top bar needs |
| `lib/flareTime.js` | **New** — `getTimeInfo` / `getUrgencyStyles`, moved out of `/flares` so `/activity` can share them |
| `app/(app)/flares/page.js` | Two-pane grid; portalled search; detail panel; `sessionStorage` effect deleted; header `md:hidden`; `UnreadBadge` |
| `app/(app)/activity/page.js` | Two-pane grid; opens the detail in place; handoff write deleted; title `md:hidden` |
| `app/(app)/profile/page.js` | Two-column at `lg`; header `md:hidden` |
| `app/(app)/settings/page.js` | Two-column at `lg`; title `md:hidden` |
| `app/(app)/notifications/page.js` | `UnreadBadge`; header `md:hidden` |
| `CLAUDE.md` | The two statements Phase C invalidated: the single-column rule, and the `sessionStorage` handoff |
| `VISUAL_OVERHAUL_PLAN.md` | Phase C row → ✅, this entry |

**Implementation decisions**

- *The wide-layout opt-in is route-driven, not page-driven.* A page announcing its own width
  through context could only do so after mount — one hydration frame of the wrong layout and a
  visible reflow. `WIDE_ROUTES` in `AppShell` is known on the server. The cost is that the shell
  holds a list of routes, which is the same thing it already does for the top bar title.
- *The desktop search is the page's own `FlareSearch`, portalled — not a second input.* Lifting
  the query into the shell would invert ownership of the filter and the interest suggestions;
  rendering a separate field in the bar would mean two inputs fighting over one query. Instead
  `AppTopBar` exposes a DOM node and `/flares` portals its existing component into it, so there is
  one instance and one piece of state at every viewport. Verified: at 1440px the input's
  `closest('header.sticky')` is the top bar; at 390px it is inline in the page.
- *The slot is only rendered when `useSidebar().isMobile` is false,* not merely hidden with
  `md:hidden`. A slot that only looked hidden would still be a live portal target on a phone and
  would swallow the field into a `display:none` container. The trade-off is one post-hydration
  reposition on desktop (SSR paints the field inline, the callback ref fires, it moves up) — the
  same class of hydration switch the sidebar itself already performs.
- *`setSlot` is a `useState` setter passed straight to `ref=`.* Stable identity, so no re-attach
  loop; and it is state rather than a ref because the page has to re-render when the slot appears.
- *Page `<h1>`s are `md:hidden` and the top bar's title is the `<h1>` from `md` up,* so there is
  exactly one page heading at every viewport rather than two. Confirmed in the browser at both
  breakpoints on all five app routes.
- *Info routes are deliberately absent from `PAGE_TITLES`.* `InfoPageShell` renders its own `<h1>`
  with a subtitle as page *content*, so a top-bar title there would be a duplicate; the bar shows
  the bell and account menu only.
- *`/profile` keeps its icon-only logout below `md`.* The plan moves that control into the account
  menu, but the menu only exists from `md` up, and `/settings` is the only other logout. Neither
  confirms yet — the destructive-action dialogs are Phase F, which still lists that work.
- *The detail pane is a region, not a dialog.* No overlay, no focus trap, no Escape, and
  `autoFocus` on the join CTA is gated to the modal (`autoFocusJoin`). Nothing is blocked behind
  the pane, so treating it as modal would only take the keyboard away from the feed. Verified:
  after selecting a flare on desktop, focus stays on `<body>` rather than jumping to the CTA.
- *The sheet is suppressed by an `lg:hidden` wrapper rather than a JS breakpoint check.* A
  `fixed` element inside a `display:none` ancestor is not rendered, so the sheet and the pane can
  never both be on screen for one selection — with no media-query hook and no hydration flash.
- *Joining no longer closes the sheet.* It used to `setSelectedFlare(null)`, which on desktop
  would close the pane at the exact moment joining unlocked its chat. It now swaps in the updated
  flare, so the CTA becomes "You're going!" and `FlareChat` appears in place. The update is
  computed from current state before both setters rather than inside the `setFlares` updater, so
  it doesn't depend on updater execution order. Full join feedback (toast, rollback) is still
  Phase D's.
- *A flare that leaves the feed clears the selection.* The pane sits beside the feed, so leaving a
  flare open in it after its window closed or a filter excluded it would show a detail with no
  corresponding row.
- *`getTimeInfo`/`getUrgencyStyles` moved to `lib/` verbatim, raw palette classes and all.* Phase
  C is a layout phase; retuning them onto the tokens is Phase D. The point of the move is that
  `/activity` needed them and a second copy would have been the third divergent urgency palette in
  a codebase that already had three "success" greens.
- *`FlareDetailBody` is a verbatim extraction.* Not restyled — Phase D owns the stat row, the
  collapsed "Open spot" placeholders and the fixed-height CTA, and mixing that into the extraction
  would make the diff unreviewable.
- *`FlareDetailPanel` keys its body on `flare.id`* so switching flares resets the pane's scroll
  position and the chat's state instead of leaving you halfway down the previous attendee list.
- *The collapsed sidebar gets a dot, not a number.* `SidebarMenuBadge` hides itself under
  `group-data-[collapsible=icon]`, so the count silently vanished; an 8px brand dot rides on the
  row instead. Verified in both states.
- *`components/ui/sidebar.jsx` remains unmodified,* as Phases A and B left it. The brand active
  state is passed in as `className` and tailwind-merge drops stock's conflicting
  `data-[active=true]:bg-sidebar-accent` — confirmed in the rendered markup.

**Tests / checks performed**

- `RESEND_API_KEY=x next build` — compiles clean, all 19 routes generated, no new warnings beyond
  the pre-existing browserslist notice.
- Verified in the emitted CSS: `--app-canvas-width` declared at `:root` and overridden in both
  `@media (min-width: 768px)` and `@media (min-width: 1024px)`; `.app-canvas`, `.app-gutter` and
  `max-w-canvas` all present.
- Driven in headless Chromium against a dev server, signed in as a seeded user with two seeded
  flares (both removed afterwards; `db.flares` back to 11):
  - **Width ladder.** `.app-column` 390 / 544 / 544px at 390 / 800 / 1100px viewports.
    `.app-canvas` 390 / 544 / 844 / 1088px at 390 / 800 / 1100 / 1440px — 844 at 1100px because
    the viewport minus the 256px sidebar is still under 68rem, 1088 (= 68rem) at 1440.
  - **Two-pane and two-column grids at 1440px.** `/flares` and `/activity` `480px 536px`,
    `/profile` `320px 680px`, `/settings` `500px 500px`; `/notifications` has no grid and stays in
    the 544px reading column.
  - **Detail routing by viewport.** Desktop: clicking a card fills the pane (`h2` = the flare
    title), the sheet is in the DOM but `lg:hidden` collapses it to zero width, and the feed stays
    visible. Mobile 390px: the pane is 0×0, the sheet opens 390×844.
  - **Join from the pane** leaves it open with the CTA reading "You're going!" and the chat
    rendered.
  - **`/activity` opens in place** — after clicking a card the URL is still
    `http://localhost:3111/activity` and the pane shows the flare.
  - **Account menu** opens with Profile / Settings / Log out.
  - **Sidebar active row**: `background rgba(249,116,21,0.1)`, `color rgb(253,186,114)`, and a
    3px `rgb(249,116,21)` `::before` at full opacity.
  - **Unread badge** with 2 seeded unread: sidebar `2` on `rgb(249,116,21)` in a 20×20 pill, top
    bar bell the same colour with `aria-label="Notifications (2 unread)"`, mobile feed bell the
    same, `/notifications` page header the same — one colour across all four. Collapsing the
    sidebar (`data-collapsible="icon"`) hides the numeric badge and shows the 8×8 brand dot.
  - **Exactly one visible `<h1>` per route** at both 390px and 1440px, on all five app routes.
  - **`/about` signed in**: sidebar present, reading column, no duplicate title in the bar.
    **Signed out** (clean browser context): no sidebar, no top bar, the `Logo` renders with the
    brand gradient mark and the two-tone wordmark, 24px gutter, 544px column.
  - **Zero** page errors or console errors across every route visited.

**Known issues / notes for later**

- **The half-migrated look persists and is still expected.** Phase C moved the shell, the sidebar
  and the layout onto tokens, but the page bodies are untouched — `/flares`' mode switch, its
  info banner and the feed cards are still raw `slate-*`/`orange-*`, and so is everything inside
  `FlareDetailBody`. That is Phases D–F.
- `/flares` no longer wraps its content in `<main>` (it returns a fragment) because `SidebarInset`
  already renders one; the other four app pages still nest a second `<main>` inside it. Harmless,
  pre-existing, and worth normalising during the D–F sweep.
- The desktop top bar's logout does not confirm, matching `/profile`'s. Both are Phase F.
- `FlareSearch`'s suggestion panel now opens inside the sticky top bar on desktop. It renders
  correctly, but the panel's combobox semantics and keyboard handling are still the ones Phase D
  is scheduled to rewrite.
- `next build` still needs `RESEND_API_KEY` set to anything (module-scope Resend client at
  `app/api/[[...path]]/route.js:108`), and `next start` still does not serve this project
  (`output: 'standalone'`).
- `components/ui/sidebar.jsx` remains unmodified.

**Verification setup (reusable — this cost time to rediscover in C)**

- Build: `RESEND_API_KEY=x npx next build`. It is memory-hungry on a loaded machine; if it gets
  OOM-killed, add `NODE_OPTIONS=--max-old-space-size=1600`.
- Dev server: `RESEND_API_KEY=x npx next dev -p 3111`, started **from the repo root** and in the
  background. Nothing runs on :3000 here and there is no supervisor, despite what `CLAUDE.md` says.
- Browser: there is no system Chrome, but a headless one is cached at
  `~/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome`. Drive it with
  `puppeteer-core` installed into the scratchpad (`npm install --no-save puppeteer-core@23`).
  **Do not write probe scripts or install deps under `/tmp` directly — it was wiped mid-session
  in C, taking the dev server and `node_modules` with it.** Use the session scratchpad.
- Signed-in probing: `page.evaluateOnNewDocument` to seed `iflare_user`, `iflare_token`
  (`base64({userId, timestamp})`), and `iflare_onboarding_seen:<userId>` — without that last key
  the onboarding modal covers the page and steals focus. Seed `iflare_notifications` to exercise
  unread badges. Use a fresh `browser.createBrowserContext()` for signed-out checks; a second
  `newPage()` shares localStorage and will still look signed in.
- Dev DB is `iflare_dev` (not `iflare`), reachable via `mongosh --quiet iflare_dev`. It holds 3
  users and 11 flares; `arjun@iitkgp.ac.in` (`9b9d6e19-8025-475e-993f-2ad519b4bd56`, interests
  `sports/tech/music`) is a good probe account. Seeding flares needs `hostEmailDomain` set and a
  `startTime` inside the 90-minute window, and **delete anything you seed afterwards**.
- Waiting on `networkidle2` plus a poll for "no `.animate-spin` and some heading exists" is what
  made the page probes reliable; a fixed `domcontentloaded` + sleep gave false negatives on cold
  dev compiles.

**Handoff → Phase D**

The three defects are still unfixed and are Phase D's first task — `/flares` still initialises
`flares` to `[]` with no `isLoading`, still collapses fetch failures into `setFlares([])`, and
still has the off-by-one between the page's `attendees.length < maxAttendees` and the body's
`>= maxAttendees - 1`. What Phase C leaves ready for them: `Skeleton` (Phase B) has its first real
consumer waiting in the feed's loading state, and `lib/flareTime.js` is now the single place to
retune `getUrgencyStyles` off the raw palette. `FlareDetailBody` is the file to restyle — one edit
reaches both the sheet and the desktop pane — and note that its CTA now has to hold its height in
a pane that is always on screen, not just in a sheet. `FlareCard` is unchanged and still needs its
hierarchy work.

---

### Phase D — Feed & flare surfaces — ✅ COMPLETE

**What it accomplished**

1. *The feed stopped lying about being empty.* `flares` initialised to `[]` while the fetch waited on a
   **second** effect to read `localStorage`, so every user was told "No iFlares in the next 90
   minutes" on every visit, before their data had even been requested. `isLoading` starts `true` and
   the feed renders three shimmer skeleton cards — the first real consumer of the `Skeleton`
   primitive Phase B built and the `shimmer` keyframe Phase A defined.
2. *A failed fetch is no longer an empty campus.* `setFlares([])` in both the non-OK and the `catch`
   branch meant a 500 and a quiet campus rendered identically, with no way to tell them apart or to
   try again. There is now a distinct error state with a Retry button, and it says explicitly that
   the fault is ours.
3. *Joining has feedback, rollback, and the right capacity rule.* The page guarded
   `attendees.length < maxAttendees`; the detail body and the API both use
   `attendees.length >= maxAttendees - 1` (because `maxAttendees` counts the host and `attendees[]`
   does not). The page was one seat looser than the server, so the last join was optimistically shown
   and then rejected by a 400 nobody read. All three now read `getFlareCapacity()` in
   **`lib/flareCapacity.js`**. Success raises a `sonner` toast; failure rolls back the feed *and* the
   open detail and surfaces the server's own message. `sonner` had been mounted globally and used by
   exactly one page.
4. *The feed refreshes itself.* The 60s interval only bumped `currentTime`; another student's new
   flare needed a full page reload to appear. It now also refetches, silently — a background failure
   leaves the feed you are reading on screen rather than replacing it with an error, and the open
   detail is reconciled rather than closed.
5. *`FlareCard`'s visual weight order was emoji → urgency badge → title.* The title had no size class
   at all while the badge was `font-bold`, coloured and pulsing. The title now leads (`text-lg`,
   display face, two lines), venue and spots are readable `text-sm` with tabular counts, and the
   badge is a quiet chip whose **dot** carries the urgency. Added: labelled interest chips (three
   different custom interests used to render as three identical `✨`, and screen readers got a bare
   emoji), the host's name, a "You're going" marker, and hover-lift / `active:scale` / `focus-visible`
   — the card had none of the three, while the *secondary* activity card had two.
6. *The three facts you open a flare for are the largest type on the sheet,* not the smallest. They
   were `text-xs` values under `text-[10px]` labels; they are `text-2xl .tabular` now.
7. *The CTA holds one height across all five states.* It swung `h-16`↔`h-14`, which in the always-on-
   screen desktop panel reflowed the whole right column every time the state changed. Every branch is
   `Button size="lg"` (52px, verified).
8. *N dashed "Open spot" placeholders became one row.* At `maxAttendees: 10` that was eight
   placeholders pushing the join CTA below the fold — on precisely the flares with the most room.
9. *The sheet is actually modal now.* `animate-sheet-up`, a focus trap, a body scroll lock and focus
   restored to the card that opened it. All four are gated to the sheet's own viewport, which also
   closes a Phase C leak (see decisions).
10. *Chat reads like a conversation.* Consecutive messages from one sender are one group with one
    name — the name repeated on every bubble, including your own. Plus day separators, `<time
    dateTime>`, `overscroll-contain` on the nested scroller, and a "New messages" pill instead of
    yanking you to the bottom every 6 seconds regardless of where you were reading.
11. *Search is a real combobox.* `role="combobox"`, `aria-expanded`, `aria-controls`,
    `aria-activedescendant`, arrow keys and Enter — none of which existed, so the suggestions were
    pointer-only. The clear control is a 44px target rather than a bare 16px icon, the panel gets
    `animate-scale-in`, and suggestions resolve through `useInterestCatalog`, so a student whose own
    interests are custom ones finally sees them (the `INTEREST_MAP` filter silently dropped every
    custom interest, though the create form supports them fully).
12. *`getUrgencyStyles` is on the tokens.* It was moved to `lib/` verbatim in C, raw palette and all —
    its own red, yellow and a third "success" green. One map on the semantic tokens now, read by
    `/flares` and `/activity` alike.

**Files changed**

| File | Change |
| ---- | ------ |
| `lib/flareCapacity.js` | **New** — `getFlareCapacity()`: the one answer to "how full is this flare", matching the API's rule |
| `lib/flareTime.js` | `getUrgencyStyles` onto the semantic tokens; new `getUrgencyDot`; `animate-pulse` dropped |
| `components/FlareCard.js` | Rewritten hierarchy; labelled chips; host + going marker; hover/active/focus; new `FlareCardSkeleton` export |
| `components/FlareDetailBody.js` | `text-2xl` stat row; collapsed open-spots row; fixed-height CTA; `InterestChip`; tokens throughout; `getUrgencyStyles` imported rather than passed |
| `components/FlareDetailModal.js` | `animate-sheet-up`, focus trap, scroll lock, focus restore, drag handle — all gated to the sheet's viewport |
| `components/FlareDetailPanel.js` | Dropped the `getUrgencyStyles` prop |
| `components/FlareChat.js` | Sender grouping, day separators, "New messages" pill, `overscroll-contain`, `Input` primitive, tokens |
| `components/FlareSearch.js` | Combobox semantics + keyboard nav; `useInterestCatalog`; 44px clear; `animate-scale-in`; tokens |
| `components/InterestChip.js` | Its four palette constants onto the tokens (it became a feed surface this phase) |
| `app/(app)/flares/page.js` | The three defects; interval refetch; selection reconciliation; `Tabs` mode switch; token sweep |
| `app/(app)/activity/page.js` | Dropped the `getUrgencyStyles` prop from both detail call sites (mechanical) |
| `app/api/[[...path]]/route.js` | `connectToMongo` cold-start race (see decisions) |
| `VISUAL_OVERHAUL_PLAN.md` | Phase D row → ✅, this entry |

**Implementation decisions**

- *Capacity got its own module rather than a home in `lib/flareTime.js`.* Three surfaces asked "is it
  full" and two of them disagreed; timing is not the place to settle that. `getFlareCapacity` returns
  `{max, taken, openSpots, isFull, nearlyFull}` and deliberately does **not** clamp `taken` — if a
  document ever goes over capacity, "7/6" is the honest render.
- *`getUrgencyStyles` is imported by `FlareDetailBody`, not threaded through as a prop.* It was a
  three-hop prop (page → modal/panel → body) for a pure function from one shared module. Removing it
  simplified four call sites; `/activity` needed the same mechanical edit.
- *`FlareCard` and `FlareDetailBody` call `useInterestCatalog` themselves.* Threading a `catalog` prop
  from each page through two containers was the alternative. The hook is module-cached with a
  subscriber set and dedupes its in-flight fetch — its own header comment names "the feed's cards" as
  the case it was built for — so N mounts cost N subscriptions and one request.
- *The urgency dot is the only thing that pulses, and only at `critical`.* `animate-pulse` on the
  whole chip faded the text it was trying to draw attention to; `animate-pulse-ring` expands a
  `--danger` shadow, so `critical` is the one level whose colour the keyframe actually matches.
- *The modal's new behaviours are gated by `matchMedia`, and this fixed a live Phase C leak.* Callers
  suppress the sheet with an `lg:hidden` wrapper rather than unmounting it, so on a desktop the
  component still mounts behind a `display:none` ancestor. A scroll lock there would freeze the page
  for a sheet nobody can see, and a Tab trap would confine focus to an invisible subtree. Escape was
  *already* leaking that way before this phase — closing the desktop pane that Phase C deliberately
  made non-modal. The gate covers all three. It guards effects only; the markup is identical either
  way, so there is no hydration mismatch and nothing flashes. Verified at 1440px: `body.style.overflow`
  stays empty and Escape leaves the pane open.
- *The selection effect gained a second branch, and the identity check is what keeps it from looping.*
  It cleared `selectedFlare` when the flare left `filteredFlares`; it now also swaps in a refreshed
  copy so a pane that is permanently on screen doesn't go stale during the 60s refetch.
  `filteredFlares` is a new array on every clock tick but its **elements** are the same objects until
  `flares` actually changes, so `live !== selectedFlare` is false on a tick and true only on real new
  data. Confirmed in the browser: a flare inserted by another user appeared within the refetch window
  with the open pane untouched and no skeleton flash.
- *The refetch is `silent`.* A background refresh must not drop the feed you are reading back to
  skeletons, and a failed one must not replace a perfectly good feed with an error screen — so
  `isLoading`/`loadError` are only touched by a foreground fetch (first load, Retry).
- *`flareData` was removed from the join request body.* The endpoint has a leftover sample-data branch
  that **inserts** a client-supplied flare when the id isn't found (a gap `CLAUDE.md` documents). With
  it in the body, a join against a stale id silently created a flare instead of 404-ing — which would
  have made the new error handling report success on a nonsense request. Every feed flare comes from
  the DB, so nothing needed it. **The server branch still exists**; deleting it is still open work.
- *The `/flares` mode switch collapsed onto `Tabs`,* the primitive Phase B built for exactly this and
  the sliding indicator it measures. `/activity`'s divergent copy is Phase F's, as planned.
- *`InterestChip` was retuned even though it isn't in D's file list.* Phase D puts it in the feed, next
  to `Badge`/`Button` `soft`; leaving it on `orange-500`/`slate-800` would have put two treatments of
  "tinted brand chip" side by side. Four constants, and it improves the Phase E pages early.
- *The card shows two labelled chips, not three.* Labelled chips are much wider than the emoji-only
  ones they replace, and at 390px a third wrapped the row onto a third line. The title also went to
  `line-clamp-2` — with the urgency chip in the same row, one clamped line cut most titles mid-word,
  on the element the card exists to show.
- *Copy was left alone.* "iFlare" → "flare" is Phase F's terminology pass; changing half of it here
  would have made that sweep incoherent. Only genuinely new strings (the error state, "You're going")
  are in the new voice.
- *One backend fix, and it was not optional.* `connectToMongo` assigned `client` synchronously
  *before* awaiting `client.connect()`, so a second concurrent request saw a truthy `client`, skipped
  the block and got a still-`undefined` `db` — a 500 with "Cannot read properties of undefined
  (reading 'collection')". Two concurrent requests on a cold server reproduce it, which `/flares` now
  does on every load, because the interest catalogue is fetched alongside the feed. Caching the
  in-flight promise (and clearing it on failure so the next request retries) makes every caller wait
  on the same connect. Verified: 12 concurrent requests against a cold server, all 200, zero API
  errors — where the same pattern produced a logged 500 before.

**Tests / checks performed**

`RESEND_API_KEY=x next build` — compiles clean, all 19 routes generated, no new warnings beyond the
pre-existing browserslist notice. Then driven in headless Chromium against a dev server, signed in as
the seeded `arjun@iitkgp.ac.in`, with four seeded flares chosen to hit every state (1 spot left, full,
happening-now, and a flare carrying a **custom** interest), plus six seeded messages spanning two days
— all removed afterwards (`db.flares` back to 11, `db.interests` back to 0).

- **Loading.** With the feed request delayed 2.5s: 3 skeleton cards with 21 shimmer elements, the
  false "No iFlares in the next 90 minutes" **absent** throughout, and the match counter withheld
  until data lands.
- **Error + retry.** A 500 renders the `role="alert"` state with a working Try again; nothing says the
  campus is empty; the retry clears the alert and the feed renders.
- **Capacity, end to end.** Cards read `3/4 · 1 spot left`, `3/3 full`, `1/6 going`, `2/10 going`; the
  full flare's CTA is `This iFlare is full`, disabled. Under the old page guard that flare would have
  accepted a join and been rejected by the API.
- **Join success.** Toast "You're going to Badminton doubles at SAC", CTA flips to "You're going!" in
  place, chat appears, the feed card updates to `4/4 full`, pane stays open.
- **Join failure** (join forced to 400): the server's own message in an error toast, feed card rolled
  back `1/6`, pane's stat tile back to `1/6 · 5 spots left`, CTA back to "Join iFlare".
- **CTA height** measured at 52px in all of join / going / full.
- **Stat row** measured at 24px (`text-2xl`); one "spots left" row, never N.
- **Sheet modality at 390px.** `body.style.overflow: hidden`, `animation-name: sheet-up`,
  `overscroll-behavior: contain`, drag handle present; 25 consecutive Tabs keep focus inside the
  dialog; Escape closes it, restores `overflow` and returns focus to the card that opened it.
- **Sheet effects do NOT run at 1440px** (the `lg:hidden` case): `body.style.overflow` empty, Escape
  leaves the pane open.
- **Chat.** Rendered groups: `DAY:YESTERDAY, Priya×2, You×1, DAY:TODAY, Priya×1, You×2` — grouping and
  day separators both correct; auto-scrolled to the bottom on open. Scrolled to top, then a message
  posted by the other user: `scrollTop` stayed 0 (no yank) and the "New messages" pill appeared;
  clicking it scrolled to the bottom and dismissed the pill. Uses the `Input` primitive.
- **Search at both breakpoints.** Mobile: field inline, 358px. Desktop: `closest('header.sticky')` is
  the top bar, 384px. Both: `aria-expanded` flips, `aria-controls` matches the listbox id, panel
  animates `scale-in` at `z-40` and is on screen, ArrowDown×2 moves `aria-activedescendant` to option
  1, Enter selects it and the "Filtered by tech · clear" chip appears, clear target measures 44×44.
- **Custom interests.** A user whose interests are `['board-games', 'sports']` sees "🎲 Board Games
  yours" first in the suggestions — the case the old `INTEREST_MAP` filter dropped entirely. The card
  for a flare tagged `board-games` renders "🎲 Board Games", not a third identical `✨`.
- **Live refetch.** A flare inserted directly into Mongo while the feed was open appeared within the
  60s window without a reload; the open pane stayed on its own flare, the counter went 4 → 5, and no
  skeleton flashed.
- **Two-pane grid** still `480px 536px` at 1440px, as Phase C measured.
- **Cold-start concurrency:** 12 interleaved `/api/interests` + `/api/flares` requests against a
  freshly started server — all 200, zero `API Error` lines in the log.
- **Route sweep:** `/flares`, `/activity`, `/profile`, `/settings`, `/notifications`, `/about` at both
  390px and 1440px — exactly one visible `<h1>` each and **zero** page or console errors. `/activity`
  opens the shared `FlareDetailBody` correctly at both sizes (`4/4 full`, "You're going!", chat, no
  open-spot rows).

**Known issues / notes for later**

- **Both detail containers mount at every viewport,** so a selected flare renders `FlareDetailBody`
  twice — once in the hidden one. That means **two `FlareChat` instances polling** the same flare
  every 6s. This is pre-existing from Phase C (the `lg:hidden` / `hidden lg:block` pair is what avoids
  a hydration flash) and is not visible to the user, but it doubles chat polling whenever a flare is
  open. Unmounting the inactive one needs a JS breakpoint, which is the trade-off Phase C weighed and
  declined; worth revisiting with a shared media-query hook.
- **The join endpoint's sample-data branch still exists.** The client no longer sends `flareData`, so
  nothing reaches it, but any caller still can. Delete the branch (it is also the cross-university
  hole `CLAUDE.md` documents).
- The card's emoji tile and its first interest chip show the same emoji. Deliberate — the tile is the
  card's visual anchor and the chip is the label — but it is a duplication a future pass may want to
  resolve.
- `Stat`'s value is `truncate`d. A long urgency string would clip rather than wrap; the only one long
  enough was "Started N min ago", which is now shortened to the label "N min ago".
- `next build` still needs `RESEND_API_KEY` set to anything (module-scope Resend client), and
  `next start` still does not serve this project (`output: 'standalone'`).
- `components/ui/sidebar.jsx` remains unmodified, as A, B and C left it.
- `CLAUDE.md` was **not** touched: nothing in it became false this phase. Its file table still predates
  the newer `lib/` and `components/` additions, which is Phase F's docs item.

**Verification setup**

Unchanged from the Phase C block above and still accurate — dev server on 3111 from the repo root, the
cached Chrome at `~/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome` driven by
`puppeteer-core` installed into the session scratchpad, the three `localStorage` keys (including
`iflare_onboarding_seen:<userId>`), and `iflare_dev` as the database. Two additions from this phase:

- `page.setRequestInterception(true)` is how the loading, error and join-failure states were reached —
  delay `/api/flares?` to hold the skeletons on screen, `respond({status: 500})` for the error state,
  `respond({status: 400})` on `/join` for the rollback path.
- Seed flares at `+9`, `+35`, `+48` and `-6` minutes to cover critical / medium / full / happening in
  one load, and give one of them a custom interest id plus a matching `interests` document (with
  `emailDomain`) to exercise the catalogue path.

**Handoff → Phase E**

Phase E (create flow, auth wizards, landing) depends on B, not D, so nothing here blocks it. What D
leaves ready: `CreateFlareForm` is the one thing on `/flares` this phase deliberately did **not**
touch, and it is now the last raw-palette surface on that page — its "Toast on success" item can copy
the `sonner` pattern the join handler establishes, and its per-field validation can reuse the
`role="alert"` treatment `FeedError` and `FlareChat` now use. `Tabs` is proven in a real page, so
`/activity`'s switch in F is a straight swap. `InterestChip` is already on the tokens, so the register
wizard's interest step inherits that for free. Note that the literal `&apos;`-inside-a-JS-string bug
E is scheduled to fix (`CreateFlareForm` line 163) is the same trap `FlareCard` now carries a comment
about.

---

### Phase E — Create flow, auth, landing — ✅ COMPLETE

**What it accomplished**

1. *The create form's validation is reachable.* Its primary button was `disabled` under exactly the
   conditions its own error branches tested, so those branches could never run and a grey button was
   the entire explanation of what was missing. The button is live now and every field carries its own
   message with `aria-invalid` + `aria-describedby`, the step reports **all** its problems at once,
   and focus goes to the first one. Editing a field clears that field's message rather than leaving
   the complaint on screen until the next submit.
2. *Cancel asks before discarding.* It silently threw away a filled two-step form; `alert-dialog.jsx`
   had been sitting unused in the repo the whole time. It only asks when there is something to lose.
3. *Creating a flare says so.* The page routes to `/activity` on success, so the flow previously ended
   on a different screen with nothing confirming anything had happened. A `sonner` toast names the
   flare and its venue, following the pattern Phase D's join handler established.
4. *The literal `&apos;` inside a JS string is gone* (`CreateFlareForm` line 163 rendered
   "doesn&apos;t" to the user). It is the same trap `FlareCard` carries a comment about.
5. *`StepProgress` stopped lying and stopped losing focus.* The fill read 25% of a four-step wizard
   before the user had done anything; it now ends mid-way through the current step's segment — 12.5%
   at step 1 of 4, 87.5% at step 4, never a false 0% or 100%. And because both wizards change step by
   swapping the whole subtree, focus was being dropped onto `<body>` and the scroll position left
   wherever the previous step ended: the component now scrolls to top and moves focus to an sr-only
   step line, which is also what announces the change.
6. *The three auth screens became one flow.* `/forgot-password` and `/verify` didn't use `.app-column`
   at all, so they spanned the full viewport while `/login` and `/register` were capped.
   `/forgot-password` also had a bespoke two-bar progress indicator, a plain text field with
   `tracking-[0.5em]` standing in for the same 6-digit code `/register` renders with `InputOTP`, an
   orange info banner where `/register` used emerald, a placeholder hardcoded to one institution
   (`you@sst.scaler.com`), and no `htmlFor`/`id` on any field. All six are fixed; `/verify`'s third
   success colour and Title Case copy went with them.
7. *One banner.* `components/FormBanner.js` replaces the three divergent error/info blocks, with
   `role="alert"` for errors and `role="status"` for confirmations — none of the three announced
   itself before, so an error appearing several hundred pixels above the button you just pressed was
   silent to a screen reader.
8. *The password reset actually ends somewhere.* It pushed to `/login?reset=1` and `/login` never read
   the parameter, so the last thing a successful reset did was drop you on a plain sign-in form with
   no word about whether it had worked.
9. *The landing page no longer ships blank.* Its four-bucket mount fade was driven by an `isLoaded`
   state starting `false`, which meant the server rendered the **whole page** at `opacity-0` — anyone
   whose JS was slow, blocked or broken got nothing, and so did anything reading the HTML. Reveals are
   scroll-triggered now and the hidden state is applied client-side only. Verified: zero `opacity-0`
   in the server HTML.
10. *The sample flares stopped being a dead end.* They looked tappable and were inert; they now have
    the same hover lift as `FlareCard`, their venues come from `lib/campusLocations.js` instead of
    four duplicated literals (an invented venue previews a place no flare can be at, since the create
    flow only offers that list), and their four different accent colours — green, orange, amber,
    emerald — collapse onto the one brand tile the real card uses.
11. *A signed-in visitor gets sent to the feed.* Nothing links to `/` from inside the app, so reaching
    it meant a bookmark or the address bar, and the answer was a marketing pitch.

**Files changed**

| File | Change |
| ---- | ------ |
| `components/FormBanner.js` | **New** — the one error/success/info banner, with tone-derived `role` |
| `components/StepProgress.js` | Fill math; scroll-to-top + focus move on step change; tokens |
| `components/CreateFlareForm.js` | Per-field validation; cancel confirm dialog; success toast; the `&apos;` bug; token sweep |
| `app/register/page.js` | `FormBanner`, `Logo`, `Button size="lg"`, per-step `animate-fade-in-up`, token sweep, two unreachable validations freed |
| `app/login/page.js` | Reads `?reset=1`; `FormBanner`, `Logo`, `.app-gutter`, token sweep |
| `app/forgot-password/page.js` | `.app-column`/`.app-gutter`, `StepProgress`, `InputOTP`, `FormBanner`, `Logo`, `htmlFor`/`id`, generic placeholder |
| `app/verify/page.js` | `.app-column`, `Logo`, shared shell for the Suspense fallback, one success colour, sentence case |
| `app/page.js` | `Reveal` (IntersectionObserver); glow backdrop; display hero; venues from `lib/campusLocations.js`; sample-card hover; signed-in redirect; token sweep |
| `VISUAL_OVERHAUL_PLAN.md` | Phase E row → ✅, this entry |

**Implementation decisions**

- *`StepProgress` owns the step transition, not the wizards.* Scroll and focus were broken identically
  in both flows, and a third flow (`/forgot-password`) has just joined them. Putting it in the one
  component every multi-step flow already renders means there is no way to add a step transition that
  forgets to do it. The first run is skipped by a ref, so opening a page doesn't scroll or steal focus.
- *The focus target is an `sr-only` line, not the progress bar.* Focusing the bar would draw the global
  `:focus-visible` ring around a 4px-tall element. The sr-only paragraph takes focus invisibly and
  reads "Step 2 of 4: Account", which is exactly what the change needs to announce.
- *The fill is the segment midpoint, not completed-steps.* `(clamped - 1) / (total - 1)` would be the
  other honest option, but it renders an empty bar on step 1 — which reads as broken rather than as
  "you are at the start" — and a full one on the last step, which is the same lie in the other
  direction. `(clamped - 0.5) / total` is never either.
- *Validation reports the whole step, then focuses the first problem.* Reporting one error at a time
  would make a three-field step three round trips. Focus goes to the first invalid control so a
  keyboard or screen-reader user lands on the thing to fix, not at the top of the document.
- *`aria-invalid` on the interests popover trigger, not on a field.* Interests have no input element —
  the control is the popover's trigger button, so that is what carries the invalid state and the
  `aria-describedby`, with `aria-labelledby` pointing at the "Who should see this?" label it sits under.
- *Two register buttons lost their `disabled` too,* for the same reason: `handleUniversityContinue`'s
  "Pick your university to continue" and step 4's "Please pick at least 3 interests" were both
  unreachable behind it. The OTP step's Verify likewise now only disables while in flight, since
  pressing it with a short code is how a user asks what is wrong. `/login`'s submit keeps its
  `disabled` — there is no hidden validation behind it, only an empty form.
- *The reset flow's `onComplete` waits for the password.* `/register`'s OTP submits the moment six
  digits land, because the code is the only thing on that step. Here the new password is on the same
  step, so auto-submitting a complete code would fire a request that can only fail.
- *`/login` reads the query parameter from `location.search`, not `useSearchParams`.* That hook forces
  the page under a Suspense boundary at build time, and its fallback would flash on every cold load of
  the app's main entrance — a real regression traded for one boolean flag. `/verify` keeps `Suspense`
  because it genuinely blocks on a token, and its fallback now renders the same shell as the page.
- *The landing page's reveal applies its hidden class in a layout effect, never in the server render.*
  That is the whole difference from the old `isLoaded` pattern: the markup ships visible, and the
  element is only hidden once the client has confirmed it has `IntersectionObserver` and the user
  hasn't asked for reduced motion. Each observer is one-shot, so scrolling back up doesn't re-animate.
- *The hero's mark is `<Logo showWordmark={false} />` with the page's own display wordmark under it.*
  Phase C collapsed three lockups into `Logo`; a fourth hand-written Radar tile here would have
  reopened that. The vertical hero arrangement is the page's, the mark itself is not.
- *`FormBanner` renders nothing for an empty message,* so the five `{error && (...)}` guards it
  replaces live in one place. Callers still gate `info` behind `!error` where both can be set at once.
- *`alert-dialog.jsx` was styled at the call site, not retuned.* It is the tenth shadcn primitive and
  the only consumer so far is this one dialog; making it the app's own is Phase F's job, alongside the
  two destructive confirmations `/settings` and `/profile` still need.

**Tests / checks performed**

`RESEND_API_KEY=x next build` — compiles clean, all 19 routes generated, no new warnings beyond the
pre-existing browserslist notice. Then driven in headless Chromium against a dev server on 3111:

- **Landing SSR is not blank.** The server HTML contains **zero** `opacity-0` and the hero copy is
  present. In the browser the hero settles at `opacity: 1`, the h1 is 48px on Space Grotesk, the glow
  backdrop is mounted, and below-fold sections stay hidden until scrolled to (the point of the change).
- **Signed-in landing redirect:** with the session seeded, `/` lands on `/flares`.
- **`?reset=1`:** `/login` renders a `role="status"` banner reading "Password updated. Sign in with
  your new password." in `rgb(54, 211, 153)` (`--success`); plain `/login` renders none.
- **Failed sign-in** renders the `role="alert"` banner with the "Create one" link inside it.
- **Create step 1 validation:** one click on Continue produces all three messages, `aria-invalid` on
  `#flare-title`, `#flare-desc` and the interests trigger, `aria-describedby="flare-title-error"`,
  focus on `#flare-title`, and the step does not advance. Typing a title flips its `aria-invalid` to
  false and drops only its message.
- **Create step 2 validation:** "Pick a start time." / "Pick a venue.", `aria-invalid` on both, focus
  on `#flare-time`; filling both clears them.
- **Cancel confirm:** with a title typed, Cancel opens the alert dialog ("Discard this iFlare? …
  Keep editing | Discard"); Keep editing returns to the form with the title intact.
- **Create success:** toast "Probe: badminton doubles is live / Campus Gym · we'll show it to your
  campus." The seeded flare was deleted afterwards (`db.flares` back to 11).
- **`StepProgress`:** `/register` step 1 fills 12.5% with `aria-label="Step 1 of 4: University"` and
  does **not** take focus on mount; after Continue, step 2 fills 37.5%, focus is on the `sr-only`
  element reading "Step 2 of 4: Account", `scrollY` is 0, and the step's `<form>` computes
  `animation-name: fade-in-up`. The previously-unreachable "Pick your university to continue" now
  appears when Continue is pressed with nothing selected.
- **`/forgot-password`:** 544px `.app-column` at 1440px, `StepProgress` ("Step 1 of 2: Email", 25%),
  `label[for="reset-email"]`, generic `you@university.ac.in` placeholder. On step 2 (start
  intercepted, so no mail was sent): 75%, six `InputOTP` slots, the success banner, a labelled
  password field, focus on the sr-only step line, `scrollY` 0, and the short-code error rendering in
  the single error banner.
- **Route sweep** — `/`, `/login`, `/register`, `/forgot-password`, `/verify` at 390px and 1440px: all
  200, exactly one visible `<h1>` each, no horizontal overflow, and **zero** page or console errors.

**Known issues / notes for later**

- **`components/ui/alert-dialog.jsx` is still stock**, styled by the call site. Phase F adds two more
  confirmations (the `/settings` destructive actions, `/profile`'s logout), which is the point at
  which it should be retuned like the other nine primitives.
- The create form's submit button and the `/flares` mode tab both read "Create iFlare". Harmless to a
  user (they are never both in reach of the same glance) but it made the browser probe pick the wrong
  one — worth resolving in Phase F's terminology pass.
- The landing page's reveal leaves below-fold sections at `opacity-0` for a user who cannot scroll for
  some reason. Acceptable — it is the standard behaviour of scroll reveals — but it is the one case
  where the page still depends on JS to show everything.
- `/register` and `/login` still render their own `<h1>` per step; that is correct for public pages,
  which have no top bar to hold the title.
- `next build` still needs `RESEND_API_KEY` set to anything (module-scope Resend client), and
  `next start` still does not serve this project (`output: 'standalone'`).
- `components/ui/sidebar.jsx` remains unmodified, as A–D left it.
- `CLAUDE.md` was **not** touched. One statement in it is now stale — the Authentication Flow section
  describes `/register` as a "5-step signup wizard" — but that predates Phase E (the wizard became
  four steps in the earlier UI/UX plan) and fixing it belongs with Phase F's docs item, which already
  lists that exact correction.

**Verification setup**

Unchanged from the Phase C block above. Two notes from this phase:

- Radix `TabsTrigger` activates on mousedown/focus, so a synthetic `element.click()` does **not**
  switch the `/flares` mode. Use a real `page.click()` / `ElementHandle.click()`.
- `page.setRequestInterception` responding 200 to `/api/auth/forgot-password/start` is how step 2 of
  the reset flow is reached without sending mail through Resend.

**Handoff → Phase F**

F is now the only phase left, and E leaves it three things it can lean on. `FormBanner` exists for
`/activity`'s missing error state. `AlertDialog` has a working, styled call site to copy for
`/settings`' two destructive actions and `/profile`'s logout — and retuning the primitive itself is
worth doing at that point rather than styling a third call site by hand. `StepProgress` now handles
focus for every flow that uses it, which is the same class of bug F has to fix in
`OnboardingWalkthrough`'s dependency-array-less listener effect. Note also that E deliberately left
copy alone apart from sentence-casing `/verify`: "iFlare" → "flare" is still F's terminology pass, and
`INTERESTS[].color`/`.tag` still have no readers left to remove.


---

### Phase F — Secondary screens & consolidation — ✅ COMPLETE

**What it accomplished**

1. *`/activity` stopped being a second app.* It rendered its own hand-written flare card — a
   different shape, a different urgency palette, a different hover treatment and a different set of
   facts for the same object — beside its own hand-rolled segmented control. Both are gone: the
   page uses `FlareCard` and the `Tabs` primitive. The card grew three optional props to absorb
   what was genuinely different (`meta` for the role/date strip, `muted` for a finished flare,
   `selected` for the row whose detail is open in the pane) rather than being forked again.
2. *`/activity` has an error state and a clock.* A failed fetch left `flares` at its empty default,
   so the page told you that you had never created or joined anything — the one thing it exists to
   prove otherwise. There is a distinct `role="alert"` state with Retry now, plus skeletons while
   loading. And the page rendered exactly once: a card opened before its flare started never
   flipped to "Ended", on the screen whose whole subject is *when* things happen. A 60s tick feeds
   `getTimeInfo` as a real argument.
3. *Timing stopped being nonsense outside the feed's window.* `getTimeInfo` only knew minutes, so a
   flare three days out read **"4320 min"**. `/flares` never showed one (it filters to 90 minutes)
   but `/activity` holds everything you have ever created or joined. There is an `upcoming` level
   now — "Later today", "Tomorrow", "Fri", "13 Oct" — and `getTimeInfo(startTime, now)` takes an
   injectable clock so a page's tick is a data dependency rather than an incidental re-render.
4. *`/profile` can finally see the interests it is editing.* It rendered a raw `INTERESTS.map`, i.e.
   the twelve built-ins and nothing else — so a student whose interests included a custom one (which
   the register wizard and the create form both fully support) could not see it, could not remove it,
   and would silently drop it by saving. It renders `InterestSelector`, the shared picker.
5. *The save button is where you can reach it.* It only appeared when dirty, at the bottom of a long
   two-section scroll — on a phone the confirmation of a change you had just made was off-screen. It
   is a sticky bar pinned to the viewport bottom, and it says what is still missing ("1 more interest
   to go") rather than being a disabled grey rectangle. Measured pinned at 390×700.
6. *Three destructive actions now ask.* Logging out (from `/profile` and the account menu) and
   clearing the notification history were single unconfirmed taps, and the history is not
   recoverable. `components/ConfirmDialog.js` is the one shape for the question, and
   `alert-dialog.jsx` — the tenth primitive, left stock through Phase E and styled by its single
   call site — is retuned onto the tokens with the same bottom-sheet-on-mobile geometry as
   `dialog.jsx`.
7. *The first-run guide is reachable again.* Dismissing it wrote a per-user flag and that was
   permanent; nothing in the app could clear it. `/settings` has a "Replay the welcome guide" entry.
8. *The guide is no longer the smallest type in the app.* It ran at `text-xs` body copy above `h-9
   text-xs` buttons — smaller than anything it was explaining, for the first thing a new user reads.
   Body is `text-sm`, buttons are the 44px primitive (measured), the panel enters on `animate-sheet-up`,
   and its listener effect had **no dependency array**, so three document listeners were removed and
   re-registered on every render of a component that re-renders on every step of the tour.
9. *Notifications are not dead ends any more.* Every row was a button whose only effect was marking
   itself read: the screen was a list of things that had happened somewhere else with no way to get
   there. Rows are links to `/flares?flare=<id>`, and `/flares` reads that parameter on load, opens
   the flare, and strips the parameter. When the flare is gone, or is outside the 90-minute window,
   it says so instead of doing nothing.
10. *The notification list reads like a list.* Per-type icons, Today/Yesterday/date grouping with
    sticky day headers, real `<time dateTime>` elements, and a minute tick — `formatRelative` was
    computed once at mount and never again, so a notification that arrived while the page was open
    read "Just now" permanently.
11. *`INTERESTS[].color` and `.tag` are deleted.* A per-id Tailwind palette that only ever covered
    the twelve built-ins, so a student's own interest rendered grey beside a green "Sports &
    Fitness". `components/InterestChip.js` had already replaced it; this phase removed the last
    reader (`/profile`) and then the fields. The dead `notifyNewFlare` in `lib/notifications.js` is
    deleted too, and the *live* one in `NotificationProvider` stopped carrying its own private copy
    of the twelve emoji.
12. *"iFlare" is no longer a noun for a meetup.* The product is **iFLARE**; an individual meetup is a
    **flare**. Verified as zero occurrences in `app/`, `components/` and `lib/`, and zero in the
    rendered text of all ten routes at both breakpoints.
13. *`InfoPageShell` has one body grey.* Its own copy was `slate-300` while every `InfoSection` under
    it was `slate-400`, so the same paragraph changed colour depending on whether it happened to sit
    inside a section — on pages that are nothing but body copy.

**Files changed**

| File | Change |
| ---- | ------ |
| `lib/flareTime.js` | `upcoming` urgency level + day-word labels; injectable `now`; `VISIBILITY_WINDOW_MINS` |
| `lib/interests.js` | `color`/`tag` deleted from all twelve entries |
| `lib/notifications.js` | Dead `notifyNewFlare` deleted |
| `lib/NotificationProvider.js` | `interestEmoji` instead of a private emoji map; "flare" copy |
| `components/FlareCard.js` | New `meta` / `muted` / `selected` props, so `/activity` can use it |
| `components/ConfirmDialog.js` | **New** — the one destructive confirmation |
| `components/ui/alert-dialog.jsx` | Retuned onto the tokens; mobile bottom sheet, centred at `sm+` |
| `components/InterestSelector.js` | Token sweep; `role="alert"` on its error |
| `components/InterestChip.js` | Comment updated now that the fields it replaced are gone |
| `components/NotificationsPanel.js` | Rows are links; per-type icons; day grouping; ticking `<time>`; confirm on Clear all; tokens |
| `components/OnboardingWalkthrough.js` | Type scale; `animate-sheet-up`; dependency array; `replayOnboarding()` export |
| `components/InfoPageShell.js` | One body grey; tokens |
| `components/CreateFlareForm.js` | Its inline alert dialog collapsed onto `ConfirmDialog`; "flare" copy |
| `app/(app)/activity/page.js` | Rewritten: `FlareCard`, `Tabs`, error state, skeletons, minute tick, tokens |
| `app/(app)/profile/page.js` | `InterestSelector`; sticky save bar; logout confirm; tokens |
| `app/(app)/settings/page.js` | Two confirms; replay-tour entry; tokens |
| `app/(app)/notifications/page.js` | Tokens |
| `app/(app)/flares/page.js` | `?flare=` deep link; `filteredFlares` as a memo; `selected` on cards; "flare" copy |
| `app/{page,verify,about}/…`, `components/{FlareChat,FlareDetailBody,FlareSearch}.js`, `lib/universities.js`, `app/api/[[...path]]/route.js` | Terminology pass only |
| `CLAUDE.md` | File tree, file table, auth flow, `interests` collection + endpoints, two new conventions, campus-locations gap |
| `DEVELOPMENT.md` | New § 5.4 (`interests`) and § 7.3 (`/interests`); `bio` on `/user/settings`; backlog |
| `lib/campusLocations.js` | University-specific-venues TODO in the header |
| `UI_UX_IMPLEMENTATION_PLAN.md` | Phase 6 row → delivered as Phase F, with the item-by-item outcome |
| `VISUAL_OVERHAUL_PLAN.md` | Phase F row → ✅, this entry |

**Implementation decisions**

- *`FlareCard` got props, not a fork.* `/activity` needs three things the feed doesn't: which side of
  the flare you are on, an exact date for something weeks away, and a dimmed treatment for one that
  is over. Copying the card was how the app arrived at two of them in the first place. `meta` is a
  node the page supplies, so the card stays ignorant of "created/joined" — a distinction that only
  exists on that page — while owning everything both pages share.
- *`selected` went to `/flares` too, not just `/activity`.* Phase C put a permanent detail pane
  beside the feed and neither page marked which row was open in it. One prop, both call sites.
- *`getTimeInfo` was extended rather than given a sibling.* A second timing function for "the same
  thing, further away" is exactly the split that produced three urgency palettes before. The feed's
  behaviour is untouched: the new branch is unreachable below 90 minutes, which is the only range
  `/flares` renders.
- *`filteredFlares` became a `useMemo`, and this was a real bug, not a tidy-up.* As state written by
  an effect it was always one render behind `flares`: on the render where the fetch resolved, the
  feed had loaded and the filtered list had not. The deep link reads both in one pass, so it
  consistently took the "that flare isn't showing" branch for a flare that was showing — reproduced
  in the browser, then fixed and re-verified. It also removes a render pass from every feed update.
- *The deep link strips its own parameter with `history.replaceState`.* Otherwise reloading the page,
  or navigating back to it, silently reopens a flare the user closed. And `location.search` rather
  than `useSearchParams`, for the reason Phase E recorded: that hook forces the route under a
  Suspense boundary whose fallback would flash on every cold load of the app's main screen.
- *A deep link that can't be honoured says why.* "Gone" and "started already" are different answers
  and the second one points at `/activity`, which is where the flare actually is if you joined it.
  Silently doing nothing is the same dead end this item exists to close.
- *`replayOnboarding` dispatches an event as well as clearing the flag.* `OnboardingWalkthrough` is
  mounted in `AppShell`, which survives navigation inside the `(app)` group — so it reads that flag
  exactly once, long before Settings clears it. Clearing alone would have appeared to do nothing
  until the next full page load. It returns `false` when storage is blocked so the caller doesn't
  toast a promise it can't keep.
- *`dismiss` is a `useCallback`.* The listener effect now depends on it, and an identity that changed
  every render would land the effect back where it started.
- *Notification rows are `<Link>`s, not buttons with a router push.* Middle-click, ⌘-click and the
  status-bar URL preview all come free, and `markAsRead` rides along as an `onClick`.
- *The panel keeps its own Clear-all confirmation even though `/settings` has one.* They are two
  entry points to one irreversible action; the alternative is one of them not asking.
- *Day grouping is derived at render, not stored.* The provider's shape is unchanged — this phase
  adds no field to `iflare_notifications`, so existing histories group correctly with no migration.
- *`InterestSelector` was swept even though it isn't in F's file list,* for the same reason
  `InterestChip` was swept in D: this phase puts it on `/profile`, and a fully-tokenised page with a
  `slate-800/50` field in the middle of it is worse than either state on its own.
- *`Input`'s own styling is now inherited rather than overridden.* The selector passed
  `h-11 rounded-xl border-slate-700 bg-slate-800/50 …`, which is what the Phase B primitive already
  is. Only `pl-9` (for the search icon) remains.
- *The confirm dialogs are one component with a `tone`, not a `<ConfirmDialog>` per call site.*
  Four confirmations across three files, all the same question.
- *`/settings` keeps its own logout handler rather than sharing the top bar's.* Three copies of
  three lines that clear two keys and push a route is not the duplication worth solving; three
  copies of a *dialog* was.

**Tests / checks performed**

`RESEND_API_KEY=x next build` — compiles clean, all 19 routes generated, no new warnings beyond the
pre-existing browserslist notice. Then driven in headless Chromium against a dev server on 3111,
signed in as the seeded `arjun@iitkgp.ac.in`, with four seeded flares chosen to cover every branch
(in the window, days away, long over, and one hosted by someone else that arjun has joined) and four
seeded notifications spanning today / yesterday / nine days ago — all removed afterwards
(`db.flares` back to 11).

- **`/activity` @1440.** Tabs read `All 14 / Created 12 / Joined 2`, the `Tabs` indicator measures
  (`--tab-x: 4px`), the panel is a real `role="tabpanel"`, and the two-pane grid is still
  `480px 536px`. Switching to Created lists 12 and to Joined lists 2, both correct.
- **Card meta and muting.** `Weekend hackathon prep — "You created this | Sep 11 · 11:36 AM"`,
  opacity 1; `Open mic night — "You joined | Sep 9 · 7:36 AM"`; `Morning run by the lake —
  "You created this | ENDED | Sep 8 · 6:36 AM"`, opacity **0.7**. Every pre-existing flare in the
  dev DB rendered with the right badge and the Ended treatment.
- **The `upcoming` branch, end to end.** Opening the flare 3 days out fills the pane's first stat
  with **"Fri"** — where the old code would have rendered "4320 min" — alongside `1/6` and
  `11:36 AM`.
- **`/activity` error state.** With the activity request forced to 500: the `role="alert"` block
  renders "We couldn't load your activity. / Your flares are still there — this is us, not them. /
  Try again", and the page does **not** claim you haven't created anything.
- **`/activity` @390:** one visible `<h1>`, no horizontal overflow, all 14 cards.
- **`/profile`.** The `InterestSelector` search field is present and the three selected interests
  render as removable chips (`Remove Sports & Fitness`, …) — the control the old grid had no concept
  of. Two columns `320px 680px`.
- **The sticky save bar, on a viewport that actually scrolls (390×700, page 1480px tall):**
  `bottom` = 700 = the viewport bottom, full 390px width, on screen both at the top of the page and
  after scrolling. It is absent until dirty. Removing one interest shows "1 more interest to go" with
  Save disabled; removing another shows "2 more interests to go".
- **Saving from the bar** raises "Profile updated", writes the bio through to `localStorage`, and the
  bar disappears (nothing left unsaved).
- **Logout confirm @390** is a bottom sheet flush to the viewport bottom, full width, on
  `rgb(31, 34, 45)` (`--surface-2`), reading "Log out? / You'll need your email and password to sign
  back in. / Stay signed in | Log out". Escape closes it and the session survives.
- **`/settings`.** Rows are Turn on notifications / Clear notification history (4) / Edit profile,
  bio and interests / **Replay the welcome guide** / Log out / the five About links; grid
  `500px 500px`. Clear-all opens its confirm and **leaves all 4 notifications in storage** until
  confirmed; "Keep them" closes it with the history intact. Logout confirms without clearing the
  token.
- **Replay tour:** clears `iflare_onboarding_seen:<id>` (reads `null`), lands on `/flares`, and the
  guide is on screen with `animation-name: sheet-up` — i.e. the event reaches the already-mounted
  instance, which is the case a flag alone would have missed.
- **`/notifications`.** Day headings render `Today / Yesterday / Aug 30, 2026`. Rows carry
  `href="/flares?flare=probe-a1"`, a real `datetime` attribute, per-type icons (radar for
  `new_flare`, others for `message`/`join`) and live text ("3 min ago", "5h ago").
- **Notification → flare, the whole point of the item.** Clicking a row navigates to `/flares`, the
  URL is cleaned to `/flares` (no `?flare=`), the card **"Badminton doubles at SAC"** is
  `aria-pressed="true"`, its detail is open in the pane, and the notification is marked read.
- **The two failure paths.** `/flares?flare=no-such-flare` → toast "That flare isn't around any
  more". `/flares?flare=<a flare 3 days out>` → "That flare has already started or ended / You can
  still find it under My Activity if you joined it." Both strip the parameter.
- **Onboarding.** Panel enters on `sheet-up`; body copy measures **14px** (was 12) and the two
  actions **44px** (was 36); stepping through all four slides and finishing writes the flag and
  closes it; Escape on a fresh run dismisses and writes the flag.
- **Route sweep** — `/flares`, `/activity`, `/profile`, `/settings`, `/notifications`, `/about`,
  `/register`, `/login`, `/`, `/forgot-password` at 390px and 1440px: exactly one visible `<h1>`
  each, no horizontal overflow, **zero** page or console errors, and **zero** occurrences of
  "iFlare" in the rendered text of any of them.

**Known issues / notes for later**

- **Both detail containers still mount at every viewport,** so an open flare renders
  `FlareDetailBody` twice and polls its chat twice. Unchanged from Phase D, where it is described in
  full; `/activity` inherits it. Still not visible to the user, still worth a shared media-query hook.
- **The join endpoint's sample-data branch still exists.** No client sends `flareData` any more, but
  any caller still can, and it is also the cross-university hole `CLAUDE.md` documents. Deleting it
  is backend work that no phase of this plan owned.
- `/flares`' filter chip renders the raw interest **id** ("Filtered by board-games · clear") rather
  than its name. Pre-existing, and one `resolveInterest` call away, but it needs the catalogue in the
  page and was out of scope here.
- `lib/notifications.js` still exports a `useNotifications` hook that nothing imports —
  `NotificationProvider` supersedes it. Left alone: this phase deleted the one dead export the plans
  named, and removing the other is a judgement call about the module's intended API surface.
- Four of the five app pages still nest a second `<main>` inside `SidebarInset`'s. Noted in Phase C,
  harmless, and still unnormalised.
- `next build` still needs `RESEND_API_KEY` set to anything (module-scope Resend client at
  `app/api/[[...path]]/route.js`), and `next start` still does not serve this project
  (`output: 'standalone'`).
- `components/ui/sidebar.jsx` remains unmodified, as A–E left it.
- The `.light` token block is still untested; the app is still dark-only.

**Verification setup**

Unchanged from the Phase C block above and still accurate. Two notes from this phase:

- `localStorage` is shared by every page in a Puppeteer **browser context**, so a probe that wants a
  first-run user must `removeItem('iflare_onboarding_seen:<id>')` explicitly — merely not setting it
  leaves an earlier page's value in place, and the walkthrough silently won't appear.
- `waitUntil: 'networkidle2'` fires *before* the pages' data lands, because every fetch starts after
  hydration. Waiting for `!document.querySelector('[aria-busy="true"]')` — the attribute both feed
  skeletons carry — is what made the probes reliable.
- The sidebar's nav is a `<ul>` of links, so `document.querySelectorAll('li a')` matches it before
  anything on the page. Scope panel queries to `main`.

---

**All phases complete.** The overhaul is finished: tokens (A), primitives (B), shell and desktop
layout (C), the feed and flare surfaces (D), the create/auth/landing flows (E), and the secondary
screens plus consolidation (F). The open items are listed under each phase's "Known issues"; the
largest are the duplicate `FlareDetailBody` mount, the join endpoint's sample-data branch, and the
security gaps `CLAUDE.md` documents, none of which this plan owned.
