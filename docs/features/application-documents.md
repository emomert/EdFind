# Feature: Document studio (AI CV & cover-letter drafting)

Shipped 2026-06-11. A section at the bottom of `/applications` where a signed-in
student drafts a **CV** or a **program-specific cover letter** with AI, then
edits, copies, downloads (`.md`), or deletes the result. Lives inside the
application tracker, so it shares the `NEXT_PUBLIC_ENABLE_APPLICATIONS` flag —
no separate flag.

## Why it exists

The tracker tells students *what* to do ("Write motivation letter" tasks); the
studio helps them *do* it. The cover letter is where most applicants stall, and
a tailored draft grounded in their quiz profile + verified program data is the
highest-leverage AI assist we can offer after matching itself.

## UX

- **Generator card** at the top of the section:
  - Kind toggle: CV / Cover letter.
  - Application picker — for cover letters it's required ("a letter is always
    written for a specific application"); for CVs it defaults to "General CV"
    with an optional tailor-to-program choice.
  - "Your background, in your own words" textarea (max 2000 chars). **Required
    for CVs (min 30 chars)** — a CV from nothing would be pure placeholders;
    optional-but-recommended for cover letters, which can lean on the quiz
    profile + program facts. Turkish input is fine; output is English.
  - A tip nudges profile-less users toward `/quiz` (drafts improve with it,
    it isn't required).
- **Saved documents** list below: one collapsed row per document (kind icon,
  title, linked university, updated date). Opening reveals a monospace
  textarea editor with Save / Copy / Download PDF / Download .md / Delete,
  plus a fixed "review before sending" disclaimer.
- **PDF export** (2026-06-11) — dependency-free print-to-PDF: the markdown is
  rendered to clean A4-styled HTML in a popup (`lib/documents/export.ts`,
  constrained renderer matching only what the prompts emit) and the browser's
  print dialog does the rest. If the draft still contains `[placeholders]`,
  a fill-in panel opens first — values apply **to the PDF only** (the saved
  draft keeps its placeholders; blank fields stay as-is).

New draft rows are prepended client-side from the action's return value — no
refetch round-trip.

## Anti-fabrication contract

Both prompts (exported as `CV_SYSTEM_PROMPT` / `COVER_LETTER_SYSTEM_PROMPT`
from `lib/ai/generate-document.ts`, rendered live on `/technical-report`)
forbid inventing employers, dates, grades, scores, professors, or program
facts. Missing details become bracketed placeholders (`[your.email@example.com]`,
`[Month Year]`). The only program facts the model may use are the catalog
columns we pass it. This is the load-bearing design decision: a fabricated
CV line could end up in a real application.

## Data model

### `application_documents` (2026-06-11)

```
application_documents
  id              uuid PK
  user_id         uuid NOT NULL → auth.users(id) on delete cascade
  application_id  uuid          → applications(id) ON DELETE SET NULL (nullable)
  kind            document_kind NOT NULL  ('cv' | 'cover_letter')
  title           text NOT NULL
  content         text NOT NULL           -- Markdown, user-editable after generation
  user_notes      text                    -- the "highlights" supplied at generation time
  created_at / updated_at
```

`application_id` is **SET NULL** on delete (unlike `application_tasks`'
cascade) — a drafted letter is the student's work product and should survive
untracking the program; the UI just stops showing the program chip.

RLS enabled, no client policies — service-role only via Server Actions, same
pattern as `applications` / `application_tasks`.

Forward migration: `supabase/migrations/20260611120000_add_application_documents.sql`.
Drop script: `supabase/uninstall/drop_application_documents.sql` (not auto-run).

## Server side

All in `app/applications/document-actions.ts` (separate file —
`actions.ts` was already ~580 lines):

| Action | Notes |
|---|---|
| `generateApplicationDocument` | Validates kind/application/highlights → auth → ownership check on the application → loads latest `profiles.answers` (raw jsonb, any schema version) + program facts → `generateDocumentDraft()` → inserts row → returns it. Caps at **30 documents per user**. Typed errors for `AiDisabledError` / `AiTimeoutError`. |
| `updateApplicationDocument` | Title/content patch, ownership via `user_id` filter + returned-row check. |
| `deleteApplicationDocument` | Plain ownership-scoped delete. |

`lib/ai/generate-document.ts` is the AI layer: DeepSeek V4 Flash, thinking
disabled, temperature 0.5, `max_tokens` 2500, **plain-text completion** (no
`response_format`) since the output is a user-editable document, with a
defensive strip of accidental ```` ``` ```` fences.

The raw `profiles.answers` blob is passed to the prompt as-is (any
`ANSWERS_VERSION`), with "fields may be missing or null — treat missing as
unknown" framing, so quiz schema bumps don't break the studio.

## Components

| Component | File | Concern |
|---|---|---|
| `DocumentStudio` | `components/applications/document-studio.tsx` | Generator card + document list, owns nothing global (documents state lifted to `ApplicationsClient`) |
| `DocumentCard` | same file | One row: collapsed summary / expanded editor with Save·Copy·Download·Delete |

Shared types/constants (`DocumentItem`, `DOCUMENT_KIND_LABELS`,
`HIGHLIGHTS_MAX_LENGTH`, `CV_HIGHLIGHTS_MIN_LENGTH`) live in
`components/applications/types.ts` — they can't be exported from the
`"use server"` actions file (Next.js only allows async function exports there).

## What's intentionally not done

- **No PDF layout engine.** PDF export rides the browser print dialog (zero
  dependencies); pixel-perfect templates would need a layout-engine ADR.
- **No regenerate button.** `user_notes` is stored per row precisely so a
  future "regenerate with same notes" is trivial; for now, generate again.
- **No rich-text/markdown preview.** Editing happens in a monospace textarea;
  a preview pane would pull in a markdown renderer dependency for marginal
  benefit at this stage.
- **No per-document AI revision chat** ("make it more formal") — would multiply
  AI spend; revisit with tier billing.
