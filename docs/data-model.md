# Data model

Postgres schema for EdFind. This document is the source of truth for the schema; it must stay in sync with the migrations under `supabase/migrations/`.

## Conventions

- All tables use `id uuid primary key default gen_random_uuid()`.
- Timestamps: `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` (with a trigger to update on `UPDATE`).
- Soft delete is **not** used by default. Hard-delete unless a feature requires history.
- All tables have **RLS enabled**. No table is exposed without explicit policies.
- Money is stored as `numeric(10,2)` with a separate `currency text not null default 'EUR'` column. Never store money as float.
- Free-text user content (reviews, profile prompts) is stored verbatim and trimmed but not transformed.

## Phase 3 (MVP) tables

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
| `logo_url` | text | Stored in Supabase Storage |
| `hero_image_url` | text | Optional campus image |
| `is_partner` | boolean not null default false | True for Partner Universities tier |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** read = public; write = service-role only.

### `programs`

A specific master's program offered by a university.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `university_id` | uuid FK → `universities.id` not null | |
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
| `created_at` / `updated_at` | timestamptz | |

`UNIQUE (university_id, slug)`.

**RLS:** read policy depends on the requesting user's tier and on `universities.is_partner` (see `docs/features/` once tier-gated read is specified). For MVP, read is public; tier gating arrives with the Partner / Full Access tiers.

### `profiles`

A single submitted quiz response. Anonymous in MVP (no FK to `users`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `client_id` | uuid not null | Generated client-side, persisted in localStorage so a user can revisit results |
| `answers` | jsonb not null | Raw quiz answers, schema-versioned |
| `answers_version` | int not null | Bumps when the quiz schema changes |
| `tier` | text not null default 'free' | `free` / `partner` / `full` |
| `created_at` | timestamptz | |

**RLS:**
- Insert: anyone (anonymous quiz submission).
- Select: only when the requester provides the matching `client_id` (passed via signed cookie or URL token).
- Update/delete: service-role only.

When auth is added later, a nullable `user_id uuid FK → auth.users` is added and a policy allows the owner to read their own profile.

### `matches`

The output of a matching run for one profile.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → `profiles.id` not null | |
| `program_id` | uuid FK → `programs.id` not null | |
| `score` | numeric(5,2) | 0-100, optional in MVP |
| `rationale` | text | AI-generated explanation, null for placeholder matches |
| `created_at` | timestamptz | |

For MVP, the placeholder matcher inserts exactly one `matches` row per submission, pointing at the seeded program, with `score = null` and `rationale = null`.

**RLS:** select by matching `profile_id`'s `client_id`; insert/update service-role only.

## Field-of-study taxonomy

A small initial taxonomy. Stored as a string for simplicity; if it grows, promote to a `fields_of_study` table.

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

## Future tables (sketch only — not built in MVP)

- `users` — account-bound profiles (when auth is enabled)
- `reviews` — verified student reviews tied to a `program_id` and (later) a `user_id`
- `applications` — per-user, per-program tracker rows
- `tasks` — Kanban tasks under an `application_id`
- `scholarships` — country/program-tagged funding records
- `partnerships` — explicit `university_id ↔ deal_terms` (instead of a single `is_partner` boolean) once partnerships have structure

## Migrations

Every schema change ships as a new file under `supabase/migrations/` named `YYYYMMDDHHMMSS_short_description.sql`. The matching update to this doc is part of the same change.

| Filename | Adds |
|---|---|
| `20260508120000_init_schema.sql` | `set_updated_at()` helper, `universities`, `programs`, `profiles`, `matches` with RLS enabled and the policies described above |

Seed data lives in `supabase/seed.sql`. Re-running it is idempotent (`ON CONFLICT DO NOTHING` on slug uniques).
