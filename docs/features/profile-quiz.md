# Feature: Profile Quiz

The "Build Your Study Profile" flow — the structured 13-question entry path into matching. The free-text "AI Search" entry is a separate feature, deferred.

## Goal

Collect enough structured signal about a student's preferences in ≤ 2 minutes so the matcher can return a small, relevant set of master's-program candidates.

## User journey

1. From the landing page, the user clicks **Profile Quiz** (or `/quiz`).
2. They answer 13 questions, one per screen, with a progress indicator.
3. They see a "Creating your profile…" loading screen while the server stores the profile and runs the matcher.
4. They land on the results page (`/results/:matchId`) with their best matches.

## Question schema (v4)

`answers_version: 4`. Version history: bumped 1→2 in Phase 8 when `academic_focus` and `work_experience` were added; 2→3 when the optional free-text `additional_context` question was added; **3→4 (2026-06-09)** when `current_situation` and `gpa_range` single-selects and the optional free-text `study_background` question were added, and `english_level` was reframed from CEFR bands to exam-readiness wording. Older profiles in the DB still validate at read time because we never destructive-migrate quiz data — the new fields default to `null` for older payloads (and reframed `english_level` values from earlier versions remain stored as-is).

**Data-layer nullability:** `current_situation` and `gpa_range` are **required in the guided quiz UI** but **nullable at the data layer** (`AnswersSchema`). The `/search` free-text path can't reliably infer them, so we store `null` rather than fabricate a situation or GPA. `study_background` and `additional_context` are optional free-text (`null` when skipped). All other selects are required enums.

| # | Question | Field | Type | Notes |
|---|---|---|---|---|
| 1 | _"Which destination feels right for your master's journey?"_ | `destinations` | array of country codes | Multi-select. 18 destination countries: IT, NL, DE, GB, ES, FR, CH, SE, DK, IE, AT, BE, CZ, EE, FI, NO, PL, PT, plus "ANY" (No preference). |
| 2 | _"What best describes your current situation?"_ (added v4) | `current_situation` | enum | Single-select. `undergraduate`, `recent_graduate`, `working_professional`, `gap_year`, `other`. **UI-required but nullable at the data layer** (null when `/search` can't infer it). |
| 3 | _"What field of study are you drawn to?"_ | `field_of_study` | enum | Single-select. The field they want to study **next** — not necessarily their undergraduate field. Uses the taxonomy in `data-model.md`. |
| 4 | _"What did you study? (optional)"_ (added v4) | `study_background` | free text | **Optional** — the student's undergraduate background in their own words. Bounded to `maxLength` 200 (`STUDY_BACKGROUND_MAX_LENGTH`). Fed to the matcher to judge fit and eligibility; `null` when skipped (and always `null` on the `/search` path). |
| 5 | _"What's your approximate GPA range?"_ (added v4) | `gpa_range` | enum | Single-select. `below_2_0`, `2_0_2_5`, `2_5_3_0`, `3_0_3_5`, `3_5_plus` (roughly a 4.0 scale). **UI-required but nullable at the data layer** (null when `/search` can't infer it). |
| 6 | _"How would you describe your English level?"_ (reframed v4) | `english_level` | enum | Single-select. Reframed from CEFR bands to exam-readiness wording: `exam_ready` ("IELTS/TOEFL ready"), `no_exam_yet` ("Good, but haven't taken an exam yet"), `intermediate` ("Intermediate"), `needs_improvement` ("Need improvement"). |
| 7 | _"What's your budget per year?"_ | `budget_per_year` | enum bracket | `<10k`, `10-15k`, `15-20k`, `20-25k`, `25k+`, `flexible`. Stored as the bracket label, not a number. |
| 8 | _"How long do you want your program to be?"_ | `duration_preference` | enum | `12mo`, `18mo`, `24mo`, `flexible`. |
| 9 | _"Do you need scholarship support?"_ | `scholarship_need` | enum | `required`, `helpful`, `not_needed`. |
| 10 | _"What's your career goal after graduation?"_ | `career_goal` | enum | `work_in_europe`, `work_internationally`, `return_to_turkey`, `phd_research`, `entrepreneurship`, `unsure`. |
| 11 | _"What style of master's appeals to you?"_ (added v2) | `academic_focus` | enum | `research`, `applied`, `balanced`. Lets the matcher distinguish PhD-track research masters from job-oriented professional masters. |
| 12 | _"How much full-time work experience do you have?"_ (added v2) | `work_experience` | enum | `none`, `1-2_years`, `3-5_years`, `5_plus_years`. Some programmes (LBS MiM, MBA-style options) prefer 1-3+ years; helps the matcher avoid recommending experience-required programmes to fresh grads. |
| 13 | _"Anything else we should know? (optional)"_ (added v3) | `additional_context` | free text | **Optional** — the Next button is always enabled, even with empty text. Bounded to `maxLength` 500 (`ADDITIONAL_CONTEXT_MAX_LENGTH`). Fed to the matcher verbatim and quoted back in the rationale (specific labs, family in a city, a switch of discipline — anything multiple-choice would miss). |

The schema is **versioned** (`answers_version`). When we add or change a question, we bump the version and keep old answers as-is — never destructive-migrate quiz data.

## UI requirements

- One question per screen, large illustrated answer cards (per the design's question-1 mockup).
- Sticky progress bar showing _"Question N of 13"_ and percentage complete.
- Back button on every screen except the first.
- Mascot character in the corner with light supportive copy ("There's no right or wrong answer — just what feels right for you!").
- Mobile: cards stack vertically, full-width tap targets ≥ 48px.
- Keyboard: tab through options, Enter or Space to select, Enter on the Next button to advance.

## State management

- All thirteen answers held in client state during the quiz — no server roundtrip per question.
- A draft is also persisted to `localStorage` under `edfind:quiz_draft:v1` so a refresh doesn't lose progress.
- On submit, the client posts the full answers object to a Server Action `submitProfile(answers)`.

## Server flow on submit

1. Sign-in is required (`/quiz` is auth-gated since Phase 9.4) — unauthenticated visitors are redirected to `/login?next=/quiz`.
2. Validate answers against the v4 `AnswersSchema` (Zod). Reject if any required key is missing or unknown; `current_situation` and `gpa_range` are nullable at the data layer, and `study_background` / `additional_context` are optional and default to `null`.
3. Generate a `client_id` if the browser doesn't already have one (UUIDv4, persisted to localStorage and a signed cookie). The same `client_id` survives sign-in via the auth callback's `attach_anon_rows_to_user` RPC.
4. Insert into `profiles` with `tier='free'`, `answers_version=4`, the validated `answers` blob, the `client_id`, and the authenticated `user_id`.
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

- Do we want a "skip this question" option for any of the 11 multiple-choice/select questions? Current default: all required at the UI level (the two free-text questions — `study_background` and `additional_context` — are optional, and `current_situation`/`gpa_range` are nullable at the data layer for the `/search` path).
- Should "career_goal" be multi-select? The design shows single-select; revisit once we have real signal data on what matters.
