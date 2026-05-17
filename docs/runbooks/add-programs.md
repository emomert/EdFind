# Runbook — adding universities and programs

Use this when you (or a subagent) are about to drop a batch of new
universities / programs into the catalog. Following this list keeps the UI
in lock-step with the data: every uni gets a real logo, every program shows
its tuition + an EUR equivalent.

This runbook exists because the DB schema is intentionally permissive
(`universities.logo_url` and `programs.tuition_per_year` are nullable, and
`programs.currency` just defaults to `'EUR'`). A row inserted without those
fields will commit successfully — the symptoms only show up later as TC/BU
initials on community cards, "Tuition not listed" on detail pages, or a
missing EUR equivalent on the catalog chip.

## Before you write the SQL

1. **Decide the slugs.** `universities.slug` is the join key for logos
   and the URL segment for `/universities/[slug]`. Keep them stable —
   lowercase, hyphenated, no trailing whitespace. The convention so far:
   `politecnico-di-milano`, `university-of-edinburgh`,
   `bocconi-school-of-management`.
2. **Find a real logo for every new university.** Wikimedia Commons
   infobox logos (Public Domain / CC) are the source of record. Note the
   direct file URL — you'll feed it through `scripts/import-logos.mjs`
   below.
3. **Tuition + currency for every new program.**
   - `tuition_per_year` is `numeric(10,2)`. Use the annual figure the
     institution publishes for international / non-EU students unless
     otherwise stated.
   - `currency` must be one of the codes in `lib/format/currency.ts`
     `FX_TO_EUR`. As of the last refresh: **EUR, GBP, CHF, SEK, NOK,
     DKK, CZK, PLN**.
   - If a new program is priced in a currency that's not in that table
     (HUF, RON, etc.), add it to `FX_TO_EUR` **in the same PR**, with
     an approximate ECB / xe.com mid-market rate, and bump
     `RATES_AS_OF` to the current `YYYY-MM`.
   - If a program is genuinely free of tuition, write `0` + `'EUR'` —
     don't leave the column NULL.

## Order of operations

1. Insert new universities into `universities`. Include `logo_url` set to
   the Wikimedia (or other) source URL up front. *(Don't rely on
   backfilling logos later — that's how rows slip through with NULL.)*
2. Run `scripts/import-logos.mjs`. It downloads each source URL, uploads
   it to the `university-logos` Supabase Storage bucket as
   `<slug>.{png,svg}`, and rewrites `universities.logo_url` to the
   public storage URL. The original Wikimedia URL is fine on disk but
   the bucket copy is what production should reference (Wikimedia
   blocks hotlinks under load).
3. Insert programs into `programs`. Provide every column the UI consumes
   today: `slug, name, degree, field_of_study, language,
   duration_months, tuition_per_year, currency, application_deadline,
   start_month, description, requirements, qs_subject_rank,
   qs_subject_area`.
4. **Verify before you call it done:**
   ```
   node --env-file=.env.local scripts/check-catalog-completeness.mjs
   ```
   This prints a summary and exits non-zero if **any** of the following
   are true:
   - a university has `logo_url IS NULL`
   - a program has `tuition_per_year IS NULL`
   - a program uses a currency that isn't in `FX_TO_EUR` (the EUR
     equivalent would be silently suppressed)
5. Once it exits 0, you're clear to commit.

## What the checker does NOT cover

- **Logo quality.** It checks that the column is non-null, not that the
  image looks right. Eyeball the new unis on `/catalog` after deploy.
- **Tuition accuracy.** It checks presence, not correctness. Spot-check
  a few rows against the institution's website.
- **Field-of-study enum drift.** `field_of_study` is just a text column;
  if you invent a new value the matcher won't know about it. Use one of
  the existing values from `lib/quiz/schema.ts` `FIELDS_OF_STUDY`.

## When in doubt

Look at how Politecnico di Milano (the seed row) is structured in
`supabase/seed.sql` and copy the shape. It's the canonical example.
