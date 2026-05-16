"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkerCheck, MarkerSparkles } from "@/components/decor/marker";

type Stage = {
  label: string;
  durationMs: number;
};

const STAGES: Stage[] = [
  { label: "Reading your preferences", durationMs: 700 },
  { label: "Searching the European master's catalog", durationMs: 900 },
  { label: "Asking the AI matcher to rank your top 3", durationMs: 1200 },
];

type Props = {
  onComplete: () => void;
};

export function QuizLoadingScreen({ onComplete }: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const advance = (index: number) => {
      if (cancelled) return;
      if (index >= STAGES.length) {
        onComplete();
        return;
      }
      setStageIndex(index);
      timeoutId = setTimeout(() => advance(index + 1), STAGES[index].durationMs);
    };

    advance(0);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onComplete]);

  return (
    <div
      className="relative mx-auto flex max-w-md flex-col items-center text-center"
      role="status"
      aria-live="polite"
    >
      <MarkerSparkles
        aria-hidden
        className="absolute -left-6 -top-6 size-10 text-primary/30"
      />
      <MarkerSparkles
        aria-hidden
        className="absolute -right-4 top-2 size-8 -scale-x-100 text-primary/25"
      />
      <Loader2 className="size-12 animate-spin text-primary" aria-hidden="true" />
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">
        Matching you to programs…
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Our AI is comparing your answers against every program in the catalog.
        This usually takes about 2 seconds.
      </p>

      <ol className="mt-8 w-full space-y-3 text-left">
        {STAGES.map((stage, index) => {
          const status =
            index < stageIndex ? "done" : index === stageIndex ? "active" : "pending";
          return (
            <li
              key={stage.label}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                status === "done" && "border-primary/30 bg-secondary/40 text-foreground",
                status === "active" && "border-primary bg-secondary/60 text-foreground",
                status === "pending" && "border-border text-muted-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  status === "done" && "bg-primary/15 text-primary",
                  status === "active" && "bg-primary/15 text-primary",
                  status === "pending" && "bg-muted text-muted-foreground",
                )}
              >
                {status === "done" ? (
                  reduce ? (
                    <MarkerCheck className="size-4" />
                  ) : (
                    <motion.span
                      key={`done-${index}`}
                      initial={{ pathLength: 0, opacity: 0.4 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="block size-4"
                    >
                      <MarkerCheck className="size-4" />
                    </motion.span>
                  )
                ) : status === "active" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <span className="size-2 rounded-full bg-current" />
                )}
              </span>
              <span className="text-sm font-medium">{stage.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
