// Import university hero images (from the image-research workflow output) into
// universities.hero_image_url / hero_image_credit / hero_image_source_url.
//
// Usage:
//   node --env-file=.env.local scripts/import-university-images.mjs <output-file>
//
// <output-file> is a workflow task .output file whose `result` is
// { images: [{ university_id, found, image_url, credit, source_url, ... }] }.
// Only rows with found === true and a non-empty image_url are written.

import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("✗ Pass the workflow .output file path as the first argument.");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(file, "utf8"));
let result = raw.result ?? raw;
if (typeof result === "string") result = JSON.parse(result);
const images = result.images ?? [];

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("✗ Missing SUPABASE_DB_URL in .env.local");
  process.exit(1);
}
const client = new pg.Client({ connectionString: dbUrl });
await client.connect();

let n = 0;
let skipped = 0;
for (const im of images) {
  if (!im?.university_id || !im.found || !im.image_url) {
    skipped++;
    continue;
  }
  await client.query(
    `update public.universities
       set hero_image_url = $1,
           hero_image_credit = $2,
           hero_image_source_url = $3,
           updated_at = now()
     where id = $4`,
    [im.image_url, im.credit ?? null, im.source_url ?? null, im.university_id],
  );
  n++;
  console.log(`  ✓ ${im.university_name ?? im.university_id} (${im.confidence ?? "?"})`);
}

await client.end();
console.log(`\nDone. ${n} hero images set, ${skipped} skipped (no free image found).`);
