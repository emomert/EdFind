-- EdFind — security hardening from the 2026-06-09 audit
-- (see docs/project-audit-2026-06-09.md). Five independent fixes; each is
-- written to be safe to re-run.
--
-- 1. Drop the leftover open INSERT policy on profiles.
-- 2. Guard profiles.tier so only service_role can write it (BEFORE trigger).
-- 3. Tighten application_tasks INSERT/UPDATE to verify application ownership.
-- 4. Harden reset_user_progress so the anon sweep can only touch client_ids
--    actually associated with the calling user.
-- 5. Pin a fixed search_path on set_updated_at().

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. profiles_anon_insert — the open `with check (true)` policy.
--
-- Postgres permissive policies are OR'd together, so this single policy let
-- ANY holder of the publishable anon key INSERT arbitrary profiles rows
-- (any client_id, any answers, tier='full'). The app never needs it: every
-- insert path runs through the service-role client (lib/server/persist-and-
-- match.ts), which bypasses RLS. The owner-scoped profiles_owner_insert
-- (added in 20260516140000) covers any future authenticated client-side write.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "profiles_anon_insert" on public.profiles;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. profiles.tier is the designated future billing-entitlement column.
--
-- profiles_owner_update has no column restriction, so once tier-gated reads
-- consult profiles.tier any authenticated user could self-grant tier='full'
-- with one PostgREST call. A column-level REVOKE is unreliable here: Supabase
-- grants table-level UPDATE to `authenticated`, and a table-level grant
-- overrides a column-level revoke (the revoke becomes a no-op). So instead we
-- pin `tier` with a BEFORE trigger: only the service_role (all server writes)
-- may set it; any other role's INSERT is forced to 'free' and its UPDATE keeps
-- the existing value. See ADR 0005 for the longer-term plan to move
-- entitlements into a separate service-role-only table.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.guard_profiles_tier()
returns trigger
language plpgsql
as $$
begin
  -- service_role (the key used by every server write) may set tier freely.
  if current_user = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.tier := 'free';
  elsif tg_op = 'UPDATE' and new.tier is distinct from old.tier then
    new.tier := old.tier;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_tier on public.profiles;
create trigger profiles_guard_tier
  before insert or update on public.profiles
  for each row execute function public.guard_profiles_tier();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. application_tasks ownership of the linked application.
--
-- The old INSERT/UPDATE policies only checked `user_id = auth.uid()`, so via
-- direct PostgREST an authenticated user could attach a task to ANOTHER
-- user's application by pointing application_id at a foreign UUID — the JS
-- ownership check (assertOptionalApplicationOwnership) was the only guard.
-- CLAUDE.md forbids JS-only gating, so enforce it in the policy too.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "application_tasks_owner_insert" on public.application_tasks;
create policy "application_tasks_owner_insert"
  on public.application_tasks for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      application_id is null
      or exists (
        select 1 from public.applications a
        where a.id = application_id and a.user_id = auth.uid()
      )
    )
  );

drop policy if exists "application_tasks_owner_update" on public.application_tasks;
create policy "application_tasks_owner_update"
  on public.application_tasks for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      application_id is null
      or exists (
        select 1 from public.applications a
        where a.id = application_id and a.user_id = auth.uid()
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. reset_user_progress — restrict the anon-orphan sweep to client_ids that
--    belong to the calling user.
--
-- The previous version deleted unattached (user_id IS NULL) rows for ANY
-- caller-supplied client_id, so a signed-in user could pass a victim's
-- localStorage client_id and delete their not-yet-claimed quiz data. We now
-- first collect the client_ids that appear on rows already owned by the
-- caller, and intersect the supplied list with that set before sweeping.
-- Truly-orphan rows whose client_id was never tied to this user are left in
-- place (they're harmless and get cleaned up by attach_anon_rows_to_user on
-- the next sign-in).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.reset_user_progress(
  p_user_id uuid,
  p_client_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owned_client_ids uuid[];
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  -- client_ids historically tied to this user's own rows
  select array_agg(distinct client_id) into v_owned_client_ids
  from (
    select client_id from public.profiles where user_id = p_user_id
    union
    select client_id from public.saved_programs where user_id = p_user_id
    union
    select client_id from public.applications where user_id = p_user_id
  ) t
  where client_id is not null;

  delete from public.application_tasks where user_id = p_user_id;
  delete from public.applications where user_id = p_user_id;
  delete from public.saved_programs where user_id = p_user_id;
  delete from public.profiles where user_id = p_user_id;

  if p_client_ids is not null
     and v_owned_client_ids is not null
     and array_length(p_client_ids, 1) > 0 then
    delete from public.applications
      where client_id = any(p_client_ids)
        and client_id = any(v_owned_client_ids)
        and user_id is null;
    delete from public.saved_programs
      where client_id = any(p_client_ids)
        and client_id = any(v_owned_client_ids)
        and user_id is null;
    delete from public.profiles
      where client_id = any(p_client_ids)
        and client_id = any(v_owned_client_ids)
        and user_id is null;
  end if;
end;
$$;

revoke all on function public.reset_user_progress(uuid, uuid[]) from public;
revoke all on function public.reset_user_progress(uuid, uuid[]) from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. set_updated_at() had no fixed search_path (the lone function in the
--    schema without one). Pin it for parity with the other helpers and to
--    satisfy the Supabase linter. now() resolves from pg_catalog regardless.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
