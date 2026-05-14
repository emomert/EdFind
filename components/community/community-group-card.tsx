"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Lock,
  MessagesSquare,
  Users,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { CommunityGroup, CommunityUser } from "@/lib/community/types";
import { useSubscription } from "./subscription-context";
import { UserAvatar } from "./user-avatar";

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

function logoText(group: CommunityGroup): string {
  const source = group.type === "university" ? group.name : group.name.split(" — ")[0];
  return source
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function CommunityGroupCard({
  group,
  responsibles,
  countryName,
  onOpenChat,
}: {
  group: CommunityGroup;
  responsibles: CommunityUser[];
  countryName: string;
  onOpenChat: (g: CommunityGroup) => void;
}) {
  const { isSubscribed } = useSubscription();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 0.6, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_12px_30px_-20px_rgba(13,148,136,0.35)] sm:p-5"
    >
      <header className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold shadow-sm",
            group.type === "university"
              ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white"
              : "bg-gradient-to-br from-sky-100 to-violet-100 text-slate-800 ring-1 ring-slate-200",
          )}
        >
          {logoText(group)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">
            {group.name}
          </h3>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            {group.type === "university" ? "University Group" : "Program Group"} ·{" "}
            {countryName}
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
        {responsibles.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {responsibles.slice(0, 3).map((r) => (
                <UserAvatar key={r.id} user={r} size="xs" className="ring-2 ring-white" />
              ))}
            </div>
            <span className="truncate text-[11px] text-slate-500">
              {responsibles[0].name.split(" ")[0]}
              {responsibles.length > 1 && ` +${responsibles.length - 1}`}
            </span>
          </div>
        ) : (
          <span className="text-[11px] italic text-slate-400">
            Responsible coming soon
          </span>
        )}

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
      </footer>
    </motion.article>
  );
}

// Compact variant suitable for the sidebar "top universities" widget.
export function CommunityGroupChip({
  group,
  countryName,
  onClick,
}: {
  group: CommunityGroup;
  countryName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-white px-3 py-2.5 text-left transition hover:border-slate-200 hover:shadow-sm"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/90 to-emerald-500/90 text-xs font-semibold text-white">
        {logoText(group)}
      </div>
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
