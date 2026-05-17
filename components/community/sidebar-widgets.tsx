"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  Crown,
  GraduationCap,
  MessagesSquare,
  PenSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { CommunityGroup } from "@/lib/community/types";
import { CommunityGroupChip } from "./community-group-card";

export function CommunityStatsCard({
  stats,
}: {
  stats: {
    verifiedReviews: number;
    verifiedStudents: number;
    universities: number;
    programGroups: number;
    campusResponsibles: number;
    activeDiscussions: number;
  };
}) {
  const rows: Array<{
    label: string;
    value: number;
    icon: React.ReactNode;
    tone: string;
  }> = [
    {
      label: "Verified reviews",
      value: stats.verifiedReviews,
      icon: <BadgeCheck className="size-3.5" />,
      tone: "text-teal-700 bg-teal-50",
    },
    {
      label: "Verified students",
      value: stats.verifiedStudents,
      icon: <GraduationCap className="size-3.5" />,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Universities",
      value: stats.universities,
      icon: <Building2 className="size-3.5" />,
      tone: "text-sky-700 bg-sky-50",
    },
    {
      label: "Program groups",
      value: stats.programGroups,
      icon: <MessagesSquare className="size-3.5" />,
      tone: "text-violet-700 bg-violet-50",
    },
    {
      label: "Campus responsibles",
      value: stats.campusResponsibles,
      icon: <Crown className="size-3.5" />,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Active discussions",
      value: stats.activeDiscussions,
      icon: <TrendingUp className="size-3.5" />,
      tone: "text-rose-700 bg-rose-50",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-teal-600" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Community at a glance
        </h3>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="rounded-xl border border-slate-100 p-3"
          >
            <span
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-lg",
                row.tone,
              )}
            >
              {row.icon}
            </span>
            <p className="mt-2 text-lg font-semibold tabular-nums text-slate-900">
              {row.value.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500">{row.label}</p>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

export function TopUniversitiesWidget({
  groups,
  countryNames,
  universityLogos,
  onSelect,
}: {
  groups: CommunityGroup[];
  countryNames: Readonly<Record<string, string>>;
  universityLogos: Readonly<Record<string, string | null>>;
  onSelect: (g: CommunityGroup) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2">
        <Building2 className="size-4 text-teal-600" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Top universities discussed
        </h3>
      </div>
      <ul className="mt-3 grid gap-1">
        {groups.slice(0, 6).map((g) => (
          <li key={g.id}>
            <CommunityGroupChip
              group={g}
              countryName={countryNames[g.country] || g.country}
              universityLogoUrl={universityLogos[g.universitySlug] ?? null}
              onClick={() => onSelect(g)}
            />
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

export function AskCommunityCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/60 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2">
        <MessagesSquare className="size-4 text-teal-600" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Ask the community
        </h3>
      </div>
      <p className="mt-2 text-xs text-slate-600">
        Stuck on something specific? Drop a question — verified students and
        responsibles answer fastest when the question is clear and short.
      </p>
      <button
        type="button"
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-teal-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-teal-700"
      >
        <PenSquare className="size-3.5" />
        Ask a question
      </button>
    </motion.section>
  );
}

export function ShareExperienceCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2">
        <GraduationCap className="size-4 text-emerald-600" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Share your experience
        </h3>
      </div>
      <p className="mt-2 text-xs text-slate-600">
        Already studying or graduated? Write a verified review and help the
        next cohort make a better decision.
      </p>
      <button
        type="button"
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
      >
        <PenSquare className="size-3.5" />
        Write a review
      </button>
    </motion.section>
  );
}
