-- EdFind — atomic auth helpers
--
-- Two SECURITY DEFINER functions that wrap multi-table writes in a single
-- transaction so partial failures roll back instead of leaving half-migrated
-- or half-deleted state behind.
--
-- attach_anon_rows_to_user(client_id, user_id)
--   First-sign-in migration. Attaches any rows tied to the user's pre-auth
--   cookie client_id to the authenticated user_id. Only touches rows where
--   user_id IS NULL (defence against impersonating someone else's client_id).
--
-- reset_user_progress(user_id, client_ids)
--   Destructive reset for /applications "Reset all progress". Wipes all
--   per-user rows owned by user_id plus any orphaned anon rows still tied to
--   the supplied client_ids. matches.profile_id has ON DELETE CASCADE so the
--   profiles delete clears matches automatically.
--
-- Both functions are SECURITY DEFINER (run as table owner, bypass RLS). The
-- ownership check is encoded inline — see the WHERE clauses. Callers must
-- already have verified the auth session server-side; these helpers do not
-- re-authenticate.

create or replace function public.attach_anon_rows_to_user(
  p_client_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_client_id is null or p_user_id is null then
    return;
  end if;

  update public.profiles
    set user_id = p_user_id
    where client_id = p_client_id and user_id is null;

  update public.saved_programs
    set user_id = p_user_id
    where client_id = p_client_id and user_id is null;

  update public.applications
    set user_id = p_user_id
    where client_id = p_client_id and user_id is null;

  update public.matches
    set user_id = p_user_id
    where user_id is null
      and profile_id in (
        select id from public.profiles where client_id = p_client_id
      );
end;
$$;

revoke all on function public.attach_anon_rows_to_user(uuid, uuid) from public;
revoke all on function public.attach_anon_rows_to_user(uuid, uuid) from anon, authenticated;

create or replace function public.reset_user_progress(
  p_user_id uuid,
  p_client_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  delete from public.application_tasks where user_id = p_user_id;
  delete from public.applications where user_id = p_user_id;
  delete from public.saved_programs where user_id = p_user_id;
  delete from public.profiles where user_id = p_user_id;

  if p_client_ids is not null and array_length(p_client_ids, 1) > 0 then
    delete from public.applications
      where client_id = any(p_client_ids) and user_id is null;
    delete from public.saved_programs
      where client_id = any(p_client_ids) and user_id is null;
    delete from public.profiles
      where client_id = any(p_client_ids) and user_id is null;
  end if;
end;
$$;

revoke all on function public.reset_user_progress(uuid, uuid[]) from public;
revoke all on function public.reset_user_progress(uuid, uuid[]) from anon, authenticated;
