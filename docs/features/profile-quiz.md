# Feature: Profile Quiz

The "Build Your Study Profile" flow — the structured 13-question entry path into matching. The free-text "AI Search" entry is a separate feature, deferred.

## Goal

Collect enough structured signal about a student's preferences in ≤ 2 minutes so the matcher can return a small, relevant set of master's-program candidates.

## User journey

1. From the landing page, the user clicks **Profile Quiz** (or `/quiz`).
2. They answer 14 questions, one per screen, with a progress indicator.
3. They see a "Creating your profile…" loading screen while the server stores the profile and runs the matcher.
4. They land on the results page (`/results/:matchId`) with their best matches.

## Question schema (v7)

`answers_version: 7`. Version history: bumped 1→2 in Phase 8 when `academic_focus` and `work_experience` were added; 2→3 when the optional free-text `additional_context` question was added; 3→4 (2026-06-09) when `current_situation` and `gpa_range` single-selects and the optional free-text `study_background` question were added, and `english_level` was reframed to exam-readiness wording; **4→5 (2026-06-10)** — the feedback-round-2 overhaul (see below); **5→6 (2026-06-10)** added `english_exam_score` (revealed when `english_level === "certified"`) and made the GPA question a two-step journey (pick scale → enter value; UI-only); **6→7 (2026-06-11)** split the study question — `study_background` now asks ONLY what the student studied, and a new required free-text **`desired_study`** asks what they want to study next (deliberately open-ended: "economics", "political economy of East Asia", or even "I like politics" are all valid; the AI infers `field_of_study` primarily from it). Older profiles in the DB still validate at read time because we never destructive-migrate quiz data — new fields default to `null` for older payloads, and superseded enum values (the old `english_level` / `current_situation` / `career_goal` labels) remain stored as-is.

**What changed in v5:**
- `current_situation` split the overlapping recent-grad/gap-year choices, added `graduating_soon`, and gained a writable **"Other"** companion (`current_situation_other`).
- New **`institution`** question — a searchable Turkish-university picker (`lib/quiz/turkish-universities.ts`) with a first-class free-text fallback. Legend adapts to the situation ("studying at" / "will graduate from" / "graduated from").
- The structured "field you're drawn to" picker was **dropped**. The free-text **`study_background` is now required** and replaces it; the AI infers the structured `field_of_study` (now **nullable**, AI-inferred, no longer asked) from that text + context.
- **GPA is now compound:** `gpa_scale` (grading system) + `exact_gpa` (free-text exact value, any scale) + `gpa_range` (rough 4.0 band). Answered once the student gives an exact value **or** a band.
- `english_level` reframed into professional, CEFR-anchored options: `certified`, `exam_ready`, `advanced`, `upper_intermediate`, `intermediate`, `beginner`.
- `budget_per_year` gained **`tuition_free`** (tuition-free / fully-funded only).
- `career_goal` gained options (`industry_expert`, `career_switch`) and a writable **"Other"** (`career_goal_other`).

**Data-layer nullability:** `current_situation`, `institution`, `study_background`, `desired_study`, `gpa_scale`, `gpa_range`, `exact_gpa`, and `field_of_study` are **nullable at the data layer** (`AnswersSchema`) — several are required in the guided quiz UI, but the `/search` free-text path can't reliably infer them and we store `null` rather than fabricate. `*_other` companions, `english_exam_score`, and `additional_context` are optional free-text. All other selects are required enums.

| # | Question | Field | Type | Notes |
|---|---|---|---|---|
| 1 | _"Which destination feels right for your master's journey?"_ | `destinations` | array of country codes | Multi-select. 18 destination countries plus "ANY" (No preference). |
| 2 | _"What best describes your current situation?"_ | `current_situation` (+ `current_situation_other`) | enum + free-text | `undergraduate`, `graduating_soon`, `recent_graduate`, `gap_year`, `working_professional`, `other`. Selecting "Other" reveals a write-in. **UI-required, nullable at data layer.** |
| 3 | _"Which university are you studying at / will graduate from / did you graduate from?"_ (added v5) | `institution` | free text (searchable picker) | Searchable list of Turkish universities + free-text fallback. Legend adapts to `current_situation`. **UI-required, nullable at data layer.** |
| 4 | _"What did you study?"_ (now required v5; refocused v7) | `study_background` | free text **(required)** | The student's undergraduate background in their own words — ONLY what they studied (the target field moved to `desired_study` in v7). `maxLength` 200. Nullable at the data layer (always `null` on `/search`). |
| 5 | _"What do you want to study?"_ (new v7) | `desired_study` | free text **(required)** | What they want to study next, as open-ended as they like — the helper explicitly invites anything from a single field ("economics") to a precise topic ("political economy of East Asia") to a vague interest ("I like politics"). `maxLength` 300. The AI infers `field_of_study` primarily from this. Nullable at the data layer (always `null` on `/search` — the verbatim query carries the signal there). |
| 6 | _"What's your GPA?"_ (compound v5) | `gpa_scale` + `exact_gpa` + `gpa_range` | enum + free-text + enum | Rendered as a **two-step journey (v6):** pick the grading scale (`4_point`, `100_point`, `5_point`, `10_point`, `ects_letter`, `uk_class`, `other`) → it collapses to a summary → type the exact value (and, on a 4.0 scale only, optionally pick a rough band). Scale is required to advance. **UI-required, nullable at data layer.** |
| 7 | _"How would you describe your English?"_ (reframed v5) | `english_level` (+ `english_exam_score`) | enum + free-text | `certified`, `exam_ready`, `advanced`, `upper_intermediate`, `intermediate`, `beginner` (strongest → weakest). Selecting `certified` reveals a free-text **`english_exam_score`** (v6) for the actual IELTS/TOEFL/Duolingo score. |
| 8 | _"What's your budget per year?"_ | `budget_per_year` | enum bracket | `tuition_free`, `<10k`, `10-15k`, `15-20k`, `20-25k`, `25k+`, `flexible`. `tuition_free` is a hard filter in the matcher. |
| 9 | _"How long do you want your program to be?"_ | `duration_preference` | enum | `12mo`, `18mo`, `24mo`, `flexible`. |
| 10 | _"Do you need scholarship support?"_ | `scholarship_need` | enum | `required`, `helpful`, `not_needed`. |
| 11 | _"What's your goal after the master's?"_ (expanded v5) | `career_goal` (+ `career_goal_other`) | enum + free-text | `work_in_europe`, `return_to_turkey`, `work_internationally`, `phd_research`, `industry_expert`, `career_switch`, `entrepreneurship`, `unsure`, `other`. "Other" reveals a write-in. |
| 12 | _"What style of master's appeals to you?"_ | `academic_focus` | enum | `research`, `applied`, `balanced`. |
| 13 | _"How much full-time work experience do you have?"_ | `work_experience` | enum | `none`, `1-2_years`, `3-5_years`, `5_plus_years`. |
| 14 | _"Anything else we should know? (optional)"_ | `additional_context` | free text | **Optional.** `maxLength` 500. Fed to the matcher verbatim and quoted back in the rationale. |

> `field_of_study` is no longer a direct question. It stays in the answers shape (nullable) and is **inferred by the AI** — since v7 primarily from `desired_study` (quiz) or the verbatim query (`/search`), with `study_background` as supporting signal. Downstream displays (applications header) fall back gracefully when it's `null`.

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
2. Validate answers against the v7 `AnswersSchema` (Zod). Reject if any required key is missing or unknown; `current_situation`, `institution`, `study_background`, `desired_study`, `gpa_*`, and `field_of_study` are nullable at the data layer, and the `*_other` / `additional_context` free-text fields default to `null`.
3. Generate a `client_id` if the browser doesn't already have one (UUIDv4, persisted to localStorage and a signed cookie). The same `client_id` survives sign-in via the auth callback's `attach_anon_rows_to_user` RPC.
4. Insert into `profiles` with `tier='free'`, `answers_version=7`, the validated `answers` blob, the `client_id`, and the authenticated `user_id`.
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
| Turkish-university list + diacritic-folded search (institution picker) | `lib/quiz/turkish-universities.ts` |
| Client state machine, draft persistence, `handlePatch` for compound questions | `components/quiz/quiz-client.tsx` |
| `getOrCreateClientId()` (UUID in localStorage) + `CLIENT_ID_COOKIE` name | `lib/quiz/client-id.ts` |
| Sticky progress bar (`role="progressbar"`) — note: the quiz sound toggle was removed 2026-06-10 and sound now defaults off | `components/quiz/progress-bar.tsx` |
| Mascot character + supportive copy | `components/quiz/mascot.tsx` |
| Single answer card (radio/checkbox) | `components/quiz/answer-card.tsx` |
| Searchable institution combobox (Turkish unis + free-text) | `components/quiz/institution-combobox.tsx` |
| Per-question screen — fieldset/legend, GPA picker, "Other" write-ins, institution/free-text rendering | `components/quiz/question-screen.tsx` |
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

- Do we want a "skip this question" option for the select questions? Current default: every step is required at the UI level except the final `additional_context` free-text (`study_background` and `desired_study` are required, and the institution + GPA steps must be answered to advance; several fields stay nullable at the data layer for the `/search` path).
- Should "career_goal" be multi-select? The design shows single-select; revisit once we have real signal data on what matters.
