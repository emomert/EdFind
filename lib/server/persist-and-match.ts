import "server-only";

import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";

import { isLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createServiceClient } from "@/lib/supabase/server";
import {
  ANSWERS_VERSION,
  type ValidatedAnswers,
} from "@/lib/quiz/schema";
import { CLIENT_ID_COOKIE } from "@/lib/quiz/client-id";
import { getUser } from "@/lib/supabase/auth";
import {
  matchProgramsToProfile,
  type ProgramForMatching,
} from "@/lib/ai";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type PersistAndMatchResult =
  | { ok: true; matchId: string }
  | { ok: false; error: string; needsAuth?: boolean };

/**
 * Shared backend path for the quiz and free-text search entry points.
 *
 * Inserts the profile, loads the catalog, runs the DeepSeek-V4-Flash matcher,
 * writes the top 3 matches, sets the httpOnly client_id cookie, and returns
 * the matchId of the highest-scoring match. Callers can then redirect to
 * `/results/[matchId]`.
 *
 * All DB work runs as service-role because profiles RLS denies anon SELECT
 * and matches has no client policies (MVP). Authenticated results reads are
 * authorised by `user_id = auth.uid()` (matched in app code and enforced by
 * RLS); the `client_id` cookie set below only feeds the first-sign-in
 * row-attach in app/auth/callback/route.ts, not results-page authorisation.
 */
export async function persistAndMatch(
  clientId: string,
  answers: ValidatedAnswers,
): Promise<PersistAndMatchResult> {
  const [user, t, rawLocale] = await Promise.all([
    getUser(),
    getTranslations("server.errors"),
    getLocale(),
  ]);
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  if (!user) {
    return {
      ok: false,
      error: t("signInRequired"),
      needsAuth: true,
    };
  }

  const supabase = createServiceClient();

  const profileInsert = await supabase
    .from("profiles")
    .insert({
      client_id: clientId,
      user_id: user.id,
      answers,
      answers_version: ANSWERS_VERSION,
      tier: "free",
    })
    .select("id")
    .single();

  if (profileInsert.error || !profileInsert.data) {
    console.error("[persistAndMatch] profile insert failed", profileInsert.error);
    return { ok: false, error: t("profileSaveFailed") };
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
    console.error("[persistAndMatch] catalog load failed", programsRes.error);
    return {
      ok: false,
      error: t("catalogNotReady"),
    };
  }

  const programs: ProgramForMatching[] = programsRes.data.map((row) => {
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
    // The matcher writes its rationale in the student's interface language.
    suggestions = await matchProgramsToProfile(answers, programs, locale);
  } catch (err) {
    console.error("[persistAndMatch] matcher failed", err);
    return { ok: false, error: t("matcherFailed") };
  }

  const matchesToInsert = suggestions.map((s) => ({
    profile_id: profileId,
    program_id: s.program_id,
    score: s.score,
    rationale: s.rationale,
    user_id: user.id,
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
    console.error("[persistAndMatch] match insert failed", matchesInsertRes.error);
    return { ok: false, error: t("matchesSaveFailed") };
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
