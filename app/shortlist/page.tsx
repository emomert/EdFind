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

export default async function ShortlistPage() {
  const user = await requireUser("/shortlist");

  const supabase = createServiceClient();
  const res = await supabase
    .from("saved_programs")
    .select(
      `id, program_id, created_at,
       program:programs!inner(
         slug, name, degree, field_of_study, language, duration_months,
         tuition_per_year, currency, application_deadline,
         qs_subject_rank, qs_subject_area,
         university:universities!inner(
           slug, name, country, city, qs_world_rank, is_partner
         )
       )`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = ((res.data ?? []) as unknown as ShortlistItem[]).filter(
    (r) => r.program !== null,
  );

  return <ShortlistClient items={items} />;
}
