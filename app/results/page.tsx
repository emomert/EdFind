import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createServiceClient } from "@/lib/supabase/server";
import { CLIENT_ID_COOKIE } from "@/lib/quiz/client-id";

// `/results` (no id) is the canonical entry point for "show me my latest
// matches". Resolves the cookie's client_id, finds their newest profile,
// and redirects to the top match of that profile. If the user has no
// cookie or has never submitted the quiz, send them to /quiz.
export default async function ResultsIndexPage() {
  const cookieStore = await cookies();
  const cookieClientId = cookieStore.get(CLIENT_ID_COOKIE)?.value;
  if (!cookieClientId) redirect("/quiz");

  const supabase = createServiceClient();

  const latestProfileRes = await supabase
    .from("profiles")
    .select("id")
    .eq("client_id", cookieClientId)
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
