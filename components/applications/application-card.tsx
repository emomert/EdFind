"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
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
import { UniversityLogo } from "@/components/university/university-logo";
import type { Locale } from "@/lib/i18n/config";
import { localizeCity, localizeCountry } from "@/lib/i18n/data-labels";
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
  COUNTRY_NAMES,
  type ApplicationItem,
} from "./types";

// The natural next stage per status, surfaced as a one-click button so the
// most common action (advancing an application) doesn't require opening the
// Edit panel. Terminal/waiting statuses have no advance.
const ADVANCE: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  interested: "drafting",
  drafting: "submitted",
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / (24 * 60 * 60 * 1000));
}

function formatDeadline(dateStr: string, locale: Locale): string {
  return new Date(dateStr).toLocaleDateString(
    locale === "tr" ? "tr-TR" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
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
  const t = useTranslations("applications");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? "");
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const u = item.program.university;

  const nextStepFor = (status: ApplicationStatus, hasNotes: boolean): string => {
    switch (status) {
      case "interested":
        return t("card.nextStep.interested");
      case "drafting":
        return hasNotes
          ? t("card.nextStep.draftingWithNotes")
          : t("card.nextStep.draftingNoNotes");
      case "submitted":
        return t("card.nextStep.submitted");
      case "waitlisted":
        return t("card.nextStep.waitlisted");
      case "accepted":
        return t("card.nextStep.accepted");
      case "rejected":
        return t("card.nextStep.rejected");
      case "withdrawn":
        return t("card.nextStep.withdrawn");
    }
  };

  // Close the status menu on any outside click.
  useEffect(() => {
    if (!statusMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!statusMenuRef.current?.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [statusMenuOpen]);
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
    if (
      !window.confirm(
        t("card.removeConfirm", { program: item.program.name }),
      )
    ) {
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
      id={`application-${item.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.21, 0.6, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        "group scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(13,148,136,0.25)] sm:p-5",
        pending && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <UniversityLogo
          name={u.name}
          slug={u.slug}
          logoUrl={u.logo_url}
          size="md"
        />
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
            {localizeCity(u.city, locale)},{" "}
            {localizeCountry(COUNTRY_NAMES[u.country] || u.country, locale)} ·{" "}
            {item.program.degree}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div ref={statusMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setStatusMenuOpen((o) => !o)}
                disabled={pending}
                aria-haspopup="menu"
                aria-expanded={statusMenuOpen}
                title={t("card.changeStatusTitle")}
                className="group/status inline-flex items-center rounded-full outline-none transition-transform focus-visible:ring-2 focus-visible:ring-teal-300 active:scale-95"
              >
                <StatusPill status={item.status} />
                <ChevronDown className="-ml-1 size-3 text-slate-400 transition-transform group-hover/status:text-slate-600" />
              </button>
              {statusMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-20 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
                >
                  {ALL_APPLICATION_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setStatusMenuOpen(false);
                        if (s !== item.status) handleStatus(s);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                        s === item.status
                          ? "bg-teal-50 text-teal-800"
                          : "text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {t(`status.${s}`)}
                      {s === item.status ? (
                        <CheckCircle2 className="size-3.5 text-teal-600" />
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {ADVANCE[item.status] ? (
              <button
                type="button"
                onClick={() => handleStatus(ADVANCE[item.status]!)}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
              >
                {t(`card.advance.${item.status}`)}
                <ArrowRight className="size-3" />
              </button>
            ) : null}
            {taskTotal > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                  taskDone === taskTotal
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-teal-50 text-teal-700 ring-teal-200",
                )}
                title={t("card.tasksTitle", { done: taskDone, total: taskTotal })}
              >
                {taskDone === taskTotal ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <ListChecks className="size-3" />
                )}
                {t("card.tasksBadge", { done: taskDone, total: taskTotal })}
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
                  ? t("card.deadlineInDays", {
                      date: formatDeadline(effectiveDeadline, locale),
                      days,
                    })
                  : days != null
                  ? t("card.deadlinePassed", {
                      date: formatDeadline(effectiveDeadline, locale),
                    })
                  : formatDeadline(effectiveDeadline, locale)}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{t("card.nextLabel")}</span>{" "}
            {nextStepFor(item.status, Boolean(item.notes?.trim()))}
          </p>
        </div>

        <div className="hidden flex-col items-end gap-2 sm:flex">
          <Button asChild size="sm" variant="default">
            <Link href={`/programs/${u.slug}/${item.program.slug}`}>{t("card.open")}</Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-expanded={open}
          >
            {open ? t("card.hide") : t("card.edit")}
            <ChevronDown
              className={cn("size-3 transition-transform", open && "rotate-180")}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="sm:hidden inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50"
          aria-label={t("card.moreAriaLabel")}
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
              {t("card.statusLabel")}
            </span>
            <select
              value={item.status}
              onChange={(e) => handleStatus(e.target.value as ApplicationStatus)}
              disabled={pending}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            >
              {ALL_APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {t("card.deadlineLabel")}
              {item.program.application_deadline && (
                <span className="ml-1 text-[10px] font-normal text-slate-400">
                  {t("card.deadlineProgramNote", {
                    date: formatDeadline(
                      item.program.application_deadline,
                      locale,
                    ),
                  })}
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
              {t("card.notesLabel")}
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              rows={2}
              maxLength={2000}
              placeholder={t("card.notesPlaceholder")}
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
                {t("card.officialSite")}
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
              {t("card.remove")}
            </button>
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}
