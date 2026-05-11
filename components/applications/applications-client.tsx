"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  ExternalLink,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOrCreateClientId } from "@/lib/quiz/client-id";
import {
  removeApplication,
  resetAllProgress,
  setApplicationDeadline,
  setApplicationNotes,
  setApplicationStatus,
  type ApplicationStatus,
} from "@/app/applications/actions";

export type ApplicationItem = {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  deadline_at: string | null;
  program_id: string;
  program: {
    slug: string;
    name: string;
    degree: string;
    application_deadline: string | null;
    university: {
      slug: string;
      name: string;
      country: string;
      city: string;
      website: string | null;
    };
  };
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: "Interested",
  drafting: "Drafting",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
  withdrawn: "Withdrawn",
};

type ColumnKey = "interested" | "drafting" | "submitted" | "decided";

const COLUMNS: ReadonlyArray<{ key: ColumnKey; label: string; tone: string }> =
  [
    {
      key: "interested",
      label: "Interested",
      tone: "border-slate-300 bg-slate-50",
    },
    {
      key: "drafting",
      label: "Drafting",
      tone: "border-amber-300 bg-amber-50",
    },
    {
      key: "submitted",
      label: "Submitted",
      tone: "border-blue-300 bg-blue-50",
    },
    {
      key: "decided",
      label: "Decision",
      tone: "border-emerald-300 bg-emerald-50",
    },
  ];

const ALL_STATUSES: ApplicationStatus[] = [
  "interested",
  "drafting",
  "submitted",
  "accepted",
  "rejected",
  "waitlisted",
  "withdrawn",
];

function columnForStatus(status: ApplicationStatus): ColumnKey {
  if (status === "interested") return "interested";
  if (status === "drafting") return "drafting";
  if (status === "submitted") return "submitted";
  return "decided";
}

export function ApplicationsClient({
  items: initial,
}: {
  items: ApplicationItem[];
}) {
  const [items, setItems] = useState<ApplicationItem[]>(initial);

  const buckets = COLUMNS.map((c) => ({
    column: c,
    items: items.filter((it) => columnForStatus(it.status) === c.key),
  }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your applications
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track every program you&apos;re working on. Move cards between
            columns to mirror your real-world progress.
          </p>
        </div>
        <ResetButton />
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {buckets.map(({ column, items }) => (
            <KanbanColumn
              key={column.key}
              label={column.label}
              tone={column.tone}
              count={items.length}
            >
              {items.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">
                  No applications here yet.
                </p>
              ) : (
                items.map((it) => (
                  <ApplicationCard
                    key={it.id}
                    item={it}
                    onChange={(next) =>
                      setItems((prev) =>
                        prev.map((p) => (p.id === next.id ? next : p)),
                      )
                    }
                    onRemove={(id) =>
                      setItems((prev) => prev.filter((p) => p.id !== id))
                    }
                  />
                ))
              )}
            </KanbanColumn>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <CalendarDays
        className="mx-auto size-10 text-muted-foreground"
        aria-hidden="true"
      />
      <h2 className="mt-4 text-lg font-semibold tracking-tight">
        Nothing being tracked yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Open any program detail page and hit &ldquo;Track this application&rdquo;.
        The program shows up here in the &ldquo;Interested&rdquo; column, and you
        can move it through your real-world application stages.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild>
          <Link href="/quiz">Find programs with the quiz</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shortlist">See your shortlist</Link>
        </Button>
      </div>
    </div>
  );
}

function KanbanColumn({
  label,
  tone,
  count,
  children,
}: {
  label: string;
  tone: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-2xl border-2 p-4 dark:bg-card",
        tone,
      )}
    >
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          {label}
        </h3>
        <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium text-foreground">
          {count}
        </span>
      </header>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function ApplicationCard({
  item,
  onChange,
  onRemove,
}: {
  item: ApplicationItem;
  onChange: (next: ApplicationItem) => void;
  onRemove: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(item.notes ?? "");
  const u = item.program.university;

  const handleStatus = (next: ApplicationStatus) => {
    onChange({ ...item, status: next });
    startTransition(async () => {
      const res = await setApplicationStatus({
        applicationId: item.id,
        status: next,
      });
      if (!res.ok) onChange(item); // revert
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
    onChange({ ...item, deadline_at: next });
    startTransition(async () => {
      const res = await setApplicationDeadline({
        applicationId: item.id,
        deadline: next,
      });
      if (!res.ok) onChange(item);
    });
  };

  const handleRemove = () => {
    if (
      !window.confirm(`Remove "${item.program.name}" from your tracker?`)
    ) {
      return;
    }
    onRemove(item.id);
    startTransition(async () => {
      await removeApplication({ applicationId: item.id });
    });
  };

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-background p-3 shadow-sm",
        pending && "opacity-70",
      )}
    >
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {u.city}, {u.country}
        </p>
        <Link
          href={`/programs/${u.slug}/${item.program.slug}`}
          className="mt-0.5 block text-sm font-semibold leading-snug tracking-tight transition-colors hover:text-primary"
        >
          {item.program.name}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">{u.name}</p>
      </div>

      <label className="block">
        <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Status
        </span>
        <select
          value={item.status}
          onChange={(e) => handleStatus(e.target.value as ApplicationStatus)}
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Your deadline
          {item.program.application_deadline ? (
            <span className="ml-1 text-[10px] font-normal text-muted-foreground/80">
              (program: {new Date(item.program.application_deadline)
                .toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              )
            </span>
          ) : null}
        </span>
        <input
          type="date"
          value={item.deadline_at ?? ""}
          onChange={(e) => handleDeadline(e.target.value)}
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
        />
      </label>

      <label className="block">
        <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Notes
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          rows={2}
          maxLength={2000}
          placeholder="Documents I still need, recommenders, blockers…"
          className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
        />
      </label>

      <div className="flex items-center justify-between border-t border-border pt-2">
        {u.website ? (
          <a
            href={u.website}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
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
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10"
          aria-label="Remove application"
        >
          <Trash2 className="size-3" />
          Remove
        </button>
      </div>
    </article>
  );
}

function ResetButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const handleClick = () => {
    const confirmed = window.confirm(
      "Reset all progress?\n\nThis wipes your quiz answers, matches, shortlist, AND every tracked application for this browser. It cannot be undone. Your anonymous identity stays the same so you can immediately re-take the quiz.",
    );
    if (!confirmed) return;

    const clientId = getOrCreateClientId();
    startTransition(async () => {
      const res = await resetAllProgress({ clientId });
      if (res.ok) {
        setDone(true);
        // Refresh so server-rendered pages re-fetch.
        if (typeof window !== "undefined") {
          window.location.assign("/applications");
        }
      } else {
        window.alert(res.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || done}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10",
        (pending || done) && "opacity-70",
      )}
      title="Wipe quiz answers, matches, shortlist, and applications for this browser"
    >
      <AlertTriangle className="size-3.5" />
      {done ? "Reset" : "Reset all progress (testing)"}
    </button>
  );
}
