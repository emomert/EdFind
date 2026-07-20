"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileText,
  GraduationCap,
  Languages,
  Banknote,
  PenLine,
  ClipboardList,
  CircleDashed,
  Trash2,
  Check,
  Unlink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import {
  deleteTask,
  moveTask,
  updateTask,
  type TaskCategory,
  type TaskStatus,
} from "@/app/applications/actions";
import { type ApplicationItem, type TaskItem } from "./types";

const CATEGORY_ICON: Record<TaskCategory, React.ReactNode> = {
  documents: <FileText className="size-3.5" />,
  language_test: <Languages className="size-3.5" />,
  finance: <Banknote className="size-3.5" />,
  writing: <PenLine className="size-3.5" />,
  admin: <ClipboardList className="size-3.5" />,
  other: <CircleDashed className="size-3.5" />,
};

const CATEGORY_TONE: Record<TaskCategory, string> = {
  documents: "bg-sky-50 text-sky-700 ring-sky-200",
  language_test: "bg-violet-50 text-violet-700 ring-violet-200",
  finance: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  writing: "bg-amber-50 text-amber-700 ring-amber-200",
  admin: "bg-slate-100 text-slate-700 ring-slate-200",
  other: "bg-slate-50 text-slate-600 ring-slate-200",
};

export function TaskCard({
  task,
  application,
  onChange,
  onRemove,
}: {
  task: TaskItem;
  application: ApplicationItem | null;
  onChange: (next: TaskItem) => void;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("applications.task");
  const tCategory = useTranslations("applications.taskCategory");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingDue, setEditingDue] = useState(false);
  const [dragging, setDragging] = useState(false);

  const setDue = (value: string) => {
    const next = value === "" ? null : value;
    const prev = task;
    onChange({ ...task, due_at: next });
    setEditingDue(false);
    startTransition(async () => {
      const res = await updateTask({ id: task.id, dueAt: next });
      if (!res.ok) onChange(prev);
    });
  };

  const move = (to: TaskStatus) => {
    const prev = task;
    onChange({ ...task, status: to });
    startTransition(async () => {
      const res = await moveTask({ id: task.id, status: to });
      if (!res.ok) onChange(prev);
    });
  };

  const unlinkApp = () => {
    const prev = task;
    onChange({ ...task, application_id: null });
    startTransition(async () => {
      const res = await updateTask({ id: task.id, applicationId: null });
      if (!res.ok) onChange(prev);
    });
  };

  const remove = () => {
    onRemove(task.id);
    startTransition(async () => {
      await deleteTask({ id: task.id });
    });
  };

  const prevColumn: TaskStatus | null =
    task.status === "doing" ? "todo" : task.status === "done" ? "doing" : null;
  const nextColumn: TaskStatus | null =
    task.status === "todo" ? "doing" : task.status === "doing" ? "done" : null;

  const due = task.due_at;
  const daysToDue =
    due == null
      ? null
      : Math.round(
          (new Date(due).getTime() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) /
            (24 * 60 * 60 * 1000),
        );

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ duration: 0.3, ease: [0.21, 0.6, 0.3, 1] }}
      whileHover={{ y: -1 }}
      className={cn(
        "group rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_8px_24px_-14px_rgba(13,148,136,0.3)]",
        task.status === "done" && "bg-slate-50/60",
        pending && "opacity-60",
        // While dragging, dim the source card and outline it so it's obvious
        // which card is in flight and where it came from.
        dragging && "opacity-40 outline-dashed outline-2 outline-teal-400",
      )}
    >
      {/* HTML5 drag lives on a plain div: framer-motion swallows onDragStart
          on motion.* elements (it's reserved for its own drag gesture), so the
          native event must attach to a non-motion node. */}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/task-id", task.id);
          e.dataTransfer.effectAllowed = "move";
          // The browser's default drag ghost is a ~50%-transparent snapshot of
          // the card — a white card on a white page is invisible. Hand it a
          // high-contrast clone instead: solid background, primary border, and
          // a strong shadow, removed again right after the snapshot is taken.
          const node = e.currentTarget;
          const ghost = node.cloneNode(true) as HTMLElement;
          ghost.style.position = "fixed";
          ghost.style.top = "-2000px";
          ghost.style.left = "-2000px";
          ghost.style.width = `${node.offsetWidth}px`;
          ghost.style.boxSizing = "border-box";
          ghost.style.borderRadius = "12px";
          ghost.style.border = "2px solid #0891b2"; // --primary (cyan-600)
          ghost.style.backgroundColor = "#ffffff";
          ghost.style.boxShadow = "0 16px 40px rgba(8, 145, 178, 0.45)";
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 24, 24);
          requestAnimationFrame(() => ghost.remove());
          setDragging(true);
        }}
        onDragEnd={() => setDragging(false)}
        className="cursor-grab p-3 active:cursor-grabbing"
      >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
            CATEGORY_TONE[task.category],
          )}
        >
          {CATEGORY_ICON[task.category]}
          {tCategory(task.category)}
        </span>
      </div>

      <p
        className={cn(
          "mt-2 text-sm font-medium leading-snug text-slate-800",
          task.status === "done" && "text-slate-500 line-through",
        )}
      >
        {task.title}
      </p>

      {application && (
        <motion.div
          layout
          className="mt-2 flex items-center gap-1.5 rounded-md bg-teal-50/70 px-2 py-1 text-[11px] text-teal-800 ring-1 ring-inset ring-teal-100"
        >
          <GraduationCap className="size-3 text-teal-600" />
          <span className="min-w-0 flex-1 truncate" title={application.program.name}>
            <span className="font-medium">{application.program.name}</span>
            <span className="ml-1 text-teal-600/80">
              · {application.program.university.name}
            </span>
          </span>
          <button
            type="button"
            onClick={unlinkApp}
            disabled={pending}
            className="-mr-0.5 inline-flex size-4 items-center justify-center rounded text-teal-700/70 opacity-0 transition-opacity hover:bg-teal-100 hover:text-teal-900 group-hover:opacity-100"
            aria-label={t("unlinkAriaLabel")}
            title={t("unlinkAriaLabel")}
          >
            <Unlink className="size-3" />
          </button>
        </motion.div>
      )}

      {editingDue ? (
        <input
          type="date"
          autoFocus
          defaultValue={due ?? ""}
          onChange={(e) => setDue(e.target.value)}
          onBlur={() => setEditingDue(false)}
          onKeyDown={(e) => e.key === "Escape" && setEditingDue(false)}
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          aria-label={t("dueDateAriaLabel")}
        />
      ) : due ? (
        <button
          type="button"
          onClick={() => setEditingDue(true)}
          title={t("changeDueDate")}
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded text-[11px] text-slate-500 transition-colors hover:text-slate-700",
            daysToDue != null && daysToDue <= 7 && daysToDue >= 0 && "text-amber-700 hover:text-amber-800",
            daysToDue != null && daysToDue < 0 && "text-rose-700 hover:text-rose-800",
          )}
        >
          <CalendarDays className="size-3" />
          {new Date(due).toLocaleDateString(
            locale === "tr" ? "tr-TR" : "en-GB",
            { day: "numeric", month: "short" },
          )}
          {daysToDue != null && daysToDue >= 0 && ` · ${t("dueInDays", { days: daysToDue })}`}
          {daysToDue != null && daysToDue < 0 && ` · ${t("overdue")}`}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditingDue(true)}
          className="mt-2 inline-flex items-center gap-1 rounded text-[11px] text-slate-400 opacity-0 transition-opacity hover:text-slate-600 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <CalendarDays className="size-3" />
          {t("addDueDate")}
        </button>
      )}

      <div className="mt-3 flex items-center justify-between gap-1 border-t border-slate-100 pt-2 opacity-80 transition-opacity group-hover:opacity-100">
        <div className="flex gap-1">
          {prevColumn && (
            <button
              type="button"
              onClick={() => move(prevColumn)}
              disabled={pending}
              className="inline-flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label={t("moveLeft")}
              title={t("moveLeft")}
            >
              <ArrowLeft className="size-3.5" />
            </button>
          )}
          {nextColumn && (
            <button
              type="button"
              onClick={() => move(nextColumn)}
              disabled={pending}
              className="inline-flex size-7 items-center justify-center rounded-md text-teal-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
              aria-label={t("moveRight")}
              title={t("moveRight")}
            >
              {nextColumn === "done" ? (
                <Check className="size-3.5" />
              ) : (
                <ArrowRight className="size-3.5" />
              )}
            </button>
          )}
        </div>
        {confirmingDelete ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={pending}
              className="rounded-md px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100"
            >
              {t("delete")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={pending}
            className="inline-flex size-7 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
            aria-label={t("deleteAriaLabel")}
            title={t("deleteAriaLabel")}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      </div>
    </motion.article>
  );
}
