# 0001 — Tech stack

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** Beyza, Claude

## Context

EdFind is a SaaS web app with a content-heavy public surface (university and program detail pages need to rank in search), an AI-driven matching feature, a tiered paywall, and an application tracker. The user is building their first SaaS and asked for a future-proof, secure, fast stack with low operational overhead. Constraints: solo/small team, EU-focused audience, must avoid leaking AI/payment API keys to the browser.

## Decision

- **Web framework:** Next.js 16 (App Router, Turbopack stable) with TypeScript and React 19.
- **Styling and components:** Tailwind CSS + shadcn/ui + Lucide icons.
- **Database, auth, storage:** Supabase (Postgres + Auth + Storage + RLS) — see ADR 0002.
- **AI:** DeepSeek (primary), accessed via a provider-agnostic wrapper — see ADR 0003. The wrapper is OpenAI-compatible so a second provider can be added later, but as of 2026-06-09 DeepSeek V4 Flash is the only provider wired in code.
- **Hosting:** Vercel for the Next.js app, Supabase for data.
- **Payments:** Stripe (deferred until tiers go live).

## Alternatives considered

- **Plain React (Vite) + a separate Express backend** — More flexible long-term, but doubles the deploy surface and gives up SSR for SEO. Rejected: SEO matters too much for the program/university pages, and one-app deployments are simpler for a first SaaS.
- **Firebase / Firestore** — Faster auth + storage onboarding, but document model fits poorly with deeply relational program/university/profile/review data. Rejected on schema fit.
- **MUI / Chakra UI** — Faster initial styling, but heavier runtime, harder to bend toward the design's bespoke illustrated look. shadcn/ui's "you own the components" model gives more design control without ecosystem lock-in.
- **Self-hosted Postgres on a VPS** — Cheaper at scale, but the user explicitly does not want infra ops. Rejected for MVP; possible later.

## Consequences

- **Positive:** Single codebase, one deploy target, strong TypeScript end-to-end, generous free tiers for MVP, easy to find contributors for any of these tools.
- **Negative:** Some lock-in to Vercel and Supabase patterns. React/Next is a moving target — App Router conventions still evolve.
- **Follow-ups:**
  - ADR 0002 — Supabase choice rationale.
  - ADR 0003 — AI provider abstraction.
  - Next.js scaffold in Phase 1.
