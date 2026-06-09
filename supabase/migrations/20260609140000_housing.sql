-- EdFind — housing & cost-of-living information (city + university level).
--
-- AI-researched data, stored with sources + a researched_on date and a
-- draft/published status so figures are reviewable and clearly dated, never
-- presented as live quotes. Public reads see published rows only; all writes
-- go through the service-role key. Gated in the app by NEXT_PUBLIC_ENABLE_HOUSING.
--
-- Money: numeric(10,2) ranges in `currency` (default EUR). Ranges, not exact
-- quotes — the UI always shows the range + sources + date + a disclaimer.

-- ─────────────────────────────────────────────────────────────────────────────
-- housing_cities — per city (shared across universities in the same city).
-- ─────────────────────────────────────────────────────────────────────────────
create table public.housing_cities (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  country text not null,                 -- ISO-3166 alpha-2, matches universities.country
  rent_room_min numeric(10,2),           -- private room in a shared flat
  rent_room_max numeric(10,2),
  rent_studio_min numeric(10,2),         -- self-contained studio
  rent_studio_max numeric(10,2),
  rent_shared_min numeric(10,2),         -- a bed/place in shared student housing
  rent_shared_max numeric(10,2),
  currency text not null default 'EUR',
  monthly_living_min numeric(10,2),      -- living costs excluding rent
  monthly_living_max numeric(10,2),
  student_neighborhoods jsonb,           -- [{ name, note }]
  how_to_find jsonb,                     -- [{ name, url }] portals / offices
  deposit_norms text,
  tips text,
  sources jsonb,                         -- [{ title, url }]
  researched_on date,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city, country)
);

create trigger housing_cities_set_updated_at
  before update on public.housing_cities
  for each row execute function public.set_updated_at();

alter table public.housing_cities enable row level security;

create policy "housing_cities_public_read"
  on public.housing_cities for select
  using (status = 'published');
-- No write policy → service-role only.

-- ─────────────────────────────────────────────────────────────────────────────
-- housing_universities — per university (on/near-campus specifics).
-- ─────────────────────────────────────────────────────────────────────────────
create table public.housing_universities (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  has_dorms boolean,
  dorm_note text,
  housing_office_url text,
  on_campus_monthly_min numeric(10,2),
  on_campus_monthly_max numeric(10,2),
  near_campus_monthly_min numeric(10,2),
  near_campus_monthly_max numeric(10,2),
  currency text not null default 'EUR',
  commute_note text,
  tips text,
  sources jsonb,                         -- [{ title, url }]
  researched_on date,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id)
);

create index housing_universities_university_id_idx
  on public.housing_universities (university_id);

create trigger housing_universities_set_updated_at
  before update on public.housing_universities
  for each row execute function public.set_updated_at();

alter table public.housing_universities enable row level security;

create policy "housing_universities_public_read"
  on public.housing_universities for select
  using (status = 'published');
-- No write policy → service-role only.
