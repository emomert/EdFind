"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  ListChecks,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  removeApplication,
  setApplicationDeadline,
  setApplicationNotes,
  setApplicationStatus,
  type ApplicationStatus,
} from "@/app/applications/actions";
import { StatusPill } from "./status-pill";
import {
  ALL_APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  COUNTRY_NAMES,
  type ApplicationItem,
} from "./types";

function logoInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function nextStepFor(status: ApplicationStatus, hasNotes: boolean): string {
  switch (status) {
    case "interested":
      return "Decide whether to apply. Move to Drafting when you start.";
    case "drafting":
      return hasNotes
        ? "Finish the items in your notes, then submit."
        : "Outline your documents and motivation letter.";
    case "submitted":
      return "Wait for the program's decision. Watch your inbox.";
    case "waitlisted":
      return "Stay close — reply quickly if a spot opens.";
    case "accepted":
      return "Compare offers, then confirm your enrollment.";
    case "rejected":
      return "Take a breath. Lean into your other applications.";
    case "withdrawn":
      return "Archived. Remove if you'd like to clear it.";
  }
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / (24 * 60 * 60 * 1000));
}

function formatDeadline(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ApplicationCard({
  item,
  taskTotal,
  taskDone,
  onChange,
  onRemove,
}: {
  item: ApplicationItem;
  taskTotal: number;
  taskDone: number;
  onChange: (next: ApplicationItem) => void;
  onRemove: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? "");
  const u = item.program.university;
  const effectiveDeadline =
    item.deadline_at ?? item.program.application_deadline ?? null;
  const days = daysUntil(effectiveDeadline);

  const handleStatus = (next: ApplicationStatus) => {
    const prev = item;
    onChange({ ...item, status: next });
    startTransition(async () => {
      const res = await setApplicationStatus({
        applicationId: item.id,
        status: next,
      });
      if (!res.ok) onChange(prev);
    });
  };

  const handleNotesBlur = () => {
    if ((item.notes ?? "") === notes) return;
    onChange({ ...item, notes });
    startTransition(async () => {
      await setApplicationNotes({ applicationId: item.id, notes });
    });
  };

  const handleDeadline = (value: string) => {
    const next = value === "" ? null : value;
    const prev = item;
    onChange({ ...item, deadline_at: next });
    startTransition(async () => {
      const res = await setApplicationDeadline({
        applicationId: item.id,
        deadline: next,
      });
      if (!res.ok) onChange(prev);
    });
  };

  const handleRemove = () => {
    if (!window.confirm(`Remove "${item.program.name}" from your tracker?`)) {
      return;
    }
    onRemove(item.id);
    startTransition(async () => {
      await removeApplication({ applicationId: item.id });
    });
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.21, 0.6, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        "group rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(13,148,136,0.25)] sm:p-5",
        pending && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 text-sm font-semibold text-teal-700 ring-1 ring-teal-100"
          aria-hidden
        >
          {logoInitials(u.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Link
              href={`/programs/${u.slug}/${item.program.slug}`}
              className="text-base font-semibold leading-snug tracking-tight text-slate-900 transition-colors hover:text-teal-700"
            >
              {item.program.name}
            </Link>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-sm text-slate-600">{u.name}</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {u.city}, {COUNTRY_NAMES[u.country] || u.country} · {item.program.degree}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={item.status} />
            {taskTotal > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                  taskDone === taskTotal
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-teal-50 text-teal-700 ring-teal-200",
                )}
                title={`${taskDone} of ${taskTotal} task${taskTotal === 1 ? "" : "s"} done`}
              >
                {taskDone === taskTotal ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <ListChecks className="size-3" />
                )}
                {taskDone} / {taskTotal}{" "}
                {taskTotal === 1 ? "task" : "tasks"}
              </span>
            )}
            {effectiveDeadline && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200",
                  days != null && days <= 14 && days >= 0 &&
                    "bg-amber-50 text-amber-700 ring-amber-200",
                  days != null && days < 0 &&
                    "bg-rose-50 text-rose-700 ring-rose-200",
                )}
              >
                <CalendarDays className="size-3" />
                {days != null && days >= 0
                  ? `${formatDeadline(effectiveDeadline)} · in ${days}d`
                  : days != null
                  ? `${formatDeadline(effectiveDeadline)} · passed`
                  : formatDeadline(effectiveDeadline)}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-600">
            <span className="font-medium text-slate-800">Next:</span>{" "}
            {nextStepFor(item.status, Boolean(item.notes?.trim()))}
          </p>
        </div>

        <div className="hidden flex-col items-end gap-2 sm:flex">
          <Button asChild size="sm" variant="default">
            <Link href={`/programs/${u.slug}/${item.program.slug}`}>Open</Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-expanded={open}
          >
            {open ? "Hide" : "Edit"}
            <ChevronDown
              className={cn("size-3 transition-transform", open && "rotate-180")}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="sm:hidden inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50"
          aria-label="More"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3"
        >
          <label className="block">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              value={item.status}
              onChange={(e) => handleStatus(e.target.value as ApplicationStatus)}
              disabled={pending}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            >
              {ALL_APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {APPLICATION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Your deadline
              {item.program.application_deadline && (
                <span className="ml-1 text-[10px] font-normal text-slate-400">
                  (program: {formatDeadline(item.program.application_deadline)})
                </span>
              )}
            </span>
            <input
              type="date"
              value={item.deadline_at ?? ""}
              onChange={(e) => handleDeadline(e.target.value)}
              disabled={pending}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <label className="block sm:col-span-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              rows={2}
              maxLength={2000}
              placeholder="Documents, recommenders, blockers…"
              className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <div className="flex items-center justify-between sm:col-span-3">
            {u.website ? (
              <a
                href={u.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
              >
                Official site
                <ExternalLink className="size-3" />
              </a>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={handleRemove}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <Trash2 className="size-3" />
              Remove
            </button>
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}
