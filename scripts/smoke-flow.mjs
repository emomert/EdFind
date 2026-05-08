// DB-layer smoke test for the Phase 4 submission flow.
//
// Run from the repo root with:
//   node --env-file=.env.local scripts/smoke-flow.mjs
//
// What it does:
//   1. Generates a fake client_id (UUID).
//   2. Inserts a profile with a representative answers blob.
//   3. Looks up the seeded program (msc-management-engineering).
//   4. Inserts a match row pointing at it.
//   5. Reads the joined profile + program + university back via separate
//      queries (mirroring app/results/[matchId]/page.tsx).
//   6. Deletes the test profile and match (cascades clean it up).
//   7. Confirms profiles and matches are back to 0.
//
// This does NOT exercise the Next.js Server Action runtime (cookies, Zod) —
// for that, run `npm run dev` and submit the quiz in a browser.

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`→ Connecting to ${url}`);

const clientId = randomUUID();
const sampleAnswers = {
  destinations: ["IT", "NL"],
  field_of_study: "business_management",
  budget_per_year: "10-15k",
  duration_preference: "24mo",
  english_level: "advanced",
  scholarship_need: "helpful",
  career_goal: "work_in_europe",
};

let profileId = null;
let matchId = null;
let allOk = true;

try {
  // 1. Insert profile.
  const profileRes = await supabase
    .from("profiles")
    .insert({
      client_id: clientId,
      answers: sampleAnswers,
      answers_version: 1,
      tier: "free",
    })
    .select("id, client_id, answers_version")
    .single();

  if (profileRes.error || !profileRes.data) {
    throw new Error(`profile insert: ${profileRes.error?.message ?? "no row"}`);
  }
  profileId = profileRes.data.id;
  console.log(`✓ inserted profile  id=${profileId}  answers_version=${profileRes.data.answers_version}`);

  // 2. Look up the seeded program.
  const programRes = await supabase
    .from("programs")
    .select("id, slug, name")
    .eq("slug", "msc-management-engineering")
    .maybeSingle();

  if (programRes.error || !programRes.data) {
    throw new Error("seeded program msc-management-engineering not found");
  }
  console.log(`✓ found program     ${programRes.data.name}`);

  // 3. Insert match.
  const matchRes = await supabase
    .from("matches")
    .insert({
      profile_id: profileId,
      program_id: programRes.data.id,
    })
    .select("id")
    .single();

  if (matchRes.error || !matchRes.data) {
    throw new Error(`match insert: ${matchRes.error?.message ?? "no row"}`);
  }
  matchId = matchRes.data.id;
  console.log(`✓ inserted match    id=${matchId}`);

  // 4. Replay the results-page read path: match → profile → program → university.
  const replayMatch = await supabase
    .from("matches")
    .select("id, profile_id, program_id")
    .eq("id", matchId)
    .single();
  if (replayMatch.error || !replayMatch.data) throw new Error("replay match read failed");

  const replayProfile = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", replayMatch.data.profile_id)
    .single();
  if (replayProfile.error || !replayProfile.data) throw new Error("replay profile read failed");

  if (replayProfile.data.client_id !== clientId) {
    throw new Error("client_id mismatch on replay");
  }
  console.log(`✓ authorization     client_id matches`);

  const replayProgram = await supabase
    .from("programs")
    .select("name, university_id")
    .eq("id", replayMatch.data.program_id)
    .single();
  if (replayProgram.error || !replayProgram.data) throw new Error("replay program read failed");

  const replayUniversity = await supabase
    .from("universities")
    .select("name, city, country")
    .eq("id", replayProgram.data.university_id)
    .single();
  if (replayUniversity.error || !replayUniversity.data) throw new Error("replay university read failed");

  console.log(
    `✓ joined read       ${replayProgram.data.name} @ ${replayUniversity.data.name} (${replayUniversity.data.city}, ${replayUniversity.data.country})`,
  );
} catch (err) {
  console.error(`✗ flow failed: ${err.message}`);
  allOk = false;
} finally {
  // 5. Cleanup. Match has ON DELETE CASCADE on profile_id, but we delete
  // explicitly to keep the test self-contained.
  if (matchId) {
    const { error } = await supabase.from("matches").delete().eq("id", matchId);
    if (error) {
      console.error(`✗ match cleanup: ${error.message}`);
      allOk = false;
    } else {
      console.log(`✓ cleaned up match  id=${matchId}`);
    }
  }
  if (profileId) {
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);
    if (error) {
      console.error(`✗ profile cleanup: ${error.message}`);
      allOk = false;
    } else {
      console.log(`✓ cleaned up profile id=${profileId}`);
    }
  }
}

// 6. Confirm baseline state restored.
const { count: profilesCount } = await supabase
  .from("profiles")
  .select("*", { count: "exact", head: true });
const { count: matchesCount } = await supabase
  .from("matches")
  .select("*", { count: "exact", head: true });

console.log("");
console.log(`baseline after cleanup: profiles=${profilesCount}  matches=${matchesCount}`);

if (allOk && profilesCount === 0 && matchesCount === 0) {
  console.log("✓ Phase 4 DB flow is healthy.");
  process.exit(0);
} else {
  console.error("✗ Phase 4 flow check failed — see above.");
  process.exit(1);
}
