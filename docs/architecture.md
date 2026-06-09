# Architecture

System overview, data flow, and the phased roadmap for EdFind.

## High-level shape

EdFind is a single Next.js application (web UI + API routes via Server Actions / Route Handlers) talking to a Supabase Postgres database, with server-side AI calls to DeepSeek V4 Flash. AI calls route through a provider-agnostic abstraction in `lib/ai/` (OpenAI-compatible), but DeepSeek is the only wired provider today — there is no second provider failover in code. Everything is hosted on Vercel + Supabase — no separate backend service.

```
                ┌──────────────────────────┐
                │   Browser (Next.js RSC)  │
                │   Tailwind + shadcn/ui   │
                └────────────┬─────────────┘
                             │  HTTPS
                ┌────────────▼─────────────┐
                │   Next.js on Vercel      │
                │   - Server Components    │
                │   - Server Actions       │
                │   - Route Handlers       │
                │                          │
                │   lib/ai/  ──────────────┼───► DeepSeek V4 Flash (only
                │                          │     wired provider; abstraction
                │                          │     is OpenAI-compatible)
                │   lib/supabase/server.ts │
                └────────────┬─────────────┘
                             │  HTTPS (service role on server,
                             │         anon key on client via SSR)
                ┌────────────▼─────────────┐
                │   Supabase               │
                │   - Postgres             │
                │   - Auth                 │
                │   - Storage              │
                │   - RLS policies         │
                └──────────────────────────┘
```

## Trust boundaries

| Boundary | What's allowed | What isn't |
|---|---|---|
| **Browser** | Public anon Supabase key, public env (`NEXT_PUBLIC_*`) | DeepSeek key (and any future provider keys), Supabase service-role key, Stripe secret |
| **Vercel server runtime** | All secrets via env vars | Logging secrets, returning secrets in responses |
| **Supabase Postgres** | RLS-policy-enforced reads/writes | Bypassing RLS from client code — service-role calls only from server |

**Rule:** any code path that uses a server secret must be a Server Component, Server Action, or Route Handler. The provider abstractions in `lib/ai/` and `lib/supabase/server.ts` exist so feature code never reaches for an SDK directly.

## Primary user flow — profile quiz / AI search

Personalized routes require a Google sign-in (Phase 9.4). Unauthenticated visitors hitting `/quiz`, `/search`, or `/results*` are redirected to `/login`.

```
1. User lands on /              (Server Component, public)
2. Clicks "Profile Quiz"        → /quiz   (or "Describe what you want" → /search)
3. Answers 13 questions         (client state — no server roundtrip per step)
   - 11 multiple-choice/select + 2 optional free-text (`study_background`,
     `additional_context`); v4 added `current_situation` + `gpa_range`
     (UI-required, nullable at the data layer) and reframed `english_level`
   - /search instead: types a free-text query that DeepSeek parses into
     the same `ValidatedAnswers` shape
4. Submits                      → lib/server/persist-and-match.ts
                                  ├─ requires an authenticated user_id
                                  ├─ inserts row into `profiles`
                                  ├─ loads the full program catalog
                                  ├─ runs the DeepSeek V4 Flash matcher
                                  │  (ranked top-3, score 0-100 + rationale)
                                  ├─ inserts one `matches` row per result
                                  └─ returns the highest-scoring `matchId`
5. Redirects to /results/:matchId  (Server Component reads from DB)
```

The matcher is real AI: `lib/server/persist-and-match.ts` is the shared backend for both `/quiz` and `/search`, and it calls **DeepSeek V4 Flash** (`deepseek-v4-flash`) via `lib/ai/`. The model returns a ranked top-3 with a per-match score (0–100) and a personalised rationale, all persisted to the `matches` table. See `docs/features/ai-matcher.md` for prompt design and failure modes.

## Phased roadmap

| Phase | Scope | Status |
|---|---|---|
| **0 — Foundation** | README, CLAUDE.md, architecture, data-model, ADRs 0001-0003, brand tokens, profile-quiz spec | Complete (2026-05-07) |
| **1 — Scaffold** | Next.js 16 + TS + Tailwind v4 + shadcn init, brand tokens applied, top nav layout from design | Complete (2026-05-07) |
| **2 — Profile quiz UI** | 7-question quiz with mascot + progress bar + loading screen, all client-side state | Complete (2026-05-08) |
| **3 — Database + seed** | Supabase project, schema for `universities`/`programs`/`profiles`/`matches`, seed Politecnico di Milano | Complete (2026-05-08) — Supabase project provisioned (eu-west, Ireland), migration + seed applied, smoke-tested via `scripts/check-db.mjs` |
| **4 — Wire it up** | Server Action submits quiz → stores profile → placeholder matcher → results page | Complete (2026-05-08) — `submitProfile` Server Action with Zod validation, httpOnly `edfind_client_id` cookie, real results page reads match → profile → program → university, smoke-tested via `scripts/smoke-flow.mjs`. Browser walkthrough verified live in Phase 5. |
| **5 — Deploy** | Vercel deployment, end-to-end click-through with the user | Complete (2026-05-08) — live at https://ed-find.vercel.app/, two real submissions persisted to Supabase from the live Vercel-hosted Server Action |
| **6 / 7 — Catalog growth** | Expand the seed catalog beyond the single Polimi program | Shipped — grew to 38 universities / 54 programs across 11 countries |
| **8 — Real AI matcher + detail pages** | Replace the placeholder with the DeepSeek V4 Flash matcher; add detail pages; expand the quiz | Shipped — DeepSeek V4 Flash ranked top-3; `/universities/[slug]` + `/programs/[universitySlug]/[programSlug]` detail pages; quiz grew 7→9 questions (`academic_focus`, `work_experience`; `ANSWERS_VERSION` 1→2); catalog reached 58 universities / 15 countries |
| **9 — Discovery + auth (2026-05-11)** | Free-text AI search, shortlist/compare, application tracker, required Google auth | Shipped — `9.1` `/search` (DeepSeek parses query → shared `persist-and-match.ts`); `9.2` `/shortlist` + `/compare`; `9.3` `/applications` task dashboard (flag `NEXT_PUBLIC_ENABLE_APPLICATIONS`); `9.4` Google sign-in required for personalized routes. Quiz later grew to 10 questions (`additional_context` free-text; `ANSWERS_VERSION` 2→3); catalog reached 58 universities / 196 programs |
| **Community + verification (2026-05-14 → 06-05)** | Verified Student Insights pages, `/catalog` browse + header search, welcome tour, brand logo, university email verification | Shipped — `/community` (flag `NEXT_PUBLIC_ENABLE_COMMUNITY`, mock data + cookie subscription gate); public `/catalog` + Cmd+K header search; first-visit welcome tour; real compass-mark logo; community writes gated behind verified academic email (`is_university_verified()` RLS helper, Resend confirmation mail) |

**Next** (deferred, unordered): Stripe / tier billing, Turkish localization.

## Key non-functional requirements

- **Security:** secrets server-only; RLS as a hard backstop for tier gating; no logging of PII or secrets.
- **Performance:** static or RSC-rendered pages where possible (university and program pages will need this for SEO).
- **Cost discipline:** AI calls are the most expensive thing; cache prompts where reasonable, prefer batching, never call AI on every keystroke.
- **Observability** (later): structured server logs + a single error tracker. Not in MVP.

## Decisions index

See `docs/decisions/` for the reasoning behind each architectural choice.
