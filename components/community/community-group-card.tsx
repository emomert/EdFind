"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  GraduationCap,
  Lock,
  MessagesSquare,
  Users,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { CommunityGroup, CommunityUser } from "@/lib/community/types";
import { UniversityLogo } from "@/components/university/university-logo";
import { useSubscription } from "./subscription-context";
import { UserAvatar } from "./user-avatar";

/** Detail page the group belongs to — program page when we have both slugs. */
export function groupDetailHref(group: CommunityGroup): string {
  return group.type === "program" && group.programSlug
    ? `/programs/${group.universitySlug}/${group.programSlug}`
    : `/universities/${group.universitySlug}`;
}

const ACTIVITY_DOT: Record<CommunityGroup["activityLevel"], string> = {
  low: "bg-slate-300",
  medium: "bg-amber-400",
  high: "bg-emerald-500",
};

const ACTIVITY_LABEL: Record<CommunityGroup["activityLevel"], string> = {
  low: "Quiet",
  medium: "Active",
  high: "Buzzing",
};

// The display name for a group: program groups encode their parent uni in
// the suffix (`Some Program — Some University`), strip it for the logo lookup
// and the card title.
function groupDisplayName(group: CommunityGroup): string {
  if (group.type === "program") {
    return group.name.split(" — ")[0] || group.name;
  }
  return group.name;
}

export function CommunityGroupCard({
  group,
  responsibles,
  countryName,
  parentUniversityName,
  universityLogoUrl,
  onOpenChat,
}: {
  group: CommunityGroup;
  responsibles: CommunityUser[];
  countryName: string;
  parentUniversityName?: string;
  universityLogoUrl?: string | null;
  onOpenChat: (g: CommunityGroup) => void;
}) {
  const { isSubscribed } = useSubscription();
  const isProgram = group.type === "program";
  const displayName = groupDisplayName(group);
  // Programs don't have their own logo — they show the parent university's.
  // For uni groups, the lookup yields the uni's logo by definition.
  const logoName = isProgram ? parentUniversityName || displayName : group.name;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 0.6, 0.3, 1] }}
      whileHover={{ y: -3 }}
      // No accent stroke — the uni/program distinction already reads from the
      // type badge. A soft dark outer glow separates the white card from the
      // light page background instead.
      className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_14px_rgba(15,23,42,0.10)] transition-shadow hover:shadow-[0_14px_34px_-16px_rgba(15,23,42,0.28)] sm:p-5"
    >
      <header className="flex items-start gap-3">
        <UniversityLogo
          name={logoName}
          slug={group.universitySlug}
          logoUrl={universityLogoUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset",
              isProgram
                ? "bg-violet-50 text-violet-700 ring-violet-200"
                : "bg-teal-50 text-teal-800 ring-teal-200",
            )}
          >
            {isProgram ? (
              <GraduationCap className="size-2.5" />
            ) : (
              <Building2 className="size-2.5" />
            )}
            {isProgram ? "Program" : "University"}
          </span>
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">
            <Link
              href={groupDetailHref(group)}
              className="transition-colors hover:text-teal-700 hover:underline"
            >
              {displayName}
            </Link>
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {isProgram && parentUniversityName ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-slate-400">↳</span>
                <Link
                  href={`/universities/${group.universitySlug}`}
                  className="font-medium text-slate-600 transition-colors hover:text-teal-700 hover:underline"
                >
                  {parentUniversityName}
                </Link>
                <span>·</span>
                <span>{countryName}</span>
              </span>
            ) : (
              <span>{countryName}</span>
            )}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200",
          )}
          title={`Activity: ${ACTIVITY_LABEL[group.activityLevel]}`}
        >
          <span className={cn("inline-block size-1.5 rounded-full", ACTIVITY_DOT[group.activityLevel])} />
          {ACTIVITY_LABEL[group.activityLevel]}
        </span>
      </header>

      <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
        {group.description}
      </p>

      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5 text-slate-400" />
          {group.memberCount.toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1 text-teal-700">
          <BadgeCheck className="size-3.5" />
          {group.verifiedStudentCount} verified
        </span>
      </div>

      {group.latestDiscussionPreview && (
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
          <span className="text-slate-400">Latest discussion · </span>
          <span className="italic">“{group.latestDiscussionPreview}”</span>
        </div>
      )}

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        {/* Avatars only — mock first names removed on user feedback. */}
        {responsibles.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {responsibles.slice(0, 3).map((r) => (
                <UserAvatar key={r.id} user={r} size="xs" className="ring-2 ring-white" />
              ))}
            </div>
            <span className="truncate text-[11px] text-slate-500">
              Campus responsible{responsibles.length > 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <span className="text-[11px] italic text-slate-400">
            Responsible coming soon
          </span>
        )}

        <div className="flex items-center gap-1.5">
          <Link
            href={groupDetailHref(group)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-300 hover:text-teal-700"
          >
            {isProgram ? "Program page" : "University page"}
            <ArrowUpRight className="size-3" />
          </Link>
          <button
            type="button"
            onClick={() => onOpenChat(group)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
              isSubscribed
                ? "bg-teal-600 text-white shadow-sm hover:bg-teal-700"
                : "border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700",
            )}
          >
            {isSubscribed ? (
              <>
                <MessagesSquare className="size-3.5" />
                Join chat
              </>
            ) : (
              <>
                <Lock className="size-3" />
                Preview
              </>
            )}
          </button>
        </div>
      </footer>
    </motion.article>
  );
}

// Compact variant suitable for the sidebar "top universities" widget.
export function CommunityGroupChip({
  group,
  countryName,
  universityLogoUrl,
  onClick,
}: {
  group: CommunityGroup;
  countryName: string;
  universityLogoUrl?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-white px-3 py-2.5 text-left transition hover:border-slate-200 hover:shadow-sm"
    >
      <UniversityLogo
        name={groupDisplayName(group)}
        slug={group.universitySlug}
        logoUrl={universityLogoUrl}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 group-hover:text-teal-700">
          {group.name.replace(" Community", "")}
        </p>
        <p className="text-[11px] text-slate-500">
          {countryName} · {group.memberCount.toLocaleString()} members
        </p>
      </div>
      <Zap className="size-3 text-slate-300 group-hover:text-teal-500" />
    </button>
  );
}
