# EdFind — Database & Documentation Audit (2026-06-09)

Follow-up to `docs/project-audit-2026-05-30.md`. This pass focused on the
**database** (10 migrations, RLS, live state) and the **documentation**, run as
a multi-agent audit: six independent dimensions (RLS, schema/tooling, live-DB
drift, app↔DB security boundary, docs, prior-audit follow-up) plus a
completeness gap-sweep, with every finding put through an adversarial verifier
before it was kept. 54 raw findings → 52 confirmed, 2 refuted; deduplicated to
the distinct issues below.

## Verdict

The schema and RLS are **mostly sound**. The real problems cluster in three
places: (1) a handful of latent RLS / entitlement gaps that become exploitable
the moment billing ships, (2) one migration-tooling weakness, and (3)
significant **documentation drift** — the repo's own #1 rule ("all MD docs are
load-bearing; stale docs are worse than missing docs") is violated on the
foundational schema and architecture docs.

Headline: **every P0 and P1 item from the 2026-05-30 audit was still open** as
of this audit — the only three commits since were new features (brand logo,
welcome tour, university email verification).

**Live-DB ground truth (read-only, confirmed):** 58 universities / **196
programs**. The "197" and "99" figures elsewhere are drift. `application_tasks`,
`applications`, `saved_programs`, the `user_id` columns, and the owner-scoped
RLS are all live.

## Confirmed findings

Severity reflects the adversarial verifier's adjustment. "Fixed 2026-06-09"
marks items resolved in this session.

### Security / data integrity

| # | Sev | Issue | Status |
|---|-----|-------|--------|
| S1 | High | `profiles_anon_insert` RLS policy is `with check (true)` — anyone with the publishable anon key can INSERT arbitrary `profiles` rows incl. `tier='full'`. (Flagged independently by 2 dimensions + the 2026-05-30 audit.) | **Fixed 2026-06-09** — dropped in `20260609120000_audit_hardening.sql` |
| S2 | High | `profiles.tier` (future billing column) is client-writable: `profiles_owner_update` has no column restriction, so an authed user could self-grant `tier='full'` once tier-gated reads exist. | **Mitigated 2026-06-09** — `guard_profiles_tier()` trigger lets only `service_role` write `tier` (a column REVOKE would be a no-op under Supabase's table-level grant); long-term plan in ADR 0005 |
| S3 | High | No rate limiting / quota on the AI matcher (`/quiz`, `/search` → `persistAndMatch`). One free account can loop to burn DeepSeek credit; each `/search` is 2 calls over the full catalog. | Open — see ADR 0006 (plan) |
| S4 | High | No account-deletion / self-service erasure path. Audience is students in Turkey (KVKK) applying to Europe (GDPR); both grant a right to erasure currently unmet. | Open — see plan below |
| S5 | Medium | `reset_user_progress` deleted unattached anon rows for **any** caller-supplied `client_id` (no ownership tie). | **Fixed 2026-06-09** — anon sweep now intersected with the caller's own client_ids |
| S6 | Medium | `application_tasks` RLS let a user attach a task to another user's application (ownership checked only in JS — violates the "no JS-only gating" rule). | **Fixed 2026-06-09** — INSERT/UPDATE `with check` now verifies application ownership |
| S7 | Low | Community gating is cookie-only in production; an unauthenticated Server Action (`toggleSubscriptionAction`) flips the subscriber tier, and the "Demo: subscribed" dev toggle ships to prod with no env guard. | Open — UX batch |
| S8 | Low | CSP allows `'unsafe-inline'` + `'unsafe-eval'` in `script-src`, neutering XSS protection. | Open |
| S9 | Low | `university-logos` Storage bucket has zero `storage.objects` RLS policies; write-protection rests solely on the service-role key staying server-side. | Open |

### Database schema & tooling

| # | Sev | Issue | Status |
|---|-----|-------|--------|
| T1 | High | `db-migrate.mjs` had no migration-tracking table and swallowed DDL-conflict errors at whole-file granularity — a partially-applied or edited migration could silently report success. | **Fixed 2026-06-09** — `schema_migrations` ledger with checksums; edited-applied migrations warn and are skipped |
| T2 | Medium | `check-db.mjs` asserted 99 programs while the live DB has 196 → the only health-check tool always failed (false alarm). | **Fixed 2026-06-09** — floored at `>=196` / `>=58` |
| T3 | Medium | `university-logos` bucket is created only by `scripts/ensure-logo-bucket.mjs`; `npm run db:migrate` on a fresh project never provisions it (un-versioned infra). | Open |
| T4 | Low | `set_updated_at()` had no fixed `search_path` (lone function without one). | **Fixed 2026-06-09** |
| T5 | Low | `add_applications` migration comment pointed the rollback file at `supabase/migrations/` (where it would auto-run) instead of `supabase/rollbacks/`. | **Fixed 2026-06-09** |
| T6 | Low | Seed has no constraint preventing duplicate university/program display names (only slug uniqueness). Acceptable for reference data; noted. | Open (accepted) |

### Documentation drift

| # | Sev | Issue | Status |
|---|-----|-------|--------|
| D1 | High | `docs/data-model.md` documented only 3 of 10 migrations; omitted `saved_programs`, `applications`, `application_tasks`, all `user_id` columns, both SECURITY DEFINER functions, and the owner-scoped RLS. Still described the superseded anonymous-cookie auth model and listed live tables as "future." | **Fixed 2026-06-09** — rewritten to match live schema |
| D2 | Medium | `docs/architecture.md` frozen at Phase 5: 7-question quiz, "placeholder Politecnico-only matcher," roadmap ending at MVP. | **Fixed 2026-06-09** |
| D3 | Medium | `profile-quiz.md` (and CLAUDE.md/AGENTS.md) said v2 / 9 questions / 10 destinations; code is `ANSWERS_VERSION=3`, 10 questions (incl. `additional_context` free-text), 18 destinations. | **Fixed 2026-06-09** |
| D4 | Medium | Phantom OpenAI "backup provider" documented as wired in 5 places (incl. an Accepted ADR); zero OpenAI code exists. | **Fixed 2026-06-09** — reworded to "abstraction exists, no fallback wired" |
| D5 | Low | Catalog size stated 4 ways (196/197/99 + seed header "11 unis/13 programs"). | **Fixed 2026-06-09** — standardised on 196 |
| D6 | Low | ADR index omits ADR-0004 (Resend); `.env.example` missing `NEXT_PUBLIC_ENABLE_COMMUNITY` / `AI_DISABLED` / `AI_TIMEOUT_MS` + wrong rollback path; `AGENTS.md` points memory at a broken `~/.Codex/` path; `persist-and-match.ts` comment claims cookie-authorised reads. | **Fixed 2026-06-09** |

### Product / UX (carried over from 2026-05-30, still open at audit time)

| # | Sev | Issue | Status |
|---|-----|-------|--------|
| U1 | Medium | `/community/upgrade` (the main conversion CTA) 404s in production. | UX batch |
| U2 | Medium | No `error.tsx` / `not-found.tsx` / `loading.tsx` boundaries anywhere under `app/`. | UX batch |
| U3 | Medium | Unsaving on `/shortlist` leaves the stale card on screen until manual reload. | UX batch |
| U4 | Medium | Catalog duration filter hardcodes 12/18/24 months and silently hides ~18 programs. | UX batch |
| U5 | Medium | Group-chat / command-palette modals lack Escape, focus trap, scroll lock (Radix Dialog never adopted). | Open |
| U6 | High | Next.js pinned to `16.2.5` with an unpatched middleware-bypass advisory (GHSA-26hh-7cqf-hhc6). | Needs `npm i` + redeploy — see plan |

## Refuted (checked, dropped)

- **`attach_anon_rows_to_user` "guaranteed data-loss on merge"** — the unique-index conflict scenario is unreachable in practice; no merge-time data loss.
- **`matches.score` missing CHECK (0–100)** — real but inconsequential; `numeric(5,2)` over-permissive range never causes a problem with server-written scores.

## What needs a decision (not auto-fixed)

1. **Entitlements model (S2)** — ADR 0005 proposes a separate service-role-only
   `entitlements` table rather than the user-writable `profiles.tier`. The
   defensive column REVOKE is already in place; the table lands with Stripe.
2. **Rate limiting (S3)** — ADR 0006 proposes a Postgres token-bucket keyed on
   `user_id` (no new service) + a DeepSeek spend alarm wired to `AI_DISABLED`.
3. **Next.js bump (U6)** — `npm i next@latest-16.2.x` + redeploy; needs a build
   run and a deploy the user controls.
4. **Modal accessibility (U5)** — adopting the shadcn/Radix Dialog primitive is
   a small refactor of two components; deferred to keep this batch focused.

## Method note

Findings were produced by 67 subagents across the dimensions above and
adversarially verified (each finding handed to an independent agent told to
refute it). Convergence across dimensions (e.g. `profiles_anon_insert` found by
both the RLS and follow-up agents) was treated as a high-confidence signal.
