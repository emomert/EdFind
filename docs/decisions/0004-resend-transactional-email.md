# 0004 — Resend for transactional email (university email verification)

- **Status:** Accepted
- **Date:** 2026-06-05
- **Deciders:** Mert + Claude

## Context

Community write access (chat, reviews, questions) must be limited to users who
prove they own a university email address. Proving ownership requires sending
a confirmation link to that address — our first transactional email. Supabase
Auth's built-in mailer only covers auth-flow emails for the account's primary
address; it cannot send arbitrary mail to a *secondary* address the user is
linking.

Constraints: server-only secrets, minimal new dependencies, and the product
currently runs on a free tier everywhere (Supabase free, Vercel hobby).

## Decision

Use **Resend** (resend.com) as the transactional email provider, called via
its plain REST API with `fetch` — no SDK dependency. Access is isolated in
`lib/email/index.ts` (provider-agnostic mailer, mirroring `lib/ai/index.ts`):
feature code imports `sendEmail()` from there, never a vendor SDK.

When `RESEND_API_KEY` is unset, the mailer reports "not configured" and the
verification flow falls back to showing the confirmation link directly in the
UI (same spirit as the community subscription dev toggle). This keeps the
feature fully testable before the key/domain exist and makes the swap to
production email a pure env-var change.

## Alternatives considered

- **Supabase Auth emails** — only sends to the account's own email for auth
  flows; can't confirm a secondary university address. Rejected.
- **SMTP via nodemailer (e.g. Gmail)** — needs credentials with poor
  deliverability, adds a dependency, and Vercel serverless + SMTP is fragile.
  Rejected.
- **SendGrid / Mailgun / Postmark / AWS SES** — all viable; Resend has the
  most generous free tier (3,000/month), the simplest API, and first-class
  Vercel/Next.js positioning. Nothing in our usage is Resend-specific — the
  `lib/email` wrapper keeps a future switch cheap.

## Consequences

- **Positive:** real verification emails with one env var; no new npm
  dependency; provider swap stays a one-file change.
- **Negative:** without a verified custom domain, Resend only delivers to the
  Resend account owner's own address (test mode). Until EdFind has a custom
  domain with DNS records, production sending is limited — the dev-link
  fallback covers the gap.
- **Follow-ups:** create the Resend account + `RESEND_API_KEY`; buy/verify a
  sending domain when EdFind gets one; revisit `EMAIL_FROM` at that point.
