"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";

import { toggleSavedProgram } from "@/app/shortlist/actions";
import { getOrCreateClientId } from "@/lib/quiz/client-id";
import { cn } from "@/lib/utils";

type Props = {
  programId: string;
  initiallySaved: boolean;
  className?: string;
  variant?: "pill" | "icon";
  /**
   * Called after a successful toggle with the new saved state. The shortlist
   * page uses this to refresh so an unsaved card disappears immediately
   * instead of lingering until a manual reload.
   */
  onToggle?: (saved: boolean) => void;
};

export function SaveButton({
  programId,
  initiallySaved,
  className,
  variant = "pill",
  onToggle,
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = (event: React.MouseEvent) => {
    // Many programs are shown inside <Link> wrappers — stop the click from
    // bubbling so the user stays on the card.
    event.preventDefault();
    event.stopPropagation();
    const optimistic = !saved;
    setSaved(optimistic);
    setError(null);
    const clientId = getOrCreateClientId();
    startTransition(async () => {
      const result = await toggleSavedProgram({ programId, clientId });
      if (!result.ok) {
        setSaved(!optimistic);
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
      setSaved(result.saved);
      onToggle?.(result.saved);
    });
  };

  const label = saved ? "Saved" : "Save";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
        title={error ?? label}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full border transition-colors",
          saved
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
          pending && "opacity-70",
          className,
        )}
      >
        {saved ? (
          <BookmarkCheck className="size-4" />
        ) : (
          <Bookmark className="size-4" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
      title={error ?? undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        saved
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted",
        pending && "opacity-70",
        className,
      )}
    >
      {saved ? (
        <BookmarkCheck className="size-3.5" />
      ) : (
        <Bookmark className="size-3.5" />
      )}
      {label}
    </button>
  );
}
