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

const SubmitInputSchema = z.object({
  clientId: z.string().uuid(),
  answers: AnswersSchema,
});

export type SubmitInput = z.infer<typeof SubmitInputSchema>;

export type SubmitResult =
  | { ok: true; matchId: string }
  | { ok: false; error: string };

const SEEDED_PROGRAM_SLUG = "msc-management-engineering";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Persist a quiz submission, run the placeholder matcher, and return a
 * `matchId` the client can redirect to. All DB work uses the service-role
 * client because:
 *   - profiles RLS denies anon SELECT (we authorize via cookie in Phase 4)
 *   - matches table has no client policies (MVP)
 *
 * The seeded Politecnico di Milano program is the only match returned today.
 * The real matcher arrives once we have multiple universities and signal data.
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

  const programLookup = await supabase
    .from("programs")
    .select("id")
    .eq("slug", SEEDED_PROGRAM_SLUG)
    .maybeSingle();

  if (programLookup.error || !programLookup.data) {
    console.error("[submitProfile] seeded program missing", programLookup.error);
    return {
      ok: false,
      error: "Our program catalog isn't ready yet. Please try again shortly.",
    };
  }

  const matchInsert = await supabase
    .from("matches")
    .insert({
      profile_id: profileInsert.data.id,
      program_id: programLookup.data.id,
    })
    .select("id")
    .single();

  if (matchInsert.error || !matchInsert.data) {
    console.error("[submitProfile] match insert failed", matchInsert.error);
    return { ok: false, error: "Couldn't run the matcher. Please try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(CLIENT_ID_COOKIE, clientId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });

  return { ok: true, matchId: matchInsert.data.id };
}
