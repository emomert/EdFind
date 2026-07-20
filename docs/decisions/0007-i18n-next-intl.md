# 0007 — Turkish localization via next-intl with a cookie-based locale

- **Status:** Accepted
- **Date:** 2026-07-20
- **Deciders:** Mert + Claude

## Context

EdFind's audience is Turkish students, but v1 shipped English-only (kept
"i18n-ready" per CLAUDE.md). We now need a full Turkish translation of the UI
while the site is live at ed-find.vercel.app. Constraints:

- The site is live; URLs are shared in a presentation deck and demo video.
  Restructuring every route under `/[locale]/` would change or redirect every
  public URL and touch every route file.
- The brand name **EdFind** and all university/program names must stay
  unchanged in both languages.
- The stack is Next.js 16 App Router with Server Components by default; any
  i18n solution must work in both server and client components.

## Decision

Use **next-intl** (v4, explicit Next 16 peer support) **without i18n routing**:
the locale lives in an `edfind_locale` cookie (default `en`), read per-request
in `i18n/request.ts`, with a header `LanguageSwitcher` that sets the cookie via
a Server Action and refreshes. Messages are per-namespace JSON files under
`messages/{en,tr}/`.

## Alternatives considered

- **`/[locale]/` route-segment i18n (next-intl routing or manual)** — best for
  SEO of Turkish pages, but moves every file under `app/`, breaks every live
  URL, and multiplies routing edge cases (auth callbacks, gated redirects with
  `next=` params). Too invasive for a live MVP; can be layered on later if
  Turkish SEO becomes a goal.
- **Hand-rolled dictionary + React context** — no dependency, but reimplements
  message loading, interpolation, server/client plumbing, and formatting that
  next-intl already does well; more bespoke code for future contributors to
  learn. Rejected since next-intl is the de-facto standard for App Router.
- **Per-user DB-stored locale** — needless indirection for an MVP; the cookie
  works for signed-out visitors too, which is most of the funnel.

## Consequences

- **Positive:** zero URL changes; one cookie read; translations organized per
  feature namespace so parallel work doesn't conflict; `useTranslations` /
  `getTranslations` work in every component type.
- **Negative:** reading `cookies()` in the request config opts every page out
  of static rendering — acceptable because the root layout already calls
  `getUser()` (cookies) on every page, so nothing was static to begin with.
  Turkish pages share URLs with English ones, so search engines index one
  language (fine while SEO is not a goal).
- **Follow-ups:** AI matcher rationale generated in the active locale
  (`lib/ai`); mock community content and AI-generated CVs/cover letters stay
  English (documents are submitted to universities in English). See
  `docs/features/i18n.md`.
