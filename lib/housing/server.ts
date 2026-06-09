import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { HousingCity, HousingUniversity } from "./types";

/**
 * Load published housing data for a university and its city. Reads via the
 * service-role client but filters status='published' explicitly so drafts
 * never surface (mirrors the public-read RLS policy). Returns nulls when no
 * published row exists — the section simply doesn't render.
 */
export async function getHousing(opts: {
  universityId: string;
  city: string;
  country: string;
}): Promise<{ city: HousingCity | null; university: HousingUniversity | null }> {
  const supabase = createServiceClient();
  const [cityRes, uniRes] = await Promise.all([
    supabase
      .from("housing_cities")
      .select("*")
      .eq("city", opts.city)
      .eq("country", opts.country)
      .eq("status", "published")
      .maybeSingle(),
    supabase
      .from("housing_universities")
      .select("*")
      .eq("university_id", opts.universityId)
      .eq("status", "published")
      .maybeSingle(),
  ]);

  return {
    city: (cityRes.data as HousingCity | null) ?? null,
    university: (uniRes.data as HousingUniversity | null) ?? null,
  };
}
