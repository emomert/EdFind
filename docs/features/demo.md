# Self-playing demo (`/demo`)

A public, ungated, auto-playing walkthrough of the **whole EdFind journey**, built
for the presentation video (2026-06-14). It exists so the core product loop —
discover → quiz → AI match → save → track — can be shown or screen-recorded end to
end without a login, a premium cookie, a DeepSeek key, or a database.

## Phases

`home → quiz → loading → results (+ save) → applications (+ scroll)`, driven by a
single cancellable "director" effect in `components/demo/quiz-autoplay.tsx`. A
fake cursor (`components/demo/demo-cursor.tsx`) performs the two clicks — "Take
the quiz" on the hero, and "Save" on the top match. `prefers-reduced-motion`
collapses every pause. The whole thing runs ~59s at normal motion.

## Fidelity: it renders the real UI

The point is that what's recorded matches production. Wherever a surface can be
mounted without server data, the demo uses the **production component**:

- **Quiz** — the real `components/quiz/question-screen.tsx` for all 14 questions
  (verbatim legends/helpers/options, conditional reveals, the d3 globe, the
  institution combobox), plus the real progress bar, mascot, and
  `QuizLoadingScreen`.
- **Results** — the real `components/results/match-card.tsx`
  (`HeroMatchCard` / `SiblingMatchCard`), so score-bar fills and entrances are
  the production animations. University **logos render for real** (see below).
- **Applications** — the real `components/applications/ApplicationsClient` with
  curated props (`items`/`tasks`/`documents`/`profile`). Its interactive bits
  only call server actions on click, which the demo never triggers.

Two surfaces can't be the real component as-is, so the demo re-renders them
faithfully with static data:

- **Home** — `components/demo/demo-home.tsx` mirrors the homepage hero (copy,
  layout, decor) but with static catalog totals (the real homepage is an async
  server component that queries the DB) and a CTA the cursor can target.
- **Results save control** — `HeroMatchCard` gained an optional `saveSlot` prop
  (a render slot; production passes nothing → the real `SaveButton`). The demo
  passes a server-action-free stand-in so the scripted "save" doesn't fire an
  auth redirect.

## What is scripted

All in `components/demo/demo-data.ts`:

- **Persona + auto-fill** (`STEP_PLANS`, `PERSONA_ANSWERS`) — a recent **Boğaziçi
  University** political-science graduate moving into public policy / IR, needs a
  scholarship, wants an international career. Destinations **Germany + France +
  Netherlands**.
- **Curated top-3** (`DEMO_MATCHES`) — real catalog programs (fields verbatim
  from `supabase/seed.sql`): Hertie School MPP (Berlin, 94), Sciences Po Master
  in Public Policy (Paris, 90), Erasmus Rotterdam MSc Sociology (Rotterdam, 85).
  `university.country` is the 2-letter code because the results card renders it
  raw. `logo_url` points at local copies in `public/demo-logos/` (see below).
- **Applications data** (`DEMO_APPLICATIONS`, `DEMO_TASKS`, `DEMO_PROFILE`,
  `DEMO_DOCUMENTS`, `DEMO_STUDENT`) — the saved Hertie MPP at status
  `interested`, a few board tasks, the persona's profile for the header.

## Logos

`public/demo-logos/{hertie-school,sciences-po,erasmus-university-rotterdam}.svg`
are local copies of the same Wikimedia logos the live catalog stores (sources in
`scripts/logos-manifest.json`). They're checked in so the demo renders real
logos offline — no Supabase storage dependency at record time. (The earlier cut
used `logo_url: null`, which is why the top match showed an "HS" initials tile.)

## Recording knobs

- `/demo` — plays automatically on load, with a small "Demo — plays
  automatically" badge (bottom-left) and a Replay button (bottom-right).
- `/demo?chrome=0` (or `?bare=1`) — hides the badge + Replay for a clean capture.
- `window.__edfindDemoComplete` is set `true` and an `edfind:demo:complete`
  event fires at the end of the applications phase, so an automated recorder
  knows when to stop.

## Recording → MP4

`scripts/record-demo.mjs` produces the video in one command
(`node scripts/record-demo.mjs`): it boots a production server, drives
`/demo?chrome=0` with headless Playwright (1920×1080), records, converts to a
slide-ready H.264 MP4 with ffmpeg, and tears the server down. Output:
`recordings/edfind-quiz-ai-demo.mp4` (gitignored). Playwright is installed
`--no-save` — a throwaway recording utility, not a product dependency.

## Notes / scope

- Presentation asset, not a product surface: `metadata.robots` is `noindex`.
- **Production fix made alongside the demo:** the results header rendered
  "matches**from**" (a dropped space from the `{count} match{…} from` JSX). Fixed
  in both `app/results/[matchId]/page.tsx` and the demo's mirror by composing the
  string in one template literal.
- The results card renders `country` as a raw 2-letter code (e.g. "Berlin, DE")
  while the catalog maps codes to full names — the demo mirrors the results page.
  If that's unified in `match-card.tsx`, update `DEMO_MATCHES` to match.
