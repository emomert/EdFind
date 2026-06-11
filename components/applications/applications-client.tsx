"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { getOrCreateClientId } from "@/lib/quiz/client-id";
import { resetAllProgress } from "@/app/applications/actions";

import { StudentProgressCard } from "./student-progress-card";
import { DeadlineStrip } from "./deadline-strip";
import { ApplicationsOverview } from "./applications-overview";
import { KanbanBoard } from "./kanban-board";
import { DocumentStudio } from "./document-studio";
import type {
  ApplicationItem,
  DocumentItem,
  ProfileSummary,
  TaskItem,
} from "./types";

export type { ApplicationItem } from "./types";

export function ApplicationsClient({
  email,
  displayName,
  items: initialApps,
  tasks: initialTasks,
  documents: initialDocuments,
  profile,
}: {
  email: string | null | undefined;
  displayName: string | null | undefined;
  items: ApplicationItem[];
  tasks: TaskItem[];
  documents: DocumentItem[];
  profile: ProfileSummary;
}) {
  const [items, setItems] = useState<ApplicationItem[]>(initialApps);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.21, 0.6, 0.3, 1] }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"
    >
      <StudentProgressCard
        email={email}
        displayName={displayName}
        applications={items}
        profile={profile}
      />

      <DeadlineStrip items={items} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
        className="mt-6"
      >
        <ApplicationsOverview items={items} tasks={tasks} setItems={setItems} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
        className="mt-8"
      >
        <KanbanBoard tasks={tasks} setTasks={setTasks} applications={items} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.45 }}
        className="mt-8"
      >
        <DocumentStudio
          documents={documents}
          applications={items}
          setDocuments={setDocuments}
          hasProfile={profile.hasProfile}
        />
      </motion.div>

      <details className="mt-10 flex justify-end text-right">
        <summary className="inline-flex cursor-pointer list-none items-center text-xs text-muted-foreground/70 transition-colors hover:text-muted-foreground [&::-webkit-details-marker]:hidden">
          Testing tools
        </summary>
        <div className="mt-2">
          <ResetButton />
        </div>
      </details>
    </motion.div>
  );
}

function ResetButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const handleClick = () => {
    const confirmed = window.confirm(
      "Reset all progress?\n\nThis wipes your quiz answers, matches, shortlist, AND every tracked application and task for this account. It cannot be undone.",
    );
    if (!confirmed) return;

    const clientId = getOrCreateClientId();
    startTransition(async () => {
      const res = await resetAllProgress({ clientId });
      if (res.ok) {
        setDone(true);
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
        "inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100",
        (pending || done) && "opacity-70",
      )}
      title="Wipe quiz answers, matches, shortlist, applications, and tasks"
    >
      <AlertTriangle className="size-3.5" />
      {done ? "Reset" : "Reset all progress (testing)"}
    </button>
  );
}
