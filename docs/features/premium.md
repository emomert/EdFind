# Feature: Premium tier & demo paywall

Shipped 2026-06-11 for the presentation. EdFind now has **two tiers** (the
old Free / Partner / Full Access triple is parked until real billing):

| Tier | Price | What you get |
|---|---|---|
| **Free** | €0 | Catalog browsing, university/program pages, housing data, full community **read** access (no account needed to read), community **write** with a verified university email (account + edu mail, no payment) |
| **Premium** | **€5/month** | Everything in Free + **AI matching** (quiz `/quiz` + AI search `/search`), **application tracking** (`/applications`, `/shortlist`, `/compare`, document studio), **direct messages to campus responsibles** |

Account rules: everything requires a Google account **except reading the
community** (`/community` is public since this change; `requireUser` was
removed from that page only).

## The demo paywall

`/premium` is the paywall screen. Premium-gated pages call
`requirePremium(nextPath)` (in `lib/premium/premium.ts`) right after
`requireUser` and redirect to `/premium?next=<path>` when the cookie isn't
set. The page shows the two tier cards; the **"Activate Premium & continue"**
button is a Server Action (`app/premium/actions.ts → activatePremiumDemo`)
that simply sets the cookie and redirects to `next` — it stands in for a
successful Stripe checkout and says so in the UI ("Demo mode: this button
simulates a successful checkout"). It is deliberately reachable in
production: the whole paywall is a presentation dummy.

## State

One flag: the `edfind_premium` cookie (`lib/premium/premium.ts`). The old
community subscription (`lib/community/subscription.ts`,
`edfind_community_subscribed` cookie) now **delegates** to it — community
code keeps calling `getSubscriptionState()` but there is only one paid plan.
The community dev toggle (non-production only) flips the same flag.

When Stripe lands: `lib/premium/premium.ts` becomes a `profiles.tier` check,
`activatePremiumDemo` becomes "create checkout session", and **the gate must
also be enforced in RLS** per the CLAUDE.md rule (cookie-gating is
presentation-only and acknowledged as such).

## Gated surfaces

| Surface | Gate |
|---|---|
| `/quiz`, `/search` | `requireUser` → `requirePremium` |
| `/applications`, `/shortlist`, `/compare` | `requireUser` → `requirePremium` |
| Campus-responsible DM button (community) | renders as a link to `/premium` when not premium |
| `/community/upgrade` | legacy route — redirects to `/premium?next=/community` |
| Group chat writing, reviews, questions | NOT premium — university-email verification only |

`/results*` stays un-gated: results only exist if a (premium) match ran.
