# 0006 — Rate-limit the AI matcher with a Postgres token bucket

- **Status:** Proposed
- **Date:** 2026-06-09
- **Deciders:** Mert + Claude

## Context

`/quiz` and `/search` both call `lib/server/persist-and-match.ts`, which runs
one or two DeepSeek calls per request (search adds a query-parse call), each
shipping the full ~196-program catalog as prompt context. The 2026-06-09 audit
found there is **no per-user or per-IP quota** anywhere on this path. Google
sign-in is free and self-service, so a single signed-in account can script the
Server Actions in a loop to drive DeepSeek spend and grow `profiles`/`matches`
rows without bound. The existing `AI_DISABLED` kill switch is global and manual
— there is no automatic backstop tied to spend.

Constraint (CLAUDE.md): don't introduce a new tool/service without an ADR. We
want a limiter that needs no new infrastructure.

## Decision

Add a **Postgres-backed token bucket** keyed on `user_id` (and secondarily on a
hashed IP), checked inside `persistAndMatch` **before** the DeepSeek call. A
small `ai_rate_limits` table (or an atomic `SECURITY DEFINER` function that
increments-and-checks in one statement) enforces a coarse cap — e.g. N matches
per minute and a daily ceiling per user. On limit exceeded, the action returns
a friendly "you're going a bit fast" result; the limiter **fails open on its own
errors** (a limiter outage must not take down matching). Separately, wire a
DeepSeek monthly-spend alarm that flips `AI_DISABLED` when a budget threshold is
crossed.

## Alternatives considered

- **Upstash / Redis token bucket** — the canonical serverless rate-limit
  stack, but it's a new third-party service and account for a limiter we can
  express in the database we already run. Rejected for now (revisit if Postgres
  contention becomes an issue).
- **Vercel WAF / edge rate limiting** — limits by IP at the edge, but can't see
  `user_id` and doesn't bound DB row growth per account. Useful as an *added*
  layer later, not the primary control.
- **Do nothing / rely on `AI_DISABLED`** — global manual switch only; no
  per-user fairness and no automatic spend backstop. Rejected.

## Consequences

- **Positive:** bounded per-user AI spend and row growth; no new service; the
  limit lives next to the data and can be RLS-enforced; an automatic spend
  alarm complements the manual kill switch.
- **Negative:** a read-modify-write on the hot path (kept to one atomic
  statement); cap tuning needed so it never blocks legitimate use.
- **Follow-ups:** migration for `ai_rate_limits` + the atomic check function;
  wire it into `persistAndMatch`; add the DeepSeek spend alarm → `AI_DISABLED`.
