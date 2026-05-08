"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/server";
import {
  ANSWERS_VERSION,
  AnswersSchema,
  type ValidatedAnswers,
} from "@/lib/quiz/schema";
import { CLIENT_ID_COOKIE } from "@/lib/quiz/client-id";
import {
  matchProgramsToProfile,
  type ProgramForMatching,
} from "@/lib/ai";

const SubmitInputSchema = z.object({
  clientId: z.string().uuid(),
  answers: AnswersSchema,
});

export type SubmitInput = z.infer<typeof SubmitInputSchema>;

export type SubmitResult =
  | { ok: true; matchId: string }
  | { ok: false; error: string };

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Persist a quiz submission, run the DeepSeek-V4-Flash matcher across the
 * whole catalog, write the top 3 matches with scores + rationales, and
 * return the matchId of the highest-scoring match for the client to
 * redirect to.
 *
 * All DB work uses the service-role client because:
 *   - profiles RLS denies anon SELECT (we authorize via cookie at read time)
 *   - matches has no client policies (MVP)
 */
export async function submitProfile(rawInput: unknown): Promise<SubmitResult> {
  const parsed = SubmitInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some answers were missing or unrecognized. Please try again.",
    };
  }

  const { clientId, answers } = parsed.data;
  const supabase = createServiceClient();

  const profileInsert = await supabase
    .from("profiles")
    .insert({
      client_id: clientId,
      answers: answers satisfies ValidatedAnswers,
      answers_version: ANSWERS_VERSION,
      tier: "free",
    })
    .select("id")
    .single();

  if (profileInsert.error || !profileInsert.data) {
    console.error("[submitProfile] profile insert failed", profileInsert.error);
    return { ok: false, error: "Couldn't save your profile. Please try again." };
  }

  const profileId = profileInsert.data.id;

  const programsRes = await supabase
    .from("programs")
    .select(
      `id, slug, name, degree, field_of_study, language, duration_months,
       tuition_per_year, currency, description,
       qs_subject_rank, qs_subject_area,
       university:universities!inner(name, country, city, qs_world_rank, is_partner)`,
    );

  if (programsRes.error || !programsRes.data || programsRes.data.length === 0) {
    console.error("[submitProfile] catalog load failed", programsRes.error);
    return {
      ok: false,
      error: "Our program catalog isn't ready yet. Please try again shortly.",
    };
  }

  const programs: ProgramForMatching[] = programsRes.data.map((row) => {
    // Supabase typing for embedded relations is loose; coerce to our shape.
    const u = (
      row as unknown as {
        university: {
          name: string;
          country: string;
          city: string;
          qs_world_rank: number | null;
          is_partner: boolean;
        };
      }
    ).university;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      degree: row.degree,
      field_of_study: row.field_of_study,
      language: row.language,
      duration_months: row.duration_months,
      tuition_per_year:
        row.tuition_per_year != null ? Number(row.tuition_per_year) : null,
      currency: row.currency,
      description: row.description,
      qs_subject_rank: row.qs_subject_rank,
      qs_subject_area: row.qs_subject_area,
      university_name: u.name,
      university_country: u.country,
      university_city: u.city,
      university_qs_world_rank: u.qs_world_rank,
      university_is_partner: u.is_partner,
    };
  });

  let suggestions;
  try {
    suggestions = await matchProgramsToProfile(answers, programs);
  } catch (err) {
    console.error("[submitProfile] matcher failed", err);
    return { ok: false, error: "Couldn't run the matcher. Please try again." };
  }

  const matchesToInsert = suggestions.map((s) => ({
    profile_id: profileId,
    program_id: s.program_id,
    score: s.score,
    rationale: s.rationale,
  }));

  const matchesInsertRes = await supabase
    .from("matches")
    .insert(matchesToInsert)
    .select("id, score");

  if (
    matchesInsertRes.error ||
    !matchesInsertRes.data ||
    matchesInsertRes.data.length === 0
  ) {
    console.error("[submitProfile] match insert failed", matchesInsertRes.error);
    return { ok: false, error: "Couldn't save your matches. Please try again." };
  }

  const sortedMatches = [...matchesInsertRes.data].sort(
    (a, b) => Number(b.score) - Number(a.score),
  );
  const topMatchId = sortedMatches[0].id;

  const cookieStore = await cookies();
  cookieStore.set(CLIENT_ID_COOKIE, clientId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });

  return { ok: true, matchId: topMatchId };
}
