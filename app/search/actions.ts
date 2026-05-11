"use server";

import { z } from "zod";

import { parseFreeTextToProfile } from "@/lib/ai/parse-query";
import { persistAndMatch } from "@/lib/server/persist-and-match";
import { getUser } from "@/lib/supabase/auth";

const SearchInputSchema = z.object({
  clientId: z.string().uuid(),
  query: z.string().min(8).max(1000),
});

export type SearchInput = z.infer<typeof SearchInputSchema>;

export type SearchResult =
  | { ok: true; matchId: string; inferredFields: readonly string[] }
  | { ok: false; error: string; needsAuth?: boolean };

/**
 * Free-text entry point: the student types what they're looking for, we ask
 * DeepSeek to map it onto the structured profile shape, then run the same
 * matcher and persistence path the quiz uses.
 *
 * Searches land on `/results/[matchId]` — the same results page as the quiz,
 * since the data shape (profile → top 3 matches) is identical.
 */
export async function searchByText(rawInput: unknown): Promise<SearchResult> {
  const parsed = SearchInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        "Please describe what you're looking for in a bit more detail (at least 8 characters).",
    };
  }

  // Bail before the DeepSeek call if the user isn't authed.
  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to run a search.",
      needsAuth: true,
    };
  }

  let parseResult;
  try {
    parseResult = await parseFreeTextToProfile(parsed.data.query);
  } catch (err) {
    console.error("[searchByText] parser failed", err);
    return {
      ok: false,
      error: "Couldn't understand that query. Try rephrasing or use the quiz.",
    };
  }

  const matchResult = await persistAndMatch(
    parsed.data.clientId,
    parseResult.answers,
  );

  if (!matchResult.ok) return matchResult;

  return {
    ok: true,
    matchId: matchResult.matchId,
    inferredFields: parseResult.inferredFields,
  };
}
