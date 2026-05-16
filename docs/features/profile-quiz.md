# Feature: Profile Quiz

The "Build Your Study Profile" flow — the structured 9-question entry path into matching. The free-text "AI Search" entry is a separate feature, deferred.

## Goal

Collect enough structured signal about a student's preferences in ≤ 2 minutes so the matcher can return a small, relevant set of master's-program candidates.

## User journey

1. From the landing page, the user clicks **Profile Quiz** (or `/quiz`).
2. They answer 9 questions, one per screen, with a progress indicator.
3. They see a "Creating your profile…" loading screen while the server stores the profile and runs the matcher.
4. They land on the results page (`/results/:matchId`) with their best matches.

## Question schema (v2)

`answers_version: 2` (bumped 1→2 in Phase 8 when `academic_focus` and `work_experience` were added). v1 profiles in the DB still validate at read time because we never destructive-migrate quiz data.

| # | Question | Field | Type | Notes |
|---|---|---|---|---|
| 1 | _"Which destination feels right for your master's journey?"_ | `destinations` | array of country codes | Multi-select. Options: IT, NL, DE, GB, ES, FR, CH, SE, DK, IE, plus "ANY" (No preference). |
| 2 | _"What field of study are you drawn to?"_ | `field_of_study` | enum | Single-select. Uses the taxonomy in `data-model.md`. |
| 3 | _"What's your budget per year?"_ | `budget_per_year` | enum bracket | `<10k`, `10-15k`, `15-20k`, `20-25k`, `25k+`, `flexible`. Stored as the bracket label, not a number. |
| 4 | _"How long do you want your program to be?"_ | `duration_preference` | enum | `12mo`, `18mo`, `24mo`, `flexible`. |
| 5 | _"What's your English level?"_ | `english_level` | enum | `intermediate`, `upper-intermediate`, `advanced`, `proficient`. |
| 6 | _"Do you need scholarship support?"_ | `scholarship_need` | enum | `required`, `helpful`, `not_needed`. |
| 7 | _"What's your career goal after graduation?"_ | `career_goal` | enum | `work_in_europe`, `work_internationally`, `return_to_turkey`, `phd_research`, `entrepreneurship`, `unsure`. |
| 8 | _"What style of master's appeals to you?"_ (added v2) | `academic_focus` | enum | `research`, `applied`, `balanced`. Lets the matcher distinguish PhD-track research masters from job-oriented professional masters. |
| 9 | _"How much full-time work experience do you have?"_ (added v2) | `work_experience` | enum | `none`, `1-2_years`, `3-5_years`, `5_plus_years`. Some programmes (LBS MiM, MBA-style options) prefer 1-3+ years; helps the matcher avoid recommending experience-required programmes to fresh grads. |

The schema is **versioned** (`answers_version`). When we add or change a question, we bump the version and keep old answers as-is — never destructive-migrate quiz data.

## UI requirements

- One question per screen, large illustrated answer cards (per the design's question-1 mockup).
- Sticky progress bar showing _"Question N of 9"_ and percentage complete.
- Back button on every screen except the first.
- Mascot character in the corner with light supportive copy ("There's no right or wrong answer — just what feels right for you!").
- Mobile: cards stack vertically, full-width tap targets ≥ 48px.
- Keyboard: tab through options, Enter or Space to select, Enter on the Next button to advance.

## State management

- All nine answers held in client state during the quiz — no server roundtrip per question.
- A draft is also persisted to `localStorage` under `edfind:quiz_draft:v1` so a refresh doesn't lose progress.
- On submit, the client posts the full answers object to a Server Action `submitProfile(answers)`.

## Server flow on submit

1. Sign-in is required (`/quiz` is auth-gated since Phase 9.4) — unauthenticated visitors are redirected to `/login?next=/quiz`.
2. Validate answers against the v2 `AnswersSchema` (Zod). Reject if any required key is missing or unknown.
3. Generate a `client_id` if the browser doesn't already have one (UUIDv4, persisted to localStorage and a signed cookie). The same `client_id` survives sign-in via the auth callback's `attach_anon_rows_to_user` RPC.
4. Insert into `profiles` with `tier='free'`, `answers_version=2`, the validated `answers` blob, the `client_id`, and the authenticated `user_id`.
5. Run the real DeepSeek V4 Flash matcher (see `docs/features/ai-matcher.md`) over the full catalog and return the top 3.
6. Insert one row per match into `matches`, each with its score and rationale.
7. Return `{ matchId }` for the highest-scoring match.
8. Client navigates to `/results/:matchId`.

The shared backend for `/quiz` and `/search` lives in `lib/server/persist-and-match.ts` — both entry paths converge there once they have a `ValidatedAnswers` object.

## Loading / results transition

- Show the "Creating your profile…" screen for at least 1.2s (UX preference per the design — even if the server returns instantly, the staged "Reading preferences → Searching database → Preparing results" sequence should play through).
- If the server returns an error, surface a retryable error state, do **not** silently send the user to an empty results page.

## Accessibility

- Each option card is a labeled radio (or checkbox for Q1) inside a `<fieldset>` with a `<legend>` that contains the question text.
- Mascot illustration is `aria-hidden`.
- Progress bar has `role="progressbar"` with `aria-valuenow`/`aria-valuemax`.

## Implementation map (Phase 2 + Phase 4)

| Concern | File |
|---|---|
| Question definitions, TS types, `ANSWERS_VERSION`, Zod validator, draft storage key | `lib/quiz/schema.ts` |
| Client state machine, draft persistence, submission timing, error retry | `components/quiz/quiz-client.tsx` |
| `getOrCreateClientId()` (UUID in localStorage) + `CLIENT_ID_COOKIE` name | `lib/quiz/client-id.ts` |
| Sticky progress bar (`role="progressbar"`) | `components/quiz/progress-bar.tsx` |
| Mascot character + supportive copy | `components/quiz/mascot.tsx` |
| Single answer card (radio/checkbox) | `components/quiz/answer-card.tsx` |
| Per-question screen layout (fieldset/legend, back/next) | `components/quiz/question-screen.tsx` |
| Staged "Reading preferences → Searching database → Preparing results" | `components/quiz/loading-screen.tsx` |
| Route shell (Server Component) | `app/quiz/page.tsx` |
| `submitProfile(input)` Server Action — Zod validate, insert profile, run placeholder matcher, insert match, set httpOnly client_id cookie | `app/quiz/actions.ts` |
| Real results page (cookie-authorized read of match → profile → program → university) | `app/results/[matchId]/page.tsx` |

Loading-screen timing: the staged sequence and the Server Action run in parallel. The client uses `Promise.all([sequencePromise, submitProfile(...)])`, so even if the Server Action returns instantly the user still sees the full ~1.5s animation. On error, the quiz transitions to an inline error state with a "Try again" button.

## Out of scope for MVP

- Persisting answers across devices (needs auth).
- Resuming a quiz from a saved draft on a different browser.
- Branching logic (different next questions based on previous answers).
- AI-suggested follow-up questions.
- Free-text "AI Search" entry path (separate feature).

## Open questions

- Do we want a "skip this question" option for any of the 7? Current default: all required.
- Should "career_goal" be multi-select? The design shows single-select; revisit once we have real signal data on what matters.
