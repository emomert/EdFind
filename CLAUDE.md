# CLAUDE.md — Agent brief for EdFind

If you are an AI agent (Claude Code, Cursor, etc.) opening this repo, **read this file first.** It tells you what the project is, how it's structured, and the conventions you must follow.

## Project in one paragraph

EdFind is a SaaS web app for graduating students in Turkey looking for master's programs in Europe. It aggregates scattered university and program information into one searchable database and uses AI to match students to programs based on a personalized profile. The product has three pricing tiers (Free, Partner Universities, Full Access). The current state is early MVP: a profile quiz + one seeded university + a placeholder matcher that returns that one university for every profile.

## Phase

We finished **Phase 0 (foundation docs)** and **Phase 1 (scaffold)** on 2026-05-07, and **Phase 2 (Profile Quiz UI)**, **Phase 3 (Database + seed)**, and **Phase 4 (Wire it up)** on 2026-05-08. The Supabase project lives in `eu-west` (Ireland) and the quiz works end-to-end at the DB layer: the `submitProfile` Server Action validates answers with Zod, persists a profile + match, sets an `edfind_client_id` httpOnly cookie, and the real `/results/[matchId]` page reads via a cookie-authorized service-role join. `scripts/smoke-flow.mjs` exercises the full insert → read → cleanup path. The remaining check is a browser walkthrough; Phase 5 (Vercel deploy) is next. See `docs/architecture.md` for the full phased plan.

## Tech stack — do not deviate without an ADR

- **Next.js 16** (App Router, Turbopack stable) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** + **Lucide** icons
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Vercel** (hosting)
- **DeepSeek** (primary AI provider), **OpenAI** (backup) — accessed via a provider-agnostic wrapper, never the SDK directly from feature code
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

| What | Where |
|---|---|
| System overview, request/data flow, deploy topology | `docs/architecture.md` |
| Postgres schema | `docs/data-model.md` (kept in sync with `supabase/migrations/`) |
| Why we picked X | `docs/decisions/` |
| Brand colors, typography, voice | `docs/design/brand.md` |
| Per-feature specs | `docs/features/` |
| v1 visual reference | `Website UI Design Ver_1.pdf` (repo root) |
| Long-term memory across sessions (Claude Code) | `~/.claude/projects/.../memory/` |

## Don'ts

- **Don't ship a "tier check" only in JS** — must also be in Supabase RLS.
- **Don't silently boost partner universities** in Full Access results.
- **Don't commit `.env*` files** — `.gitignore` already excludes them, keep it that way.
- **Don't introduce a new tool or service** without an ADR explaining why.
- **Don't gold-plate the matcher** during MVP — it's a placeholder until we have real signal data and more universities.
- **Don't write features without updating `docs/features/`** at the same time.
- **Don't put secrets in client components** or in any code path that ships to the browser.
