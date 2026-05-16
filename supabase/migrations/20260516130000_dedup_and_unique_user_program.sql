-- EdFind — dedup + UNIQUE(user_id, program_id) for shortlist + applications
--
-- Symptom: pre-auth + post-auth flows can each create a row for the same
-- (user, program) pair, and subsequent .maybeSingle() reads then explode
-- with "more than one row returned". The original migrations only added
-- UNIQUE(client_id, program_id), which doesn't constrain the authed pair.
--
-- Strategy:
--   1. Dedup existing rows: keep the most-recently-created row per
--      (user_id, program_id) and delete the rest.
--   2. Add a PARTIAL unique index on (user_id, program_id) WHERE user_id
--      IS NOT NULL. Partial because anonymous rows have user_id = NULL and
--      already have their own UNIQUE(client_id, program_id) guarantee.

-- ─────────── saved_programs ───────────
delete from public.saved_programs s
using public.saved_programs s2
where s.user_id is not null
  and s.user_id = s2.user_id
  and s.program_id = s2.program_id
  and s.created_at < s2.created_at;

create unique index if not exists saved_programs_user_program_uniq
  on public.saved_programs (user_id, program_id)
  where user_id is not null;

-- ─────────── applications ───────────
-- Same shape, but applications has an updated_at to preserve the more recent
-- row's state — we keep the most-recent row, drop the rest.
delete from public.applications a
using public.applications a2
where a.user_id is not null
  and a.user_id = a2.user_id
  and a.program_id = a2.program_id
  and a.updated_at < a2.updated_at;

create unique index if not exists applications_user_program_uniq
  on public.applications (user_id, program_id)
  where user_id is not null;
