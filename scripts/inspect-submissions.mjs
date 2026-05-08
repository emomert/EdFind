// One-off: inspect submitted profiles + their matches to confirm the live
// deploy worked. Run with:
//   node --env-file=.env.local scripts/inspect-submissions.mjs
//
// For each profile shows: answers, plus all matches written for it
// (program, score, rationale). A profile with 1 match and no score/rationale
// was created by the pre-AI placeholder path; a profile with 3 matches +
// scores + rationales went through the DeepSeek V4 Flash matcher.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: profiles, error } = await supabase
  .from("profiles")
  .select("id, client_id, answers_version, created_at, answers")
  .order("created_at", { ascending: false });

if (error) {
  console.error(error);
  process.exit(1);
}

for (const p of profiles) {
  const a = p.answers;
  console.log(`profile ${p.id}`);
  console.log(`  created_at:   ${p.created_at}`);
  console.log(`  client_id:    ${p.client_id}`);
  console.log(`  version:      ${p.answers_version}`);
  console.log(`  destinations: ${JSON.stringify(a.destinations)}`);
  console.log(`  field:        ${a.field_of_study}`);
  console.log(`  budget:       ${a.budget_per_year}`);
  console.log(`  duration:     ${a.duration_preference}`);
  console.log(`  english:      ${a.english_level}`);
  console.log(`  scholarship:  ${a.scholarship_need}`);
  console.log(`  career_goal:  ${a.career_goal}`);

  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select(
      "id, score, rationale, created_at, program:programs(slug, name, university:universities(name, country))",
    )
    .eq("profile_id", p.id)
    .order("score", { ascending: false, nullsFirst: false });

  if (matchErr) {
    console.log(`  matches:      ✗ error: ${matchErr.message}`);
  } else if (!matches || matches.length === 0) {
    console.log(`  matches:      (none)`);
  } else {
    console.log(`  matches:      ${matches.length}`);
    for (const m of matches) {
      const score = m.score == null ? "—" : Number(m.score).toFixed(0);
      const u = m.program?.university;
      console.log(
        `    [${score}] ${m.program?.name ?? "(missing program)"} — ${u?.name ?? "?"} (${u?.country ?? "?"})`,
      );
      if (m.rationale) {
        console.log(`         ↳ ${m.rationale}`);
      }
    }
  }
  console.log("");
}
