-- EdFind — Phase 9.2: saved_programs (shortlist)
--
-- Per-client list of bookmarked programs. Anonymous-cookie identity in MVP;
-- a nullable user_id column is added in Phase 9.4 alongside auth.

create table public.saved_programs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  program_id uuid not null references public.programs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, program_id)
);

create index saved_programs_client_id_idx on public.saved_programs (client_id);
create index saved_programs_program_id_idx on public.saved_programs (program_id);

alter table public.saved_programs enable row level security;

-- No client policies → service-role only for MVP, same pattern as profiles
-- and matches. Tier-aware client policies arrive with the auth migration.
