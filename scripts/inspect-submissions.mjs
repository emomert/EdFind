// One-off: inspect submitted profiles to confirm the live deploy worked.
// Run with: node --env-file=.env.local scripts/inspect-submissions.mjs

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data, error } = await supabase
  .from("profiles")
  .select("id, client_id, answers_version, created_at, answers")
  .order("created_at", { ascending: false });

if (error) {
  console.error(error);
  process.exit(1);
}

for (const p of data) {
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
  console.log("");
}
