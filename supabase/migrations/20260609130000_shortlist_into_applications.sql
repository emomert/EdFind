-- EdFind — fold the shortlist into the applications tracker.
--
-- Product change (2026-06-09): "saving" a program now means adding it to the
-- applications tracker at status 'interested' (the first stage). The separate
-- saved_programs table is superseded — every save / un-save now reads and
-- writes `applications`, and /shortlist becomes the 'interested' view of the
-- tracker.
--
-- This migration backfills any existing saved_programs rows into applications
-- at status 'interested' (skipping programs already tracked). It is safe to
-- re-run: the NOT EXISTS guard plus ON CONFLICT DO NOTHING make it idempotent.
--
-- We intentionally DO NOT drop saved_programs yet. The attach_anon_rows_to_user
-- and reset_user_progress SECURITY DEFINER functions still reference it, and
-- keeping the (now-unused) table makes this change reversible. A follow-up
-- cleanup migration can drop saved_programs and update those functions once
-- this is verified in production.

insert into public.applications (client_id, user_id, program_id, status, created_at, updated_at)
select s.client_id, s.user_id, s.program_id, 'interested', s.created_at, s.created_at
from public.saved_programs s
where not exists (
  select 1
  from public.applications a
  where a.program_id = s.program_id
    and (
      (s.user_id is not null and a.user_id = s.user_id)
      or (s.user_id is null and a.user_id is null and a.client_id = s.client_id)
    )
)
on conflict do nothing;
