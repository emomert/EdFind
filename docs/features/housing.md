# Feature: Housing & cost of living

City- and university-level student housing information, shown on the university
and program detail pages. Gated by `NEXT_PUBLIC_ENABLE_HOUSING` (default on).

## What it shows

A "Housing & cost of living" section, structured as a **summary + expandable
detail** (2026-06-10) so the page leads with the numbers and tucks the depth
behind a disclosure:

- **Summary (always visible):** the headline monthly rent ranges — room in a
  shared flat, studio, student housing — plus living costs (ex-rent).
- **Detail (collapsed `<details>` "See the full housing breakdown"):**
  - **Where students live** — a few neighborhoods with one-line notes.
  - **University accommodation** — whether the university offers housing, the
    housing-office link, typical on-campus / near-campus monthly costs, commute.
  - **Where to look** — the portals/offices students actually use.
  - **Deposits & tips**, plus **sources** and a "researched on" date with an
    explicit "estimates, not quotes" disclaimer.

**Euro equivalents (2026-06-10):** every non-EUR figure (CHF for Swiss
universities, GBP for the UK, SEK/NOK/DKK/CZK/PLN, …) carries an approximate
`≈ €…` conversion alongside the local price, using the shared FX table in
`lib/format/currency.ts` (`eurEquivalent()`) — the same convention as the
tuition formatter. Local prices stay primary (you pay them locally); euros are
the at-a-glance number for the Turkish audience.

The section is a server component; the expander is a native `<details>` element
(no client JS). Program pages inherit their university's city + university
housing.

## Data model

Two tables (see `docs/data-model.md`):
- `housing_cities` — keyed by `(city, country)`, shared across universities in
  the same city.
- `housing_universities` — keyed by `university_id`.

Both carry `sources` (jsonb `[{title,url}]`), `researched_on`, and a
`status` (`draft` | `published`). **Public reads see `published` rows only**
(RLS); all writes go through the service-role key. Money is `numeric(10,2)`
ranges in `currency` (local, e.g. GBP/CHF/EUR).

## How the data is produced (AI research)

1. **Research workflow** (`scripts/` workflow `housing-research-pilot`): fans out
   one subagent per distinct **city** and one per **university**, each doing real
   web research (WebSearch/WebFetch) and returning schema-validated JSON with
   **citations** and a self-reported confidence. The workflow returns
   `{ cities, universities }`.
2. **Import** (`scripts/import-housing.mjs <workflow-output-file> [draft|published]`):
   upserts the JSON into the two tables (on `(city,country)` / `university_id`),
   stamping `researched_on` today. Idempotent — safe to re-run.
3. **Review → publish:** import as `draft`, eyeball quality, then re-import (or
   update) as `published`. The 2026-06-09 pilot covered 8 cities / 10
   universities (top-ranked), imported as published.

### Re-running / expanding

To research more universities, pass them to the workflow (the script also has a
hardcoded pilot list as a fallback) and run the importer against the new output
file. Cost scales with the number of cities + universities (each is one
web-researching agent), so expand in batches.

## Guardrails

- Figures are **ranges**, never single quotes, and always shown with sources +
  a researched-on date + a disclaimer.
- `status` keeps un-reviewed research out of the public UI.
- No personal data; this is reference content.
