// One-shot smoke test for the Phase 3 Supabase setup.
//
// Run from the repo root with:
//   node --env-file=.env.local scripts/check-db.mjs
//
// Verifies that the migration + seed applied cleanly: counts the seeded
// university and program, then prints a small summary. Uses the service-role
// key so RLS doesn't get in the way.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [];
if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (missing.length) {
  console.error(`✗ Missing env vars: ${missing.join(", ")}`);
  console.error("  Make sure .env.local is populated.");
  process.exit(1);
}

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  console.error(`✗ NEXT_PUBLIC_SUPABASE_URL doesn't look like a Supabase URL: ${url}`);
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`→ Connecting to ${url}`);

const checks = [
  { table: "universities", expect: 1 },
  { table: "programs", expect: 1 },
  { table: "profiles", expect: 0 },
  { table: "matches", expect: 0 },
];

let allOk = true;

for (const { table, expect } of checks) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error(`✗ ${table}: ${error.message}`);
    allOk = false;
    continue;
  }

  const ok = count === expect;
  const status = ok ? "✓" : "✗";
  console.log(`${status} ${table.padEnd(15)} count=${count} (expected ${expect})`);
  if (!ok) allOk = false;
}

console.log("");

const uniRes = await supabase
  .from("universities")
  .select("slug, name, country, city, is_partner")
  .eq("slug", "politecnico-di-milano")
  .maybeSingle();

if (uniRes.error) {
  console.error(`✗ universities lookup failed: ${uniRes.error.message}`);
  allOk = false;
} else if (!uniRes.data) {
  console.error("✗ Politecnico di Milano not found in universities");
  allOk = false;
} else {
  console.log("Seeded university:");
  console.log(`  ${uniRes.data.name} (${uniRes.data.city}, ${uniRes.data.country})  is_partner=${uniRes.data.is_partner}`);
}

const progRes = await supabase
  .from("programs")
  .select("slug, name, degree, field_of_study, language, duration_months, tuition_per_year, currency")
  .eq("slug", "msc-management-engineering")
  .maybeSingle();

if (progRes.error) {
  console.error(`✗ programs lookup failed: ${progRes.error.message}`);
  allOk = false;
} else if (!progRes.data) {
  console.error("✗ MSc Management Engineering not found in programs");
  allOk = false;
} else {
  const p = progRes.data;
  console.log("Seeded program:");
  console.log(`  ${p.degree} — ${p.name}`);
  console.log(`  field=${p.field_of_study}  lang=${p.language}  duration=${p.duration_months}mo  tuition=${p.tuition_per_year} ${p.currency}`);
}

console.log("");
if (allOk) {
  console.log("✓ Phase 3 database is healthy.");
  process.exit(0);
} else {
  console.error("✗ One or more checks failed — see above.");
  process.exit(1);
}
