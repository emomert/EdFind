import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import {
  CatalogClient,
  type CatalogProgram,
  type CatalogUniversity,
} from "@/components/catalog/catalog-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("catalog");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

type UniRow = {
  slug: string;
  name: string;
  country: string;
  city: string;
  institution_type: string | null;
  established_year: number | null;
  student_count: number | null;
  qs_world_rank: number | null;
  is_partner: boolean;
  website: string | null;
  description: string | null;
  logo_url: string | null;
};

type ProgRow = {
  slug: string;
  name: string;
  degree: string;
  field_of_study: string;
  language: string;
  duration_months: number;
  tuition_per_year: string | number | null;
  currency: string;
  application_deadline: string | null;
  start_month: string | null;
  university: {
    slug: string;
    name: string;
    country: string;
    city: string;
    logo_url: string | null;
  };
};

export default async function CatalogPage() {
  const supabase = await createClient();

  const [unisRes, progsRes] = await Promise.all([
    supabase
      .from("universities")
      .select(
        "slug, name, country, city, institution_type, established_year, student_count, qs_world_rank, is_partner, website, description, logo_url",
      )
      .order("name"),
    supabase
      .from("programs")
      .select(
        `slug, name, degree, field_of_study, language,
         duration_months, tuition_per_year, currency,
         application_deadline, start_month,
         university:universities!inner(slug, name, country, city, logo_url)`,
      )
      .order("name"),
  ]);

  const uniRows = (unisRes.data ?? []) as UniRow[];
  const progRows = ((progsRes.data ?? []) as unknown) as ProgRow[];

  // Count programs per university for the card footer.
  const programCounts: Record<string, number> = {};
  for (const p of progRows) {
    if (!p.university) continue;
    programCounts[p.university.slug] = (programCounts[p.university.slug] || 0) + 1;
  }

  const universities: CatalogUniversity[] = uniRows.map((u) => ({
    slug: u.slug,
    name: u.name,
    country: u.country,
    city: u.city,
    institution_type: u.institution_type,
    established_year: u.established_year,
    student_count: u.student_count,
    qs_world_rank: u.qs_world_rank,
    is_partner: u.is_partner,
    website: u.website,
    description: u.description,
    logo_url: u.logo_url,
    program_count: programCounts[u.slug] || 0,
  }));

  const programs: CatalogProgram[] = progRows
    .filter((p) => p.university != null)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      degree: p.degree,
      field_of_study: p.field_of_study,
      language: p.language,
      duration_months: p.duration_months,
      tuition_per_year:
        p.tuition_per_year == null
          ? null
          : typeof p.tuition_per_year === "string"
          ? parseFloat(p.tuition_per_year)
          : p.tuition_per_year,
      currency: p.currency,
      application_deadline: p.application_deadline,
      start_month: p.start_month,
      university_slug: p.university.slug,
      university_name: p.university.name,
      university_country: p.university.country,
      university_city: p.university.city,
      university_logo_url: p.university.logo_url,
    }));

  return (
    <div className="relative">
      {/* Page-level gradient wash so the hero blends into the page rather
          than reading as a distinct bordered card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-teal-50/55 via-cyan-50/30 to-transparent"
      />
      <CatalogClient universities={universities} programs={programs} />
    </div>
  );
}
