"use client";

import { motion } from "framer-motion";
import { Building2, GraduationCap, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type GroupTypeFilter = "all" | "university" | "program";

const OPTIONS: ReadonlyArray<{
  key: GroupTypeFilter;
  labelKey: string;
  icon: React.ReactNode;
}> = [
  { key: "all", labelKey: "all", icon: <LayoutGrid className="size-3.5" /> },
  {
    key: "university",
    labelKey: "universities",
    icon: <Building2 className="size-3.5" />,
  },
  {
    key: "program",
    labelKey: "programs",
    icon: <GraduationCap className="size-3.5" />,
  },
];

export function GroupTypeSelector({
  value,
  onChange,
  counts,
}: {
  value: GroupTypeFilter;
  onChange: (v: GroupTypeFilter) => void;
  counts: Record<GroupTypeFilter, number>;
}) {
  const t = useTranslations("community.groupType");
  return (
    <div
      role="tablist"
      aria-label={t("ariaLabel")}
      className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "text-teal-800" : "text-slate-500 hover:text-slate-800",
            )}
          >
            {active && (
              <motion.span
                layoutId="group-type-selector-pill"
                className="absolute inset-0 rounded-full bg-teal-50 ring-1 ring-inset ring-teal-200"
                transition={{ duration: 0.25, ease: [0.21, 0.6, 0.3, 1] }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              <span className={active ? "text-teal-600" : "text-slate-400"}>
                {opt.icon}
              </span>
              {t(opt.labelKey)}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  active
                    ? "bg-teal-100 text-teal-800"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {counts[opt.key]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
