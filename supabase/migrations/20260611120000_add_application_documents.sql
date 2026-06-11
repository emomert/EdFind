-- EdFind — application_documents for the AI document studio on /applications.
--
-- A user owns a set of AI-drafted application documents (CVs and cover
-- letters). A cover letter always links to one tracked application; a CV is
-- general by default but may optionally link to an application when the
-- student tailors it to a specific program.
--
-- content is Markdown, generated server-side by DeepSeek and then editable by
-- the student. user_notes preserves the free-text background ("highlights")
-- the student supplied at generation time so a regenerate can reuse it.
--
-- RLS: service-role only (same pattern as applications, application_tasks,
-- profiles, matches). All reads/writes route through Server Actions that
-- validate the session and filter by user_id explicitly.
--
-- Removal: see supabase/uninstall/drop_application_documents.sql. That file
-- lives outside supabase/migrations/ so scripts/db-migrate.mjs ignores it.
-- Run it by hand from the dashboard SQL editor only when uninstalling.

create type document_kind as enum ('cv', 'cover_letter');

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  kind document_kind not null,
  title text not null,
  content text not null,
  user_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index application_documents_user_id_idx
  on public.application_documents (user_id, updated_at desc);
create index application_documents_application_id_idx
  on public.application_documents (application_id);

create trigger application_documents_set_updated_at
  before update on public.application_documents
  for each row execute function public.set_updated_at();

alter table public.application_documents enable row level security;
