"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";

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
 * Toggle a program in/out of "saved". The shortlist was merged into the
 * applications tracker (2026-06-09): saving a program creates an application at
 * status 'interested' (the first stage); un-saving deletes that application.
 * "Saved" therefore means "this program is in your applications". The Save
 * button and the old Track button are now the same action.
 */
export async function toggleSavedProgram(
  rawInput: unknown,
): Promise<ToggleResult> {
  const t = await getTranslations("results.save.errors");
  const parsed = ToggleInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };
  const { clientId, programId } = parsed.data;

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInRequired"),
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
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_id", programId)
    .maybeSingle();

  if (existing.data) {
    const del = await supabase
      .from("applications")
      .delete()
      .eq("id", existing.data.id);
    if (del.error) {
      console.error("[toggleSavedProgram] delete failed", del.error);
      return { ok: false, error: t("updateFailed") };
    }
    revalidatePath("/applications");
    revalidatePath("/shortlist");
    return { ok: true, saved: false };
  }

  const ins = await supabase.from("applications").insert({
    client_id: clientId,
    user_id: user.id,
    program_id: programId,
    status: "interested",
  });
  if (ins.error) {
    // A concurrent save (another tab) already created the row — the unique
    // (user_id, program_id) index rejects the duplicate. Treat as saved.
    if ((ins.error as { code?: string }).code === "23505") {
      return { ok: true, saved: true };
    }
    console.error("[toggleSavedProgram] insert failed", ins.error);
    return { ok: false, error: t("saveFailed") };
  }
  revalidatePath("/applications");
  revalidatePath("/shortlist");
  return { ok: true, saved: true };
}
