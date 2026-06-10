"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MarkerArrow,
  MarkerFolder,
  MarkerSparkles,
} from "@/components/decor/marker";
import type { ApplicationStatus } from "@/app/applications/actions";
import { ApplicationCard } from "./application-card";
import {
  ALL_APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  STATUS_PROGRESS_WEIGHT,
  type ApplicationItem,
  type TaskItem,
} from "./types";

type SortKey = "recent" | "deadline" | "status";

export function ApplicationsOverview({
  items,
  tasks,
  setItems,
}: {
  items: ApplicationItem[];
  tasks: TaskItem[];
  setItems: React.Dispatch<React.SetStateAction<ApplicationItem[]>>;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all",
  );
  const [sort, setSort] = useState<SortKey>("deadline");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter((it) => {
      if (statusFilter !== "all" && it.status !== statusFilter) return false;
      if (!q) return true;
      const haystack =
        `${it.program.name} ${it.program.university.name} ${it.program.university.city}`.toLowerCase();
      return haystack.includes(q);
    });

    if (sort === "deadline") {
      rows = [...rows].sort((a, b) => {
        const da = a.deadline_at ?? a.program.application_deadline;
        const db = b.deadline_at ?? b.program.application_deadline;
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return new Date(da).getTime() - new Date(db).getTime();
      });
    } else if (sort === "status") {
      rows = [...rows].sort(
        (a, b) =>
          STATUS_PROGRESS_WEIGHT[a.status] - STATUS_PROGRESS_WEIGHT[b.status],
      );
    }
    return rows;
  }, [items, query, statusFilter, sort]);

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Your applications
          </h2>
          <p className="text-sm text-slate-500">
            {items.length === 0
              ? "Programs you start tracking will show up here."
              : `${filtered.length} of ${items.length} program${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs or universities…"
            className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ApplicationStatus | "all")
          }
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        >
          <option value="all">All statuses</option>
          {ALL_APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {APPLICATION_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1 text-xs font-medium text-slate-600 shadow-sm">
          <SlidersHorizontal className="ml-1 size-3 text-slate-400" />
          {([
            ["deadline", "Deadline"],
            ["recent", "Recent"],
            ["status", "Progress"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              className={cn(
                "rounded-full px-2.5 py-1 transition-colors",
                sort === k
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.length === 0 ? (
            <EmptyApplicationsState
              hasAnyApps={items.length > 0}
              key="empty"
            />
          ) : (
            filtered.map((it) => {
              const taskTotal = tasks.filter(
                (t) => t.application_id === it.id,
              ).length;
              const taskDone = tasks.filter(
                (t) => t.application_id === it.id && t.status === "done",
              ).length;
              return (
                <ApplicationCard
                  key={it.id}
                  item={it}
                  taskTotal={taskTotal}
                  taskDone={taskDone}
                  onChange={(next) =>
                    setItems((prev) =>
                      prev.map((p) => (p.id === next.id ? next : p)),
                    )
                  }
                  onRemove={(id) =>
                    setItems((prev) => prev.filter((p) => p.id !== id))
                  }
                />
              );
            })
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function EmptyApplicationsState({ hasAnyApps }: { hasAnyApps: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center"
    >
      <MarkerSparkles
        aria-hidden
        className="absolute left-8 top-6 size-9 text-teal-300"
      />
      <MarkerSparkles
        aria-hidden
        className="absolute right-10 top-8 size-7 -scale-x-100 text-teal-200"
      />
      {hasAnyApps ? (
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 text-teal-700">
          <Search className="size-5" />
        </div>
      ) : (
        <div className="relative mx-auto inline-block">
          <MarkerFolder
            aria-hidden
            className="mx-auto h-16 w-20 text-teal-600/80"
          />
          <MarkerArrow
            aria-hidden
            className="absolute -right-14 -top-2 hidden h-14 w-16 rotate-[18deg] text-teal-500/60 sm:block"
          />
        </div>
      )}
      <h3 className="mt-4 text-base font-semibold tracking-tight">
        {hasAnyApps ? "Nothing matches that filter." : "No applications yet."}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {hasAnyApps
          ? "Try a different status or clear the search."
          : "Open any program page and hit “Save”. It'll show up here as one you're interested in."}
      </p>
      {!hasAnyApps && (
        <div className="mt-5 flex justify-center gap-2">
          <Button asChild size="sm">
            <Link href="/quiz">Find programs with the quiz</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/catalog">Browse the catalog</Link>
          </Button>
        </div>
      )}
    </motion.div>
  );
}
