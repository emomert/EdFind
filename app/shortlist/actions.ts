"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/server";
import { CLIENT_ID_COOKIE } from "@/lib/quiz/client-id";
import { getUser } from "@/lib/supabase/auth";

const ToggleInputSchema = z.object({
  programId: z.string().uuid(),
  clientId: z.string().uuid(),
});

export type ToggleResult =
  | { ok: true; saved: boolean }
  | { ok: false; error: string; needsAuth?: boolean };

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Toggle a program in/out of the shortlist. Auth is required (Phase 9.4).
 * The client_id is still recorded so seed/test data with no user_id stays
 * valid alongside authenticated rows, but reads filter by user_id.
 */
export async function toggleSavedProgram(
  rawInput: unknown,
): Promise<ToggleResult> {
  const parsed = ToggleInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const { clientId, programId } = parsed.data;

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to save programs.",
      needsAuth: true,
    };
  }

  const cookieStore = await cookies();
  if (!cookieStore.get(CLIENT_ID_COOKIE)) {
    cookieStore.set(CLIENT_ID_COOKIE, clientId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });
  }

  const supabase = createServiceClient();

  const existing = await supabase
    .from("saved_programs")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_id", programId)
    .maybeSingle();

  if (existing.data) {
    const del = await supabase
      .from("saved_programs")
      .delete()
      .eq("id", existing.data.id);
    if (del.error) {
      console.error("[toggleSavedProgram] delete failed", del.error);
      return { ok: false, error: "Couldn't update your shortlist." };
    }
    return { ok: true, saved: false };
  }

  const ins = await supabase.from("saved_programs").insert({
    client_id: clientId,
    user_id: user.id,
    program_id: programId,
  });
  if (ins.error) {
    console.error("[toggleSavedProgram] insert failed", ins.error);
    return { ok: false, error: "Couldn't save program." };
  }
  return { ok: true, saved: true };
}
