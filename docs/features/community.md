# Feature: Community — Verified Student Insights

The `/community` page. Built 2026-05-14 as a mock-first surface: every
university and program in the catalog gets a community group, with rich
content seeded for 8 hand-picked universities and auto-generated stubs for
the rest. Subscription gating is enforced through a cookie dev toggle until
Stripe is wired.

## Status

- **Pure mock data** — no Supabase tables. Lives in `lib/community/fake-data.ts`
  + `lib/community/generate-groups.ts`. Replacement path is structured for
  Supabase as soon as we want real persistence.
- **Subscription state** is a cookie (`edfind_community_subscribed`). A
  floating dev-toggle on the page flips it.
- **Public read** (since 2026-06-11) — `/community` no longer requires an
  account; it's the only signed-out-accessible product surface besides the
  catalog/detail pages. Writing still needs a signed-in, university-verified
  account, and DMing campus responsibles needs Premium (see
  `docs/features/premium.md`).
- **Feature flag:** `NEXT_PUBLIC_ENABLE_COMMUNITY` (default on; set to
  `false` to hide the route + header nav link).

## Layout

Redesigned 2026-06-11 on user feedback (two rounds): the sidebar is gone
(the feed gets full width), the "what can I do here" cards moved to the top,
two widgets were removed outright (`CommunityStatsCard` "Community at a
glance", `TopUniversitiesWidget` "Top universities discussed"), the top
upgrade strip was removed again in round two (the Premium pitch now appears
ONLY on the campus-responsible message buttons — the place the perk applies),
mock first names (Emre, Arda, …) no longer render inside group boxes or the
chat-modal header (avatars + "Campus responsible" label instead; the
Responsibles tab keeps full profiles since it's a directory), and every group
card / chat modal links to its university or program detail page
(`groupDetailHref()` in `community-group-card.tsx`).

```
┌────────────────────────────────────────────────────────────────────┐
│  CommunityHero — full-bleed video background                       │
│   · busy-campus clip as the section background (public/videos/     │
│     community-hero.mp4 — Pexels #30614645 by Media Hopper Studio,  │
│     free license, trimmed to 12s/720p with ffmpeg, ~1.3 MB)        │
│   · left→right white gradient overlay; copy sits on the left       │
│   · static gradient + decor fallback if the video fails to load    │
└────────────────────────────────────────────────────────────────────┘
┌─────────────────────┬─────────────────────┬────────────────────────┐
│  AskCommunityCard   │ ShareExperienceCard │ VerifyUniversityEmail- │
│  (what you can do)  │ (what you can do)   │ Card (write access)    │
└─────────────────────┴─────────────────────┴────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│  CommunityFilters                                                  │
│   · search · country · university · field · verified-only toggle   │
│   · sort: most helpful / active / recent / members / highest rated │
└────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│  CommunityTabs (full width)                                        │
│   · Reviews (lg: 2-col) · Groups (xl: 3-col) · Questions           │
│   · Campus Responsibles (xl: 3-col)                                │
│  ─── ActiveTab content ───                                         │
└────────────────────────────────────────────────────────────────────┘
```

`GroupChatModal` opens as an overlay when a group card's CTA is clicked.

## Component hierarchy

| Component | File | Concern |
|---|---|---|
| `CommunityClient` | `components/community/community-client.tsx` | Top-level client, owns filter + tab state, wraps everything in `SubscriptionProvider` |
| `CommunityHero` | `components/community/community-hero.tsx` | Eyebrow + headline + trust chips + self-hosted campus video |
| `CommunityFilters` | `components/community/community-filters.tsx` | Search + country + uni + field + verified toggle + sort |
| `CommunityTabs` | `components/community/community-tabs.tsx` | Tab navigation with active-underline layout animation |
| `ReviewCard` | `components/community/review-card.tsx` | One review — user, badge, rating stars, tags, helpful + reply |
| `CommunityGroupCard` | `components/community/community-group-card.tsx` | One group card with member/verified counts, latest discussion, CTA |
| `GroupChatModal` | `components/community/group-chat-modal.tsx` | Bottom-sheet modal with messages + locked or active input |
| `CampusResponsibleCard` | `components/community/campus-responsible-card.tsx` | Responsible card with response time, expertise tags, message CTA |
| `PopularQuestionsList` | `components/community/popular-questions-card.tsx` | Grid of questions with reply counts |
| `community-action-cards.tsx` | (same file) | `AskCommunityCard`, `ShareExperienceCard` — the top "what you can do" cards (was `sidebar-widgets.tsx`; the stats + top-unis widgets were deleted 2026-06-11) |
| `UpgradeCommunityAccessCard` | `components/community/upgrade-community-access-card.tsx` | Three variants: `panel` (unused since 2026-06-11), `inline` (compact), `input` (slim strip — used at top of page + as composer replacement pattern) |
| `SubscriberOnly` + context | `components/community/subscriber-only.tsx`, `subscription-context.tsx` | `<SubscriberOnly fallback={...}>{...}</SubscriberOnly>` reads from React context |
| `SubscriptionDevToggle` | `components/community/subscription-dev-toggle.tsx` | Floating bottom-right button to flip the cookie via Server Action |
| `VerifiedBadge` + `RoleBadge` + `UserAvatar` | `verified-badge.tsx` / `role-badge.tsx` / `user-avatar.tsx` | Small primitives |

## Data layer (mock)

`lib/community/types.ts` — TypeScript types. Identical shapes to what the
Supabase tables will use when we migrate (only the persistence story
changes).

`lib/community/fake-data.ts` exports:

- `FAKE_USERS` — 26 users: 8 campus responsibles + 5 verified students +
  5 alumni + 5 applicants + 2 prospects. Names use Turkish-first / EU
  characters (Ayşe, Pınar, Ömer, Lara, Helena, Marta…).
- `RICH_UNIVERSITY_GROUPS` — hand-written group seeds for 8 universities:
  Politecnico di Milano, Bocconi, TU Delft, Amsterdam, TUM, KU Leuven,
  Bologna, ETH Zürich. Each includes a description, member count, verified
  count, latest-discussion preview, and one or more campus responsibles.
- `FAKE_REVIEWS` — 12 reviews across the 8 rich unis.
- `FAKE_QUESTIONS` — 8 popular questions tied to specific universities.
- `FAKE_MESSAGES_BY_GROUP` — sample chat threads for the 3 most active rich
  groups (Polimi, Bocconi, TU Delft).

`lib/community/generate-groups.ts` exports:

- `generateUniversityGroup(uni)` — returns the rich seed if it exists,
  otherwise generates a stub with a deterministic member count + activity
  level (seeded from the slug hash so refreshes don't reshuffle).
- `generateProgramGroup(program, universityName)` — generates a stub for
  every program. Round-robin assigns one fallback responsible.
- `generateCommunityGroups(universities, programs, names)` — convenience
  entry point used by the page Server Component.

The page Server Component (`app/community/page.tsx`) reads the live catalog
from Supabase (universities + programs) and feeds it into the generator, so
group coverage scales with the real catalog. 58 unis + 196 programs →
254 groups total. The UI renders the first 24 filtered groups and shows a
"refine filters to narrow" hint when there are more.

## Subscription model

The community subscription **is** the Premium tier (unified 2026-06-11 —
see `docs/features/premium.md`). `lib/community/subscription.ts` is a thin
delegate over `lib/premium/premium.ts` (`edfind_premium` cookie); the page
reads it server-side, passes it to `SubscriptionProvider`, and components
consume it via `useSubscription()`.

**Why a cookie:** Stripe isn't wired yet (Phase 10). When billing arrives,
the cookie becomes irrelevant — entitlement comes from `profiles.tier`. The
`SubscriberOnly` component and `useSubscription` hook don't change; only
the value source does.

The floating `SubscriptionDevToggle` flips the cookie via the
`toggleSubscriptionAction` Server Action. It reloads the page after toggling
so server-rendered branches re-evaluate.

**Critical note from CLAUDE.md:** "Don't ship a tier check only in JS — must
also be in Supabase RLS." This page currently makes no DB-write actions —
everything is read or local. When messaging becomes persistent, the gate
must move into the Server Action + RLS, not just the React context.

## University verification model (2026-06-05)

A second, independent gate on top of subscription: **write access requires a
verified university email** (see `docs/features/university-verification.md`
for the full flow, table, and domain rules). Reading never requires it.

- Server: `app/community/page.tsx` reads `getUniversityVerification(user.id)`
  and passes it to `CommunityClient`, which wraps the tree in
  `VerificationProvider` (nested inside `SubscriptionProvider`).
- Client: `useVerification()` → `{ verification, canWrite }`;
  `<VerifiedWriterOnly fallback={…}>` mirrors `SubscriberOnly`.
- `VerifyUniversityEmailCard` sits in the top "what you can do" row (request
  form / pending notice / verified badge) — moved up from the old sidebar
  because writing anywhere on the page requires it. The chat composer shows
  its compact `variant="input"` for unverified users.

## Gating mechanics today

Two axes, narrowed 2026-06-11: **verification** is the write gate everywhere
(chat, reviews, questions), and **subscription**'s only perk is direct
messaging campus responsibles. Group-chat writing no longer requires a
subscription.

| Element | Unverified | Verified | Note |
|---|---|---|---|
| Hero, filters, tabs, group cards, review reading, helpful button | ✓ | ✓ | public — no account needed to read |
| Group chat modal — read | ✓ | ✓ | |
| Group chat modal — input | `VerifyUniversityEmailCard variant="input"` | textarea + send (local-only state) | subscription gate removed 2026-06-11 |
| Popular questions reply / "Ask a question" / "Write a review" CTAs | verify note | active buttons (stubs) | verifying requires signing in first |
| "Message X" button on responsible cards | — | — | Premium-gated: renders as a "Go Premium" link when not premium |
| Premium dev toggle | shown | shown | non-production only |

Nothing actually persists for write actions yet — the chat input writes to
local React state only. This is intentional for the mock-first scope. When
real community tables land, their INSERT policies must call the no-arg
`public.is_university_verified()` (checks the current `auth.uid()`) so the
write gate is enforced in the database too (the helper already ships in the
verification migration).

## Reference data (shared)

Country and field labels are reused from `components/applications/types.ts`
(`COUNTRY_NAMES`, `FIELD_LABELS`). When the community feature grows beyond
mock data we'll likely move these into a shared `lib/reference/` module.

## Animation choices

- **Page entrance:** `motion.div` fade-up on mount (alongside the global
  `app/template.tsx` route fade).
- **Hero:** staggered headline / chips reveal; the video column scale-fades
  in (autoplay · muted · loop · playsInline).
- **Tabs:** `layoutId` underline that animates between active tabs.
- **Cards:** `motion.article layout` with hover lift; `AnimatePresence` not
  used at this scale (would re-trigger entrance on filter changes).
- **Modal:** bottom-sheet on mobile, centered on desktop. Backdrop fade +
  scale-in motion preset.

## What's intentionally not done

- **Real persistence.** Everything is mock. When we want real, the swap is
  per-component: types are already aligned with how Supabase tables would
  shape these objects.
- **Real subscription / billing.** Stripe lives in Phase 10. Until then the
  cookie dev toggle is the demo affordance.
- **Real messaging.** No realtime, no DB, no moderation. The input in the
  chat modal writes to local state only when the user is "subscribed".
- **Real responsible matching.** Round-robin from a small responsible pool.
  Adding a real "request to become a responsible" flow is its own feature.
- **Verification workflow.** Verified students are hard-coded `verified:
  true`. Real verification (student ID upload, university email, etc.) is
  out of scope for the first cut.
- **Profanity / spam controls.** N/A in mock mode. Add when messages
  persist.
- **Notification routing.** When messages persist, responsibles should be
  paged. Out of scope here.
