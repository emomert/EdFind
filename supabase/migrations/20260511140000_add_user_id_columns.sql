-- EdFind — Phase 9.4: auth + user_id columns
--
-- Adds `user_id` to every per-user table so authenticated rows are tied to
-- Supabase Auth users. The existing `client_id` (anonymous cookie identity)
-- stays — it's NOT NULL on every table and we keep filling it on insert,
-- which keeps the migration of pre-auth rows safe and lets the same data
-- shape serve both query paths during the transition.
--
-- Reading model after this migration:
--   - Authenticated reads filter by `user_id = auth.uid()`.
--   - The first-sign-in callback attaches any rows that still have null
--     `user_id` and a `client_id` matching the user's cookie.
--
-- RLS: we keep service-role-only writes for now (all writes route through
-- Server Actions that validate the session). Direct client reads stay
-- denied; pages read via service-role with explicit user_id filters.

alter table public.profiles
  add column user_id uuid references auth.users(id) on delete cascade;

alter table public.matches
  add column user_id uuid references auth.users(id) on delete cascade;

alter table public.saved_programs
  add column user_id uuid references auth.users(id) on delete cascade;

alter table public.applications
  add column user_id uuid references auth.users(id) on delete cascade;

create index profiles_user_id_idx on public.profiles (user_id);
create index matches_user_id_idx on public.matches (user_id);
create index saved_programs_user_id_idx on public.saved_programs (user_id);
create index applications_user_id_idx on public.applications (user_id);
