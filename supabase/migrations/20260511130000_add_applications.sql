-- EdFind — Phase 9.3: application tracker
--
-- This table is part of an isolated, removable module. To uninstall, see
-- supabase/migrations/20260511130000_drop_applications.sql (kept in repo
-- alongside this file, NOT applied automatically — run by hand on removal).

create type application_status as enum (
  'interested',
  'drafting',
  'submitted',
  'accepted',
  'rejected',
  'waitlisted',
  'withdrawn'
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  program_id uuid not null references public.programs(id) on delete cascade,
  status application_status not null default 'interested',
  notes text,
  deadline_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, program_id)
);

create index applications_client_id_idx on public.applications (client_id);
create index applications_program_id_idx on public.applications (program_id);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

alter table public.applications enable row level security;

-- No client policies → service-role only for MVP, same pattern as profiles,
-- matches, and saved_programs.
