// Catalog completeness checker.
//
// Run from the repo root with:
//   node --env-file=.env.local scripts/check-catalog-completeness.mjs
//
// Flags catalog rows that would degrade the UX silently:
//   - universities with NULL logo_url   → community + catalog show TC/BU initials
//   - programs with NULL tuition_per_year → renders "Tuition not listed"
//   - programs whose currency isn't in lib/format/currency.ts FX_TO_EUR
//       → native amount shows but the EUR-equivalent tail is suppressed
//
// Exits 0 when everything is clean, 1 when any issue is found. Safe to wire
// into CI or run manually after a subagent has dropped a batch of new rows.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CURRENCY_LIB = resolve(__dirname, "../lib/format/currency.ts");

// ─── Env ────────────────────────────────────────────────────────────────
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const missing = [];
if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (missing.length) {
  console.error(`✗ Missing env vars: ${missing.join(", ")}`);
  console.error("  Make sure .env.local is populated, or pass --env-file.");
  process.exit(1);
}

// ─── Parse FX_TO_EUR keys out of lib/format/currency.ts ─────────────────
// Avoids importing TS at runtime — we only need the supported currency codes,
// which sit in a single object literal.
function readSupportedCurrencies() {
  const text = readFileSync(CURRENCY_LIB, "utf8");
  const match = text.match(/const FX_TO_EUR:\s*Record<string,\s*number>\s*=\s*\{([\s\S]*?)\};/);
  if (!match) {
    console.error("✗ Couldn't find FX_TO_EUR in lib/format/currency.ts");
    process.exit(1);
  }
  const body = match[1];
  const codes = new Set();
  for (const line of body.split("\n")) {
    const m = line.match(/^\s*([A-Z]{3})\s*:/);
    if (m) codes.add(m[1]);
  }
  return codes;
}
const SUPPORTED_CURRENCIES = readSupportedCurrencies();

// ─── Query ──────────────────────────────────────────────────────────────
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`→ Connecting to ${url}`);
console.log(`→ Supported currencies (FX_TO_EUR): ${[...SUPPORTED_CURRENCIES].sort().join(", ")}`);
console.log("");

const [uniRes, progRes] = await Promise.all([
  supabase.from("universities").select("slug, name, country, logo_url"),
  supabase
    .from("programs")
    .select("slug, name, tuition_per_year, currency, university:universities!inner(slug, name)"),
]);

if (uniRes.error) {
  console.error(`✗ universities query failed: ${uniRes.error.message}`);
  process.exit(1);
}
if (progRes.error) {
  console.error(`✗ programs query failed: ${progRes.error.message}`);
  process.exit(1);
}

const unis = uniRes.data ?? [];
const progs = progRes.data ?? [];

// ─── Checks ─────────────────────────────────────────────────────────────
const issues = [];

const missingLogos = unis.filter((u) => !u.logo_url);
if (missingLogos.length > 0) {
  issues.push({
    title: `${missingLogos.length} ${plural(missingLogos.length, "university", "universities")} missing logo_url`,
    rows: missingLogos.map((u) => `  ${u.slug.padEnd(40)} (${u.name}, ${u.country})`),
    remedy:
      "Add a logo URL via scripts/import-logos.mjs (uploads to the\n  " +
      "university-logos storage bucket and updates universities.logo_url).",
  });
}

const missingTuition = progs.filter((p) => p.tuition_per_year == null);
if (missingTuition.length > 0) {
  issues.push({
    title: `${missingTuition.length} ${plural(missingTuition.length, "program", "programs")} missing tuition_per_year`,
    rows: missingTuition
      .slice(0, 20)
      .map((p) => `  ${p.slug.padEnd(48)} (${p.university.name})`),
    truncated: missingTuition.length > 20 ? missingTuition.length - 20 : 0,
    remedy:
      "Populate programs.tuition_per_year + currency. If the program is\n  " +
      "genuinely free, set 0 + 'EUR' rather than leaving NULL.",
  });
}

const unsupported = new Map(); // currency → count
for (const p of progs) {
  if (!SUPPORTED_CURRENCIES.has(p.currency)) {
    unsupported.set(p.currency, (unsupported.get(p.currency) ?? 0) + 1);
  }
}
if (unsupported.size > 0) {
  const list = [...unsupported.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code, n]) => `  ${code}  (${n} ${plural(n, "program", "programs")})`);
  issues.push({
    title: `${unsupported.size} unsupported ${plural(
      unsupported.size,
      "currency",
      "currencies",
    )} in use — EUR equivalents will be hidden`,
    rows: list,
    remedy:
      "Add the currency to lib/format/currency.ts FX_TO_EUR with an\n  " +
      "approximate ECB mid-market rate, and bump RATES_AS_OF.",
  });
}

// ─── Report ─────────────────────────────────────────────────────────────
console.log(`Universities: ${unis.length}`);
console.log(`Programs:     ${progs.length}`);
console.log("");

if (issues.length === 0) {
  console.log("✓ Catalog is complete.");
  console.log("  · every university has a logo_url");
  console.log("  · every program has a tuition + currency");
  console.log("  · every currency has an FX rate for the EUR equivalent");
  process.exit(0);
}

for (const issue of issues) {
  console.log(`✗ ${issue.title}`);
  for (const row of issue.rows) console.log(row);
  if (issue.truncated) console.log(`  … and ${issue.truncated} more`);
  console.log(`  Remedy: ${issue.remedy}`);
  console.log("");
}

console.error(`✗ ${issues.length} ${plural(issues.length, "issue", "issues")} found.`);
process.exit(1);

function plural(n, singular, plural) {
  return n === 1 ? singular : plural;
}
