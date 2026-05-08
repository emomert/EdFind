-- EdFind — initial schema
-- See docs/data-model.md for the canonical schema reference.
--
-- Conventions:
--   - All tables: id uuid pk default gen_random_uuid()
--   - Timestamps: created_at, updated_at (trigger-maintained where present)
--   - All tables: RLS enabled. Service-role bypasses RLS automatically.
--   - Money: numeric(10,2) + separate currency column.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: bump updated_at on row update.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- universities
--   Reference data. Read = public, write = service-role only.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  country text not null,
  city text not null,
  institution_type text,
  website text,
  description text,
  established_year int,
  student_count int,
  logo_url text,
  hero_image_url text,
  is_partner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger universities_set_updated_at
  before update on public.universities
  for each row execute function public.set_updated_at();

alter table public.universities enable row level security;

create policy "universities_public_read"
  on public.universities for select
  using (true);

-- No insert/update/delete policy → only service-role may write.

-- ─────────────────────────────────────────────────────────────────────────────
-- programs
--   Specific master's program offered by a university.
--   Read = public for MVP; tier-gated reads arrive when Partner / Full Access
--   tiers are implemented (replace this policy at that point).
-- ─────────────────────────────────────────────────────────────────────────────

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  slug text not null,
  name text not null,
  degree text not null,
  field_of_study text not null,
  language text not null,
  duration_months int not null,
  tuition_per_year numeric(10,2),
  currency text not null default 'EUR',
  application_deadline date,
  start_month text,
  description text,
  requirements jsonb,
  curriculum_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id, slug)
);

create index programs_university_id_idx on public.programs (university_id);
create index programs_field_of_study_idx on public.programs (field_of_study);

create trigger programs_set_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

alter table public.programs enable row level security;

create policy "programs_public_read"
  on public.programs for select
  using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles
--   A single submitted quiz response. Anonymous in MVP (no FK to auth.users).
--   Insert: anyone (anonymous quiz submission).
--   Select: denied for anon — server reads via service-role using client_id.
--   Update/delete: service-role only.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  answers jsonb not null,
  answers_version int not null,
  tier text not null default 'free' check (tier in ('free', 'partner', 'full')),
  created_at timestamptz not null default now()
);

create index profiles_client_id_idx on public.profiles (client_id);

alter table public.profiles enable row level security;

create policy "profiles_anon_insert"
  on public.profiles for insert
  with check (true);

-- No SELECT policy → anon SELECT denied. Server reads via service-role.

-- ─────────────────────────────────────────────────────────────────────────────
-- matches
--   Output of a matching run for one profile. Service-role only for MVP.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  score numeric(5,2),
  rationale text,
  created_at timestamptz not null default now()
);

create index matches_profile_id_idx on public.matches (profile_id);
create index matches_program_id_idx on public.matches (program_id);

alter table public.matches enable row level security;

-- No policies → service-role only for MVP. Tier-aware client read policies
-- land alongside auth in a later migration.
