import "server-only";

import { TOTAL_STEPS } from "@/lib/quiz/schema";
import type { ApplicationStatus, TaskStatus } from "@/app/applications/actions";

export type RecommendationTone = "celebrate" | "nudge" | "info" | "warn";

export type Recommendation = {
  id: string;
  tone: RecommendationTone;
  icon: "sparkles" | "calendar" | "trophy" | "compass" | "rocket" | "heart" | "lightbulb";
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

type AppRow = {
  status: ApplicationStatus;
  deadline_at: string | null;
  program: {
    application_deadline: string | null;
    name: string;
    university: { name: string; country: string };
  };
};

type TaskRow = {
  status: TaskStatus;
  category: string;
  title: string;
};

type ProfileLite = {
  destinations: string[];
  field_of_study: string | null;
} | null;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / DAY_MS);
}

function effectiveDeadline(app: AppRow): string | null {
  return app.deadline_at ?? app.program.application_deadline ?? null;
}

export function buildRecommendations(args: {
  apps: AppRow[];
  tasks: TaskRow[];
  profile: ProfileLite;
}): Recommendation[] {
  const { apps, tasks, profile } = args;
  const recs: Recommendation[] = [];

  const submitted = apps.filter((a) =>
    ["submitted", "accepted", "waitlisted", "rejected"].includes(a.status),
  ).length;
  const accepted = apps.filter((a) => a.status === "accepted").length;
  const interestedOnly = apps.filter((a) => a.status === "interested").length;

  const upcoming = apps
    .map((a) => ({ app: a, days: daysUntil(effectiveDeadline(a)) }))
    .filter((x) => x.days !== null && x.days >= 0 && x.days <= 30)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));

  if (accepted > 0) {
    recs.push({
      id: "accepted",
      tone: "celebrate",
      icon: "trophy",
      title:
        accepted === 1
          ? "You've got an acceptance — congratulations!"
          : `${accepted} acceptances and counting.`,
      body:
        "That's a real win. If you're still weighing options, compare programs side-by-side to make the final call.",
      cta: { label: "Compare programs", href: "/compare" },
    });
  }

  if (upcoming.length > 0) {
    const next = upcoming[0];
    const moreCount = upcoming.length - 1;
    recs.push({
      id: "deadline",
      tone: next.days! <= 7 ? "warn" : "nudge",
      icon: "calendar",
      title:
        next.days === 0
          ? `${next.app.program.name} is due today.`
          : `${next.app.program.name} closes in ${next.days} day${next.days === 1 ? "" : "s"}.`,
      body:
        moreCount > 0
          ? `Plus ${moreCount} more deadline${moreCount === 1 ? "" : "s"} in the next 30 days. Block off time this week for application packets.`
          : "Move it to Drafting on the board and clear any open tasks for it first.",
    });
  }

  if (apps.length === 0) {
    recs.push({
      id: "empty",
      tone: "info",
      icon: "compass",
      title: "Start tracking programs you're considering.",
      body: profile?.destinations.length
        ? "Take the quiz again or browse universities to find programs that fit your destinations and field."
        : `The ${TOTAL_STEPS}-question quiz takes about two minutes and gives you AI-ranked matches.`,
      cta: profile
        ? { label: "Find programs", href: "/quiz" }
        : { label: "Take the quiz", href: "/quiz" },
    });
  } else if (apps.length > 0 && interestedOnly === apps.length) {
    recs.push({
      id: "kickoff",
      tone: "nudge",
      icon: "rocket",
      title: "Pick your top 3 and start drafting.",
      body:
        "Every program in your tracker is still in 'Interested'. Choose the three you're most excited about and move them to Drafting — momentum compounds.",
    });
  }

  const hasLanguageTask = tasks.some(
    (t) => t.category === "language_test" && t.status === "done",
  );
  const hasLanguageInProgress = tasks.some(
    (t) => t.category === "language_test" && t.status !== "done",
  );
  if (apps.length > 0 && !hasLanguageTask && !hasLanguageInProgress) {
    recs.push({
      id: "language-test",
      tone: "info",
      icon: "lightbulb",
      title: "Book a language test early.",
      body:
        "IELTS, TOEFL, and Cambridge slots fill up months in advance — and most European master's want the certificate at submission. Add it as a task so it doesn't slip.",
    });
  }

  if (submitted >= 3 && accepted === 0) {
    recs.push({
      id: "waiting",
      tone: "info",
      icon: "heart",
      title: "You've submitted to several programs — well done.",
      body:
        "Decisions take time. While you wait, polish your motivation letter or prepare for possible interviews; the work compounds.",
    });
  }

  if (apps.length >= 1 && tasks.length === 0) {
    recs.push({
      id: "no-tasks",
      tone: "nudge",
      icon: "sparkles",
      title: "Break the work into small tasks.",
      body:
        "Add tasks like 'Upload transcript' or 'Write motivation letter' to the board. Visible progress is the easiest way to stay motivated.",
    });
  }

  // Always include one encouraging closer if we have nothing warning-toned.
  if (recs.every((r) => r.tone !== "warn")) {
    recs.push({
      id: "encouragement",
      tone: "celebrate",
      icon: "heart",
      title: profile?.destinations.length
        ? "You're closer than you think."
        : "One step at a time.",
      body:
        "Most students who finish their applications started feeling overwhelmed too. Tiny consistent steps win this.",
    });
  }

  return recs.slice(0, 4);
}
