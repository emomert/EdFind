# 0002 — Database: Supabase Postgres

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** Beyza, Claude

## Context

EdFind's data is heavily relational: universities have programs, profiles match to programs, reviews tie to programs and (later) users, applications link users to programs, scholarships tie to countries and programs. We also need:
- Tier-gated reads (Free / Partner / Full Access) enforced as a hard backstop, not just in app code.
- Auth (eventually) for user accounts, saved results, application tracking.
- File storage for university logos and (later) document uploads in the application tracker.
- Fast time-to-first-feature for a solo first-time SaaS builder.

## Decision

Use **Supabase**: managed Postgres + Supabase Auth + Supabase Storage + Row-Level Security.

## Alternatives considered

- **Firebase / Firestore** — Faster onboarding, but document model fights deeply relational data. Cross-collection joins become app-side aggregation. Rejected.
- **PlanetScale / Neon (Postgres) + Auth.js + S3** — Best-of-breed each, but three integrations to wire up and maintain. Rejected for now; revisit if Supabase becomes a bottleneck.
- **Self-hosted Postgres on a VPS** — Cheapest at scale, but operational burden the user explicitly wants to avoid for MVP. Rejected.
- **Convex / other reactive DBs** — Compelling DX, but pulls feature code into provider-specific patterns; harder to migrate off later.

## Consequences

- **Positive:**
  - One vendor for DB, auth, and storage.
  - RLS lets us encode tier gating in the database itself — app bugs can't bypass it.
  - Generous free tier for MVP.
  - Postgres is portable. If we leave Supabase later, the data and most queries come with us; auth and RLS would need rework.
- **Negative:**
  - RLS is powerful but easy to misconfigure. Every new table needs a deliberate policy, not a default.
  - Some Supabase-specific idioms (`auth.uid()`, the JS client's `.from().select()`) leak into the codebase — we mitigate with `lib/supabase/server.ts` and `lib/supabase/client.ts` wrappers.
- **Follow-ups:**
  - In Phase 3, wire up the Supabase project, write the initial migration for `universities` / `programs` / `profiles` / `matches`, and verify RLS policies on each.
  - Document RLS policy patterns once we have the first non-trivial tier-gated read.
