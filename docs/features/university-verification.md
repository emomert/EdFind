# University email verification — community write-gating

**Status:** live (`RESEND_API_KEY` set; real email sending needs a verified
sending domain — until then Resend delivers only to the account owner) ·
**Added:** 2026-06-05 · **ADR:** `docs/decisions/0004-resend-transactional-email.md`

## What it is

Every signed-in user can **read** the community. Only accounts that have
confirmed ownership of a **university email address** can **write** — send
group-chat messages, post reviews, ask/reply to questions. Users link the
university email to their existing (Google) account; it does not replace
their sign-in email.

Subscription and verification are independent axes:

| | Free | Subscribed |
|---|---|---|
| **Not verified** | read previews | read everything, write nothing |
| **Verified** | read previews | full read + write |

(Write affordances also require the subscription where they already did —
verification is layered on top, never instead.)

## Flow

1. Signed-in user enters their university email in the "Become a verified
   student" card (community sidebar) or the chat-composer prompt.
2. `POST /api/university-email` validates the address (academic domain
   check), stores a pending row with a hashed one-time token (24 h expiry),
   and emails a confirmation link via Resend.
   - **Dev fallback (local only):** in non-production (`next dev`,
     `NODE_ENV !== "production"`) the API returns the confirmation link in the
     response and the card renders it inline, clearly labeled as dev mode.
     This triggers when the mailer is unconfigured **or** when a send fails
     (e.g. Resend's testing mode only delivers to the account owner). It is
     hard-gated off in production — every Vercel deploy sets
     `NODE_ENV=production`, so deployed environments always require real
     email. Handing the link back to the requester anywhere public would let
     someone verify an email they don't own.
3. User clicks the link → `/verify-university-email?token=…` (public page —
   the token is the proof, so it works in any browser/device) → row flips to
   `verified`.
4. Community write affordances unlock on next page load.

## Academic domain rules (`lib/verification/academic-domains.ts`)

Accepted when the domain is NOT a consumer free-mail provider AND:

- matches an academic TLD pattern (`.edu`, `.edu.tr`, `.ac.uk`, `uni-*.de`,
  `tu-*.de`, `fh-*.de`, `univ-*.fr`, …), or
- is/belongs to a curated list of known European university domains, or
- is/belongs to a **catalog university's `website` domain** (fetched live, so
  new catalog drops extend coverage automatically). Subdomains match
  (`mail.polimi.it` → `polimi.it`).

Decision: any academic domain counts (not just catalog universities) —
Turkish students' own university mails are the community's actual audience.

## Data model

`university_email_verifications` (see `docs/data-model.md`): one verified
email per user, one account per email (partial unique indexes), `token_hash`
only (raw token never stored), RLS = SELECT own rows; **all writes go through
the service-role client in `lib/verification/server.ts`** — no client write
policies exist.

`public.is_university_verified()` (no-arg, security-definer; checks the
current `auth.uid()`) is ready for the future real community tables: their
INSERT policies must call it, so the write rule is enforced in the database
too, never app code alone (CLAUDE.md "Don'ts"). A `uid`-parameter overload
exists for server/in-database use but is **not** granted to `authenticated`
(it would let any signed-in user probe another account's verified status).
Today's community content is mock data with no DB writes, so the UI gate is
the only live enforcement point — this is acceptable *only* until real tables
land.

`verification_email_sends` is an append-only log of confirmation emails
actually sent (keyed by recipient, service-role writes only). It backs a
per-recipient rate limit (≤3 sends / 24 h to any one inbox, ≥10 min apart,
across all requesters) so EdFind can't be used to email-bomb academic
inboxes. A partial unique index keeps at most one `pending` row per user.

## Request hardening

- Tokens: 32 random bytes (base64url), stored as SHA-256 hex; 24 h TTL.
- Per-requester cooldown: 2 min between requests. Per-recipient throttle:
  ≤3 emails / 24 h to one inbox, ≥10 min apart (any requester).
- New request invalidates (deletes) prior pending rows — newest link wins;
  a partial unique index enforces ≤1 pending row per user.
- Emailed confirm links are built from a canonical origin
  (`NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → request origin
  in local dev), never blindly from the request Host header.
- Email/domain stored lower-cased; the taken-check is an exact `.eq` (not a
  LIKE) so `%`/`_` in an address can't act as wildcards. An address already
  verified by another account yields the normal "sent" response (no
  enumeration, no mail to the third party).
- Cross-cutting failure handling: a production send failure undoes the
  pending row so the user isn't stranded behind the cooldown; the confirm
  UPDATE checks the affected-row count so a replaced link can't report a
  false success.
- Errors map to statuses: validation 422, already-verified 409,
  cooldown/throttle 429, mailer failure 502, DB write failure 500.

## Files

| File | Role |
|---|---|
| `supabase/migrations/20260605120000_university_email_verifications.sql` | Tables (`university_email_verifications`, `verification_email_sends`), indexes, RLS, `is_university_verified()` |
| `lib/verification/types.ts` | Shared `UniversityVerification` type (client-safe) |
| `lib/verification/academic-domains.ts` | Pure domain-validation rules |
| `lib/verification/server.ts` | Request/confirm/status logic (service-role writes) |
| `lib/email/index.ts` | Provider-agnostic mailer (Resend REST, no SDK) |
| `app/api/university-email/route.ts` | GET status · POST request link |
| `app/verify-university-email/page.tsx` | Public confirmation landing page |
| `components/community/verification-context.tsx` | `VerificationProvider` + `useVerification()` |
| `components/community/verified-writer-only.tsx` | `<VerifiedWriterOnly>` gate wrapper |
| `components/community/verify-university-email-card.tsx` | Top-of-page card + chat-composer variant |
| `app/community/page.tsx` | Reads verification server-side, passes to client |

Gated surfaces: chat composer (`group-chat-modal.tsx`), question Reply button
(`popular-questions-card.tsx`), "Ask a question" / "Write a review" CTAs
(`community-action-cards.tsx`).

## Env vars

- `RESEND_API_KEY` — server-only. Unset (or a failed send) → dev-link
  fallback **in non-production only**; production requires a working mailer.
- `EMAIL_FROM` — sender; the default `onboarding@resend.dev` only delivers to
  the Resend account owner until a custom domain is verified at
  `resend.com/domains`. To email real university addresses, verify a domain
  and point `EMAIL_FROM` at it.
- `NEXT_PUBLIC_SITE_URL` — optional canonical origin for emailed links (e.g.
  `https://ed-find.vercel.app`, no trailing slash). On Vercel,
  `VERCEL_PROJECT_PRODUCTION_URL` is used automatically when this is unset.

## Future

- Email/password sign-up (separate phase; decided 2026-06-05 to keep
  Google-only sign-in for now).
- "Verified student @ X" badges tied to the matched catalog university.
- Unlink/change verified email (currently: contact support / manual SQL).
- Move the table's pending-row cleanup to a scheduled job if volume grows.
