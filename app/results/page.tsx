import { redirect } from "next/navigation";

import { createServiceClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

// `/results` (no id) is the canonical entry point for "show me my latest
// matches". Finds the signed-in user's newest profile and redirects to the
// top match of that profile. If they have no matches yet, send them to /quiz.
export default async function ResultsIndexPage() {
  const user = await requireUser("/results");
  const supabase = createServiceClient();

  const latestProfileRes = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestProfileRes.data) redirect("/quiz");

  const latestTopMatchRes = await supabase
    .from("matches")
    .select("id")
    .eq("profile_id", latestProfileRes.data.id)
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestTopMatchRes.data) redirect("/quiz");

  redirect(`/results/${latestTopMatchRes.data.id}`);
}
