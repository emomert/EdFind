import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServiceClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { requirePremium } from "@/lib/premium/premium";
import { APPLICATIONS_ENABLED } from "@/lib/feature-flags";
import { ApplicationsClient } from "@/components/applications/applications-client";
import type {
  ApplicationItem,
  DocumentItem,
  ProfileSummary,
  TaskItem,
} from "@/components/applications/types";

export const metadata: Metadata = {
  title: "Your applications",
  description: "Track every master's program application you're working on.",
};

type ProfileRow = {
  answers: Record<string, unknown> | null;
};

export default async function ApplicationsPage() {
  if (!APPLICATIONS_ENABLED) notFound();

  const user = await requireUser("/applications");
  await requirePremium("/applications");
  const supabase = createServiceClient();

  const [appsRes, tasksRes, profileRes, docsRes] = await Promise.all([
    supabase
      .from("applications")
      .select(
        `id, status, notes, deadline_at, program_id,
         program:programs!inner(
           slug, name, degree, application_deadline,
           university:universities!inner(slug, name, country, city, website, logo_url)
         )`,
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("application_tasks")
      .select("id, title, status, category, due_at, application_id, sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("profiles")
      .select("answers")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("application_documents")
      .select("id, kind, title, content, user_notes, application_id, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  const items = ((appsRes.data ?? []) as unknown as ApplicationItem[]).filter(
    (r) => r.program !== null,
  );
  const tasks = (tasksRes.data ?? []) as TaskItem[];
  const documents = (docsRes.data ?? []) as DocumentItem[];

  const profileRow = (profileRes.data as ProfileRow | null) ?? null;
  const answers = (profileRow?.answers ?? {}) as {
    destinations?: unknown;
    field_of_study?: unknown;
  };
  const destinations = Array.isArray(answers.destinations)
    ? (answers.destinations as unknown[]).filter(
        (v): v is string => typeof v === "string",
      )
    : [];
  const fieldOfStudy =
    typeof answers.field_of_study === "string" ? answers.field_of_study : null;
  const profile: ProfileSummary = {
    destinations,
    fieldOfStudy,
    hasProfile: Boolean(profileRow),
  };

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  return (
    <ApplicationsClient
      email={user.email}
      displayName={displayName}
      items={items}
      tasks={tasks}
      documents={documents}
      profile={profile}
    />
  );
}
