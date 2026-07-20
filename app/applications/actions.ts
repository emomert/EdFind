"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";

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

const TASK_STATUSES = ["todo", "doing", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const TASK_CATEGORIES = [
  "documents",
  "language_test",
  "writing",
  "finance",
  "admin",
  "other",
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

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

const CreateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.enum(TASK_CATEGORIES).default("other"),
  status: z.enum(TASK_STATUSES).default("todo"),
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  applicationId: z.string().uuid().nullable().optional(),
});

const UpdateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  category: z.enum(TASK_CATEGORIES).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  applicationId: z.string().uuid().nullable().optional(),
});

const DeleteTaskSchema = z.object({ id: z.string().uuid() });

const MoveTaskSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(TASK_STATUSES),
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

async function assertOptionalApplicationOwnership(
  applicationId: string | null | undefined,
  userId: string,
): Promise<boolean> {
  if (applicationId === null || applicationId === undefined) return true;
  return (await loadApplicationForUser(applicationId, userId)) !== null;
}

/**
 * Toggle a program in/out of the tracker. First click adds with default
 * 'interested' status; second click removes the row entirely. Used by the
 * "Track this application" button on the program detail page.
 */
export async function toggleTrackedApplication(
  rawInput: unknown,
): Promise<TrackResult> {
  const t = await getTranslations("applications.errors");
  const parsed = TrackInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInToTrack"),
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
      return { ok: false, error: t("untrackFailed") };
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
    return { ok: false, error: t("trackFailed") };
  }
  revalidatePath("/applications");
  return { ok: true, tracked: true };
}

export async function setApplicationStatus(
  rawInput: unknown,
): Promise<ActionResult> {
  const t = await getTranslations("applications.errors");
  const parsed = SetStatusInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInToUpdate"),
      needsAuth: true,
    };
  }

  const app = await loadApplicationForUser(parsed.data.applicationId, user.id);
  if (!app) {
    return { ok: false, error: t("notAuthorized") };
  }

  const supabase = createServiceClient();
  const upd = await supabase
    .from("applications")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id);
  if (upd.error) {
    console.error("[setApplicationStatus] update failed", upd.error);
    return { ok: false, error: t("statusUpdateFailed") };
  }
  revalidatePath("/applications");
  return { ok: true };
}

export async function setApplicationNotes(
  rawInput: unknown,
): Promise<ActionResult> {
  const t = await getTranslations("applications.errors");
  const parsed = SetNotesInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInToUpdate"),
      needsAuth: true,
    };
  }

  const app = await loadApplicationForUser(parsed.data.applicationId, user.id);
  if (!app) {
    return { ok: false, error: t("notAuthorized") };
  }

  const supabase = createServiceClient();
  const upd = await supabase
    .from("applications")
    .update({ notes: parsed.data.notes })
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id);
  if (upd.error) {
    console.error("[setApplicationNotes] update failed", upd.error);
    return { ok: false, error: t("notesUpdateFailed") };
  }
  return { ok: true };
}

export async function setApplicationDeadline(
  rawInput: unknown,
): Promise<ActionResult> {
  const t = await getTranslations("applications.errors");
  const parsed = SetDeadlineInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInToUpdate"),
      needsAuth: true,
    };
  }

  const app = await loadApplicationForUser(parsed.data.applicationId, user.id);
  if (!app) {
    return { ok: false, error: t("notAuthorized") };
  }

  const supabase = createServiceClient();
  const upd = await supabase
    .from("applications")
    .update({ deadline_at: parsed.data.deadline })
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id);
  if (upd.error) {
    console.error("[setApplicationDeadline] update failed", upd.error);
    return { ok: false, error: t("deadlineUpdateFailed") };
  }
  return { ok: true };
}

export async function removeApplication(
  rawInput: unknown,
): Promise<ActionResult> {
  const t = await getTranslations("applications.errors");
  const parsed = RemoveInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInToUpdate"),
      needsAuth: true,
    };
  }

  const app = await loadApplicationForUser(parsed.data.applicationId, user.id);
  if (!app) {
    return { ok: false, error: t("notAuthorized") };
  }

  const supabase = createServiceClient();
  const del = await supabase
    .from("applications")
    .delete()
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id);
  if (del.error) {
    console.error("[removeApplication] delete failed", del.error);
    return { ok: false, error: t("removeFailed") };
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
  const t = await getTranslations("applications.errors");
  const parsed = ResetInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInFirst"),
      needsAuth: true,
    };
  }

  // Collect all client_ids we should sweep for orphaned anon rows (test data
  // created before sign-in that never got migrated).
  const cookieStore = await cookies();
  const cookieClientId = cookieStore.get(CLIENT_ID_COOKIE)?.value;
  const clientIds = Array.from(
    new Set(
      [parsed.data.clientId, cookieClientId].filter(
        (v): v is string => Boolean(v),
      ),
    ),
  );

  // Single transactional RPC — see supabase/migrations/20260516120000_*.
  // matches.profile_id has ON DELETE CASCADE so the profiles delete
  // implicitly clears matches.
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("reset_user_progress", {
    p_user_id: user.id,
    p_client_ids: clientIds,
  });
  if (error) {
    console.error("[resetAllProgress] rpc failed", error);
    return { ok: false, error: t("resetFailed") };
  }

  revalidatePath("/applications");
  revalidatePath("/shortlist");
  revalidatePath("/results");
  return { ok: true };
}

async function loadTaskForUser(
  taskId: string,
  userId: string,
): Promise<{ id: string } | null> {
  const supabase = createServiceClient();
  const res = await supabase
    .from("application_tasks")
    .select("id, user_id")
    .eq("id", taskId)
    .maybeSingle();
  if (res.error || !res.data) return null;
  const row = res.data as { id: string; user_id: string | null };
  if (row.user_id !== userId) return null;
  return { id: row.id };
}

export type CreatedTaskResult =
  | { ok: true; id: string }
  | { ok: false; error: string; needsAuth?: boolean };

export async function createTask(
  rawInput: unknown,
): Promise<CreatedTaskResult> {
  const t = await getTranslations("applications.errors");
  const parsed = CreateTaskSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInToAddTasks"),
      needsAuth: true,
    };
  }

  if (
    !(await assertOptionalApplicationOwnership(
      parsed.data.applicationId ?? null,
      user.id,
    ))
  ) {
    return { ok: false, error: t("notAuthorized") };
  }

  const supabase = createServiceClient();
  // Place new tasks at the end of their column.
  const tail = await supabase
    .from("application_tasks")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("status", parsed.data.status)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder =
    tail.data && tail.data[0]
      ? (tail.data[0] as { sort_order: number }).sort_order + 1
      : 0;

  const ins = await supabase
    .from("application_tasks")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      status: parsed.data.status,
      due_at: parsed.data.dueAt ?? null,
      application_id: parsed.data.applicationId ?? null,
      sort_order: nextOrder,
    })
    .select("id")
    .single();
  if (ins.error || !ins.data) {
    console.error("[createTask] insert failed", ins.error);
    return { ok: false, error: t("taskCreateFailed") };
  }
  revalidatePath("/applications");
  return { ok: true, id: (ins.data as { id: string }).id };
}

export async function updateTask(rawInput: unknown): Promise<ActionResult> {
  const t = await getTranslations("applications.errors");
  const parsed = UpdateTaskSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInToUpdateTasks"),
      needsAuth: true,
    };
  }

  const task = await loadTaskForUser(parsed.data.id, user.id);
  if (!task) return { ok: false, error: t("notAuthorized") };

  if (
    parsed.data.applicationId !== undefined &&
    !(await assertOptionalApplicationOwnership(
      parsed.data.applicationId,
      user.id,
    ))
  ) {
    return { ok: false, error: t("notAuthorized") };
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.category !== undefined) patch.category = parsed.data.category;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.dueAt !== undefined) patch.due_at = parsed.data.dueAt;
  if (parsed.data.applicationId !== undefined)
    patch.application_id = parsed.data.applicationId;

  if (Object.keys(patch).length === 0) return { ok: true };

  const supabase = createServiceClient();
  const upd = await supabase
    .from("application_tasks")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (upd.error) {
    console.error("[updateTask] update failed", upd.error);
    return { ok: false, error: t("taskUpdateFailed") };
  }
  revalidatePath("/applications");
  return { ok: true };
}

export async function moveTask(rawInput: unknown): Promise<ActionResult> {
  const t = await getTranslations("applications.errors");
  const parsed = MoveTaskSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInToUpdateTasks"),
      needsAuth: true,
    };
  }

  const task = await loadTaskForUser(parsed.data.id, user.id);
  if (!task) return { ok: false, error: t("notAuthorized") };

  const supabase = createServiceClient();
  const tail = await supabase
    .from("application_tasks")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("status", parsed.data.status)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder =
    tail.data && tail.data[0]
      ? (tail.data[0] as { sort_order: number }).sort_order + 1
      : 0;

  const upd = await supabase
    .from("application_tasks")
    .update({ status: parsed.data.status, sort_order: nextOrder })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (upd.error) {
    console.error("[moveTask] update failed", upd.error);
    return { ok: false, error: t("taskMoveFailed") };
  }
  revalidatePath("/applications");
  return { ok: true };
}

export async function deleteTask(rawInput: unknown): Promise<ActionResult> {
  const t = await getTranslations("applications.errors");
  const parsed = DeleteTaskSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: t("invalidInput") };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: t("signInToUpdateTasks"),
      needsAuth: true,
    };
  }

  const task = await loadTaskForUser(parsed.data.id, user.id);
  if (!task) return { ok: false, error: t("notAuthorized") };

  const supabase = createServiceClient();
  const del = await supabase
    .from("application_tasks")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (del.error) {
    console.error("[deleteTask] delete failed", del.error);
    return { ok: false, error: t("taskDeleteFailed") };
  }
  revalidatePath("/applications");
  return { ok: true };
}
