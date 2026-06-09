import type { Metadata } from "next";

import { createServiceClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import {
  ShortlistClient,
  type ShortlistItem,
} from "@/components/shortlist/shortlist-client";

export const metadata: Metadata = {
  title: "Your shortlist",
  description: "Programs you've saved.",
};

// The shortlist was merged into the applications tracker (2026-06-09): a
// "saved" program is an application at status 'interested'. This page is the
// 'interested' view of the tracker — the things you've shortlisted but not yet
// started — and still drives the compare flow.
export default async function ShortlistPage() {
  const user = await requireUser("/shortlist");

  const supabase = createServiceClient();
  const res = await supabase
    .from("applications")
    .select(
      `id, program_id, created_at,
       program:programs!inner(
         slug, name, degree, field_of_study, language, duration_months,
         tuition_per_year, currency, application_deadline,
         qs_subject_rank, qs_subject_area,
         university:universities!inner(
           slug, name, country, city, qs_world_rank, is_partner, logo_url
         )
       )`,
    )
    .eq("user_id", user.id)
    .eq("status", "interested")
    .order("created_at", { ascending: false });

  const items = ((res.data ?? []) as unknown as ShortlistItem[]).filter(
    (r) => r.program !== null,
  );

  return <ShortlistClient items={items} />;
}
