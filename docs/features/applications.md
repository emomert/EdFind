# Feature: Application tracker

The `/applications` dashboard. Started life in Phase 9.3 as a 4-column Kanban
of applications; redesigned 2026-05-14 into a richer split-view layout with
its own task board and personalised guidance.

**Shortlist merged in (2026-06-09).** The old separate shortlist is now the
first stage of the tracker: the `SaveButton` (on results / program / university
pages) creates an `applications` row at status `'interested'`, and `/shortlist`
is the `'interested'`-filtered view of the tracker (it still drives `/compare`).
There is no longer a separate `saved_programs` write path or a distinct "Track"
button — Save *is* track. See `docs/data-model.md` (`saved_programs` deprecated).

## Surfaces

| Route | Auth | Renders |
|---|---|---|
| `/applications` | Required | Header card + applications list + task kanban + AI recommendations |
| Program detail pages | n/a | `<SaveButton>` that toggles a program into/out of the tracker (status `'interested'`) |
| `/shortlist` | Required | The `'interested'` view of the tracker; drives `/compare` |

`NEXT_PUBLIC_ENABLE_APPLICATIONS=false` hides every entry point and 404s the
route — keeps the feature cleanly removable.

## Layout

Stacked single column — applications at the top, kanban below, AI panel at
the bottom. Earlier revisions had apps + kanban side-by-side; the user asked
for the stack so each section gets the full width.

```
┌────────────────────────────────────────────────────────────────────┐
│  StudentProgressCard                                               │
│   · avatar · greeting · status badge · target countries · field    │
│   · overall progress bar (computed from per-app status weights)    │
└────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│  ApplicationsOverview                                              │
│   · search + filter + sort (deadline / recent / progress)          │
│   · ApplicationCard rows                                           │
│     · "X / Y tasks" badge (counts linked application_tasks)        │
└────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│  KanbanBoard                                                       │
│   · Branch filter: All tasks · Unassigned · <each application>     │
│   · To Do / Doing / Done columns                                   │
│   · TaskCard:                                                      │
│     · category badge + due date                                    │
│     · linked program chip (with unlink button)                     │
│     · click-to-move (arrow buttons)                                │
│   · Suggestion strip for first-time users                          │
└────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│  AiRecommendationsPanel  — heuristic, no AI call                   │
└────────────────────────────────────────────────────────────────────┘
```

## Component hierarchy

| Component | File | Concern |
|---|---|---|
| `ApplicationsClient` | `components/applications/applications-client.tsx` | Top-level client, owns state for both lists |
| `StudentProgressCard` | `components/applications/student-progress-card.tsx` | Header — greeting, chips, progress bar |
| `ApplicationsOverview` | `components/applications/applications-overview.tsx` | Search + filter + sort + list of `ApplicationCard` |
| `ApplicationCard` | `components/applications/application-card.tsx` | One application row, expandable to edit status/deadline/notes |
| `StatusPill` | `components/applications/status-pill.tsx` | Color-tinted status badge |
| `KanbanBoard` | `components/applications/kanban-board.tsx` | Three columns, new-task draft, suggestion strip |
| `TaskCard` | `components/applications/task-card.tsx` | One task — category badge, due date, move-left/right |
| `AiRecommendationsPanel` | `components/applications/ai-recommendations.tsx` | Renders the heuristic recs |

Shared types live in `components/applications/types.ts`.

## Data model

### `applications` (Phase 9.3)
See `data-model.md` for full schema. RLS service-role only; Server Actions
authorize per request by `user_id = auth.uid()`.

### `application_tasks` (this redesign, 2026-05-14)

```
application_tasks
  id              uuid PK
  user_id         uuid NOT NULL  → auth.users(id) on delete cascade
  application_id  uuid           → applications(id) on delete cascade (nullable)
  title           text NOT NULL
  category        task_category NOT NULL default 'other'
  status          task_status   NOT NULL default 'todo'
  due_at          date
  sort_order      int NOT NULL default 0
  created_at / updated_at
```

Enums:

| Type | Values |
|---|---|
| `task_status` | `todo`, `doing`, `done` |
| `task_category` | `documents`, `language_test`, `writing`, `finance`, `admin`, `other` |

RLS enabled, no client policies — same pattern as `applications`, `saved_programs`,
`profiles`, `matches`. Service-role only via Server Actions.

Forward migration: `supabase/migrations/20260514120000_add_application_tasks.sql`.
Drop migration: `supabase/uninstall/drop_application_tasks.sql` — kept in repo,
NOT auto-applied, run by hand on uninstall.

## Server Actions

All in `app/applications/actions.ts`. Every action:
1. Zod-validates input.
2. Calls `getUser()` — returns `needsAuth: true` if no session.
3. For per-row mutations, loads the row by id and confirms `user_id === auth.uid()`.
4. Mutates via service-role.
5. `revalidatePath("/applications")` on write.

**Application actions:** `toggleTrackedApplication`, `setApplicationStatus`,
`setApplicationNotes`, `setApplicationDeadline`, `removeApplication`,
`resetAllProgress`.

**Task actions:** `createTask`, `updateTask`, `moveTask`, `deleteTask`.

`createTask` and `moveTask` compute `sort_order` as `max(sort_order) + 1`
within the destination column, so cards land at the bottom and a future
drag-and-drop implementation has stable ordering.

## Overall-progress formula

`StudentProgressCard` shows a 0-100% progress bar. Weight per application
status:

| Status | Weight |
|---|---|
| interested | 0.10 |
| drafting | 0.40 |
| submitted / waitlisted | 0.75 |
| accepted / rejected / withdrawn | 1.00 |

`progress = sum(weight per app) / app_count`, rounded to integer percent.

`rejected` and `withdrawn` count as 1.0 because they're closed states — a
rejected application has been worked through and shouldn't drag the average
down forever. The "win rate" view (accepted / submitted) belongs in a later
analytics panel.

## Recommendation engine

`lib/applications/recommendations.ts` is a pure, deterministic function:
`buildRecommendations({ apps, tasks, profile, saved }) → Recommendation[]`.

Rules (each emits at most one card):

| Rule | Fires when |
|---|---|
| `accepted` | At least one app in `accepted` |
| `deadline` | An app deadline lands within 30 days |
| `empty` | Zero tracked applications |
| `kickoff` | All apps still in `interested` |
| `shortlist-gap` | Shortlist - Tracked ≥ 2 |
| `language-test` | No language-test task started or finished |
| `waiting` | ≥ 3 submitted and no acceptances yet |
| `no-tasks` | Has applications but zero tasks |
| `encouragement` | Catch-all closer when nothing is warning-toned |

Output is clipped to 4 cards. Tones (`celebrate / nudge / info / warn`) drive
the panel's gradient tinting.

When the matcher catalog gets real signal data we can replace this with a
DeepSeek call. The function signature is the same shape an AI matcher would
return, so the swap is `recs = await aiRecommend(args)` instead of
`recs = buildRecommendations(args)`.

## Animation choices (Framer Motion)

- **Page entrance:** `applications-client.tsx` and `app/template.tsx` fade-up
  on mount. Template re-runs on every navigation.
- **Header card:** orbs + initials avatar scale-in, headline + chips stagger.
- **Progress bar:** width animates from 0 to target over 0.9s.
- **Cards:** `layout` on `ApplicationCard` and `TaskCard` so reorder /
  status-change animates smoothly. Stagger entrance via `AnimatePresence`.
- **Hover:** subtle `-2px` translate on cards, no scale (keeps content stable).
- **AI panel:** in-view trigger with stagger; the "Personalised" sparkle
  badge pulses 2.5s loop.

## Reset flow

`resetAllProgress` is the dev-only "wipe everything" button at the bottom of
the dashboard. Order of deletions: `application_tasks → applications →
saved_programs → profiles`. The session cookie is preserved so the user can
immediately re-take the quiz.

## Task ↔ application linking ("branching")

Tasks can optionally branch off a specific application:

- **Creating a task:** the draft card has a "No program (general task)"
  dropdown listing every tracked application. Picking one persists
  `application_id` on insert.
- **On the task card:** linked tasks show a teal chip with the program +
  university name. Hover reveals an unlink button that nulls
  `application_id` via `updateTask`.
- **Filtering:** the kanban header has a "Branch:" chip strip — "All tasks",
  "Unassigned", and one chip per tracked application. Each chip shows its
  task count. Picking a non-default branch also pre-fills the application
  link when adding a new task.
- **On the application card:** a "X / Y tasks" badge renders when at least
  one task is linked; turns emerald when all are done.

Tasks that aren't linked to a program stay valid — useful for cross-cutting
prep like "Book IELTS" or "Translate transcript".

## What's intentionally not done

- **Drag-and-drop.** Click-to-move covers the use case; sort_order is in place
  so adding `@dnd-kit/sortable` later is the only change needed.
- **Real AI guidance.** Heuristics are predictable and cheap. Swap for a
  DeepSeek call once we have signal data on what users actually do after
  reading a recommendation.
- **Mobile-specific layout polish.** Kanban columns stack vertically below
  `md`. A horizontally-scrolling carousel would feel nicer on small phones.
  Backlog.
