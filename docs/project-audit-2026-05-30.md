# EdFind — Full Project Audit & Improvement Plan

**Date:** 2026-05-30 · **Branch:** `main` @ `96957cf` · **Method:** 40-agent multi-perspective audit (16 subsystem deep-dives + adversarial verification of every critical/high finding + product/tech/monetization strategy). Of 21 critical/high findings, **19 were confirmed and 2 partially-confirmed under adversarial review — 0 refuted.** Where verifiers judged a "high" overstated, the corrected severity is used below.

> Build health at audit time: `tsc --noEmit` ✅ clean · `eslint` ✅ clean (1 unused-var warning in a script). ~15,400 LOC of TS/TSX across 98 files, 9 migrations, 13 docs.

---

## 1. Verdict

**EdFind is a healthy, unusually well-engineered MVP that is not yet production-hardened, and is wide rather than deep.** The architecture, security instincts, type discipline, and AI integration are well above what you'd expect from a first-time SaaS builder. The gaps cluster in three places: **(a)** a handful of real shipping bugs and one genuine security misconfiguration, **(b)** operational maturity (no tests, no CI, no observability, no rate limiting), and **(c)** product depth — the data isn't decision-grade (most deadlines are expired), the funnel is walled behind required Google login, and the headline trust features (community, partner tier) are promises with nothing behind them yet.

### Scorecard

| Area | Rating |
|---|---|
| Architecture & Next.js patterns | 🟢 Good |
| AI matching & DeepSeek integration | 🟢 Good |
| Supabase schema, migrations & data model | 🟢 Good |
| Auth, sessions & RLS | 🟢 Good |
| Cross-cutting security | 🟢 Good |
| Profile quiz | 🟢 Good |
| Search / shortlist / compare | 🟢 Good |
| Application tracker | 🟢 Good |
| Catalog browse & header search | 🟢 Good |
| Code quality & TypeScript | 🟢 Good |
| Dependencies, build & performance | 🟢 Good |
| Community / Verified Insights | 🟡 Fair |
| Frontend UX & brand consistency | 🟡 Fair |
| Accessibility, SEO & i18n-readiness | 🟡 Fair |
| Documentation accuracy & agent-readiness | 🟡 Fair |
| **Testing, CI/CD & operational readiness** | 🔴 **Poor** |

---

## 2. What's genuinely strong (keep doing this)

- **Security posture is mature.** No secrets reach the browser (every privileged module is `import "server-only"`), every Server Action validates input with Zod, ownership is re-checked on every mutation (no IDOR found), open-redirect is correctly defended (rejects `//evil.com` and `/\evil.com`), `auth.getUser()` (not the spoofable `getSession()`) is used everywhere, and RLS exists as real defense-in-depth. No XSS sinks (`dangerouslySetInnerHTML` count: 0).
- **The AI layer is solid.** One `server-only` chokepoint with timeout + retry + kill switch; output is Zod-validated; hallucinated program IDs are filtered against the real catalog; the V4-Flash `thinking:{type:"disabled"}` gotcha is handled at both call sites. The matcher prompt is genuinely good — it does currency conversion, honors hard filters, quotes the student's own words, and is told to surface trade-offs.
- **Type discipline is excellent.** Strict mode on, build fails on type/lint errors, **zero `any`**, zero `@ts-ignore`, zero `TODO`/`FIXME`. Server Actions all return a typed `{ ok }` discriminated union.
- **Real architectural discipline.** `lib/server/persist-and-match.ts` is a genuinely shared backend for `/quiz` and `/search`; migrations are numbered with destructive drops kept out of the auto-apply path; feature flags `notFound()` disabled routes cleanly.
- **The docs *culture* is real** — every feature has a spec, 3 ADRs, a runbook. The problem is freshness, not absence.

---

## 3. Priority issues

### 🔴 P0 — Fix this week (real security / broken on the live site)

1. **Open RLS policy lets anyone write the `profiles` table.** `20260508120000_init_schema.sql:121` creates `profiles_anon_insert ... WITH CHECK (true)` and no later migration drops it. Because Postgres permissive policies are OR'd, the owner-scoped policies added later do **not** override it. Anyone holding the public anon key (shipped to every browser) can `INSERT` arbitrary `profiles` rows — any `user_id`, any `answers`, **any `tier`**. Today that's row-spam/data-pollution; the moment tier gating ships it becomes a direct self-grant of `tier='full'`.
   **Fix:** new migration → `drop policy "profiles_anon_insert" on public.profiles;`. Verified safe — the only insert path is service-role `persistAndMatch` (bypasses RLS); the three other files touching `profiles` only read.

2. **Next.js 16.2.5 has a HIGH-severity middleware-bypass advisory** (GHSA-26hh-7cqf-hhc6, CVSS 7.5). Your `middleware.ts` sets all the security headers (CSP, X-Frame-Options) and refreshes the session — a bypass skips them. (`requireUser()` on each page mitigates auth exposure, but the headers/session-refresh are weakened.)
   **Fix:** `npm i next@16.2.6 eslint-config-next@16.2.6` (patch, low-risk), re-run typecheck/lint, redeploy, re-run `npm audit`. Also clears a bundled `postcss` advisory. (A transitive moderate `ws` advisory will remain — `npm audit fix` separately.)

3. **The community "Upgrade" button 404s.** The two primary conversion CTAs in `upgrade-community-access-card.tsx` link to `/community/upgrade`, which doesn't exist. The single most important button in your monetized feature is dead on production.
   **Fix:** add a minimal `app/community/upgrade/page.tsx` (interim "billing coming soon" / waitlist page).

4. **The "Demo: free/subscribed" toggle ships to production with no env guard** (`community-client.tsx:345`). Any visitor can self-"subscribe." Cosmetic today (community is mock), but it's a visible "this is a mock" tell and a latent paywall bypass.
   **Fix:** render `<SubscriptionDevToggle />` only when a server-evaluated `VERCEL_ENV !== 'production'` (pass as a prop; don't read `process.env` in a client component).

5. **Users see raw country codes** — "Florence, IT" instead of "Florence, Italy" — on the home page, both detail pages, and compare (5 sites). The catalog and header search already map correctly via `COUNTRY_NAMES`.
   **Fix:** `{COUNTRY_NAMES[u.country] ?? u.country}` at the 5 render sites (ideally after extracting the map to `lib/`).

### 🟠 P1 — Fix this month (cost, correctness, robustness)

6. **No rate limiting on the AI endpoints.** Any signed-in user can loop `/quiz` and `/search` (each `/search` = 2 DeepSeek calls, each match ships the *entire* catalog). Real cost-DoS + unbounded `profiles`/`matches` row growth. *(Verifiers tempered "unbounded bill" — DeepSeek has account limits and a 25s timeout caps per-call cost — but the spend-over-time + DB-growth gap is real.)*
   **Fix:** a per-user (+per-IP) quota inside `persistAndMatch` before the DeepSeek call. A Postgres counter table needs no new service (and can be RLS-enforced); Upstash KV if you prefer latency — either way write a short ADR. Add a DeepSeek monthly spend alarm wired to the existing `AI_DISABLED` switch.

7. **Catalog duration filter silently hides ~18 programs.** `catalog-client.tsx` hardcodes only 12/18/24-month options with exact-match logic, but the catalog has 9/10/11/15/19/20-month programs. **Fix:** derive duration options from the data (the file already does this for country/field/language) or switch to range buckets.

8. **Unsaving on `/shortlist` leaves the card on screen** until manual reload (stale list). **Fix:** optimistic removal / `router.refresh()` after the toggle.

9. **No error / loading / not-found boundaries anywhere in `app/`.** Any Server Component throw or `notFound()` (10 call sites) drops to Next's unbranded default. **Fix:** add `app/not-found.tsx`, `app/error.tsx` (client, with `reset()`), `app/global-error.tsx`, and `loading.tsx` skeletons for `/catalog`, `/community`, `/applications`.

10. **Modals (Cmd+K search, group chat) have no focus trap or scroll lock**, and the chat modal has no Escape handler. **Fix:** adopt shadcn/Radix `Dialog` (gives trap + scroll-lock + Escape + focus-return for free) — which also addresses #14.

11. **Application tracking has a non-atomic check-then-insert** (`toggleTrackedApplication`) that can throw on the unique constraint, and the destructive **"Reset all progress" button ships to all production users** ungated. **Fix:** upsert/`ON CONFLICT`; gate or confirm-dialog the reset.

### 🟡 P2 — Important, not urgent (operational maturity & SEO)

12. **No automated tests and no CI** for a live app — the single biggest regression-risk multiplier. The riskiest code (auth-attach, per-user-row, RLS) is exactly what's needed 3 corrective migrations already. **Fix:** ~20-line GitHub Action running `typecheck + lint + build` on every PR; Vitest unit tests for the pure logic (`lib/quiz/schema.ts`, `lib/format/currency.ts`, `safe-redirect.ts`, the matcher's id-filter/sort); register smoke scripts + a one-command `npm run verify`.
13. **No observability.** 14 `console.error` sites vanish into ephemeral Vercel logs; DeepSeek returns `usage` tokens that production discards. **Fix:** Sentry (near-drop-in for Next 16) + log token usage/latency/`finish_reason` at the `callDeepSeek` chokepoint.
14. **No SEO infrastructure for a catalog-driven product:** no `sitemap.ts`, no `robots.ts`, no `metadataBase`, no Open Graph/Twitter cards, no app icons (only `favicon.ico`). Per-page `<title>`/description *do* exist. **Fix:** add `metadataBase` + `app/sitemap.ts` (from catalog slugs) + `app/robots.ts` + default OG image; later `generateStaticParams` + ISR on detail pages.
15. **Public pages are fully dynamic (no caching).** `/catalog`, home, and detail pages use the cookie-bound client → every visit re-queries Supabase. **Fix:** a cookie-less public Supabase client + `export const revalidate`. (One structural change that *also* unlocks SEO — high leverage.)
16. **`db-migrate.mjs` can silently skip migrations** — it swallows "already exists" errors at whole-file granularity with no ledger, so editing an applied multi-statement file makes the new statement never run while reporting success. **Fix:** add a `schema_migrations(filename, checksum)` ledger; make new policies `drop policy if exists` first. Adopt the Supabase CLI later.
17. **`check-db.mjs` hard-fails on a healthy DB** — pinned to `expect: 99` programs while the catalog is 196, yet README tells operators to run it to verify deploys. **Fix:** use a floor (`>= 196`), not an exact count.

### ⚪ P3 — Polish & consistency

- **Subscription paywall is a forgeable non-httpOnly cookie** with no server enforcement — fine for the mock, but add a guard so it can't silently become the real paywall (must move to `profiles.tier` + RLS before any real gated content).
- **~440 hardcoded palette classes across 31 files** bypass the design tokens (Community/Applications/Catalog) — real consistency debt, but scope the cleanup to *brand* colors only (status-pill etc. use a deliberate multi-hue scale with no token equivalents). Add an ESLint guard after.
- **shadcn/ui adopted but only `Button` generated** — every input/select/textarea/dialog is hand-rolled with divergent focus rings. Generate Input/Textarea/Dialog/Badge/Card.
- **~89 raw Framer Motion animations ignore `prefers-reduced-motion`** in Community/Applications (including infinite floats), despite a reduced-motion-safe motion vocabulary existing in `components/motion`.
- **i18n promise violated** by ~9 inline English pluralizations (`program{n===1?"":"s"}`) — won't translate to Turkish. Inter font loads only the `latin` subset (missing Turkish `İ/ş/ğ`). `localeCompare`/time formatting has no explicit `tr` locale.
- **Duplicated label maps** (`FIELD_LABELS`/`LANGUAGE_LABELS`) across 5–6 files have *already drifted* ("Architecture" vs "Architecture & Built Environment"). Extract to `lib/catalog/labels.ts`.
- **Teal `#0d9488` on white is ~3.48:1** — fails WCAG AA for small text; use teal-700 for small accent text.
- **Code cleanup:** generate Supabase types (kills ~20 `as unknown as` casts); extract the repeated Server-Action preamble into a `withAuthedAction` wrapper; delete leftover `create-next-app` SVGs in `public/`; fix the typo in a seeded review ("English-tasug").

### 📄 Documentation drift (the repo's #1 stated rule — currently not honored on the foundational docs)

- `docs/architecture.md` still describes a **7-question quiz + placeholder matcher + roadmap ending at Phase 5** — none of which is true.
- `docs/data-model.md` documents **only 2 of 9 migrations** and omits every post-MVP table, the `user_id` columns, the RLS policies, and the SECURITY DEFINER functions; still describes the superseded cookie-auth model.
- Quiz is `ANSWERS_VERSION = 3` with a 10th free-text question and 18 destinations; **all docs say v2 / 9 questions / 10 destinations.**
- **Catalog size stated 5 ways** — the true number is **58 universities / 196 programs**. `CLAUDE.md`/`AGENTS.md` are correct (196); README, `ai-matcher.md`, and `app/start/page.tsx` say 197 (off-by-one); seed.sql's own header still says "11 universities + 13 programs."
- **OpenAI "backup" is documented as wired in 4 places but no OpenAI code exists** (only `ai-matcher.md` is honest). ADR-0003 describes an abstraction shape that was never built.
- `AGENTS.md` has a broken `~/.Codex/...` memory path; `.env.example` omits `NEXT_PUBLIC_ENABLE_COMMUNITY`, `AI_DISABLED`, `AI_TIMEOUT_MS` and points to a non-existent migration path.

---

## 4. Improvement plan (sequenced)

### Phase A — "Stop the bleeding" (this week, ~1–2 days)
Drop the open RLS policy (#1) · bump Next.js (#2) · interim `/community/upgrade` page (#3) · gate the dev toggle (#4) · country-name display (#5) · duration filter (#7) · shortlist refresh (#8) · error/not-found/loading boundaries (#9). All low-risk, high-visibility.

### Phase B — "Safety net" (next 2–4 weeks)
GitHub Actions CI + Vitest on the money paths (#12) · Sentry + AI token logging (#13) · AI rate limiter + spend alarm (#6) · migration ledger + fix `check-db.mjs` (#16, #17) · reconcile the foundational docs (architecture, data-model, profile-quiz, catalog counts, OpenAI framing) · `npm run verify` one-command gate.

### Phase C — "Make it real" (this quarter)
**Data freshness (highest trust risk — see §5)** · public-client caching + SEO/sitemap/OG (#14, #15) · lower the onboarding wall (anonymous quiz + 1 results view before gating; add email magic-link) · **entitlement spine**: real per-user tier source + RLS + Stripe + the conversion moment at `/results`, *before* any pricing experiment.

### Phase D — "Depth & growth" (later)
Real community loop (persisted reviews/Q&A + verification + RLS gate, replacing the cookie/mock) · deadline-reminder retention loop (Vercel Cron + Resend) · Turkish localization (UI chrome → quiz → AI rationales) · visa/proof-of-funds/cost-of-living/scholarship content · partner pipeline (or hide the empty Partner tier) + the formal neutrality ADR.

---

## 5. How to make the *site* genuinely better (product & growth)

> The strategist ran a **live production audit**. The numbers below are real and reframe the priorities.

1. **Make the data decision-grade — this is the #1 trust risk.** As of 2026-05-30, **113 of 151 deadlines are already in the past** and **23% of programs have no deadline** — yet the matcher is explicitly instructed to *cite deadline dates* in its rationale. The AI is quoting expired/missing dates to students as if actionable. Tuition/requirements are actually in good shape; the gap is **freshness**. → Add deadline-freshness checks to `check-catalog-completeness.mjs` (treat a stale deadline as launch-blocking), re-source the 2026/27 cycle, store an explicit "rolling" marker, stamp every program with a visible "data last verified on" date, and stop the matcher from citing expired deadlines.

2. **Lower the onboarding wall.** Every functional surface is behind **required Google-only** login — a first-time visitor can't see a single AI match before committing, and there's no email option. With only ~22 real profiles in production, **friction is the bottleneck, not abuse** — and the anonymous-cookie + attach-on-login machinery to support "try first, sign in to save" *already exists*. → Allow an anonymous quiz + 1 results view; gate only persistence; add email magic-link; reframe the CTA to "Get matched in 2 minutes."

3. **Serve the Turkish-specific job-to-be-done.** "Will I get the visa, can I prove funds (e.g. Germany's Sperrkonto), can I afford to live there, what scholarships exist" is often the *deciding* question — and it appears in the repo **only as keyword hints inside the AI prompt and mock community text.** The catalog also skews toward expensive UK/finance options. → Add a per-country "Studying in X as a Turkish student" reference layer (visa/proof-of-funds/work-rights), show total cost of attendance (not just tuition), build the deferred scholarships surface (the quiz already asks `scholarship_need`), and diversify toward lower-cost German/Dutch/Nordic STEM. Plus Turkish localization and TRY alongside EUR.

4. **Close the trust/neutrality loop.** Two headline differentiators are promises without substance: `/community` ("Verified Student Insights") is 100% mock with a cookie paywall, and there are **0 partner universities** despite the entire `is_partner` schema, tier model, and the homepage's "we never silently boost partners" claim. → Ship a minimal *real* community loop (persisted + RLS + lightweight student verification) or hold it; stand up a real partner pipeline or temporarily hide the empty Partner tier; remove `university_is_partner` from the matcher's payload (it's fed in but unused — a latent neutrality risk) and write the deferred neutrality ADR with a test asserting identical scores for partner/non-partner.

5. **Add the retention loop.** The whole product is about deadlines, yet there's **no email/cron/notification infrastructure** — so it can never send "your TU Delft deadline is in 14 days," the single strongest reason this once-a-year audience returns. → Vercel Cron + Resend watching tracked-application/saved-program deadlines.

---

## 6. Notable strengths worth protecting

The matcher, the shared `persist-and-match` backend, the quiz UX/accessibility, the security instincts, and the type discipline are real assets — the plan above is mostly *filling in layers the architecture already anticipates*, not re-architecting. Don't gold-plate the matcher (per your own CLAUDE.md), and don't let the doc drift continue — the foundational docs are the one place the "agent-ready" promise is currently broken.
