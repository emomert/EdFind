# Data model

Postgres schema for EdFind. This document is the source of truth for the schema; it must stay in sync with the migrations under `supabase/migrations/`. **The matching update to this doc is part of the same change** as any migration.

## Conventions

- All tables use `id uuid primary key default gen_random_uuid()`.
- Timestamps: `created_at timestamptz not null default now()`, and where rows are mutable, `updated_at timestamptz not null default now()` maintained by the `set_updated_at()` trigger.
- Soft delete is **not** used by default. Hard-delete unless a feature requires history.
- All tables have **RLS enabled**. No table is exposed without explicit policies; tables with no policies are service-role-only.
- Money is stored as `numeric(10,2)` with a separate `currency text not null default 'EUR'` column. Never store money as float.
- Free-text user content is stored verbatim and trimmed but not transformed.

## Auth & ownership model (current)

Authentication is **required** for the personalized surfaces (Phase 9.4, Google OAuth). The ownership model on per-user tables is:

- Every per-user table carries both `client_id uuid` (the anonymous localStorage identity that predates auth) **and** a nullable `user_id uuid references auth.users(id) on delete cascade`.
- Authenticated reads/writes are scoped by `user_id = auth.uid()` — enforced in **both** app code (Server Actions filter explicitly) **and** RLS owner-scoped policies (added in `20260516140000`).
- On first sign-in, `app/auth/callback/route.ts` calls `attach_anon_rows_to_user(client_id, user_id)`, which attaches any rows that still have `user_id IS NULL` and a matching cookie `client_id`.
- All writes currently route through Server Actions using the **service-role** client (bypasses RLS); the owner-scoped policies are defense-in-depth so a future direct-client read path fails closed, not open.

## Reference data

### `universities`

Reference data describing each institution.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique not null | URL-safe identifier, e.g. `politecnico-di-milano` |
| `name` | text not null | |
| `country` | text not null | ISO-3166 alpha-2 (`IT`, `NL`, …) |
| `city` | text not null | |
| `institution_type` | text | `public` / `private` / etc. |
| `website` | text | |
| `description` | text | Long-form overview |
| `established_year` | int | |
| `student_count` | int | Approximate, optional |
| `logo_url` | text | Stored in Supabase Storage (`university-logos` bucket) |
| `hero_image_url` | text | Real licensed campus photo (Wikimedia/CC); shown as a hero banner |
| `hero_image_credit` | text | Attribution string, e.g. "Photo: X / Wikimedia, CC BY-SA 4.0" (`20260610120000`) |
| `hero_image_source_url` | text | Link to the image's source / licensing page (`20260610120000`) |
| `is_partner` | boolean not null default false | True for Partner Universities tier |
| `qs_world_rank` | int | Nullable. Most recent QS World University Ranking known. |
| `created_at` / `updated_at` | timestamptz | trigger-maintained |

**RLS:** `universities_public_read` (select using `true`); write = service-role only (no write policy).

### `programs`

A specific master's program offered by a university.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `university_id` | uuid FK → `universities.id` not null, `on delete cascade` | |
| `slug` | text not null | Unique within `university_id` |
| `name` | text not null | e.g. `MSc in Management Engineering` |
| `degree` | text not null | `MSc` / `MA` / `MBA` / etc. |
| `field_of_study` | text not null | Coarse taxonomy bucket (see below) |
| `language` | text not null | ISO-639-1 (`en`, `it`, …) |
| `duration_months` | int not null | |
| `tuition_per_year` | numeric(10,2) | Nullable if unknown |
| `currency` | text not null default 'EUR' | |
| `application_deadline` | date | Most recent known cycle |
| `start_month` | text | e.g. `September` |
| `description` | text | |
| `requirements` | jsonb | Structured: GPA, language tests, prereq subjects, docs |
| `curriculum_url` | text | |
| `qs_subject_rank` | int | Nullable. Rank within `qs_subject_area`. |
| `qs_subject_area` | text | Nullable. Free-text label, e.g. `Computer Science & Information Systems`. Doesn't map 1:1 to `field_of_study`. |
| `created_at` / `updated_at` | timestamptz | trigger-maintained |

`UNIQUE (university_id, slug)`. Indexes on `university_id`, `field_of_study`, and a partial index on `qs_subject_rank` (where not null).

**RLS:** `programs_public_read` (select using `true`). Read is public today; tier-gated reads arrive with the Partner / Full Access tiers (enforced in RLS at that point, never app-only).

## Per-user data

### `profiles`

A single submitted quiz response (or free-text `/search` query parsed into the same shape).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `client_id` | uuid not null | Anonymous localStorage identity (indexed) |
| `user_id` | uuid FK → `auth.users.id`, nullable, `on delete cascade` | Set on first sign-in via `attach_anon_rows_to_user` (indexed) |
| `answers` | jsonb not null | Raw quiz answers, schema-versioned (`ANSWERS_VERSION`, currently **5**). `field_of_study` is now AI-inferred and nullable; see `docs/features/profile-quiz.md` for the v5 shape. |
| `answers_version` | int not null | Bumps when the quiz schema changes |
| `tier` | text not null default 'free' | `check (tier in ('free','partner','full'))`. **Client write revoked** (see RLS). |
| `created_at` | timestamptz | |

**RLS:**
- `profiles_owner_select` — authenticated, `user_id = auth.uid()`.
- `profiles_owner_insert` / `profiles_owner_update` / `profiles_owner_delete` — authenticated, owner-scoped.
- `tier` is pinned by the `guard_profiles_tier()` BEFORE trigger (`20260609120000`): only the `service_role` may set it; any other role's INSERT is forced to `'free'` and its UPDATE keeps the existing value — so entitlements can't be self-granted via PostgREST. (Server always writes `'free'` today.)
- Pre-auth rows (`user_id IS NULL`) are written/read via the service-role client.

### `matches`

The output of a matching run for one profile (DeepSeek V4 Flash; top-3 ranked).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → `profiles.id` not null, `on delete cascade` | |
| `program_id` | uuid FK → `programs.id` not null, `on delete cascade` | |
| `user_id` | uuid FK → `auth.users.id`, nullable, `on delete cascade` | |
| `score` | numeric(5,2) | 0–100 (enforced in app code, not a DB CHECK) |
| `rationale` | text | AI-generated explanation |
| `created_at` | timestamptz | |

**RLS:** `matches_owner_select` — authenticated, `user_id = auth.uid()`. Writes are service-role only (matches are produced by the matcher pipeline).

### `saved_programs` (shortlist) — **deprecated 2026-06-09**

> **Superseded by `applications`.** The shortlist was merged into the tracker:
> "saving" a program now creates an `applications` row at status `'interested'`,
> and `/shortlist` is the `'interested'` view of the tracker. App code no longer
> reads or writes this table; existing rows were backfilled into `applications`
> by `20260609130000`. The table is kept (still referenced by the
> `attach_anon_rows_to_user` / `reset_user_progress` functions) and will be
> dropped in a follow-up cleanup once the merge is verified in production.

Per-user bookmarked programs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `client_id` | uuid not null | indexed |
| `user_id` | uuid FK → `auth.users.id`, nullable, `on delete cascade` | indexed |
| `program_id` | uuid FK → `programs.id` not null, `on delete cascade` | indexed |
| `created_at` | timestamptz | |

`UNIQUE (client_id, program_id)` and a **partial** `UNIQUE (user_id, program_id) WHERE user_id IS NOT NULL` (dedup migration `20260516130000`).

**RLS:** owner-scoped select/insert/delete (authenticated, `user_id = auth.uid()`).

### `applications` (tracker)

Per-user, per-program application tracker rows. Part of the removable applications module (uninstall: `supabase/rollbacks/20260511130000_drop_applications.sql`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `client_id` | uuid not null | indexed |
| `user_id` | uuid FK → `auth.users.id`, nullable, `on delete cascade` | indexed |
| `program_id` | uuid FK → `programs.id` not null, `on delete cascade` | indexed |
| `status` | `application_status` enum not null default `'interested'` | |
| `notes` | text | |
| `deadline_at` | date | |
| `created_at` / `updated_at` | timestamptz | trigger-maintained |

`application_status` enum: `interested`, `drafting`, `submitted`, `accepted`, `rejected`, `waitlisted`, `withdrawn`.
`UNIQUE (client_id, program_id)` + partial `UNIQUE (user_id, program_id) WHERE user_id IS NOT NULL`.

**RLS:** owner-scoped select/insert/update/delete (authenticated, `user_id = auth.uid()`).

### `application_tasks` (task kanban)

A user owns a set of tasks; each may optionally link to a tracked application. Uninstall: `supabase/uninstall/drop_application_tasks.sql` (kept outside `migrations/` so it doesn't auto-run).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → `auth.users.id` **not null**, `on delete cascade` | indexed |
| `application_id` | uuid FK → `applications.id`, nullable, `on delete cascade` | indexed |
| `title` | text not null | |
| `category` | `task_category` enum not null default `'other'` | |
| `status` | `task_status` enum not null default `'todo'` | |
| `due_at` | date | |
| `sort_order` | int not null default 0 | stable ordering within a column |
| `created_at` / `updated_at` | timestamptz | trigger-maintained |

`task_status` enum: `todo`, `doing`, `done`. `task_category` enum: `documents`, `language_test`, `writing`, `finance`, `admin`, `other`.

**RLS:** owner-scoped (authenticated, `user_id = auth.uid()`). INSERT/UPDATE additionally verify that any linked `application_id` is owned by the same user (`20260609120000`) — so a foreign application UUID can't be attached via direct PostgREST.

## Verification (community write-gating)

### `university_email_verifications` (2026-06-05)

University email linking — see `docs/features/university-verification.md` and ADR 0004.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → `auth.users.id` not null, `on delete cascade` | |
| `email` | text not null | stored lower-cased |
| `domain` | text not null | for badges/analytics |
| `token_hash` | text not null | SHA-256 hex of the one-time confirm token; raw token only exists in the email link |
| `status` | text not null default 'pending' | `check (status in ('pending','verified'))` |
| `created_at` / `updated_at` | timestamptz | trigger-maintained |
| `expires_at` | timestamptz not null | 24 h after request |
| `verified_at` | timestamptz | null until confirmed |

Partial unique indexes: one `verified` row per `user_id`; one account per `lower(email)` (verified); **one `pending` row per `user_id`**; unique `token_hash`.

**RLS:** `university_email_verifications_select_own` (`auth.uid() = user_id`); **no client write policies** — all writes via service-role.

### `verification_email_sends` (2026-06-05)

Append-only audit of confirmation emails actually sent — backs the per-recipient send rate limit.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email_lower` | text not null | recipient, lower-cased |
| `sent_at` | timestamptz not null | default now() |

Index on `(email_lower, sent_at)`. **RLS:** enabled, **no policies** — service-role only.

## Housing (2026-06-09)

City- and university-level student-housing info — see `docs/features/housing.md`.
AI-researched, with `sources` + a `researched_on` date and a `status` so figures
are reviewable and clearly dated. **Public reads see `status='published'` only**;
writes are service-role only. Money is `numeric(10,2)` ranges in the local
`currency`.

### `housing_cities`

Keyed by `(city, country)` (shared across universities in the same city).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `city` / `country` | text not null | `country` ISO-2, matches `universities.country`; `unique (city, country)` |
| `rent_room_min/max`, `rent_studio_min/max`, `rent_shared_min/max` | numeric(10,2) | monthly rent ranges |
| `currency` | text not null default 'EUR' | local currency (GBP/CHF/EUR…) |
| `monthly_living_min/max` | numeric(10,2) | living costs excluding rent |
| `student_neighborhoods` | jsonb | `[{name, note}]` |
| `how_to_find` | jsonb | `[{name, url}]` |
| `deposit_norms` / `tips` | text | |
| `sources` | jsonb | `[{title, url}]` |
| `researched_on` | date | |
| `status` | text not null default 'draft' | `check (status in ('draft','published'))` |
| `created_at` / `updated_at` | timestamptz | trigger-maintained |

**RLS:** `housing_cities_public_read` (select where `status='published'`); writes service-role only.

### `housing_universities`

Keyed by `university_id` (`unique`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `university_id` | uuid FK → `universities.id` not null, cascade, unique | |
| `has_dorms` | boolean | |
| `dorm_note` / `housing_office_url` / `commute_note` / `tips` | text | |
| `on_campus_monthly_min/max`, `near_campus_monthly_min/max` | numeric(10,2) | monthly ranges |
| `currency` | text not null default 'EUR' | |
| `sources` | jsonb | `[{title, url}]` |
| `researched_on` | date | |
| `status` | text not null default 'draft' | `check (status in ('draft','published'))` |
| `created_at` / `updated_at` | timestamptz | trigger-maintained |

**RLS:** `housing_universities_public_read` (select where `status='published'`); writes service-role only.

## SECURITY DEFINER functions

All run as table owner (bypass RLS) with `set search_path = public`. Callers must verify the session server-side first; these helpers do not re-authenticate. Execute is revoked from `anon`/`authenticated` unless noted.

- **`set_updated_at()`** — `BEFORE UPDATE` trigger; sets `updated_at = now()`. Pinned `search_path = ''` (`20260609120000`).
- **`guard_profiles_tier()`** — `BEFORE INSERT OR UPDATE` trigger on `profiles`; lets only `service_role` write `tier`, otherwise pins it (insert → `'free'`, update → unchanged). Defense-in-depth for the billing column (`20260609120000`).
- **`attach_anon_rows_to_user(p_client_id uuid, p_user_id uuid)`** — first-sign-in migration; attaches `user_id IS NULL` rows matching the cookie `client_id` across profiles/saved_programs/applications/matches.
- **`reset_user_progress(p_user_id uuid, p_client_ids uuid[])`** — destructive "Reset all progress". Deletes all rows owned by `p_user_id`; the anon-orphan sweep is **intersected with the caller's own historical client_ids** (`20260609120000`) so a foreign `client_id` can't be used to delete another visitor's unclaimed data.
- **`is_university_verified()`** (no-arg) — returns whether the current `auth.uid()` is verified. Granted to `authenticated`, `service_role`. **Future community-content tables MUST call this in their INSERT policies** so write-gating is enforced in the database, not just app code.
- **`is_university_verified(uid uuid)`** — server-only overload; NOT granted to `authenticated` (would let a user probe arbitrary accounts).

## Field-of-study taxonomy

Stored as a string for simplicity; promote to a `fields_of_study` table if it grows.

```
business_management
engineering
computer_science_ai
design
architecture_built_environment
economics_finance
data_science
social_sciences
```

## Storage

- Bucket **`university-logos`** (public read, 2 MB limit, image MIME allowlist) — currently created by `scripts/ensure-logo-bucket.mjs` (SDK-only), **not** a migration. Known gap (audit 2026-06-09 T3): `npm run db:migrate` on a fresh project does not provision it, and there are no `storage.objects` write policies (write protection rests on the service-role key staying server-side). To be versioned in a future migration.

## Not yet built

- `entitlements` — service-role-only billing tier table (replaces user-writable `profiles.tier`; see ADR 0005), arrives with Stripe.
- `reviews` — verified student reviews tied to a `program_id` and `user_id` (community is mock-data-only today).
- `scholarships` — country/program-tagged funding records.
- `partnerships` — structured `university_id ↔ deal_terms` once partnerships have structure beyond the `is_partner` boolean.

## Migrations

Every schema change ships as a new file under `supabase/migrations/` named `YYYYMMDDHHMMSS_short_description.sql`. `scripts/db-migrate.mjs` applies them in filename order and records each in a `public.schema_migrations` ledger (filename + sha256 checksum); applied files are skipped on re-run, and an edited-already-applied file warns instead of silently re-applying. **Migrations are immutable — add a new one rather than editing an applied file.**

| Filename | Adds |
|---|---|
| `20260508120000_init_schema.sql` | `set_updated_at()`, `universities`, `programs`, `profiles`, `matches`; RLS enabled |
| `20260508140000_add_ranking_columns.sql` | `universities.qs_world_rank`, `programs.qs_subject_rank` + `qs_subject_area`, partial rank index |
| `20260511120000_add_saved_programs.sql` | `saved_programs` (shortlist) |
| `20260511130000_add_applications.sql` | `application_status` enum, `applications` |
| `20260511140000_add_user_id_columns.sql` | `user_id` FK + index on profiles/matches/saved_programs/applications |
| `20260514120000_add_application_tasks.sql` | `task_status` + `task_category` enums, `application_tasks` |
| `20260516120000_atomic_user_ops.sql` | `attach_anon_rows_to_user()`, `reset_user_progress()` SECURITY DEFINER helpers |
| `20260516130000_dedup_and_unique_user_program.sql` | Dedup + partial `UNIQUE (user_id, program_id)` on saved_programs & applications |
| `20260516140000_rls_defense_in_depth.sql` | Owner-scoped RLS policies on profiles/matches/saved_programs/applications/application_tasks |
| `20260605120000_university_email_verifications.sql` | `university_email_verifications`, `verification_email_sends`, `is_university_verified()` (+ uid overload) |
| `20260609120000_audit_hardening.sql` | Drop `profiles_anon_insert`; guard `profiles.tier` writes (service-role-only trigger); tighten `application_tasks` RLS to verify application ownership; harden `reset_user_progress` anon sweep; pin `set_updated_at` search_path |
| `20260609130000_shortlist_into_applications.sql` | Backfill `saved_programs` rows into `applications` at status `'interested'` (shortlist merged into the tracker; `saved_programs` deprecated, not yet dropped) |
| `20260609140000_housing.sql` | `housing_cities` + `housing_universities` (AI-researched, draft/published, public-read on published only) |
| `20260610120000_university_hero_images.sql` | `universities.hero_image_credit` + `hero_image_source_url` (attribution for real licensed hero photos) |

The `schema_migrations` ledger table itself is created by `db-migrate.mjs` (not a migration file).

Seed data lives in `supabase/seed.sql` (58 universities / 196 programs). Every INSERT uses `ON CONFLICT … DO UPDATE`, so re-running converges existing rows to whatever the file currently says (it does **not** preserve hand-edits made directly in the DB).
