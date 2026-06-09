# Welcome tour — first-visit feature walkthrough

**Status:** live · **Added:** 2026-06-05 · **Surface:** homepage (`/`)

## What it is

A modal carousel that opens over the homepage the first time a visitor opens
the site. It introduces EdFind part by part — one "cute box" per ability —
with a progress bar, step dots, and Back/Next controls, ending in a
"Find my programs" CTA that routes to `/start`.

Chosen form factor: **overlay walkthrough** (vs a dedicated `/welcome` page or
an always-visible homepage stepper) — homepage and deep links stay untouched,
SEO unaffected, and the gate is purely client-side.

## Steps

| # | Key | Shown | Content |
|---|-----|-------|---------|
| 1 | `welcome` | always | Brand mark, one-line pitch, live catalog stat chips (universities / programs / countries, passed from the homepage's Supabase totals) |
| 2 | `quiz` | always | 13-question AI matching quiz (11 multiple-choice/select + 2 optional free-text) → ranked top 3 with rationale |
| 3 | `search` | always | Free-text AI search in your own words |
| 4 | `catalog` | always | Full catalog browse + Ctrl+K header search |
| 5 | `shortlist` | always | Shortlist + side-by-side compare |
| 6 | `applications` | if `APPLICATIONS_ENABLED` | Application tracker dashboard |
| 7 | `community` | if `COMMUNITY_ENABLED` | Verified student insights |
| 8 | `cta` | always | "Let's find your program" → `/start` (secondary: `/catalog`) |

Steps are data (`TourStep[]`) inside the component — copy lives in plain
strings, template-friendly for future Turkish localization.

## Behavior

- **Auto-open**: first visit only, signed-out visitors only, after a 700 ms
  delay so the homepage paints first. The timer re-checks the seen flag at
  fire time (a replay + dismiss inside the window must stick) and skips if
  another `[role="dialog"]` overlay is already up. Signed-in users never get
  it automatically (they already know the product) but can replay it.
- **Once per browser**: any dismissal — Skip, backdrop click, Esc, or
  finishing — writes `edfind_welcome_tour_seen_v1` to `localStorage`. If
  storage is unavailable (private mode), the tour never auto-opens rather
  than nagging on every visit. Backdrop dismissal requires pointer-down AND
  click on the backdrop, so a text-selection drag that ends past the card
  edge doesn't permanently dismiss.
- **Replay**: the hero's "Take the quick tour" link
  (`WelcomeTourReplayLink`) dispatches the `edfind:welcome-tour:open` window
  event; the tour listens and reopens from step 1.
- **Keyboard**: Esc closes, ←/→ navigate, dots are clickable (24px hit
  targets). The handler is a **capture-phase** window listener: while the
  tour is open it swallows Cmd/Ctrl+K (otherwise the header search palette —
  z-50, below the tour's z-60 — opens invisibly behind the backdrop and
  steals focus) and claims Esc exclusively via `stopImmediatePropagation`.
  `HeaderSearch` carries a matching `defaultPrevented` guard.
- **Motion**: framer-motion slide-between-steps. Under
  `prefers-reduced-motion` all transforms are dropped and only short opacity
  fades remain (the shared `components/motion` wrappers go fully inert, but
  an AnimatePresence modal needs an exit state, so fades are kept); the
  progress-bar tween duration drops to 0. Body scroll locks while open.
- **A11y**: `role="dialog"` + `aria-modal` with a stable `aria-label`; focus
  moves to Skip on open, is **trapped** (Tab loops inside the dialog), moves
  to the CTA when the final step renders (so Enter-to-advance ends on it),
  and is restored to the trigger on close. Step swaps are announced via an
  `aria-live="polite"` wrapper + a visually hidden "Step X of Y" line; the
  progress bar exposes `role="progressbar"` values. The card is capped at
  `100dvh` minus padding with internal scroll, so controls stay reachable on
  short/landscape-phone viewports.

## Files

| File | Role |
|---|---|
| `components/welcome/welcome-tour.tsx` | `WelcomeTour` (overlay) + `WelcomeTourReplayLink` (hero trigger) |
| `app/page.tsx` | Mounts both; passes catalog totals + auth state |
| `components/header-search.tsx` | `defaultPrevented` guard so the tour can claim Cmd/Ctrl+K and Esc |

## Future

- When Turkish localization lands, the step copy is the complete string
  inventory for this feature.
- If a real account-level "onboarded" flag ever exists (post-Stripe), the
  localStorage gate can move server-side; the open/dismiss API is already
  isolated in this one component.
