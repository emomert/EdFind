"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CalendarPlus } from "lucide-react";

import { toggleTrackedApplication } from "@/app/applications/actions";
import { getOrCreateClientId } from "@/lib/quiz/client-id";
import { cn } from "@/lib/utils";

type Props = {
  programId: string;
  initiallyTracked: boolean;
  className?: string;
};

export function TrackButton({
  programId,
  initiallyTracked,
  className,
}: Props) {
  const router = useRouter();
  const [tracked, setTracked] = useState(initiallyTracked);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const optimistic = !tracked;
    setTracked(optimistic);
    setError(null);
    const clientId = getOrCreateClientId();
    startTransition(async () => {
      const result = await toggleTrackedApplication({ programId, clientId });
      if (!result.ok) {
        setTracked(!optimistic);
        if (result.needsAuth) {
          const next =
            typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : "/";
          router.push(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setError(result.error);
        return;
      }
      setTracked(result.tracked);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={tracked}
      title={error ?? undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        tracked
          ? "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
          : "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted",
        pending && "opacity-70",
        className,
      )}
    >
      {tracked ? (
        <CalendarCheck className="size-4" />
      ) : (
        <CalendarPlus className="size-4" />
      )}
      {tracked ? "Tracking application" : "Track this application"}
    </button>
  );
}
