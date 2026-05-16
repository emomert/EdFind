-- EdFind — RLS defense-in-depth for per-user tables
--
-- Until now, profiles / matches / saved_programs / applications / application_tasks
-- had RLS enabled with no policies — meaning service-role-only access. That
-- works while every server handler uses the service-role client, but the
-- moment a future hand-off accidentally uses the anon (cookie-bound) client,
-- the request silently returns empty results instead of failing loudly, and
-- write attempts get a 401-equivalent.
--
-- This migration adds owner-scoped policies so:
--   - Authenticated users may SELECT / INSERT / UPDATE / DELETE their own
--     rows (auth.uid() = user_id).
--   - Pre-auth rows (user_id IS NULL) remain service-role only — they're
--     created via signed Server Actions and read via service-role in the
--     shortlist/applications cookie flows.
--
-- Service-role keeps bypassing RLS regardless, so existing handlers are
-- unchanged. We can now safely migrate read paths to the anon client at any
-- time without changing the database again.

-- ─────────── profiles ───────────
create policy "profiles_owner_select"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "profiles_owner_insert"
  on public.profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "profiles_owner_update"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "profiles_owner_delete"
  on public.profiles for delete
  to authenticated
  using (user_id = auth.uid());

-- ─────────── matches ───────────
create policy "matches_owner_select"
  on public.matches for select
  to authenticated
  using (user_id = auth.uid());

-- writes stay service-role only — matches rows are only produced server-side
-- by the matcher pipeline.

-- ─────────── saved_programs ───────────
create policy "saved_programs_owner_select"
  on public.saved_programs for select
  to authenticated
  using (user_id = auth.uid());

create policy "saved_programs_owner_insert"
  on public.saved_programs for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "saved_programs_owner_delete"
  on public.saved_programs for delete
  to authenticated
  using (user_id = auth.uid());

-- ─────────── applications ───────────
create policy "applications_owner_select"
  on public.applications for select
  to authenticated
  using (user_id = auth.uid());

create policy "applications_owner_insert"
  on public.applications for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "applications_owner_update"
  on public.applications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "applications_owner_delete"
  on public.applications for delete
  to authenticated
  using (user_id = auth.uid());

-- ─────────── application_tasks ───────────
create policy "application_tasks_owner_select"
  on public.application_tasks for select
  to authenticated
  using (user_id = auth.uid());

create policy "application_tasks_owner_insert"
  on public.application_tasks for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "application_tasks_owner_update"
  on public.application_tasks for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "application_tasks_owner_delete"
  on public.application_tasks for delete
  to authenticated
  using (user_id = auth.uid());
