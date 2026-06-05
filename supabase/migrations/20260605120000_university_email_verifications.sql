-- University email verification (community write-gating).
--
-- A signed-in user links an academic email to their account; we mail them a
-- confirmation link carrying a one-time token. Rows are written exclusively
-- by server routes using the service-role key — clients can only SELECT
-- their own rows. See docs/features/university-verification.md.

create table if not exists public.university_email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  domain text not null,
  -- sha256 hex of the one-time confirmation token; the raw token only ever
  -- exists in the email link.
  token_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  verified_at timestamptz
);

-- One verified university email per user…
create unique index if not exists university_email_verifications_verified_user
  on public.university_email_verifications (user_id)
  where status = 'verified';

-- …and a university email can only verify a single account.
create unique index if not exists university_email_verifications_verified_email
  on public.university_email_verifications (lower(email))
  where status = 'verified';

create unique index if not exists university_email_verifications_token_hash
  on public.university_email_verifications (token_hash);

create index if not exists university_email_verifications_user
  on public.university_email_verifications (user_id);

-- At most one PENDING row per user, so a concurrent double-submit can't
-- leave two live confirmation links. The loser's insert fails (the server
-- reports it as a storage error and the user simply retries).
create unique index if not exists university_email_verifications_pending_user
  on public.university_email_verifications (user_id)
  where status = 'pending';

drop trigger if exists set_university_email_verifications_updated_at
  on public.university_email_verifications;
create trigger set_university_email_verifications_updated_at
  before update on public.university_email_verifications
  for each row execute function public.set_updated_at();

alter table public.university_email_verifications enable row level security;

-- Users may read their own rows (the UI shows pending/verified state).
-- There are deliberately NO insert/update/delete policies: all writes go
-- through server routes with the service-role key, which bypasses RLS.
drop policy if exists "university_email_verifications_select_own"
  on public.university_email_verifications;
create policy "university_email_verifications_select_own"
  on public.university_email_verifications
  for select
  using (auth.uid() = user_id);

-- Append-only log of confirmation emails actually sent, keyed by recipient
-- (independent of user_id, since pending rows get deleted on re-request).
-- Backs the per-recipient rate limit that stops EdFind being used to
-- email-bomb arbitrary academic inboxes. Service-role writes only.
create table if not exists public.verification_email_sends (
  id uuid primary key default gen_random_uuid(),
  email_lower text not null,
  sent_at timestamptz not null default now()
);

create index if not exists verification_email_sends_email_time
  on public.verification_email_sends (email_lower, sent_at);

alter table public.verification_email_sends enable row level security;
-- No client policies at all: only the service-role key reads/writes this.

-- Helper for future community-content tables: write policies must enforce
-- verification in the database too, never app code alone (CLAUDE.md
-- "Don'ts"). Use the NO-ARG form inside RLS — it reports only the CURRENT
-- user's status, e.g. once a community_messages table exists:
--   create policy "insert_verified_only" on public.community_messages
--     for insert with check (public.is_university_verified());
create or replace function public.is_university_verified()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.university_email_verifications
    where user_id = auth.uid()
      and status = 'verified'
  );
$$;

revoke all on function public.is_university_verified() from public;
grant execute on function public.is_university_verified()
  to authenticated, service_role;

-- The uid-parameter form is for server / in-database use only. Exposing it
-- to `authenticated` would let any signed-in user probe whether an arbitrary
-- account is verified, so it is NOT granted to authenticated.
create or replace function public.is_university_verified(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.university_email_verifications
    where user_id = uid
      and status = 'verified'
  );
$$;

revoke all on function public.is_university_verified(uuid) from public;
revoke execute on function public.is_university_verified(uuid) from authenticated;
grant execute on function public.is_university_verified(uuid) to service_role;
