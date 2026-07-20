"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";

import { AnswersSchema } from "@/lib/quiz/schema";
import { persistAndMatch } from "@/lib/server/persist-and-match";

const SubmitInputSchema = z.object({
  clientId: z.string().uuid(),
  answers: AnswersSchema,
});

export type SubmitInput = z.infer<typeof SubmitInputSchema>;

export type SubmitResult =
  | { ok: true; matchId: string }
  | { ok: false; error: string; needsAuth?: boolean };

/**
 * Persist a quiz submission, run the DeepSeek-V4-Flash matcher across the
 * whole catalog, write the top 3 matches with scores + rationales, and
 * return the matchId of the highest-scoring match for the client to
 * redirect to.
 */
export async function submitProfile(rawInput: unknown): Promise<SubmitResult> {
  const parsed = SubmitInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const t = await getTranslations("quiz.error");
    return {
      ok: false,
      error: t("validation"),
    };
  }

  return persistAndMatch(parsed.data.clientId, parsed.data.answers);
}
