"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type CommunityTab = "reviews" | "groups" | "questions" | "responsibles";

export const TAB_LABELS: Record<CommunityTab, string> = {
  reviews: "Reviews",
  groups: "Groups",
  questions: "Questions",
  responsibles: "Campus Responsibles",
};

export function CommunityTabs({
  value,
  onChange,
  counts,
}: {
  value: CommunityTab;
  onChange: (tab: CommunityTab) => void;
  counts: Partial<Record<CommunityTab, number>>;
}) {
  const tabs: CommunityTab[] = ["reviews", "groups", "questions", "responsibles"];

  return (
    <div className="overflow-x-auto" role="tablist" aria-label="Community sections">
      <div className="flex min-w-fit gap-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const active = value === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab)}
              className={cn(
                "relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-teal-700" : "text-slate-500 hover:text-slate-800",
              )}
            >
              {TAB_LABELS[tab]}
              {counts[tab] !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    active
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {counts[tab]}
                </span>
              )}
              {active && (
                <motion.span
                  layoutId="community-tab-underline"
                  className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-teal-500"
                  transition={{ duration: 0.25, ease: [0.21, 0.6, 0.3, 1] }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
