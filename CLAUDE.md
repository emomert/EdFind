# CLAUDE.md — Agent brief for EdFind

If you are an AI agent (Claude Code, Cursor, etc.) opening this repo, **read this file first.** It tells you what the project is, how it's structured, and the conventions you must follow.

## Project in one paragraph

EdFind is a SaaS web app for graduating students in Turkey looking for master's programs in Europe. It aggregates scattered university and program information into one searchable database and uses AI to match students to programs based on a personalized profile. The product has three pricing tiers (Free, Partner Universities, Full Access). Current state: live at https://ed-find.vercel.app/ with a 13-question profile quiz, a 58-university / 196-program catalog across 15 European countries, real AI matching via DeepSeek V4 Flash, and dedicated university + program detail pages.

## Phase

The 5-phase MVP is complete. Phases 0–1 finished on 2026-05-07; Phases 2–5 finished on 2026-05-08. The product is **live at https://ed-find.vercel.app/**, hosted on Vercel, backed by the Supabase project in `eu-west` (Ireland).

- **Phase 6 / 7** — catalog grew to **38 universities / 54 programs** across 11 European countries.
- **Real AI matching** with **DeepSeek V4 Flash** (`deepseek-v4-flash`). The legacy `deepseek-chat`/`deepseek-reasoner` retire 2026-07-24, so V4 is mandatory not optional. V4 Flash defaults to reasoning mode which burns the entire `max_tokens` budget on `reasoning_content` before emitting JSON — disable with `thinking: { type: "disabled" }`. Matcher returns ranked top 3 with score (0-100) and personalised rationale.
- **Phase 8** — catalog grew to **58 universities / 99 programs across 15 countries** (later expanded to **196 programs** in the Phase 9 catalog round; see Phase 9 notes). Quiz expanded 7→9 questions (`academic_focus`, `work_experience` added; `ANSWERS_VERSION` bumped 1→2), then later 9→10 questions (`additional_context` optional free-text added; `ANSWERS_VERSION` bumped 2→3). **Later expanded to 13 questions / ANSWERS_VERSION 4 (added `current_situation`, `gpa_range`, `study_background`; reframed `english_level` from CEFR to exam-readiness wording) on 2026-06-09** — `current_situation` and `gpa_range` are UI-required but nullable at the data layer, and `study_background` is optional free-text. Added `/universities/[slug]` and `/programs/[universitySlug]/[programSlug]` detail pages, score-bar visualisations, Framer Motion entrance animations.
- **Phase 9** (2026-05-11) — four features in one drop:
  - **9.1 Free-text search** at `/search`. DeepSeek parses the query into `ValidatedAnswers`, then the same matcher path runs. `lib/server/persist-and-match.ts` is now the shared backend for `/quiz` and `/search`.
  - **9.2 Shortlist + compare** at `/shortlist` and `/compare?ids=…`. `SaveButton` lives on results / program / university pages. **Merged into the applications tracker (2026-06-09):** saving creates an `applications` row at status `'interested'`; `/shortlist` is the `'interested'` view; `saved_programs` is deprecated (backfilled into `applications`, not yet dropped); Save = track, so the old separate Track button was removed from program pages.
  - **9.3 Application tracker** at `/applications` — gated by `NEXT_PUBLIC_ENABLE_APPLICATIONS`. Originally a 4-column applications kanban (Phase 9.3); redesigned 2026-05-14 into a split-view dashboard with `StudentProgressCard` header (avatar + target countries + field + progress bar), an `ApplicationsOverview` list with search/filter/sort, a separate task `KanbanBoard` (todo/doing/done) backed by a new `application_tasks` table, and a heuristic `AiRecommendationsPanel` (no AI call yet — see `lib/applications/recommendations.ts`). Drop migration lives in `supabase/uninstall/` so `db-migrate.mjs` doesn't auto-run it. Full spec in `docs/features/applications.md`.
  - **9.4 Google auth — required**. `/quiz`, `/search`, `/results*`, `/shortlist`, `/applications`, `/compare` redirect to `/login`. Public surfaces: `/`, `/login`, `/universities/*`, `/programs/*`. OAuth callback (`app/auth/callback/route.ts`) attaches any pre-auth rows with the same cookie `client_id` to the new `user_id`.

- **Community / Verified Student Insights** at `/community` (2026-05-14) — gated by `NEXT_PUBLIC_ENABLE_COMMUNITY`. Mock-data-only first cut: every university and program in the catalog gets a community group (rich content for 8 hand-picked unis, auto-generated stubs for the rest). 4 tabs (Reviews · Groups · Questions · Campus Responsibles), filter bar, group-chat modal, AI-style sidebar widgets. Subscription gating uses a cookie (`edfind_community_subscribed`) with a floating dev toggle until Stripe is wired — `useSubscription()` hook + `<SubscriberOnly>` wrapper isolate the source so the swap is one-file when billing arrives. Fake data + group generator live in `lib/community/`. Full spec in `docs/features/community.md`.
- **`/catalog` browse + header search (Cmd+K)** (2026-05-14) — public `/catalog` page lists every university and program with filters (country, field, language, duration, partner-only) and links to existing detail pages. A "Search" pill in the site header opens a command-palette modal that lazy-fetches `/api/catalog-search` and lets you jump straight to a uni or program (↑↓ + ↵ keyboard nav, sectioned results). Discovery flows now: `/quiz` (matched), `/search` (AI free-text), `/catalog` (browse everything), header search (known-item lookup). Full spec in `docs/features/catalog.md`.
- **Welcome tour** (2026-06-05) — first-visit overlay walkthrough on the homepage (`components/welcome/welcome-tour.tsx`): modal carousel showcasing each feature in step-by-step boxes with progress bar + dots. Auto-opens once per browser for signed-out visitors (localStorage `edfind_welcome_tour_seen_v1`); replayable via the hero's "Take the quick tour" link. Spec in `docs/features/welcome-tour.md`.
- **Brand logo** (2026-06-05) — real compass-mark logo adopted: `logo/` holds master files, `public/logo.png` + `public/logo-text.png` are served, favicons are generated via `scripts/generate-brand-icons.mjs` (never hand-edit `app/icon.png` / `app/apple-icon.png` / `app/favicon.ico`). See `docs/design/brand.md` § Logo.
- **University email verification** (2026-06-05) — community is read-for-all / **write-for-verified-students-only**. Users link an academic email to their Google account via a confirmation mail (Resend, ADR 0004; dev-link fallback in the UI until `RESEND_API_KEY` is set). `university_email_verifications` table + `is_university_verified()` RLS helper; `VerificationProvider`/`useVerification()`/`<VerifiedWriterOnly>` mirror the subscription pattern. Any academic domain counts (TLD patterns + curated list + live catalog `website` domains). Spec in `docs/features/university-verification.md`. Email/password sign-up deliberately deferred — Google stays the only sign-in.
- **Housing & cost of living** (2026-06-09) — city- and university-level student-housing sections on university + program detail pages, gated by `NEXT_PUBLIC_ENABLE_HOUSING`. AI-researched data in `housing_cities` / `housing_universities` (sources + `researched_on` + draft/published `status`; public-read on published only). Produced by the `housing-research-pilot` workflow (one web-researching subagent per city + university) → `scripts/import-housing.mjs`. Pilot covered 8 cities / 10 universities; remaining catalog still to research. Spec in `docs/features/housing.md`.

Next: Stripe / tier billing, Turkish localization, finish the housing research sweep. See `docs/architecture.md` for the full phased plan.

## Tech stack — do not deviate without an ADR

- **Next.js 16** (App Router, Turbopack stable) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** + **Lucide** icons
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Vercel** (hosting)
- **DeepSeek V4 Flash** (only wired AI provider) — accessed via a provider-agnostic wrapper in `lib/ai/`, never the SDK directly from feature code. The wrapper is OpenAI-compatible, but no OpenAI fallback is wired today (aspirational)
- **Stripe** (payments, deferred until tiers go live)

If you find yourself reaching for an alternative (Firebase, Express backend, MUI, plain Postgres, etc.), **stop and write an ADR first** in `docs/decisions/`.

## Repo conventions

- **All MD docs are load-bearing.** When you change behavior, schema, or architecture, update the relevant doc *in the same session*. Stale docs are worse than missing docs.
- **ADRs** go in `docs/decisions/` numbered sequentially. Use the template in `docs/decisions/README.md`.
- **Feature specs** go in `docs/features/`, one file per feature, kept in sync with the implementation.
- **Server-only secrets:** every AI / Supabase service-role / Stripe call must happen server-side (Server Actions or Route Handlers). Never expose secrets to the browser.
- **Tier gating** must be enforced *both* in app code and in Supabase RLS policies. Never rely on app code alone — the database is the source of truth.
- **Partner universities** are content-tagged and surfaced as a separate tier — never silently boosted inside Full Access matching results. Neutrality is a product promise (see `docs/decisions/` if/when this is formalized).
- **i18n-ready:** v1 is English-only. Audience is Turkish, so write user-visible strings in a way that makes a future Turkish translation a swap, not a rewrite. Avoid concatenating strings; prefer template-friendly forms.

## Coding conventions

- TypeScript strict mode. No `any` without a one-line comment explaining why.
- Server Components by default; opt into client only when needed (`"use client"`).
- Use the helper modules (created in their respective phases):
  - `lib/supabase/server.ts` and `lib/supabase/client.ts` — never instantiate Supabase clients ad-hoc.
  - `lib/ai/index.ts` — feature code imports from here, not from the DeepSeek/OpenAI SDKs.
- Component files: `PascalCase.tsx`. Route segments: `kebab-case`. Util files: `kebab-case.ts`.
- Run typecheck + lint before claiming a task is done.

## Where to find things

| What                                                | Where                                                           |
| --------------------------------------------------- | --------------------------------------------------------------- |
| System overview, request/data flow, deploy topology | `docs/architecture.md`                                          |
| Postgres schema                                     | `docs/data-model.md` (kept in sync with `supabase/migrations/`) |
| Why we picked X                                     | `docs/decisions/`                                               |
| Brand colors, typography, voice                     | `docs/design/brand.md`                                          |
| Per-feature specs                                   | `docs/features/`                                                |
| How to add new universities / programs              | `docs/runbooks/add-programs.md` (read before any catalog drop)  |
| v1 visual reference                                 | `Website UI Design Ver_1.pdf` (repo root)                       |
| Long-term memory across sessions (Claude Code)      | `~/.claude/projects/.../memory/`                                |

## Don'ts

- **Don't ship a "tier check" only in JS** — must also be in Supabase RLS.
- **Don't silently boost partner universities** in Full Access results.
- **Don't commit `.env*` files** — `.gitignore` already excludes them, keep it that way.
- **Don't introduce a new tool or service** without an ADR explaining why.
- **Don't gold-plate the matcher** during MVP — it's a placeholder until we have real signal data and more universities.
- **Don't write features without updating `docs/features/`** at the same time.
- **Don't put secrets in client components** or in any code path that ships to the browser.
