// Import housing research (from a workflow output file) into the DB.
//
// Usage:
//   node --env-file=.env.local scripts/import-housing.mjs <output-file> [status]
//
// <output-file> is a workflow task .output file whose `result` is
// { cities: [...], universities: [...] } produced by housing-research-pilot.
// [status] is 'draft' (default) or 'published'. researched_on is stamped today.
//
// Idempotent: upserts on (city, country) and (university_id).

import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
const status = process.argv[3] === "published" ? "published" : "draft";
if (!file) {
  console.error("✗ Pass the workflow .output file path as the first argument.");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(file, "utf8"));
let result = raw.result ?? raw;
if (typeof result === "string") result = JSON.parse(result);
const cities = result.cities ?? [];
const universities = result.universities ?? [];

const today = new Date().toISOString().slice(0, 10);
const j = (v) => (v == null ? null : JSON.stringify(v));

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("✗ Missing SUPABASE_DB_URL in .env.local");
  process.exit(1);
}
const client = new pg.Client({ connectionString: dbUrl });
await client.connect();

let cityN = 0;
for (const c of cities) {
  if (!c?.city || !c?.country) continue;
  await client.query(
    `insert into public.housing_cities
       (city, country, currency, rent_room_min, rent_room_max,
        rent_studio_min, rent_studio_max, rent_shared_min, rent_shared_max,
        monthly_living_min, monthly_living_max, student_neighborhoods,
        how_to_find, deposit_norms, tips, sources, researched_on, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16::jsonb,$17,$18)
     on conflict (city, country) do update set
       currency = excluded.currency,
       rent_room_min = excluded.rent_room_min,
       rent_room_max = excluded.rent_room_max,
       rent_studio_min = excluded.rent_studio_min,
       rent_studio_max = excluded.rent_studio_max,
       rent_shared_min = excluded.rent_shared_min,
       rent_shared_max = excluded.rent_shared_max,
       monthly_living_min = excluded.monthly_living_min,
       monthly_living_max = excluded.monthly_living_max,
       student_neighborhoods = excluded.student_neighborhoods,
       how_to_find = excluded.how_to_find,
       deposit_norms = excluded.deposit_norms,
       tips = excluded.tips,
       sources = excluded.sources,
       researched_on = excluded.researched_on,
       status = excluded.status,
       updated_at = now()`,
    [
      c.city, c.country, c.currency ?? "EUR",
      c.rent_room_min ?? null, c.rent_room_max ?? null,
      c.rent_studio_min ?? null, c.rent_studio_max ?? null,
      c.rent_shared_min ?? null, c.rent_shared_max ?? null,
      c.monthly_living_min ?? null, c.monthly_living_max ?? null,
      j(c.student_neighborhoods), j(c.how_to_find),
      c.deposit_norms ?? null, c.tips ?? null, j(c.sources),
      today, status,
    ],
  );
  cityN++;
  console.log(`  city ✓ ${c.city}, ${c.country} (${c.confidence ?? "?"})`);
}

let uniN = 0;
for (const u of universities) {
  if (!u?.university_id) continue;
  await client.query(
    `insert into public.housing_universities
       (university_id, has_dorms, dorm_note, housing_office_url, currency,
        on_campus_monthly_min, on_campus_monthly_max,
        near_campus_monthly_min, near_campus_monthly_max,
        commute_note, tips, sources, researched_on, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14)
     on conflict (university_id) do update set
       has_dorms = excluded.has_dorms,
       dorm_note = excluded.dorm_note,
       housing_office_url = excluded.housing_office_url,
       currency = excluded.currency,
       on_campus_monthly_min = excluded.on_campus_monthly_min,
       on_campus_monthly_max = excluded.on_campus_monthly_max,
       near_campus_monthly_min = excluded.near_campus_monthly_min,
       near_campus_monthly_max = excluded.near_campus_monthly_max,
       commute_note = excluded.commute_note,
       tips = excluded.tips,
       sources = excluded.sources,
       researched_on = excluded.researched_on,
       status = excluded.status,
       updated_at = now()`,
    [
      u.university_id, u.has_dorms ?? null, u.dorm_note ?? null,
      u.housing_office_url ?? null, u.currency ?? "EUR",
      u.on_campus_monthly_min ?? null, u.on_campus_monthly_max ?? null,
      u.near_campus_monthly_min ?? null, u.near_campus_monthly_max ?? null,
      u.commute_note ?? null, u.tips ?? null, j(u.sources), today, status,
    ],
  );
  uniN++;
  console.log(`  uni  ✓ ${u.university_name ?? u.university_id} (${u.confidence ?? "?"})`);
}

await client.end();
console.log(`\nDone. ${cityN} cities, ${uniN} universities imported as '${status}'.`);
