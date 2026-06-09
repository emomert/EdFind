import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { COMMUNITY_ENABLED } from "@/lib/feature-flags";
import { getSubscriptionState } from "@/lib/community/subscription";
import { getUniversityVerification } from "@/lib/verification/server";
import {
  FAKE_MESSAGES_BY_GROUP,
  FAKE_QUESTIONS,
  FAKE_REVIEWS,
  FAKE_USERS,
} from "@/lib/community/fake-data";
import { generateCommunityGroups } from "@/lib/community/generate-groups";
import { FIELD_LABELS, COUNTRY_NAMES } from "@/components/applications/types";
import { CommunityClient } from "@/components/community/community-client";

export const metadata: Metadata = {
  title: "Community — Verified Student Insights",
  description:
    "Real experiences from verified students across Europe. Join university and program communities, ask questions, and choose your best path.",
};

type UniRow = {
  slug: string;
  name: string;
  country: string;
  logo_url: string | null;
};

type ProgRow = {
  slug: string;
  name: string;
  field_of_study: string | null;
  university: UniRow;
};

export default async function CommunityPage() {
  if (!COMMUNITY_ENABLED) notFound();

  // Match other gated pages — require auth.
  const user = await requireUser("/community");

  const supabase = createServiceClient();
  const [unisRes, progsRes, subscription, verification] = await Promise.all([
    supabase
      .from("universities")
      .select("slug, name, country, logo_url")
      .order("name"),
    supabase
      .from("programs")
      .select(
        `slug, name, field_of_study,
         university:universities!inner(slug, name, country, logo_url)`,
      )
      .order("name"),
    getSubscriptionState(),
    getUniversityVerification(user.id),
  ]);

  const universities = (unisRes.data ?? []) as UniRow[];
  const programs = ((progsRes.data ?? []) as unknown) as ProgRow[];

  const universityNames: Record<string, string> = {};
  const universityLogos: Record<string, string | null> = {};
  const fieldByUniversitySlug: Record<string, string | null> = {};
  for (const u of universities) {
    universityNames[u.slug] = u.name;
    universityLogos[u.slug] = u.logo_url;
    fieldByUniversitySlug[u.slug] = null;
  }

  const programNames: Record<string, string> = {};
  for (const p of programs) {
    programNames[`${p.university.slug}/${p.slug}`] = p.name;
    // Best-effort: pick the first field-of-study seen for the uni.
    if (!fieldByUniversitySlug[p.university.slug] && p.field_of_study) {
      fieldByUniversitySlug[p.university.slug] = p.field_of_study;
    }
  }

  const groups = generateCommunityGroups(
    universities.map((u) => ({ slug: u.slug, name: u.name, country: u.country })),
    programs.map((p) => ({
      slug: p.slug,
      name: p.name,
      universitySlug: p.university.slug,
      universityCountry: p.university.country,
    })),
    universityNames,
  );

  // Country list (filter dropdown)
  const countryCodes = Array.from(new Set(universities.map((u) => u.country))).sort();
  const catalogCountries = countryCodes.map((code) => ({
    code,
    name: COUNTRY_NAMES[code] || code,
  }));

  // Field list (filter dropdown) — only fields that actually appear in the catalog
  const fieldsInCatalog = new Set<string>();
  for (const p of programs) {
    if (p.field_of_study) fieldsInCatalog.add(p.field_of_study);
  }
  const fields = Array.from(fieldsInCatalog)
    .map((value) => ({ value, label: FIELD_LABELS[value] || value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // ─── Realistic-looking aggregate stats ─────────────────────────────
  const verifiedStudentsCount = FAKE_USERS.filter((u) => u.verified).length;
  const campusResponsiblesCount = FAKE_USERS.filter(
    (u) => u.isCampusResponsible,
  ).length;
  // We seed plausible numbers based on group totals (each uni group counts
  // toward verified-students total, etc.). These are for the "Community at a
  // glance" widget — they're aspirational, not literal mock-user counts.
  const totalVerifiedFromGroups = groups
    .filter((g) => g.type === "university")
    .reduce((sum, g) => sum + g.verifiedStudentCount, 0);
  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0);
  const programGroupsCount = groups.filter((g) => g.type === "program").length;

  const stats = {
    verifiedReviews: FAKE_REVIEWS.length + 12_800,
    verifiedStudents: totalVerifiedFromGroups + verifiedStudentsCount,
    universities: universities.length,
    programGroups: programGroupsCount,
    campusResponsibles: campusResponsiblesCount + 314,
    activeDiscussions: Math.round(totalMembers * 0.08),
  };

  return (
    <CommunityClient
      isSubscribed={subscription.isSubscribed}
      verification={verification}
      users={FAKE_USERS}
      groups={groups}
      reviews={FAKE_REVIEWS}
      questions={FAKE_QUESTIONS}
      messagesByGroup={FAKE_MESSAGES_BY_GROUP}
      universityNames={universityNames}
      universityLogos={universityLogos}
      programNames={programNames}
      countryNames={COUNTRY_NAMES}
      fieldByUniversitySlug={fieldByUniversitySlug}
      fields={fields}
      catalogUniversities={universities}
      catalogCountries={catalogCountries}
      stats={stats}
      showDevToggle={process.env.VERCEL_ENV !== "production"}
    />
  );
}
