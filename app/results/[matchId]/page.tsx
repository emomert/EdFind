import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, RotateCw } from "lucide-react";

import { createServiceClient } from "@/lib/supabase/server";
import { CLIENT_ID_COOKIE } from "@/lib/quiz/client-id";
import { Button } from "@/components/ui/button";
import {
  HeroMatchCard,
  SiblingMatchCard,
  type MatchCardData,
} from "@/components/results/match-card";

export const metadata: Metadata = {
  title: "Your matches",
  description: "Master's programs matched to your profile.",
};

type Params = { matchId: string };

export default async function ResultsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { matchId } = await params;
  const cookieStore = await cookies();
  const cookieClientId = cookieStore.get(CLIENT_ID_COOKIE)?.value;
  if (!cookieClientId) notFound();

  const supabase = createServiceClient();

  const matchRes = await supabase
    .from("matches")
    .select("id, profile_id")
    .eq("id", matchId)
    .maybeSingle();
  if (matchRes.error || !matchRes.data) notFound();

  const profileRes = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", matchRes.data.profile_id)
    .maybeSingle();
  if (profileRes.error || !profileRes.data) notFound();
  if (profileRes.data.client_id !== cookieClientId) notFound();

  // Stale-URL redirect: if the user has retaken the quiz since this match was
  // generated, the URL they landed on points at an old profile. Send them to
  // their newest matches instead so they don't get confused by stale results
  // from a previous session (the canonical confusion that drove the
  // browser-back / "I see Polimi again" bug). Old rows stay in the DB for
  // audit; only the canonical landing URL changes.
  const latestProfileRes = await supabase
    .from("profiles")
    .select("id")
    .eq("client_id", cookieClientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    latestProfileRes.data &&
    latestProfileRes.data.id !== matchRes.data.profile_id
  ) {
    const latestTopMatchRes = await supabase
      .from("matches")
      .select("id")
      .eq("profile_id", latestProfileRes.data.id)
      .order("score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestTopMatchRes.data) {
      redirect(`/results/${latestTopMatchRes.data.id}`);
    }
  }

  const allMatchesRes = await supabase
    .from("matches")
    .select(
      `id, score, rationale,
       program:programs(
         slug, name, degree, field_of_study, language, duration_months,
         tuition_per_year, currency, application_deadline, start_month,
         description, qs_subject_rank, qs_subject_area,
         university:universities(
           slug, name, country, city, website, description, is_partner, qs_world_rank
         )
       )`,
    )
    .eq("profile_id", matchRes.data.profile_id)
    .order("score", { ascending: false, nullsFirst: false });

  if (
    allMatchesRes.error ||
    !allMatchesRes.data ||
    allMatchesRes.data.length === 0
  ) {
    notFound();
  }

  const valid = (allMatchesRes.data as unknown as MatchCardData[]).filter(
    (m) => m.program !== null,
  );
  if (valid.length === 0) notFound();

  const top = valid[0];
  const others = valid.slice(1);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {valid.length} match{valid.length === 1 ? "" : "es"} from a catalog of
          European master&apos;s programs
        </p>
        <Button asChild variant="ghost" size="sm">
          <Link href="/quiz">
            <RotateCw className="size-3.5" />
            Re-take quiz
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <HeroMatchCard match={top} />
      </div>

      {others.length > 0 ? (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Other strong matches
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ranked by overall fit to your profile. Click through for full
            program details.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {others.map((m, i) => (
              <SiblingMatchCard key={m.id} match={m} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-16 flex flex-col items-center gap-3 border-t border-border pt-10 text-center sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
