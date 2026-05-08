// End-to-end matcher smoke test. Replicates the production code path:
//   1. Load the full program catalog from Supabase
//   2. Send catalog + a sample profile to deepseek-v4-flash
//   3. Validate the JSON response and resolve program ids back to names
//
// Run with: node --env-file=.env.local scripts/smoke-matcher.mjs
//
// Useful when something fails inside submitProfile and the actual error
// isn't visible in the UI. The exception this script throws is the same one
// the Server Action's matcher call would have thrown.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  console.error("✗ Missing DEEPSEEK_API_KEY in .env.local");
  process.exit(1);
}

const sampleProfile = {
  destinations: ["ANY"],
  field_of_study: "economics_finance",
  budget_per_year_bracket: "10-15k",
  duration_preference: "flexible",
  english_level: "upper-intermediate",
  scholarship_need: "not_needed",
  career_goal: "return_to_turkey",
  academic_focus: "applied",
  work_experience: "1-2_years",
};

console.log("→ Loading catalog…");
const { data: rows, error: catalogErr } = await supabase
  .from("programs")
  .select(
    `id, slug, name, degree, field_of_study, language, duration_months,
     tuition_per_year, currency, description,
     qs_subject_rank, qs_subject_area,
     university:universities!inner(name, country, city, qs_world_rank, is_partner)`,
  );

if (catalogErr) {
  console.error("✗ Catalog load failed:", catalogErr.message);
  process.exit(1);
}
console.log(`  ${rows.length} programs loaded`);

const programs = rows.map((row) => {
  const u = row.university;
  return {
    id: row.id,
    name: row.name,
    degree: row.degree,
    university: u.name,
    country: u.country,
    city: u.city,
    field: row.field_of_study,
    language: row.language,
    duration_months: row.duration_months,
    tuition_per_year:
      row.tuition_per_year != null ? Number(row.tuition_per_year) : null,
    currency: row.currency,
    qs_world_rank: u.qs_world_rank,
    qs_subject_rank: row.qs_subject_rank,
    qs_subject_area: row.qs_subject_area,
    description: (row.description ?? "").slice(0, 240),
  };
});

const SYSTEM_PROMPT = `You are EdFind's matching engine. EdFind helps Turkish students find master's programs in Europe. Given a student's profile and the full catalog of available programs, return the 3 best-fit programs ranked by overall match.

Output strict JSON in this exact shape, with no markdown, no commentary, no extra keys:

{
  "matches": [
    { "program_id": "<exact UUID from catalog>", "score": 0-100, "rationale": "one sentence, ≤ 200 chars, plain English" },
    ... (3 entries total, ordered highest score first)
  ]
}

Matching rules:
- Hard filters (a program failing any of these should never be in the top 3 unless nothing else qualifies):
  · Destination: if the student's destinations does NOT include "ANY", restrict to programs whose country is in the destinations list.
  · Language: if english_level is "intermediate", prefer programs whose language is "en" with milder language requirements; never recommend a non-English program if the student's English is weak.
  · Budget: "<10k" rules out anything above ~10,000 EUR/year (convert non-EUR rough: 1 GBP ≈ 1.18 EUR, 1 CHF ≈ 1.05 EUR, 1 SEK ≈ 0.09 EUR, 1 DKK ≈ 0.13 EUR). "10-15k" tolerates up to ~15,000 EUR/year. "flexible" applies no budget filter.
  · Duration: respect duration_preference unless "flexible".
- Soft fits: field_of_study match on the program; alignment between career_goal and the program's character (e.g. phd_research → research-oriented programs); ranking prestige (lower QS rank number = better); scholarship_need vs tuition affordability.
- Diversity: if multiple strong candidates exist, prefer 3 substantively different options (different cities or different sub-fields) over 3 near-clones.

Be decisive. Always return exactly 3 matches when the catalog allows it.`;

const userMessage = [
  "Student profile:",
  JSON.stringify(sampleProfile, null, 2),
  "",
  `Program catalog (${programs.length} programs):`,
  JSON.stringify(programs),
  "",
  "Return the top 3 matches as the JSON object specified by the system message.",
].join("\n");

console.log(`→ Calling ${DEEPSEEK_MODEL}…`);
const t0 = Date.now();
const res = await fetch(DEEPSEEK_API_URL, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    temperature: 0.55,
    max_tokens: 3000,
    thinking: { type: "disabled" },
  }),
});
const ms = Date.now() - t0;

if (!res.ok) {
  const text = await res.text().catch(() => "");
  console.error(`✗ ${res.status} ${res.statusText} (${ms}ms)`);
  console.error(`  ${text.slice(0, 600)}`);
  process.exit(1);
}

const json = await res.json();
const content = json.choices?.[0]?.message?.content;
if (!content) {
  console.error(`✗ No content (${ms}ms)`);
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}

console.log(`✓ ${res.status} OK in ${ms}ms`);
console.log(`  usage: in=${json.usage?.prompt_tokens} out=${json.usage?.completion_tokens}`);

let parsed;
try {
  parsed = JSON.parse(content);
} catch {
  console.error(`✗ Non-JSON content: ${content.slice(0, 400)}`);
  process.exit(1);
}

console.log("→ Raw model output:");
console.log(JSON.stringify(parsed, null, 2));

const matches = parsed.matches;
if (!Array.isArray(matches)) {
  console.error("✗ matches is not an array");
  process.exit(1);
}

const validIds = new Set(programs.map((p) => p.id));
console.log("");
console.log("→ Resolved matches:");
for (const m of matches) {
  const program = programs.find((p) => p.id === m.program_id);
  const valid = validIds.has(m.program_id);
  const tag = valid ? "✓" : "✗ HALLUCINATED";
  if (program) {
    console.log(
      `  [${m.score}] ${tag} ${program.name} — ${program.university} (${program.country})`,
    );
    console.log(`         ↳ ${m.rationale}`);
  } else {
    console.log(`  [${m.score}] ${tag} program_id=${m.program_id}`);
    console.log(`         ↳ ${m.rationale}`);
  }
}
