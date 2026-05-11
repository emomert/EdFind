# Phase 9 — implementation plan

> **Status:** implemented 2026-05-11 (all four sub-phases). Pending: apply the 3 new migrations in Supabase, configure Google OAuth in Supabase Auth + Google Cloud Console.
>
> Open-question answers chosen during implementation:
>   1. Reset scope → wipe everything for the current user (applications + saved_programs + profiles + matches; cookie stays).
>   2. Search URL → reuses `/results/[matchId]` (free-text searches land on the same results page as the quiz).
>   3. Auth → **required**. All functional routes gate behind `/login`.

Phase 9 adds four features on top of the post-Phase-8 product:

1. **Free-text AI search** — fix the broken `/search` link
2. **Shortlist + compare** — save programs, view side-by-side
3. **Application tracker** — designed as a removable module
4. **Google auth + cross-device persistence** — sign in to keep your matches across devices

## Sequencing

Auth is the riskiest piece (OAuth setup, schema migration, RLS rewrite). The other three features all run on the existing anonymous cookie identity (`edfind_client_id`), so we ship and test them first, then add auth as the final layer that migrates everything to real user accounts.

This means each phase is independently shippable; redirecting after Phase 9.2 wastes no work.

| Phase | Effort | Ships |
|---|---|---|
| 9.1 — Free-text search | ~4h | broken `/search` button works |
| 9.2 — Shortlist + compare | ~1d | save + compare flow live |
| 9.3 — Application tracker (removable) | ~1d | tracker live, reset button works |
| 9.4 — Google auth + migration | ~1.5d | sign-in works, anonymous data migrates to user accounts |
| **Total** | **~3.5-4 days** | |

## Open questions to resolve before implementation starts

These three decisions should be made by the user before the agent starts implementing. Defaults below are the agent's lean.

1. **Reset scope** — when the "Reset all my progress" button on the application tracker is clicked, does it:
   - (a) Just reset all applications back to `interested` status, OR
   - (b) Delete everything for this client_id (applications, saved programs, profiles, matches) — true clean slate.
   - **Default lean:** (b). User said "go back to the first stage" which implies a true reset.
2. **Search results URL** — free-text searches:
   - (a) Reuse `/results/[matchId]` (same data shape as quiz matches), OR
   - (b) Get a separate `/search/[searchId]` namespace.
   - **Default lean:** (a) reuse. No reason to fork the URL since the data shape is identical.
3. **Auth required or optional?**
   - (a) Optional — "anonymous first, sign in to keep" pattern (Linear/Cal.com style), OR
   - (b) Required — gate the quiz behind login.
   - **Default lean:** (a) optional. The anonymous-no-signup model is currently a strength.

---

## Phase 9.1 — Free-text AI search

**Goal:** the `/search` button on the home page works. User types a free-text query, the AI parses it into a structured profile, the matcher runs, redirect to `/results/[matchId]`.

### Files

| File | Purpose |
|---|---|
| `app/search/page.tsx` | Search box (client component for the input) + results landing |
| `app/search/actions.ts` | `searchByText(query: string)` Server Action |
| `lib/ai/parse-query.ts` | DeepSeek call that turns free text into the `ValidatedAnswers` shape from `lib/quiz/schema.ts` |

### Flow

1. User types query (e.g. "management masters in Italy under €5k for a 2-year-experience grad") and submits.
2. `searchByText` calls `parseFreeTextToProfile(query)` which returns a Zod-validated `ValidatedAnswers` (same shape the quiz produces).
3. From there, the rest is identical to `submitProfile`: persist profile, run `matchProgramsToProfile`, insert top 3 matches, redirect to `/results/[topMatchId]`.

### Notes

- Reuse `matchProgramsToProfile` from `lib/ai/index.ts`. Don't fork the matcher.
- For ambiguous queries (missing fields), the parser should infer sensible defaults (e.g. destination=`["ANY"]` if no country mentioned, `english_level="upper-intermediate"` etc.) rather than fail. Mark inferred fields somehow if we want to show the user "we filled these in for you".
- Optional UX win: render the parsed profile as editable chips before submitting to the matcher, so users can correct misinterpretation. Skip this for v1; add if user testing demands it.

---

## Phase 9.2 — Shortlist + compare

**Goal:** save programs, view all saves at `/shortlist`, compare 2-3 side-by-side.

### Schema

One migration: `supabase/migrations/20260509_add_saved_programs.sql`.

```sql
create table public.saved_programs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,            -- cookie-based for now; user_id added in 9.4
  program_id uuid not null references public.programs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, program_id)
);

create index saved_programs_client_id_idx on public.saved_programs (client_id);

alter table public.saved_programs enable row level security;
-- No client policies — service-role only for MVP, same pattern as profiles/matches.
```

### Files

| File | Purpose |
|---|---|
| `app/shortlist/page.tsx` | Grid of saved programs |
| `app/shortlist/actions.ts` | `toggleSavedProgram(programId)`, `listSavedPrograms()` |
| `app/compare/page.tsx` | Side-by-side compare view (reads `?ids=a,b,c` from query string) |
| `components/shortlist/save-button.tsx` | Heart/bookmark client component, optimistic toggle, used wherever a program is shown |

### Where the save button appears

- `components/results/match-card.tsx` — both `HeroMatchCard` and `SiblingMatchCard`
- `app/programs/[universitySlug]/[programSlug]/page.tsx` — primary CTA next to "Apply on university site"
- `app/universities/[slug]/page.tsx` — on each program card in the programs grid

### Compare

- On `/shortlist`, checkboxes on each saved program
- "Compare selected" button enabled when 2-3 selected
- `/compare?ids=a,b,c` renders a side-by-side table: tuition, duration, language, deadline, QS world rank, QS subject rank, English requirements, application documents
- Hard cap at 3 (mobile UX gets noisy beyond that)

---

## Phase 9.3 — Application tracker (removable)

**Goal:** track per-program application status with a kanban view; reset-to-zero button for continuous testing. Module is **isolated** so it can be removed cleanly.

### Removability discipline

The user explicitly asked for this to be removable later. Design rules:

- **One migration:** `20260509_add_applications.sql` (paired rollback `20260509_drop_applications.sql` written at the same time and kept in repo)
- **One route folder:** `app/applications/`
- **One components folder:** `components/applications/`
- **One server actions file:** `app/applications/actions.ts`
- **Zero imports** from non-applications code into the tracker. The matcher, shortlist, results, and detail pages must not import from any of the above.
- **Two opt-in entry points,** both wrapped in a single feature flag (e.g. `NEXT_PUBLIC_ENABLE_APPLICATIONS=true`):
  1. A "Applications" link in `site-header.tsx` (only rendered when flag set)
  2. A single "Track this application" button on the program detail page (only rendered when flag set)

**To remove the feature later:** delete the 4 folders/files above + run the rollback migration + remove the feature flag + remove the two header/detail-page guards. No grep-and-fix elsewhere.

### Schema

One migration: `supabase/migrations/20260509_add_applications.sql`.

```sql
create type application_status as enum (
  'interested', 'drafting', 'submitted', 'accepted', 'rejected', 'waitlisted', 'withdrawn'
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,            -- cookie-based for now; user_id added in 9.4
  program_id uuid not null references public.programs(id) on delete cascade,
  status application_status not null default 'interested',
  notes text,
  deadline_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, program_id)
);

create index applications_client_id_idx on public.applications (client_id);

alter table public.applications enable row level security;
-- Service-role only. Future: user policies in 9.4.
```

Rollback migration `20260509_drop_applications.sql`:

```sql
drop table if exists public.applications;
drop type if exists application_status;
```

### Files

| File | Purpose |
|---|---|
| `app/applications/page.tsx` | Kanban-style board (Interested / Drafting / Submitted / Decision) |
| `app/applications/actions.ts` | `setStatus`, `addNote`, `setDeadline`, `resetAllProgress` |
| `components/applications/status-pill.tsx` | Status chip with color coding |
| `components/applications/kanban-column.tsx` | One column of the board |
| `components/applications/application-card.tsx` | Per-program card with quick actions |

### Reset button

- Located on `/applications` page in a "Testing tools" footer
- Confirms before destroying anything
- Scope: per the open question above. Default lean is **delete everything for this client_id** (applications, saved programs, profiles, matches) for a true clean slate. Implement as a single transactional server action.

---

## Phase 9.4 — Google auth + cross-device persistence

**Goal:** sign in with Google; all your existing matches, shortlist, and applications follow you across devices.

### Setup work (user-side, before the agent can start implementation)

- Supabase dashboard → Authentication → Providers → enable **Google**
- Create OAuth credentials in Google Cloud Console:
  - Authorized redirect URI: `https://fhmuvdogaeeptnnmlfzh.supabase.co/auth/v1/callback`
  - Application type: Web application
- Paste the OAuth client ID and client secret into Supabase Authentication → Google provider
- Optional but recommended: configure consent screen (app name "EdFind", logo, privacy policy URL — even a placeholder)

### Schema

One migration: `supabase/migrations/20260509_add_user_id_columns.sql`.

- Add nullable `user_id uuid references auth.users(id)` to `profiles`, `matches`, `saved_programs`, `applications`
- Add real RLS policies: users can read/write their own rows where `user_id = auth.uid()` OR (for unattached anonymous rows) `client_id` matches the cookie. Service role still bypasses.
- Indexes on each new `user_id` column

### Flow on first sign-in

1. User clicks "Sign in with Google" → OAuth dance via Supabase → Supabase issues a session
2. On post-login callback (`app/auth/callback/route.ts`), run a server action that finds all rows with the cookie's `client_id` AND null `user_id`, and sets `user_id = auth.uid()` on them
3. Future sessions: queries read by `user_id || client_id`, preferring `user_id`

### Files

| File | Purpose |
|---|---|
| `lib/supabase/auth.ts` | Auth helpers (get session, get user) |
| `app/auth/callback/route.ts` | OAuth callback handler — exchanges code for session, runs migration |
| `app/auth/migrate.ts` | The "attach all anonymous rows for this client_id to this user_id" function |
| `app/login/page.tsx` | Sign-in UI (Google button) |
| `components/site-header.tsx` | Updated: shows "Sign in" or "Your account" + avatar based on session |

### Updates needed in existing files

Every place that currently queries by `client_id` from the cookie needs to also accept `user_id` from the session, preferring `user_id`:

- `app/results/page.tsx` (Phase 8 stale-URL redirect)
- `app/results/[matchId]/page.tsx` (auth check + stale-URL redirect)
- `app/shortlist/page.tsx` (Phase 9.2)
- `app/shortlist/actions.ts` (Phase 9.2)
- `app/applications/page.tsx` (Phase 9.3)
- `app/applications/actions.ts` (Phase 9.3)
- `app/quiz/actions.ts` (`submitProfile` — set `user_id` on insert if session present)
- `app/search/actions.ts` (Phase 9.1 — same as `submitProfile`)

### Risks

- **The migration of anonymous data on first sign-in is the most error-prone part.** It must be idempotent (safe if the callback fires twice) and atomic (don't half-attach). Wrap in a transaction.
- **RLS policy rewrite is easy to miss a path.** Test matrix before shipping:
  - Logged-out + has cookie + has prior matches → can view
  - Logged-out + no cookie → can't view, redirected to /quiz
  - Logged-in + has prior anonymous matches with their cookie's client_id → can view (and migration attaches them)
  - Logged-in + no prior matches → fresh experience
  - Logged-in user A + tries to access logged-in user B's matchId → 404

---

## Out of scope for Phase 9

These came up but are deliberately deferred:

- **Turkish localization** — user said "not required for right now"
- **Stripe / tier billing** — depends on auth being live, then needs its own phase
- **Multi-step matcher chat** ("tell me more about TUM vs KIT") — speculative until user testing validates
- **Email reminders** for application deadlines — needs a job runner (Vercel cron or similar)
- **Persona-aware system prompts** in the matcher (career-switcher vs fresh-grad templates) — wait until we see if rationale length / quality is an actual user complaint

## Files this plan touches

For quick estimation:

```
docs/phase-9-plan.md                                      (this file, planning)

# Phase 9.1
app/search/page.tsx                                       NEW
app/search/actions.ts                                     NEW
lib/ai/parse-query.ts                                     NEW

# Phase 9.2
supabase/migrations/20260509_add_saved_programs.sql       NEW
app/shortlist/page.tsx                                    NEW
app/shortlist/actions.ts                                  NEW
app/compare/page.tsx                                      NEW
components/shortlist/save-button.tsx                      NEW
components/results/match-card.tsx                         MOD (add save button)
app/programs/[universitySlug]/[programSlug]/page.tsx      MOD
app/universities/[slug]/page.tsx                          MOD

# Phase 9.3
supabase/migrations/20260509_add_applications.sql         NEW
supabase/migrations/20260509_drop_applications.sql        NEW (rollback, kept in repo)
app/applications/page.tsx                                 NEW
app/applications/actions.ts                               NEW
components/applications/*.tsx                             NEW (3 files)
components/site-header.tsx                                MOD (flag-gated link)
.env.example, .env.local                                  MOD (NEXT_PUBLIC_ENABLE_APPLICATIONS)

# Phase 9.4
supabase/migrations/20260509_add_user_id_columns.sql      NEW
lib/supabase/auth.ts                                      NEW
app/auth/callback/route.ts                                NEW
app/auth/migrate.ts                                       NEW
app/login/page.tsx                                        NEW
components/site-header.tsx                                MOD (auth UI)
~8 existing files                                         MOD (add user_id || client_id resolution)
scripts/check-db.mjs                                      MOD (new tables in baseline)
CLAUDE.md, docs/data-model.md, docs/architecture.md       MOD
```
