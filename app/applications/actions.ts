"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/server";
import { CLIENT_ID_COOKIE } from "@/lib/quiz/client-id";
import { getUser } from "@/lib/supabase/auth";

const APPLICATION_STATUSES = [
  "interested",
  "drafting",
  "submitted",
  "accepted",
  "rejected",
  "waitlisted",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const TrackInputSchema = z.object({
  programId: z.string().uuid(),
  clientId: z.string().uuid(),
});

const SetStatusInputSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(APPLICATION_STATUSES),
});

const SetNotesInputSchema = z.object({
  applicationId: z.string().uuid(),
  notes: z.string().max(2000),
});

const SetDeadlineInputSchema = z.object({
  applicationId: z.string().uuid(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

const RemoveInputSchema = z.object({
  applicationId: z.string().uuid(),
});

const ResetInputSchema = z.object({
  clientId: z.string().uuid(),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; needsAuth?: boolean };

export type TrackResult =
  | { ok: true; tracked: boolean }
  | { ok: false; error: string; needsAuth?: boolean };

async function ensureCookie(clientId: string): Promise<void> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CLIENT_ID_COOKIE)?.value;
  if (!cookieValue) {
    cookieStore.set(CLIENT_ID_COOKIE, clientId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });
  }
}

async function loadApplicationForUser(
  applicationId: string,
  userId: string,
): Promise<{ id: string; user_id: string | null } | null> {
  const supabase = createServiceClient();
  const res = await supabase
    .from("applications")
    .select("id, user_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (res.error || !res.data) return null;
  const row = res.data as { id: string; user_id: string | null };
  if (row.user_id !== userId) return null;
  return row;
}

/**
 * Toggle a program in/out of the tracker. First click adds with default
 * 'interested' status; second click removes the row entirely. Used by the
 * "Track this application" button on the program detail page.
 */
export async function toggleTrackedApplication(
  rawInput: unknown,
): Promise<TrackResult> {
  const parsed = TrackInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to track applications.",
      needsAuth: true,
    };
  }

  await ensureCookie(parsed.data.clientId);
  const supabase = createServiceClient();

  const existing = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_id", parsed.data.programId)
    .maybeSingle();

  if (existing.data) {
    const del = await supabase
      .from("applications")
      .delete()
      .eq("id", existing.data.id);
    if (del.error) {
      console.error("[toggleTrackedApplication] delete failed", del.error);
      return { ok: false, error: "Couldn't untrack this application." };
    }
    revalidatePath("/applications");
    return { ok: true, tracked: false };
  }

  const ins = await supabase.from("applications").insert({
    client_id: parsed.data.clientId,
    user_id: user.id,
    program_id: parsed.data.programId,
    status: "interested",
  });
  if (ins.error) {
    console.error("[toggleTrackedApplication] insert failed", ins.error);
    return { ok: false, error: "Couldn't track this application." };
  }
  revalidatePath("/applications");
  return { ok: true, tracked: true };
}

export async function setApplicationStatus(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = SetStatusInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to update applications.",
      needsAuth: true,
    };
  }

  const app = await loadApplicationForUser(parsed.data.applicationId, user.id);
  if (!app) {
    return { ok: false, error: "Not authorized." };
  }

  const supabase = createServiceClient();
  const upd = await supabase
    .from("applications")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.applicationId);
  if (upd.error) {
    console.error("[setApplicationStatus] update failed", upd.error);
    return { ok: false, error: "Couldn't update status." };
  }
  revalidatePath("/applications");
  return { ok: true };
}

export async function setApplicationNotes(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = SetNotesInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to update applications.",
      needsAuth: true,
    };
  }

  const app = await loadApplicationForUser(parsed.data.applicationId, user.id);
  if (!app) {
    return { ok: false, error: "Not authorized." };
  }

  const supabase = createServiceClient();
  const upd = await supabase
    .from("applications")
    .update({ notes: parsed.data.notes })
    .eq("id", parsed.data.applicationId);
  if (upd.error) {
    console.error("[setApplicationNotes] update failed", upd.error);
    return { ok: false, error: "Couldn't update notes." };
  }
  return { ok: true };
}

export async function setApplicationDeadline(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = SetDeadlineInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to update applications.",
      needsAuth: true,
    };
  }

  const app = await loadApplicationForUser(parsed.data.applicationId, user.id);
  if (!app) {
    return { ok: false, error: "Not authorized." };
  }

  const supabase = createServiceClient();
  const upd = await supabase
    .from("applications")
    .update({ deadline_at: parsed.data.deadline })
    .eq("id", parsed.data.applicationId);
  if (upd.error) {
    console.error("[setApplicationDeadline] update failed", upd.error);
    return { ok: false, error: "Couldn't update deadline." };
  }
  return { ok: true };
}

export async function removeApplication(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = RemoveInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to update applications.",
      needsAuth: true,
    };
  }

  const app = await loadApplicationForUser(parsed.data.applicationId, user.id);
  if (!app) {
    return { ok: false, error: "Not authorized." };
  }

  const supabase = createServiceClient();
  const del = await supabase
    .from("applications")
    .delete()
    .eq("id", parsed.data.applicationId);
  if (del.error) {
    console.error("[removeApplication] delete failed", del.error);
    return { ok: false, error: "Couldn't remove application." };
  }
  revalidatePath("/applications");
  return { ok: true };
}

/**
 * Wipe everything for the current client_id — applications, saved programs,
 * matches, and profiles. Used by the "Reset all progress" testing button on
 * /applications. The cookie itself is left intact so the user stays the same
 * anonymous identity and can immediately re-take the quiz.
 *
 * This is a destructive testing affordance, kept inside the application
 * tracker module because that's where the user asked for it. If the tracker
 * is removed later, this function disappears with it.
 */
export async function resetAllProgress(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = ResetInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in first.",
      needsAuth: true,
    };
  }

  // We also wipe any pre-auth rows still tied to the same client_id (e.g. test
  // data created before sign-in that never got migrated). Either filter is
  // safe — they only touch the caller's own rows.
  const cookieStore = await cookies();
  const cookieClientId = cookieStore.get(CLIENT_ID_COOKIE)?.value;
  const clientIds = [parsed.data.clientId, cookieClientId].filter(
    (v): v is string => Boolean(v),
  );

  const supabase = createServiceClient();

  // matches.profile_id → profiles.id has ON DELETE CASCADE, so deleting the
  // profiles row also clears matches. We touch each other table explicitly
  // so a failure surfaces a clear error.
  const appsByUser = await supabase
    .from("applications")
    .delete()
    .eq("user_id", user.id);
  if (appsByUser.error) {
    console.error("[resetAllProgress] applications failed", appsByUser.error);
    return { ok: false, error: "Couldn't reset progress. Try again." };
  }

  const savesByUser = await supabase
    .from("saved_programs")
    .delete()
    .eq("user_id", user.id);
  if (savesByUser.error) {
    console.error("[resetAllProgress] saved_programs failed", savesByUser.error);
    return { ok: false, error: "Couldn't reset progress. Try again." };
  }

  const profilesByUser = await supabase
    .from("profiles")
    .delete()
    .eq("user_id", user.id);
  if (profilesByUser.error) {
    console.error("[resetAllProgress] profiles failed", profilesByUser.error);
    return { ok: false, error: "Couldn't reset progress. Try again." };
  }

  // Sweep any orphaned anon rows for this client_id too (defensive).
  if (clientIds.length > 0) {
    await supabase
      .from("applications")
      .delete()
      .in("client_id", clientIds)
      .is("user_id", null);
    await supabase
      .from("saved_programs")
      .delete()
      .in("client_id", clientIds)
      .is("user_id", null);
    await supabase
      .from("profiles")
      .delete()
      .in("client_id", clientIds)
      .is("user_id", null);
  }

  revalidatePath("/applications");
  revalidatePath("/shortlist");
  revalidatePath("/results");
  return { ok: true };
}
