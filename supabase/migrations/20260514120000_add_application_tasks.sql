-- EdFind — application_tasks for the task kanban on /applications.
--
-- A user owns a set of tasks. Each task may optionally link to a tracked
-- application (e.g. "Upload transcript" for the Polimi MSc Management
-- application), or stand alone as a general study-prep task.
--
-- Status mirrors the kanban columns: todo / doing / done. sort_order keeps
-- ordering stable within a column when we add drag-and-drop later.
--
-- RLS: service-role only for now (same pattern as applications, saved_programs,
-- profiles, matches). All writes route through Server Actions that validate
-- the session and filter by user_id explicitly.
--
-- Removal: see supabase/uninstall/drop_application_tasks.sql. That file
-- lives outside supabase/migrations/ so scripts/db-migrate.mjs ignores it.
-- Run it by hand from the dashboard SQL editor only when uninstalling.

create type task_status as enum ('todo', 'doing', 'done');

create type task_category as enum (
  'documents',
  'language_test',
  'writing',
  'finance',
  'admin',
  'other'
);

create table public.application_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  title text not null,
  category task_category not null default 'other',
  status task_status not null default 'todo',
  due_at date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index application_tasks_user_id_idx on public.application_tasks (user_id);
create index application_tasks_status_idx on public.application_tasks (user_id, status, sort_order);
create index application_tasks_application_id_idx on public.application_tasks (application_id);

create trigger application_tasks_set_updated_at
  before update on public.application_tasks
  for each row execute function public.set_updated_at();

alter table public.application_tasks enable row level security;
