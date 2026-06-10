"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, SlidersHorizontal, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  createTask,
  moveTask,
  type TaskCategory,
  type TaskStatus,
} from "@/app/applications/actions";
import { TaskCard } from "./task-card";
import {
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
  type ApplicationItem,
  type TaskItem,
} from "./types";

const COLUMNS: ReadonlyArray<{
  key: TaskStatus;
  accent: string;
  tint: string;
  countBg: string;
}> = [
  {
    key: "todo",
    accent: "from-slate-100/80 to-slate-50",
    tint: "ring-slate-200",
    countBg: "bg-slate-100 text-slate-700",
  },
  {
    key: "doing",
    accent: "from-teal-50 to-emerald-50",
    tint: "ring-teal-200",
    countBg: "bg-teal-100 text-teal-700",
  },
  {
    key: "done",
    accent: "from-emerald-50/60 to-white",
    tint: "ring-emerald-200/80",
    countBg: "bg-emerald-100 text-emerald-700",
  },
];

const SUGGESTIONS: ReadonlyArray<{ title: string; category: TaskCategory }> = [
  { title: "Upload transcript", category: "documents" },
  { title: "Write motivation letter", category: "writing" },
  { title: "Book IELTS / TOEFL slot", category: "language_test" },
  { title: "Request recommendation letter", category: "documents" },
  { title: "Pay application fee", category: "finance" },
  { title: "Submit application portal", category: "admin" },
];

type AppFilter = "all" | "unassigned" | string;

export function KanbanBoard({
  tasks,
  setTasks,
  applications,
}: {
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  applications: ApplicationItem[];
}) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<{
    title: string;
    category: TaskCategory;
    applicationId: string | null;
    dueAt: string | null;
  } | null>(null);
  const [appFilter, setAppFilter] = useState<AppFilter>("all");

  const appsById = useMemo(() => {
    const m: Record<string, ApplicationItem> = {};
    for (const a of applications) m[a.id] = a;
    return m;
  }, [applications]);

  const visibleTasks = useMemo(() => {
    if (appFilter === "all") return tasks;
    if (appFilter === "unassigned")
      return tasks.filter((t) => !t.application_id);
    return tasks.filter((t) => t.application_id === appFilter);
  }, [tasks, appFilter]);

  const addTask = (
    title: string,
    category: TaskCategory,
    applicationId: string | null,
    status: TaskStatus = "todo",
    dueAt: string | null = null,
  ) => {
    const t = title.trim();
    if (!t) return;
    const optimistic: TaskItem = {
      id: `optimistic-${Math.random().toString(36).slice(2)}`,
      title: t,
      category,
      status,
      due_at: dueAt,
      application_id: applicationId,
      sort_order: Number.MAX_SAFE_INTEGER,
    };
    setTasks((prev) => [...prev, optimistic]);
    setDraft(null);
    startTransition(async () => {
      const res = await createTask({
        title: t,
        category,
        status,
        dueAt,
        applicationId: applicationId ?? null,
      });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === optimistic.id
            ? res.ok
              ? { ...task, id: res.id }
              : task
            : task,
        ),
      );
    });
  };

  // Shared by the cards' arrow buttons (via TaskCard) and column drag-drop:
  // optimistic move with rollback on failure.
  const moveTaskTo = (taskId: string, to: TaskStatus) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === to) return;
    const prev = current;
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? { ...t, status: to } : t)),
    );
    startTransition(async () => {
      const res = await moveTask({ id: taskId, status: to });
      if (!res.ok) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === taskId ? prev : t)),
        );
      }
    });
  };

  const buckets = COLUMNS.map((col) => ({
    col,
    items: visibleTasks
      .filter((t) => t.status === col.key)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Your task board
          </h2>
          <p className="text-sm text-muted-foreground">
            Small steps, one at a time. Drag cards between columns (or use the
            arrows), and link tasks to a program when it helps.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setDraft({
              title: "",
              category: "other",
              applicationId:
                appFilter === "unassigned" || appFilter === "all"
                  ? null
                  : appFilter,
              dueAt: null,
            })
          }
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="size-4" />
          New task
        </button>
      </header>

      {applications.length > 0 && (
        <AppFilterStrip
          applications={applications}
          tasks={tasks}
          value={appFilter}
          onChange={setAppFilter}
        />
      )}

      {tasks.length === 0 && !draft && (
        <SuggestionStrip
          onAdd={(title, category) =>
            addTask(
              title,
              category,
              appFilter !== "all" && appFilter !== "unassigned"
                ? appFilter
                : null,
            )
          }
        />
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {buckets.map(({ col, items }) => (
          <KanbanColumn
            key={col.key}
            label={TASK_STATUS_LABELS[col.key]}
            accent={col.accent}
            tint={col.tint}
            countBg={col.countBg}
            count={items.length}
            isDoneColumn={col.key === "done"}
            onDropTask={(taskId) => moveTaskTo(taskId, col.key)}
          >
            {col.key === "todo" && draft && (
              <DraftTaskCard
                draft={draft}
                setDraft={setDraft}
                applications={applications}
                onCommit={(title, category, appId, dueAt) =>
                  addTask(title, category, appId, "todo", dueAt)
                }
                onCancel={() => setDraft(null)}
              />
            )}
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  application={
                    task.application_id ? appsById[task.application_id] : null
                  }
                  onChange={(next) =>
                    setTasks((prev) =>
                      prev.map((t) => (t.id === next.id ? next : t)),
                    )
                  }
                  onRemove={(id) =>
                    setTasks((prev) => prev.filter((t) => t.id !== id))
                  }
                />
              ))}
            </AnimatePresence>
            {col.key !== "todo" && items.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs italic text-slate-400">
                Nothing here yet.
              </p>
            )}
          </KanbanColumn>
        ))}
      </div>
    </section>
  );
}

function AppFilterStrip({
  applications,
  tasks,
  value,
  onChange,
}: {
  applications: ApplicationItem[];
  tasks: TaskItem[];
  value: AppFilter;
  onChange: (v: AppFilter) => void;
}) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: tasks.length,
      unassigned: tasks.filter((t) => !t.application_id).length,
    };
    for (const a of applications) {
      c[a.id] = tasks.filter((t) => t.application_id === a.id).length;
    }
    return c;
  }, [tasks, applications]);

  const chips: Array<{ key: AppFilter; label: string; subtle?: boolean }> = [
    { key: "all", label: "All tasks" },
    { key: "unassigned", label: "Unassigned", subtle: true },
    ...applications.map((a) => ({ key: a.id, label: a.program.name })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2"
    >
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500">
        <SlidersHorizontal className="size-3.5" />
        Show:
      </span>
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {chips.map((chip) => {
          const active = value === chip.key;
          const count = counts[chip.key] ?? 0;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange(chip.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                active
                  ? "border-teal-300 bg-teal-50 text-teal-800 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800",
                chip.subtle && !active && "text-slate-500",
              )}
            >
              <span className="max-w-[18ch] truncate">{chip.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    active
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function KanbanColumn({
  label,
  accent,
  tint,
  countBg,
  count,
  isDoneColumn,
  onDropTask,
  children,
}: {
  label: string;
  accent: string;
  tint: string;
  countBg: string;
  count: number;
  isDoneColumn: boolean;
  onDropTask: (taskId: string) => void;
  children: React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.6, 0.3, 1] }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("text/task-id")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const taskId = e.dataTransfer.getData("text/task-id");
        if (taskId) onDropTask(taskId);
      }}
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl bg-gradient-to-b p-3.5 ring-1 ring-inset transition-shadow",
        accent,
        tint,
        dragOver && "ring-2 ring-teal-400 shadow-[0_0_0_4px_rgba(8,145,178,0.08)]",
      )}
    >
      <header className="flex items-baseline justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label}
        </h3>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            countBg,
          )}
        >
          {count}
        </span>
      </header>
      {isDoneColumn && count > 0 && (
        <p className="flex items-center gap-1 px-1 text-[11px] text-emerald-700">
          <Sparkles className="size-3" />
          Nice work — momentum compounds.
        </p>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </motion.section>
  );
}

type Draft = {
  title: string;
  category: TaskCategory;
  applicationId: string | null;
  dueAt: string | null;
};

function DraftTaskCard({
  draft,
  setDraft,
  applications,
  onCommit,
  onCancel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  applications: ApplicationItem[];
  onCommit: (
    title: string,
    category: TaskCategory,
    applicationId: string | null,
    dueAt: string | null,
  ) => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border border-teal-200 bg-white p-3 shadow-sm"
    >
      <input
        autoFocus
        type="text"
        value={draft.title}
        maxLength={200}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit(draft.title, draft.category, draft.applicationId, draft.dueAt);
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        placeholder="What needs to get done?"
        className="w-full bg-transparent text-sm font-medium leading-snug text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />

      <div className="mt-2 grid grid-cols-1 gap-1.5">
        <select
          value={draft.applicationId ?? ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              applicationId: e.target.value === "" ? null : e.target.value,
            })
          }
          className="w-full rounded-md bg-slate-50 px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
        >
          <option value="">No program (general task)</option>
          {applications.map((a) => (
            <option key={a.id} value={a.id}>
              ↳ {a.program.name} · {a.program.university.name}
            </option>
          ))}
        </select>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  category: e.target.value as TaskCategory,
                })
              }
              className="rounded-md bg-slate-50 px-1.5 py-1 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
            >
              {(Object.keys(TASK_CATEGORY_LABELS) as TaskCategory[]).map((c) => (
                <option key={c} value={c}>
                  {TASK_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={draft.dueAt ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  dueAt: e.target.value === "" ? null : e.target.value,
                })
              }
              className="rounded-md bg-slate-50 px-1.5 py-1 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
              aria-label="Due date (optional)"
              title="Due date (optional)"
            />
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                onCommit(draft.title, draft.category, draft.applicationId, draft.dueAt)
              }
              disabled={!draft.title.trim()}
              className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SuggestionStrip({
  onAdd,
}: {
  onAdd: (title: string, category: TaskCategory) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl bg-gradient-to-br from-teal-50 to-white p-4 ring-1 ring-teal-100"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
        Quick start
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Most application journeys start with the same handful of tasks. Tap to add.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => onAdd(s.title, s.category)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-teal-50 hover:text-teal-700 hover:ring-teal-200"
          >
            + {s.title}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
