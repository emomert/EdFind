"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import {
  generateDocumentDraft,
  type DocumentKind,
  type ProgramForDocument,
} from "@/lib/ai/generate-document";
import { AiDisabledError, AiTimeoutError } from "@/lib/ai/client";

import {
  CV_HIGHLIGHTS_MIN_LENGTH,
  HIGHLIGHTS_MAX_LENGTH,
} from "@/components/applications/types";

const DOCUMENT_KINDS = ["cv", "cover_letter"] as const;

// Per-user cap. Generous for real use, keeps a runaway client (or an abuser
// burning AI credits) bounded.
const MAX_DOCUMENTS_PER_USER = 30;

const GenerateInputSchema = z.object({
  kind: z.enum(DOCUMENT_KINDS),
  applicationId: z.string().uuid().nullable(),
  highlights: z.string().trim().max(HIGHLIGHTS_MAX_LENGTH).nullable(),
});

const UpdateInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(160).optional(),
  content: z.string().min(1).max(30_000).optional(),
});

const DeleteInputSchema = z.object({ id: z.string().uuid() });

export type DocumentRow = {
  id: string;
  kind: DocumentKind;
  title: string;
  content: string;
  user_notes: string | null;
  application_id: string | null;
  updated_at: string;
};

export type GenerateDocumentResult =
  | { ok: true; document: DocumentRow }
  | { ok: false; error: string; needsAuth?: boolean };

export type DocumentActionResult =
  | { ok: true }
  | { ok: false; error: string; needsAuth?: boolean };

type ApplicationWithProgram = {
  id: string;
  user_id: string | null;
  program: {
    name: string;
    degree: string;
    language: string;
    duration_months: number;
    tuition_per_year: number | null;
    currency: string;
    description: string | null;
    application_deadline: string | null;
    university: {
      name: string;
      city: string;
      country: string;
    };
  } | null;
};

async function loadApplicationWithProgram(
  applicationId: string,
  userId: string,
): Promise<ApplicationWithProgram | null> {
  const supabase = createServiceClient();
  const res = await supabase
    .from("applications")
    .select(
      `id, user_id,
       program:programs!inner(
         name, degree, language, duration_months, tuition_per_year, currency,
         description, application_deadline,
         university:universities!inner(name, city, country)
       )`,
    )
    .eq("id", applicationId)
    .maybeSingle();
  if (res.error || !res.data) return null;
  const row = res.data as unknown as ApplicationWithProgram;
  if (row.user_id !== userId) return null;
  return row;
}

/**
 * Generate a CV or cover-letter draft with AI and persist it. Cover letters
 * require a tracked application (the letter is addressed to that program);
 * CVs are general unless the student picks an application to tailor to.
 */
export async function generateApplicationDocument(
  rawInput: unknown,
): Promise<GenerateDocumentResult> {
  const parsed = GenerateInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const { kind, applicationId } = parsed.data;
  const highlights = parsed.data.highlights || null;

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to generate documents.",
      needsAuth: true,
    };
  }

  if (kind === "cover_letter" && !applicationId) {
    return { ok: false, error: "Pick a tracked program for the cover letter." };
  }
  if (
    kind === "cv" &&
    (highlights?.length ?? 0) < CV_HIGHLIGHTS_MIN_LENGTH
  ) {
    return {
      ok: false,
      error:
        "Tell us a bit about your background first — a CV drafted from nothing would just be placeholders.",
    };
  }

  const supabase = createServiceClient();

  const countRes = await supabase
    .from("application_documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((countRes.count ?? 0) >= MAX_DOCUMENTS_PER_USER) {
    return {
      ok: false,
      error: `You've reached the limit of ${MAX_DOCUMENTS_PER_USER} documents — delete some old drafts first.`,
    };
  }

  let program: ProgramForDocument | null = null;
  let programName: string | null = null;
  if (applicationId) {
    const app = await loadApplicationWithProgram(applicationId, user.id);
    if (!app || !app.program) {
      return { ok: false, error: "Not authorized." };
    }
    programName = app.program.name;
    program = {
      name: app.program.name,
      degree: app.program.degree,
      language: app.program.language,
      duration_months: app.program.duration_months,
      tuition_per_year: app.program.tuition_per_year,
      currency: app.program.currency,
      description: app.program.description,
      application_deadline: app.program.application_deadline,
      university_name: app.program.university.name,
      university_city: app.program.university.city,
      university_country: app.program.university.country,
    };
  }

  const profileRes = await supabase
    .from("profiles")
    .select("answers")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const profileAnswers =
    (profileRes.data?.answers as Record<string, unknown> | null) ?? null;

  const studentName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  let content: string;
  try {
    content = await generateDocumentDraft({
      kind,
      studentName,
      profileAnswers,
      highlights,
      program,
    });
  } catch (err) {
    if (err instanceof AiDisabledError) {
      return { ok: false, error: "AI drafting is temporarily disabled." };
    }
    if (err instanceof AiTimeoutError) {
      return { ok: false, error: "The AI took too long — please try again." };
    }
    console.error("[generateApplicationDocument] AI call failed", err);
    return { ok: false, error: "Couldn't generate the draft. Try again." };
  }

  const title =
    kind === "cv"
      ? programName
        ? `CV — tailored for ${programName}`
        : "CV"
      : `Cover letter — ${programName}`;

  const ins = await supabase
    .from("application_documents")
    .insert({
      user_id: user.id,
      application_id: applicationId,
      kind,
      title,
      content,
      user_notes: highlights,
    })
    .select("id, kind, title, content, user_notes, application_id, updated_at")
    .single();
  if (ins.error || !ins.data) {
    console.error("[generateApplicationDocument] insert failed", ins.error);
    return { ok: false, error: "Couldn't save the draft." };
  }

  revalidatePath("/applications");
  return { ok: true, document: ins.data as DocumentRow };
}

export async function updateApplicationDocument(
  rawInput: unknown,
): Promise<DocumentActionResult> {
  const parsed = UpdateInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to edit documents.",
      needsAuth: true,
    };
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.content !== undefined) patch.content = parsed.data.content;
  if (Object.keys(patch).length === 0) return { ok: true };

  const supabase = createServiceClient();
  const upd = await supabase
    .from("application_documents")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (upd.error) {
    console.error("[updateApplicationDocument] update failed", upd.error);
    return { ok: false, error: "Couldn't save your changes." };
  }
  if (!upd.data) return { ok: false, error: "Not authorized." };

  revalidatePath("/applications");
  return { ok: true };
}

export async function deleteApplicationDocument(
  rawInput: unknown,
): Promise<DocumentActionResult> {
  const parsed = DeleteInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to delete documents.",
      needsAuth: true,
    };
  }

  const supabase = createServiceClient();
  const del = await supabase
    .from("application_documents")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (del.error) {
    console.error("[deleteApplicationDocument] delete failed", del.error);
    return { ok: false, error: "Couldn't delete the document." };
  }

  revalidatePath("/applications");
  return { ok: true };
}
