# EdFind — Verified Student Insights & Community Page Redesign Prompt

You are improving the **EdFind** SaaS platform.

First understand the product context carefully:

- EdFind is a modern AI-powered platform helping Turkish students find master’s programs in Europe.
- Stack: **Next.js 16 App Router + TypeScript + Tailwind CSS + shadcn/ui + Supabase**.
- EdFind already has:
  - Google-auth protected user flows
  - university and program detail pages
  - search and AI matching
  - shortlist and compare features
  - application tracking
- The product is live and should feel like a polished, trustworthy education SaaS product.
- This task focuses on improving the **Community / Verified Student Insights** page.

Your task:

Redesign and extend the **Community** page inspired by the attached reference image, but do **not** blindly copy it.

Instead:

- extract the UX patterns
- preserve EdFind branding
- make the page more useful for students
- add paid-community mechanics
- create realistic fake test data
- keep the design production-ready
- make it responsive

---

# Product Goal

The Community page should help prospective master’s students make better decisions by connecting them with:

- verified students
- alumni
- university-specific communities
- program-specific communities
- EdFind campus responsibles
- real student reviews
- trusted peer-to-peer Q&A

The page should feel like:

> “I can see real student experiences, ask people who study there, and join trusted communities before applying.”

---

# Important New Feature Requirements

## 1. University-Specific and Program-Specific Groups

Every university and every program should have its own dedicated community group.

These groups should feel similar to:

- Facebook Groups
- Reddit communities
- WhatsApp group chats
- Discord channels

But the experience should stay inside EdFind.

Each group should include:

- group name
- university or program logo
- number of members
- number of verified students
- latest discussion preview
- locked/unlocked state
- join button
- message/chat entry button
- short description

Examples:

- `Politecnico di Milano Community`
- `Politecnico di Milano — MSc Management Engineering`
- `Bocconi University Community`
- `Bocconi University — MSc International Management`
- `University of Amsterdam — MSc Business Administration`

The group experience should support two levels:

### Public Preview

All users can see:

- group name
- member count
- short description
- latest topics
- number of verified students
- campus responsible preview

### Subscriber-Only Access

Only subscribed / paid users can:

- send messages
- reply to discussions
- join live group chat
- DM campus responsibles
- access detailed student insights
- participate in program-specific discussions

Non-subscribed users should see a soft paywall CTA:

> “Subscribe to join the conversation and message verified students.”

Do not make the paywall aggressive. It should feel helpful and premium.

---

## 2. Verified Enrolled Student Badge

Users who have already enrolled in a university should have a validated tick next to their username.

This badge should visually communicate:

- verified enrolled student
- real student
- trusted insight

Use a small teal verification badge/icon next to the username.

Examples:

- `Zeynep A. ✓`
- `Emre K. ✓`
- `Selin D. ✓`

The UI should distinguish between:

- verified enrolled student
- alumnus
- applicant
- prospect student
- EdFind campus responsible

Suggested badges:

- `Verified Student`
- `Alumni`
- `Applicant`
- `Prospect`
- `Campus Responsible`

Verified enrolled students and campus responsibles should have the strongest trust indicators.

---

## 3. EdFind Campus Responsible Per University

Every university should have at least one **EdFind Campus Responsible**.

These responsibles can be:

- current university students
- alumni
- trusted ambassadors

Their role:

- answer questions
- guide prospective students
- share practical campus insights
- help students understand the application/student life experience
- provide university-specific support

Each university card/group should show:

- responsible person avatar
- name
- role
- current student or alumni status
- response time estimate
- short intro
- “Message” button

Example:

```txt
EdFind Campus Responsible
Zeynep A.
MSc Management Engineering — Politecnico di Milano
Verified Student
Usually replies within 24h
```

Messaging campus responsibles should be gated behind the paid plan.

For non-subscribed users:

- show the responsible profile
- lock the message button
- show CTA: `Subscribe to message campus responsibles`

For subscribed users:

- message button should open a DM/chat modal or route

---

## 4. Fake Testing Data

For testing purposes, add realistic fake people and campus responsibles to universities and programs.

Create fake data in a structured and reusable way.

Include at least:

- 8 fake verified students
- 5 fake alumni
- 5 fake applicants
- 6 fake campus responsibles
- 10 university groups
- 15 program groups
- 20 sample discussion messages
- 12 student reviews
- 8 popular questions

Use realistic but clearly fake names.

Suggested fake people:

```ts
const fakeCommunityUsers = [
  {
    id: "user_zeynep_a",
    name: "Zeynep A.",
    avatarUrl: "/avatars/zeynep-a.png",
    role: "verified_student",
    university: "Politecnico di Milano",
    program: "MSc Management Engineering",
    verified: true,
    enrolled: true,
    isCampusResponsible: true,
    responseTime: "Usually replies within 24h",
  },
  {
    id: "user_emre_k",
    name: "Emre K.",
    avatarUrl: "/avatars/emre-k.png",
    role: "verified_student",
    university: "Bocconi University",
    program: "MSc Management",
    verified: true,
    enrolled: true,
    isCampusResponsible: true,
    responseTime: "Usually replies within 12h",
  },
  {
    id: "user_selin_d",
    name: "Selin D.",
    avatarUrl: "/avatars/selin-d.png",
    role: "verified_student",
    university: "University of Bologna",
    program: "MSc International Management",
    verified: true,
    enrolled: true,
    isCampusResponsible: false,
  },
  {
    id: "user_luca_v",
    name: "Luca V.",
    avatarUrl: "/avatars/luca-v.png",
    role: "alumni",
    university: "University of Amsterdam",
    program: "MSc Business Administration",
    verified: true,
    enrolled: false,
    isCampusResponsible: true,
    responseTime: "Usually replies within 1 day",
  },
  {
    id: "user_ayse_t",
    name: "Ayşe T.",
    avatarUrl: "/avatars/ayse-t.png",
    role: "applicant",
    university: "KU Leuven",
    program: "MSc Statistics",
    verified: false,
    enrolled: false,
    isCampusResponsible: false,
  },
]
```

Use the fake data only for development/testing. Keep it easy to replace with Supabase data later.

---

# Page Structure

The page should be redesigned into the following sections.

---

# 1. Hero Section

Create a polished hero section for the Community page.

It should include:

- page title
- subtitle
- trust indicators
- student image or illustration area
- soft gradient background
- small verification-themed visual elements

Suggested title:

```txt
Verified Student Insights
```

Suggested subtitle:

```txt
Real experiences from verified students across Europe. Join university and program communities to ask questions, compare experiences, and choose your best path.
```

Trust indicators:

- `Verified only`
- `European focus`
- `Community driven`
- `Campus responsibles`
- `Program-specific groups`

Design style:

- light background
- teal accents
- rounded hero container
- subtle university/campus illustration
- modern SaaS feel

---

# 2. Filters and Search

Add a filter/search card below the hero.

Filters:

- country
- university
- field of study
- program
- verified only toggle
- group type
- sort by

Group type options:

- All
- University Groups
- Program Groups
- Reviews
- Questions

Sort options:

- Most helpful
- Most active
- Most recent
- Most members
- Highest rated

This section should be clean and compact.

---

# 3. Main Content Layout

Use a two-column layout on desktop:

## Left/Main Column

Primary content feed with tabs:

- `Reviews`
- `Groups`
- `Questions`
- `Campus Responsibles`

## Right Sidebar

Community summary widgets:

- Community at a glance
- Top universities discussed
- Popular questions
- Ask the community
- Share your experience
- Upgrade CTA for paid access

On mobile:

- stack sections vertically
- sidebar widgets should move below the main feed
- tabs should become horizontally scrollable if needed

---

# 4. Reviews Feed

Improve the existing verified reviews feed.

Each review card should include:

- avatar
- user name
- verification tick
- badge: Verified Student / Alumni / Applicant
- university
- program
- star rating
- date
- review text
- tags
- helpful count
- comment button
- report button
- optional “Message student” button if subscribed

Review tags examples:

- Career Opportunities
- Peer Network
- Workload
- Affordability
- International Environment
- Support Services
- City Experience
- Course Quality
- Global Network

The review card should feel trustworthy and not anonymous/spammy.

---

# 5. Community Groups

Create a dedicated groups section.

Each group card should include:

- group logo/icon
- group name
- university/program label
- country
- member count
- verified student count
- activity indicator
- latest discussion preview
- campus responsible avatar
- locked/unlocked state
- CTA button

Example group card:

```txt
Politecnico di Milano Community
University Group · Italy
1,248 members · 184 verified students

Latest discussion:
“How hard is finding housing in Milan?”

Campus Responsible:
Zeynep A. ✓

[Preview Group] [Join Chat]
```

For non-subscribed users:

- `Join Chat` button should show locked state
- CTA: `Upgrade to join`

For subscribed users:

- `Join Chat` opens the group chat

Group types:

- university group
- program group

Program group example:

```txt
MSc Management Engineering — Politecnico di Milano
Program Group · Italy
428 members · 72 verified students
```

---

# 6. Group Chat Experience

Create a basic group chat UI concept.

This can be implemented as a modal, drawer, or route.

Group chat should include:

- group header
- member count
- verified student count
- campus responsible shortcut
- message list
- sender avatar
- sender role badge
- verified tick
- timestamp
- message input
- locked input state for non-subscribers

Non-subscriber locked message input:

```txt
Subscribe to send messages in this community.
```

Subscriber message input:

```txt
Ask about applications, housing, workload, scholarships...
```

Message examples:

```txt
Ayşe T.:
Does anyone know if the motivation letter is very important for Polimi?

Zeynep A. ✓:
Yes, especially for Management Engineering. They usually look for a clear academic fit and practical motivation.

Emre K. ✓:
For Bocconi, I would also recommend explaining your international goals clearly.
```

---

# 7. Campus Responsibles Section

Create a section listing EdFind campus responsibles.

Each card should include:

- avatar
- name
- verified tick
- university
- program
- current student or alumni
- country
- languages spoken
- response time
- short intro
- expertise tags
- message button

Example expertise tags:

- Applications
- Housing
- Scholarships
- Student Life
- Career Opportunities
- Visa Process

Example card:

```txt
Zeynep A. ✓
EdFind Campus Responsible
Politecnico di Milano · MSc Management Engineering
Speaks: Turkish, English, Italian
Usually replies within 24h

Can help with:
Applications · Housing · Student Life

[Message Zeynep]
```

Messaging should be paid-plan gated.

---

# 8. Popular Questions

Improve the popular questions area.

Each question should show:

- question text
- university/program context
- reply count
- number of verified replies
- small avatars
- locked/unlocked reply CTA

Example:

```txt
How hard is it to find housing in Milan?
Politecnico di Milano · 32 replies · 8 verified replies
```

---

# 9. Community at a Glance

Create a statistics card showing:

- verified reviews
- verified students
- universities
- program groups
- campus responsibles
- active discussions

Example:

```txt
12,842 Verified Reviews
8,961 Verified Students
254 Universities
1,140 Program Groups
320 Campus Responsibles
4,820 Active Discussions
```

Use visually calm stat cards.

---

# 10. Paid Plan Gating

Add clear subscription-based access control.

Free users can:

- read public review previews
- view group previews
- see campus responsible profiles
- view popular questions
- view limited discussion snippets

Paid subscribers can:

- join group chats
- send messages
- reply to discussions
- DM campus responsibles
- see full verified student insights
- access program-specific communities

Use a reusable gating component:

```tsx
<SubscriberOnly
  fallback={<UpgradeCommunityAccessCard />}
>
  <MessageInput />
</SubscriberOnly>
```

Make sure the gating is enforced:

- in frontend UI
- in server actions / route handlers
- in Supabase RLS policies later

Do not rely only on client-side checks.

---

# 11. Suggested Data Model

Prepare the implementation so it can later connect to Supabase.

Suggested entities:

```ts
type CommunityUserRole =
  | "prospect"
  | "applicant"
  | "verified_student"
  | "alumni"
  | "campus_responsible"

type CommunityGroupType =
  | "university"
  | "program"

type CommunityGroup = {
  id: string
  type: CommunityGroupType
  name: string
  universityId: string
  programId?: string
  country: string
  description: string
  memberCount: number
  verifiedStudentCount: number
  campusResponsibleIds: string[]
  isLockedForFreeUsers: boolean
  latestDiscussionPreview?: string
  activityLevel: "low" | "medium" | "high"
}

type CommunityUser = {
  id: string
  name: string
  avatarUrl?: string
  role: CommunityUserRole
  universityId?: string
  programId?: string
  verified: boolean
  enrolled: boolean
  isCampusResponsible: boolean
  languages?: string[]
  responseTime?: string
  expertiseTags?: string[]
}

type CommunityMessage = {
  id: string
  groupId: string
  userId: string
  message: string
  createdAt: string
  isFromCampusResponsible?: boolean
}

type StudentReview = {
  id: string
  userId: string
  universityId: string
  programId?: string
  rating: number
  review: string
  tags: string[]
  helpfulCount: number
  createdAt: string
}
```

---

# 12. Suggested Component Architecture

Use modular components.

Suggested components:

```txt
CommunityPage
CommunityHero
CommunityFilters
CommunityTabs
ReviewsFeed
ReviewCard
GroupsGrid
CommunityGroupCard
GroupChatModal
GroupChatMessage
CampusResponsiblesSection
CampusResponsibleCard
PopularQuestionsCard
CommunityStatsCard
AskCommunityCard
ShareExperienceCard
UpgradeCommunityAccessCard
SubscriberOnly
VerifiedBadge
RoleBadge
```

Keep components reusable and clean.

---

# 13. UI Design Direction

Use:

- white and very light gray backgrounds
- teal/turquoise accents
- soft gradients
- subtle shadows
- rounded-xl / rounded-2xl cards
- calm borders
- friendly empty states
- small trust badges
- polished SaaS spacing
- modern typography
- subtle Framer Motion transitions

Avoid:

- heavy social media look
- toxic forum feeling
- cluttered Reddit-like density
- aggressive monetization
- dark dashboard style
- generic admin UI

---

# 14. Interaction Details

Add polished micro-interactions:

- hover lift on cards
- active tab underline animation
- subtle fade-in on page load
- smooth modal/drawer open animation
- message input focus state
- locked CTA hover state
- verified badge tooltip
- campus responsible tooltip
- helpful button state change

---

# 15. Empty States

Add friendly empty states.

Examples:

```txt
No reviews yet for this program.
Be the first to share your experience.
```

```txt
This program community is just getting started.
Join now and ask the first question.
```

```txt
Campus responsible coming soon.
Follow this university to get notified.
```

---

# 16. Responsive Behavior

Desktop:

- hero at top
- filters below hero
- main content and sidebar in two columns
- group cards in 2-column grid where possible

Tablet:

- main content remains readable
- sidebar stacks below or becomes narrower

Mobile:

- hero becomes vertical
- filters collapse into dropdown/drawer
- tabs become horizontally scrollable
- cards become full-width
- group chat becomes full-screen modal/drawer
- sidebar widgets move below main content

---

# 17. Output Requirements

Provide the implementation for the redesigned Community page.

Include:

1. improved page structure
2. component hierarchy
3. TypeScript types
4. fake testing data
5. UI implementation
6. paid-plan gated messaging states
7. verified student badges
8. campus responsible cards
9. university and program group cards
10. responsive behavior
11. animation suggestions
12. notes for later Supabase integration

Focus heavily on:

- trust
- community
- verification
- emotional reassurance
- paid access conversion
- clean SaaS aesthetics
- realistic student decision-making needs
- production-quality component structure

---

# Critical Notes

- Do not expose paid features only through client-side gating in the final architecture.
- UI can use fake data for now, but structure it so Supabase can replace it later.
- Every university should be able to have at least one campus responsible.
- Every university and every program should be able to have its own community group.
- Verified enrolled students must show a clear tick next to their username.
- Messaging groups and campus responsibles must be paid-plan gated.
- Keep EdFind’s tone supportive, premium, and student-friendly.
