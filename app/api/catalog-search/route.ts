import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Lightweight catalog index for the header search modal. Returned shape is
 * intentionally small (~30 KB at current catalog size) so the modal can
 * filter client-side without paginating.
 *
 * Cached for 60 seconds at the edge — catalog rarely changes within a
 * session, but we don't want a stale index after a fresh seed.
 */
export const revalidate = 60;

export type CatalogSearchUniversity = {
  slug: string;
  name: string;
  country: string;
  city: string;
  qs_world_rank: number | null;
  is_partner: boolean;
};

export type CatalogSearchProgram = {
  slug: string;
  name: string;
  degree: string;
  language: string;
  university_slug: string;
  university_name: string;
  university_country: string;
};

export type CatalogSearchResponse = {
  universities: CatalogSearchUniversity[];
  programs: CatalogSearchProgram[];
};

export async function GET() {
  const supabase = await createClient();
  const [unisRes, progsRes] = await Promise.all([
    supabase
      .from("universities")
      .select("slug, name, country, city, qs_world_rank, is_partner")
      .order("name"),
    supabase
      .from("programs")
      .select(
        `slug, name, degree, language,
         university:universities!inner(slug, name, country)`,
      )
      .order("name"),
  ]);

  const universities = (unisRes.data ?? []) as CatalogSearchUniversity[];
  const programs = ((progsRes.data ?? []) as unknown as Array<{
    slug: string;
    name: string;
    degree: string;
    language: string;
    university: { slug: string; name: string; country: string };
  }>)
    .filter((p) => p.university != null)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      degree: p.degree,
      language: p.language,
      university_slug: p.university.slug,
      university_name: p.university.name,
      university_country: p.university.country,
    }));

  const body: CatalogSearchResponse = { universities, programs };
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
