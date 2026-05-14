"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  createTask,
  type TaskCategory,
  type TaskStatus,
} from "@/app/applications/actions";
import { TaskCard } from "./task-card";
import {
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
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

export function KanbanBoard({
  tasks,
  setTasks,
}: {
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
}) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<{ title: string; category: TaskCategory } | null>(
    null,
  );

  const addTask = (title: string, category: TaskCategory, status: TaskStatus = "todo") => {
    const t = title.trim();
    if (!t) return;
    const optimistic: TaskItem = {
      id: `optimistic-${Math.random().toString(36).slice(2)}`,
      title: t,
      category,
      status,
      due_at: null,
      application_id: null,
      sort_order: Number.MAX_SAFE_INTEGER,
    };
    setTasks((prev) => [...prev, optimistic]);
    setDraft(null);
    startTransition(async () => {
      const res = await createTask({ title: t, category, status });
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

  const buckets = COLUMNS.map((col) => ({
    col,
    items: tasks
      .filter((t) => t.status === col.key)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Your task board
          </h2>
          <p className="text-sm text-slate-500">
            Small steps, one at a time. Move cards through the columns to feel the progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setDraft({ title: "", category: "other" })
          }
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
        >
          <Plus className="size-4" />
          New task
        </button>
      </header>

      {tasks.length === 0 && !draft && (
        <SuggestionStrip onAdd={addTask} />
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
          >
            {col.key === "todo" && draft && (
              <DraftTaskCard
                draft={draft}
                setDraft={setDraft}
                onCommit={(title, category) => addTask(title, category, "todo")}
                onCancel={() => setDraft(null)}
              />
            )}
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
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

function KanbanColumn({
  label,
  accent,
  tint,
  countBg,
  count,
  isDoneColumn,
  children,
}: {
  label: string;
  accent: string;
  tint: string;
  countBg: string;
  count: number;
  isDoneColumn: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.6, 0.3, 1] }}
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl bg-gradient-to-b p-3.5 ring-1 ring-inset",
        accent,
        tint,
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

function DraftTaskCard({
  draft,
  setDraft,
  onCommit,
  onCancel,
}: {
  draft: { title: string; category: TaskCategory };
  setDraft: (d: { title: string; category: TaskCategory }) => void;
  onCommit: (title: string, category: TaskCategory) => void;
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
            onCommit(draft.title, draft.category);
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        placeholder="What needs to get done?"
        className="w-full bg-transparent text-sm font-medium leading-snug text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <select
          value={draft.category}
          onChange={(e) =>
            setDraft({ ...draft, category: e.target.value as TaskCategory })
          }
          className="rounded-md bg-slate-50 px-1.5 py-1 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
        >
          {(Object.keys(TASK_CATEGORY_LABELS) as TaskCategory[]).map((c) => (
            <option key={c} value={c}>
              {TASK_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
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
            onClick={() => onCommit(draft.title, draft.category)}
            disabled={!draft.title.trim()}
            className="rounded-md bg-teal-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
          >
            Add
          </button>
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
