# Architecture

System overview, data flow, and the phased roadmap for EdFind.

## High-level shape

EdFind is a single Next.js application (web UI + API routes via Server Actions / Route Handlers) talking to a Supabase Postgres database, with server-side AI calls to DeepSeek (primary) or OpenAI (backup). Everything is hosted on Vercel + Supabase — no separate backend service.

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
                │   lib/ai/  ──────────────┼───► DeepSeek (primary)
                │                          │     OpenAI    (backup)
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
| **Browser** | Public anon Supabase key, public env (`NEXT_PUBLIC_*`) | DeepSeek/OpenAI keys, Supabase service-role key, Stripe secret |
| **Vercel server runtime** | All secrets via env vars | Logging secrets, returning secrets in responses |
| **Supabase Postgres** | RLS-policy-enforced reads/writes | Bypassing RLS from client code — service-role calls only from server |

**Rule:** any code path that uses a server secret must be a Server Component, Server Action, or Route Handler. The provider abstractions in `lib/ai/` and `lib/supabase/server.ts` exist so feature code never reaches for an SDK directly.

## Primary user flow — profile quiz (MVP)

```
1. User lands on /              (Server Component, public)
2. Clicks "Profile Quiz"        → /quiz
3. Answers 7 questions          (client state — no server roundtrip per step)
4. Submits                      → Server Action `submitProfile(answers)`
                                  ├─ inserts row into `profiles`
                                  ├─ runs placeholder matcher
                                  │  (returns the single seeded university)
                                  └─ returns `matchId`
5. Redirects to /results/:matchId  (Server Component reads from DB)
```

For the MVP placeholder matcher: no AI call yet. The matcher just returns the seeded Politecnico di Milano program for every profile. Real matching is a later phase once we have multiple universities and signal data.

## Phased roadmap

| Phase | Scope | Status |
|---|---|---|
| **0 — Foundation** | README, CLAUDE.md, architecture, data-model, ADRs 0001-0003, brand tokens, profile-quiz spec | Complete (2026-05-07) |
| **1 — Scaffold** | Next.js 16 + TS + Tailwind v4 + shadcn init, brand tokens applied, top nav layout from design | Complete (2026-05-07) |
| **2 — Profile quiz UI** | 7-question quiz with mascot + progress bar + loading screen, all client-side state | Complete (2026-05-08) |
| **3 — Database + seed** | Supabase project, schema for `universities`/`programs`/`profiles`/`matches`, seed Politecnico di Milano | In progress (2026-05-08) — migration + seed SQL written, helpers in `lib/supabase/`; awaiting live Supabase project credentials to apply |
| **4 — Wire it up** | Server Action submits quiz → stores profile → placeholder matcher → results page | Not started |
| **5 — Deploy** | Vercel deployment, end-to-end click-through with the user | Not started |

**Beyond MVP** (deferred, unordered): real matching, more universities, accounts/auth, payment tiers, university and program detail pages, application tracker + Kanban, community/reviews, scholarships, AI Search free-text entry, Turkish localization.

## Key non-functional requirements

- **Security:** secrets server-only; RLS as a hard backstop for tier gating; no logging of PII or secrets.
- **Performance:** static or RSC-rendered pages where possible (university and program pages will need this for SEO).
- **Cost discipline:** AI calls are the most expensive thing; cache prompts where reasonable, prefer batching, never call AI on every keystroke.
- **Observability** (later): structured server logs + a single error tracker. Not in MVP.

## Decisions index

See `docs/decisions/` for the reasoning behind each architectural choice.
