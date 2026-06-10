"use client";

import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ApplicationItem } from "./types";

function daysUntil(dateStr: string): number | null {
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / (24 * 60 * 60 * 1000));
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

const TERMINAL = new Set(["accepted", "rejected", "withdrawn"]);

/**
 * Horizontal strip of the nearest application deadlines (next 60 days, plus
 * recently-passed ones on still-open applications). Each chip scrolls to its
 * application card so "what's due" is one glance + one click away instead of
 * a list scan. Renders nothing when there's nothing time-critical.
 */
export function DeadlineStrip({ items }: { items: ApplicationItem[] }) {
  const upcoming = items
    .filter((it) => !TERMINAL.has(it.status))
    .map((it) => {
      const deadline = it.deadline_at ?? it.program.application_deadline;
      if (!deadline) return null;
      const days = daysUntil(deadline);
      if (days === null || days > 60 || days < -14) return null;
      return { it, deadline, days };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  if (upcoming.length === 0) return null;

  const jumpTo = (id: string) => {
    document
      .getElementById(`application-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      aria-label="Upcoming deadlines"
      className="mt-4 flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm"
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <CalendarClock className="size-3.5 text-teal-600" />
        Deadlines
      </span>
      <div className="flex items-center gap-1.5">
        {upcoming.map(({ it, deadline, days }) => (
          <button
            key={it.id}
            type="button"
            onClick={() => jumpTo(it.id)}
            title={`${it.program.name} · ${it.program.university.name}`}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              days < 0
                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : days <= 14
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
            )}
          >
            <span className="max-w-[16ch] truncate">{it.program.name}</span>
            <span className="font-semibold tabular-nums">
              {shortDate(deadline)}
            </span>
            <span className="tabular-nums opacity-75">
              {days < 0 ? "passed" : days === 0 ? "today" : `${days}d`}
            </span>
          </button>
        ))}
      </div>
    </motion.section>
  );
}
