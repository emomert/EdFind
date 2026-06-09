# 0005 — Store billing entitlements in a service-role-only table, not on `profiles.tier`

- **Status:** Proposed
- **Date:** 2026-06-09
- **Deciders:** Mert + Claude

## Context

`profiles.tier` (`free` | `partner` | `full`) has existed since the initial
schema as the intended billing-entitlement column. The 2026-06-09 audit found
that the owner-scoped RLS policy `profiles_owner_update` lets an authenticated
user update **any** column of their own profile row — including `tier` — via a
direct PostgREST call with the publishable anon key. Today nothing reads
`profiles.tier` for gating (the server always writes `'free'`), so there is no
live exploit. But `lib/community/subscription.ts` explicitly plans to read
entitlements from this column once Stripe lands (`profiles.tier IN ('partner',
'full')`). The moment that happens, the schema as written is a one-call
self-upgrade to the paid tier — exactly the "tier check must live in the
database, not just app code" rule from CLAUDE.md, inverted.

An immediate defense was applied in `20260609120000_audit_hardening.sql`: the
`guard_profiles_tier()` BEFORE trigger lets only the `service_role` write
`tier` (other roles' inserts are forced to `'free'`, updates keep the old
value). A column-level `REVOKE` was considered but is unreliable — Supabase
grants table-level `UPDATE` to `authenticated`, which overrides a column-level
revoke. This ADR records the durable plan.

## Decision

When billing ships, store the paid entitlement in a **separate, service-role-only
`entitlements` table** keyed by `user_id`, written exclusively by the Stripe
webhook handler. Application and RLS gating read entitlement state from there
(or from a `SECURITY DEFINER` helper like `has_paid_entitlement()`, mirroring
`is_university_verified()`), never from a user-writable column. `profiles.tier`
is retired as an entitlement source (kept, if at all, only as a denormalized
read cache the client cannot write).

## Alternatives considered

- **Keep `tier` on `profiles`, rely on the column REVOKE alone** — works, but
  co-locating a security-critical entitlement with user-writable profile data
  is fragile: any future broadening of the profiles update policy, or a
  `GRANT` that re-adds the column, silently re-opens the hole. Rejected as the
  primary model; the REVOKE stays as belt-and-suspenders.
- **Trigger that rejects non-service-role `tier` changes** — effective but adds
  a stateful guard to a hot table and still leaves entitlement data on a
  user-owned row. Rejected in favor of separation.

## Consequences

- **Positive:** entitlement writes have exactly one path (the Stripe webhook,
  service-role); RLS gating reads from a table users cannot write; satisfies the
  "database is the source of truth for tier gating" rule structurally.
- **Negative:** one extra table and a join/helper on read; a small migration of
  any `tier` semantics when Stripe lands.
- **Follow-ups:** create `entitlements` + `has_paid_entitlement()` in the Stripe
  migration; point `lib/community/subscription.ts` and any Partner/Full Access
  read gating at it; decide `profiles.tier`'s fate (drop vs read-cache).
