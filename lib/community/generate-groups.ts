import "server-only";

import type { CommunityActivityLevel, CommunityGroup } from "./types";
import {
  RICH_UNIVERSITY_GROUPS,
  FAKE_USERS,
} from "./fake-data";

// Deterministic seeded RNG so refreshing the page doesn't shuffle counts.
// Keyed on the university slug so each uni always gets the same numbers.
function hashSlug(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 33) ^ slug.charCodeAt(i);
  }
  return Math.abs(h);
}

function pickMemberCount(slug: string): { members: number; verified: number } {
  const h = hashSlug(slug);
  const members = 80 + (h % 540); // 80–620
  const verified = Math.max(4, Math.floor(members * (0.08 + ((h >> 4) % 8) / 100)));
  return { members, verified };
}

function pickActivity(slug: string): CommunityActivityLevel {
  const h = hashSlug(slug) >> 7;
  const tiers: CommunityActivityLevel[] = ["low", "low", "medium", "medium", "high"];
  return tiers[h % tiers.length];
}

// Round-robin fallback responsibles for unis without a hand-picked one.
const FALLBACK_RESPONSIBLE_IDS = FAKE_USERS
  .filter((u) => u.isCampusResponsible)
  .map((u) => u.id);

function pickFallbackResponsible(slug: string): string | null {
  if (FALLBACK_RESPONSIBLE_IDS.length === 0) return null;
  const h = hashSlug(slug);
  return FALLBACK_RESPONSIBLE_IDS[h % FALLBACK_RESPONSIBLE_IDS.length];
}

const STUB_PREVIEWS = [
  "Anyone else applying for the next intake?",
  "What's the realistic English-language requirement here?",
  "Looking for housing tips for international students.",
  "When does scholarship decisioning usually happen?",
  "Has anyone had luck with the application portal recently?",
  "How heavy is the workload in the first semester?",
];

function pickStubPreview(slug: string): string {
  return STUB_PREVIEWS[hashSlug(slug) % STUB_PREVIEWS.length];
}

export type CatalogUniversityLite = {
  slug: string;
  name: string;
  country: string;
};

export type CatalogProgramLite = {
  slug: string;
  name: string;
  universitySlug: string;
  universityCountry: string;
};

export function generateUniversityGroup(
  uni: CatalogUniversityLite,
): CommunityGroup {
  const rich = RICH_UNIVERSITY_GROUPS[uni.slug];
  if (rich) {
    return {
      id: `group-uni-${uni.slug}`,
      type: "university",
      country: uni.country,
      ...rich,
    };
  }

  const { members, verified } = pickMemberCount(uni.slug);
  const responsible = pickFallbackResponsible(uni.slug);

  return {
    id: `group-uni-${uni.slug}`,
    type: "university",
    name: `${uni.name} Community`,
    universitySlug: uni.slug,
    country: uni.country,
    description: `Connect with verified students and alumni at ${uni.name}. Ask questions, compare experiences, and meet your future cohort.`,
    memberCount: members,
    verifiedStudentCount: verified,
    campusResponsibleIds: responsible ? [responsible] : [],
    isLockedForFreeUsers: true,
    latestDiscussionPreview: pickStubPreview(uni.slug),
    activityLevel: pickActivity(uni.slug),
  };
}

export function generateProgramGroup(
  program: CatalogProgramLite,
  universityName: string,
): CommunityGroup {
  const key = `${program.universitySlug}/${program.slug}`;
  const { members, verified } = pickMemberCount(key);
  const responsible = pickFallbackResponsible(key);

  return {
    id: `group-prog-${program.universitySlug}-${program.slug}`,
    type: "program",
    name: `${program.name} — ${universityName}`,
    universitySlug: program.universitySlug,
    programSlug: program.slug,
    country: program.universityCountry,
    description: `Program-specific group for ${program.name} students and applicants. Detailed Q&A on coursework, intake, and life at ${universityName}.`,
    memberCount: members,
    verifiedStudentCount: verified,
    campusResponsibleIds: responsible ? [responsible] : [],
    isLockedForFreeUsers: true,
    latestDiscussionPreview: pickStubPreview(key),
    activityLevel: pickActivity(key),
  };
}

/**
 * Build the full set of groups for the page. We don't render every program
 * group up front (that'd be 196 cards) — only the rich-content ones and the
 * top-activity stubs. The full list is available for the filter dropdown.
 */
export function generateCommunityGroups(
  universities: CatalogUniversityLite[],
  programs: CatalogProgramLite[],
  universityNamesBySlug: Record<string, string>,
): CommunityGroup[] {
  const uniGroups = universities.map((u) => generateUniversityGroup(u));
  const programGroups = programs.map((p) =>
    generateProgramGroup(p, universityNamesBySlug[p.universitySlug] || p.universitySlug),
  );
  return [...uniGroups, ...programGroups];
}
