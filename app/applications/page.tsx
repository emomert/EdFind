import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServiceClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { APPLICATIONS_ENABLED } from "@/lib/feature-flags";
import {
  ApplicationsClient,
  type ApplicationItem,
} from "@/components/applications/applications-client";

export const metadata: Metadata = {
  title: "Your applications",
  description: "Track every master's program application you're working on.",
};

export default async function ApplicationsPage() {
  if (!APPLICATIONS_ENABLED) notFound();

  const user = await requireUser("/applications");

  const supabase = createServiceClient();
  const res = await supabase
    .from("applications")
    .select(
      `id, status, notes, deadline_at, program_id,
       program:programs!inner(
         slug, name, degree, application_deadline,
         university:universities!inner(slug, name, country, city, website)
       )`,
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const items = ((res.data ?? []) as unknown as ApplicationItem[]).filter(
    (r) => r.program !== null,
  );

  return <ApplicationsClient items={items} />;
}
