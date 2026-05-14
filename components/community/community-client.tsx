"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import type {
  CommunityGroup,
  CommunityMessage,
  CommunityQuestion,
  CommunityUser,
  StudentReview,
} from "@/lib/community/types";

import { SubscriptionProvider } from "./subscription-context";
import { SubscriptionDevToggle } from "./subscription-dev-toggle";
import { CommunityHero } from "./community-hero";
import {
  CommunityFilters,
  type CommunityFilterValues,
} from "./community-filters";
import {
  CommunityTabs,
  type CommunityTab,
} from "./community-tabs";
import { ReviewCard } from "./review-card";
import { CommunityGroupCard } from "./community-group-card";
import { CampusResponsibleCard } from "./campus-responsible-card";
import { PopularQuestionsList } from "./popular-questions-card";
import { GroupChatModal } from "./group-chat-modal";
import { GroupTypeSelector } from "./group-type-selector";
import {
  AskCommunityCard,
  CommunityStatsCard,
  ShareExperienceCard,
  TopUniversitiesWidget,
} from "./sidebar-widgets";
import { UpgradeCommunityAccessCard } from "./upgrade-community-access-card";

export type CommunityClientProps = {
  isSubscribed: boolean;
  users: CommunityUser[];
  groups: CommunityGroup[];
  reviews: StudentReview[];
  questions: CommunityQuestion[];
  messagesByGroup: Record<string, CommunityMessage[]>;
  universityNames: Record<string, string>;
  programNames: Record<string, string>;
  countryNames: Record<string, string>;
  fieldByUniversitySlug: Record<string, string | null>;
  fields: { value: string; label: string }[];
  catalogUniversities: { slug: string; name: string; country: string }[];
  catalogCountries: { code: string; name: string }[];
  stats: React.ComponentProps<typeof CommunityStatsCard>["stats"];
};

export function CommunityClient(props: CommunityClientProps) {
  const usersById = useMemo(
    () => Object.fromEntries(props.users.map((u) => [u.id, u])),
    [props.users],
  );

  const [activeTab, setActiveTab] = useState<CommunityTab>("groups");
  const [openGroup, setOpenGroup] = useState<CommunityGroup | null>(null);
  const [filters, setFilters] = useState<CommunityFilterValues>({
    query: "",
    country: "",
    universitySlug: "",
    field: "",
    verifiedOnly: false,
    groupType: "all",
    sort: "most_active",
  });

  // ─── Filter passes ──────────────────────────────────────────────────
  // Stage 1: apply every filter EXCEPT groupType. We use this to compute
  // counts for the segmented control so toggling type doesn't shift the
  // visible counts under it.
  const groupsBeforeTypeFilter = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return props.groups.filter((g) => {
      if (filters.country && g.country !== filters.country) return false;
      if (filters.universitySlug && g.universitySlug !== filters.universitySlug)
        return false;
      if (
        filters.field &&
        g.type === "university" &&
        props.fieldByUniversitySlug[g.universitySlug] !== filters.field
      ) {
        return false;
      }
      if (
        q &&
        !(
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [props.groups, props.fieldByUniversitySlug, filters]);

  const groupTypeCounts = useMemo(() => {
    let uni = 0;
    let prog = 0;
    for (const g of groupsBeforeTypeFilter) {
      if (g.type === "university") uni += 1;
      else prog += 1;
    }
    return { all: uni + prog, university: uni, program: prog };
  }, [groupsBeforeTypeFilter]);

  // Stage 2: apply groupType + sort.
  const filteredGroups = useMemo(() => {
    let rows = groupsBeforeTypeFilter;
    if (filters.groupType !== "all") {
      rows = rows.filter((g) => g.type === filters.groupType);
    }

    const byMembers = (a: typeof rows[number], b: typeof rows[number]) =>
      b.memberCount - a.memberCount;

    switch (filters.sort) {
      case "most_members":
        rows = [...rows].sort(byMembers);
        break;
      case "most_active":
        rows = [...rows].sort(
          (a, b) =>
            activityScore(b.activityLevel) - activityScore(a.activityLevel) ||
            b.memberCount - a.memberCount,
        );
        break;
      default:
        rows = [...rows].sort(byMembers);
    }

    // When viewing "All", surface universities first so the type
    // distinction is visually obvious in the grid.
    if (filters.groupType === "all") {
      rows = [...rows].sort((a, b) => {
        if (a.type === b.type) return 0;
        return a.type === "university" ? -1 : 1;
      });
    }

    return rows;
  }, [groupsBeforeTypeFilter, filters.groupType, filters.sort]);

  const filteredReviews = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    let rows = props.reviews.filter((r) => {
      const uniName = props.universityNames[r.universitySlug] || "";
      const user = usersById[r.userId];
      if (filters.country) {
        // Reviews don't have country directly; rely on uni mapping.
        const country = props.catalogUniversities.find(
          (u) => u.slug === r.universitySlug,
        )?.country;
        if (country !== filters.country) return false;
      }
      if (filters.universitySlug && r.universitySlug !== filters.universitySlug)
        return false;
      if (
        filters.field &&
        props.fieldByUniversitySlug[r.universitySlug] !== filters.field
      ) {
        return false;
      }
      if (filters.verifiedOnly && !user?.verified) return false;
      if (q && !r.review.toLowerCase().includes(q) && !uniName.toLowerCase().includes(q))
        return false;
      return true;
    });

    switch (filters.sort) {
      case "most_helpful":
        rows = [...rows].sort((a, b) => b.helpfulCount - a.helpfulCount);
        break;
      case "highest_rated":
        rows = [...rows].sort((a, b) => b.rating - a.rating);
        break;
      case "most_recent":
        rows = [...rows].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      default:
        rows = [...rows].sort((a, b) => b.helpfulCount - a.helpfulCount);
    }
    return rows;
  }, [
    props.reviews,
    props.universityNames,
    props.fieldByUniversitySlug,
    props.catalogUniversities,
    filters,
    usersById,
  ]);

  const responsibles = useMemo(() => {
    let rows = props.users.filter((u) => u.isCampusResponsible);
    if (filters.country) {
      rows = rows.filter((u) => {
        const slug = u.universitySlug;
        if (!slug) return false;
        const uni = props.catalogUniversities.find((c) => c.slug === slug);
        return uni?.country === filters.country;
      });
    }
    if (filters.universitySlug) {
      rows = rows.filter((u) => u.universitySlug === filters.universitySlug);
    }
    return rows;
  }, [props.users, props.catalogUniversities, filters]);

  const filteredQuestions = useMemo(() => {
    let rows = props.questions;
    if (filters.universitySlug)
      rows = rows.filter((q) => q.universitySlug === filters.universitySlug);
    if (filters.country) {
      rows = rows.filter((q) => {
        if (!q.universitySlug) return false;
        const uni = props.catalogUniversities.find(
          (u) => u.slug === q.universitySlug,
        );
        return uni?.country === filters.country;
      });
    }
    return rows;
  }, [props.questions, props.catalogUniversities, filters]);

  const tabCounts = {
    reviews: filteredReviews.length,
    groups: filteredGroups.length,
    questions: filteredQuestions.length,
    responsibles: responsibles.length,
  };

  const messagesForOpen = openGroup
    ? props.messagesByGroup[openGroup.id] ?? []
    : [];
  const openGroupResponsibles = openGroup
    ? openGroup.campusResponsibleIds
        .map((id) => usersById[id])
        .filter(Boolean)
    : [];

  return (
    <SubscriptionProvider isSubscribed={props.isSubscribed}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"
      >
        <CommunityHero />

        <div className="mt-6 space-y-5">
          <CommunityFilters
            values={filters}
            onChange={setFilters}
            countries={props.catalogCountries}
            universities={props.catalogUniversities.map((u) => ({
              slug: u.slug,
              name: u.name,
            }))}
            fields={props.fields}
          />

          <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
            <div className="min-w-0 space-y-5">
              <CommunityTabs
                value={activeTab}
                onChange={setActiveTab}
                counts={tabCounts}
              />

              <div>
                {activeTab === "reviews" && (
                  <ReviewsTab
                    reviews={filteredReviews}
                    usersById={usersById}
                    universityNames={props.universityNames}
                    programNames={props.programNames}
                  />
                )}
                {activeTab === "groups" && (
                  <GroupsTab
                    groups={filteredGroups}
                    usersById={usersById}
                    countryNames={props.countryNames}
                    universityNames={props.universityNames}
                    typeFilter={filters.groupType}
                    typeCounts={groupTypeCounts}
                    onChangeType={(t) =>
                      setFilters({ ...filters, groupType: t })
                    }
                    onOpen={setOpenGroup}
                  />
                )}
                {activeTab === "questions" && (
                  <QuestionsTab
                    questions={filteredQuestions}
                    usersById={usersById}
                    universityNames={props.universityNames}
                  />
                )}
                {activeTab === "responsibles" && (
                  <ResponsiblesTab
                    responsibles={responsibles}
                    universityNames={props.universityNames}
                  />
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <CommunityStatsCard stats={props.stats} />
              <TopUniversitiesWidget
                groups={props.groups
                  .filter((g) => g.type === "university")
                  .sort((a, b) => b.memberCount - a.memberCount)}
                countryNames={props.countryNames}
                onSelect={setOpenGroup}
              />
              {!props.isSubscribed && <UpgradeCommunityAccessCard />}
              <AskCommunityCard />
              <ShareExperienceCard />
            </aside>
          </div>
        </div>

        <SubscriptionDevToggle />

        <GroupChatModal
          open={openGroup !== null}
          onClose={() => setOpenGroup(null)}
          group={openGroup}
          messages={messagesForOpen}
          users={usersById}
          responsibles={openGroupResponsibles}
        />
      </motion.div>
    </SubscriptionProvider>
  );
}

function activityScore(level: CommunityGroup["activityLevel"]): number {
  return level === "high" ? 3 : level === "medium" ? 2 : 1;
}

function ReviewsTab({
  reviews,
  usersById,
  universityNames,
  programNames,
}: {
  reviews: StudentReview[];
  usersById: Readonly<Record<string, CommunityUser>>;
  universityNames: Readonly<Record<string, string>>;
  programNames: Readonly<Record<string, string>>;
}) {
  if (reviews.length === 0)
    return <EmptyState message="No reviews match your filters yet." />;
  return (
    <div className="grid gap-3">
      {reviews.map((r) => {
        const user = usersById[r.userId];
        if (!user) return null;
        return (
          <ReviewCard
            key={r.id}
            review={r}
            user={user}
            universityName={universityNames[r.universitySlug] || ""}
            programName={r.programSlug ? programNames[`${r.universitySlug}/${r.programSlug}`] : undefined}
            universitySlug={r.universitySlug}
            programSlug={r.programSlug}
          />
        );
      })}
    </div>
  );
}

function GroupsTab({
  groups,
  usersById,
  countryNames,
  universityNames,
  typeFilter,
  typeCounts,
  onChangeType,
  onOpen,
}: {
  groups: CommunityGroup[];
  usersById: Readonly<Record<string, CommunityUser>>;
  countryNames: Readonly<Record<string, string>>;
  universityNames: Readonly<Record<string, string>>;
  typeFilter: "all" | "university" | "program";
  typeCounts: { all: number; university: number; program: number };
  onChangeType: (t: "all" | "university" | "program") => void;
  onOpen: (g: CommunityGroup) => void;
}) {
  const initial = groups.slice(0, 24);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <GroupTypeSelector
          value={typeFilter}
          onChange={onChangeType}
          counts={typeCounts}
        />
        <p className="text-xs text-slate-500">
          {typeFilter === "university"
            ? "University-wide communities — meet the whole cohort."
            : typeFilter === "program"
            ? "Program-specific communities — laser-focused on one master's."
            : "Universities and programs in one view."}
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptyState message="No groups match your filters yet." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {initial.map((g) => (
              <CommunityGroupCard
                key={g.id}
                group={g}
                countryName={countryNames[g.country] || g.country}
                parentUniversityName={
                  g.type === "program"
                    ? universityNames[g.universitySlug]
                    : undefined
                }
                responsibles={g.campusResponsibleIds
                  .map((id) => usersById[id])
                  .filter(Boolean)}
                onOpenChat={onOpen}
              />
            ))}
          </div>
          {groups.length > 24 && (
            <p className="text-center text-xs text-slate-500">
              Showing {initial.length} of {groups.length} groups. Refine filters
              to narrow.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function QuestionsTab({
  questions,
  usersById,
  universityNames,
}: {
  questions: CommunityQuestion[];
  usersById: Readonly<Record<string, CommunityUser>>;
  universityNames: Readonly<Record<string, string>>;
}) {
  if (questions.length === 0)
    return <EmptyState message="No popular questions for this filter yet." />;
  return (
    <PopularQuestionsList
      questions={questions}
      users={usersById}
      universityNames={universityNames}
      onReply={() => undefined}
    />
  );
}

function ResponsiblesTab({
  responsibles,
  universityNames,
}: {
  responsibles: CommunityUser[];
  universityNames: Readonly<Record<string, string>>;
}) {
  if (responsibles.length === 0)
    return (
      <EmptyState
        message="No campus responsibles match this filter. Try clearing it — every university has one."
      />
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {responsibles.map((r) => (
        <CampusResponsibleCard
          key={r.id}
          user={r}
          universityName={r.universitySlug ? universityNames[r.universitySlug] || "" : ""}
        />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
